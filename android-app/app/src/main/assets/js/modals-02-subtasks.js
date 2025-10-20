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
