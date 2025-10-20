package com.nowtask.app.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.google.firebase.auth.FirebaseAuth
import com.nowtask.app.MainActivity
import com.nowtask.app.R
import com.nowtask.app.data.local.AppDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import java.text.SimpleDateFormat
import java.util.*

/**
 * タスクウィジェットのプロバイダー
 *
 * ホーム画面に今日のタスクを表示するウィジェット
 */
class TaskWidgetProvider : AppWidgetProvider() {

    companion object {
        private const val TAG = "TaskWidgetProvider"
        private const val TASKS_KEY = "nowtask_tasks"

        /**
         * ウィジェットを手動で更新する
         */
        fun updateWidget(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val thisWidget = ComponentName(context, TaskWidgetProvider::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget)

            val intent = Intent(context, TaskWidgetProvider::class.java)
            intent.action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, appWidgetIds)
            context.sendBroadcast(intent)
        }
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        android.util.Log.d(TAG, "onUpdate called for ${appWidgetIds.size} widgets")

        // 各ウィジェットインスタンスを更新
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        android.util.Log.d(TAG, "Widget enabled")
    }

    override fun onDisabled(context: Context) {
        android.util.Log.d(TAG, "Widget disabled")
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        android.util.Log.d(TAG, "Updating widget $appWidgetId")

        try {
            // RemoteViewsを作成
            val views = RemoteViews(context.packageName, R.layout.widget_task_list)

            // ウィジェット全体をタップしてアプリを開く
            val mainIntent = Intent(context, MainActivity::class.java)
            val mainPendingIntent = PendingIntent.getActivity(
                context,
                0,
                mainIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            // ルートビューにクリックイベントを設定（ウィジェット全体がタップ可能に）
            views.setOnClickPendingIntent(android.R.id.background, mainPendingIntent)

            // タスク追加ボタンのインテントを設定
            val addTaskIntent = Intent(context, com.nowtask.app.QuickAddTaskActivity::class.java)
            val addTaskPendingIntent = PendingIntent.getActivity(
                context,
                1,
                addTaskIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_add_task, addTaskPendingIntent)

            // 初期状態を設定
            views.setTextViewText(R.id.widget_title, "今日のタスク")
            views.setTextViewText(R.id.widget_task_count, "0件")

            // すべてのタスクを非表示に
            views.setViewVisibility(R.id.widget_task_1, android.view.View.GONE)
            views.setViewVisibility(R.id.widget_task_2, android.view.View.GONE)
            views.setViewVisibility(R.id.widget_task_3, android.view.View.GONE)
            views.setViewVisibility(R.id.widget_empty_text, android.view.View.VISIBLE)

            // まず初期状態で更新
            appWidgetManager.updateAppWidget(appWidgetId, views)

            // バックグラウンドでタスクデータを取得して更新
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val auth = FirebaseAuth.getInstance()
                    val uid = auth.currentUser?.uid

                    if (uid == null) {
                        android.util.Log.w(TAG, "No user logged in")
                        return@launch
                    }

                    // Room Databaseからタスクを取得
                    val database = AppDatabase.getInstance(context)
                    val dao = database.keyValueDao()
                    val tasksEntity = dao.getByKey(TASKS_KEY, uid)

                    if (tasksEntity == null) {
                        android.util.Log.d(TAG, "No tasks found")
                        return@launch
                    }

                    // JSONをパースして今日のタスクを抽出
                    val tasksJson = JSONArray(tasksEntity.value)
                    val todayTasks = mutableListOf<TaskInfo>()
                    val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())

                    android.util.Log.d(TAG, "Total tasks in database: ${tasksJson.length()}")

                    for (i in 0 until tasksJson.length()) {
                        val task = tasksJson.getJSONObject(i)

                        // 完了済みタスクはスキップ
                        if (task.optBoolean("isCompleted", false)) {
                            continue
                        }

                        // 期限が今日のタスクを抽出
                        val dueDate = task.optString("dueDate", "")
                        if (dueDate.isNotEmpty() && dueDate != "null") {
                            // ISO形式の日付から今日かどうかを判定
                            val taskDate = try {
                                SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault()).parse(dueDate)
                            } catch (e: Exception) {
                                android.util.Log.w(TAG, "Failed to parse date: $dueDate", e)
                                null
                            }

                            if (taskDate != null) {
                                val taskDateStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(taskDate)
                                if (taskDateStr == today) {
                                    val taskId = task.optString("id", "")
                                    val taskText = task.optString("title", "")

                                    // startTimeとendTimeがあればそれを使用、なければdueDateから時刻を抽出
                                    val startTime = task.optString("startTime", "")
                                    val endTime = task.optString("endTime", "")

                                    val timeDisplay = if (startTime.isNotEmpty() && endTime.isNotEmpty()) {
                                        "$startTime-$endTime"
                                    } else {
                                        SimpleDateFormat("HH:mm", Locale.getDefault()).format(taskDate)
                                    }

                                    android.util.Log.d(TAG, "Adding task: $taskText at $timeDisplay")
                                    todayTasks.add(TaskInfo(taskId, taskText, timeDisplay))
                                }
                            }
                        }
                    }

                    // タスク数でソート（最大3件まで表示）
                    todayTasks.sortBy { it.deadline }
                    val displayTasks = todayTasks.take(3)

                    android.util.Log.d(TAG, "Found ${todayTasks.size} tasks for today, displaying ${displayTasks.size}")

                    // メインスレッドでウィジェットを更新
                    withContext(Dispatchers.Main) {
                        updateWidgetWithTasks(context, appWidgetManager, appWidgetId, views, displayTasks, todayTasks.size)
                    }

                } catch (e: Exception) {
                    android.util.Log.e(TAG, "Error updating widget", e)
                }
            }
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error in updateAppWidget", e)
        }
    }

    private fun updateWidgetWithTasks(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        views: RemoteViews,
        tasks: List<TaskInfo>,
        totalCount: Int
    ) {
        try {
            views.setTextViewText(R.id.widget_task_count, "${totalCount}件")

            if (tasks.isEmpty()) {
                // 空の状態を表示
                views.setViewVisibility(R.id.widget_task_1, android.view.View.GONE)
                views.setViewVisibility(R.id.widget_task_2, android.view.View.GONE)
                views.setViewVisibility(R.id.widget_task_3, android.view.View.GONE)
                views.setViewVisibility(R.id.widget_empty_text, android.view.View.VISIBLE)
            } else {
                // タスクを表示
                views.setViewVisibility(R.id.widget_empty_text, android.view.View.GONE)

                // タスク1
                if (tasks.size >= 1) {
                    views.setViewVisibility(R.id.widget_task_1, android.view.View.VISIBLE)
                    views.setTextViewText(R.id.widget_task_1_text, tasks[0].text)
                    views.setTextViewText(R.id.widget_task_1_time, tasks[0].deadline)
                } else {
                    views.setViewVisibility(R.id.widget_task_1, android.view.View.GONE)
                }

                // タスク2
                if (tasks.size >= 2) {
                    views.setViewVisibility(R.id.widget_task_2, android.view.View.VISIBLE)
                    views.setTextViewText(R.id.widget_task_2_text, tasks[1].text)
                    views.setTextViewText(R.id.widget_task_2_time, tasks[1].deadline)
                } else {
                    views.setViewVisibility(R.id.widget_task_2, android.view.View.GONE)
                }

                // タスク3
                if (tasks.size >= 3) {
                    views.setViewVisibility(R.id.widget_task_3, android.view.View.VISIBLE)
                    views.setTextViewText(R.id.widget_task_3_text, tasks[2].text)
                    views.setTextViewText(R.id.widget_task_3_time, tasks[2].deadline)
                } else {
                    views.setViewVisibility(R.id.widget_task_3, android.view.View.GONE)
                }
            }

            appWidgetManager.updateAppWidget(appWidgetId, views)
            android.util.Log.d(TAG, "Widget updated successfully with ${tasks.size} tasks")
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error in updateWidgetWithTasks", e)
        }
    }

    /**
     * タスク情報を保持するデータクラス
     */
    private data class TaskInfo(
        val id: String,
        val text: String,
        val deadline: String
    )
}
