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
