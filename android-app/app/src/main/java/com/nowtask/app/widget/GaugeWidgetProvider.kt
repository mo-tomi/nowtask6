package com.nowtask.app.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.TypedValue
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
 * 24時間ゲージウィジェットのプロバイダー
 *
 * ホーム画面に24時間ゲージとタスク密度を表示するウィジェット
 */
class GaugeWidgetProvider : AppWidgetProvider() {

    companion object {
        private const val TAG = "GaugeWidgetProvider"
        private const val TASKS_KEY = "nowtask_tasks"

        /**
         * ウィジェットを手動で更新する
         */
        fun updateWidget(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val thisWidget = ComponentName(context, GaugeWidgetProvider::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget)

            val intent = Intent(context, GaugeWidgetProvider::class.java)
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
        android.util.Log.d(TAG, "Updating gauge widget $appWidgetId")

        try {
            // RemoteViewsを作成
            val views = RemoteViews(context.packageName, R.layout.widget_gauge)

            // ウィジェット全体をタップしてアプリを開く
            val intent = Intent(context, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            // ルートビューにクリックイベントを設定（ウィジェット全体がタップ可能に）
            views.setOnClickPendingIntent(android.R.id.background, pendingIntent)

            // 初期状態を設定
            val now = Calendar.getInstance()
            val hours = now.get(Calendar.HOUR_OF_DAY)
            val minutes = now.get(Calendar.MINUTE)
            views.setTextViewText(
                R.id.widget_current_time,
                String.format("%02d:%02d", hours, minutes)
            )

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
                    val gaugeData = calculateGaugeData(tasksJson)

                    android.util.Log.d(TAG, "Gauge data: $gaugeData")

                    // メインスレッドでウィジェットを更新
                    withContext(Dispatchers.Main) {
                        updateWidgetWithData(context, appWidgetManager, appWidgetId, views, gaugeData)
                    }

                } catch (e: Exception) {
                    android.util.Log.e(TAG, "Error updating gauge widget", e)
                }
            }
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error in updateAppWidget", e)
        }
    }

    private fun calculateGaugeData(tasksJson: JSONArray): GaugeData {
        val now = Calendar.getInstance()
        val currentMinutes = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE)

        val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())

        var totalScheduledMinutes = 0
        val timeSlots = mutableListOf<Pair<Int, Int>>() // start, end minutes

        for (i in 0 until tasksJson.length()) {
            val task = tasksJson.getJSONObject(i)

            // 完了済みタスクはスキップ
            if (task.optBoolean("isCompleted", false)) {
                continue
            }

            // 期限が今日のタスクを抽出
            val dueDate = task.optString("dueDate", "")
            if (dueDate.isEmpty()) continue

            // ISO形式の日付から今日かどうかを判定
            val taskDate = try {
                SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault()).parse(dueDate)
            } catch (e: Exception) {
                null
            }

            if (taskDate == null) continue

            val taskDateStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(taskDate)
            if (taskDateStr != today) continue

            // 開始時刻と終了時刻を取得
            val startTime = task.optString("startTime", "")
            val endTime = task.optString("endTime", "")

            if (startTime.isNotEmpty() && endTime.isNotEmpty()) {
                try {
                    val startParts = startTime.split(":")
                    val endParts = endTime.split(":")

                    var startMinutes = startParts[0].toInt() * 60 + startParts[1].toInt()
                    var endMinutes = endParts[0].toInt() * 60 + endParts[1].toInt()

                    // 日をまたぐ場合は当日分のみ
                    if (endMinutes < startMinutes) {
                        endMinutes = 24 * 60
                    }

                    // 現在時刻より前に終了するタスクはスキップ
                    if (endMinutes <= currentMinutes) continue

                    // 現在進行中のタスクは現在時刻から開始
                    if (startMinutes < currentMinutes) {
                        startMinutes = currentMinutes
                    }

                    timeSlots.add(Pair(startMinutes, endMinutes))
                } catch (e: Exception) {
                    android.util.Log.w(TAG, "Failed to parse time: $startTime - $endTime", e)
                }
            }
        }

        // タイムスロットを統合（重複を排除）
        if (timeSlots.isNotEmpty()) {
            timeSlots.sortBy { it.first }
            val mergedSlots = mutableListOf(timeSlots[0])

            for (i in 1 until timeSlots.size) {
                val current = timeSlots[i]
                val last = mergedSlots.last()

                if (current.first <= last.second) {
                    // 重複している: 統合
                    mergedSlots[mergedSlots.size - 1] = Pair(last.first, maxOf(last.second, current.second))
                } else {
                    // 重複していない: 新しいスロットとして追加
                    mergedSlots.add(current)
                }
            }

            totalScheduledMinutes = mergedSlots.sumOf { it.second - it.first }
        }

        val totalMinutesInDay = 24 * 60
        val remainingTimeInDay = totalMinutesInDay - currentMinutes
        val freeTimeMinutes = remainingTimeInDay - totalScheduledMinutes
        val densityPercent = if (remainingTimeInDay > 0) {
            (totalScheduledMinutes.toFloat() / remainingTimeInDay.toFloat()) * 100f
        } else {
            100f
        }

        return GaugeData(
            currentMinutes = currentMinutes,
            scheduledMinutes = totalScheduledMinutes,
            freeTimeMinutes = freeTimeMinutes,
            densityPercent = densityPercent
        )
    }

    private fun updateWidgetWithData(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        views: RemoteViews,
        data: GaugeData
    ) {
        try {
            val totalMinutesInDay = 24 * 60

            // 経過時間の割合
            val elapsedPercent = (data.currentMinutes.toFloat() / totalMinutesInDay.toFloat()) * 100f

            // 予定タスク時間の割合（経過時間からの相対）
            val scheduledPercent = ((data.currentMinutes + data.scheduledMinutes).toFloat() / totalMinutesInDay.toFloat()) * 100f

            // ProgressBarを使用してゲージを表示
            // secondaryProgressが経過時間（灰色）、progressが予定タスク時間（黒）
            views.setProgressBar(R.id.widget_gauge_progress, 100, scheduledPercent.toInt().coerceAtMost(100), false)
            views.setInt(R.id.widget_gauge_progress, "setSecondaryProgress", elapsedPercent.toInt().coerceAtMost(100))

            // 空き時間の表示
            val hours = data.freeTimeMinutes / 60
            val minutes = data.freeTimeMinutes % 60
            val freeTimeText = if (data.freeTimeMinutes < 0) {
                val overMinutes = -data.freeTimeMinutes
                val overHours = overMinutes / 60
                val overMins = overMinutes % 60
                if (overHours > 0) {
                    "時間オーバー: ${overHours}時間${if (overMins > 0) "${overMins}分" else ""}"
                } else {
                    "時間オーバー: ${overMins}分"
                }
            } else {
                if (hours > 0) {
                    "空き時間: ${hours}時間${if (minutes > 0) "${minutes}分" else ""}"
                } else if (minutes > 0) {
                    "空き時間: ${minutes}分"
                } else {
                    "ぴったり（余裕なし）"
                }
            }
            views.setTextViewText(R.id.widget_free_time, freeTimeText)

            appWidgetManager.updateAppWidget(appWidgetId, views)
            android.util.Log.d(TAG, "Gauge widget updated successfully")
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error in updateWidgetWithData", e)
        }
    }

    private data class GaugeData(
        val currentMinutes: Int,
        val scheduledMinutes: Int,
        val freeTimeMinutes: Int,
        val densityPercent: Float
    )
}
