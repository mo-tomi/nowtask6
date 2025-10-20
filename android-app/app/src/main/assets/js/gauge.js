// ========================================
// 24時間ゲージ（確定仕様 v2.0.0）
// ========================================

// 現在表示中の日付（ISO形式: YYYY-MM-DD）
let currentGaugeDate = null;

// 時間表記パターン設定
const GAUGE_TIME_PATTERNS = {
  0: Array(24).fill('').map((_, i) => `${i}`), // パターン0: 数字のみ（0-23）
  1: Array(24).fill('').map((_, i) => `${i}:00`), // パターン1: 時刻表記（0:00-23:00）
  3: Array(24).fill('').map((_, i) => i % 3 === 0 ? `${i}:00` : ''), // パターン3: 3時間区切り
  4: Array(24).fill('').map((_, i) => i % 6 === 0 ? `${i}:00` : '') // パターン4: 6時間区切り（デフォルト）
};

// 時間表記パターンを取得
function getGaugeTimePattern() {
  const pattern = localStorage.getItem('gauge-time-pattern');
  return pattern ? parseInt(pattern) : 4; // デフォルトは4（6時間区切り）
}

// 時間表記パターンを設定
function setGaugeTimePattern(pattern) {
  localStorage.setItem('gauge-time-pattern', pattern.toString());
  // ゲージを再レンダリング
  if (typeof renderNewGauge === 'function' && typeof isNewUIEnabled === 'function' && isNewUIEnabled()) {
    renderNewGauge(currentGaugeDate);
  }
}

// ゲージの日付を初期化
function initGaugeDate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  currentGaugeDate = formatDateISO(today);
}

// ゲージの日付を変更
function changeGaugeDate(offset) {
  if (!currentGaugeDate) initGaugeDate();

  const date = new Date(currentGaugeDate);
  date.setDate(date.getDate() + offset);
  currentGaugeDate = formatDateISO(date);

  updateGaugeDateLabel();
  updateTimeGauge(currentGaugeDate);
}

// 日付ラベルを更新
function updateGaugeDateLabel() {
  const labelEl = document.getElementById('gauge-date-label');
  const newLabelEl = document.getElementById('new-gauge-date-label');

  if (!currentGaugeDate) return;
  if (!labelEl && !newLabelEl) return;

  const date = new Date(currentGaugeDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[date.getDay()];

  let labelText = '';
  if (formatDateISO(date) === formatDateISO(today)) {
    labelText = `今日`;
  } else if (formatDateISO(date) === formatDateISO(tomorrow)) {
    labelText = `明日`;
  } else if (formatDateISO(date) === formatDateISO(yesterday)) {
    labelText = `昨日`;
  } else {
    labelText = `${month}/${day}(${weekday})`;
  }

  // 旧UIと新UI両方を更新
  if (labelEl) labelEl.textContent = labelText;
  if (newLabelEl) newLabelEl.textContent = labelText;
}

// スワイプ検知を初期化
function initGaugeSwipe() {
  // 旧UIと新UIの両方のコンテナを取得
  const oldContainer = document.getElementById('old-time-gauge-container');
  const newContainer = document.getElementById('new-time-gauge-container');

  // スワイプハンドラーを設定する関数
  const setupSwipeHandlers = (container) => {
    if (!container) return;

    let startX = 0;
    let startY = 0;
    let isDragging = false;

    container.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isDragging = true;
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      isDragging = false;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = endY - startY;

      // 横方向のスワイプ判定（50px以上、かつ縦方向より横方向が大きい）
      if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) {
          // 右スワイプ: 前日
          changeGaugeDate(-1);
        } else {
          // 左スワイプ: 翌日
          changeGaugeDate(1);
        }
      }
    }, { passive: true });
  };

  // 旧UIと新UIの両方にスワイプハンドラーを設定
  setupSwipeHandlers(oldContainer);
  setupSwipeHandlers(newContainer);

  // ナビゲーションボタン（旧UI）
  const prevBtn = document.getElementById('gauge-prev-btn');
  const nextBtn = document.getElementById('gauge-next-btn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => changeGaugeDate(-1));
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => changeGaugeDate(1));
  }

  // ナビゲーションボタン（新UI）
  const newPrevBtn = document.getElementById('new-gauge-prev-btn');
  const newNextBtn = document.getElementById('new-gauge-next-btn');

  if (newPrevBtn) {
    newPrevBtn.addEventListener('click', () => changeGaugeDate(-1));
  }
  if (newNextBtn) {
    newNextBtn.addEventListener('click', () => changeGaugeDate(1));
  }
}

// 時間帯のタスク一覧を表示
function showTimeSlotTasks(startMinutes, endMinutes) {
  const startHour = Math.floor(startMinutes / 60);
  const startMin = startMinutes % 60;
  const endHour = Math.floor(endMinutes / 60);
  const endMin = endMinutes % 60;

  const timeRange = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')} ~ ${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

  // 該当時間帯のタスクを取得
  const tasks = getTasks();
  const matchingTasks = tasks.filter(task => {
    if (task.isCompleted || !task.startTime || !task.endTime) return false;

    const [taskStartHour, taskStartMin] = task.startTime.split(':').map(Number);
    const [taskEndHour, taskEndMin] = task.endTime.split(':').map(Number);
    const taskStartMinutes = taskStartHour * 60 + taskStartMin;
    const taskEndMinutes = taskEndHour * 60 + taskEndMin;

    // 時間帯が重なっているかチェック
    return (taskStartMinutes < endMinutes && taskEndMinutes > startMinutes);
  });

  if (matchingTasks.length === 0) {
    alert(`${timeRange}\nこの時間帯にタスクはありません`);
    return;
  }

  // モーダルを表示
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.style.display = 'flex';

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content time-slot-modal';

  const header = document.createElement('div');
  header.className = 'modal-header';
  header.innerHTML = `
    <h2>${timeRange} のタスク</h2>
    <button class="close-btn">&times;</button>
  `;

  const body = document.createElement('div');
  body.className = 'modal-body';

  matchingTasks.forEach(task => {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'time-slot-task-item';
    taskDiv.innerHTML = `
      <div class="task-title">${task.title}</div>
      <div class="task-time">🕒 ${task.startTime} ~ ${task.endTime}</div>
      ${task.memo ? `<div class="task-memo">${task.memo}</div>` : ''}
    `;
    taskDiv.addEventListener('click', () => {
      modal.remove();
      openEditModal(task.id);
    });
    body.appendChild(taskDiv);
  });

  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  footer.innerHTML = `<button class="btn btn-secondary">閉じる</button>`;

  modalContent.appendChild(header);
  modalContent.appendChild(body);
  modalContent.appendChild(footer);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // 閉じるイベント
  const closeBtn = header.querySelector('.close-btn');
  const closeFooterBtn = footer.querySelector('.btn');

  closeBtn.addEventListener('click', () => modal.remove());
  closeFooterBtn.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

// 24時間ゲージ更新
// dateArg: Date オブジェクトか ISO 日付文字列（YYYY-MM-DD）を受け取る。未指定なら現在日時を使用。
function updateTimeGauge(dateArg) {
  let now = new Date();
  let targetDate = new Date(now);
  if (dateArg) {
    if (typeof dateArg === 'string') {
      // ISO 日付文字列（YYYY-MM-DD）ならその日の0時を使う
      const parts = dateArg.split('-');
      if (parts.length === 3) {
        targetDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    } else if (dateArg instanceof Date) {
      targetDate = new Date(dateArg);
      targetDate.setHours(0,0,0,0);
    }
    // ゲージの基準時刻は targetDate の午前0時からの相対として表示するため、now は targetDate の現在時刻相当を使用する
    // もし targetDate が今日でない場合は、現在時刻を targetDate の午前0時に置き換え（表示上は0%）
    const today = new Date();
    today.setHours(0,0,0,0);
    if (formatDateISO(targetDate) !== formatDateISO(today)) {
      // 表示時刻を targetDate の 0:00 に設定（経過は0）
      now = new Date(targetDate);
      now.setHours(0,0,0,0);
    }
  }
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const timeText = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  // 現在時刻表示（旧UI）
  const currentTimeEl = document.getElementById('current-time');
  if (currentTimeEl) {
    currentTimeEl.textContent = timeText;
  }

  // 現在時刻表示（新UI）
  const newCurrentTimeEl = document.getElementById('new-current-time-display');
  if (newCurrentTimeEl) {
    newCurrentTimeEl.textContent = timeText;
  }

  // 経過時間のパーセンテージ（0:00からの経過）
  const minutesFromMidnight = hours * 60 + minutes;
  const percentElapsed = (minutesFromMidnight / (24 * 60)) * 100;

  // 経過ゲージ更新（旧UIのみ）
  const elapsedBar = document.getElementById('time-gauge-elapsed');
  if (elapsedBar) {
    elapsedBar.style.width = `${percentElapsed}%`;
  }

  // 現在時刻マーカー位置更新（旧UIのみ）
  const marker = document.getElementById('time-marker');
  if (marker) {
    marker.style.left = `${percentElapsed}%`;
  }

  // 指定日の日付で予定を集計するよう updateScheduledTasks を呼び出す
  updateScheduledTasks(dateArg);
}

// 今日の予定タスク時間を表示
// dateArg: Date オブジェクトか ISO 日付文字列（YYYY-MM-DD）。未指定なら今日を対象。
function updateScheduledTasks(dateArg) {
  // baseDate を対象日の 0:00 に設定
  let baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);
  if (dateArg) {
    if (typeof dateArg === 'string') {
      const parts = dateArg.split('-');
      if (parts.length === 3) baseDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else if (dateArg instanceof Date) {
      baseDate = new Date(dateArg);
      baseDate.setHours(0,0,0,0);
    }
  }

  // 対象日のルーティンタスクを自動生成
  if (typeof createDailyRoutineTasks === 'function') {
    createDailyRoutineTasks(baseDate);
  }

  const tasks = getTasks();

  const tomorrow = new Date(baseDate);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const yesterday = new Date(baseDate);
  yesterday.setDate(yesterday.getDate() - 1);

  // 変更点の説明（日本語コメント）:
  // - 期限なしタスクはゲージに含めない（今日が期限のタスクのみ対象）
  // - 完了済みタスクはゲージに含めない
  // - デイリールーティンタスクも含める（期限が今日の日付に設定されている）
  // そのため、ここでは "dueDate が存在し、かつ baseDate の範囲内" のタスクのみを抽出する
  const todayTasks = tasks.filter(task => {
    // 完了済みは除外
    if (task.isCompleted) return false;

    // 期限がある場合のみ、今日の範囲内かチェック
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      return dueDate >= baseDate && dueDate < tomorrow;
    }

    // 期限なしのタスクは除外
    return false;
  });

  // 前日が期限で、日をまたぐタスクを抽出（翌日分として当日に加算）
  const yesterdayTasks = tasks.filter(task => {
    if (task.isCompleted) return false;
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      return dueDate >= yesterday && dueDate < baseDate;
    }
    return false;
  });

  // 現在時刻（分単位）- 表示中の日付が今日の場合のみ現在時刻を使用
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = formatDateISO(baseDate) === formatDateISO(today);

  // 今日の場合は現在時刻、それ以外の日は0:00を基準にする
  const currentMinutes = isToday ? (now.getHours() * 60 + now.getMinutes()) : 0;

  // 【重要】これから先のタスク時間を計算（重複を考慮）
  // タイムスロットを収集
  const timeSlots = [];

  todayTasks.forEach(task => {
    if (task.startTime && task.endTime) {
      const [startHour, startMin] = task.startTime.split(':').map(Number);
      const [endHour, endMin] = task.endTime.split(':').map(Number);
      let startMinutes = startHour * 60 + startMin;
      let endMinutes = endHour * 60 + endMin;

      // 日をまたぐ場合の処理
      if (endMinutes < startMinutes) {
        // タスクが日をまたぐ場合、当日分（開始時刻から24:00まで）のみ
        startMinutes = Math.max(startMinutes, currentMinutes);
        endMinutes = 24 * 60;
      } else {
        // 日をまたがない通常のタスク
        // 現在時刻より前に終了するタスクはスキップ
        if (endMinutes <= currentMinutes) return;

        // 現在進行中のタスクは現在時刻から開始
        if (startMinutes < currentMinutes) {
          startMinutes = currentMinutes;
        }
      }

      timeSlots.push({ start: startMinutes, end: endMinutes });

    } else if (task.duration) {
      // duration のみの場合は現在時刻から duration 分後まで（仮配置）
      timeSlots.push({
        start: currentMinutes,
        end: Math.min(currentMinutes + task.duration, 24 * 60)
      });
    }
  });

  // 前日から継続するタスク（今日の0:00以降の部分のみ）
  yesterdayTasks.forEach(task => {
    if (task.startTime && task.endTime) {
      const [startHour, startMin] = task.startTime.split(':').map(Number);
      const [endHour, endMin] = task.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes < startMinutes) {
        // 日をまたぐタスクの今日分
        if (endMinutes > currentMinutes) {
          timeSlots.push({
            start: Math.max(0, currentMinutes),
            end: endMinutes
          });
        }
      }
    }
  });

  // タイムスロットを統合（重複を排除）
  if (timeSlots.length === 0) {
    var totalDurationMinutes = 0;
  } else {
    // 開始時刻でソート
    timeSlots.sort((a, b) => a.start - b.start);

    const mergedSlots = [timeSlots[0]];
    for (let i = 1; i < timeSlots.length; i++) {
      const current = timeSlots[i];
      const last = mergedSlots[mergedSlots.length - 1];

      if (current.start <= last.end) {
        // 重複している: 統合
        last.end = Math.max(last.end, current.end);
      } else {
        // 重複していない: 新しいスロットとして追加
        mergedSlots.push(current);
      }
    }

    // 統合されたスロットの合計時間を計算
    var totalDurationMinutes = mergedSlots.reduce((sum, slot) => {
      return sum + (slot.end - slot.start);
    }, 0);
  }

  // 予定ゲージ更新（時間帯ごとに個別のブロックを作成）
  const scheduledBar = document.getElementById('time-gauge-scheduled');
  scheduledBar.innerHTML = ''; // 既存のブロックをクリア
  scheduledBar.style.display = 'block';
  scheduledBar.style.left = '0';
  scheduledBar.style.width = '100%';

  // 各タスクを時間帯ごとにブロックとして表示
  const taskBlocks = [];

  todayTasks.forEach(task => {
    if (task.startTime && task.endTime) {
      const [startHour, startMin] = task.startTime.split(':').map(Number);
      const [endHour, endMin] = task.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes < startMinutes) {
        // 日をまたぐ場合: 当日分のみ表示
        taskBlocks.push({
          startMinutes: startMinutes,
          endMinutes: 24 * 60,
          task: task
        });
      } else {
        taskBlocks.push({
          startMinutes: startMinutes,
          endMinutes: endMinutes,
          task: task
        });
      }
    }
  });

  // 前日から継続するタスク
  yesterdayTasks.forEach(task => {
    if (task.startTime && task.endTime) {
      const [startHour, startMin] = task.startTime.split(':').map(Number);
      const [endHour, endMin] = task.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes < startMinutes) {
        taskBlocks.push({
          startMinutes: 0,
          endMinutes: endMinutes,
          task: task
        });
      }
    }
  });

  // ブロックを開始時刻順にソート
  taskBlocks.sort((a, b) => a.startMinutes - b.startMinutes);

  // 各ブロックを表示
  taskBlocks.forEach(block => {
    const blockEl = document.createElement('div');
    blockEl.className = 'task-time-block';
    const leftPercent = (block.startMinutes / (24 * 60)) * 100;
    const widthPercent = ((block.endMinutes - block.startMinutes) / (24 * 60)) * 100;
    blockEl.style.left = `${leftPercent}%`;
    blockEl.style.width = `${widthPercent}%`;
    blockEl.dataset.taskId = block.task.id;
    blockEl.dataset.startTime = block.task.startTime;
    blockEl.dataset.endTime = block.task.endTime;

    // 時刻ラベルを追加
    const startHour = Math.floor(block.startMinutes / 60);
    const startMin = block.startMinutes % 60;
    const endHour = Math.floor(block.endMinutes / 60);
    const endMin = block.endMinutes % 60;
    const timeLabel = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}-${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
    blockEl.dataset.timeLabel = timeLabel;

    // クリックイベント
    blockEl.addEventListener('click', (e) => {
      e.stopPropagation();
      showTimeSlotTasks(block.startMinutes, block.endMinutes);
    });

    scheduledBar.appendChild(blockEl);
  });

  // 【修正】空き時間と密度の計算
  const totalMinutesInDay = 24 * 60;
  // 今日の場合は残り時間、それ以外の日は24時間全体を基準にする
  const remainingTimeInDay = isToday ? (totalMinutesInDay - currentMinutes) : totalMinutesInDay;
  const freeTimeMinutes = remainingTimeInDay - totalDurationMinutes; // 空き時間

  // 自由時間ゲージ更新
  const freeBar = document.getElementById('time-gauge-free');
  if (freeTimeMinutes > 0) {
    const freeStartPercent = (currentMinutes / (24 * 60)) * 100 + (totalDurationMinutes / (24 * 60)) * 100;
    const freeWidthPercent = (freeTimeMinutes / (24 * 60)) * 100;
    freeBar.style.display = 'block';
    freeBar.style.left = `${freeStartPercent}%`;
    freeBar.style.width = `${Math.min(freeWidthPercent, 100 - freeStartPercent)}%`;
  } else {
    freeBar.style.display = 'none';
  }

  // タスク密度を計算して表示
  const remainingElement = document.getElementById('remaining-tasks');
  const newRemainingElement = document.getElementById('new-remaining-tasks');

  // 【修正】分かりやすい表示（絵文字なし・モノクロ）
  let displayText = '';
  if (freeTimeMinutes < 0) {
    // タスクが多すぎる場合
    const overMinutes = Math.abs(freeTimeMinutes);
    const overHours = Math.floor(overMinutes / 60);
    const overMins = overMinutes % 60;
    if (overHours > 0) {
      displayText = `時間オーバー: ${overHours}時間${overMins > 0 ? overMins + '分' : ''}`;
    } else {
      displayText = `時間オーバー: ${overMins}分`;
    }

    // 時間オーバー警告を表示（今日の日付の場合のみ）
    if (isToday && typeof openTimeOverloadModal === 'function') {
      // 警告モーダルを表示（1回だけ）
      if (!window.overloadModalShown) {
        window.overloadModalShown = true;
        setTimeout(() => {
          openTimeOverloadModal(freeTimeMinutes, todayTasks);
        }, 500);
      }
    }
  } else {
    // 空き時間を表示
    const hours = Math.floor(freeTimeMinutes / 60);
    const minutes = freeTimeMinutes % 60;

    if (hours > 0) {
      displayText = `空き: ${hours}時間${minutes > 0 ? minutes + '分' : ''}`;
    } else if (minutes > 0) {
      displayText = `空き: ${minutes}分`;
    } else {
      displayText = `空きなし`;
    }
  }

  // 旧UIと新UI両方を更新
  if (remainingElement) remainingElement.textContent = displayText;
  if (newRemainingElement) newRemainingElement.textContent = displayText;

  // 空き時間を記録（今日の日付の場合のみ）
  if (isToday && typeof recordDailyFreeTime === 'function') {
    recordDailyFreeTime(freeTimeMinutes);
  }

  // 新ゲージをレンダリング（新UI有効時）
  if (typeof isNewUIEnabled === 'function' && isNewUIEnabled()) {
    if (typeof renderNewGauge === 'function') {
      renderNewGauge(dateArg);
    }
  }
}

// ========================================
// 新しい24ステップゲージレンダリング
// ========================================

/**
 * 新UI用：24ステップゲージをレンダリング
 * @param {string|Date} dateArg - 対象日付（未指定なら今日）
 */
function renderNewGauge(dateArg) {
  const gaugeContainer = document.querySelector('.new-gauge-bar');
  if (!gaugeContainer) return;

  // 対象日の日付を設定
  let baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);
  if (dateArg) {
    if (typeof dateArg === 'string') {
      const parts = dateArg.split('-');
      if (parts.length === 3) {
        baseDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    } else if (dateArg instanceof Date) {
      baseDate = new Date(dateArg);
      baseDate.setHours(0, 0, 0, 0);
    }
  }

  // 24個のステップを生成
  const stepsHTML = Array.from({ length: 24 }, (_, hour) => {
    const tasks = getTasks();

    // その時間帯にタスクがあるかチェック
    const isActive = tasks.some(task => {
      if (task.isCompleted || !task.startTime || !task.endTime) return false;

      // 対象日付のタスクのみ対象
      if (task.dueDate) {
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);
        if (formatDateISO(taskDate) !== formatDateISO(baseDate)) return false;
      } else {
        return false;
      }

      const [startHour, startMin] = task.startTime.split(':').map(Number);
      const [endHour, endMin] = task.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      // 日をまたぐ場合の処理
      if (endMinutes < startMinutes) {
        // 日をまたぐタスク
        return hour >= startHour || hour < endHour;
      } else {
        // 通常のタスク
        return hour >= startHour && hour < endHour;
      }
    });

    // 現在時刻をハイライト
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isCurrent = formatDateISO(baseDate) === formatDateISO(today) && hour === now.getHours();

    const classes = ['new-gauge-step'];
    if (isActive) classes.push('active');
    if (isCurrent) classes.push('current-marker');

    return `<div class="${classes.join(' ')}" data-hour="${hour}"></div>`;
  }).join('');

  gaugeContainer.innerHTML = stepsHTML;

  // 時間ラベルを更新
  renderGaugeTimeLabels();

  // 現在時刻を更新
  updateNewGaugeTime(baseDate);
}

/**
 * 新UI用：時間ラベルをレンダリング
 */
function renderGaugeTimeLabels() {
  const labelsContainer = document.querySelector('.new-time-labels');
  if (!labelsContainer) return;

  const pattern = getGaugeTimePattern();
  const labels = GAUGE_TIME_PATTERNS[pattern] || GAUGE_TIME_PATTERNS[4];

  const labelsHTML = labels.map(label =>
    `<span class="new-time-label">${label}</span>`
  ).join('');

  labelsContainer.innerHTML = labelsHTML;
}

/**
 * 新UI用：ゲージの時刻表示を更新
 */
function updateNewGaugeTime(dateArg) {
  const timeEl = document.getElementById('new-current-time-display');
  if (!timeEl) return;

  let now = new Date();

  // 対象日が今日でない場合は0:00を表示
  const baseDate = dateArg ? new Date(dateArg) : new Date();
  baseDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (formatDateISO(baseDate) !== formatDateISO(today)) {
    now = new Date(baseDate);
  }

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  timeEl.textContent = `${hours}:${minutes}`;
}
