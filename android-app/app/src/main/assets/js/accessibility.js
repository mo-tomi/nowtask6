// ========================================
// フェーズ 6.7: アクセシビリティの向上
// ========================================

/**
 * ARIA ラベルとロールの一元管理
 */
const ACCESSIBILITY_CONFIG = {
  buttons: {
    'create-task-btn': {
      label: '新規タスク作成',
      role: 'button'
    },
    'select-mode-icon-btn': {
      label: '複数選択モード',
      role: 'button'
    },
    'quick-date-btn': {
      label: '日付と時間を設定',
      role: 'button'
    },
    'quick-history-btn': {
      label: 'タスク履歴',
      role: 'button'
    },
    'bulk-select-all-btn': {
      label: 'すべて選択/解除',
      role: 'button'
    },
    'bulk-complete-btn': {
      label: '選択したタスクを完了',
      role: 'button'
    },
    'bulk-delete-btn': {
      label: '選択したタスクを削除',
      role: 'button'
    },
    'bulk-date-btn': {
      label: '選択したタスクの日付を変更',
      role: 'button'
    },
    'bulk-priority-btn': {
      label: '選択したタスクの優先度を変更',
      role: 'button'
    }
  },

  inputs: {
    'quick-add-input': {
      label: 'タスク名を入力してEnter',
      role: 'searchbox'
    },
    'search-input': {
      label: 'タスクを検索',
      role: 'searchbox'
    },
    'task-title': {
      label: 'タスク名',
      role: 'textbox'
    },
    'task-memo': {
      label: 'メモ',
      role: 'textbox'
    },
    'task-due-date': {
      label: '期限日を選択',
      role: 'application'
    },
    'task-start-time': {
      label: '開始時刻',
      role: 'textbox'
    },
    'task-end-time': {
      label: '終了時刻',
      role: 'textbox'
    },
    'task-duration': {
      label: '所要時間を選択',
      role: 'combobox'
    },
    'task-priority': {
      label: '優先度を選択',
      role: 'combobox'
    }
  },

  regions: {
    'tasks-tab': {
      role: 'region',
      label: 'タスクリスト'
    },
    'time-gauge-container': {
      role: 'region',
      label: '24時間タイムゲージ'
    },
    'bulk-actions-toolbar': {
      role: 'region',
      label: 'バッチ操作ツールバー'
    },
    'completed-section': {
      role: 'region',
      label: '完了済みタスク'
    }
  }
};

/**
 * ARIA ラベルを初期化
 */
function initializeAriaLabels() {
  // ボタンの ARIA ラベル設定
  Object.entries(ACCESSIBILITY_CONFIG.buttons).forEach(([id, config]) => {
    const element = document.getElementById(id);
    if (element) {
      element.setAttribute('aria-label', config.label);
      if (config.role) {
        element.setAttribute('role', config.role);
      }
    }
  });

  // 入力フィールドの ARIA ラベル設定
  Object.entries(ACCESSIBILITY_CONFIG.inputs).forEach(([id, config]) => {
    const element = document.getElementById(id);
    if (element) {
      element.setAttribute('aria-label', config.label);
      if (config.role) {
        element.setAttribute('role', config.role);
      }
      // label 要素と紐付け
      const labelElement = document.querySelector(`label[for="${id}"]`);
      if (labelElement) {
        element.setAttribute('aria-labelledby', labelElement.id || id);
      }
    }
  });

  // リージョンの ARIA ラベル設定
  Object.entries(ACCESSIBILITY_CONFIG.regions).forEach(([id, config]) => {
    const element = document.getElementById(id);
    if (element) {
      element.setAttribute('role', config.role);
      element.setAttribute('aria-label', config.label);
    }
  });
}

/**
 * タスク項目に ARIA 属性を設定
 */
function setTaskItemAriaAttributes(taskElement, task) {
  if (!taskElement || !task) return;

  // タスク項目全体の ARIA ラベル
  const ariaLabel = `${task.title}, 期限: ${formatDateForAria(task.dueDate)}, ` +
    `${task.isCompleted ? '完了' : '未完了'}`;
  taskElement.setAttribute('aria-label', ariaLabel);
  taskElement.setAttribute('role', 'listitem');

  // チェックボックスの ARIA 属性
  const checkbox = taskElement.querySelector('input[type="checkbox"]');
  if (checkbox) {
    checkbox.setAttribute('aria-label', `${task.title}を${task.isCompleted ? '未完了に' : '完了に'}変更`);
    checkbox.setAttribute('aria-checked', task.isCompleted);
  }

  // 時間情報の ARIA 属性
  if (task.startTime && task.endTime) {
    const timeElement = taskElement.querySelector('.task-time');
    if (timeElement) {
      timeElement.setAttribute('aria-label', `時間: ${task.startTime} から ${task.endTime}`);
    }
  }

  // 優先度の ARIA 属性
  if (task.priority) {
    const priorityElement = taskElement.querySelector('.task-priority');
    if (priorityElement) {
      priorityElement.setAttribute('aria-label', `優先度: ${task.priority}`);
    }
  }
}

/**
 * フォーカス管理の初期化
 */
function initializeFocusManagement() {
  // タスク削除後のフォーカス移動
  document.addEventListener('task:deleted', (e) => {
    const taskElement = e.detail.element;
    const nextElement = taskElement.nextElementSibling || taskElement.previousElementSibling;
    if (nextElement) {
      nextElement.focus();
    } else {
      document.getElementById('create-task-btn')?.focus();
    }
  });

  // モーダル表示時のフォーカストラップ
  document.addEventListener('modal:open', (e) => {
    const modal = e.detail.modal;
    setModalFocusTrap(modal);
  });

  // Escape キーでモーダルを閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal:not([style*="display: none"])');
      if (openModal && typeof closeModal === 'function') {
        closeModal();
      }
    }
  });
}

/**
 * モーダルにフォーカストラップを設定
 */
function setModalFocusTrap(modal) {
  const focusableElements = modal.querySelectorAll(
    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusableElement = focusableElements[0];
  const lastFocusableElement = focusableElements[focusableElements.length - 1];

  firstFocusableElement?.focus();

  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusableElement) {
        lastFocusableElement?.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusableElement) {
        firstFocusableElement?.focus();
        e.preventDefault();
      }
    }
  });
}

/**
 * スクリーンリーダー向けのライブリージョン通知
 */
function announceToScreenReader(message, priority = 'polite') {
  let liveRegion = document.getElementById('sr-live-region');

  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'sr-live-region';
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    document.body.appendChild(liveRegion);
  }

  liveRegion.setAttribute('aria-live', priority);
  liveRegion.textContent = message;

  // 内容をクリア（次の通知に備えて）
  setTimeout(() => {
    liveRegion.textContent = '';
  }, 3000);
}

/**
 * コントラスト比の改善状態をチェック
 */
function checkContrastRatio() {
  const style = window.getComputedStyle(document.body);
  const bgColor = style.backgroundColor;
  const textColor = style.color;

  // コントラスト比を計算（簡易版）
  const ratio = calculateContrast(bgColor, textColor);
  console.log(`Current contrast ratio: ${ratio.toFixed(2)}`);

  // WCAG AA 基準（4.5:1）をチェック
  if (ratio < 4.5) {
    console.warn('⚠️ コントラスト比が WCAG AA 基準を満たしていません');
  }
}

/**
 * RGB 色からコントラスト比を計算
 */
function calculateContrast(color1, color2) {
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);

  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 色をパース
 */
function parseColor(color) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const imageData = ctx.getImageData(0, 0, 1, 1);
  return imageData.data.slice(0, 3);
}

/**
 * 相対輝度を計算
 */
function getLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map(val => {
    val = val / 255;
    return val <= 0.03928
      ? val / 12.92
      : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * ハイコントラストモードの対応チェック
 */
function checkHighContrastMode() {
  const isHighContrast = window.matchMedia('(prefers-contrast: more)').matches;
  if (isHighContrast) {
    document.documentElement.classList.add('high-contrast-mode');
    console.log('✅ ハイコントラストモード対応');
  }
}

/**
 * フォントサイズの最小値チェック
 */
function checkMinFontSize() {
  const minFontSize = 14; // px
  const elements = document.querySelectorAll('*');

  let violatingElements = 0;
  elements.forEach(el => {
    const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
    if (fontSize < minFontSize && el.textContent.trim().length > 0) {
      violatingElements++;
      if (violatingElements <= 5) {
        console.warn(`フォントサイズが小さすぎます: ${fontSize}px`, el);
      }
    }
  });

  if (violatingElements > 0) {
    console.warn(`⚠️ 最小フォントサイズ未満の要素: ${violatingElements}個`);
  }
}

/**
 * タップ領域の最小サイズチェック
 */
function checkTapTargetSize() {
  const minSize = 44; // px
  const buttons = document.querySelectorAll('button, a, [role="button"]');

  let violatingButtons = 0;
  buttons.forEach(btn => {
    const rect = btn.getBoundingClientRect();
    if (rect.width < minSize || rect.height < minSize) {
      violatingButtons++;
    }
  });

  if (violatingButtons > 0) {
    console.warn(`⚠️ タップ領域が小さすぎるボタン: ${violatingButtons}個`);
  }
}

/**
 * 日付を ARIA 向けに整形
 */
function formatDateForAria(dateStr) {
  if (!dateStr) return '未設定';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayName = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
  return `${year}年${month}月${day}日（${dayName}）`;
}

/**
 * キーボードナビゲーションの初期化
 */
function initializeKeyboardNavigation() {
  // Tab キーでの移動をサポート
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      // 通常の tab 動作を続行
      // ここに特別なキーボード処理を追加可能
    }

    // Enter キーでのアクティベート
    if (e.key === 'Enter') {
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'DIV' && activeElement?.getAttribute('role') === 'button') {
        activeElement.click();
      }
    }

    // Space キーでのチェック/アンチェック
    if (e.key === ' ' && document.activeElement?.type === 'checkbox') {
      document.activeElement.click();
      e.preventDefault();
    }
  });
}

/**
 * 初期化関数
 */
function initAccessibility() {
  console.log('Initializing accessibility features...');

  initializeAriaLabels();
  initializeFocusManagement();
  checkHighContrastMode();
  initializeKeyboardNavigation();

  // デバッグモードでのチェック
  if (localStorage.getItem('debugMode') === 'true') {
    checkContrastRatio();
    checkMinFontSize();
    checkTapTargetSize();
  }

  console.log('✅ Accessibility features initialized');
}

// ページロード時に初期化
document.addEventListener('DOMContentLoaded', initAccessibility);

// 動的に追加された要素への対応
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAccessibility);
} else {
  initAccessibility();
}

// 動的に追加されたタスク項目に ARIA 属性を設定
const originalRenderTasks = window.renderTasks;
if (typeof originalRenderTasks === 'function') {
  window.renderTasks = function(...args) {
    const result = originalRenderTasks.apply(this, args);

    // 新しく追加されたタスク項目に ARIA を適用
    document.querySelectorAll('.task-item:not([aria-label])').forEach(element => {
      const taskId = element.dataset.taskId;
      const tasks = getTasks?.();
      const task = tasks?.find(t => t.id === taskId);
      if (task) {
        setTaskItemAriaAttributes(element, task);
      }
    });

    return result;
  };
}
