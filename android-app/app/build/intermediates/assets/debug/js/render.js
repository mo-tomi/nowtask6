// ========================================
// レンダリング関数
// ========================================

// グローバル変数（インライン追加中のタスク）
let addingSubtaskForTaskId = null;

// 複数選択モード用グローバル変数
let isSelectionMode = false;
let selectedTaskIds = new Set();

// 日付ごとにタスクをグループ化
function groupTasksByDate(tasks) {
  const groups = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  tasks.forEach(task => {
    let dateKey, label;

    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      // 今日、明日、昨日、それ以外で判定
      if (dueDate.getTime() === today.getTime()) {
        dateKey = 'today';
        label = '今日 ' + formatDate(task.dueDate);
      } else if (dueDate.getTime() === tomorrow.getTime()) {
        dateKey = 'tomorrow';
        label = '明日 ' + formatDate(task.dueDate);
      } else if (dueDate.getTime() === yesterday.getTime()) {
        dateKey = 'yesterday';
        label = '昨日 ' + formatDate(task.dueDate);
      } else if (dueDate < today) {
        dateKey = 'overdue_' + dueDate.getTime();
        label = formatDate(task.dueDate) + ' (期限切れ)';
      } else {
        dateKey = 'future_' + dueDate.getTime();
        label = formatDate(task.dueDate);
      }
    } else {
      dateKey = 'no_date';
      label = '期限なし';
    }

    if (!groups[dateKey]) {
      // dateObj はそのグループの日付（午前0時）を保持する。期限なしは null。
      let dateObj = null;
      if (task.dueDate) {
        dateObj = new Date(task.dueDate);
        dateObj.setHours(0, 0, 0, 0);
      }
      groups[dateKey] = { date: dateKey, label, tasks: [], sortOrder: getSortOrder(dateKey, task.dueDate), dateObj };
    }
    groups[dateKey].tasks.push(task);
  });

  // ソート順序: 期限切れ → 昨日 → 今日 → 明日 → 未来 → 期限なし
  return Object.values(groups).sort((a, b) => a.sortOrder - b.sortOrder);
}

function getSortOrder(dateKey, dueDate) {
  if (dateKey.startsWith('overdue_')) return -1000 + new Date(dueDate).getTime();
  if (dateKey === 'yesterday') return -2;
  if (dateKey === 'today') return -1;
  if (dateKey === 'tomorrow') return 0;
  if (dateKey.startsWith('future_')) return 1000 + new Date(dueDate).getTime();
  return 10000; // 期限なし
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[date.getDay()];
  return `${month}月${day}日 (${weekday})`;
}

// Date オブジェクトを YYYY-MM-DD 形式の文字列に変換（null 安全）
function formatDateISO(dateObj) {
  if (!dateObj) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// グローバルフィルター状態
let currentFilter = null; // 'urgent' | 'high-priority' | null

// グローバル検索キーワード（ハイライト表示用）
let currentSearchKeyword = '';

// ========================================
// UI バージョン判定ヘルパー
// ========================================
function isNewUIEnabled() {
  const version = localStorage.getItem('ui-version') || 'new';
  return version === 'new';
}

// ========================================
// 新タスクカード レンダリング
// ========================================

/**
 * 新タスクカード用メタ情報を作成
 */
function createNewTaskMeta(task) {
  const meta = document.createElement('div');
  meta.className = 'new-task-meta';

  // 所要時間バッジ
  if (task.duration) {
    const hours = Math.floor(task.duration / 60);
    const minutes = task.duration % 60;
    let durationText = '';
    if (hours > 0) {
      durationText = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } else {
      durationText = `${minutes}m`;
    }

    const durationBadge = document.createElement('span');
    durationBadge.className = 'new-duration-badge';
    durationBadge.textContent = `⏰ ${durationText}`;
    meta.appendChild(durationBadge);
  }

  // 緊急バッジ
  if (task.urgent) {
    const urgentBadge = document.createElement('span');
    urgentBadge.className = 'new-urgent-badge';
    urgentBadge.textContent = '🚨 緊急';
    meta.appendChild(urgentBadge);
  }

  return meta;
}

/**
 * 新タスクカード構造を作成
 */
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
  const div = document.createElement('div');
  div.className = 'subtask-input-inline';
  div.classList.add(`level-${parentLevel + 1}`);

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'サブタスク名を入力';
  input.maxLength = 100;

  const saveInlineSubtask = () => {
    const title = input.value.trim();
    if (title) {
      createTask(title, '', null, parentId);
    }
    addingSubtaskForTaskId = null;
    renderTasks();
  };

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveInlineSubtask();
    }
  });

  input.addEventListener('blur', () => {
    setTimeout(() => {
      addingSubtaskForTaskId = null;
      renderTasks();
    }, 200);
  });

  div.appendChild(input);

  // 自動フォーカス
  setTimeout(() => input.focus(), 0);

  return div;
}

// ========================================
// ドラッグ&ドロップ機能
// ========================================
let draggedElement = null;
let longPressTimer = null;
let isDragging = false;
let dragStartX = 0;
let dragStartLevel = 0;
let currentDragLevel = 0;

// スワイプジェスチャー用の変数
let isSwiping = false;
let swipeDirection = null; // 'left' | 'right' | null

function setupDragAndDrop(element, task) {
  let startY = 0;
  let startX = 0;
  let swipeStartTime = 0;
  let hasMoved = false; // ドラッグで実際に移動したかどうか
  let dragDistance = 0; // ドラッグした距離
  let longPressTouchX = 0; // 長押し時のタッチ位置X
  let longPressTouchY = 0; // 長押し時のタッチ位置Y

  // タッチデバイス用の長押し検出
  element.addEventListener('touchstart', (e) => {
    // チェックボックスやボタンの場合は無視
    if (e.target.closest('.task-checkbox') || e.target.closest('.task-card-actions') ||
        e.target.closest('.new-task-checkbox') || e.target.closest('.new-task-menu-btn')) {
      return;
    }

    const touch = e.touches[0];
    startY = touch.clientY;
    startX = touch.clientX;
    longPressTouchX = touch.clientX;
    longPressTouchY = touch.clientY;
    swipeStartTime = Date.now();
    isSwiping = false;
    swipeDirection = null;
    hasMoved = false;
    dragDistance = 0;

    // 500ms長押しでコンテキストメニュー表示
    longPressTimer = setTimeout(() => {
      if (!isSwiping) {
        // 振動フィードバック（対応デバイスのみ）
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }

        // コンテキストメニューを表示
        showTaskMenuFromLongPress(longPressTouchX, longPressTouchY, task);

        // 長押しタイマーをクリア
        longPressTimer = null;
      }
    }, 500);
  });

  element.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const moveY = Math.abs(touch.clientY - startY);
    const moveX = touch.clientX - startX;
    const moveXAbs = Math.abs(moveX);

    // スワイプジェスチャー判定（水平方向の移動が垂直方向より大きい場合）
    if (!isDragging && !isSwiping && moveXAbs > 25 && moveXAbs > moveY * 1.5) {
      // 長押しタイマーをキャンセル
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }

      isSwiping = true;
      element.classList.add('swiping');

      // 振動フィードバック
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    }

    // スワイプ中の視覚的フィードバック
    if (isSwiping) {
      e.preventDefault(); // 画面スクロールを防止
      e.stopPropagation(); // イベント伝播を停止

      // 真ん中のキャンセルゾーン（±15px以内）
      const CANCEL_ZONE = 15;

      if (moveXAbs <= CANCEL_ZONE) {
        // キャンセルゾーン内：どの方向のスタイルも外す
        swipeDirection = null;
        element.classList.remove('swiping-left', 'swiping-right');
      } else {
        // キャンセルゾーン外：スワイプ方向を判定
        if (moveX > CANCEL_ZONE) {
          swipeDirection = 'right';
          element.classList.remove('swiping-left');
          element.classList.add('swiping-right');
        } else if (moveX < -CANCEL_ZONE) {
          swipeDirection = 'left';
          element.classList.remove('swiping-right');
          element.classList.add('swiping-left');
        }
      }
    }
    // ドラッグ&ドロップ中の処理
    else if (isDragging && draggedElement) {
      e.preventDefault();

      // 移動距離を計算（50px以上移動したら実際に移動したとみなす）
      const totalMoveY = Math.abs(touch.clientY - startY);
      const totalMoveX = Math.abs(touch.clientX - startX);
      dragDistance = Math.max(totalMoveY, totalMoveX);

      if (dragDistance > 50 && !hasMoved) {
        hasMoved = true; // 50px以上移動したら移動判定
        console.log('Drag moved more than 50px - will save position');
      }

      // 水平方向のドラッグで階層を変更
      const deltaX = touch.clientX - dragStartX;
      const indentSize = 40; // 1階層のインデント幅（px）
      const levelChange = Math.floor(deltaX / indentSize);
      const newLevel = Math.max(0, Math.min(4, dragStartLevel + levelChange));

      // レベルが変更された場合、視覚的なフィードバックを提供
      if (newLevel !== currentDragLevel) {
        currentDragLevel = newLevel;
        draggedElement.dataset.level = newLevel;
        // 既存クラスを保持しながらdraggingを追加
        draggedElement.classList.add('dragging');
        // 旧レベルのクラスを削除
        for (let i = 0; i <= 4; i++) {
          draggedElement.classList.remove(`level-${i}`);
        }
        if (newLevel > 0) {
          draggedElement.classList.add('subtask');
          draggedElement.classList.add(`level-${newLevel}`);
        } else {
          draggedElement.classList.remove('subtask');
        }
        // 振動フィードバック
        if (navigator.vibrate) {
          navigator.vibrate(20);
        }
      }

      const afterElement = getDragAfterElement(element.parentElement, touch.clientY);

      if (afterElement == null) {
        element.parentElement.appendChild(draggedElement);
      } else {
        element.parentElement.insertBefore(draggedElement, afterElement);
      }
    }
    // 水平方向の動きを検出したら早めにスクロールを防止
    else if (!isDragging && moveXAbs > 10 && moveXAbs > moveY) {
      e.preventDefault(); // 横方向の動きが優位なら画面スクロールを防止
    }

    // 長押しタイマーをキャンセル（20px以上動いた場合）
    if (longPressTimer && (moveY > 20 || moveXAbs > 20)) {
      if (!isSwiping) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }
  });

  element.addEventListener('touchend', (e) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }

    // スワイプジェスチャーの処理
    if (isSwiping) {
      e.preventDefault();

      const touch = e.changedTouches[0];
      const moveX = touch.clientX - startX;
      const swipeDuration = Date.now() - swipeStartTime;
      const CANCEL_ZONE = 15;

      // スワイプ判定（キャンセルゾーン外 かつ 1000ms以内）
      if (Math.abs(moveX) > CANCEL_ZONE && swipeDuration < 1000 && swipeDirection) {
        if (swipeDirection === 'right') {
          // 右スワイプ: タスク完了/未完了トグル
          handleSwipeRight(task.id, element);
        } else if (swipeDirection === 'left') {
          // 左スワイプ: タスク削除
          handleSwipeLeft(task.id, element);
        }
      } else {
        // キャンセルゾーン内またはスワイプ不十分な場合、元に戻す
        element.classList.add('swipe-reset');
        setTimeout(() => {
          element.classList.remove('swiping', 'swiping-right', 'swiping-left', 'swipe-reset');
        }, 300);
      }

      isSwiping = false;
      swipeDirection = null;
    }
    // ドラッグ&ドロップの終了処理
    else if (isDragging && draggedElement) {
      e.preventDefault();
      element.classList.remove('dragging');

      console.log(`touchend - isDragging: true, hasMoved: ${hasMoved}, dragDistance: ${dragDistance}px`);

      // 実際に移動した場合のみ新しい順序を保存
      if (hasMoved) {
        console.log('Saving new task order (moved > 50px)');
        saveNewTaskOrder();
      } else {
        console.log('NOT saving - drag distance too small');
      }

      isDragging = false;
      draggedElement = null;
      dragStartX = 0;
      dragStartLevel = 0;
      currentDragLevel = 0;
      hasMoved = false;
      dragDistance = 0;
    }
  });

  // MIUIなどのシステムがタッチをキャンセルした場合の処理
  element.addEventListener('touchcancel', (e) => {
    console.log(`touchcancel - isDragging: ${isDragging}, hasMoved: ${hasMoved}, dragDistance: ${dragDistance}px`);

    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }

    // スワイプ中の場合はリセット
    if (isSwiping) {
      element.classList.add('swipe-reset');
      setTimeout(() => {
        element.classList.remove('swiping', 'swiping-right', 'swiping-left', 'swipe-reset');
      }, 300);
      isSwiping = false;
      swipeDirection = null;
    }

    // ドラッグ中の場合もリセット（保存しない）
    if (isDragging && draggedElement) {
      element.classList.remove('dragging');

      // touchcancelの場合は絶対に保存しない
      console.log('Touch cancelled by system - FORCING not to save position');

      isDragging = false;
      draggedElement = null;
      dragStartX = 0;
      dragStartLevel = 0;
      currentDragLevel = 0;
      hasMoved = false;
      dragDistance = 0;

      // 再レンダリングして元の状態に戻す
      renderTasks();
    }
  });

  // PC用のドラッグ&ドロップ
  element.setAttribute('draggable', 'true');

  element.addEventListener('dragstart', (e) => {
    // チェックボックスやボタンの場合は無視
    if (e.target.closest('.task-checkbox') || e.target.closest('.task-card-actions') ||
        e.target.closest('.new-task-checkbox') || e.target.closest('.new-task-menu-btn')) {
      e.preventDefault();
      return;
    }

    draggedElement = element;
    dragStartX = e.clientX;
    dragStartLevel = Number(element.dataset.level || 0);
    currentDragLevel = dragStartLevel;
    element.classList.add('dragging');
  });

  element.addEventListener('drag', (e) => {
    if (e.clientX === 0 && e.clientY === 0) return; // ドラッグ終了時のイベントを無視

    // 水平方向のドラッグで階層を変更
    const deltaX = e.clientX - dragStartX;
    const indentSize = 40; // 1階層のインデント幅（px）
    const levelChange = Math.floor(deltaX / indentSize);
    const newLevel = Math.max(0, Math.min(4, dragStartLevel + levelChange));

    // レベルが変更された場合、視覚的なフィードバックを提供
    if (newLevel !== currentDragLevel) {
      currentDragLevel = newLevel;
      draggedElement.dataset.level = newLevel;
      // 既存クラスを保持しながらdraggingを追加
      draggedElement.classList.add('dragging');
      // 旧レベルのクラスを削除
      for (let i = 0; i <= 4; i++) {
        draggedElement.classList.remove(`level-${i}`);
      }
      if (newLevel > 0) {
        draggedElement.classList.add('subtask');
        draggedElement.classList.add(`level-${newLevel}`);
      } else {
        draggedElement.classList.remove('subtask');
      }
    }
  });

  element.addEventListener('dragend', () => {
    console.log('dragend event fired');
    element.classList.remove('dragging');

    // 新しい順序を保存（ガードがあるので安全）
    saveNewTaskOrder();

    draggedElement = null;
    dragStartX = 0;
    dragStartLevel = 0;
    currentDragLevel = 0;
  });

  element.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(element.parentElement, e.clientY);

    if (draggedElement && draggedElement !== element) {
      if (afterElement == null) {
        element.parentElement.appendChild(draggedElement);
      } else {
        element.parentElement.insertBefore(draggedElement, afterElement);
      }
    }
  });
}

function getDragAfterElement(container, y) {
  // 旧カード（.task-item）と新カード（.new-task-card）の両方を選択
  const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging), .new-task-card:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function saveNewTaskOrder() {
  // ガード: ドラッグ中でない場合は保存しない
  if (!isDragging && !draggedElement) {
    console.log('saveNewTaskOrder called but not dragging - BLOCKING SAVE');
    return;
  }

  const tasks = getTasks();
  // 旧カード（.task-item）と新カード（.new-task-card）の両方を選択
  const taskElements = document.querySelectorAll('.task-item:not(.completed), .new-task-card:not(.completed)');

  // 新しい順序とレベルでタスクIDを取得
  const newOrder = [];
  taskElements.forEach(el => {
    const taskId = el.dataset.taskId;
    if (taskId) {
      newOrder.push({
        id: taskId,
        level: Number(el.dataset.level || 0)
      });
    }
  });

  // ドラッグされたタスクの新しい親を決定
  const draggedTaskId = draggedElement ? draggedElement.dataset.taskId : null;
  if (draggedTaskId) {
    const draggedIndex = newOrder.findIndex(item => item.id === draggedTaskId);
    if (draggedIndex !== -1) {
      const draggedLevel = newOrder[draggedIndex].level;
      let newParentId = null;

      // ドラッグされたタスクの直前のタスクを探す
      for (let i = draggedIndex - 1; i >= 0; i--) {
        const prevTask = newOrder[i];

        // 同じレベルの場合は、同じ親を持つ
        if (prevTask.level === draggedLevel) {
          const prevTaskData = getTaskById(prevTask.id);
          newParentId = prevTaskData ? prevTaskData.parentId : null;
          break;
        }
        // 1つ浅いレベルの場合は、そのタスクを親とする
        else if (prevTask.level === draggedLevel - 1) {
          newParentId = prevTask.id;
          break;
        }
        // より浅いレベルの場合は、そのレベルまで戻って親を探す
        else if (prevTask.level < draggedLevel - 1) {
          const prevTaskData = getTaskById(prevTask.id);
          newParentId = prevTaskData ? prevTaskData.parentId : null;
          break;
        }
      }

      // バリデーション: 新しい親が有効かチェック
      const draggedTask = getTaskById(draggedTaskId);
      let isValidParent = true;

      if (newParentId) {
        // 1. サブタスクを持つタスクは他のタスクのサブタスクにできない
        const draggedSubtasks = getSubtasks(draggedTaskId);
        if (draggedSubtasks.length > 0) {
          // 新しい親が設定される場合（独立タスクからサブタスクになる場合）
          const newParentLevel = getTaskLevel(newParentId);
          if (newParentLevel + draggedSubtasks.length + 1 > 4) {
            isValidParent = false;
          }
        }

        // 2. 5階層制限のチェック
        const newParentLevel = getTaskLevel(newParentId);
        if (newParentLevel >= 4) {
          isValidParent = false;
        }

        // 3. 自分自身や自分の子孫を親にできない
        let ancestor = newParentId;
        while (ancestor) {
          if (ancestor === draggedTaskId) {
            isValidParent = false;
            break;
          }
          const ancestorTask = getTaskById(ancestor);
          ancestor = ancestorTask ? ancestorTask.parentId : null;
        }
      }

      // ドラッグされたタスクの親IDを更新
      if (draggedTask && draggedTask.parentId !== newParentId && isValidParent) {
        updateTask(draggedTaskId, { parentId: newParentId });

        // 元の親タスクの時間を再集計
        if (draggedTask.parentId && typeof aggregateSubtaskTimes === 'function') {
          aggregateSubtaskTimes(draggedTask.parentId);
        }
        // 新しい親タスクの時間を集計
        if (newParentId && typeof aggregateSubtaskTimes === 'function') {
          aggregateSubtaskTimes(newParentId);
        }
      } else if (!isValidParent) {
        // 無効な親の場合は元のレベルに戻す
        console.warn('Invalid parent: Cannot create this hierarchy');
      }

      // 日付を跨ぐドラッグ: ドラッグされたタスクの日付を更新
      // ドラッグされたタスクの直前の日付セパレーターを見つける
      const draggedTaskElement = draggedElement;
      if (draggedTaskElement && draggedTask && draggedLevel === 0) {
        // レベル0（親タスク）の場合のみ日付変更を許可
        let currentElement = draggedTaskElement.previousElementSibling;
        let nearestDateSeparator = null;

        // 直前の日付セパレーターを探す
        while (currentElement) {
          if (currentElement.classList.contains('date-separator')) {
            nearestDateSeparator = currentElement;
            break;
          }
          currentElement = currentElement.previousElementSibling;
        }

        if (nearestDateSeparator) {
          const newDateISO = nearestDateSeparator.dataset.date;
          if (newDateISO) {
            // 新しい日付を設定（ISO形式: YYYY-MM-DD）
            const newDueDate = new Date(newDateISO + 'T00:00:00').toISOString();
            if (draggedTask.dueDate !== newDueDate) {
              updateTask(draggedTaskId, { dueDate: newDueDate });
            }
          } else if (newDateISO === '') {
            // 期限なしセクションにドラッグされた場合
            if (draggedTask.dueDate) {
              updateTask(draggedTaskId, { dueDate: null });
            }
          }
        }
      }
    }
  }

  // タスクの順序を更新（customOrder フィールドを追加）
  tasks.forEach((task, index) => {
    const newIndex = newOrder.findIndex(item => item.id === task.id);
    if (newIndex !== -1) {
      task.customOrder = newIndex;
    }
  });

  // 保存
  saveTasks(tasks);

  // 再レンダリング
  renderTasks();
}

// ========================================
// スワイプジェスチャーハンドラー
// ========================================

/**
 * 右スワイプ: タスク完了/未完了トグル
 */
function handleSwipeRight(taskId, element) {
  const task = getTaskById(taskId);
  if (!task) return;

  // 完了状態をトグル
  const newCompletedState = !task.isCompleted;
  updateTask(taskId, { isCompleted: newCompletedState });

  // 振動フィードバック
  if (navigator.vibrate) {
    navigator.vibrate(30);
  }

  // アニメーションでフェードアウト
  element.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
  element.style.opacity = '0';
  element.style.transform = 'translateX(100px)';

  // 300ms後に再レンダリング
  setTimeout(() => {
    renderTasks();
  }, 300);
}

/**
 * 左スワイプ: タスク削除
 */
function handleSwipeLeft(taskId, element) {
  const task = getTaskById(taskId);
  if (!task) return;

  // 確認ダイアログを表示
  const confirmDelete = confirm(`「${task.title}」を削除してもよろしいですか？`);

  if (confirmDelete) {
    // 振動フィードバック
    if (navigator.vibrate) {
      navigator.vibrate([20, 50, 20]);
    }

    // アニメーションでフェードアウト
    element.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
    element.style.opacity = '0';
    element.style.transform = 'translateX(-100px)';

    // 300ms後にタスクを削除して再レンダリング
    setTimeout(() => {
      deleteTask(taskId);
      renderTasks();
    }, 300);
  } else {
    // キャンセルした場合は元に戻す
    element.classList.add('swipe-reset');
    setTimeout(() => {
      element.classList.remove('swiping', 'swiping-left', 'swipe-reset');
    }, 300);
  }
}

// ========================================
// タスクメニュー
// ========================================

/**
 * 長押しからコンテキストメニューを表示
 */
function showTaskMenuFromLongPress(touchX, touchY, task) {
  // 既存のメニューを削除
  const existingMenu = document.querySelector('.task-context-menu');
  if (existingMenu) {
    existingMenu.remove();
  }

  // メニューを作成
  const menu = createTaskMenuElement(task);

  // メニューの位置を設定（タッチ位置の下に表示）
  menu.style.position = 'fixed';

  // 画面サイズを取得
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // メニューを一時的に表示して高さを取得
  menu.style.visibility = 'hidden';
  document.body.appendChild(menu);
  const menuHeight = menu.offsetHeight;
  const menuWidth = menu.offsetWidth;

  // 位置を計算（画面外に出ないように調整）
  let top = touchY + 10;
  let left = touchX - menuWidth / 2;

  // 下にはみ出る場合は上に表示
  if (top + menuHeight > windowHeight) {
    top = touchY - menuHeight - 10;
  }

  // 左にはみ出る場合
  if (left < 10) {
    left = 10;
  }

  // 右にはみ出る場合
  if (left + menuWidth > windowWidth - 10) {
    left = windowWidth - menuWidth - 10;
  }

  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;
  menu.style.visibility = 'visible';

  // メニュー外をタップで閉じる
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });

    // タッチイベントでも閉じる
    document.addEventListener('touchstart', function closeTouchMenu(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('touchstart', closeTouchMenu);
      }
    });
  }, 0);
}

/**
 * ボタンクリックからコンテキストメニューを表示
 */
function showTaskMenu(event, task) {
  // 既存のメニューを削除
  const existingMenu = document.querySelector('.task-context-menu');
  if (existingMenu) {
    existingMenu.remove();
  }

  // メニューを作成
  const menu = createTaskMenuElement(task);

  // メニューの位置を設定
  const rect = event.target.getBoundingClientRect();
  menu.style.position = 'fixed';
  menu.style.top = `${rect.bottom + 5}px`;
  menu.style.left = `${rect.left}px`;

  document.body.appendChild(menu);

  // メニュー外をクリックで閉じる
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 0);
}

/**
 * タスクメニュー要素を作成（共通関数）
 */
function createTaskMenuElement(task) {
  const menu = document.createElement('div');
  menu.className = 'task-context-menu';

  // 編集ボタン
  const editItem = document.createElement('div');
  editItem.className = 'menu-item';
  editItem.textContent = '✏️ 編集';
  editItem.addEventListener('click', () => {
    openEditModal(task.id);
    menu.remove();
  });
  menu.appendChild(editItem);

  // 移動ボタン
  const moveItem = document.createElement('div');
  moveItem.className = 'menu-item';
  moveItem.textContent = '📅 移動';
  moveItem.addEventListener('click', () => {
    showMoveDateMenu(task, menu);
  });
  menu.appendChild(moveItem);

  // 時間記録開始/停止ボタン
  const timerItem = document.createElement('div');
  timerItem.className = 'menu-item';
  if (task.isTimerRunning) {
    timerItem.textContent = '⏸️ 時間記録停止';
    timerItem.addEventListener('click', () => {
      stopTaskTimer(task.id);
      menu.remove();
      renderTasks();
    });
  } else {
    timerItem.textContent = '▶️ 時間記録開始';
    timerItem.addEventListener('click', () => {
      startTaskTimer(task.id);
      menu.remove();
      renderTasks();
    });
  }
  menu.appendChild(timerItem);

  // 複製ボタン
  const duplicateItem = document.createElement('div');
  duplicateItem.className = 'menu-item';
  duplicateItem.textContent = '📋 複製';
  duplicateItem.addEventListener('click', () => {
    duplicateTask(task.id);
    menu.remove();
    renderTasks();
  });
  menu.appendChild(duplicateItem);

  // 削除ボタン
  const deleteItem = document.createElement('div');
  deleteItem.className = 'menu-item delete-item';
  deleteItem.textContent = '🗑️ 削除';
  deleteItem.addEventListener('click', () => {
    if (confirm(`「${task.title}」を削除してもよろしいですか？`)) {
      deleteTask(task.id);
      menu.remove();
      renderTasks();
    }
  });
  menu.appendChild(deleteItem);

  return menu;
}

/**
 * 日付移動サブメニューを表示
 */
function showMoveDateMenu(task, parentMenu) {
  // サブメニューを作成
  const submenu = document.createElement('div');
  submenu.className = 'task-context-menu';
  submenu.style.position = 'fixed';

  // 親メニューの位置を基準に配置
  const parentRect = parentMenu.getBoundingClientRect();
  submenu.style.left = `${parentRect.left}px`;
  submenu.style.top = `${parentRect.top}px`;

  // 今日
  const todayItem = document.createElement('div');
  todayItem.className = 'menu-item';
  todayItem.textContent = '📅 今日';
  todayItem.addEventListener('click', () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    updateTask(task.id, { dueDate: today.toISOString() });
    parentMenu.remove();
    submenu.remove();
    renderTasks();
  });
  submenu.appendChild(todayItem);

  // 明日
  const tomorrowItem = document.createElement('div');
  tomorrowItem.className = 'menu-item';
  tomorrowItem.textContent = '📅 明日';
  tomorrowItem.addEventListener('click', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    updateTask(task.id, { dueDate: tomorrow.toISOString() });
    parentMenu.remove();
    submenu.remove();
    renderTasks();
  });
  submenu.appendChild(tomorrowItem);

  // 来週
  const nextWeekItem = document.createElement('div');
  nextWeekItem.className = 'menu-item';
  nextWeekItem.textContent = '📅 来週';
  nextWeekItem.addEventListener('click', () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(12, 0, 0, 0);
    updateTask(task.id, { dueDate: nextWeek.toISOString() });
    parentMenu.remove();
    submenu.remove();
    renderTasks();
  });
  submenu.appendChild(nextWeekItem);

  // 期限なし
  const noDateItem = document.createElement('div');
  noDateItem.className = 'menu-item';
  noDateItem.textContent = '📅 期限なし';
  noDateItem.addEventListener('click', () => {
    updateTask(task.id, { dueDate: null });
    parentMenu.remove();
    submenu.remove();
    renderTasks();
  });
  submenu.appendChild(noDateItem);

  // 戻る
  const backItem = document.createElement('div');
  backItem.className = 'menu-item';
  backItem.textContent = '← 戻る';
  backItem.addEventListener('click', () => {
    submenu.remove();
  });
  submenu.appendChild(backItem);

  // 親メニューを非表示にして、サブメニューを表示
  parentMenu.style.display = 'none';
  document.body.appendChild(submenu);

  // サブメニュー外をクリック/タッチで両方閉じる
  setTimeout(() => {
    const closeHandler = (e) => {
      if (!submenu.contains(e.target)) {
        submenu.remove();
        parentMenu.remove();
        document.removeEventListener('click', closeHandler);
        document.removeEventListener('touchstart', closeHandler);
      }
    };
    document.addEventListener('click', closeHandler);
    document.addEventListener('touchstart', closeHandler);
  }, 0);
}

// ========================================
// 複数選択モード
// ========================================

// 選択モードのトグル
function toggleSelectionMode() {
  isSelectionMode = !isSelectionMode;

  if (isSelectionMode) {
    // 選択モード開始
    selectedTaskIds.clear();
    document.body.classList.add('selection-mode');
    const toolbar = document.getElementById('bulk-actions-toolbar');
    if (toolbar) toolbar.style.display = 'flex';

    // 複数選択ボタンをアクティブ状態にする（旧UI）
    const bulkSelectToggleBtn = document.getElementById('bulk-select-toggle-btn');
    if (bulkSelectToggleBtn) bulkSelectToggleBtn.classList.add('active');

    // 複数選択ボタンをアクティブ状態にする（新UI）
    const newBulkSelectToggleBtn = document.getElementById('new-bulk-select-toggle-btn');
    if (newBulkSelectToggleBtn) newBulkSelectToggleBtn.classList.add('active');

    updateBulkActionsCount();
  } else {
    // 選択モード終了
    selectedTaskIds.clear();
    document.body.classList.remove('selection-mode');
    const toolbar = document.getElementById('bulk-actions-toolbar');
    if (toolbar) toolbar.style.display = 'none';

    // 複数選択ボタンを非アクティブ状態にする（旧UI）
    const bulkSelectToggleBtn = document.getElementById('bulk-select-toggle-btn');
    if (bulkSelectToggleBtn) bulkSelectToggleBtn.classList.remove('active');

    // 複数選択ボタンを非アクティブ状態にする（新UI）
    const newBulkSelectToggleBtn = document.getElementById('new-bulk-select-toggle-btn');
    if (newBulkSelectToggleBtn) newBulkSelectToggleBtn.classList.remove('active');
  }

  renderTasks();
}

// タスク選択のトグル
function toggleTaskSelection(taskId) {
  if (selectedTaskIds.has(taskId)) {
    selectedTaskIds.delete(taskId);
  } else {
    selectedTaskIds.add(taskId);
  }

  updateBulkActionsCount();

  // 選択状態を視覚的に更新
  const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
  if (taskElement) {
    taskElement.classList.toggle('selected', selectedTaskIds.has(taskId));
    const checkbox = taskElement.querySelector('.task-select-checkbox');
    if (checkbox) checkbox.checked = selectedTaskIds.has(taskId);
  }
}

// 選択数の更新
function updateBulkActionsCount() {
  const countEl = document.getElementById('bulk-selection-count');
  if (countEl) {
    countEl.textContent = `${selectedTaskIds.size}個選択中`;
  }
}

// 一括完了
function bulkCompleteActions() {
  if (selectedTaskIds.size === 0) return;

  selectedTaskIds.forEach(taskId => {
    const task = getTaskById(taskId);
    if (task && !task.isCompleted) {
      updateTask(taskId, { isCompleted: true });
    }
  });

  toggleSelectionMode(); // 選択モードを終了
}

// 一括削除
function bulkDeleteTasks() {
  if (selectedTaskIds.size === 0) return;

  if (!confirm(`${selectedTaskIds.size}個のタスクを削除してもよろしいですか？`)) {
    return;
  }

  selectedTaskIds.forEach(taskId => {
    deleteTask(taskId);
  });

  toggleSelectionMode(); // 選択モードを終了
}

// 全選択/全解除
function bulkSelectAll() {
  // 現在表示されているすべてのタスクを取得
  const allVisibleTaskIds = [];
  // 旧カード（.task-item）と新カード（.new-task-card）の両方を選択
  document.querySelectorAll('.task-item:not(.completed), .new-task-card:not(.completed)').forEach(el => {
    const taskId = el.dataset.taskId;
    if (taskId) {
      allVisibleTaskIds.push(taskId);
    }
  });

  // すべて選択されている場合は全解除、そうでない場合は全選択
  if (selectedTaskIds.size === allVisibleTaskIds.length && allVisibleTaskIds.length > 0) {
    // 全解除
    selectedTaskIds.clear();
  } else {
    // 全選択
    selectedTaskIds.clear();
    allVisibleTaskIds.forEach(taskId => {
      selectedTaskIds.add(taskId);
    });
  }

  updateBulkActionsCount();
  renderTasks();
}

// 一括日付変更
function bulkChangeDateTasks(event) {
  if (selectedTaskIds.size === 0) {
    alert('タスクを選択してください');
    return;
  }

  // 既存のメニューを削除
  const existingMenu = document.querySelector('.bulk-date-menu');
  if (existingMenu) {
    existingMenu.remove();
    return; // トグル動作
  }

  // メニューを作成
  const menu = document.createElement('div');
  menu.className = 'task-context-menu bulk-date-menu';
  menu.style.position = 'fixed';

  // ボタンの位置を基準に配置
  const rect = event.target.closest('button').getBoundingClientRect();
  menu.style.top = `${rect.bottom + 5}px`;
  menu.style.left = `${rect.left}px`;

  // 今日
  const todayItem = document.createElement('div');
  todayItem.className = 'menu-item';
  todayItem.textContent = '📅 今日';
  todayItem.addEventListener('click', () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    bulkUpdateDate(today.toISOString());
    menu.remove();
  });
  menu.appendChild(todayItem);

  // 明日
  const tomorrowItem = document.createElement('div');
  tomorrowItem.className = 'menu-item';
  tomorrowItem.textContent = '📅 明日';
  tomorrowItem.addEventListener('click', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    bulkUpdateDate(tomorrow.toISOString());
    menu.remove();
  });
  menu.appendChild(tomorrowItem);

  // 来週
  const nextWeekItem = document.createElement('div');
  nextWeekItem.className = 'menu-item';
  nextWeekItem.textContent = '📅 来週';
  nextWeekItem.addEventListener('click', () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(12, 0, 0, 0);
    bulkUpdateDate(nextWeek.toISOString());
    menu.remove();
  });
  menu.appendChild(nextWeekItem);

  // 期限なし
  const noDateItem = document.createElement('div');
  noDateItem.className = 'menu-item';
  noDateItem.textContent = '📅 期限なし';
  noDateItem.addEventListener('click', () => {
    bulkUpdateDate(null);
    menu.remove();
  });
  menu.appendChild(noDateItem);

  document.body.appendChild(menu);

  // メニュー外をクリックで閉じる
  setTimeout(() => {
    const closeHandler = (e) => {
      if (!menu.contains(e.target) && !event.target.closest('button').contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeHandler);
        document.removeEventListener('touchstart', closeHandler);
      }
    };
    document.addEventListener('click', closeHandler);
    document.addEventListener('touchstart', closeHandler);
  }, 0);
}

// 日付の一括更新
function bulkUpdateDate(dueDate) {
  selectedTaskIds.forEach(taskId => {
    updateTask(taskId, { dueDate: dueDate });
  });

  // 振動フィードバック
  if (navigator.vibrate) {
    navigator.vibrate(30);
  }

  renderTasks();
}

// 一括優先度変更
function bulkChangePriorityTasks(event) {
  if (selectedTaskIds.size === 0) {
    alert('タスクを選択してください');
    return;
  }

  // 既存のメニューを削除
  const existingMenu = document.querySelector('.bulk-priority-menu');
  if (existingMenu) {
    existingMenu.remove();
    return; // トグル動作
  }

  // メニューを作成
  const menu = document.createElement('div');
  menu.className = 'task-context-menu bulk-priority-menu';
  menu.style.position = 'fixed';

  // ボタンの位置を基準に配置
  const rect = event.target.closest('button').getBoundingClientRect();
  menu.style.top = `${rect.bottom + 5}px`;
  menu.style.left = `${rect.left}px`;

  // 緊急フラグ
  const urgentItem = document.createElement('div');
  urgentItem.className = 'menu-item';
  urgentItem.textContent = '🚨 緊急';
  urgentItem.addEventListener('click', () => {
    bulkUpdatePriority({ urgent: true });
    menu.remove();
  });
  menu.appendChild(urgentItem);

  // 優先度: 高
  const highItem = document.createElement('div');
  highItem.className = 'menu-item';
  highItem.textContent = '⬆️ 優先度: 高';
  highItem.addEventListener('click', () => {
    bulkUpdatePriority({ priority: 'high', urgent: false });
    menu.remove();
  });
  menu.appendChild(highItem);

  // 優先度: 中
  const mediumItem = document.createElement('div');
  mediumItem.className = 'menu-item';
  mediumItem.textContent = '➡️ 優先度: 中';
  mediumItem.addEventListener('click', () => {
    bulkUpdatePriority({ priority: 'medium', urgent: false });
    menu.remove();
  });
  menu.appendChild(mediumItem);

  // 優先度: 低
  const lowItem = document.createElement('div');
  lowItem.className = 'menu-item';
  lowItem.textContent = '⬇️ 優先度: 低';
  lowItem.addEventListener('click', () => {
    bulkUpdatePriority({ priority: 'low', urgent: false });
    menu.remove();
  });
  menu.appendChild(lowItem);

  // 優先度なし
  const noPriorityItem = document.createElement('div');
  noPriorityItem.className = 'menu-item';
  noPriorityItem.textContent = '❌ 優先度なし';
  noPriorityItem.addEventListener('click', () => {
    bulkUpdatePriority({ priority: '', urgent: false });
    menu.remove();
  });
  menu.appendChild(noPriorityItem);

  document.body.appendChild(menu);

  // メニュー外をクリックで閉じる
  setTimeout(() => {
    const closeHandler = (e) => {
      if (!menu.contains(e.target) && !event.target.closest('button').contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeHandler);
        document.removeEventListener('touchstart', closeHandler);
      }
    };
    document.addEventListener('click', closeHandler);
    document.addEventListener('touchstart', closeHandler);
  }, 0);
}

// 優先度の一括更新
function bulkUpdatePriority(updates) {
  selectedTaskIds.forEach(taskId => {
    updateTask(taskId, updates);
  });

  // 振動フィードバック
  if (navigator.vibrate) {
    navigator.vibrate(30);
  }

  renderTasks();
}

// ========================================
// クイックアクション
// ========================================

/**
 * 今日のタスクを一括完了
 */
function quickCompleteToday() {
  const tasks = getTasks();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let completedCount = 0;

  tasks.forEach(task => {
    if (!task.isCompleted && task.dueDate) {
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);

      if (taskDate.getTime() === today.getTime()) {
        updateTask(task.id, { isCompleted: true });
        completedCount++;
      }
    }
  });

  if (completedCount > 0) {
    alert(`今日のタスク ${completedCount}個を完了しました`);
    renderTasks();

    // 振動フィードバック
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  } else {
    alert('今日の未完了タスクはありません');
  }
}

/**
 * 期限切れタスクを明日に移動
 */
function quickMoveOverdueToTomorrow() {
  const tasks = getTasks();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12, 0, 0, 0);

  let movedCount = 0;

  tasks.forEach(task => {
    if (!task.isCompleted && task.dueDate) {
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);

      if (taskDate.getTime() < today.getTime()) {
        updateTask(task.id, { dueDate: tomorrow.toISOString() });
        movedCount++;
      }
    }
  });

  if (movedCount > 0) {
    alert(`期限切れタスク ${movedCount}個を明日に移動しました`);
    renderTasks();

    // 振動フィードバック
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  } else {
    alert('期限切れのタスクはありません');
  }
}

/**
 * 完了タスクをアーカイブ（削除）
 */
function quickArchiveCompleted() {
  const tasks = getTasks();
  const completedTasks = tasks.filter(t => t.isCompleted);

  if (completedTasks.length === 0) {
    alert('完了済みのタスクはありません');
    return;
  }

  if (!confirm(`完了済みタスク ${completedTasks.length}個をアーカイブしてもよろしいですか？\n（ゴミ箱に移動されます）`)) {
    return;
  }

  let archivedCount = 0;
  completedTasks.forEach(task => {
    deleteTask(task.id);
    archivedCount++;
  });

  alert(`${archivedCount}個のタスクをアーカイブしました`);
  renderTasks();

  // 振動フィードバック
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
}

/**
 * 今日の未完了タスクを明日にコピー
 */
function quickCopyTodayToTomorrow() {
  const tasks = getTasks();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12, 0, 0, 0);

  const todayTasks = tasks.filter(task => {
    if (task.isCompleted || !task.dueDate) return false;
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });

  if (todayTasks.length === 0) {
    alert('今日の未完了タスクはありません');
    return;
  }

  if (!confirm(`今日の未完了タスク ${todayTasks.length}個を明日にコピーしてもよろしいですか？`)) {
    return;
  }

  const allTasks = getTasks();
  const now = new Date().toISOString();

  todayTasks.forEach(task => {
    const copiedTask = {
      ...task,
      id: generateUUID(),
      dueDate: tomorrow.toISOString(),
      isCompleted: false,
      createdAt: now,
      updatedAt: now
    };
    allTasks.unshift(copiedTask);
  });

  saveTasks(allTasks);
  alert(`${todayTasks.length}個のタスクを明日にコピーしました`);
  renderTasks();

  // 振動フィードバック
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
}

// ========================================
// クイック入力バー＆完了済みセクション（新UI）
// ========================================

/**
 * クイック入力バーを初期化（新UI用）
 */
function initQuickInput() {
  // Note: クイック入力フォームのイベントリスナーはevents.jsで既に設定されているため、ここでは何もしない
  // events.js の initEventListeners() 内で quickAddForm の submit イベントを設定している
  console.log('initQuickInput: Quick input already initialized in events.js');
}

/**
 * クイック入力を送信
 */
function submitQuickInput() {
  const quickInput = document.getElementById('new-quick-input');
  const title = quickInput ? quickInput.value.trim() : '';

  if (!title) {
    alert('タスク名を入力してください');
    return;
  }

  // 今日の日付を期限として設定
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString();

  // タスク作成
  createTask(title, '', todayISO, null);

  // 入力フィールドをクリア
  if (quickInput) {
    quickInput.value = '';
    quickInput.focus();
  }

  // 振動フィードバック
  if (navigator.vibrate) {
    navigator.vibrate(30);
  }

  // 再レンダリング
  renderTasks();
}

/**
 * 完了済みセクションのトグル初期化（新UI用）
 */
function initCompletedToggle() {
  // Note: 完了済みセクションのトグルのイベントリスナーはevents.jsで既に設定されているため、ここでは何もしない
  // events.js の initEventListeners() 内で completedToggle のクリックイベントを設定している
  console.log('initCompletedToggle: Completed toggle already initialized in events.js');
}
