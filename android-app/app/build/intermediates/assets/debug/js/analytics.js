// ========================================
// データ分析機能
// ========================================

/**
 * タスクランキングを取得（完了したタスクをtotalTimeまたはdurationでソート）
 * @returns {Array} TOP5のタスクリスト
 */
function getTaskRanking() {
  const tasks = getTasks();

  // 完了したタスクのみを抽出し、totalTimeまたはdurationでソート
  const completedTasks = tasks
    .filter(task => {
      if (!task.isCompleted) return false;
      // ランキングから除外されているタスクは含めない
      if (task.excludeFromRanking) return false;
      // totalTimeまたはdurationがある場合のみ含める
      return (task.totalTime && task.totalTime > 0) || (task.duration && task.duration > 0);
    })
    .map(task => {
      // totalTimeを秒単位、durationを分単位から秒単位に変換
      const timeInSeconds = task.totalTime || (task.duration * 60) || 0;
      return { ...task, timeInSeconds };
    })
    .sort((a, b) => b.timeInSeconds - a.timeInSeconds)
    .slice(0, 5); // TOP5のみ

  return completedTasks;
}

/**
 * タスクランキングをHTMLに描画
 */
function renderTaskRanking() {
  const ranking = getTaskRanking();
  const container = document.getElementById('task-ranking-list');

  if (!container) return;

  // ランキングが空の場合
  if (!ranking || ranking.length === 0) {
    container.innerHTML = '<div class="empty-analytics">まだ完了したタスクがありません</div>';
    return;
  }

  // ランキングを描画
  container.innerHTML = ranking.map((task, index) => {
    const position = index + 1;
    let positionClass = '';
    let medal = '';

    if (position === 1) {
      positionClass = 'gold';
      medal = '🥇';
    } else if (position === 2) {
      positionClass = 'silver';
      medal = '🥈';
    } else if (position === 3) {
      positionClass = 'bronze';
      medal = '🥉';
    }

    // timeInSecondsを使用して時間を計算
    const hours = Math.floor(task.timeInSeconds / 3600);
    const minutes = Math.floor((task.timeInSeconds % 3600) / 60);
    const timeText = hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分`;

    return `
      <div class="ranking-item">
        <div class="ranking-position ${positionClass}">${medal || position}</div>
        <div class="ranking-info">
          <div class="ranking-task-name">${escapeHtml(task.title)}</div>
        </div>
        <div class="ranking-time">${timeText}</div>
        <button class="ranking-exclude-btn" data-task-id="${task.id}" title="ランキングから除外">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;
  }).join('');

  // 除外ボタンのイベントリスナーを追加
  const excludeBtns = container.querySelectorAll('.ranking-exclude-btn');
  excludeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId = btn.dataset.taskId;
      toggleTaskRankingExclusion(taskId);
      renderTaskRanking(); // ランキングを再描画
    });
  });
}

/**
 * 毎日の空き時間を記録
 * @param {number} freeMinutes - 空き時間（分）
 */
function recordDailyFreeTime(freeMinutes) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD形式

  // localStorageから既存のデータを取得
  const storedData = localStorage.getItem('nowtask_daily_free_time');
  const data = storedData ? JSON.parse(storedData) : {};

  // 今日のデータを更新
  data[today] = freeMinutes;

  // localStorageに保存
  localStorage.setItem('nowtask_daily_free_time', JSON.stringify(data));
}

/**
 * 指定期間の平均空き時間を計算
 * @param {number} days - 過去何日分を計算するか
 * @returns {number} 平均空き時間（分）
 */
function calculateAverageFreeTime(days) {
  const storedData = localStorage.getItem('nowtask_daily_free_time');
  if (!storedData) return 0;

  let data;
  try {
    data = JSON.parse(storedData);
  } catch (e) {
    console.warn('Failed to parse free time data in calculateAverageFreeTime:', e);
    return 0;
  }

  const dates = Object.keys(data).sort().reverse(); // 新しい順にソート

  if (dates.length === 0) return 0;

  // 指定日数分のデータを取得
  const targetDates = dates.slice(0, days);
  const sum = targetDates.reduce((acc, date) => acc + data[date], 0);

  return targetDates.length > 0 ? Math.round(sum / targetDates.length) : 0;
}

/**
 * 空き時間統計を描画
 */
function renderFreeTimeStats() {
  const container = document.getElementById('free-time-stats');
  if (!container) return;

  const storedData = localStorage.getItem('nowtask_daily_free_time');

  // データが存在しない場合
  if (!storedData) {
    container.innerHTML = '<div class="empty-analytics">まだ空き時間のデータがありません</div>';
    return;
  }

  let data;
  try {
    data = JSON.parse(storedData);
  } catch (e) {
    console.warn('Failed to parse free time data:', e);
    container.innerHTML = '<div class="empty-analytics">データの読み込みに失敗しました</div>';
    return;
  }
  const today = new Date().toISOString().split('T')[0];
  const todayFreeTime = data[today] || 0;

  const avg7Days = calculateAverageFreeTime(7);
  const avg30Days = calculateAverageFreeTime(30);
  const allDates = Object.keys(data);
  const avgAllTime = allDates.length > 0
    ? Math.round(Object.values(data).reduce((a, b) => a + b, 0) / allDates.length)
    : 0;

  // 時間と分に変換するヘルパー関数
  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return { hours: h, minutes: m };
  };

  const avg7Time = formatTime(avg7Days);
  const avg30Time = formatTime(avg30Days);
  const avgAllTimeFormatted = formatTime(avgAllTime);

  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">7日間平均</div>
      <div>
        <span class="stat-value">${avg7Time.hours}</span>
        <span class="stat-unit">時間</span>
        <span class="stat-value">${avg7Time.minutes}</span>
        <span class="stat-unit">分</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-label">30日間平均</div>
      <div>
        <span class="stat-value">${avg30Time.hours}</span>
        <span class="stat-unit">時間</span>
        <span class="stat-value">${avg30Time.minutes}</span>
        <span class="stat-unit">分</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-label">全期間平均</div>
      <div>
        <span class="stat-value">${avgAllTimeFormatted.hours}</span>
        <span class="stat-unit">時間</span>
        <span class="stat-value">${avgAllTimeFormatted.minutes}</span>
        <span class="stat-unit">分</span>
      </div>
    </div>
  `;
}

/**
 * 月次空き時間データを計算
 * @returns {Object} { months: ['1月', '2月', ...], data: [平均分, ...], yearTotal: 年間総空き時間 }
 */
function calculateMonthlyFreeTime() {
  const storedData = localStorage.getItem('nowtask_daily_free_time');
  if (!storedData) return { months: [], data: [], yearTotal: 0 };

  let data;
  try {
    data = JSON.parse(storedData);
  } catch (e) {
    console.warn('Failed to parse daily free time data:', e);
    return { months: [], data: [], yearTotal: 0 };
  }
  const now = new Date();
  const currentYear = now.getFullYear();

  // 過去12ヶ月のデータを集計
  const monthlyData = {};
  const monthLabels = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${month}`;
    const label = `${month}月`;

    monthLabels.push(label);
    monthlyData[key] = { sum: 0, count: 0, year, month };
  }

  // 日次データを月次に集計
  Object.keys(data).forEach(dateStr => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const key = `${year}-${month}`;

    if (monthlyData[key]) {
      monthlyData[key].sum += data[dateStr];
      monthlyData[key].count += 1;
    }
  });

  // 月平均を計算
  const monthlyAverages = monthLabels.map((label, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${month}`;
    const monthData = monthlyData[key];

    if (monthData.count === 0) return 0;
    return Math.round(monthData.sum / monthData.count);
  });

  // 年間総空き時間を計算（今年のデータのみ）
  let yearTotal = 0;
  Object.keys(data).forEach(dateStr => {
    const [year] = dateStr.split('-').map(Number);
    if (year === currentYear) {
      yearTotal += data[dateStr];
    }
  });

  return {
    months: monthLabels,
    data: monthlyAverages,
    yearTotal: yearTotal
  };
}

/**
 * 年間空き時間分析を描画
 */
function renderYearlyFreeTime() {
  const container = document.getElementById('yearly-free-time');
  if (!container) return;

  const result = calculateMonthlyFreeTime();
  if (!result) {
    container.innerHTML = '<div class="empty-analytics">データの読み込みに失敗しました</div>';
    return;
  }

  const { months, data, yearTotal } = result;

  // データがない場合
  if (!data || data.length === 0 || data.every(v => v === 0)) {
    container.innerHTML = '<div class="empty-analytics">まだ年間データがありません</div>';
    return;
  }

  // 最大値を取得（グラフの高さ調整用）
  const maxValue = Math.max(...data, 1);

  // 年間統計
  const yearHours = Math.floor(yearTotal / 60);
  const yearMinutes = yearTotal % 60;
  const avgPerDay = data.reduce((a, b) => a + b, 0) / data.length;
  const avgDayHours = Math.floor(avgPerDay / 60);
  const avgDayMinutes = Math.round(avgPerDay % 60);

  // グラフとして描画
  const bars = months.map((month, index) => {
    const value = data[index];
    const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    const timeText = hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;

    return `
      <div class="chart-bar-container">
        <div class="chart-bar-wrapper">
          <div class="chart-bar" style="height: ${height}%;" title="${month}: ${timeText}">
            <span class="chart-bar-label">${timeText}</span>
          </div>
        </div>
        <div class="chart-month-label">${month}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="yearly-stats">
      <div class="stat-card">
        <div class="stat-label">今年の総空き時間</div>
        <div>
          <span class="stat-value">${yearHours}</span>
          <span class="stat-unit">時間</span>
          <span class="stat-value">${yearMinutes}</span>
          <span class="stat-unit">分</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">1日平均</div>
        <div>
          <span class="stat-value">${avgDayHours}</span>
          <span class="stat-unit">時間</span>
          <span class="stat-value">${avgDayMinutes}</span>
          <span class="stat-unit">分</span>
        </div>
      </div>
    </div>
    <div class="chart-container">
      <div class="chart-title">月平均空き時間（過去12ヶ月）</div>
      <div class="chart-bars">
        ${bars}
      </div>
    </div>
  `;
}

/**
 * 分析モーダルを開く
 */
function openAnalyticsModal() {
  const modal = document.getElementById('analytics-modal');
  if (!modal) return;

  // データを描画
  renderTaskRanking();
  renderFreeTimeStats();
  renderYearlyFreeTime();

  // モーダルを表示
  modal.style.display = 'flex';
  modal.classList.add('show');
}

/**
 * 分析モーダルを閉じる
 */
function closeAnalyticsModal() {
  const modal = document.getElementById('analytics-modal');
  if (!modal) return;

  modal.style.display = 'none';
  modal.classList.remove('show');
}

/**
 * HTMLエスケープ
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * タスクのランキング除外状態を切り替え
 * @param {string} taskId - タスクID
 */
function toggleTaskRankingExclusion(taskId) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === taskId);

  if (!task) return;

  // 除外フラグを切り替え（未設定の場合はfalseとして扱う）
  task.excludeFromRanking = !task.excludeFromRanking;

  // 更新日時を設定
  task.updatedAt = new Date().toISOString();

  // タスクを保存
  saveTasks(tasks);
}
