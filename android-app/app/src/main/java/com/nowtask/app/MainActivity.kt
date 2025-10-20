package com.nowtask.app

import android.app.Activity
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.webkit.WebView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.firestore.FirebaseFirestore
import com.nowtask.app.data.FirestoreBridge
import com.nowtask.app.notification.NotificationHelper
import com.nowtask.app.notification.TaskReminderWorker
import com.nowtask.app.utils.NetworkMonitor
import com.nowtask.app.utils.NetworkStateListener
import com.nowtask.app.webview.AndroidAuth
import com.nowtask.app.webview.initialize
import androidx.work.*
import java.util.concurrent.TimeUnit

class MainActivity : AppCompatActivity(), NetworkStateListener {

    private lateinit var webView: WebView
    private lateinit var splashView: View
    private lateinit var firestore: FirebaseFirestore
    private lateinit var auth: FirebaseAuth
    private lateinit var googleSignInClient: GoogleSignInClient
    private lateinit var firestoreBridge: FirestoreBridge
    private lateinit var networkMonitor: NetworkMonitor
    private var userId: String? = null

    private val NOWTASK_URL = "file:///android_asset/index.html"

    // ActivityResultLauncher for Google Sign-In
    private val googleSignInLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        android.util.Log.d("MainActivity", "Google Sign-In result received. ResultCode: ${result.resultCode}")

        if (result.resultCode == Activity.RESULT_OK) {
            android.util.Log.d("MainActivity", "Result is OK, processing account...")
            val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
            try {
                val account = task.getResult(ApiException::class.java)!!
                android.util.Log.d("MainActivity", "Google account obtained: ${account.email}")
                firebaseAuthWithGoogle(account.idToken!!)
            } catch (e: ApiException) {
                android.util.Log.e("MainActivity", "Google Sign-In failed with ApiException", e)
                Toast.makeText(this, "Googleサインインに失敗しました: ${e.message}", Toast.LENGTH_LONG).show()

                // ボタンを再有効化
                Handler(Looper.getMainLooper()).post {
                    webView.evaluateJavascript("if (typeof window.onAuthCanceled === 'function') { window.onAuthCanceled(); }", null)
                }
            }
        } else if (result.resultCode == Activity.RESULT_CANCELED) {
            android.util.Log.d("MainActivity", "Google Sign-In was canceled by user")
            Toast.makeText(this, "ログインがキャンセルされました", Toast.LENGTH_SHORT).show()

            // ボタンを再有効化
            Handler(Looper.getMainLooper()).post {
                webView.evaluateJavascript("if (typeof window.onAuthCanceled === 'function') { window.onAuthCanceled(); }", null)
            }
        } else {
            android.util.Log.w("MainActivity", "Unexpected result code: ${result.resultCode}")
            Toast.makeText(this, "予期しないエラーが発生しました", Toast.LENGTH_SHORT).show()

            // ボタンを再有効化
            Handler(Looper.getMainLooper()).post {
                webView.evaluateJavascript("if (typeof window.onAuthCanceled === 'function') { window.onAuthCanceled(); }", null)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Firebase初期化
        firestore = FirebaseFirestore.getInstance()
        auth = FirebaseAuth.getInstance()

        // Googleサインインのオプションを設定
        // R.string.default_web_client_id は google-services.json から自動生成されるIDです。
        // このIDがない場合、手動でFirebaseコンソールのWebクライアントIDを設定する必要があります。
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(getString(R.string.default_web_client_id))
            .requestEmail()
            .build()
        googleSignInClient = GoogleSignIn.getClient(this, gso)

        // ログインチェック
        checkUserStatus()
    }

    private fun checkUserStatus() {
        val currentUser = auth.currentUser
        android.util.Log.d("MainActivity", "Checking user status. CurrentUser: ${currentUser?.uid}, isAnonymous: ${currentUser?.isAnonymous}")

        if (currentUser == null) {
            android.util.Log.d("MainActivity", "No user found, signing in anonymously...")
            auth.signInAnonymously().addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    userId = auth.currentUser?.uid
                    android.util.Log.d("MainActivity", "Anonymous sign-in successful. UID: $userId")
                } else {
                    userId = "anonymous"
                    android.util.Log.e("MainActivity", "Anonymous sign-in failed", task.exception)
                }
                setupUIAndLoadApp()
            }
        } else {
            userId = currentUser.uid
            android.util.Log.d("MainActivity", "User already signed in. UID: $userId")
            setupUIAndLoadApp()
        }
    }

    private fun setupUIAndLoadApp() {
        setContentView(R.layout.activity_main)
        webView = findViewById(R.id.webView)
        splashView = findViewById(R.id.splashView)

        webView.initialize()

        // JavaScriptブリッジを追加
        firestoreBridge = FirestoreBridge(this, webView, auth)
        val androidAuth = AndroidAuth(this, auth, webView) { launchGoogleSignIn() }
        webView.addJavascriptInterface(androidAuth, "AndroidAuth")
        webView.addJavascriptInterface(firestoreBridge, "FirestoreBridge")

        // ネットワーク監視を開始
        networkMonitor = NetworkMonitor(this, this)
        networkMonitor.startMonitoring()

        // タスクリマインダーの定期実行をスケジュール
        scheduleTaskReminders()

        // 通知権限をリクエスト（Android 13以降）
        requestNotificationPermission()

        loadApp()
    }

    /**
     * タスクリマインダーの定期実行をスケジュール
     * 15分ごとにタスクをチェックして、期限が近いタスクの通知を送る
     */
    private fun scheduleTaskReminders() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.NOT_REQUIRED)  // ネットワーク不要
            .build()

        val reminderRequest = PeriodicWorkRequestBuilder<TaskReminderWorker>(
            15, TimeUnit.MINUTES  // 15分ごとに実行
        )
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "task_reminders",
            ExistingPeriodicWorkPolicy.KEEP,  // 既存のWorkがあればそのまま維持
            reminderRequest
        )

        android.util.Log.d("MainActivity", "Task reminder worker scheduled")
    }

    /**
     * 通知権限をリクエスト（Android 13以降）
     */
    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), 1001)
                android.util.Log.d("MainActivity", "Requesting notification permission")
            }
        }
    }

    private fun loadApp() {
        Handler(Looper.getMainLooper()).postDelayed({
            splashView.visibility = View.GONE
            webView.visibility = View.VISIBLE
            webView.loadUrl(NOWTASK_URL)
        }, 2000)
    }

    private fun launchGoogleSignIn() {
        android.util.Log.d("MainActivity", "Launching Google Sign-In...")
        // 毎回アカウント選択画面を表示するため、前回のサインイン情報をクリア
        googleSignInClient.signOut().addOnCompleteListener(this) {
            val signInIntent = googleSignInClient.signInIntent
            googleSignInLauncher.launch(signInIntent)
            android.util.Log.d("MainActivity", "Google Sign-In intent launched with account picker")
        }
    }

    private fun firebaseAuthWithGoogle(idToken: String) {
        val credential = GoogleAuthProvider.getCredential(idToken, null)
        val currentUser = auth.currentUser

        if (currentUser != null && currentUser.isAnonymous) {
            // 匿名ユーザーの場合: アカウントをリンクしてデータを保持
            val oldUserId = currentUser.uid
            android.util.Log.d("MainActivity", "Linking anonymous user $oldUserId with Google account")

            currentUser.linkWithCredential(credential)
                .addOnCompleteListener(this) { task ->
                    if (task.isSuccessful) {
                        // アカウントリンク成功
                        val newUserId = auth.currentUser?.uid
                        userId = newUserId
                        android.util.Log.d("MainActivity", "Account linked successfully. New UID: $newUserId")
                        Toast.makeText(this, "ログインしました（データは保持されています）", Toast.LENGTH_SHORT).show()

                        // WebViewに通知してUIを更新
                        Handler(Looper.getMainLooper()).post {
                            try {
                                webView.evaluateJavascript("if (typeof window.onAuthSuccess === 'function') { window.onAuthSuccess(); } else { console.error('onAuthSuccess not found'); }", null)
                                android.util.Log.d("MainActivity", "Called window.onAuthSuccess()")
                            } catch (e: Exception) {
                                android.util.Log.e("MainActivity", "Error calling onAuthSuccess", e)
                            }
                        }

                        // 注: Firestoreのデータ移行は不要（uidは変わらない）
                        // linkWithCredentialは既存のuidを維持したままGoogle認証情報を追加する
                    } else {
                        // アカウントリンク失敗 - Googleアカウントが既に使われている可能性がある
                        val errorMessage = task.exception?.message ?: "不明なエラー"
                        android.util.Log.e("MainActivity", "Account linking failed: $errorMessage", task.exception)

                        // "already associated with a different user account" エラーの場合は直接サインイン
                        if (errorMessage.contains("already associated", ignoreCase = true)) {
                            android.util.Log.d("MainActivity", "Google account already exists. Signing in directly...")
                            Toast.makeText(this, "既存のGoogleアカウントでログインします", Toast.LENGTH_SHORT).show()

                            // 直接サインインを試みる
                            auth.signInWithCredential(credential)
                                .addOnCompleteListener(this) { signInTask ->
                                    if (signInTask.isSuccessful) {
                                        userId = auth.currentUser?.uid
                                        android.util.Log.d("MainActivity", "Sign in successful after link failure. UID: $userId")
                                        Toast.makeText(this, "ログインしました", Toast.LENGTH_SHORT).show()

                                        Handler(Looper.getMainLooper()).post {
                                            try {
                                                webView.evaluateJavascript("if (typeof window.onAuthSuccess === 'function') { window.onAuthSuccess(); } else { console.error('onAuthSuccess not found'); }", null)
                                                android.util.Log.d("MainActivity", "Called window.onAuthSuccess()")
                                            } catch (e: Exception) {
                                                android.util.Log.e("MainActivity", "Error calling onAuthSuccess", e)
                                            }
                                        }
                                    } else {
                                        val signInError = signInTask.exception?.message ?: "不明なエラー"
                                        android.util.Log.e("MainActivity", "Sign in also failed: $signInError", signInTask.exception)
                                        Toast.makeText(this, "ログインに失敗: $signInError", Toast.LENGTH_LONG).show()

                                        Handler(Looper.getMainLooper()).post {
                                            webView.evaluateJavascript("if (typeof window.onAuthCanceled === 'function') { window.onAuthCanceled(); }", null)
                                        }
                                    }
                                }
                        } else {
                            // その他のエラー
                            Toast.makeText(this, "アカウント連携に失敗: $errorMessage", Toast.LENGTH_LONG).show()
                            Handler(Looper.getMainLooper()).post {
                                webView.evaluateJavascript("if (typeof window.onAuthCanceled === 'function') { window.onAuthCanceled(); }", null)
                            }
                        }
                    }
                }
        } else {
            // 非匿名ユーザーの場合: 通常のサインイン
            android.util.Log.d("MainActivity", "Signing in with Google credential")

            auth.signInWithCredential(credential)
                .addOnCompleteListener(this) { task ->
                    if (task.isSuccessful) {
                        // サインイン成功
                        userId = auth.currentUser?.uid
                        android.util.Log.d("MainActivity", "Sign in successful. UID: $userId")
                        Toast.makeText(this, "ログインしました", Toast.LENGTH_SHORT).show()

                        // WebViewに通知してUIを更新
                        Handler(Looper.getMainLooper()).post {
                            try {
                                webView.evaluateJavascript("if (typeof window.onAuthSuccess === 'function') { window.onAuthSuccess(); } else { console.error('onAuthSuccess not found'); }", null)
                                android.util.Log.d("MainActivity", "Called window.onAuthSuccess()")
                            } catch (e: Exception) {
                                android.util.Log.e("MainActivity", "Error calling onAuthSuccess", e)
                            }
                        }
                    } else {
                        // サインイン失敗
                        val errorMessage = task.exception?.message ?: "不明なエラー"
                        android.util.Log.e("MainActivity", "Sign in failed: $errorMessage", task.exception)
                        Toast.makeText(this, "Firebase認証に失敗しました: $errorMessage", Toast.LENGTH_SHORT).show()

                        // ボタンを再有効化
                        Handler(Looper.getMainLooper()).post {
                            webView.evaluateJavascript("if (typeof window.onAuthCanceled === 'function') { window.onAuthCanceled(); }", null)
                        }
                    }
                }
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        // ネットワーク監視を停止
        if (::networkMonitor.isInitialized) {
            networkMonitor.stopMonitoring()
        }
        // FirestoreBridgeのクリーンアップ
        if (::firestoreBridge.isInitialized) {
            firestoreBridge.cleanup()
        }
    }

    // NetworkStateListener の実装

    override fun onNetworkAvailable() {
        android.util.Log.d("MainActivity", "Network available - syncing pending data")
        Handler(Looper.getMainLooper()).post {
            Toast.makeText(this, "オンラインに復帰しました", Toast.LENGTH_SHORT).show()

            // 保留中のデータを同期
            if (::firestoreBridge.isInitialized) {
                firestoreBridge.syncPendingData()
            }

            // WebViewに通知
            webView.evaluateJavascript(
                "if (typeof window.onNetworkAvailable === 'function') { window.onNetworkAvailable(); }",
                null
            )
        }
    }

    override fun onNetworkLost() {
        android.util.Log.d("MainActivity", "Network lost")
        Handler(Looper.getMainLooper()).post {
            Toast.makeText(this, "オフラインモード", Toast.LENGTH_SHORT).show()

            // WebViewに通知
            webView.evaluateJavascript(
                "if (typeof window.onNetworkLost === 'function') { window.onNetworkLost(); }",
                null
            )
        }
    }
}
