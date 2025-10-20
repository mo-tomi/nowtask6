package com.nowtask.app.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

/**
 * Room Database用のDAO（Data Access Object）
 *
 * Key-Valueストアへのアクセス方法を定義
 */
@Dao
interface KeyValueDao {

    /**
     * データを挿入または更新
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entity: KeyValueEntity)

    /**
     * データを更新
     */
    @Update
    suspend fun update(entity: KeyValueEntity)

    /**
     * データを削除
     */
    @Delete
    suspend fun delete(entity: KeyValueEntity)

    /**
     * キーを指定してデータを削除
     */
    @Query("DELETE FROM key_value_store WHERE key = :key AND userId = :userId")
    suspend fun deleteByKey(key: String, userId: String)

    /**
     * キーを指定してデータを取得
     */
    @Query("SELECT * FROM key_value_store WHERE key = :key AND userId = :userId LIMIT 1")
    suspend fun getByKey(key: String, userId: String): KeyValueEntity?

    /**
     * キーを指定してデータを取得（Flow版 - リアルタイム監視）
     */
    @Query("SELECT * FROM key_value_store WHERE key = :key AND userId = :userId LIMIT 1")
    fun getByKeyFlow(key: String, userId: String): Flow<KeyValueEntity?>

    /**
     * ユーザーの全データを取得
     */
    @Query("SELECT * FROM key_value_store WHERE userId = :userId ORDER BY timestamp DESC")
    suspend fun getAllByUser(userId: String): List<KeyValueEntity>

    /**
     * 同期待ちのデータを取得
     */
    @Query("SELECT * FROM key_value_store WHERE userId = :userId AND syncStatus = 'PENDING' ORDER BY timestamp ASC")
    suspend fun getPendingSync(userId: String): List<KeyValueEntity>

    /**
     * 同期失敗したデータを取得
     */
    @Query("SELECT * FROM key_value_store WHERE userId = :userId AND syncStatus = 'FAILED' ORDER BY timestamp ASC")
    suspend fun getFailedSync(userId: String): List<KeyValueEntity>

    /**
     * 同期状態を更新
     */
    @Query("UPDATE key_value_store SET syncStatus = :status WHERE key = :key AND userId = :userId")
    suspend fun updateSyncStatus(key: String, userId: String, status: SyncStatus)

    /**
     * タイムスタンプを更新
     */
    @Query("UPDATE key_value_store SET timestamp = :timestamp WHERE key = :key AND userId = :userId")
    suspend fun updateTimestamp(key: String, userId: String, timestamp: Long)

    /**
     * ユーザーの全データを削除（ログアウト時など）
     */
    @Query("DELETE FROM key_value_store WHERE userId = :userId")
    suspend fun deleteAllByUser(userId: String)

    /**
     * 全データを削除（デバッグ用）
     */
    @Query("DELETE FROM key_value_store")
    suspend fun deleteAll()

    /**
     * データ件数を取得
     */
    @Query("SELECT COUNT(*) FROM key_value_store WHERE userId = :userId")
    suspend fun getCount(userId: String): Int

    /**
     * 同期待ちのデータ件数を取得
     */
    @Query("SELECT COUNT(*) FROM key_value_store WHERE userId = :userId AND syncStatus = 'PENDING'")
    suspend fun getPendingSyncCount(userId: String): Int
}
