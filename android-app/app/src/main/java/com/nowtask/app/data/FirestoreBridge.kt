package com.nowtask.app.data

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.webkit.WebView
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreSettings
import com.google.firebase.firestore.Source
import com.nowtask.app.data.local.AppDatabase
import com.nowtask.app.data.local.KeyValueEntity
import com.nowtask.app.data.local.SyncStatus
import com.nowtask.app.utils.isNetworkAvailable
import kotlinx.coroutines.*
import java.util.concurrent.ConcurrentHashMap

/**
 * 堅牢なFirestoreブリッジ実装（Room Database統合版）
 *
 * 機能:
 * - Room DatabaseとFirestoreの双方向同期
 * - 完全なオフライン対応
 * - 自動リトライ機能
 * - エラーハンドリングの改善
 * - データ同期キュー管理
 */
class FirestoreBridge(
    private val context: Context,
    private val webView: WebView,
    private val auth: FirebaseAuth
) {
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
    private val database: AppDatabase = AppDatabase.getInstance(context)
    private val dao = database.keyValueDao()
    private val dataCache = ConcurrentHashMap<String, String>()  // ConcurrentHashMapはnull値を許容しない
    private val syncQueue = ConcurrentHashMap<String, PendingOperation>()
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var currentUserId: String? = null  // 現在のユーザーIDを追跡

    companion object {
        private const val TAG = "FirestoreBridge"
        private const val MAX_RETRY_ATTEMPTS = 3
        private const val RETRY_DELAY_MS = 2000L
        private const val COLLECTION_NAME = "nowtask_data"
    }

    init {
        // Firestoreのオフライン永続化を有効化
        enableOfflinePersistence()
        // Room Databaseから保留中の同期を復元
        restorePendingSyncFromRoom()
    }

    /**
     * Room Databaseから保留中の同期を復元
     */
    private fun restorePendingSyncFromRoom() {
        scope.launch {
            try {
                val uid = auth.currentUser?.uid
                if (uid == null) {
                    android.util.Log.w(TAG, "No user ID, cannot restore pending sync")
                    return@launch
                }

                // 保留中の同期データを取得
                val pendingItems = dao.getPendingSync(uid)
                android.util.Log.d(TAG, "Restoring ${pendingItems.size} pending sync operations from Room")

                // syncQueueに追加
                pendingItems.forEach { entity ->
                    syncQueue[entity.key] = PendingOperation(
                        uid = entity.userId,
                        key = entity.key,
                        data = entity.value,
                        timestamp = entity.timestamp
                    )
                    // キャッシュにも追加
                    dataCache[entity.key] = entity.value
                    android.util.Log.d(TAG, "Restored pending sync for key: ${entity.key}")
                }

                // ネットワークが利用可能であれば、すぐに同期を試みる
                if (isNetworkAvailable(context) && pendingItems.isNotEmpty()) {
                    android.util.Log.d(TAG, "Network available, starting sync for ${pendingItems.size} items")
                    syncPendingData()
                }
            } catch (e: Exception) {
                android.util.Log.e(TAG, "Error restoring pending sync from Room", e)
            }
        }
    }

    /**
     * Firestoreのオフライン永続化を有効化
     */
    private fun enableOfflinePersistence() {
        try {
            val settings = FirebaseFirestoreSettings.Builder()
                .setPersistenceEnabled(true)
                .setCacheSizeBytes(FirebaseFirestoreSettings.CACHE_SIZE_UNLIMITED)
                .build()
            firestore.firestoreSettings = settings
            android.util.Log.d(TAG, "Firestore offline persistence enabled")
        } catch (e: Exception) {
            android.util.Log.w(TAG, "Firestore offline persistence already enabled or failed", e)
        }
    }

    /**
     * データをFirestoreに保存（リトライ機能付き）
     */
    @JavascriptInterface
    fun saveData(key: String, data: String) {
        val uid = auth.currentUser?.uid
        if (uid == null) {
            android.util.Log.e(TAG, "saveData: No user ID, cannot save data for key: $key")
            notifyJavaScript("onSaveError", key, "No user authenticated")
            return
        }

        // ユーザーが変わっていたらキャッシュをクリア
        checkAndClearCacheIfUserChanged(uid)

        android.util.Log.d(TAG, "Saving data for key: $key, UID: $uid, Data length: ${data.length}")

        // オフライン時は同期キューに追加し、Roomに保存
        if (!isNetworkAvailable(context)) {
            android.util.Log.w(TAG, "Device is offline. Adding to sync queue: $key")
            syncQueue[key] = PendingOperation(uid, key, data, System.currentTimeMillis())
            // ローカルキャッシュに保存
            dataCache[key] = data

            // Room Databaseに保存（PENDING状態）
            scope.launch {
                saveToRoom(uid, key, data, SyncStatus.PENDING)
            }

            notifyJavaScript("onSaveQueued", key, "Saved to local cache, will sync when online")
            return
        }

        // オンライン時は即座に保存（リトライ付き）
        scope.launch {
            saveDataWithRetry(uid, key, data, 0)
        }
    }

    /**
     * リトライ機能付きデータ保存
     */
    private suspend fun saveDataWithRetry(uid: String, key: String, data: String, attempt: Int) {
        try {
            val dataMap = hashMapOf(
                "data" to data,
                "timestamp" to System.currentTimeMillis(),
                "version" to 1
            )

            firestore.collection("users")
                .document(uid)
                .collection(COLLECTION_NAME)
                .document(key)
                .set(dataMap)
                .addOnSuccessListener {
                    android.util.Log.d(TAG, "Successfully saved data for key: $key")
                    dataCache[key] = data
                    syncQueue.remove(key) // 成功したらキューから削除

                    // Room Databaseにも保存（SYNCED状態）
                    scope.launch {
                        saveToRoom(uid, key, data, SyncStatus.SYNCED)
                    }

                    notifyJavaScript("onSaveSuccess", key, "Data saved successfully")
                }
                .addOnFailureListener { e ->
                    android.util.Log.e(TAG, "Failed to save data for key: $key (attempt ${attempt + 1})", e)

                    if (attempt < MAX_RETRY_ATTEMPTS) {
                        // リトライ
                        scope.launch {
                            delay(RETRY_DELAY_MS * (attempt + 1))
                            android.util.Log.d(TAG, "Retrying save for key: $key (attempt ${attempt + 2})")
                            saveDataWithRetry(uid, key, data, attempt + 1)
                        }
                    } else {
                        // 最大リトライ回数に達した場合、同期キューに追加し、Roomに保存
                        android.util.Log.e(TAG, "Max retry attempts reached for key: $key. Adding to sync queue")
                        syncQueue[key] = PendingOperation(uid, key, data, System.currentTimeMillis())

                        // Room Databaseに保存（FAILED状態）
                        scope.launch {
                            saveToRoom(uid, key, data, SyncStatus.FAILED)
                        }

                        notifyJavaScript("onSaveError", key, "Failed after ${MAX_RETRY_ATTEMPTS} attempts: ${e.message}")
                    }
                }
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Exception during save for key: $key", e)
            notifyJavaScript("onSaveError", key, "Exception: ${e.message}")
        }
    }

    /**
     * ユーザーが変わった時にキャッシュをクリア
     */
    private fun checkAndClearCacheIfUserChanged(uid: String) {
        if (currentUserId != uid) {
            android.util.Log.w(TAG, "User ID changed from $currentUserId to $uid - clearing cache")
            dataCache.clear()
            syncQueue.clear()
            currentUserId = uid
        }
    }

    /**
     * データをFirestoreから読み込み（オフライン対応）
     */
    @JavascriptInterface
    fun loadData(key: String, callback: String) {
        val uid = auth.currentUser?.uid
        if (uid == null) {
            android.util.Log.e(TAG, "loadData: No user ID, cannot load data for key: $key")
            notifyCallback(callback, null)
            return
        }

        // ユーザーが変わっていたらキャッシュをクリア
        checkAndClearCacheIfUserChanged(uid)

        android.util.Log.d(TAG, "Loading data for key: $key, UID: $uid")

        // まずキャッシュをチェック
        if (dataCache.containsKey(key)) {
            android.util.Log.d(TAG, "Returning cached data for key: $key")
            notifyCallback(callback, key)
            return
        }

        // オンラインの場合はFirestoreを優先、オフラインの場合のみRoomを使用
        if (isNetworkAvailable(context)) {
            // オンライン: Firestoreから直接読み込み（最新データを保証）
            android.util.Log.d(TAG, "Online: Loading from Firestore for key: $key")
            loadFromFirestore(uid, key, callback, updateRoom = true)
        } else {
            // オフライン: Room Databaseから読み込み
            android.util.Log.d(TAG, "Offline: Loading from Room for key: $key")
            scope.launch {
                try {
                    val entity = dao.getByKey(key, uid)
                    if (entity != null) {
                        android.util.Log.d(TAG, "Loaded data from Room for key: $key")
                        // データ整合性チェック
                        if (!isCorruptedData(entity.value)) {
                            dataCache[entity.key] = entity.value
                            Handler(Looper.getMainLooper()).post {
                                notifyCallback(callback, key)
                            }
                            return@launch
                        } else {
                            android.util.Log.w(TAG, "Corrupted data in Room for key: $key, deleting...")
                            dao.deleteByKey(key, uid)
                        }
                    }

                    // Roomにデータがない場合はnullを返す
                    android.util.Log.d(TAG, "No data in Room for key: $key")
                    Handler(Looper.getMainLooper()).post {
                        notifyCallback(callback, null)
                    }
                } catch (e: Exception) {
                    android.util.Log.e(TAG, "Error loading from Room for key: $key", e)
                    Handler(Looper.getMainLooper()).post {
                        notifyCallback(callback, null)
                    }
                }
            }
        }
    }

    /**
     * Firestoreからデータを読み込み
     */
    private fun loadFromFirestore(uid: String, key: String, callback: String, updateRoom: Boolean) {
        // オンライン時は必ずサーバーから取得（最新データを保証）
        val source = if (isNetworkAvailable(context)) {
            Source.SERVER // オンライン: 必ずサーバーから取得
        } else {
            Source.CACHE // オフライン: キャッシュのみ
        }

        android.util.Log.d(TAG, "Loading from Firestore with source: $source for key: $key")

        firestore.collection("users")
            .document(uid)
            .collection(COLLECTION_NAME)
            .document(key)
            .get(source)
            .addOnSuccessListener { document ->
                val jsonData = document.getString("data")
                android.util.Log.d(TAG, "Loaded data from Firestore for key: $key, exists: ${jsonData != null}, length: ${jsonData?.length ?: 0}")

                Handler(Looper.getMainLooper()).post {
                    if (jsonData != null) {
                        // データ整合性チェック
                        if (isCorruptedData(jsonData)) {
                            android.util.Log.w(TAG, "Corrupted data detected for key: $key, deleting...")
                            deleteCorruptedData(uid, key)
                            dataCache.remove(key)
                            notifyCallback(callback, null)
                            return@post
                        }

                        // 正常なデータをキャッシュ
                        dataCache[key] = jsonData
                        android.util.Log.d(TAG, "Data cached for key: $key")

                        // Roomにも保存
                        if (updateRoom) {
                            scope.launch {
                                saveToRoom(uid, key, jsonData, SyncStatus.SYNCED)
                            }
                        }

                        notifyCallback(callback, key)
                    } else {
                        dataCache.remove(key)
                        notifyCallback(callback, null)
                    }
                }
            }
            .addOnFailureListener { e ->
                android.util.Log.e(TAG, "Failed to load data from Firestore for key: $key", e)
                Handler(Looper.getMainLooper()).post {
                    notifyCallback(callback, null)
                }
            }
    }

    /**
     * キャッシュからデータを同期的に取得
     */
    @JavascriptInterface
    fun getCachedData(key: String): String? {
        val hasData = dataCache.containsKey(key)
        android.util.Log.d(TAG, "getCachedData called for key: $key, has data: $hasData")
        return if (hasData) dataCache[key] else null
    }

    /**
     * 同期キューにあるデータを全て再送信
     */
    @JavascriptInterface
    fun syncPendingData() {
        if (!isNetworkAvailable(context)) {
            android.util.Log.w(TAG, "Device is offline. Cannot sync pending data")
            return
        }

        val queueSize = syncQueue.size
        if (queueSize == 0) {
            android.util.Log.d(TAG, "No pending data to sync")
            return
        }

        android.util.Log.d(TAG, "Syncing $queueSize pending operations...")

        syncQueue.values.forEach { operation ->
            scope.launch {
                saveDataWithRetry(operation.uid, operation.key, operation.data, 0)
            }
        }
    }

    /**
     * ユーザーID取得
     */
    @JavascriptInterface
    fun getUserId(): String {
        val currentUser = auth.currentUser
        return if (currentUser?.isAnonymous == true) {
            "anonymous"
        } else {
            currentUser?.uid ?: "anonymous"
        }
    }

    /**
     * ユーザーメール取得
     */
    @JavascriptInterface
    fun getUserEmail(): String {
        val currentUser = auth.currentUser
        return if (currentUser?.isAnonymous == true) {
            ""
        } else {
            currentUser?.email ?: ""
        }
    }

    /**
     * ユーザー表示名取得
     */
    @JavascriptInterface
    fun getUserDisplayName(): String {
        val currentUser = auth.currentUser
        return if (currentUser?.isAnonymous == true) {
            "匿名ユーザー"
        } else {
            currentUser?.displayName ?: currentUser?.email ?: "ユーザー"
        }
    }

    /**
     * 匿名ユーザーかどうか
     */
    @JavascriptInterface
    fun isAnonymous(): Boolean {
        return auth.currentUser?.isAnonymous ?: true
    }

    /**
     * ネットワーク状態を取得
     */
    @JavascriptInterface
    fun isOnline(): Boolean {
        return isNetworkAvailable(context)
    }

    /**
     * 同期キューのサイズを取得
     */
    @JavascriptInterface
    fun getPendingOperationsCount(): Int {
        return syncQueue.size
    }

    // ヘルパーメソッド

    /**
     * Room Databaseにデータを保存
     */
    private suspend fun saveToRoom(uid: String, key: String, data: String, status: SyncStatus) {
        try {
            val entity = KeyValueEntity(
                key = key,
                value = data,
                userId = uid,
                timestamp = System.currentTimeMillis(),
                syncStatus = status,
                version = 1
            )
            dao.insert(entity)
            android.util.Log.d(TAG, "Saved to Room: key=$key, status=$status")
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error saving to Room for key: $key", e)
        }
    }

    /**
     * データが破損しているかチェック
     */
    private fun isCorruptedData(data: String): Boolean {
        return data.startsWith("[object Object]") || data == "[object Object]"
    }

    /**
     * 破損したデータを削除
     */
    private fun deleteCorruptedData(uid: String, key: String) {
        // Firestoreから削除
        firestore.collection("users")
            .document(uid)
            .collection(COLLECTION_NAME)
            .document(key)
            .delete()
            .addOnSuccessListener {
                android.util.Log.d(TAG, "Corrupted data deleted from Firestore for key: $key")
            }
            .addOnFailureListener { e ->
                android.util.Log.e(TAG, "Failed to delete corrupted data from Firestore for key: $key", e)
            }

        // Roomからも削除
        scope.launch {
            try {
                dao.deleteByKey(key, uid)
                android.util.Log.d(TAG, "Corrupted data deleted from Room for key: $key")
            } catch (e: Exception) {
                android.util.Log.e(TAG, "Failed to delete corrupted data from Room for key: $key", e)
            }
        }
    }

    /**
     * JavaScriptにコールバックを通知
     */
    private fun notifyCallback(callback: String, key: String?) {
        Handler(Looper.getMainLooper()).post {
            try {
                val param = if (key != null) "'$key'" else "null"
                webView.evaluateJavascript("$callback($param)", null)
            } catch (e: Exception) {
                android.util.Log.e(TAG, "Error calling callback: $callback", e)
            }
        }
    }

    /**
     * JavaScriptにイベントを通知
     */
    private fun notifyJavaScript(functionName: String, key: String, message: String) {
        Handler(Looper.getMainLooper()).post {
            try {
                webView.evaluateJavascript(
                    "if (typeof window.$functionName === 'function') { window.$functionName('$key', '$message'); }",
                    null
                )
            } catch (e: Exception) {
                android.util.Log.e(TAG, "Error calling $functionName", e)
            }
        }
    }

    /**
     * クリーンアップ
     */
    fun cleanup() {
        scope.cancel()
        dataCache.clear()
        android.util.Log.d(TAG, "FirestoreBridge cleaned up")
    }

    /**
     * 保留中の操作を表すデータクラス
     */
    private data class PendingOperation(
        val uid: String,
        val key: String,
        val data: String,
        val timestamp: Long
    )
}
