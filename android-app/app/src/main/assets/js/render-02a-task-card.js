function createNewTaskCard(task, level = 0) {
  const card = document.createElement('div');
  card.className = 'new-task-card' + (task.isCompleted ? ' completed' : '');

  // 優先度に基づくクラスを追加
  if (task.urgent) {
    card.classList.add('urgent');
  } else if (task.priority) {
    card.classList.add(`priority-${task.priority}`);
  }

  // データ属性
  card.dataset.id = task.id;
  card.dataset.taskId = task.id;
  card.dataset.level = level;

  // チェックボックス
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'new-task-checkbox';
  checkbox.checked = task.isCompleted;
  checkbox.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isSelectionMode) {
      toggleTaskSelection(task.id);
    } else {
      toggleTaskCompletion(task.id);
    }
  });
  card.appendChild(checkbox);

  // ボディ（タイトル + メタ）
  const body = document.createElement('div');
  body.className = 'new-task-body';

  const title = document.createElement('div');
  title.className = 'new-task-title';

  // 検索キーワードハイライト
  if (currentSearchKeyword && typeof window.searchFilter !== 'undefined' && typeof window.searchFilter.highlightSearchResult === 'function') {
    title.innerHTML = window.searchFilter.highlightSearchResult(task.title, currentSearchKeyword);
  } else {
    title.textContent = task.title;
  }

  body.appendChild(title);

  // メタ情報
  const meta = createNewTaskMeta(task);
  if (meta.children.length > 0) {
    body.appendChild(meta);
  }

  card.appendChild(body);

  // アクションボタングループ
  const actions = document.createElement('div');
  actions.className = 'new-task-actions';

  // サブタスク追加ボタン（未完了タスクのみ表示）
  if (!task.isCompleted && typeof canHaveSubtask === 'function' && canHaveSubtask(task.id)) {
    const addSubtaskBtn = document.createElement('button');
    addSubtaskBtn.className = 'new-task-action-btn';
    addSubtaskBtn.innerHTML = '+';
    addSubtaskBtn.title = 'サブタスクを追加';
    addSubtaskBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof addingSubtaskForTaskId !== 'undefined' && typeof renderTasks === 'function') {
        addingSubtaskForTaskId = task.id;
        renderTasks();
      }
    });
    actions.appendChild(addSubtaskBtn);
  }

  // メニューボタン
  const menuBtn = document.createElement('button');
  menuBtn.className = 'new-task-menu-btn';
  menuBtn.innerHTML = '⋮';
  menuBtn.title = 'メニュー';
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showTaskMenu(e, task);
  });
  actions.appendChild(menuBtn);

  card.appendChild(actions);

  // クリックで編集
  card.addEventListener('click', (e) => {
    if (!e.target.closest('.new-task-checkbox') && !e.target.closest('.new-task-menu-btn') && !e.target.closest('.new-task-action-btn')) {
      openEditModal(task.id);
    }
  });

  return card;
}

// タスクリスト表示
