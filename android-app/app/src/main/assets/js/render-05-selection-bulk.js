// ========================================
// 複数選択モード
// ========================================

// 選択モードのトグル
function toggleSelectionMode() {
  isSelectionMode = !isSelectionMode;

  if (isSelectionMode) {
    // 選択モード開始
    selectedTaskIds.clear();
    document.body.classList.add('selection-mode');
    const toolbar = document.getElementById('bulk-actions-toolbar');
    if (toolbar) toolbar.style.display = 'flex';

    // 複数選択ボタンをアクティブ状態にする（旧UI）
    const bulkSelectToggleBtn = document.getElementById('bulk-select-toggle-btn');
    if (bulkSelectToggleBtn) bulkSelectToggleBtn.classList.add('active');

    // 複数選択ボタンをアクティブ状態にする（新UI）
    const newBulkSelectToggleBtn = document.getElementById('new-bulk-select-toggle-btn');
    if (newBulkSelectToggleBtn) newBulkSelectToggleBtn.classList.add('active');

    updateBulkActionsCount();
  } else {
    // 選択モード終了
    selectedTaskIds.clear();
    document.body.classList.remove('selection-mode');
    const toolbar = document.getElementById('bulk-actions-toolbar');
    if (toolbar) toolbar.style.display = 'none';

    // 複数選択ボタンを非アクティブ状態にする（旧UI）
    const bulkSelectToggleBtn = document.getElementById('bulk-select-toggle-btn');
    if (bulkSelectToggleBtn) bulkSelectToggleBtn.classList.remove('active');

    // 複数選択ボタンを非アクティブ状態にする（新UI）
    const newBulkSelectToggleBtn = document.getElementById('new-bulk-select-toggle-btn');
    if (newBulkSelectToggleBtn) newBulkSelectToggleBtn.classList.remove('active');
  }

  renderTasks();
}

// タスク選択のトグル
function toggleTaskSelection(taskId) {
  if (selectedTaskIds.has(taskId)) {
    selectedTaskIds.delete(taskId);
  } else {
    selectedTaskIds.add(taskId);
  }

  updateBulkActionsCount();

  // 選択状態を視覚的に更新
  const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
  if (taskElement) {
    taskElement.classList.toggle('selected', selectedTaskIds.has(taskId));
    const checkbox = taskElement.querySelector('.task-select-checkbox');
    if (checkbox) checkbox.checked = selectedTaskIds.has(taskId);
  }
}

// 選択数の更新
function updateBulkActionsCount() {
  const countEl = document.getElementById('bulk-selection-count');
  if (countEl) {
    countEl.textContent = `${selectedTaskIds.size}個選択中`;
  }
}

// 一括完了
function bulkCompleteActions() {
  if (selectedTaskIds.size === 0) return;

  selectedTaskIds.forEach(taskId => {
    const task = getTaskById(taskId);
    if (task && !task.isCompleted) {
      updateTask(taskId, { isCompleted: true });
    }
  });

  toggleSelectionMode(); // 選択モードを終了
}

// 一括削除
function bulkDeleteTasks() {
  if (selectedTaskIds.size === 0) return;

  if (!confirm(`${selectedTaskIds.size}個のタスクを削除してもよろしいですか？`)) {
    return;
  }

  selectedTaskIds.forEach(taskId => {
    deleteTask(taskId);
  });

  toggleSelectionMode(); // 選択モードを終了
}

// 全選択/全解除
function bulkSelectAll() {
  // 現在表示されているすべてのタスクを取得
  const allVisibleTaskIds = [];
  // 旧カード（.task-item）と新カード（.new-task-card）の両方を選択
  document.querySelectorAll('.task-item:not(.completed), .new-task-card:not(.completed)').forEach(el => {
    const taskId = el.dataset.taskId;
    if (taskId) {
      allVisibleTaskIds.push(taskId);
    }
  });

  // すべて選択されている場合は全解除、そうでない場合は全選択
  if (selectedTaskIds.size === allVisibleTaskIds.length && allVisibleTaskIds.length > 0) {
    // 全解除
    selectedTaskIds.clear();
  } else {
    // 全選択
    selectedTaskIds.clear();
    allVisibleTaskIds.forEach(taskId => {
      selectedTaskIds.add(taskId);
    });
  }

  updateBulkActionsCount();
  renderTasks();
}

// 一括日付変更
function bulkChangeDateTasks(event) {
  if (selectedTaskIds.size === 0) {
    alert('タスクを選択してください');
    return;
  }

  // 既存のメニューを削除
  const existingMenu = document.querySelector('.bulk-date-menu');
  if (existingMenu) {
    existingMenu.remove();
    return; // トグル動作
  }

  // メニューを作成
  const menu = document.createElement('div');
  menu.className = 'task-context-menu bulk-date-menu';
  menu.style.position = 'fixed';

  // ボタンの位置を基準に配置
  const rect = event.target.closest('button').getBoundingClientRect();
  menu.style.top = `${rect.bottom + 5}px`;
  menu.style.left = `${rect.left}px`;

  // 今日
  const todayItem = document.createElement('div');
  todayItem.className = 'menu-item';
  todayItem.textContent = '📅 今日';
  todayItem.addEventListener('click', () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    bulkUpdateDate(today.toISOString());
    menu.remove();
  });
  menu.appendChild(todayItem);

  // 明日
  const tomorrowItem = document.createElement('div');
  tomorrowItem.className = 'menu-item';
  tomorrowItem.textContent = '📅 明日';
  tomorrowItem.addEventListener('click', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    bulkUpdateDate(tomorrow.toISOString());
    menu.remove();
  });
  menu.appendChild(tomorrowItem);

  // 来週
  const nextWeekItem = document.createElement('div');
  nextWeekItem.className = 'menu-item';
  nextWeekItem.textContent = '📅 来週';
  nextWeekItem.addEventListener('click', () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(12, 0, 0, 0);
    bulkUpdateDate(nextWeek.toISOString());
    menu.remove();
  });
  menu.appendChild(nextWeekItem);

  // 期限なし
  const noDateItem = document.createElement('div');
  noDateItem.className = 'menu-item';
  noDateItem.textContent = '📅 期限なし';
  noDateItem.addEventListener('click', () => {
    bulkUpdateDate(null);
    menu.remove();
  });
  menu.appendChild(noDateItem);

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

// 日付の一括更新
function bulkUpdateDate(dueDate) {
  selectedTaskIds.forEach(taskId => {
    updateTask(taskId, { dueDate: dueDate });
  });

  // 振動フィードバック
  if (navigator.vibrate) {
    navigator.vibrate(30);
  }

  renderTasks();
}

// 一括優先度変更
function bulkChangePriorityTasks(event) {
  if (selectedTaskIds.size === 0) {
    alert('タスクを選択してください');
    return;
  }

  // 既存のメニューを削除
  const existingMenu = document.querySelector('.bulk-priority-menu');
  if (existingMenu) {
    existingMenu.remove();
    return; // トグル動作
  }

  // メニューを作成
  const menu = document.createElement('div');
  menu.className = 'task-context-menu bulk-priority-menu';
  menu.style.position = 'fixed';

  // ボタンの位置を基準に配置
  const rect = event.target.closest('button').getBoundingClientRect();
  menu.style.top = `${rect.bottom + 5}px`;
  menu.style.left = `${rect.left}px`;

  // 緊急フラグ
  const urgentItem = document.createElement('div');
  urgentItem.className = 'menu-item';
  urgentItem.textContent = '🚨 緊急';
  urgentItem.addEventListener('click', () => {
    bulkUpdatePriority({ urgent: true });
    menu.remove();
  });
  menu.appendChild(urgentItem);

  // 優先度: 高
  const highItem = document.createElement('div');
  highItem.className = 'menu-item';
  highItem.textContent = '⬆️ 優先度: 高';
  highItem.addEventListener('click', () => {
    bulkUpdatePriority({ priority: 'high', urgent: false });
    menu.remove();
  });
  menu.appendChild(highItem);

  // 優先度: 中
  const mediumItem = document.createElement('div');
  mediumItem.className = 'menu-item';
  mediumItem.textContent = '➡️ 優先度: 中';
  mediumItem.addEventListener('click', () => {
    bulkUpdatePriority({ priority: 'medium', urgent: false });
    menu.remove();
  });
  menu.appendChild(mediumItem);

  // 優先度: 低
  const lowItem = document.createElement('div');
  lowItem.className = 'menu-item';
  lowItem.textContent = '⬇️ 優先度: 低';
  lowItem.addEventListener('click', () => {
    bulkUpdatePriority({ priority: 'low', urgent: false });
    menu.remove();
  });
  menu.appendChild(lowItem);

  // 優先度なし
  const noPriorityItem = document.createElement('div');
  noPriorityItem.className = 'menu-item';
  noPriorityItem.textContent = '❌ 優先度なし';
  noPriorityItem.addEventListener('click', () => {
    bulkUpdatePriority({ priority: '', urgent: false });
    menu.remove();
  });
  menu.appendChild(noPriorityItem);

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

// 優先度の一括更新
function bulkUpdatePriority(updates) {
  selectedTaskIds.forEach(taskId => {
    updateTask(taskId, updates);
  });

  // 振動フィードバック
  if (navigator.vibrate) {
    navigator.vibrate(30);
  }

  renderTasks();
}

// ========================================
