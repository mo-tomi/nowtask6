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
