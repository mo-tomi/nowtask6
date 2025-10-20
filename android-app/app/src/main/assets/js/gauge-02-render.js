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
