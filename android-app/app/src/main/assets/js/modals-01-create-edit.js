// ========================================
// モーダル管理
// ========================================

// 新規作成モーダルを開く
function openCreateModal() {
  editingTaskId = null;

  document.getElementById('modal-title').textContent = '新規タスク';
  document.getElementById('task-title').value = '';
  document.getElementById('task-memo').value = '';

  // 今日の日付をデフォルトに設定
  const today = new Date();
  const localISO = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  document.getElementById('task-due-date').value = localISO;

  document.getElementById('task-duration').value = '';
  document.getElementById('task-start-time').value = '';
  document.getElementById('task-end-time').value = '';
  document.getElementById('task-urgent').checked = false;
  document.getElementById('task-priority').value = '';
  document.getElementById('title-char-count').textContent = '0';
  document.getElementById('delete-btn').style.display = 'none';
  document.getElementById('timer-section').style.display = 'none';
  document.getElementById('subtasks-section').style.display = 'none';
  document.getElementById('save-btn').disabled = true;

  // 時間フィールドの自動計算イベントを設定
  setupTimeAutoCalculation();

  document.getElementById('task-modal').classList.add('show');
  document.getElementById('task-title').focus();
}

// 編集モーダルを開く
function openEditModal(id) {
  const task = getTaskById(id);
  if (!task) return;

  editingTaskId = id;

  document.getElementById('modal-title').textContent = 'タスク編集';
  document.getElementById('task-title').value = task.title;
  document.getElementById('task-memo').value = task.memo;
  document.getElementById('title-char-count').textContent = task.title.length;

  if (task.dueDate) {
    // ISO形式をdate形式に変換
    const date = new Date(task.dueDate);
    const localISO = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    document.getElementById('task-due-date').value = localISO;
  } else {
    document.getElementById('task-due-date').value = '';
  }
  // 所要時間・開始時刻・終了時刻・緊急・優先順位を反映
  document.getElementById('task-duration').value = task.duration || '';
  document.getElementById('task-start-time').value = task.startTime || '';
  document.getElementById('task-end-time').value = task.endTime || '';
  document.getElementById('task-urgent').checked = task.urgent || false;
  document.getElementById('task-priority').value = task.priority || '';

  document.getElementById('delete-btn').style.display = 'inline-block';
  document.getElementById('timer-section').style.display = 'block';
  document.getElementById('subtasks-section').style.display = 'block';
  document.getElementById('save-btn').disabled = false;

  // サブタスクリスト表示
  editingSubtasks = getSubtasks(id);
  renderSubtasksList();

  // タイマー表示更新
  updateTimerDisplay(id);

  // タイマー更新インターバル設定
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  timerInterval = setInterval(() => {
    if (editingTaskId) {
      updateTimerDisplay(editingTaskId);
    }
  }, 1000);

  // 時間フィールドの自動計算イベントを設定
  setupTimeAutoCalculation();

  document.getElementById('task-modal').classList.add('show');
  document.getElementById('task-title').focus();
}

// モーダルを閉じる
function closeModal() {
  const modal = document.getElementById('task-modal');

  // 閉じるアニメーションを開始
  modal.classList.add('hiding');

  // アニメーション終了後に実際に閉じる
  setTimeout(() => {
    modal.classList.remove('show', 'hiding');
    editingTaskId = null;
    editingSubtasks = [];

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }, 200); // 200ms（アニメーション時間）
}

// サブタスクリスト表示
function renderSubtasksList() {
  const container = document.getElementById('subtasks-list');
  container.innerHTML = '';

  editingSubtasks.forEach((subtask, index) => {
    const item = document.createElement('div');
    item.className = 'subtask-item' + (subtask.isCompleted ? ' completed' : '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = subtask.isCompleted;
    checkbox.addEventListener('change', () => {
      editingSubtasks[index].isCompleted = checkbox.checked;
      renderSubtasksList();
    });

    // タイトルを編集可能にする
    if (subtask.isEditing) {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = subtask.title || '';
      input.className = 'subtask-input';
      input.maxLength = 100;
      input.placeholder = 'サブタスク名を入力';

      input.addEventListener('blur', () => {
        if (input.value.trim()) {
          editingSubtasks[index].title = input.value.trim();
          editingSubtasks[index].isEditing = false;
          renderSubtasksList();
        } else {
          // 空の場合は削除
          editingSubtasks.splice(index, 1);
          renderSubtasksList();
        }
      });

      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          input.blur();
        }
      });

      item.appendChild(checkbox);
      item.appendChild(input);
      container.appendChild(item);

      // 自動フォーカス
      setTimeout(() => input.focus(), 0);
    } else {
      const title = document.createElement('span');
      title.textContent = subtask.title;

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '×';
      deleteBtn.addEventListener('click', () => {
        editingSubtasks.splice(index, 1);
        renderSubtasksList();
      });

      item.appendChild(checkbox);
      item.appendChild(title);
      item.appendChild(deleteBtn);
      container.appendChild(item);
    }
  });
}

// サブタスク追加
function addSubtask() {
  const subtask = {
    id: generateUUID(),
    title: '',
    memo: '',
    dueDate: null,
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parentId: editingTaskId,
    isTutorial: false,
    totalTime: 0,
    isTimerRunning: false,
    timerStartTime: null,
    isEditing: true
  };

  editingSubtasks.push(subtask);
  renderSubtasksList();
}

// タスク保存
function saveTask() {
  const title = document.getElementById('task-title').value.trim();
  if (!title) {
    alert('タスク名を入力してください');
    return;
  }

  const memo = document.getElementById('task-memo').value.trim();
  const dueDateInput = document.getElementById('task-due-date').value;
  const durationValue = document.getElementById('task-duration').value;
  const duration = durationValue ? parseInt(durationValue) : null;
  const startTime = document.getElementById('task-start-time').value || null;
  const endTime = document.getElementById('task-end-time').value || null;
  const urgent = document.getElementById('task-urgent').checked;
  const priority = document.getElementById('task-priority').value;

  // 期限日のみ（時刻なし）
  let dueDate = null;
  if (dueDateInput) {
    dueDate = new Date(dueDateInput + 'T00:00:00').toISOString();
  }

  if (editingTaskId) {
    // 更新
    updateTask(editingTaskId, { title, memo, dueDate, duration, startTime, endTime, urgent, priority });

    // サブタスク保存
    const tasks = getTasks();
    const existingSubtaskIds = getSubtasks(editingTaskId).map(st => st.id);

    // 削除されたサブタスクを処理
    existingSubtaskIds.forEach(id => {
      if (!editingSubtasks.find(st => st.id === id)) {
        deleteTask(id);
      }
    });

    // サブタスクを保存
    editingSubtasks.forEach(subtask => {
      const existingTask = getTaskById(subtask.id);
      if (existingTask) {
        updateTask(subtask.id, subtask);
      } else {
        const newTasks = getTasks();
        // サブタスクに duration が指定されていれば反映（通常は null）
        if (subtask.duration === undefined) subtask.duration = null;
        newTasks.unshift(subtask);
