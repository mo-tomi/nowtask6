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
