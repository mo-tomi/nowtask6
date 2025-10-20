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
