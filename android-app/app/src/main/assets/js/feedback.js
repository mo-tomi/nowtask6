// ========================================
// フェーズ 6.8: エラーハンドリングとユーザーフィードバック
// ========================================

/**
 * エラーメッセージ定義
 */
const ERROR_MESSAGES = {
  // バリデーションエラー
  INVALID_DATE: {
    icon: '⚠️',
    message: '期限日が無効です。YYYY-MM-DD 形式で入力してください',
    type: 'warning'
  },
  INVALID_TIME: {
    icon: '⚠️',
    message: '時刻が無効です。HH:MM 形式で入力してください',
    type: 'warning'
  },
  EMPTY_TITLE: {
    icon: '⚠️',
    message: 'タスク名を入力してください',
    type: 'warning'
  },
  INVALID_DURATION: {
    icon: '⚠️',
    message: '所要時間が無効です。30分以上を選択してください',
    type: 'warning'
  },

  // ネットワークエラー
  NETWORK_ERROR: {
    icon: '❌',
    message: 'ネットワーク接続エラー。インターネット接続を確認してください',
    type: 'error'
  },
  TIMEOUT_ERROR: {
    icon: '❌',
    message: 'リクエストがタイムアウトしました。再度お試しください',
    type: 'error'
  },

  // ストレージエラー
  STORAGE_ERROR: {
    icon: '❌',
    message: 'データの保存に失敗しました。再度お試しください',
    type: 'error'
  },
  QUOTA_ERROR: {
    icon: '❌',
    message: 'ストレージが満杯です。古いデータを削除してください',
    type: 'error'
  },

  // 成功メッセージ
  TASK_ADDED: {
    icon: '✅',
    message: 'タスクを追加しました',
    type: 'success'
  },
  TASK_UPDATED: {
    icon: '✅',
    message: 'タスクを更新しました',
    type: 'success'
  },
  TASK_DELETED: {
    icon: '✅',
    message: 'タスクを削除しました',
    type: 'success'
  },
  BULK_OPERATION_SUCCESS: {
    icon: '✅',
    message: '操作が完了しました',
    type: 'success'
  },
  DATA_SYNCED: {
    icon: 'ℹ️',
    message: 'データを同期しました',
    type: 'info'
  }
};

/**
 * トースト通知を表示
 */
function showToast(messageKey, duration = 3000, customMessage = null) {
  const config = ERROR_MESSAGES[messageKey] || {
    icon: 'ℹ️',
    message: customMessage || messageKey,
    type: 'info'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${config.type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.setAttribute('aria-atomic', 'true');

  toast.innerHTML = `
    <span class="toast-icon">${config.icon}</span>
    <span class="toast-message">${config.message}</span>
    <button class="toast-close" aria-label="通知を閉じる">&times;</button>
  `;

  // トースト容器を取得または作成
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  toastContainer.appendChild(toast);

  // クローズボタン
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  });

  // アニメーション
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // 自動削除
  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);

  return toast;
}

/**
 * 削除時のアンドゥ機能
 */
function showUndoNotification(message, undoCallback, undoDuration = 5000) {
  const toast = document.createElement('div');
  toast.className = 'toast toast-undo';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'assertive');

  toast.innerHTML = `
    <span class="toast-message">${message}</span>
    <button class="toast-undo-btn" aria-label="アンドゥ">アンドゥ</button>
  `;

  // トースト容器
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  toastContainer.appendChild(toast);

  let undoClicked = false;

  // アンドゥボタン
  const undoBtn = toast.querySelector('.toast-undo-btn');
  undoBtn.addEventListener('click', () => {
    undoClicked = true;
    if (undoCallback) {
      undoCallback();
    }
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  });

  // アニメーション
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // 自動ロールバック（アンドゥが実行されなかった場合）
  setTimeout(() => {
    if (!undoClicked && toast.parentElement) {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }
  }, undoDuration);

  return toast;
}

/**
 * ローディング状態を表示
 */
function showLoadingState(message = 'データを読み込み中...') {
  // 既存のローディング表示がある場合はスキップ
  if (document.getElementById('loading-overlay')) {
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'loading-overlay';
  overlay.className = 'loading-overlay';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-live', 'polite');

  overlay.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p class="loading-message">${message}</p>
    </div>
  `;

  document.body.appendChild(overlay);

  // タイムアウト処理（10秒以上応答がない場合）
  const timeoutId = setTimeout(() => {
    showLoadingTimeout(overlay);
  }, 10000);

  overlay.dataset.timeoutId = timeoutId;

  return overlay;
}

/**
 * ローディングタイムアウト時の処理
 */
function showLoadingTimeout(overlay) {
  const spinner = overlay.querySelector('.loading-spinner');
  const message = overlay.querySelector('.loading-message');

  spinner.innerHTML = `
    <p class="timeout-message">読み込みに時間がかかっています</p>
    <button class="btn btn-secondary retry-btn">再試行</button>
  `;

  const retryBtn = spinner.querySelector('.retry-btn');
  retryBtn.addEventListener('click', () => {
    hideLoadingState();
    // 再試行処理はコールバック関数で実装
    document.dispatchEvent(new Event('retry:loading'));
  });
}

/**
 * ローディング状態を隠す
 */
function hideLoadingState() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    const timeoutId = overlay.dataset.timeoutId;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    overlay.classList.add('fade-out');
    setTimeout(() => overlay.remove(), 300);
  }
}

/**
 * スケルトンスクリーン（プレースホルダー）を表示
 */
function showSkeletonScreen(container, count = 5) {
  if (!container) return;

  const skeleton = document.createElement('div');
  skeleton.className = 'skeleton-screen';

  for (let i = 0; i < count; i++) {
    const item = document.createElement('div');
    item.className = 'skeleton-item';
    item.innerHTML = `
      <div class="skeleton-line skeleton-title"></div>
      <div class="skeleton-line skeleton-text"></div>
      <div class="skeleton-line skeleton-text short"></div>
    `;
    skeleton.appendChild(item);
  }

  container.innerHTML = '';
  container.appendChild(skeleton);
}

/**
 * スケルトンスクリーンを削除
 */
function hideSkeletonScreen(container) {
  const skeleton = container?.querySelector('.skeleton-screen');
  if (skeleton) {
    skeleton.remove();
  }
}

/**
 * オフライン状態を表示
 */
function showOfflineBanner() {
  // 既存のバナーがある場合はスキップ
  if (document.getElementById('offline-banner')) {
    return;
  }

  const banner = document.createElement('div');
  banner.id = 'offline-banner';
  banner.className = 'offline-banner';
  banner.setAttribute('role', 'status');
  banner.setAttribute('aria-live', 'polite');

  banner.innerHTML = `
    <div class="offline-banner-content">
      <span class="offline-icon">📡</span>
      <span class="offline-text">オフラインモード - インターネット接続がありません</span>
    </div>
  `;

  document.body.insertBefore(banner, document.body.firstChild);

  return banner;
}

/**
 * オフラインバナーを隠す
 */
function hideOfflineBanner() {
  const banner = document.getElementById('offline-banner');
  if (banner) {
    banner.classList.add('fade-out');
    setTimeout(() => banner.remove(), 300);
  }
}

/**
 * 同期中インジケーターを表示
 */
function showSyncIndicator() {
  let indicator = document.getElementById('sync-indicator');

  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'sync-indicator';
    indicator.className = 'sync-indicator';
    indicator.setAttribute('role', 'status');
    indicator.setAttribute('aria-label', 'データを同期中');

    indicator.innerHTML = `
      <span class="sync-spinner"></span>
      <span class="sync-text">同期中...</span>
    `;

    document.body.appendChild(indicator);
  }

  indicator.classList.add('show');
  return indicator;
}

/**
 * 同期中インジケーターを隠す
 */
function hideSyncIndicator() {
  const indicator = document.getElementById('sync-indicator');
  if (indicator) {
    indicator.classList.remove('show');
  }
}

/**
 * 確認ダイアログを表示
 */
function showConfirmDialog(title, message, onConfirm, onCancel) {
  const dialog = document.createElement('div');
  dialog.className = 'confirm-dialog-overlay';
  dialog.setAttribute('role', 'alertdialog');
  dialog.setAttribute('aria-labelledby', 'confirm-dialog-title');
  dialog.setAttribute('aria-describedby', 'confirm-dialog-message');

  dialog.innerHTML = `
    <div class="confirm-dialog">
      <h2 id="confirm-dialog-title" class="confirm-dialog-title">${title}</h2>
      <p id="confirm-dialog-message" class="confirm-dialog-message">${message}</p>
      <div class="confirm-dialog-buttons">
        <button class="btn btn-secondary confirm-cancel">キャンセル</button>
        <button class="btn btn-primary confirm-ok">OK</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  // イベントリスナー
  const okBtn = dialog.querySelector('.confirm-ok');
  const cancelBtn = dialog.querySelector('.confirm-cancel');

  const cleanup = () => {
    dialog.remove();
  };

  okBtn.addEventListener('click', () => {
    if (onConfirm) onConfirm();
    cleanup();
  });

  cancelBtn.addEventListener('click', () => {
    if (onCancel) onCancel();
    cleanup();
  });

  // Escape キーでキャンセル
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      if (onCancel) onCancel();
      cleanup();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);

  okBtn.focus();
  return dialog;
}

/**
 * エラー通知を表示（インラインバリデーション）
 */
function showInlineError(inputElement, errorMessage) {
  // 既存のエラー表示を削除
  removeInlineError(inputElement);

  inputElement.classList.add('input-error');
  inputElement.setAttribute('aria-invalid', 'true');

  const errorElement = document.createElement('div');
  errorElement.className = 'input-error-message';
  errorElement.setAttribute('role', 'alert');
  errorElement.textContent = errorMessage;

  inputElement.parentElement.appendChild(errorElement);

  // フォーカスがあたると自動削除
  inputElement.addEventListener('focus', () => {
    removeInlineError(inputElement);
  }, { once: true });
}

/**
 * インラインエラーを削除
 */
function removeInlineError(inputElement) {
  inputElement.classList.remove('input-error');
  inputElement.setAttribute('aria-invalid', 'false');

  const errorMessage = inputElement.parentElement?.querySelector('.input-error-message');
  if (errorMessage) {
    errorMessage.remove();
  }
}

/**
 * ネットワーク状態の監視
 */
function setupNetworkMonitoring() {
  window.addEventListener('online', () => {
    hideOfflineBanner();
    // オンライン復帰のトーストは起動時にも表示されるため、コメントアウト
    // showToast('DATA_SYNCED');
    console.log('✅ インターネット接続を復帰しました');
  });

  window.addEventListener('offline', () => {
    showOfflineBanner();
    console.log('⚠️ インターネット接続が切断されました');
  });

  // 初期状態をチェック
  if (!navigator.onLine) {
    showOfflineBanner();
  }
}

/**
 * エラーをハンドルして適切に表示
 */
function handleError(error) {
  console.error('Error:', error);

  if (error.type === 'validation') {
    showToast('EMPTY_TITLE');
  } else if (error.type === 'network') {
    showToast('NETWORK_ERROR');
  } else if (error.type === 'storage') {
    showToast('STORAGE_ERROR');
  } else if (error.type === 'timeout') {
    showToast('TIMEOUT_ERROR');
  } else {
    showToast('STORAGE_ERROR', 5000, error.message || '予期しないエラーが発生しました');
  }

  // デバッグモードでの詳細ログ
  if (localStorage.getItem('debugMode') === 'true') {
    console.error('Debug details:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * 初期化関数
 */
function initFeedback() {
  console.log('Initializing feedback features...');

  setupNetworkMonitoring();

  // グローバル関数として公開
  window.showToast = showToast;
  window.showUndoNotification = showUndoNotification;
  window.showLoadingState = showLoadingState;
  window.hideLoadingState = hideLoadingState;
  window.showOfflineBanner = showOfflineBanner;
  window.hideOfflineBanner = hideOfflineBanner;
  window.showSyncIndicator = showSyncIndicator;
  window.hideSyncIndicator = hideSyncIndicator;
  window.showConfirmDialog = showConfirmDialog;
  window.showInlineError = showInlineError;
  window.handleError = handleError;

  console.log('✅ Feedback features initialized');
}

// ページロード時に初期化
document.addEventListener('DOMContentLoaded', initFeedback);

// 動的に追加された場合の再初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFeedback);
} else {
  initFeedback();
}
