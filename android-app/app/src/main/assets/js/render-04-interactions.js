// ========================================
// スワイプジェスチャーハンドラー
// ========================================

/**
 * 右スワイプ: タスク完了/未完了トグル
 */
function handleSwipeRight(taskId, element) {
  const task = getTaskById(taskId);
  if (!task) return;

  // 完了状態をトグル
  const newCompletedState = !task.isCompleted;
  updateTask(taskId, { isCompleted: newCompletedState });

  // 振動フィードバック
  if (navigator.vibrate) {
    navigator.vibrate(30);
  }

  // アニメーションでフェードアウト
  element.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
  element.style.opacity = '0';
  element.style.transform = 'translateX(100px)';

  // 300ms後に再レンダリング
  setTimeout(() => {
    renderTasks();
  }, 300);
}

/**
 * 左スワイプ: タスク削除
 */
function handleSwipeLeft(taskId, element) {
  const task = getTaskById(taskId);
  if (!task) return;

  // 確認ダイアログを表示
  const confirmDelete = confirm(`「${task.title}」を削除してもよろしいですか？`);

  if (confirmDelete) {
    // 振動フィードバック
    if (navigator.vibrate) {
      navigator.vibrate([20, 50, 20]);
    }

    // アニメーションでフェードアウト
    element.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
    element.style.opacity = '0';
    element.style.transform = 'translateX(-100px)';

    // 300ms後にタスクを削除して再レンダリング
    setTimeout(() => {
      deleteTask(taskId);
      renderTasks();
    }, 300);
  } else {
    // キャンセルした場合は元に戻す
    element.classList.add('swipe-reset');
    setTimeout(() => {
      element.classList.remove('swiping', 'swiping-left', 'swipe-reset');
    }, 300);
  }
}

// ========================================
// タスクメニュー
// ========================================

/**
 * 長押しからコンテキストメニューを表示
 */
function showTaskMenuFromLongPress(touchX, touchY, task) {
  // 既存のメニューを削除
  const existingMenu = document.querySelector('.task-context-menu');
  if (existingMenu) {
    existingMenu.remove();
  }

  // メニューを作成
  const menu = createTaskMenuElement(task);

  // メニューの位置を設定（タッチ位置の下に表示）
  menu.style.position = 'fixed';

  // 画面サイズを取得
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // メニューを一時的に表示して高さを取得
  menu.style.visibility = 'hidden';
  document.body.appendChild(menu);
  const menuHeight = menu.offsetHeight;
  const menuWidth = menu.offsetWidth;

  // 位置を計算（画面外に出ないように調整）
  let top = touchY + 10;
  let left = touchX - menuWidth / 2;

  // 下にはみ出る場合は上に表示
  if (top + menuHeight > windowHeight) {
    top = touchY - menuHeight - 10;
  }

  // 左にはみ出る場合
  if (left < 10) {
    left = 10;
  }

  // 右にはみ出る場合
  if (left + menuWidth > windowWidth - 10) {
    left = windowWidth - menuWidth - 10;
  }

  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;
  menu.style.visibility = 'visible';

  // メニュー外をタップで閉じる
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });

    // タッチイベントでも閉じる
    document.addEventListener('touchstart', function closeTouchMenu(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('touchstart', closeTouchMenu);
      }
    });
  }, 0);
}

/**
 * ボタンクリックからコンテキストメニューを表示
 */
function showTaskMenu(event, task) {
  // 既存のメニューを削除
  const existingMenu = document.querySelector('.task-context-menu');
  if (existingMenu) {
    existingMenu.remove();
  }

  // メニューを作成
  const menu = createTaskMenuElement(task);

  // メニューの位置を設定
  const rect = event.target.getBoundingClientRect();
  menu.style.position = 'fixed';
  menu.style.top = `${rect.bottom + 5}px`;
  menu.style.left = `${rect.left}px`;

  document.body.appendChild(menu);

  // メニュー外をクリックで閉じる
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 0);
}

/**
 * タスクメニュー要素を作成（共通関数）
 */
function createTaskMenuElement(task) {
  const menu = document.createElement('div');
  menu.className = 'task-context-menu';

  // 編集ボタン
  const editItem = document.createElement('div');
  editItem.className = 'menu-item';
  editItem.textContent = '✏️ 編集';
  editItem.addEventListener('click', () => {
    openEditModal(task.id);
    menu.remove();
  });
  menu.appendChild(editItem);

  // 移動ボタン
  const moveItem = document.createElement('div');
  moveItem.className = 'menu-item';
  moveItem.textContent = '📅 移動';
  moveItem.addEventListener('click', () => {
    showMoveDateMenu(task, menu);
  });
  menu.appendChild(moveItem);

  // 時間記録開始/停止ボタン
  const timerItem = document.createElement('div');
  timerItem.className = 'menu-item';
  if (task.isTimerRunning) {
    timerItem.textContent = '⏸️ 時間記録停止';
    timerItem.addEventListener('click', () => {
      stopTaskTimer(task.id);
      menu.remove();
      renderTasks();
    });
  } else {
    timerItem.textContent = '▶️ 時間記録開始';
    timerItem.addEventListener('click', () => {
      startTaskTimer(task.id);
      menu.remove();
      renderTasks();
    });
  }
  menu.appendChild(timerItem);

  // 複製ボタン
  const duplicateItem = document.createElement('div');
  duplicateItem.className = 'menu-item';
  duplicateItem.textContent = '📋 複製';
  duplicateItem.addEventListener('click', () => {
    duplicateTask(task.id);
    menu.remove();
    renderTasks();
  });
  menu.appendChild(duplicateItem);

  // 削除ボタン
  const deleteItem = document.createElement('div');
  deleteItem.className = 'menu-item delete-item';
  deleteItem.textContent = '🗑️ 削除';
  deleteItem.addEventListener('click', () => {
    if (confirm(`「${task.title}」を削除してもよろしいですか？`)) {
      deleteTask(task.id);
      menu.remove();
      renderTasks();
    }
  });
  menu.appendChild(deleteItem);

  return menu;
}

/**
 * 日付移動サブメニューを表示
 */
function showMoveDateMenu(task, parentMenu) {
  // サブメニューを作成
  const submenu = document.createElement('div');
  submenu.className = 'task-context-menu';
  submenu.style.position = 'fixed';

  // 親メニューの位置を基準に配置
  const parentRect = parentMenu.getBoundingClientRect();
  submenu.style.left = `${parentRect.left}px`;
  submenu.style.top = `${parentRect.top}px`;

  // 今日
  const todayItem = document.createElement('div');
  todayItem.className = 'menu-item';
  todayItem.textContent = '📅 今日';
  todayItem.addEventListener('click', () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    updateTask(task.id, { dueDate: today.toISOString() });
    parentMenu.remove();
    submenu.remove();
    renderTasks();
  });
  submenu.appendChild(todayItem);

  // 明日
  const tomorrowItem = document.createElement('div');
  tomorrowItem.className = 'menu-item';
  tomorrowItem.textContent = '📅 明日';
  tomorrowItem.addEventListener('click', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    updateTask(task.id, { dueDate: tomorrow.toISOString() });
    parentMenu.remove();
    submenu.remove();
    renderTasks();
  });
  submenu.appendChild(tomorrowItem);

  // 来週
  const nextWeekItem = document.createElement('div');
  nextWeekItem.className = 'menu-item';
  nextWeekItem.textContent = '📅 来週';
  nextWeekItem.addEventListener('click', () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(12, 0, 0, 0);
    updateTask(task.id, { dueDate: nextWeek.toISOString() });
    parentMenu.remove();
    submenu.remove();
    renderTasks();
  });
  submenu.appendChild(nextWeekItem);

  // 期限なし
  const noDateItem = document.createElement('div');
  noDateItem.className = 'menu-item';
  noDateItem.textContent = '📅 期限なし';
  noDateItem.addEventListener('click', () => {
    updateTask(task.id, { dueDate: null });
    parentMenu.remove();
    submenu.remove();
    renderTasks();
  });
  submenu.appendChild(noDateItem);

  // 戻る
  const backItem = document.createElement('div');
  backItem.className = 'menu-item';
  backItem.textContent = '← 戻る';
  backItem.addEventListener('click', () => {
    submenu.remove();
  });
  submenu.appendChild(backItem);

  // 親メニューを非表示にして、サブメニューを表示
  parentMenu.style.display = 'none';
  document.body.appendChild(submenu);

  // サブメニュー外をクリック/タッチで両方閉じる
  setTimeout(() => {
    const closeHandler = (e) => {
      if (!submenu.contains(e.target)) {
        submenu.remove();
        parentMenu.remove();
        document.removeEventListener('click', closeHandler);
        document.removeEventListener('touchstart', closeHandler);
      }
    };
    document.addEventListener('click', closeHandler);
    document.addEventListener('touchstart', closeHandler);
  }, 0);
}

// ========================================
