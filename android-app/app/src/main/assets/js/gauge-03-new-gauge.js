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
