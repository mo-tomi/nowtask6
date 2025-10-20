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
