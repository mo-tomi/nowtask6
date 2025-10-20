package com.nowtask.app.notification

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.nowtask.app.MainActivity
import com.nowtask.app.R

/**
 * 通知管理ヘルパークラス
 *
 * タスクのリマインダー通知を管理
 */
class NotificationHelper(private val context: Context) {

    companion object {
        private const val CHANNEL_ID = "nowtask_reminders"
        private const val CHANNEL_NAME = "タスクリマインダー"
        private const val CHANNEL_DESCRIPTION = "タスクの期限前に通知します"
        private const val NOTIFICATION_ID_BASE = 1000
    }

    init {
        createNotificationChannel()
    }

    /**
     * 通知チャンネルを作成（Android 8.0以降）
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val importance = NotificationManager.IMPORTANCE_DEFAULT
            val channel = NotificationChannel(CHANNEL_ID, CHANNEL_NAME, importance).apply {
                description = CHANNEL_DESCRIPTION
                enableVibration(true)
                enableLights(true)
            }

            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)

            android.util.Log.d("NotificationHelper", "Notification channel created: $CHANNEL_ID")
        }
    }

    /**
     * タスクリマインダー通知を表示
     *
     * @param taskId タスクID
     * @param taskTitle タスクのタイトル
     * @param dueTime 期限時刻（表示用）
     */
    fun showTaskReminder(taskId: String, taskTitle: String, dueTime: String) {
        // Android 13以降では通知権限のチェックが必要
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ActivityCompat.checkSelfPermission(
                    context,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                android.util.Log.w("NotificationHelper", "Notification permission not granted")
                return
            }
        }

        // アプリを開くPendingIntent
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("task_id", taskId)
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            taskId.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // 通知を構築
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)  // アイコンは後で専用のものに変更可能
            .setContentTitle("タスクのリマインダー")
            .setContentText("$taskTitle - $dueTime")
            .setStyle(
                NotificationCompat.BigTextStyle()
                    .bigText("$taskTitle\n期限: $dueTime")
            )
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)  // タップで自動的に削除
            .build()

        // 通知を表示
        try {
            NotificationManagerCompat.from(context).notify(
                NOTIFICATION_ID_BASE + taskId.hashCode(),
                notification
            )
            android.util.Log.d("NotificationHelper", "Notification shown for task: $taskTitle")
        } catch (e: SecurityException) {
            android.util.Log.e("NotificationHelper", "Failed to show notification", e)
        }
    }

    /**
     * 通知権限が付与されているかチェック
     */
    fun hasNotificationPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ActivityCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true  // Android 13未満では権限不要
        }
    }

    /**
     * 特定のタスクの通知をキャンセル
     */
    fun cancelNotification(taskId: String) {
        NotificationManagerCompat.from(context).cancel(NOTIFICATION_ID_BASE + taskId.hashCode())
        android.util.Log.d("NotificationHelper", "Notification cancelled for task: $taskId")
    }

    /**
     * すべてのタスク通知をキャンセル
     */
    fun cancelAllNotifications() {
        NotificationManagerCompat.from(context).cancelAll()
        android.util.Log.d("NotificationHelper", "All notifications cancelled")
    }
}
