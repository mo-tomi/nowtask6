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
