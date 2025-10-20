// ========================================
// レンダリング関数
// ========================================

// グローバル変数（インライン追加中のタスク）
let addingSubtaskForTaskId = null;

// 複数選択モード用グローバル変数
let isSelectionMode = false;
let selectedTaskIds = new Set();

// 日付ごとにタスクをグループ化
function groupTasksByDate(tasks) {
  const groups = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  tasks.forEach(task => {
    let dateKey, label;

    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      // 今日、明日、昨日、それ以外で判定
      if (dueDate.getTime() === today.getTime()) {
        dateKey = 'today';
        label = '今日 ' + formatDate(task.dueDate);
      } else if (dueDate.getTime() === tomorrow.getTime()) {
        dateKey = 'tomorrow';
        label = '明日 ' + formatDate(task.dueDate);
      } else if (dueDate.getTime() === yesterday.getTime()) {
        dateKey = 'yesterday';
        label = '昨日 ' + formatDate(task.dueDate);
      } else if (dueDate < today) {
        dateKey = 'overdue_' + dueDate.getTime();
        label = formatDate(task.dueDate) + ' (期限切れ)';
      } else {
        dateKey = 'future_' + dueDate.getTime();
        label = formatDate(task.dueDate);
      }
    } else {
      dateKey = 'no_date';
      label = '期限なし';
    }

    if (!groups[dateKey]) {
      // dateObj はそのグループの日付（午前0時）を保持する。期限なしは null。
      let dateObj = null;
      if (task.dueDate) {
        dateObj = new Date(task.dueDate);
        dateObj.setHours(0, 0, 0, 0);
      }
      groups[dateKey] = { date: dateKey, label, tasks: [], sortOrder: getSortOrder(dateKey, task.dueDate), dateObj };
    }
    groups[dateKey].tasks.push(task);
  });

  // ソート順序: 期限切れ → 昨日 → 今日 → 明日 → 未来 → 期限なし
  return Object.values(groups).sort((a, b) => a.sortOrder - b.sortOrder);
}

function getSortOrder(dateKey, dueDate) {
  if (dateKey.startsWith('overdue_')) return -1000 + new Date(dueDate).getTime();
  if (dateKey === 'yesterday') return -2;
  if (dateKey === 'today') return -1;
  if (dateKey === 'tomorrow') return 0;
  if (dateKey.startsWith('future_')) return 1000 + new Date(dueDate).getTime();
  return 10000; // 期限なし
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[date.getDay()];
  return `${month}月${day}日 (${weekday})`;
}

// Date オブジェクトを YYYY-MM-DD 形式の文字列に変換（null 安全）
function formatDateISO(dateObj) {
  if (!dateObj) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// グローバルフィルター状態
let currentFilter = null; // 'urgent' | 'high-priority' | null

// グローバル検索キーワード（ハイライト表示用）
let currentSearchKeyword = '';

// ========================================
// UI バージョン判定ヘルパー
// ========================================
function isNewUIEnabled() {
  const version = localStorage.getItem('ui-version') || 'new';
  return version === 'new';
}

// ========================================
// 新タスクカード レンダリング
// ========================================

/**
 * 新タスクカード用メタ情報を作成
 */
function createNewTaskMeta(task) {
  const meta = document.createElement('div');
  meta.className = 'new-task-meta';

  // 所要時間バッジ
  if (task.duration) {
    const hours = Math.floor(task.duration / 60);
    const minutes = task.duration % 60;
    let durationText = '';
    if (hours > 0) {
      durationText = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } else {
      durationText = `${minutes}m`;
    }

    const durationBadge = document.createElement('span');
    durationBadge.className = 'new-duration-badge';
    durationBadge.textContent = `⏰ ${durationText}`;
    meta.appendChild(durationBadge);
  }

  // 緊急バッジ
  if (task.urgent) {
    const urgentBadge = document.createElement('span');
    urgentBadge.className = 'new-urgent-badge';
    urgentBadge.textContent = '🚨 緊急';
    meta.appendChild(urgentBadge);
  }

  return meta;
}

/**
 * 新タスクカード構造を作成
 */
