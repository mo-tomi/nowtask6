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
