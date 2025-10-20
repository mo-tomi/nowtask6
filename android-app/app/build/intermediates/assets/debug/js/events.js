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
    closeModalBtn.addEventListener('click', () => {
      closeModal();
    });
  }

  const cancelBtn = document.getElementById('cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      closeModal();
    });
  }

  // モーダル外クリックで閉じる
  const taskModal = document.getElementById('task-modal');
  if (taskModal) {
    taskModal.addEventListener('click', (e) => {
      if (e.target.id === 'task-modal') {
        closeModal();
      }
    });
  }

  const settingsModal = document.getElementById('settings-modal');
  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target.id === 'settings-modal') {
        closeSettingsModal();
      }
    });
  }

  // 保存ボタン
  const saveBtnElement = document.getElementById('save-btn');
  if (saveBtnElement) {
    const handleSaveTask = (e) => {
      e.preventDefault();
      e.stopPropagation();
      saveTask();
    };
    saveBtnElement.addEventListener('click', handleSaveTask);
    saveBtnElement.addEventListener('touchend', handleSaveTask);
  }

  // 削除ボタン
  const deleteBtn = document.getElementById('delete-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      deleteCurrentTask();
    });
  }

  // タイトル入力時の文字数カウント
  const titleInput = document.getElementById('task-title');
  if (titleInput) {
    titleInput.addEventListener('input', () => {
      const count = titleInput.value.length;
      const charCount = document.getElementById('title-char-count');
      const saveBtn = document.getElementById('save-btn');
      if (charCount) charCount.textContent = count;
      if (saveBtn) saveBtn.disabled = count === 0;
    });

    // Enterキーで保存（タイトル入力時）
    titleInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && titleInput.value.trim()) {
        saveTask();
      }
    });
  }

  // タイマーボタン
  const timerToggleBtn = document.getElementById('timer-toggle-btn');
  if (timerToggleBtn) {
    timerToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!editingTaskId) return;

      const task = getTaskById(editingTaskId);
      if (!task) return;

      if (task.isTimerRunning) {
        stopTimer(editingTaskId);
      } else {
        startTimer(editingTaskId);
      }

      updateTimerDisplay(editingTaskId);
    });
  }

  // クイック入力
  const quickInput = document.getElementById('quick-add-input');
  const quickAddForm = document.getElementById('quick-add-form');
  const quickDateBtn = document.getElementById('quick-date-btn');
  const quickDatetimePanel = document.getElementById('quick-datetime-panel');
  const quickDateInput = document.getElementById('quick-add-date');
  const quickDuration = document.getElementById('quick-add-duration');
  const quickDatetimeClose = document.getElementById('quick-datetime-close');
  const quickHistoryBtn = document.getElementById('quick-history-btn');
  const quickHistoryTags = document.getElementById('quick-history-tags');

  // カレンダーボタンのクリック
  if (quickDateBtn && quickDatetimePanel) {
    quickDateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (quickDatetimePanel.style.display === 'none') {
        quickDatetimePanel.style.display = 'block';
      } else {
        quickDatetimePanel.style.display = 'none';
      }
    });
  }

  // 日時パネルを閉じる
  if (quickDatetimeClose && quickDatetimePanel) {
    quickDatetimeClose.addEventListener('click', (e) => {
      e.preventDefault();
      quickDatetimePanel.style.display = 'none';
    });
  }

  // 日時選択時
  if (quickDateInput && quickDateBtn) {
    quickDateInput.addEventListener('change', () => {
      if (quickDateInput.value) {
        quickDateBtn.classList.add('has-date');
      } else {
        quickDateBtn.classList.remove('has-date');
      }
    });
  }

  // パネルの外側クリックで閉じる
  document.addEventListener('click', (e) => {
    if (quickDatetimePanel && !quickDatetimePanel.contains(e.target) && quickDateBtn && !quickDateBtn.contains(e.target)) {
      quickDatetimePanel.style.display = 'none';
    }
  });

  if (quickAddForm && quickInput) {
    quickAddForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (quickInput.value.trim()) {
      const title = quickInput.value.trim();
      const durationValue = quickDuration ? quickDuration.value : '';
      const duration = durationValue ? parseInt(durationValue) : null;

      // 期限日のみ（時刻なし）
      let dueDate = null;
      let startTime = null;

      // 自然言語入力から解析されたデータを取得
      const naturalLangResult = typeof processNaturalInput === 'function' ? processNaturalInput(title) : null;

      if (naturalLangResult && naturalLangResult.hasDatetime) {
        // 自然言語入力から日付が解析された場合
        dueDate = naturalLangResult.dueDate;
        startTime = naturalLangResult.startTime;
      } else if (quickDateInput.value) {
        // ユーザーが手動で日付を指定した場合
        dueDate = new Date(quickDateInput.value + 'T00:00:00').toISOString();
      } else {
        // 日付未指定の場合は今日の日付を設定
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        dueDate = new Date(`${year}-${month}-${day}T00:00:00`).toISOString();
      }

      // 自然言語入力から日時が抽出された場合、タスク名から日付部分を削除
      const finalTitle = naturalLangResult && naturalLangResult.hasDatetime ? naturalLangResult.taskTitle : title;

      // 新規タスク作成
      const tasks = getTasks();
      const now = new Date().toISOString();
      const task = {
        id: generateUUID(),
        title: finalTitle,
        memo: '',
        dueDate: dueDate,
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
        parentId: null,
        isTutorial: false,
        totalTime: 0,
        isTimerRunning: false,
        timerStartTime: null,
        duration: duration,
        startTime: startTime,
        endTime: null,
        urgent: false,
        priority: ''
      };
      tasks.unshift(task);
      saveTasks(tasks);

      // 履歴に追加
      if (typeof addToTaskHistory === 'function') {
        addToTaskHistory(finalTitle, startTime, null, 20);
        try {
          document.dispatchEvent(new CustomEvent('task:history:updated'));
        } catch (e) {
          console.warn('CustomEvent dispatch failed', e);
        }
      }

      quickInput.value = '';
      if (quickDateInput) quickDateInput.value = '';
      if (quickDuration) quickDuration.value = '';
      if (quickDatetimePanel) quickDatetimePanel.style.display = 'none';
      if (quickDateBtn) quickDateBtn.classList.remove('has-date');
      renderTasks();
    }
    });
  }

  // ---- 履歴タグの初期化とイベント ----
  function renderHistoryTags() {
    if (!quickHistoryTags) return;
    quickHistoryTags.innerHTML = '';

    const history = typeof getTaskHistory === 'function' ? getTaskHistory(10) : [];
    history.forEach((item) => {
      const itemTitle = typeof item === 'string' ? item : (item.title || '');
      const itemStartTime = typeof item === 'object' ? item.startTime : null;
      const itemEndTime = typeof item === 'object' ? item.endTime : null;

      const tag = document.createElement('button');
      tag.type = 'button';
      tag.className = 'quick-history-tag';
      tag.textContent = itemTitle;
      tag.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // タスクを即座に作成
        const tasks = getTasks();
        const now = new Date().toISOString();

        // 今日の日付を設定
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayDate = new Date(`${year}-${month}-${day}T00:00:00`).toISOString();

        // 履歴からのタスク作成の場合、保存された時刻情報を使用
        let finalTitle = itemTitle;
        let finalStartTime = itemStartTime;
        let finalDueDate = todayDate;

        const task = {
          id: generateUUID(),
          title: finalTitle,
          memo: '',
          dueDate: finalDueDate,
          isCompleted: false,
          createdAt: now,
          updatedAt: now,
          parentId: null,
          isTutorial: false,
          totalTime: 0,
          isTimerRunning: false,
          timerStartTime: null,
          duration: null,
          startTime: finalStartTime,
          endTime: itemEndTime,
          urgent: false,
          priority: ''
        };
        tasks.unshift(task);
        saveTasks(tasks);

        // 履歴を更新
        if (typeof addToTaskHistory === 'function') {
          addToTaskHistory(task.title, task.startTime, task.endTime, 20);
          try {
            document.dispatchEvent(new CustomEvent('task:history:updated'));
          } catch (e) {
            console.warn('CustomEvent dispatch failed', e);
          }
        }

        renderTasks();
      });

      quickHistoryTags.appendChild(tag);
    });
  }

  // 履歴ボタンのクリック（履歴タグの表示/非表示を切り替え）
  if (quickHistoryBtn && quickHistoryTags) {
    quickHistoryBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const isVisible = quickHistoryTags.style.display === 'flex';
      if (isVisible) {
        quickHistoryTags.style.display = 'none';
      } else {
        renderHistoryTags();
        quickHistoryTags.style.display = 'flex';
      }
    });
  }

  // 初期描画（最初は非表示）
  if (quickHistoryTags) {
    quickHistoryTags.style.display = 'none';
  }

  // 履歴更新時に再描画
  document.addEventListener('task:history:updated', () => {
    renderHistoryTags();
  });

  // 絞り込みボタン
  const filterUrgentBtn = document.getElementById('filter-urgent');
  const filterHighPriorityBtn = document.getElementById('filter-high-priority');
  const filterClearBtn = document.getElementById('filter-clear');

  if (filterUrgentBtn && filterHighPriorityBtn) {
    filterUrgentBtn.addEventListener('click', () => {
      currentFilter = currentFilter === 'urgent' ? null : 'urgent';
      filterUrgentBtn.classList.toggle('active');
      filterHighPriorityBtn.classList.remove('active');
      renderTasks();
    });
  }

  if (filterHighPriorityBtn && filterUrgentBtn) {
    filterHighPriorityBtn.addEventListener('click', () => {
      currentFilter = currentFilter === 'high-priority' ? null : 'high-priority';
      filterHighPriorityBtn.classList.toggle('active');
      filterUrgentBtn.classList.remove('active');
      renderTasks();
    });
  }

  if (filterClearBtn && filterUrgentBtn && filterHighPriorityBtn) {
    filterClearBtn.addEventListener('click', () => {
      currentFilter = null;
      filterUrgentBtn.classList.remove('active');
      filterHighPriorityBtn.classList.remove('active');
      renderTasks();
    });
  }

  // サブタスク追加ボタン
  const addSubtaskBtn = document.getElementById('add-subtask-btn');
  if (addSubtaskBtn) {
    addSubtaskBtn.addEventListener('click', () => {
      addSubtask();
    });
  }

  // 時間オーバー警告モーダルのイベント
  const closeOverloadBtn = document.getElementById('close-overload-btn');
  const overloadCancelBtn = document.getElementById('overload-cancel-btn');
  const overloadAdjustBtn = document.getElementById('overload-adjust-btn');
  const timeOverloadModal = document.getElementById('time-overload-modal');

  if (closeOverloadBtn) {
    closeOverloadBtn.addEventListener('click', () => {
      if (typeof closeTimeOverloadModal === 'function') {
        closeTimeOverloadModal();
      }
    });
  }

  if (overloadCancelBtn) {
    overloadCancelBtn.addEventListener('click', () => {
      if (typeof closeTimeOverloadModal === 'function') {
        closeTimeOverloadModal();
      }
    });
  }

  if (overloadAdjustBtn) {
    overloadAdjustBtn.addEventListener('click', () => {
      // 調整ボタンは現在モーダルを閉じるだけ（タスク一覧で個別に調整）
      if (typeof closeTimeOverloadModal === 'function') {
        closeTimeOverloadModal();
      }
    });
  }

  if (timeOverloadModal) {
    timeOverloadModal.addEventListener('click', (e) => {
      if (e.target.id === 'time-overload-modal') {
        if (typeof closeTimeOverloadModal === 'function') {
          closeTimeOverloadModal();
        }
      }
    });
  }

  // スクロール連動で24時間ゲージを更新（スロットリング）
  const tasksListContainer = document.querySelector('.main-content');
  if (tasksListContainer) {
    let lastCall = 0;
    const throttleMs = 150;
    let scrollTimeout = null;
    let isScrolling = false;

    tasksListContainer.addEventListener('scroll', () => {
      const now = Date.now();
      if (now - lastCall < throttleMs) return;
      lastCall = now;

      // 画面上部に見える最初の date-separator を探す
      const separators = document.querySelectorAll('.date-separator');
      let topMostDate = null;
      let topMostOffset = Infinity;
      separators.forEach(sep => {
        const rect = sep.getBoundingClientRect();
        // ビューポート上部付近（ヘッダーなどを考慮して 80px 下）にあるものを検出
        const offset = Math.abs(rect.top - 80);
        if (rect.top <= 120 && offset < topMostOffset) {
          topMostOffset = offset;
          topMostDate = sep.dataset.date || null;
        }
      });

      // 見つかった日付を渡してゲージを更新
      if (topMostDate !== null) {
        updateTimeGauge(topMostDate || undefined);
      }

      // クイック入力のスクロール時の表示/非表示制御
      if (quickAddForm) {
        // スクロール中はクイック入力を非表示
        if (!isScrolling) {
          isScrolling = true;
          quickAddForm.classList.add('hidden');
        }

        // 既存のタイムアウトをクリア
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }

        // スクロール停止後3秒で再表示
        scrollTimeout = setTimeout(() => {
          isScrolling = false;
          quickAddForm.classList.remove('hidden');
        }, 3000);
      }
    });
  }

  // ========================================
  // 複数選択モード関連
  // ========================================

  // 複数選択トグルボタン（ゲージ下部のボタン - 旧UI）
  const bulkSelectToggleBtn = document.getElementById('bulk-select-toggle-btn');
  if (bulkSelectToggleBtn) {
    bulkSelectToggleBtn.addEventListener('click', () => {
      if (typeof toggleSelectionMode === 'function') {
        toggleSelectionMode();
      }
    });
  }

  // 複数選択トグルボタン（新UI）
  const newBulkSelectToggleBtn = document.getElementById('new-bulk-select-toggle-btn');
  if (newBulkSelectToggleBtn) {
    newBulkSelectToggleBtn.addEventListener('click', () => {
      if (typeof toggleSelectionMode === 'function') {
        toggleSelectionMode();
      }
    });
  }

  // 選択モードボタン（新しいツールバーのボタン）
  const toolbarSelectModeBtn = document.getElementById('toolbar-select-mode-btn');
  if (toolbarSelectModeBtn) {
    toolbarSelectModeBtn.addEventListener('click', () => {
      if (typeof toggleSelectionMode === 'function') {
        toggleSelectionMode();
      }
    });
  }

  // 一括完了ボタン
  const bulkCompleteBtn = document.getElementById('bulk-complete-btn');
  if (bulkCompleteBtn) {
    bulkCompleteBtn.addEventListener('click', () => {
      if (typeof bulkCompleteActions === 'function') {
        bulkCompleteActions();
      }
    });
  }

  // 一括削除ボタン
  const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
  if (bulkDeleteBtn) {
    bulkDeleteBtn.addEventListener('click', () => {
      if (typeof bulkDeleteTasks === 'function') {
        bulkDeleteTasks();
      }
    });
  }

  // 選択キャンセルボタン
  const bulkCancelBtn = document.getElementById('bulk-cancel-btn');
  if (bulkCancelBtn) {
    bulkCancelBtn.addEventListener('click', () => {
      if (typeof toggleSelectionMode === 'function') {
        toggleSelectionMode();
      }
    });
  }

  // 全選択/全解除ボタン
  const bulkSelectAllBtn = document.getElementById('bulk-select-all-btn');
  if (bulkSelectAllBtn) {
    bulkSelectAllBtn.addEventListener('click', () => {
      if (typeof bulkSelectAll === 'function') {
        bulkSelectAll();
      }
    });
  }

  // 日付変更ボタン
  const bulkDateBtn = document.getElementById('bulk-date-btn');
  if (bulkDateBtn) {
    bulkDateBtn.addEventListener('click', (e) => {
      if (typeof bulkChangeDateTasks === 'function') {
        bulkChangeDateTasks(e);
      }
    });
  }

  // 優先度変更ボタン
  const bulkPriorityBtn = document.getElementById('bulk-priority-btn');
  if (bulkPriorityBtn) {
    bulkPriorityBtn.addEventListener('click', (e) => {
      if (typeof bulkChangePriorityTasks === 'function') {
        bulkChangePriorityTasks(e);
      }
    });
  }

  // ========================================
  // クイックアクション関連
  // ========================================

  // 今日のタスクを一括完了
  const quickCompleteTodayBtn = document.getElementById('quick-complete-today-btn');
  if (quickCompleteTodayBtn) {
    quickCompleteTodayBtn.addEventListener('click', () => {
      if (typeof quickCompleteToday === 'function') {
        quickCompleteToday();
      }
    });
  }

  // 期限切れタスクを明日に移動
  const quickMoveOverdueBtn = document.getElementById('quick-move-overdue-btn');
  if (quickMoveOverdueBtn) {
    quickMoveOverdueBtn.addEventListener('click', () => {
      if (typeof quickMoveOverdueToTomorrow === 'function') {
        quickMoveOverdueToTomorrow();
      }
    });
  }

  // 完了タスクをアーカイブ
  const quickArchiveCompletedBtn = document.getElementById('quick-archive-completed-btn');
  if (quickArchiveCompletedBtn) {
    quickArchiveCompletedBtn.addEventListener('click', () => {
      if (typeof quickArchiveCompleted === 'function') {
        quickArchiveCompleted();
      }
    });
  }

  // 今日の未完了タスクを明日にコピー
  const quickCopyTodayBtn = document.getElementById('quick-copy-today-btn');
  if (quickCopyTodayBtn) {
    quickCopyTodayBtn.addEventListener('click', () => {
      if (typeof quickCopyTodayToTomorrow === 'function') {
        quickCopyTodayToTomorrow();
      }
    });
  }

  // ========================================
  // セクション追加ボタン（新UIの+ボタン）
  // ========================================
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('new-section-add-btn')) {
      const dateKey = e.target.dataset.date;
      if (dateKey !== undefined) {
        // タスク作成モーダルを開く
        if (typeof openCreateModal === 'function') {
          openCreateModal();

          // モーダルが開いた後に期限日を設定
          setTimeout(() => {
            const dueDateInput = document.getElementById('task-due-date');
            if (dueDateInput && dateKey) {
              // dateKeyを「YYYY-MM-DD」形式の日付に変換
              // dateKeyは 'today', 'tomorrow', 'future_...' などの形式
              const dateObj = new Date(dateKey);
              const year = dateObj.getFullYear();
              const month = String(dateObj.getMonth() + 1).padStart(2, '0');
              const day = String(dateObj.getDate()).padStart(2, '0');
              dueDateInput.value = `${year}-${month}-${day}`;
            }
          }, 100);
        }
      }
    }
  });

  // ========================================
  // 新ゲージナビゲーションボタン（新UIのゲージ日付切り替え）
  // ========================================
  const newGaugePrevBtn = document.getElementById('new-gauge-prev');
  const newGaugeNextBtn = document.getElementById('new-gauge-next');

  if (newGaugePrevBtn) {
    newGaugePrevBtn.addEventListener('click', () => {
      if (typeof changeGaugeDate === 'function') {
        changeGaugeDate(-1);
        // 新UIゲージを再レンダリング
        if (typeof renderNewGauge === 'function') {
          renderNewGauge(currentGaugeDate);
        }
      }
    });
  }

  if (newGaugeNextBtn) {
    newGaugeNextBtn.addEventListener('click', () => {
      if (typeof changeGaugeDate === 'function') {
        changeGaugeDate(1);
        // 新UIゲージを再レンダリング
        if (typeof renderNewGauge === 'function') {
          renderNewGauge(currentGaugeDate);
        }
      }
    });
  }

  // ========================================
  // 新UI: クイック入力＆完了済みセクション初期化
  // ========================================
  if (typeof initQuickInput === 'function') {
    initQuickInput();
  }
  if (typeof initCompletedToggle === 'function') {
    initCompletedToggle();
  }
}

// タブUIは廃止しました。表示切替は showTasks/showTrash を使用します。
