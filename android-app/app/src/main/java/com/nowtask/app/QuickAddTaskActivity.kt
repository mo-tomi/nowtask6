package com.nowtask.app

import android.app.TimePickerDialog
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.auth.FirebaseAuth
import com.nowtask.app.data.local.AppDatabase
import com.nowtask.app.widget.GaugeWidgetProvider
import com.nowtask.app.widget.TaskWidgetProvider
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

/**
 * クイックタスク追加Activity
 *
 * ウィジェットから呼び出されるシンプルなタスク追加画面
 */
class QuickAddTaskActivity : AppCompatActivity() {

    private lateinit var editTaskName: EditText
    private lateinit var btnStartTime: Button
    private lateinit var btnEndTime: Button
    private lateinit var btnSave: Button
    private lateinit var btnCancel: Button

    private var startTimeHour: Int? = null
    private var startTimeMinute: Int? = null
    private var endTimeHour: Int? = null
    private var endTimeMinute: Int? = null

    companion object {
        private const val TAG = "QuickAddTaskActivity"
        private const val TASKS_KEY = "nowtask_tasks"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // ダイアログスタイルで表示
        setContentView(R.layout.activity_quick_add_task)

        editTaskName = findViewById(R.id.edit_task_name)
        btnStartTime = findViewById(R.id.btn_start_time)
        btnEndTime = findViewById(R.id.btn_end_time)
        btnSave = findViewById(R.id.btn_save)
        btnCancel = findViewById(R.id.btn_cancel)

        // 開始時刻選択
        btnStartTime.setOnClickListener {
            showTimePicker { hour, minute ->
                startTimeHour = hour
                startTimeMinute = minute
                btnStartTime.text = "開始: ${String.format("%02d:%02d", hour, minute)}"
            }
        }

        // 終了時刻選択
        btnEndTime.setOnClickListener {
            showTimePicker { hour, minute ->
                endTimeHour = hour
                endTimeMinute = minute
                btnEndTime.text = "終了: ${String.format("%02d:%02d", hour, minute)}"
            }
        }

        // 保存ボタン
        btnSave.setOnClickListener {
            saveTask()
        }

        // キャンセルボタン
        btnCancel.setOnClickListener {
            finish()
        }
    }

    private fun showTimePicker(onTimeSelected: (Int, Int) -> Unit) {
        val calendar = Calendar.getInstance()
        val hour = calendar.get(Calendar.HOUR_OF_DAY)
        val minute = calendar.get(Calendar.MINUTE)

        TimePickerDialog(this, { _, selectedHour, selectedMinute ->
            onTimeSelected(selectedHour, selectedMinute)
        }, hour, minute, true).show()
    }

    private fun saveTask() {
        val taskName = editTaskName.text.toString().trim()

        if (taskName.isEmpty()) {
            Toast.makeText(this, "タスク名を入力してください", Toast.LENGTH_SHORT).show()
            return
        }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val auth = FirebaseAuth.getInstance()
                val uid = auth.currentUser?.uid

                if (uid == null) {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(this@QuickAddTaskActivity, "ログインが必要です", Toast.LENGTH_SHORT).show()
                        finish()
                    }
                    return@launch
                }

                // Room Databaseからタスクリストを取得
                val database = AppDatabase.getInstance(this@QuickAddTaskActivity)
                val dao = database.keyValueDao()
                val tasksEntity = dao.getByKey(TASKS_KEY, uid)

                val tasksJson = if (tasksEntity != null) {
                    JSONArray(tasksEntity.value)
                } else {
                    JSONArray()
                }

                // 新しいタスクを作成
                val newTask = JSONObject()
                newTask.put("id", UUID.randomUUID().toString())
                newTask.put("title", taskName)
                newTask.put("isCompleted", false)

                // 時刻が設定されている場合
                if (startTimeHour != null && startTimeMinute != null && endTimeHour != null && endTimeMinute != null) {
                    val startTime = String.format("%02d:%02d", startTimeHour, startTimeMinute)
                    val endTime = String.format("%02d:%02d", endTimeHour, endTimeMinute)

                    newTask.put("startTime", startTime)
                    newTask.put("endTime", endTime)

                    // ISO形式で日時を設定
                    val calendar = Calendar.getInstance()
                    calendar.set(Calendar.HOUR_OF_DAY, startTimeHour!!)
                    calendar.set(Calendar.MINUTE, startTimeMinute!!)
                    calendar.set(Calendar.SECOND, 0)
                    calendar.set(Calendar.MILLISECOND, 0)

                    val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
                    newTask.put("dueDate", isoFormat.format(calendar.time))
                } else {
                    // 時刻未設定の場合は期限なし
                    newTask.put("dueDate", JSONObject.NULL)
                }

                newTask.put("createdAt", System.currentTimeMillis())

                // タスクリストに追加
                tasksJson.put(newTask)

                // データベースに保存
                val entity = com.nowtask.app.data.local.KeyValueEntity(
                    key = TASKS_KEY,
                    value = tasksJson.toString(),
                    userId = uid,
                    timestamp = System.currentTimeMillis(),
                    syncStatus = com.nowtask.app.data.local.SyncStatus.PENDING
                )
                dao.insert(entity)

                android.util.Log.d(TAG, "Task saved: $taskName")

                // ウィジェットを更新
                TaskWidgetProvider.updateWidget(this@QuickAddTaskActivity)
                GaugeWidgetProvider.updateWidget(this@QuickAddTaskActivity)

                withContext(Dispatchers.Main) {
                    Toast.makeText(this@QuickAddTaskActivity, "タスクを追加しました", Toast.LENGTH_SHORT).show()
                    finish()
                }

            } catch (e: Exception) {
                android.util.Log.e(TAG, "Error saving task", e)
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@QuickAddTaskActivity, "エラーが発生しました", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}
