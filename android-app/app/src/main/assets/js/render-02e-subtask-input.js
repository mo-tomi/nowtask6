
  // 所要時間表示
  if (task.duration) {
    const durationSpan = document.createElement('span');
    durationSpan.className = 'task-duration';
    const hours = Math.floor(task.duration / 60);
    const minutes = task.duration % 60;
    if (hours > 0) {
      durationSpan.textContent = minutes > 0 ? `⏰ ${hours}時間${minutes}分` : `⏰ ${hours}時間`;
    } else {
      durationSpan.textContent = `⏰ ${minutes}分`;
    }
    meta.appendChild(durationSpan);
  }

  // 時間ゲージバー（開始時刻と終了時刻がある場合）
  if (task.startTime && task.endTime && !task.isCompleted) {
    const [startHour, startMin] = task.startTime.split(':').map(Number);
    const [endHour, endMin] = task.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;

    // 日をまたぐ場合は24時までとして計算
    if (endMinutes < startMinutes) {
      endMinutes = 24 * 60;
    }

    const duration = endMinutes - startMinutes;
    const leftPercent = (startMinutes / (24 * 60)) * 100;
    const widthPercent = (duration / (24 * 60)) * 100;

    const gaugeWrapper = document.createElement('div');
    gaugeWrapper.className = 'task-time-gauge-wrapper';

    const gauge = document.createElement('div');
    gauge.className = 'task-time-gauge';

    const gaugeBg = document.createElement('div');
    gaugeBg.className = 'task-time-gauge-bg';

    const gaugeBar = document.createElement('div');
    gaugeBar.className = 'task-time-gauge-bar';
    gaugeBar.style.left = `${leftPercent}%`;
    gaugeBar.style.width = `${widthPercent}%`;

    gauge.appendChild(gaugeBg);
    gauge.appendChild(gaugeBar);
    gaugeWrapper.appendChild(gauge);
    content.appendChild(gaugeWrapper);
  }

  if (task.dueDate) {
    const dueDate = document.createElement('span');
    dueDate.className = 'task-due-date';
    if (isOverdue(task.dueDate) && !task.isCompleted) {
      dueDate.classList.add('overdue');
    }
    dueDate.textContent = '📅 ' + formatDate(task.dueDate);
    meta.appendChild(dueDate);
  }

  if (task.totalTime > 0 || task.isTimerRunning) {
    const timer = document.createElement('span');
    timer.className = 'task-timer';
    if (task.isTimerRunning) {
      timer.classList.add('running');
      timer.textContent = '⏱️ 計測中...';
    } else {
      timer.textContent = '⏱️ ' + formatTime(task.totalTime);
    }
    meta.appendChild(timer);
  }

  if (meta.children.length > 0) {
    content.appendChild(meta);
  }

  if (task.memo) {
    const memo = document.createElement('div');
    memo.className = 'task-memo';

    // メモを100文字に制限
    const memoText = task.memo.substring(0, 100) + (task.memo.length > 100 ? '...' : '');

    // 検索キーワードがある場合はハイライト表示
    if (currentSearchKeyword && typeof window.searchFilter !== 'undefined' && typeof window.searchFilter.highlightSearchResult === 'function') {
      memo.innerHTML = window.searchFilter.highlightSearchResult(memoText, currentSearchKeyword);
    } else {
      memo.textContent = memoText;
    }

    content.appendChild(memo);
  }

  div.appendChild(checkbox);
  div.appendChild(content);

  // タスクアクション部分
  const actions = document.createElement('div');
  actions.className = 'task-card-actions';

  // 時間記録停止ボタン（タイマー実行中のみ表示）
  if (task.isTimerRunning) {
    const stopBtn = document.createElement('button');
    stopBtn.className = 'timer-stop-btn';
    stopBtn.innerHTML = '⏹';
    stopBtn.title = '時間記録停止';
    stopBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      stopTaskTimer(task.id);
      renderTasks();
    });
    actions.appendChild(stopBtn);
  }

  // サブタスク追加ボタン（タスク内に表示）
  if (!task.isCompleted && canHaveSubtask(task.id)) {
    const addSubtaskIcon = document.createElement('button');
    addSubtaskIcon.className = 'add-subtask-icon';
    addSubtaskIcon.innerHTML = '+';
    addSubtaskIcon.title = 'サブタスクを追加';
    addSubtaskIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      addingSubtaskForTaskId = task.id;
      renderTasks();
    });
    actions.appendChild(addSubtaskIcon);
  }

  // メニューボタン
  const menuBtn = document.createElement('button');
  menuBtn.className = 'task-menu-btn';
  menuBtn.innerHTML = '⋮';
  menuBtn.title = 'メニュー';
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showTaskMenu(e, task);
  });
  actions.appendChild(menuBtn);

  div.appendChild(actions);

  // カード全体のクリックで編集（チェックボックスとボタン以外）
  div.addEventListener('click', (e) => {
    if (!e.target.closest('.task-checkbox') && !e.target.closest('.task-card-actions')) {
      openEditModal(task.id);
    }
  });

  // ドラッグ&ドロップ機能
  setupDragAndDrop(div, task);

  return div;
}

// インラインサブタスク入力作成
function createSubtaskInputInline(parentId, parentLevel = 0) {
