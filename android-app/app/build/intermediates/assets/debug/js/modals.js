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
        saveTasks(newTasks);
      }
    });

    // サブタスクの時間をメインタスクに集計
    if (typeof aggregateSubtaskTimes === 'function') {
      aggregateSubtaskTimes(editingTaskId);
    }
  } else {
    // 新規作成
    const tasks = getTasks();
    const now = new Date().toISOString();
    const task = {
      id: generateUUID(),
      title: title,
      memo: memo,
      dueDate: dueDate,
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
      parentId: null,
      isTutorial: false,
      totalTime: 0,
      isTimerRunning: false,
      timerStartTime: null,
      duration: duration,
      startTime: startTime,
      endTime: endTime,
      urgent: urgent,
      priority: priority
    };
    tasks.unshift(task);
    saveTasks(tasks);

    // 履歴に追加
    if (typeof addToTaskHistory === 'function') {
      addToTaskHistory(task.title, null, null, 20);
      try {
        document.dispatchEvent(new CustomEvent('task:history:updated'));
      } catch (e) {
        console.warn('CustomEvent dispatch failed for task:history:updated', e);
      }
    }
  }

  closeModal();
  renderTasks();
}

// タスク削除
function deleteCurrentTask() {
  if (!editingTaskId) return;

  confirmAction('このタスクを削除しますか？', () => {
    deleteTask(editingTaskId);
    closeModal();
    renderTasks();
  });
}

// 確認ダイアログ
function confirmAction(message, callback) {
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-modal').classList.add('show');

  const okBtn = document.getElementById('confirm-ok-btn');
  const cancelBtn = document.getElementById('confirm-cancel-btn');

  const handleOk = () => {
    document.getElementById('confirm-modal').classList.remove('show');
    callback();
    cleanup();
  };

  const handleCancel = () => {
    document.getElementById('confirm-modal').classList.remove('show');
    cleanup();
  };

  const cleanup = () => {
    okBtn.removeEventListener('click', handleOk);
    cancelBtn.removeEventListener('click', handleCancel);
  };

  okBtn.addEventListener('click', handleOk);
  cancelBtn.addEventListener('click', handleCancel);
}

// ========================================
// 時間フィールドの自動計算
// ========================================

// 開始時刻と所要時間から終了時刻を自動計算
function setupTimeAutoCalculation() {
  const startTimeInput = document.getElementById('task-start-time');
  const durationInput = document.getElementById('task-duration');
  const endTimeInput = document.getElementById('task-end-time');

  // イベントリスナーを削除してから再設定（重複防止）
  const newStartTimeInput = startTimeInput.cloneNode(true);
  const newDurationInput = durationInput.cloneNode(true);
  startTimeInput.parentNode.replaceChild(newStartTimeInput, startTimeInput);
  durationInput.parentNode.replaceChild(newDurationInput, durationInput);

  const calculateEndTime = () => {
    const startTime = document.getElementById('task-start-time').value;
    const duration = document.getElementById('task-duration').value;
    const endTime = document.getElementById('task-end-time').value;

    // 開始時刻と所要時間が入力されていて、終了時刻が未入力の場合
    if (startTime && duration && !endTime) {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const durationMinutes = parseInt(duration);

      // 開始時刻（分単位）
      const startTotalMinutes = startHour * 60 + startMin;
      // 終了時刻（分単位）
      let endTotalMinutes = startTotalMinutes + durationMinutes;

      // 24時間を超える場合は24時間以内に収める（翌日への繰越）
      if (endTotalMinutes >= 24 * 60) {
        endTotalMinutes = endTotalMinutes % (24 * 60);
      }

      const endHour = Math.floor(endTotalMinutes / 60);
      const endMin = endTotalMinutes % 60;

      // 終了時刻を設定
      document.getElementById('task-end-time').value =
        `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
    }
  };

  // 開始時刻が変更されたとき
  document.getElementById('task-start-time').addEventListener('input', calculateEndTime);
  // 所要時間が変更されたとき
  document.getElementById('task-duration').addEventListener('change', calculateEndTime);
}

// ========================================
// 設定モーダル
// ========================================

// 設定モーダルを開く
function openSettingsModal() {
  console.log('openSettingsModal called');
  renderRoutinesList();

  // ゲージ時間表記パターンの初期化
  const gaugePatternSelect = document.getElementById('gauge-time-pattern');
  if (gaugePatternSelect && typeof getGaugeTimePattern === 'function') {
    const currentPattern = getGaugeTimePattern();
    gaugePatternSelect.value = currentPattern.toString();
  }

  const modal = document.getElementById('settings-modal');
  if (modal) {
    console.log('[BEFORE] Modal classList:', Array.from(modal.classList));
    console.log('[BEFORE] Modal display:', window.getComputedStyle(modal).display);
    console.log('[BEFORE] Modal z-index:', window.getComputedStyle(modal).zIndex);

    modal.classList.add('show');

    console.log('[AFTER] Modal classList:', Array.from(modal.classList));
    console.log('[AFTER] Modal display:', window.getComputedStyle(modal).display);
    console.log('[AFTER] Modal z-index:', window.getComputedStyle(modal).zIndex);
    console.log('[AFTER] Has show class?', modal.classList.contains('show'));
  } else {
    console.error('settings-modal not found');
  }
}

// ルーティンリストを描画
function renderRoutinesList() {
  try {
    console.log('renderRoutinesList called');
    const routines = getRoutines();
    console.log('Routines:', routines);
    const container = document.getElementById('routines-list');
    if (!container) {
      console.error('routines-list container not found');
      return;
    }
    console.log('Container found:', container);
    container.innerHTML = '';

  if (!Array.isArray(routines)) {
    console.error('Routines is not an array:', routines);
    return;
  }

  console.log('Rendering', routines.length, 'routines');
  routines.forEach((routine, index) => {
    const item = document.createElement('div');
    item.className = 'routine-item';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'routine-name-input';
    nameInput.value = routine.name || '';
    nameInput.placeholder = 'ルーティン名を入力';
    nameInput.maxLength = 50;
    nameInput.dataset.index = index;

    // 詳細設定ボタン
    const detailBtn = document.createElement('button');
    detailBtn.type = 'button';
    detailBtn.className = 'routine-detail-btn';
    detailBtn.textContent = '⏰';
    detailBtn.title = '時刻設定';
    detailBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const detailPanel = item.querySelector('.routine-detail-panel');
      if (detailPanel.style.display === 'none') {
        detailPanel.style.display = 'flex';
      } else {
        detailPanel.style.display = 'none';
      }
    });

    const durationInput = document.createElement('select');
    durationInput.className = 'routine-duration-input';
    durationInput.dataset.index = index;

    // 時間オプション
    const durationOptions = [
      { value: 5, text: '5分' },
      { value: 10, text: '10分' },
      { value: 15, text: '15分' },
      { value: 30, text: '30分' },
      { value: 45, text: '45分' },
      { value: 60, text: '1時間' },
      { value: 90, text: '1時間30分' },
      { value: 120, text: '2時間' },
      { value: 180, text: '3時間' },
      { value: 240, text: '4時間' },
      { value: 360, text: '6時間' },
      { value: 420, text: '7時間' },
      { value: 480, text: '8時間' },
      { value: 540, text: '9時間' }
    ];

    durationOptions.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.text;
      if (routine.duration === opt.value) {
        option.selected = true;
      }
      durationInput.appendChild(option);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'routine-delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.type = 'button';
    deleteBtn.addEventListener('click', () => {
      deleteRoutine(index);
    });

    // 詳細パネル（開始時刻・終了時刻）
    const detailPanel = document.createElement('div');
    detailPanel.className = 'routine-detail-panel';
    detailPanel.style.display = 'none';
    detailPanel.style.flexDirection = 'column';
    detailPanel.style.gap = '8px';
    detailPanel.style.padding = '8px';
    detailPanel.style.width = '100%';
    detailPanel.style.boxSizing = 'border-box';

    // 開始時刻
    const startTimeContainer = document.createElement('div');
    startTimeContainer.style.display = 'flex';
    startTimeContainer.style.alignItems = 'center';
    startTimeContainer.style.gap = '8px';

    const startTimeLabel = document.createElement('label');
    startTimeLabel.textContent = '開始:';
    startTimeLabel.style.minWidth = '60px';
    const startTimeInput = document.createElement('input');
    startTimeInput.type = 'time';
    startTimeInput.className = 'routine-time-input';
    startTimeInput.value = routine.startTime || '';
    startTimeInput.dataset.index = index;
    startTimeInput.dataset.field = 'startTime';
    startTimeInput.style.flex = '1';

    startTimeContainer.appendChild(startTimeLabel);
    startTimeContainer.appendChild(startTimeInput);

    // 終了時刻
    const endTimeContainer = document.createElement('div');
    endTimeContainer.style.display = 'flex';
    endTimeContainer.style.alignItems = 'center';
    endTimeContainer.style.gap = '8px';

    const endTimeLabel = document.createElement('label');
    endTimeLabel.textContent = '終了:';
    endTimeLabel.style.minWidth = '60px';
    const endTimeInput = document.createElement('input');
    endTimeInput.type = 'time';
    endTimeInput.className = 'routine-time-input';
    endTimeInput.value = routine.endTime || '';
    endTimeInput.dataset.index = index;
    endTimeInput.dataset.field = 'endTime';
    endTimeInput.style.flex = '1';

    endTimeContainer.appendChild(endTimeLabel);
    endTimeContainer.appendChild(endTimeInput);

    // 緊急フラグ
    const urgentContainer = document.createElement('div');
    urgentContainer.style.display = 'flex';
    urgentContainer.style.alignItems = 'center';
    urgentContainer.style.gap = '8px';

    const urgentLabel = document.createElement('label');
    urgentLabel.textContent = '緊急:';
    urgentLabel.style.minWidth = '60px';
    const urgentCheckbox = document.createElement('input');
    urgentCheckbox.type = 'checkbox';
    urgentCheckbox.className = 'routine-urgent-input';
    urgentCheckbox.checked = routine.urgent || false;
    urgentCheckbox.dataset.index = index;
    urgentCheckbox.dataset.field = 'urgent';

    urgentContainer.appendChild(urgentLabel);
    urgentContainer.appendChild(urgentCheckbox);

    // 優先順位
    const priorityContainer = document.createElement('div');
    priorityContainer.style.display = 'flex';
    priorityContainer.style.alignItems = 'center';
    priorityContainer.style.gap = '8px';

    const priorityLabel = document.createElement('label');
    priorityLabel.textContent = '優先順位:';
    priorityLabel.style.minWidth = '60px';
    const prioritySelect = document.createElement('select');
    prioritySelect.className = 'routine-priority-input';
    prioritySelect.dataset.index = index;
    prioritySelect.dataset.field = 'priority';
    prioritySelect.style.flex = '1';

    const priorityOptions = [
      { value: '', text: '未設定' },
      { value: 'high', text: '高' },
      { value: 'medium', text: '中' },
      { value: 'low', text: '低' }
    ];

    priorityOptions.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.text;
      if (routine.priority === opt.value) {
        option.selected = true;
      }
      prioritySelect.appendChild(option);
    });

    priorityContainer.appendChild(priorityLabel);
    priorityContainer.appendChild(prioritySelect);

    // 期間設定
    const dateRangeLabel = document.createElement('label');
    dateRangeLabel.textContent = '期間:';
    dateRangeLabel.style.width = '100%';
    dateRangeLabel.style.marginTop = '4px';
    dateRangeLabel.style.fontWeight = 'bold';

    const dateRangeContainer = document.createElement('div');
    dateRangeContainer.style.display = 'flex';
    dateRangeContainer.style.flexDirection = 'column';
    dateRangeContainer.style.gap = '4px';
    dateRangeContainer.style.width = '100%';

    // ラジオボタン: 期日なし
    const radioNoneContainer = document.createElement('div');
    const radioNone = document.createElement('input');
    radioNone.type = 'radio';
    radioNone.name = `routine-daterange-${index}`;
    radioNone.value = 'none';
    radioNone.className = 'routine-daterange-radio';
    radioNone.dataset.index = index;
    const dateRange = routine.dateRange || { type: 'none' };
    radioNone.checked = dateRange.type === 'none';

    const radioNoneLabel = document.createElement('label');
    radioNoneLabel.textContent = '期日なし（毎日）';
    radioNoneLabel.style.marginLeft = '4px';
    radioNoneContainer.appendChild(radioNone);
    radioNoneContainer.appendChild(radioNoneLabel);

    // ラジオボタン: 期間設定
    const radioPeriodContainer = document.createElement('div');
    const radioPeriod = document.createElement('input');
    radioPeriod.type = 'radio';
    radioPeriod.name = `routine-daterange-${index}`;
    radioPeriod.value = 'period';
    radioPeriod.className = 'routine-daterange-radio';
    radioPeriod.dataset.index = index;
    radioPeriod.checked = dateRange.type === 'period';

    const radioPeriodLabel = document.createElement('label');
    radioPeriodLabel.textContent = '期間設定';
    radioPeriodLabel.style.marginLeft = '4px';
    radioPeriodContainer.appendChild(radioPeriod);
    radioPeriodContainer.appendChild(radioPeriodLabel);

    // 期間設定の日付入力フィールド
    const periodInputsContainer = document.createElement('div');
    periodInputsContainer.style.display = dateRange.type === 'period' ? 'flex' : 'none';
    periodInputsContainer.style.flexDirection = 'column';
    periodInputsContainer.style.gap = '4px';
    periodInputsContainer.style.marginLeft = '20px';
    periodInputsContainer.className = 'routine-period-inputs';
    periodInputsContainer.dataset.index = index;

    const startDateContainer = document.createElement('div');
    startDateContainer.style.display = 'flex';
    startDateContainer.style.alignItems = 'center';
    startDateContainer.style.gap = '8px';

    const startDateLabel = document.createElement('label');
    startDateLabel.textContent = '開始日:';
    startDateLabel.style.minWidth = '60px';
    const startDateInput = document.createElement('input');
    startDateInput.type = 'date';
    startDateInput.className = 'routine-daterange-start';
    startDateInput.value = dateRange.startDate || '';
    startDateInput.dataset.index = index;
    startDateInput.style.flex = '1';

    startDateContainer.appendChild(startDateLabel);
    startDateContainer.appendChild(startDateInput);

    const endDateContainer = document.createElement('div');
    endDateContainer.style.display = 'flex';
    endDateContainer.style.alignItems = 'center';
    endDateContainer.style.gap = '8px';

    const endDateLabel = document.createElement('label');
    endDateLabel.textContent = '終了日:';
    endDateLabel.style.minWidth = '60px';
    const endDateInput = document.createElement('input');
    endDateInput.type = 'date';
    endDateInput.className = 'routine-daterange-end';
    endDateInput.value = dateRange.endDate || '';
    endDateInput.dataset.index = index;
    endDateInput.style.flex = '1';

    endDateContainer.appendChild(endDateLabel);
    endDateContainer.appendChild(endDateInput);

    periodInputsContainer.appendChild(startDateContainer);
    periodInputsContainer.appendChild(endDateContainer);

    // ラジオボタン変更時の処理
    radioNone.addEventListener('change', () => {
      if (radioNone.checked) {
        periodInputsContainer.style.display = 'none';
      }
    });
    radioPeriod.addEventListener('change', () => {
      if (radioPeriod.checked) {
        periodInputsContainer.style.display = 'flex';
      }
    });

    dateRangeContainer.appendChild(radioNoneContainer);
    dateRangeContainer.appendChild(radioPeriodContainer);
    dateRangeContainer.appendChild(periodInputsContainer);

    detailPanel.appendChild(startTimeContainer);
    detailPanel.appendChild(endTimeContainer);
    detailPanel.appendChild(urgentContainer);
    detailPanel.appendChild(priorityContainer);
    detailPanel.appendChild(dateRangeLabel);
    detailPanel.appendChild(dateRangeContainer);

    // アイテムに追加
    item.appendChild(nameInput);
    item.appendChild(durationInput);
    item.appendChild(detailBtn);
    item.appendChild(deleteBtn);
    item.appendChild(detailPanel);
    container.appendChild(item);
  });
  } catch (e) {
    console.error('Error in renderRoutinesList:', e);
    alert('ルーティンリストの表示エラー: ' + e.message);
  }
}

// ルーティンを削除
function deleteRoutine(index) {
  const routines = getRoutines();
  routines.splice(index, 1);
  saveRoutines(routines);
  renderRoutinesList();
}

// ルーティンを追加
function addRoutine() {
  // 現在の入力内容を保存してから新しいルーティンを追加
  const nameInputs = document.querySelectorAll('.routine-name-input');
  const durationInputs = document.querySelectorAll('.routine-duration-input');
  const timeInputs = document.querySelectorAll('.routine-time-input');
  const routines = [];

  nameInputs.forEach((nameInput, index) => {
    const name = nameInput.value.trim();
    const existingRoutines = getRoutines();

    // 開始時刻と終了時刻を取得
    let startTime = '';
    let endTime = '';
    timeInputs.forEach(input => {
      const inputIndex = parseInt(input.dataset.index);
      if (inputIndex === index) {
        if (input.dataset.field === 'startTime') {
          startTime = input.value || '';
        } else if (input.dataset.field === 'endTime') {
          endTime = input.value || '';
        }
      }
    });

    // 緊急フラグと優先順位を取得
    const urgentCheckbox = document.querySelector(`.routine-urgent-input[data-index="${index}"]`);
    const prioritySelect = document.querySelector(`.routine-priority-input[data-index="${index}"]`);
    const urgent = urgentCheckbox ? urgentCheckbox.checked : false;
    const priority = prioritySelect ? prioritySelect.value : '';

    // 期間設定を取得
    const dateRangeRadios = document.querySelectorAll(`.routine-daterange-radio[data-index="${index}"]`);
    let dateRangeType = 'none';
    dateRangeRadios.forEach(radio => {
      if (radio.checked) {
        dateRangeType = radio.value;
      }
    });

    const startDateInput = document.querySelector(`.routine-daterange-start[data-index="${index}"]`);
    const endDateInput = document.querySelector(`.routine-daterange-end[data-index="${index}"]`);
    const dateRange = {
      type: dateRangeType,
      startDate: dateRangeType === 'period' && startDateInput ? startDateInput.value : null,
      endDate: dateRangeType === 'period' && endDateInput ? endDateInput.value : null
    };

    const routine = {
      id: existingRoutines[index]?.id || generateUUID(),
      name: name,
      duration: parseInt(durationInputs[index].value),
      startTime: startTime,
      endTime: endTime,
      urgent: urgent,
      priority: priority,
      dateRange: dateRange
    };
    routines.push(routine);
  });

  // 新しい空のルーティンを追加
  const newRoutine = {
    id: generateUUID(),
    name: '',
    duration: 30,
    startTime: '',
    endTime: '',
    urgent: false,
    priority: '',
    dateRange: { type: 'none', startDate: null, endDate: null }
  };
  routines.push(newRoutine);

  saveRoutines(routines);
  renderRoutinesList();

  // 新規ルーティンの名前入力にフォーカス
  setTimeout(() => {
    const inputs = document.querySelectorAll('.routine-name-input');
    if (inputs.length > 0) {
      inputs[inputs.length - 1].focus();
    }
  }, 0);
}

// 設定モーダルを閉じる
function closeSettingsModal() {
  const modal = document.getElementById('settings-modal');

  // 閉じるアニメーションを開始
  modal.classList.add('hiding');

  // アニメーション終了後に実際に閉じる
  setTimeout(() => {
    modal.classList.remove('show', 'hiding');
  }, 200); // 200ms（アニメーション時間）
}

// 設定を保存
function saveSettings() {
  const routines = [];
  const nameInputs = document.querySelectorAll('.routine-name-input');
  const durationInputs = document.querySelectorAll('.routine-duration-input');
  const timeInputs = document.querySelectorAll('.routine-time-input');

  nameInputs.forEach((nameInput, index) => {
    const name = nameInput.value.trim();
    if (name) {
      // 開始時刻と終了時刻を取得
      let startTime = '';
      let endTime = '';
      timeInputs.forEach(input => {
        const inputIndex = parseInt(input.dataset.index);
        if (inputIndex === index) {
          if (input.dataset.field === 'startTime') {
            startTime = input.value || '';
          } else if (input.dataset.field === 'endTime') {
            endTime = input.value || '';
          }
        }
      });

      // 緊急フラグと優先順位を取得
      const urgentCheckbox = document.querySelector(`.routine-urgent-input[data-index="${index}"]`);
      const prioritySelect = document.querySelector(`.routine-priority-input[data-index="${index}"]`);
      const urgent = urgentCheckbox ? urgentCheckbox.checked : false;
      const priority = prioritySelect ? prioritySelect.value : '';

      // 期間設定を取得
      const dateRangeRadios = document.querySelectorAll(`.routine-daterange-radio[data-index="${index}"]`);
      let dateRangeType = 'none';
      dateRangeRadios.forEach(radio => {
        if (radio.checked) {
          dateRangeType = radio.value;
        }
      });

      const startDateInput = document.querySelector(`.routine-daterange-start[data-index="${index}"]`);
      const endDateInput = document.querySelector(`.routine-daterange-end[data-index="${index}"]`);
      const dateRange = {
        type: dateRangeType,
        startDate: dateRangeType === 'period' && startDateInput ? startDateInput.value : null,
        endDate: dateRangeType === 'period' && endDateInput ? endDateInput.value : null
      };

      const routine = {
        id: getRoutines()[index]?.id || generateUUID(),
        name: name,
        duration: parseInt(durationInputs[index].value),
        startTime: startTime,
        endTime: endTime,
        urgent: urgent,
        priority: priority,
        dateRange: dateRange
      };
      routines.push(routine);
    }
  });

  saveRoutines(routines);

  // ゲージ時間表記パターンを保存
  const gaugePatternSelect = document.getElementById('gauge-time-pattern');
  if (gaugePatternSelect && typeof setGaugeTimePattern === 'function') {
    const selectedPattern = parseInt(gaugePatternSelect.value);
    setGaugeTimePattern(selectedPattern);
  }

  // 既存タスクへの反映と新規タスク作成
  routines.forEach(routine => {
    // 既存タスクを更新
    if (typeof updateRoutineTasks === 'function') {
      updateRoutineTasks(routine);
    }
  });

  // 新規ルーティンタスクを作成
  createRoutineTasks();

  closeSettingsModal();
  renderTasks();
}

// ========================================
// ログインモーダル
// ========================================

// ログインモーダルを開く
function openLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) {
    // 現在のユーザー情報を更新
    updateCurrentUserInfo();
    modal.classList.add('show');
  }
}

// ログインモーダルを閉じる
function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) {
    // 閉じるアニメーションを開始
    modal.classList.add('hiding');

    // アニメーション終了後に実際に閉じる
    setTimeout(() => {
      modal.classList.remove('show', 'hiding');
    }, 200); // 200ms（アニメーション時間）
  }
}

// 現在のユーザー情報を更新
function updateCurrentUserInfo() {
  const userInfoElement = document.getElementById('current-user-info');
  if (!userInfoElement) return;

  if (typeof FirestoreBridge !== 'undefined') {
    const userId = FirestoreBridge.getUserId();
    if (userId && userId !== 'anonymous') {
      userInfoElement.textContent = 'ユーザーID: ' + userId.substring(0, 8) + '...';
    } else {
      userInfoElement.textContent = '匿名ユーザー';
    }
  } else {
    userInfoElement.textContent = '匿名ユーザー（Web版）';
  }
}
