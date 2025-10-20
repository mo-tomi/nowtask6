// ========================================
// メイン初期化ファイル
// ========================================

/**
 * UIの描画やイベントリスナーなど、アプリのメイン機能を起動する
 */
function startApp() {
  try {
    console.log("Starting main application...");

    // UI バージョン適用（新旧ヘッダー切り替え）
    applyUIVersion();

    // メインUIを表示
    showMainApp();

    // i18n 適用（存在しなければ暫定対策にフォールバック）
    try {
      if (typeof applyI18n === 'function') {
        applyI18n('ja');
      } else if (typeof applyI18nFix === 'function') {
        applyI18nFix();
      }
    } catch (e) {
      console.warn('i18n apply failed:', e);
    }

    // チュートリアル初期化
    initTutorial();

    // ゴミ箱クリーンアップ
    cleanupTrash();

    // デイリールーティンタスク作成
    try {
      createDailyRoutineTasks();
    } catch (e) {
      console.warn('Failed to create daily routine tasks:', e);
    }

    // イベントリスナー設定
    initEventListeners();

    // 初回レンダリング
    renderTasks();

    // 24時間ゲージの初期化と更新
    initGaugeDate();
    initGaugeSwipe();
    updateTimeGauge(currentGaugeDate);
    updateGaugeDateLabel();
    setInterval(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = formatDateISO(today);
      if (currentGaugeDate === todayISO) {
        updateTimeGauge(currentGaugeDate);
      }
    }, 60000); // 1分ごとに更新

    // 1秒ごとにタスクリストを更新（タイマー表示のため）
    setInterval(() => {
      const tasks = getTasks();
      const hasRunningTimer = tasks.some(t => t.isTimerRunning);
      if (hasRunningTimer) {
        renderTasks();
      }
    }, 1000);

    // スクロール時にヘッダーを隠す
    initHeaderScroll();

  } catch (e) {
    console.error('Initialization error:', e);
    alert('初期化エラーが発生しました。コンソールを確認してください。');
  }
}

/**
 * アプリケーションの全体的な初期化
 */
function init() {
    // auth.jsの認証機能を初期化
    // MainActivity.ktで既に匿名認証済みだが、auth.jsがログイン状態をチェックして適切にアプリを起動する
    initAuth();

    // 検索・フィルター・ソート機能を初期化
    if (typeof window.searchFilter !== 'undefined' && typeof window.searchFilter.init === 'function') {
        window.searchFilter.init();
    }
}

// ========================================
// ヘッダーメニュー表示
// ========================================
function showHeaderMenu(event) {
  // 既存のメニューを削除
  const existingMenu = document.querySelector('.header-dropdown-menu');
  if (existingMenu) {
    existingMenu.remove();
    return; // トグル動作
  }

  // メニューを作成
  const menu = document.createElement('div');
  menu.className = 'task-context-menu header-dropdown-menu';
  menu.style.position = 'fixed';

  // ボタンの位置を基準に配置
  const rect = event.target.closest('button').getBoundingClientRect();
  menu.style.top = `${rect.bottom + 5}px`;
  menu.style.right = `10px`;

  // 検索・絞り込み
  const searchFilterItem = document.createElement('div');
  searchFilterItem.className = 'menu-item';
  searchFilterItem.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px; display:inline-block; vertical-align:middle;"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg> 検索・絞り込み';
  searchFilterItem.addEventListener('click', () => {
    if (typeof openSearchFilterModal === 'function') {
      openSearchFilterModal();
    }
    menu.remove();
  });
  menu.appendChild(searchFilterItem);

  // X共有
  const shareItem = document.createElement('div');
  shareItem.className = 'menu-item';
  shareItem.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px; display:inline-block; vertical-align:middle;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg> X共有';
  shareItem.addEventListener('click', () => {
    if (typeof generateAndShareImage === 'function') {
      generateAndShareImage();
    }
    menu.remove();
  });
  menu.appendChild(shareItem);

  // 分析
  const analyticsItem = document.createElement('div');
  analyticsItem.className = 'menu-item';
  analyticsItem.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px; display:inline-block; vertical-align:middle;"><rect x="3" y="13" width="4" height="8"></rect><rect x="10" y="8" width="4" height="13"></rect><rect x="17" y="3" width="4" height="18"></rect></svg> 分析';
  analyticsItem.addEventListener('click', () => {
    if (typeof openAnalyticsModal === 'function') {
      openAnalyticsModal();
    }
    menu.remove();
  });
  menu.appendChild(analyticsItem);

  document.body.appendChild(menu);

  // メニュー外をクリックで閉じる
  setTimeout(() => {
    const closeHandler = (e) => {
      if (!menu.contains(e.target) && !event.target.closest('button').contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeHandler);
        document.removeEventListener('touchstart', closeHandler);
      }
    };
    document.addEventListener('click', closeHandler);
    document.addEventListener('touchstart', closeHandler);
  }, 0);
}

// ========================================
// UI バージョン切り替え機能
// ========================================
function toggleUIVersion(version) {
  localStorage.setItem('ui-version', version);
  applyUIVersion();
}

function isNewUIEnabled() {
  return (localStorage.getItem('ui-version') || 'new') === 'new';
}

function applyUIVersion() {
  const version = localStorage.getItem('ui-version') || 'new';
  const oldHeader = document.getElementById('old-header');
  const newHeader = document.getElementById('new-header');
  const oldGaugeContainer = document.getElementById('old-time-gauge-container');
  const newGaugeContainer = document.getElementById('new-time-gauge-container');
  const oldBulkSelect = document.getElementById('old-bulk-select-button-container');
  const newBulkSelect = document.getElementById('new-bulk-select-button-container');

  if (version === 'new') {
    // 新ヘッダーを表示
    if (oldHeader) oldHeader.style.display = 'none';
    if (newHeader) newHeader.style.display = 'flex';

    // 新ゲージセクション全体を表示
    if (oldGaugeContainer) oldGaugeContainer.style.display = 'none';
    if (newGaugeContainer) newGaugeContainer.style.display = 'block';

    // 新複数選択ボタンを表示
    if (oldBulkSelect) oldBulkSelect.style.display = 'none';
    if (newBulkSelect) newBulkSelect.style.display = 'flex';

    // 新ゲージを初期化・レンダリング
    if (typeof renderNewGauge === 'function') {
      renderNewGauge(currentGaugeDate);
    }
  } else {
    // 旧ヘッダーを表示
    if (oldHeader) oldHeader.style.display = 'flex';
    if (newHeader) newHeader.style.display = 'none';

    // 旧ゲージセクション全体を表示
    if (oldGaugeContainer) oldGaugeContainer.style.display = 'block';
    if (newGaugeContainer) newGaugeContainer.style.display = 'none';

    // 旧複数選択ボタンを表示
    if (oldBulkSelect) oldBulkSelect.style.display = 'flex';
    if (newBulkSelect) newBulkSelect.style.display = 'none';
  }

  console.log(`UI Version applied: ${version}`);
}

// ========================================
// 文字化け暫定対策（主要UIの文言を上書き）
// ========================================
function setText(selector, text) {
  const el = document.querySelector(selector);
  if (el) el.textContent = text;
}

function setButtonText(selector, text) {
  const el = document.querySelector(selector);
  if (el) el.innerText = text;
}

function applyI18nFix() {
  // 設定モーダル タイトル/ボタン
  setText('#settings-modal .modal-header h2', '設定');
  setButtonText('#save-settings-btn', '保存');

  // 設定モーダル セクション見出し（登場順）
  const sectionTitles = document.querySelectorAll('#settings-modal .settings-section-title');
  if (sectionTitles && sectionTitles.length) {
    if (sectionTitles[0]) sectionTitles[0].textContent = '🎨 表示設定';
    if (sectionTitles[1]) sectionTitles[1].textContent = '🔔 通知設定';
    if (sectionTitles[2]) sectionTitles[2].textContent = '⏱ ルーチン';
    if (sectionTitles[3]) sectionTitles[3].textContent = '⚡ クイックアクション';
  }

  // 完了セクション
  setText('#completed-section .toggle-text', '完了済み');

  // ログインモーダル
  setText('#login-modal #login-modal-title', 'ログイン');
  setButtonText('#google-login-btn', 'Googleでログイン');
  setButtonText('#continue-anonymous-btn', '匿名のまま使い続ける');
  setButtonText('#logout-btn', 'ログアウト');

  // アカウント情報ラベル
  const labels = document.querySelectorAll('#account-info-section .form-group label');
  if (labels && labels.length) {
    if (labels[0]) labels[0].textContent = '表示名';
    if (labels[1]) labels[1].textContent = 'メールアドレス';
    if (labels[2]) labels[2].textContent = 'ステータス';
  }

  // ゲージのナビボタン（前日/翌日）
  const prevBtn = document.getElementById('gauge-prev-btn');
  if (prevBtn) {
    prevBtn.setAttribute('aria-label', '前の日に移動');
    prevBtn.setAttribute('title', '前の日に移動');
  }
  const nextBtn = document.getElementById('gauge-next-btn');
  if (nextBtn) {
    nextBtn.setAttribute('aria-label', '次の日に移動');
    nextBtn.setAttribute('title', '次の日に移動');
  }
}

// ========================================
// ヘッダースクロール制御
// ========================================
function initHeaderScroll() {
  const header = document.querySelector('.header');
  const version = localStorage.getItem('ui-version') || 'new';
  const activeHeader = version === 'new' ? document.getElementById('new-header') : document.getElementById('old-header');

  let lastScrollTop = 0;
  let isScrolling = false;
  let scrollTimeout;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    clearTimeout(scrollTimeout);
    isScrolling = true;

    if (currentScroll > lastScrollTop && currentScroll > 100) {
      if (activeHeader) activeHeader.classList.add('header-hidden');
    } else if (currentScroll < lastScrollTop) {
      if (activeHeader) activeHeader.classList.remove('header-hidden');
    }

    if (currentScroll <= 0) {
      if (activeHeader) activeHeader.classList.remove('header-hidden');
    }

    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;

    scrollTimeout = setTimeout(() => {
      isScrolling = false;
    }, 200);
  }, { passive: true });
}

// DOMロード後に初期化実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
