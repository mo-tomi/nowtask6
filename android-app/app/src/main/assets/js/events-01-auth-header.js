// ========================================
// イベントリスナー設定
// ========================================

function initEventListeners() {

  // ログインアイコン
  const loginIconBtn = document.getElementById('login-icon-btn');
  if (loginIconBtn) {
    loginIconBtn.addEventListener('click', () => {
      openLoginModal();
    });
  }

  // ログインモーダルを閉じる
  const closeLoginBtn = document.getElementById('close-login-btn');
  if (closeLoginBtn) {
    closeLoginBtn.addEventListener('click', () => {
      closeLoginModal();
    });
  }

  // ログインモーダル外クリックで閉じる
  const loginModal = document.getElementById('login-modal');
  if (loginModal) {
    loginModal.addEventListener('click', (e) => {
      if (e.target.id === 'login-modal') {
        closeLoginModal();
      }
    });
  }

  // Googleログインボタン
  const googleLoginBtn = document.getElementById('google-login-btn');
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', () => {
      if (typeof AndroidAuth !== 'undefined') {
        AndroidAuth.signInWithGoogle();
      } else {
        alert('Google認証はAndroidアプリでのみ利用可能です');
      }
    });
  }

  // Twitterログインボタン
  const twitterLoginBtn = document.getElementById('twitter-login-btn');
  if (twitterLoginBtn) {
    twitterLoginBtn.addEventListener('click', () => {
      if (typeof AndroidAuth !== 'undefined') {
        AndroidAuth.signInWithTwitter();
      } else {
        alert('X (Twitter)認証はAndroidアプリでのみ利用可能です');
      }
    });
  }

  // ヘッダーメニューボタン（その他メニュー）
  const headerMenuBtn = document.getElementById('header-menu-btn');
  if (headerMenuBtn) {
    headerMenuBtn.addEventListener('click', (e) => {
      showHeaderMenu(e);
    });
  }

  // ========================================
  // 新ヘッダーボタン（新デザインシステム）
  // 既存のボタンにデリゲーション
  // ========================================
  const newCalendarBtn = document.getElementById('new-calendar-btn');
  if (newCalendarBtn) {
    newCalendarBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof openCalendarModal === 'function') {
        openCalendarModal();
      }
    });
  }

  const newAccountBtn = document.getElementById('new-account-btn');
  if (newAccountBtn) {
    newAccountBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openLoginModal();
    });
  }

  const newSettingsBtn = document.getElementById('new-settings-btn');
  console.log('[EVENTS] new-settings-btn element:', newSettingsBtn);
  if (newSettingsBtn) {
    console.log('[EVENTS] Adding click listener to new-settings-btn');
    newSettingsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[EVENTS] new-settings-btn clicked!');
      openSettingsModal();
    });
  } else {
    console.error('[EVENTS] new-settings-btn NOT FOUND!');
  }

  const newMenuBtn = document.getElementById('new-menu-btn');
  if (newMenuBtn) {
    newMenuBtn.addEventListener('click', (e) => {
      showHeaderMenu(e);
    });
  }

  // 設定アイコン
  const settingsIconBtn = document.getElementById('settings-icon-btn');
  if (settingsIconBtn) {
    settingsIconBtn.addEventListener('click', () => {
      openSettingsModal();
    });
  }

  // 設定モーダルを閉じる
  const closeSettingsBtn = document.getElementById('close-settings-btn');
  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', () => {
      closeSettingsModal();
    });
  }

  // 分析アイコン
  const analyticsIconBtn = document.getElementById('analytics-icon-btn');
  if (analyticsIconBtn) {
    analyticsIconBtn.addEventListener('click', () => {
      if (typeof openAnalyticsModal === 'function') {
        openAnalyticsModal();
      }
    });
  }

  // 分析モーダルを閉じる
  const closeAnalyticsBtn = document.getElementById('close-analytics-btn');
  if (closeAnalyticsBtn) {
    closeAnalyticsBtn.addEventListener('click', () => {
      if (typeof closeAnalyticsModal === 'function') {
        closeAnalyticsModal();
      }
    });
  }

  // 分析モーダル外クリックで閉じる
  const analyticsModal = document.getElementById('analytics-modal');
  if (analyticsModal) {
    analyticsModal.addEventListener('click', (e) => {
      if (e.target.id === 'analytics-modal') {
        if (typeof closeAnalyticsModal === 'function') {
          closeAnalyticsModal();
        }
      }
    });
  }

  // テンプレート選択ボタン
  const templateSelectBtn = document.getElementById('template-select-btn');
  if (templateSelectBtn) {
    const handleTemplateOpen = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof openTemplateModal === 'function') {
        openTemplateModal();
      }
    };
    templateSelectBtn.addEventListener('click', handleTemplateOpen);
    templateSelectBtn.addEventListener('touchend', handleTemplateOpen);
  }

  // テンプレートモーダルを閉じる
  const closeTemplateBtn = document.getElementById('close-template-btn');
  const templateCloseBtn = document.getElementById('template-close-btn');
  if (closeTemplateBtn) {
    closeTemplateBtn.addEventListener('click', () => {
      if (typeof closeTemplateModal === 'function') {
        closeTemplateModal();
      }
    });
  }
  if (templateCloseBtn) {
    templateCloseBtn.addEventListener('click', () => {
      if (typeof closeTemplateModal === 'function') {
        closeTemplateModal();
      }
    });
  }

  // テンプレートモーダル外クリックで閉じる
  const templateModal = document.getElementById('template-modal');
  if (templateModal) {
    templateModal.addEventListener('click', (e) => {
      if (e.target.id === 'template-modal') {
        if (typeof closeTemplateModal === 'function') {
          closeTemplateModal();
        }
      }
    });
  }

  // テンプレート追加ボタン（フォーム表示）
  const addTemplateBtn = document.getElementById('add-template-btn');
  if (addTemplateBtn) {
    const handleAddTemplate = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof showTemplateInputForm === 'function') {
        showTemplateInputForm();
      }
    };
    addTemplateBtn.addEventListener('click', handleAddTemplate);
    addTemplateBtn.addEventListener('touchend', handleAddTemplate);
  }

  // テンプレートフォーム保存ボタン
  const templateSaveBtn = document.getElementById('template-save-btn');
  if (templateSaveBtn) {
    const handleTemplateSave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof saveTemplateFromForm === 'function') {
        saveTemplateFromForm();
      }
    };
    templateSaveBtn.addEventListener('click', handleTemplateSave);
    templateSaveBtn.addEventListener('touchend', handleTemplateSave);
  }

  // テンプレートフォームキャンセルボタン
  const templateCancelBtn = document.getElementById('template-cancel-btn');
  if (templateCancelBtn) {
    const handleTemplateCancel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof hideTemplateInputForm === 'function') {
        hideTemplateInputForm();
      }
    };
    templateCancelBtn.addEventListener('click', handleTemplateCancel);
    templateCancelBtn.addEventListener('touchend', handleTemplateCancel);
  }

  // カレンダーアイコン
  const calendarIconBtn = document.getElementById('calendar-icon-btn');
  if (calendarIconBtn) {
    calendarIconBtn.addEventListener('click', () => {
      if (typeof openCalendarModal === 'function') {
        openCalendarModal();
      }
    });
  }

  // カレンダーモーダルを閉じる
  const closeCalendarBtn = document.getElementById('close-calendar-btn');
  if (closeCalendarBtn) {
    closeCalendarBtn.addEventListener('click', () => {
      if (typeof closeCalendarModal === 'function') {
        closeCalendarModal();
      }
    });
  }

  // カレンダーモーダル外クリックで閉じる
  const calendarModal = document.getElementById('calendar-modal');
  if (calendarModal) {
    calendarModal.addEventListener('click', (e) => {
      if (e.target.id === 'calendar-modal') {
        if (typeof closeCalendarModal === 'function') {
          closeCalendarModal();
        }
      }
    });
  }

  // カレンダーナビゲーション
  const calendarPrevBtn = document.getElementById('calendar-prev-btn');
  const calendarNextBtn = document.getElementById('calendar-next-btn');
  if (calendarPrevBtn) {
    calendarPrevBtn.addEventListener('click', () => {
      if (typeof goToPreviousMonth === 'function') {
        goToPreviousMonth();
      }
    });
  }
  if (calendarNextBtn) {
    calendarNextBtn.addEventListener('click', () => {
      if (typeof goToNextMonth === 'function') {
        goToNextMonth();
      }
    });
  }

  // 設定保存
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      saveSettings();
    });
  }

  // ルーティン追加
  const addRoutineBtn = document.getElementById('add-routine-btn');
  if (addRoutineBtn) {
    addRoutineBtn.addEventListener('click', () => {
      addRoutine();
    });
  }

  // 完了済み折りたたみ
  const completedToggle = document.getElementById('completed-toggle');
  const completedContent = document.getElementById('completed-content');
  if (completedToggle && completedContent) {
    completedToggle.addEventListener('click', () => {
      completedToggle.classList.toggle('open');
      completedContent.classList.toggle('open');
    });
  }

  // FAB（新規作成）
  const createTaskBtn = document.getElementById('create-task-btn');
  if (createTaskBtn) {
    createTaskBtn.addEventListener('click', () => {
      openCreateModal();
    });
  }

  // モーダル閉じる
  const closeModalBtn = document.getElementById('close-modal-btn');
  if (closeModalBtn) {
