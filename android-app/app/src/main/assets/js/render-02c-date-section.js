function renderDateGroup(date, label, dateTasks, container, sortPref) {
  // 各日付グループ内でソートを適用
  if (sortPref === 'time') {
    dateTasks.sort((a, b) => {
      // 期限なしは末尾に回す
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  } else if (sortPref === 'created') {
    // 追加順: createdAt の降順（新しいものを上に）
    dateTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortPref === 'priority') {
    // 優先順位順: 緊急 > 高 > 中 > 低 > 未設定
    const priorityOrder = { high: 1, medium: 2, low: 3, '': 4 };
    dateTasks.sort((a, b) => {
      // 緊急フラグを最優先
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      // 優先度で比較
      const aPriority = priorityOrder[a.priority || ''] || 4;
      const bPriority = priorityOrder[b.priority || ''] || 4;
      return aPriority - bPriority;
    });
  }

  // セクションラベルのレンダリング
  const sectionLabel = renderSectionLabel(date, label);
  container.appendChild(sectionLabel);

  // タスクをレンダリング
  dateTasks.forEach(task => {
    renderTaskWithSubtasks(task, container, false);
  });

  // 明日のタスクの場合、追加ボタンを表示
  if (date === 'tomorrow') {
    const addTomorrowBtn = document.createElement('button');
    addTomorrowBtn.className = 'add-tomorrow-task-btn';
    addTomorrowBtn.innerHTML = '+ 明日のタスクを追加';
    addTomorrowBtn.addEventListener('click', () => {
      // 明日の日付を設定してモーダルを開く
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowISO = formatDateISO(tomorrow);
      openCreateModal();
      // モーダルが開いた後に日付を設定
      setTimeout(() => {
        document.getElementById('task-due-date').value = tomorrowISO;
      }, 0);
    });
    container.appendChild(addTomorrowBtn);
  }
}

// タスクとサブタスクを再帰的にレンダリング
function renderTaskWithSubtasks(task, container, isCompletedSection) {
  const level = getTaskLevel(task.id);

  // タスク要素を作成
  container.appendChild(createTaskElement(task, level));

  // サブタスクを再帰的に表示
  const subtasks = getSubtasks(task.id);
  subtasks.forEach(subtask => {
    // 完了状態によってフィルタリング
    if (isCompletedSection) {
      if (subtask.isCompleted) {
        renderTaskWithSubtasks(subtask, container, true);
      }
    } else {
      if (!subtask.isCompleted) {
        renderTaskWithSubtasks(subtask, container, false);
      }
    }
  });

  // インライン入力中の場合
  if (addingSubtaskForTaskId === task.id) {
    const inputDiv = createSubtaskInputInline(task.id, level);
    container.appendChild(inputDiv);
  }
}

// タスク要素作成
