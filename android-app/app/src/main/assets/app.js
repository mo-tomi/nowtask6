// ========================================
// 定数定義
// ========================================
const STORAGE_KEYS = {
  TASKS: 'nowtask_tasks',
  TRASH: 'nowtask_trash',
  SETTINGS: 'nowtask_settings'
};

const TRASH_RETENTION_DAYS = 30;

// ========================================
// グローバル変数
// ========================================
let currentTab = 'tasks';
let editingTaskId = null;
let timerInterval = null;
let editingSubtasks = [];

// ========================================
// ユーティリティ関数
// ========================================

// UUID生成
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// localStorage保存
function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      alert('ストレージ容量不足です');
    } else {
      console.error('保存エラー:', e);
    }
    return false;
  }
}

// localStorage読み込み
function loadFromStorage(key, defaultValue = []) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error('読み込みエラー:', e);
    return defaultValue;
  }
}

// ... (rest of the original app.js content)