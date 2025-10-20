package com.nowtask.app.notification

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.google.firebase.auth.FirebaseAuth
import com.nowtask.app.data.local.AppDatabase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

/**
 * タスクリマインダーWorker
 *
 * 定期的に実行され、期限が近いタスクをチェックして通知を送る
 */
class TaskReminderWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    companion object {
        private const val TAG = "TaskReminderWorker"
        private const val TASKS_KEY = "nowtask_tasks"
        private const val REMINDER_HOURS_BEFORE = 1  // 期限の1時間前に通知
    }

    private val auth = FirebaseAuth.getInstance()
    private val database = AppDatabase.getInstance(context)
    private val dao = database.keyValueDao()
    private val notificationHelper = NotificationHelper(context)

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            android.util.Log.d(TAG, "TaskReminderWorker started")

            // ユーザーIDを取得
            val uid = auth.currentUser?.uid
            if (uid == null) {
                android.util.Log.w(TAG, "No user logged in, skipping reminder check")
                return@withContext Result.success()
            }

            // 通知権限をチェック
            if (!notificationHelper.hasNotificationPermission()) {
                android.util.Log.w(TAG, "Notification permission not granted")
                return@withContext Result.success()
            }

            // Room DatabaseからタスクデータTを取得
            val tasksEntity = dao.getByKey(TASKS_KEY, uid)
            if (tasksEntity == null) {
                android.util.Log.d(TAG, "No tasks found in database")
                return@withContext Result.success()
            }

            // JSONをパース
            val tasksJson = JSONArray(tasksEntity.value)
            val currentTime = System.currentTimeMillis()
            val reminderThreshold = currentTime + (REMINDER_HOURS_BEFORE * 60 * 60 * 1000)

            android.util.Log.d(TAG, "Checking ${tasksJson.length()} tasks for reminders")

            var notificationCount = 0

            // 各タスクをチェック
            for (i in 0 until tasksJson.length()) {
                val task = tasksJson.getJSONObject(i)

                // 完了済みタスクはスキップ
                if (task.optBoolean("completed", false)) {
                    continue
                }

                // 期限をチェック
                val deadline = task.optString("deadline", "")
                if (deadline.isNotEmpty()) {
                    val deadlineTime = parseDeadline(deadline)
                    if (deadlineTime != null) {
                        // 期限が現在から1時間以内の場合、通知を送る
                        if (deadlineTime > currentTime && deadlineTime <= reminderThreshold) {
                            val taskId = task.optString("id", "")
                            val taskTitle = task.optString("text", "タスク")
                            val formattedTime = formatTime(deadlineTime)

                            // 既に通知済みかチェック（過去24時間以内に通知した場合はスキップ）
                            if (!wasRecentlyNotified(taskId)) {
                                notificationHelper.showTaskReminder(taskId, taskTitle, formattedTime)
                                markAsNotified(taskId)
                                notificationCount++

                                android.util.Log.d(TAG, "Sent reminder for task: $taskTitle (deadline: $formattedTime)")
                            }
                        }
                    }
                }
            }

            android.util.Log.d(TAG, "TaskReminderWorker completed, sent $notificationCount notifications")
            Result.success()

        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error in TaskReminderWorker", e)
            Result.failure()
        }
    }

    /**
     * 期限文字列をミリ秒に変換
     * 形式: "2025-10-15 14:30" または "14:30"（今日の時刻）
     */
    private fun parseDeadline(deadline: String): Long? {
        return try {
            val dateString = if (deadline.contains(" ")) {
                deadline
            } else {
                // 時刻のみの場合は今日の日付を付加
                val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
                "$today $deadline"
            }

            val format = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())
            format.parse(dateString)?.time
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Failed to parse deadline: $deadline", e)
            null
        }
    }

    /**
     * 時刻を表示用にフォーマット
     */
    private fun formatTime(timeMillis: Long): String {
        val format = SimpleDateFormat("yyyy/MM/dd HH:mm", Locale.getDefault())
        return format.format(Date(timeMillis))
    }

    /**
     * 最近通知済みかチェック（SharedPreferencesで管理）
     */
    private fun wasRecentlyNotified(taskId: String): Boolean {
        val prefs = applicationContext.getSharedPreferences("task_notifications", Context.MODE_PRIVATE)
        val lastNotified = prefs.getLong("notified_$taskId", 0)
        val hoursSinceNotified = (System.currentTimeMillis() - lastNotified) / (1000 * 60 * 60)
        return hoursSinceNotified < 24  // 24時間以内に通知済みならtrue
    }

    /**
     * 通知済みとしてマーク
     */
    private fun markAsNotified(taskId: String) {
        val prefs = applicationContext.getSharedPreferences("task_notifications", Context.MODE_PRIVATE)
        prefs.edit().putLong("notified_$taskId", System.currentTimeMillis()).apply()
    }
}
