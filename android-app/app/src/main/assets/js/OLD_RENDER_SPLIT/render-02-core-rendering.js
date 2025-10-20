function createNewTaskCard(task, level = 0) {
  const card = document.createElement('div');
  card.className = 'new-task-card' + (task.isCompleted ? ' completed' : '');

  // 優先度に基づくクラスを追加
  if (task.urgent) {
    card.classList.add('urgent');
  } else if (task.priority) {
    card.classList.add(`priority-${task.priority}`);
  }

  // データ属性
  card.dataset.id = task.id;
  card.dataset.taskId = task.id;
  card.dataset.level = level;

  // チェックボックス
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'new-task-checkbox';
  checkbox.checked = task.isCompleted;
  checkbox.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isSelectionMode) {
      toggleTaskSelection(task.id);
    } else {
      toggleTaskCompletion(task.id);
    }
  });
  card.appendChild(checkbox);

  // ボディ（タイトル + メタ）
  const body = document.createElement('div');
  body.className = 'new-task-body';

  const title = document.createElement('div');
  title.className = 'new-task-title';

  // 検索キーワードハイライト
  if (currentSearchKeyword && typeof window.searchFilter !== 'undefined' && typeof window.searchFilter.highlightSearchResult === 'function') {
    title.innerHTML = window.searchFilter.highlightSearchResult(task.title, currentSearchKeyword);
  } else {
    title.textContent = task.title;
  }

  body.appendChild(title);

  // メタ情報
  const meta = createNewTaskMeta(task);
  if (meta.children.length > 0) {
    body.appendChild(meta);
  }

  card.appendChild(body);

  // アクションボタングループ
  const actions = document.createElement('div');
  actions.className = 'new-task-actions';

  // サブタスク追加ボタン（未完了タスクのみ表示）
  if (!task.isCompleted && typeof canHaveSubtask === 'function' && canHaveSubtask(task.id)) {
    const addSubtaskBtn = document.createElement('button');
    addSubtaskBtn.className = 'new-task-action-btn';
    addSubtaskBtn.innerHTML = '+';
    addSubtaskBtn.title = 'サブタスクを追加';
    addSubtaskBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof addingSubtaskForTaskId !== 'undefined' && typeof renderTasks === 'function') {
        addingSubtaskForTaskId = task.id;
        renderTasks();
      }
    });
    actions.appendChild(addSubtaskBtn);
  }

  // メニューボタン
  const menuBtn = document.createElement('button');
  menuBtn.className = 'new-task-menu-btn';
  menuBtn.innerHTML = '⋮';
  menuBtn.title = 'メニュー';
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showTaskMenu(e, task);
  });
  actions.appendChild(menuBtn);

  card.appendChild(actions);

  // クリックで編集
  card.addEventListener('click', (e) => {
    if (!e.target.closest('.new-task-checkbox') && !e.target.closest('.new-task-menu-btn') && !e.target.closest('.new-task-action-btn')) {
      openEditModal(task.id);
    }
  });

  return card;
}

// タスクリスト表示
function renderTasks() {
  const tasks = getTasks();

  // 親タスクのみを抽出（サブタスクは親タスクと一緒に表示される）
  const parentTasks = tasks.filter(t => !t.parentId);

  // 検索・フィルター・ソート機能を適用
  let filteredTasks = parentTasks;
  if (typeof window.searchFilter !== 'undefined' && typeof window.searchFilter.apply === 'function') {
    filteredTasks = window.searchFilter.apply(parentTasks);
  }

  // 完了/未完了で分離
  const activeTasks = filteredTasks.filter(t => !t.isCompleted);
  const completedTasks = filteredTasks.filter(t => t.isCompleted);

  // 検索キーワードを取得（ハイライト表示のため）
  const searchKeyword = (typeof window.searchFilter !== 'undefined' && typeof window.searchFilter.getSearchKeyword === 'function')
    ? window.searchFilter.getSearchKeyword()
    : '';

  // グローバル変数に保存（createTaskElement で使用）
  currentSearchKeyword = searchKeyword;

  // ソート設定（日付グループ内でのソートは不要になったが、互換性のため保持）
  const sortPref = (typeof window.searchFilter !== 'undefined' && typeof window.searchFilter.getCurrentSort === 'function')
    ? window.searchFilter.getCurrentSort()
    : 'time';

  // タスクタブ
  const tasksList = document.getElementById('tasks-list');
  const tasksEmpty = document.getElementById('tasks-empty');
  tasksList.innerHTML = '';

  if (activeTasks.length === 0) {
    tasksEmpty.classList.add('show');
  } else {
    tasksEmpty.classList.remove('show');

    // 日付ごとにタスクをグループ化
    const tasksByDate = groupTasksByDate(activeTasks);

    // 昨日以前（期限切れ+昨日）と今日以降に分離
    const pastGroups = tasksByDate.filter(g =>
      g.date.startsWith('overdue_') || g.date === 'yesterday'
    );
    const currentAndFutureGroups = tasksByDate.filter(g =>
      !g.date.startsWith('overdue_') && g.date !== 'yesterday'
    );

    // 昨日以前のタスクセクション
    if (pastGroups.length > 0) {
      const pastTasksCount = pastGroups.reduce((sum, g) => sum + g.tasks.length, 0);

      // 折りたたみトグルボタン（新UI/旧UIで異なるクラスを使用）
      const pastToggle = document.createElement('button');
      const useNewUI = isNewUIEnabled();
      pastToggle.className = useNewUI ? 'new-past-tasks-toggle' : 'past-tasks-toggle';
      pastToggle.id = 'past-tasks-toggle';

      // 開閉状態を localStorage から復元（デフォルトは閉じた状態）
      const isPastOpen = loadFromStorage('nowtask_past_tasks_open', false);

      const toggleIcon = document.createElement('span');
      toggleIcon.className = 'toggle-icon';
      toggleIcon.textContent = isPastOpen ? '▼' : '▶';

      const toggleText = document.createElement('span');
      toggleText.className = 'toggle-text';
      toggleText.textContent = '昨日以前のタスク';

      const pastCount = document.createElement('span');
      pastCount.className = useNewUI ? 'new-past-tasks-count' : 'past-tasks-count';
      pastCount.textContent = `(${pastTasksCount})`;

      pastToggle.appendChild(toggleIcon);
      pastToggle.appendChild(toggleText);
      pastToggle.appendChild(pastCount);

      if (isPastOpen) {
        pastToggle.classList.add('open');
      }

      tasksList.appendChild(pastToggle);

      // 昨日以前のタスクコンテンツ
      const pastContent = document.createElement('div');
      pastContent.className = useNewUI ? 'new-past-tasks-content' : 'past-tasks-content';
      pastContent.id = 'past-tasks-content';
      if (isPastOpen) {
        pastContent.classList.add('open');
      }

      // 昨日以前のグループをレンダリング
      pastGroups.forEach(({ date, label, tasks: dateTasks }) => {
        renderDateGroup(date, label, dateTasks, pastContent, sortPref);
      });

      tasksList.appendChild(pastContent);

      // トグルイベント
      pastToggle.addEventListener('click', () => {
        const isOpen = pastToggle.classList.toggle('open');
        pastContent.classList.toggle('open');
        toggleIcon.textContent = isOpen ? '▼' : '▶';
        saveToStorage('nowtask_past_tasks_open', isOpen);
      });
    }

    // 今日以降のタスクをレンダリング
    currentAndFutureGroups.forEach(({ date, label, tasks: dateTasks }) => {
      renderDateGroup(date, label, dateTasks, tasksList, sortPref);
    });
  }

  // 完了済みセクション
  const completedList = document.getElementById('completed-list');
  const completedCount = document.getElementById('completed-count');
  const completedSection = document.getElementById('completed-section');
  completedList.innerHTML = '';

  // 完了済みタスクの総数を計算
  let totalCompleted = completedTasks.length;
  completedTasks.forEach(task => {
    const subtasks = getSubtasks(task.id);
    totalCompleted += subtasks.filter(st => st.isCompleted).length;
  });

  if (totalCompleted === 0) {
    completedSection.style.display = 'none';
  } else {
    completedSection.style.display = 'block';
    completedCount.textContent = `(${totalCompleted})`;

    completedTasks.forEach(task => {
      renderTaskWithSubtasks(task, completedList, true);
    });
  }

  // 24時間ゲージ更新
  updateTimeGauge();
}

// セクションラベルをレンダリング（新UI対応）
function renderSectionLabel(dateKey, label) {
  const sectionDiv = document.createElement('div');

  if (isNewUIEnabled()) {
    // 新UI: セクションラベル + 追加ボタン
    sectionDiv.className = 'new-section-label';
    sectionDiv.dataset.date = dateKey;

    const title = document.createElement('span');
    title.className = 'new-section-title';
    title.textContent = label;
    sectionDiv.appendChild(title);

    const addBtn = document.createElement('button');
    addBtn.className = 'new-section-add-btn';
    addBtn.innerHTML = '+';
    addBtn.dataset.date = dateKey;
    addBtn.title = 'タスク追加';
    sectionDiv.appendChild(addBtn);
  } else {
    // 旧UI: 従来の日付セパレーター
    sectionDiv.className = 'date-separator';
    sectionDiv.dataset.date = dateKey;
    sectionDiv.innerHTML = `
      <div class="date-separator-line"></div>
      <div class="date-separator-label">${label}</div>
      <div class="date-separator-line"></div>
    `;
  }

  return sectionDiv;
}

// 日付グループをレンダリング（共通関数）
function renderDateGroup(date, label, dateTasks, container, sortPref) {
  // 各日付グループ内でソートを適用
  if (sortPref === 'time') {
    dateTasks.sort((a, b) => {
      // 期限なしは末尾に回す
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  } else if (sortPref === 'created') {
    // 追加順: createdAt の降順（新しいものを上に）
    dateTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortPref === 'priority') {
    // 優先順位順: 緊急 > 高 > 中 > 低 > 未設定
    const priorityOrder = { high: 1, medium: 2, low: 3, '': 4 };
    dateTasks.sort((a, b) => {
      // 緊急フラグを最優先
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      // 優先度で比較
      const aPriority = priorityOrder[a.priority || ''] || 4;
      const bPriority = priorityOrder[b.priority || ''] || 4;
      return aPriority - bPriority;
    });
  }

  // セクションラベルのレンダリング
  const sectionLabel = renderSectionLabel(date, label);
  container.appendChild(sectionLabel);

  // タスクをレンダリング
  dateTasks.forEach(task => {
    renderTaskWithSubtasks(task, container, false);
  });

  // 明日のタスクの場合、追加ボタンを表示
  if (date === 'tomorrow') {
    const addTomorrowBtn = document.createElement('button');
    addTomorrowBtn.className = 'add-tomorrow-task-btn';
    addTomorrowBtn.innerHTML = '+ 明日のタスクを追加';
    addTomorrowBtn.addEventListener('click', () => {
      // 明日の日付を設定してモーダルを開く
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowISO = formatDateISO(tomorrow);
      openCreateModal();
      // モーダルが開いた後に日付を設定
      setTimeout(() => {
        document.getElementById('task-due-date').value = tomorrowISO;
      }, 0);
    });
    container.appendChild(addTomorrowBtn);
  }
}

// タスクとサブタスクを再帰的にレンダリング
function renderTaskWithSubtasks(task, container, isCompletedSection) {
  const level = getTaskLevel(task.id);

  // タスク要素を作成
  container.appendChild(createTaskElement(task, level));

  // サブタスクを再帰的に表示
  const subtasks = getSubtasks(task.id);
  subtasks.forEach(subtask => {
    // 完了状態によってフィルタリング
    if (isCompletedSection) {
      if (subtask.isCompleted) {
        renderTaskWithSubtasks(subtask, container, true);
      }
    } else {
      if (!subtask.isCompleted) {
        renderTaskWithSubtasks(subtask, container, false);
      }
    }
  });

  // インライン入力中の場合
  if (addingSubtaskForTaskId === task.id) {
    const inputDiv = createSubtaskInputInline(task.id, level);
    container.appendChild(inputDiv);
  }
}

// タスク要素作成
function createTaskElement(task, level = 0) {
  // 新UI有効時は新タスクカード構造を使用
  if (isNewUIEnabled() && level === 0) {
    // 親タスクのみ新構造を使用（サブタスクは旧構造）
    const card = createNewTaskCard(task, level);

    // ドラッグ&ドロップ機能を追加
    setupDragAndDrop(card, task);

    return card;
  }

  // 旧UI（デフォルト）
  const div = document.createElement('div');
  div.className = 'task-item' + (task.isCompleted ? ' completed' : '') + (task.isTutorial ? ' tutorial' : '');
  if (level > 0) {
    div.classList.add('subtask');
    div.classList.add(`level-${level}`);
  }
  if (isSelectionMode && selectedTaskIds.has(task.id)) {
    div.classList.add('selected');
  }
  div.dataset.id = task.id;
  div.dataset.taskId = task.id;
  div.dataset.level = level;

  // 選択モード時の選択チェックボックス
  if (isSelectionMode) {
    const selectCheckbox = document.createElement('input');
    selectCheckbox.type = 'checkbox';
    selectCheckbox.className = 'task-select-checkbox';
    selectCheckbox.checked = selectedTaskIds.has(task.id);
    selectCheckbox.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTaskSelection(task.id);
    });
    div.appendChild(selectCheckbox);
  }

  // チェックボックス
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked = task.isCompleted;
  checkbox.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isSelectionMode) {
      toggleTaskSelection(task.id);
    } else {
      toggleTaskCompletion(task.id);
    }
  });

  // コンテンツ部分
  const content = document.createElement('div');
  content.className = 'task-content';

  const title = document.createElement('div');
  title.className = 'task-title';

  // 検索キーワードがある場合はハイライト表示
  if (currentSearchKeyword && typeof window.searchFilter !== 'undefined' && typeof window.searchFilter.highlightSearchResult === 'function') {
    title.innerHTML = window.searchFilter.highlightSearchResult(task.title, currentSearchKeyword);
  } else {
    title.textContent = task.title;
  }

  content.appendChild(title);

  // メタ情報
  const meta = document.createElement('div');
  meta.className = 'task-meta';

  // 緊急ラベル
  if (task.urgent) {
    const urgentLabel = document.createElement('span');
    urgentLabel.className = 'task-urgent-label';
    urgentLabel.textContent = '🚨 緊急';
    meta.appendChild(urgentLabel);
  }

  // 優先順位ラベル
  if (task.priority) {
    const priorityLabel = document.createElement('span');
    priorityLabel.className = `task-priority-label ${task.priority}`;
    const priorityText = {
      high: '優先度: 高',
      medium: '優先度: 中',
      low: '優先度: 低'
    };
    priorityLabel.textContent = priorityText[task.priority] || '';
    meta.appendChild(priorityLabel);
  }

  // 開始時刻・終了時刻
  if (task.startTime || task.endTime) {
    const timeSpan = document.createElement('span');
    timeSpan.className = 'task-duration';
    if (task.startTime && task.endTime) {
      timeSpan.textContent = `🕒 ${task.startTime} ~ ${task.endTime}`;
    } else if (task.startTime) {
      timeSpan.textContent = `🕒 ${task.startTime} ~`;
    } else if (task.endTime) {
      timeSpan.textContent = `🕒 ~ ${task.endTime}`;
    }
    meta.appendChild(timeSpan);
  }

  // サブタスク数表示（子タスクを持つ場合）
  const subtasks = getSubtasks(task.id);
  if (subtasks.length > 0) {
    // 折りたたみトグル（サブタスクを持つ親タスクに表示）
    const collapseToggle = document.createElement('button');
    collapseToggle.className = 'collapse-toggle';
    collapseToggle.title = 'サブタスクを折りたたむ/展開する';
    // 初期は展開状態
    collapseToggle.textContent = '▼';
    // data 属性で開閉状態を管理
    div.dataset.collapsed = 'false';

    collapseToggle.addEventListener('click', (e) => {
      // モーダルや編集イベントを発火させない
      e.stopPropagation();
      const parentLevel = Number(div.dataset.level || 0);
      const isCollapsed = div.dataset.collapsed === 'true';

      // トグル表示
      div.dataset.collapsed = isCollapsed ? 'false' : 'true';
      collapseToggle.textContent = isCollapsed ? '▼' : '▶';

      // 親要素の次の兄弟要素から探索し、親より深いレベルの要素を隠す/表示する
      let sibling = div.nextElementSibling;
      while (sibling) {
        const siblingLevel = Number(sibling.dataset.level || 0);
        // 親より深ければサブタスクとみなす
        if (siblingLevel > parentLevel) {
          if (div.dataset.collapsed === 'true') {
            sibling.classList.add('subtask-hidden');
          } else {
            sibling.classList.remove('subtask-hidden');
          }
        } else {
          // 同レベルかそれ以下に到達したらサブタスク列の終端
          break;
        }
        sibling = sibling.nextElementSibling;
      }
    });

    meta.appendChild(collapseToggle);

    const subtaskCount = document.createElement('span');
    subtaskCount.className = 'subtask-count';
    const completedCount = subtasks.filter(st => st.isCompleted).length;
    subtaskCount.textContent = `📋 ${completedCount}/${subtasks.length}`;
    meta.appendChild(subtaskCount);
  }

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
