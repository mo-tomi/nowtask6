// ========================================
// 定数定義
// ========================================
const STORAGE_KEYS = {
  TASKS: 'nowtask_tasks',
  TRASH: 'nowtask_trash',
  SHELVED: 'nowtask_shelved',
  SORT_PREFERENCE: 'nowtask_sort_pref',
  SETTINGS: 'nowtask_settings',
  ROUTINES: 'nowtask_routines'
  // 履歴用キー（最新20件を保存）
  ,TASK_HISTORY: 'nowtask_task_history',
  TEMPLATES: 'nowtask_templates'
};

const TRASH_RETENTION_DAYS = 30;

// ========================================
// グローバル変数
// ========================================
let currentTab = 'tasks';
let editingTaskId = null;
// ========================================
// 履歴管理（クイック入力で使う過去のタスク情報）
// ========================================
// 履歴を取得（配列、最新が先頭）
function getTaskHistory(limit = 20) {
  return loadFromStorage(STORAGE_KEYS.TASK_HISTORY, []).slice(0, limit);
}

// 履歴を丸ごと保存
function saveTaskHistory(list) {
  // 最新が先頭であることを期待する
  const toSave = Array.isArray(list) ? list.slice(0, 20) : [];
  return saveToStorage(STORAGE_KEYS.TASK_HISTORY, toSave);
}

// タスク情報を履歴に追加（重複は削除、最新を先頭に、最大 limit 件）
function addToTaskHistory(title, startTime = null, endTime = null, limit = 20) {
  if (!title || typeof title !== 'string') return false;
  const trimmed = title.trim();
  if (trimmed.length === 0) return false;

  const history = loadFromStorage(STORAGE_KEYS.TASK_HISTORY, []);

  // 既存の同一タイトルエントリを取り除く（大文字小文字を区別しない）
  const normalized = history.filter(item => {
    const itemTitle = typeof item === 'string' ? item : (item.title || '');
    return itemTitle.toLowerCase() !== trimmed.toLowerCase();
  });

  // 新しい履歴エントリ（タイトルと時間情報）
  const newEntry = {
    title: trimmed,
    startTime: startTime || null,
    endTime: endTime || null
  };

  // 先頭に追加
  normalized.unshift(newEntry);

  // 上限を超えたら切り詰め
  const limited = normalized.slice(0, limit);
  return saveToStorage(STORAGE_KEYS.TASK_HISTORY, limited);
}
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

// データキャッシュ（メモリ上に保持）
let dataCache = {};

// Firestore保存（FirestoreBridgeを使用、キャッシュも更新）
function saveToStorage(key, data) {
  try {
    // メモリキャッシュに保存
    dataCache[key] = data;

    // Firestoreに保存（Androidの場合）
    if (typeof FirestoreBridge !== 'undefined') {
      FirestoreBridge.saveData(key, JSON.stringify(data));
    } else {
      console.warn('FirestoreBridge is not available');
    }

    return true;
  } catch (e) {
    console.error('保存エラー:', e);
    return false;
  }
}

// Firestore読み込み（キャッシュ経由、非同期でFirestoreから更新）
function loadFromStorage(key, defaultValue = []) {
  try {
    // キャッシュにデータがあればそれを返す
    if (dataCache.hasOwnProperty(key)) {
      return dataCache[key];
    }

    // Firestoreから読み込み（Androidの場合）
    if (typeof FirestoreBridge !== 'undefined') {
      // 非同期で読み込み、コールバックで更新
      const callbackName = `handleFirestoreData_${key.replace(/[^a-zA-Z0-9]/g, '_')}`;
      FirestoreBridge.loadData(key, callbackName);
    }

    // 初回はデフォルト値を返す
    dataCache[key] = defaultValue;
    return defaultValue;
  } catch (e) {
    console.error('読み込みエラー:', e);
    return defaultValue;
  }
}

// Firestoreからのデータを受け取る汎用コールバック関数
function handleFirestoreCallback(key, data) {
  if (data) {
    try {
      const parsedData = JSON.parse(data);
      dataCache[key] = parsedData;

      // データが更新されたら画面を再描画
      if (typeof renderTasks === 'function') {
        renderTasks();
      }
      if (typeof updateTimeGauge === 'function' && key === STORAGE_KEYS.TASKS) {
        updateTimeGauge(currentGaugeDate || formatDateISO(new Date()));
      }
    } catch (e) {
      console.error('Firestoreデータのパースエラー:', key, e);
    }
  }
}

// 全てのSTORAGE_KEYSに対応するコールバック関数を生成
Object.keys(STORAGE_KEYS).forEach(keyName => {
  const key = STORAGE_KEYS[keyName];
  const callbackName = `handleFirestoreData_${key.replace(/[^a-zA-Z0-9]/g, '_')}`;
  window[callbackName] = function(data) {
    handleFirestoreCallback(key, data);
  };
});

// 日時フォーマット
function formatDateTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

// 期限切れチェック
function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

// 時間フォーマット（秒 → HH:MM:SS）
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
