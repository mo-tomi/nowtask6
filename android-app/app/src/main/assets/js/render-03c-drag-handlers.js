
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

