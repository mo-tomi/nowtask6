package com.nowtask.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters

/**
 * Room Databaseのメインクラス
 *
 * データベースインスタンスを管理し、DAOへのアクセスを提供
 */
@Database(
    entities = [KeyValueEntity::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {

    /**
     * Key-Value DAO へのアクセス
     */
    abstract fun keyValueDao(): KeyValueDao

    companion object {
        private const val DATABASE_NAME = "nowtask_database"

        @Volatile
        private var INSTANCE: AppDatabase? = null

        /**
         * データベースインスタンスを取得（シングルトン）
         */
        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    DATABASE_NAME
                )
                    .fallbackToDestructiveMigration()  // マイグレーション失敗時はデータベースを再作成
                    .build()

                INSTANCE = instance
                instance
            }
        }

        /**
         * テスト用：インスタンスをクリア
         */
        fun clearInstance() {
            INSTANCE?.close()
            INSTANCE = null
        }
    }
}

/**
 * Room用の型変換クラス
 */
class Converters {
    /**
     * SyncStatusをStringに変換
     */
    @androidx.room.TypeConverter
    fun fromSyncStatus(status: SyncStatus): String {
        return status.name
    }

    /**
     * StringをSyncStatusに変換
     */
    @androidx.room.TypeConverter
    fun toSyncStatus(value: String): SyncStatus {
        return try {
            SyncStatus.valueOf(value)
        } catch (e: IllegalArgumentException) {
            SyncStatus.SYNCED
        }
    }
}
