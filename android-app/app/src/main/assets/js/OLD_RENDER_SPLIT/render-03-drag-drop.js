function createSubtaskInputInline(parentId, parentLevel = 0) {
  const div = document.createElement('div');
  div.className = 'subtask-input-inline';
  div.classList.add(`level-${parentLevel + 1}`);

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'サブタスク名を入力';
  input.maxLength = 100;

  const saveInlineSubtask = () => {
    const title = input.value.trim();
    if (title) {
      createTask(title, '', null, parentId);
    }
    addingSubtaskForTaskId = null;
    renderTasks();
  };

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveInlineSubtask();
    }
  });

  input.addEventListener('blur', () => {
    setTimeout(() => {
      addingSubtaskForTaskId = null;
      renderTasks();
    }, 200);
  });

  div.appendChild(input);

  // 自動フォーカス
  setTimeout(() => input.focus(), 0);

  return div;
}

// ========================================
// ドラッグ&ドロップ機能
// ========================================
let draggedElement = null;
let longPressTimer = null;
let isDragging = false;
let dragStartX = 0;
let dragStartLevel = 0;
let currentDragLevel = 0;

// スワイプジェスチャー用の変数
let isSwiping = false;
let swipeDirection = null; // 'left' | 'right' | null

function setupDragAndDrop(element, task) {
  let startY = 0;
  let startX = 0;
  let swipeStartTime = 0;
  let hasMoved = false; // ドラッグで実際に移動したかどうか
  let dragDistance = 0; // ドラッグした距離
  let longPressTouchX = 0; // 長押し時のタッチ位置X
  let longPressTouchY = 0; // 長押し時のタッチ位置Y

  // タッチデバイス用の長押し検出
  element.addEventListener('touchstart', (e) => {
    // チェックボックスやボタンの場合は無視
    if (e.target.closest('.task-checkbox') || e.target.closest('.task-card-actions') ||
        e.target.closest('.new-task-checkbox') || e.target.closest('.new-task-menu-btn')) {
      return;
    }

    const touch = e.touches[0];
    startY = touch.clientY;
    startX = touch.clientX;
    longPressTouchX = touch.clientX;
    longPressTouchY = touch.clientY;
    swipeStartTime = Date.now();
    isSwiping = false;
    swipeDirection = null;
    hasMoved = false;
    dragDistance = 0;

    // 500ms長押しでコンテキストメニュー表示
    longPressTimer = setTimeout(() => {
      if (!isSwiping) {
        // 振動フィードバック（対応デバイスのみ）
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }

        // コンテキストメニューを表示
        showTaskMenuFromLongPress(longPressTouchX, longPressTouchY, task);

        // 長押しタイマーをクリア
        longPressTimer = null;
      }
    }, 500);
  });

  element.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const moveY = Math.abs(touch.clientY - startY);
    const moveX = touch.clientX - startX;
    const moveXAbs = Math.abs(moveX);

    // スワイプジェスチャー判定（水平方向の移動が垂直方向より大きい場合）
    if (!isDragging && !isSwiping && moveXAbs > 25 && moveXAbs > moveY * 1.5) {
      // 長押しタイマーをキャンセル
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }

      isSwiping = true;
      element.classList.add('swiping');

      // 振動フィードバック
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    }

    // スワイプ中の視覚的フィードバック
    if (isSwiping) {
      e.preventDefault(); // 画面スクロールを防止
      e.stopPropagation(); // イベント伝播を停止

      // 真ん中のキャンセルゾーン（±15px以内）
      const CANCEL_ZONE = 15;

      if (moveXAbs <= CANCEL_ZONE) {
        // キャンセルゾーン内：どの方向のスタイルも外す
        swipeDirection = null;
        element.classList.remove('swiping-left', 'swiping-right');
      } else {
        // キャンセルゾーン外：スワイプ方向を判定
        if (moveX > CANCEL_ZONE) {
          swipeDirection = 'right';
          element.classList.remove('swiping-left');
          element.classList.add('swiping-right');
        } else if (moveX < -CANCEL_ZONE) {
          swipeDirection = 'left';
          element.classList.remove('swiping-right');
          element.classList.add('swiping-left');
        }
      }
    }
    // ドラッグ&ドロップ中の処理
    else if (isDragging && draggedElement) {
      e.preventDefault();

      // 移動距離を計算（50px以上移動したら実際に移動したとみなす）
      const totalMoveY = Math.abs(touch.clientY - startY);
      const totalMoveX = Math.abs(touch.clientX - startX);
      dragDistance = Math.max(totalMoveY, totalMoveX);

      if (dragDistance > 50 && !hasMoved) {
        hasMoved = true; // 50px以上移動したら移動判定
        console.log('Drag moved more than 50px - will save position');
      }

      // 水平方向のドラッグで階層を変更
      const deltaX = touch.clientX - dragStartX;
      const indentSize = 40; // 1階層のインデント幅（px）
      const levelChange = Math.floor(deltaX / indentSize);
      const newLevel = Math.max(0, Math.min(4, dragStartLevel + levelChange));

      // レベルが変更された場合、視覚的なフィードバックを提供
      if (newLevel !== currentDragLevel) {
        currentDragLevel = newLevel;
        draggedElement.dataset.level = newLevel;
        // 既存クラスを保持しながらdraggingを追加
        draggedElement.classList.add('dragging');
        // 旧レベルのクラスを削除
        for (let i = 0; i <= 4; i++) {
          draggedElement.classList.remove(`level-${i}`);
        }
        if (newLevel > 0) {
          draggedElement.classList.add('subtask');
          draggedElement.classList.add(`level-${newLevel}`);
        } else {
          draggedElement.classList.remove('subtask');
        }
        // 振動フィードバック
        if (navigator.vibrate) {
          navigator.vibrate(20);
        }
      }

      const afterElement = getDragAfterElement(element.parentElement, touch.clientY);

      if (afterElement == null) {
        element.parentElement.appendChild(draggedElement);
      } else {
        element.parentElement.insertBefore(draggedElement, afterElement);
      }
    }
    // 水平方向の動きを検出したら早めにスクロールを防止
    else if (!isDragging && moveXAbs > 10 && moveXAbs > moveY) {
      e.preventDefault(); // 横方向の動きが優位なら画面スクロールを防止
    }

    // 長押しタイマーをキャンセル（20px以上動いた場合）
    if (longPressTimer && (moveY > 20 || moveXAbs > 20)) {
      if (!isSwiping) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }
  });

  element.addEventListener('touchend', (e) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }

    // スワイプジェスチャーの処理
    if (isSwiping) {
      e.preventDefault();

      const touch = e.changedTouches[0];
      const moveX = touch.clientX - startX;
      const swipeDuration = Date.now() - swipeStartTime;
      const CANCEL_ZONE = 15;

      // スワイプ判定（キャンセルゾーン外 かつ 1000ms以内）
      if (Math.abs(moveX) > CANCEL_ZONE && swipeDuration < 1000 && swipeDirection) {
        if (swipeDirection === 'right') {
          // 右スワイプ: タスク完了/未完了トグル
          handleSwipeRight(task.id, element);
        } else if (swipeDirection === 'left') {
          // 左スワイプ: タスク削除
          handleSwipeLeft(task.id, element);
        }
      } else {
        // キャンセルゾーン内またはスワイプ不十分な場合、元に戻す
        element.classList.add('swipe-reset');
        setTimeout(() => {
          element.classList.remove('swiping', 'swiping-right', 'swiping-left', 'swipe-reset');
        }, 300);
      }

      isSwiping = false;
      swipeDirection = null;
    }
    // ドラッグ&ドロップの終了処理
    else if (isDragging && draggedElement) {
      e.preventDefault();
      element.classList.remove('dragging');

      console.log(`touchend - isDragging: true, hasMoved: ${hasMoved}, dragDistance: ${dragDistance}px`);

      // 実際に移動した場合のみ新しい順序を保存
      if (hasMoved) {
        console.log('Saving new task order (moved > 50px)');
        saveNewTaskOrder();
      } else {
        console.log('NOT saving - drag distance too small');
      }

      isDragging = false;
      draggedElement = null;
      dragStartX = 0;
      dragStartLevel = 0;
      currentDragLevel = 0;
      hasMoved = false;
      dragDistance = 0;
    }
  });

  // MIUIなどのシステムがタッチをキャンセルした場合の処理
  element.addEventListener('touchcancel', (e) => {
    console.log(`touchcancel - isDragging: ${isDragging}, hasMoved: ${hasMoved}, dragDistance: ${dragDistance}px`);

    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }

    // スワイプ中の場合はリセット
    if (isSwiping) {
      element.classList.add('swipe-reset');
      setTimeout(() => {
        element.classList.remove('swiping', 'swiping-right', 'swiping-left', 'swipe-reset');
      }, 300);
      isSwiping = false;
      swipeDirection = null;
    }

    // ドラッグ中の場合もリセット（保存しない）
    if (isDragging && draggedElement) {
      element.classList.remove('dragging');

      // touchcancelの場合は絶対に保存しない
      console.log('Touch cancelled by system - FORCING not to save position');

      isDragging = false;
      draggedElement = null;
      dragStartX = 0;
      dragStartLevel = 0;
      currentDragLevel = 0;
      hasMoved = false;
      dragDistance = 0;

      // 再レンダリングして元の状態に戻す
      renderTasks();
    }
  });

  // PC用のドラッグ&ドロップ
  element.setAttribute('draggable', 'true');

  element.addEventListener('dragstart', (e) => {
    // チェックボックスやボタンの場合は無視
    if (e.target.closest('.task-checkbox') || e.target.closest('.task-card-actions') ||
        e.target.closest('.new-task-checkbox') || e.target.closest('.new-task-menu-btn')) {
      e.preventDefault();
      return;
    }

    draggedElement = element;
    dragStartX = e.clientX;
    dragStartLevel = Number(element.dataset.level || 0);
    currentDragLevel = dragStartLevel;
    element.classList.add('dragging');
  });

  element.addEventListener('drag', (e) => {
    if (e.clientX === 0 && e.clientY === 0) return; // ドラッグ終了時のイベントを無視

    // 水平方向のドラッグで階層を変更
    const deltaX = e.clientX - dragStartX;
    const indentSize = 40; // 1階層のインデント幅（px）
    const levelChange = Math.floor(deltaX / indentSize);
    const newLevel = Math.max(0, Math.min(4, dragStartLevel + levelChange));

    // レベルが変更された場合、視覚的なフィードバックを提供
    if (newLevel !== currentDragLevel) {
      currentDragLevel = newLevel;
      draggedElement.dataset.level = newLevel;
      // 既存クラスを保持しながらdraggingを追加
      draggedElement.classList.add('dragging');
      // 旧レベルのクラスを削除
      for (let i = 0; i <= 4; i++) {
        draggedElement.classList.remove(`level-${i}`);
      }
      if (newLevel > 0) {
        draggedElement.classList.add('subtask');
        draggedElement.classList.add(`level-${newLevel}`);
      } else {
        draggedElement.classList.remove('subtask');
      }
    }
  });

  element.addEventListener('dragend', () => {
    console.log('dragend event fired');
    element.classList.remove('dragging');

    // 新しい順序を保存（ガードがあるので安全）
    saveNewTaskOrder();

    draggedElement = null;
    dragStartX = 0;
    dragStartLevel = 0;
    currentDragLevel = 0;
  });

  element.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(element.parentElement, e.clientY);

    if (draggedElement && draggedElement !== element) {
      if (afterElement == null) {
        element.parentElement.appendChild(draggedElement);
      } else {
        element.parentElement.insertBefore(draggedElement, afterElement);
      }
    }
  });
}

function getDragAfterElement(container, y) {
  // 旧カード（.task-item）と新カード（.new-task-card）の両方を選択
  const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging), .new-task-card:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function saveNewTaskOrder() {
  // ガード: ドラッグ中でない場合は保存しない
  if (!isDragging && !draggedElement) {
    console.log('saveNewTaskOrder called but not dragging - BLOCKING SAVE');
    return;
  }

  const tasks = getTasks();
  // 旧カード（.task-item）と新カード（.new-task-card）の両方を選択
  const taskElements = document.querySelectorAll('.task-item:not(.completed), .new-task-card:not(.completed)');

  // 新しい順序とレベルでタスクIDを取得
  const newOrder = [];
  taskElements.forEach(el => {
    const taskId = el.dataset.taskId;
    if (taskId) {
      newOrder.push({
        id: taskId,
        level: Number(el.dataset.level || 0)
      });
    }
  });

  // ドラッグされたタスクの新しい親を決定
  const draggedTaskId = draggedElement ? draggedElement.dataset.taskId : null;
  if (draggedTaskId) {
    const draggedIndex = newOrder.findIndex(item => item.id === draggedTaskId);
    if (draggedIndex !== -1) {
      const draggedLevel = newOrder[draggedIndex].level;
      let newParentId = null;

      // ドラッグされたタスクの直前のタスクを探す
      for (let i = draggedIndex - 1; i >= 0; i--) {
        const prevTask = newOrder[i];

        // 同じレベルの場合は、同じ親を持つ
        if (prevTask.level === draggedLevel) {
          const prevTaskData = getTaskById(prevTask.id);
          newParentId = prevTaskData ? prevTaskData.parentId : null;
          break;
        }
        // 1つ浅いレベルの場合は、そのタスクを親とする
        else if (prevTask.level === draggedLevel - 1) {
          newParentId = prevTask.id;
          break;
        }
        // より浅いレベルの場合は、そのレベルまで戻って親を探す
        else if (prevTask.level < draggedLevel - 1) {
          const prevTaskData = getTaskById(prevTask.id);
          newParentId = prevTaskData ? prevTaskData.parentId : null;
          break;
        }
      }

      // バリデーション: 新しい親が有効かチェック
      const draggedTask = getTaskById(draggedTaskId);
      let isValidParent = true;

      if (newParentId) {
        // 1. サブタスクを持つタスクは他のタスクのサブタスクにできない
        const draggedSubtasks = getSubtasks(draggedTaskId);
        if (draggedSubtasks.length > 0) {
          // 新しい親が設定される場合（独立タスクからサブタスクになる場合）
          const newParentLevel = getTaskLevel(newParentId);
          if (newParentLevel + draggedSubtasks.length + 1 > 4) {
            isValidParent = false;
          }
        }

        // 2. 5階層制限のチェック
        const newParentLevel = getTaskLevel(newParentId);
        if (newParentLevel >= 4) {
          isValidParent = false;
        }

        // 3. 自分自身や自分の子孫を親にできない
        let ancestor = newParentId;
        while (ancestor) {
          if (ancestor === draggedTaskId) {
            isValidParent = false;
            break;
          }
          const ancestorTask = getTaskById(ancestor);
          ancestor = ancestorTask ? ancestorTask.parentId : null;
        }
      }

      // ドラッグされたタスクの親IDを更新
      if (draggedTask && draggedTask.parentId !== newParentId && isValidParent) {
        updateTask(draggedTaskId, { parentId: newParentId });

        // 元の親タスクの時間を再集計
        if (draggedTask.parentId && typeof aggregateSubtaskTimes === 'function') {
          aggregateSubtaskTimes(draggedTask.parentId);
        }
        // 新しい親タスクの時間を集計
        if (newParentId && typeof aggregateSubtaskTimes === 'function') {
          aggregateSubtaskTimes(newParentId);
        }
      } else if (!isValidParent) {
        // 無効な親の場合は元のレベルに戻す
        console.warn('Invalid parent: Cannot create this hierarchy');
      }

      // 日付を跨ぐドラッグ: ドラッグされたタスクの日付を更新
      // ドラッグされたタスクの直前の日付セパレーターを見つける
      const draggedTaskElement = draggedElement;
      if (draggedTaskElement && draggedTask && draggedLevel === 0) {
        // レベル0（親タスク）の場合のみ日付変更を許可
        let currentElement = draggedTaskElement.previousElementSibling;
        let nearestDateSeparator = null;

        // 直前の日付セパレーターを探す
        while (currentElement) {
          if (currentElement.classList.contains('date-separator')) {
            nearestDateSeparator = currentElement;
            break;
          }
          currentElement = currentElement.previousElementSibling;
        }

        if (nearestDateSeparator) {
          const newDateISO = nearestDateSeparator.dataset.date;
          if (newDateISO) {
            // 新しい日付を設定（ISO形式: YYYY-MM-DD）
            const newDueDate = new Date(newDateISO + 'T00:00:00').toISOString();
            if (draggedTask.dueDate !== newDueDate) {
              updateTask(draggedTaskId, { dueDate: newDueDate });
            }
          } else if (newDateISO === '') {
            // 期限なしセクションにドラッグされた場合
            if (draggedTask.dueDate) {
              updateTask(draggedTaskId, { dueDate: null });
            }
          }
        }
      }
    }
  }

  // タスクの順序を更新（customOrder フィールドを追加）
  tasks.forEach((task, index) => {
    const newIndex = newOrder.findIndex(item => item.id === task.id);
    if (newIndex !== -1) {
      task.customOrder = newIndex;
    }
  });

  // 保存
  saveTasks(tasks);

  // 再レンダリング
  renderTasks();
}

// ========================================
