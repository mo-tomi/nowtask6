// ========================================
// カスタマイズ機能
// ========================================

/**
 * カスタマイズ設定のデフォルト値
 */
const DEFAULT_CUSTOMIZATION = {
  // 表示設定
  display: {
    taskDensity: 'normal',        // タスクリストの密度: 'compact' | 'normal' | 'spacious'
    weekStartDay: 0,              // 週の開始曜日: 0 = 日曜日, 1 = 月曜日
    showCompletedTasks: true,     // 完了済みタスクの表示
    taskSortOrder: 'priority'     // タスクの並び順: 'priority' | 'time' | 'manual'
  },

  // 通知設定
  notifications: {
    enabled: true,                // 通知の有効/無効
    defaultReminderTime: 30,      // デフォルトのリマインダー時間（分前）
    reminderRepeat: false,        // リマインダーの繰り返し
    repeatInterval: 5,            // 繰り返し間隔（分）
    soundEnabled: true,           // 通知音の有効/無効
    vibrationEnabled: true        // バイブレーションの有効/無効
  },

  // ゲージ設定
  gauge: {
    visible: true,                // ゲージの表示/非表示
    densityThreshold: 80,         // 密度閾値（%）
    showDensityWarning: true,     // 密度警告の表示
    colorScheme: 'default',       // カラースキーム: 'default' | 'grayscale' | 'custom'
    customColors: {
      elapsed: '#666666',         // 経過時間の色
      scheduled: '#000000',       // 予定時間の色
      free: '#e0e0e0'            // 空き時間の色
    }
  }
};

/**
 * カスタマイズ設定を読み込む
 */
function loadCustomization() {
  try {
    const saved = localStorage.getItem('customization');
    if (saved) {
      const parsed = JSON.parse(saved);
      // デフォルト値とマージ（新しい設定項目に対応）
      return {
        display: { ...DEFAULT_CUSTOMIZATION.display, ...(parsed.display || {}) },
        notifications: { ...DEFAULT_CUSTOMIZATION.notifications, ...(parsed.notifications || {}) },
        gauge: { ...DEFAULT_CUSTOMIZATION.gauge, ...(parsed.gauge || {}) }
      };
    }
  } catch (error) {
    console.error('Failed to load customization:', error);
  }
  return JSON.parse(JSON.stringify(DEFAULT_CUSTOMIZATION));
}

/**
 * カスタマイズ設定を保存する
 */
function saveCustomization(customization) {
  try {
    localStorage.setItem('customization', JSON.stringify(customization));
    console.log('Customization saved:', customization);
    return true;
  } catch (error) {
    console.error('Failed to save customization:', error);
    return false;
  }
}

/**
 * タスク密度の適用
 */
function applyTaskDensity(density) {
  const taskList = document.getElementById('task-list');
  if (!taskList) return;

  // 既存のクラスを削除
  taskList.classList.remove('density-compact', 'density-normal', 'density-spacious');

  // 新しいクラスを追加
  if (density !== 'normal') {
    taskList.classList.add(`density-${density}`);
  }
}

/**
 * 週の開始曜日を適用
 */
function applyWeekStartDay(startDay) {
  // この設定は主にカレンダー表示やレポート機能で使用
  // 現時点ではローカルストレージに保存するのみ
  console.log('Week start day set to:', startDay === 0 ? 'Sunday' : 'Monday');
}

/**
 * 完了済みタスクの表示/非表示を適用
 */
function applyShowCompletedTasks(show) {
  const taskItems = document.querySelectorAll('.task-item.completed');
  taskItems.forEach(item => {
    item.style.display = show ? '' : 'none';
  });
}

/**
 * タスクの並び順を適用
 */
function applyTaskSortOrder(order) {
  // この設定はタスクレンダリング時に使用
  console.log('Task sort order set to:', order);
  // render.js の renderTaskList 関数で使用される
}

/**
 * ゲージの表示/非表示を適用
 */
function applyGaugeVisibility(visible) {
  const gaugeContainer = document.getElementById('time-gauge-container');
  if (gaugeContainer) {
    gaugeContainer.style.display = visible ? '' : 'none';
  }
}

/**
 * ゲージの密度閾値を適用
 */
function applyGaugeDensityThreshold(threshold) {
  // この設定は gauge.js の updateTimeGauge 関数で使用される
  console.log('Gauge density threshold set to:', threshold + '%');
}

/**
 * ゲージのカラースキームを適用
 */
function applyGaugeColorScheme(scheme, customColors) {
  const elapsedBar = document.getElementById('time-gauge-elapsed');
  const scheduledBar = document.getElementById('time-gauge-scheduled');
  const freeBar = document.getElementById('time-gauge-free');

  if (!elapsedBar || !scheduledBar || !freeBar) return;

  if (scheme === 'default') {
    // デフォルトカラー
    elapsedBar.style.backgroundColor = '#666666';
    scheduledBar.style.backgroundColor = '#000000';
    freeBar.style.backgroundColor = '#e0e0e0';
  } else if (scheme === 'grayscale') {
    // グレースケール
    elapsedBar.style.backgroundColor = '#888888';
    scheduledBar.style.backgroundColor = '#444444';
    freeBar.style.backgroundColor = '#cccccc';
  } else if (scheme === 'custom' && customColors) {
    // カスタムカラー
    elapsedBar.style.backgroundColor = customColors.elapsed;
    scheduledBar.style.backgroundColor = customColors.scheduled;
    freeBar.style.backgroundColor = customColors.free;
  }
}

/**
 * 通知設定を適用
 */
function applyNotificationSettings(notifications) {
  // Android側の通知設定を更新
  if (typeof Android !== 'undefined' && Android.updateNotificationSettings) {
    try {
      Android.updateNotificationSettings(JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to update Android notification settings:', error);
    }
  }
  console.log('Notification settings applied:', notifications);
}

/**
 * 全てのカスタマイズ設定を適用
 */
function applyAllCustomization(customization) {
  console.log('Applying all customization:', customization);

  // 表示設定
  applyTaskDensity(customization.display.taskDensity);
  applyWeekStartDay(customization.display.weekStartDay);
  applyShowCompletedTasks(customization.display.showCompletedTasks);
  applyTaskSortOrder(customization.display.taskSortOrder);

  // ゲージ設定
  applyGaugeVisibility(customization.gauge.visible);
  applyGaugeDensityThreshold(customization.gauge.densityThreshold);
  applyGaugeColorScheme(customization.gauge.colorScheme, customization.gauge.customColors);

  // 通知設定
  applyNotificationSettings(customization.notifications);
}

/**
 * カスタマイズ設定UIの初期化
 */
function initCustomizationUI() {
  const customization = loadCustomization();

  // 表示設定
  const taskDensitySelect = document.getElementById('task-density');
  const weekStartDaySelect = document.getElementById('week-start-day');
  const showCompletedCheckbox = document.getElementById('show-completed-tasks');
  const taskSortOrderSelect = document.getElementById('task-sort-order');

  if (taskDensitySelect) {
    taskDensitySelect.value = customization.display.taskDensity;
    taskDensitySelect.addEventListener('change', (e) => {
      customization.display.taskDensity = e.target.value;
      applyTaskDensity(e.target.value);
      saveCustomization(customization);
    });
  }

  if (weekStartDaySelect) {
    weekStartDaySelect.value = customization.display.weekStartDay;
    weekStartDaySelect.addEventListener('change', (e) => {
      customization.display.weekStartDay = parseInt(e.target.value);
      applyWeekStartDay(parseInt(e.target.value));
      saveCustomization(customization);
    });
  }

  if (showCompletedCheckbox) {
    showCompletedCheckbox.checked = customization.display.showCompletedTasks;
    showCompletedCheckbox.addEventListener('change', (e) => {
      customization.display.showCompletedTasks = e.target.checked;
      applyShowCompletedTasks(e.target.checked);
      saveCustomization(customization);
    });
  }

  if (taskSortOrderSelect) {
    taskSortOrderSelect.value = customization.display.taskSortOrder;
    taskSortOrderSelect.addEventListener('change', (e) => {
      customization.display.taskSortOrder = e.target.value;
      applyTaskSortOrder(e.target.value);
      saveCustomization(customization);
      // タスクリストを再描画
      if (typeof renderTaskList === 'function') {
        renderTaskList();
      }
    });
  }

  // 通知設定
  const notificationsEnabledCheckbox = document.getElementById('notifications-enabled');
  const defaultReminderTimeInput = document.getElementById('default-reminder-time');
  const reminderRepeatCheckbox = document.getElementById('reminder-repeat');
  const repeatIntervalInput = document.getElementById('repeat-interval');
  const soundEnabledCheckbox = document.getElementById('sound-enabled');
  const vibrationEnabledCheckbox = document.getElementById('vibration-enabled');

  if (notificationsEnabledCheckbox) {
    notificationsEnabledCheckbox.checked = customization.notifications.enabled;
    notificationsEnabledCheckbox.addEventListener('change', (e) => {
      customization.notifications.enabled = e.target.checked;
      saveCustomization(customization);
      applyNotificationSettings(customization.notifications);
    });
  }

  if (defaultReminderTimeInput) {
    defaultReminderTimeInput.value = customization.notifications.defaultReminderTime;
    defaultReminderTimeInput.addEventListener('change', (e) => {
      customization.notifications.defaultReminderTime = parseInt(e.target.value);
      saveCustomization(customization);
    });
  }

  if (reminderRepeatCheckbox) {
    reminderRepeatCheckbox.checked = customization.notifications.reminderRepeat;
    reminderRepeatCheckbox.addEventListener('change', (e) => {
      customization.notifications.reminderRepeat = e.target.checked;
      saveCustomization(customization);
      applyNotificationSettings(customization.notifications);
    });
  }

  if (repeatIntervalInput) {
    repeatIntervalInput.value = customization.notifications.repeatInterval;
    repeatIntervalInput.addEventListener('change', (e) => {
      customization.notifications.repeatInterval = parseInt(e.target.value);
      saveCustomization(customization);
    });
  }

  if (soundEnabledCheckbox) {
    soundEnabledCheckbox.checked = customization.notifications.soundEnabled;
    soundEnabledCheckbox.addEventListener('change', (e) => {
      customization.notifications.soundEnabled = e.target.checked;
      saveCustomization(customization);
      applyNotificationSettings(customization.notifications);
    });
  }

  if (vibrationEnabledCheckbox) {
    vibrationEnabledCheckbox.checked = customization.notifications.vibrationEnabled;
    vibrationEnabledCheckbox.addEventListener('change', (e) => {
      customization.notifications.vibrationEnabled = e.target.checked;
      saveCustomization(customization);
      applyNotificationSettings(customization.notifications);
    });
  }

  // ゲージ設定
  const gaugeVisibleCheckbox = document.getElementById('gauge-visible');
  const densityThresholdInput = document.getElementById('density-threshold');
  const showDensityWarningCheckbox = document.getElementById('show-density-warning');
  const colorSchemeSelect = document.getElementById('color-scheme');

  if (gaugeVisibleCheckbox) {
    gaugeVisibleCheckbox.checked = customization.gauge.visible;
    gaugeVisibleCheckbox.addEventListener('change', (e) => {
      customization.gauge.visible = e.target.checked;
      applyGaugeVisibility(e.target.checked);
      saveCustomization(customization);
    });
  }

  if (densityThresholdInput) {
    densityThresholdInput.value = customization.gauge.densityThreshold;
    densityThresholdInput.addEventListener('change', (e) => {
      customization.gauge.densityThreshold = parseInt(e.target.value);
      applyGaugeDensityThreshold(parseInt(e.target.value));
      saveCustomization(customization);
    });
  }

  if (showDensityWarningCheckbox) {
    showDensityWarningCheckbox.checked = customization.gauge.showDensityWarning;
    showDensityWarningCheckbox.addEventListener('change', (e) => {
      customization.gauge.showDensityWarning = e.target.checked;
      saveCustomization(customization);
    });
  }

  if (colorSchemeSelect) {
    colorSchemeSelect.value = customization.gauge.colorScheme;
    colorSchemeSelect.addEventListener('change', (e) => {
      customization.gauge.colorScheme = e.target.value;
      applyGaugeColorScheme(e.target.value, customization.gauge.customColors);
      saveCustomization(customization);
    });
  }

  // カスタムカラーピッカー
  const elapsedColorInput = document.getElementById('elapsed-color');
  const scheduledColorInput = document.getElementById('scheduled-color');
  const freeColorInput = document.getElementById('free-color');

  if (elapsedColorInput) {
    elapsedColorInput.value = customization.gauge.customColors.elapsed;
    elapsedColorInput.addEventListener('change', (e) => {
      customization.gauge.customColors.elapsed = e.target.value;
      if (customization.gauge.colorScheme === 'custom') {
        applyGaugeColorScheme('custom', customization.gauge.customColors);
      }
      saveCustomization(customization);
    });
  }

  if (scheduledColorInput) {
    scheduledColorInput.value = customization.gauge.customColors.scheduled;
    scheduledColorInput.addEventListener('change', (e) => {
      customization.gauge.customColors.scheduled = e.target.value;
      if (customization.gauge.colorScheme === 'custom') {
        applyGaugeColorScheme('custom', customization.gauge.customColors);
      }
      saveCustomization(customization);
    });
  }

  if (freeColorInput) {
    freeColorInput.value = customization.gauge.customColors.free;
    freeColorInput.addEventListener('change', (e) => {
      customization.gauge.customColors.free = e.target.value;
      if (customization.gauge.colorScheme === 'custom') {
        applyGaugeColorScheme('custom', customization.gauge.customColors);
      }
      saveCustomization(customization);
    });
  }

  console.log('Customization UI initialized');
}

/**
 * カスタマイズ機能の初期化
 */
function initCustomization() {
  console.log('Initializing customization...');

  // 設定を読み込んで適用
  const customization = loadCustomization();
  applyAllCustomization(customization);

  // UIの初期化
  initCustomizationUI();

  console.log('Customization initialized');
}

// DOMロード後に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCustomization);
} else {
  initCustomization();
}
