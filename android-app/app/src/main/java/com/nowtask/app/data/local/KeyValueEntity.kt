package com.nowtask.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Room Database用のKey-Value Entityクラス
 *
 * Firestoreのデータ構造と互換性を保つため、key-value形式で保存
 * これにより、既存のFirestoreBridgeとシームレスに連携できる
 */
@Entity(tableName = "key_value_store")
data class KeyValueEntity(
    @PrimaryKey
    val key: String,           // データのキー（例: "nowtask_tasks", "nowtask_routines"）
    val value: String,         // JSON形式のデータ
    val userId: String,        // ユーザーID（データの所有者）
    val timestamp: Long,       // 最終更新日時（ミリ秒）
    val syncStatus: SyncStatus = SyncStatus.SYNCED,  // 同期状態
    val version: Int = 1       // データバージョン
)

/**
 * 同期状態を表すEnum
 */
enum class SyncStatus {
    SYNCED,         // Firestoreと同期済み
    PENDING,        // Firestoreへの同期待ち
    SYNCING,        // 同期中
    FAILED          // 同期失敗
}
