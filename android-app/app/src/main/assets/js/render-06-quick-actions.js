// ========================================
// クイックアクション
// ========================================

/**
 * 今日のタスクを一括完了
 */
function quickCompleteToday() {
  const tasks = getTasks();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let completedCount = 0;

  tasks.forEach(task => {
    if (!task.isCompleted && task.dueDate) {
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);

      if (taskDate.getTime() === today.getTime()) {
        updateTask(task.id, { isCompleted: true });
        completedCount++;
      }
    }
  });

  if (completedCount > 0) {
    alert(`今日のタスク ${completedCount}個を完了しました`);
    renderTasks();

    // 振動フィードバック
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  } else {
    alert('今日の未完了タスクはありません');
  }
}

/**
 * 期限切れタスクを明日に移動
 */
function quickMoveOverdueToTomorrow() {
  const tasks = getTasks();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12, 0, 0, 0);

  let movedCount = 0;

  tasks.forEach(task => {
    if (!task.isCompleted && task.dueDate) {
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);

      if (taskDate.getTime() < today.getTime()) {
        updateTask(task.id, { dueDate: tomorrow.toISOString() });
        movedCount++;
      }
    }
  });

  if (movedCount > 0) {
    alert(`期限切れタスク ${movedCount}個を明日に移動しました`);
    renderTasks();

    // 振動フィードバック
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  } else {
    alert('期限切れのタスクはありません');
  }
}

/**
 * 完了タスクをアーカイブ（削除）
 */
function quickArchiveCompleted() {
  const tasks = getTasks();
  const completedTasks = tasks.filter(t => t.isCompleted);

  if (completedTasks.length === 0) {
    alert('完了済みのタスクはありません');
    return;
  }

  if (!confirm(`完了済みタスク ${completedTasks.length}個をアーカイブしてもよろしいですか？\n（ゴミ箱に移動されます）`)) {
    return;
  }

  let archivedCount = 0;
  completedTasks.forEach(task => {
    deleteTask(task.id);
    archivedCount++;
  });

  alert(`${archivedCount}個のタスクをアーカイブしました`);
  renderTasks();

  // 振動フィードバック
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
}

/**
 * 今日の未完了タスクを明日にコピー
 */
function quickCopyTodayToTomorrow() {
  const tasks = getTasks();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12, 0, 0, 0);

  const todayTasks = tasks.filter(task => {
    if (task.isCompleted || !task.dueDate) return false;
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });

  if (todayTasks.length === 0) {
    alert('今日の未完了タスクはありません');
    return;
  }

  if (!confirm(`今日の未完了タスク ${todayTasks.length}個を明日にコピーしてもよろしいですか？`)) {
    return;
  }

  const allTasks = getTasks();
  const now = new Date().toISOString();

  todayTasks.forEach(task => {
    const copiedTask = {
      ...task,
      id: generateUUID(),
      dueDate: tomorrow.toISOString(),
      isCompleted: false,
      createdAt: now,
      updatedAt: now
    };
    allTasks.unshift(copiedTask);
  });

  saveTasks(allTasks);
  alert(`${todayTasks.length}個のタスクを明日にコピーしました`);
  renderTasks();

  // 振動フィードバック
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
}

// ========================================
// クイック入力バー＆完了済みセクション（新UI）
// ========================================

/**
 * クイック入力バーを初期化（新UI用）
 */
function initQuickInput() {
  // Note: クイック入力フォームのイベントリスナーはevents.jsで既に設定されているため、ここでは何もしない
  // events.js の initEventListeners() 内で quickAddForm の submit イベントを設定している
  console.log('initQuickInput: Quick input already initialized in events.js');
}

/**
 * クイック入力を送信
 */
function submitQuickInput() {
  const quickInput = document.getElementById('new-quick-input');
  const title = quickInput ? quickInput.value.trim() : '';

  if (!title) {
    alert('タスク名を入力してください');
    return;
  }

  // 今日の日付を期限として設定
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString();

  // タスク作成
  createTask(title, '', todayISO, null);

  // 入力フィールドをクリア
  if (quickInput) {
    quickInput.value = '';
    quickInput.focus();
  }

  // 振動フィードバック
  if (navigator.vibrate) {
    navigator.vibrate(30);
  }

  // 再レンダリング
  renderTasks();
}

/**
 * 完了済みセクションのトグル初期化（新UI用）
 */
function initCompletedToggle() {
  // Note: 完了済みセクションのトグルのイベントリスナーはevents.jsで既に設定されているため、ここでは何もしない
  // events.js の initEventListeners() 内で completedToggle のクリックイベントを設定している
  console.log('initCompletedToggle: Completed toggle already initialized in events.js');
}
