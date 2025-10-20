// ========================================
// 検索・フィルター・ソート機能
// ========================================

// グローバル変数
let searchKeyword = '';
let activeFilters = new Set();
let currentSort = 'time'; // デフォルトはtime順
let searchHistory = [];

// ========================================
// 初期化
// ========================================

function initSearchFilter() {
  // LocalStorageから設定を復元
  loadSearchFilterSettings();

  // イベントリスナーの設定
  setupSearchListeners();
  setupFilterListeners();
  setupSortListeners();
  setupModalListeners();

  // UIの初期状態を反映
  updateSortUI();
  updateFilterUI();
}

// 設定の読み込み
function loadSearchFilterSettings() {
  try {
    // ソート順の復元
    const savedSort = localStorage.getItem('nowtask_sort');
    if (savedSort) {
      currentSort = savedSort;
    }

    // 検索履歴の復元
    const savedHistory = localStorage.getItem('nowtask_search_history');
    if (savedHistory) {
      searchHistory = JSON.parse(savedHistory);
    }
  } catch (e) {
    console.warn('Failed to load search filter settings:', e);
  }
}

// 設定の保存
function saveSearchFilterSettings() {
  try {
    localStorage.setItem('nowtask_sort', currentSort);
    localStorage.setItem('nowtask_search_history', JSON.stringify(searchHistory));
  } catch (e) {
    console.warn('Failed to save search filter settings:', e);
  }
}

// ========================================
// 検索機能
// ========================================

function setupSearchListeners() {
  const searchInput = document.getElementById('search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const searchHistoryDiv = document.getElementById('search-history');

  if (!searchInput) return;

  // リアルタイム検索
  searchInput.addEventListener('input', (e) => {
    searchKeyword = e.target.value.trim();

    // クリアボタンの表示/非表示
    if (searchKeyword) {
      searchClearBtn.style.display = 'flex';
    } else {
      searchClearBtn.style.display = 'none';
    }

    // タスクを再レンダリング
    if (typeof renderTasks === 'function') {
      renderTasks();
    }
  });

  // フォーカス時に検索履歴を表示
  searchInput.addEventListener('focus', () => {
    if (searchHistory.length > 0 && !searchKeyword) {
      renderSearchHistory();
      searchHistoryDiv.style.display = 'block';
    }
  });

  // フォーカスが外れたら検索履歴を隠す（少し遅延）
  searchInput.addEventListener('blur', () => {
    setTimeout(() => {
      searchHistoryDiv.style.display = 'none';
    }, 200);
  });

  // クリアボタンのクリック
  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchKeyword = '';
      searchClearBtn.style.display = 'none';

      if (typeof renderTasks === 'function') {
        renderTasks();
      }
    });
  }

  // Enterキーで検索履歴に追加
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && searchKeyword) {
      addToSearchHistory(searchKeyword);
    }
  });
}

// 検索履歴に追加
function addToSearchHistory(keyword) {
  // 既存の履歴から削除（重複を避ける）
  searchHistory = searchHistory.filter(item => item !== keyword);

  // 先頭に追加
  searchHistory.unshift(keyword);

  // 最大10件まで保持
  searchHistory = searchHistory.slice(0, 10);

  // 保存
  saveSearchFilterSettings();
}

// 検索履歴の表示
function renderSearchHistory() {
  const searchHistoryDiv = document.getElementById('search-history');
  if (!searchHistoryDiv) return;

  searchHistoryDiv.innerHTML = '';

  searchHistory.forEach(keyword => {
    const item = document.createElement('div');
    item.className = 'search-history-item';

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('width', '16');
    icon.setAttribute('height', '16');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '2');
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '10');
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', '12 6 12 12 16 14');
    icon.appendChild(circle);
    icon.appendChild(polyline);

    const text = document.createTextNode(keyword);

    item.appendChild(icon);
    item.appendChild(text);

    item.addEventListener('click', () => {
      document.getElementById('search-input').value = keyword;
      searchKeyword = keyword;
      document.getElementById('search-clear-btn').style.display = 'flex';
      searchHistoryDiv.style.display = 'none';

      if (typeof renderTasks === 'function') {
        renderTasks();
      }
    });

    searchHistoryDiv.appendChild(item);
  });
}

// 検索結果のハイライト表示
function highlightSearchResult(text, keyword) {
  if (!keyword || !text) return text;

  const regex = new RegExp(`(${escapeRegex(keyword)})`, 'gi');
  return text.replace(regex, '<span class="search-highlight">$1</span>');
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ========================================
// フィルター機能
// ========================================

function setupFilterListeners() {
  // 全てのフィルターボタン
  const filterButtons = document.querySelectorAll('.filter-btn[data-filter]');

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filterType = button.getAttribute('data-filter');

      if (activeFilters.has(filterType)) {
        // 既にアクティブなら解除
        activeFilters.delete(filterType);
        button.classList.remove('active');
      } else {
        // アクティブでなければ追加
        activeFilters.add(filterType);
        button.classList.add('active');
      }

      // タスクを再レンダリング
      if (typeof renderTasks === 'function') {
        renderTasks();
      }
    });
  });

  // クリアボタン
  const clearButton = document.getElementById('filter-clear');
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      clearAllFilters();

      if (typeof renderTasks === 'function') {
        renderTasks();
      }
    });
  }
}

function clearAllFilters() {
  activeFilters.clear();
  updateFilterUI();
}

function updateFilterUI() {
  const filterButtons = document.querySelectorAll('.filter-btn[data-filter]');
  filterButtons.forEach(button => {
    const filterType = button.getAttribute('data-filter');
    if (activeFilters.has(filterType)) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
}

// タスクがフィルター条件に一致するかチェック
function matchesFilters(task) {
  // フィルターが何もない場合はすべて表示
  if (activeFilters.size === 0) return true;

  // 各フィルターをチェック
  for (const filter of activeFilters) {
    if (!matchesFilter(task, filter)) {
      return false; // 1つでも一致しなければfalse
    }
  }

  return true; // すべてのフィルターに一致
}

function matchesFilter(task, filter) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  switch (filter) {
    // 優先度フィルター
    case 'urgent':
      return task.urgent === true;
    case 'priority-high':
      return task.priority === 'high';
    case 'priority-medium':
      return task.priority === 'medium';
    case 'priority-low':
      return task.priority === 'low';

    // 期限フィルター
    case 'today':
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();

    case 'tomorrow':
      if (!task.dueDate) return false;
      const taskDateTmr = new Date(task.dueDate);
      taskDateTmr.setHours(0, 0, 0, 0);
      return taskDateTmr.getTime() === tomorrow.getTime();

    case 'this-week':
      if (!task.dueDate) return false;
      const taskDateWeek = new Date(task.dueDate);
      taskDateWeek.setHours(0, 0, 0, 0);
      return taskDateWeek >= today && taskDateWeek < weekEnd;

    case 'overdue':
      if (!task.dueDate || task.isCompleted) return false;
      const taskDateOverdue = new Date(task.dueDate);
      taskDateOverdue.setHours(0, 0, 0, 0);
      return taskDateOverdue < today;

    // 状態フィルター
    case 'incomplete':
      return !task.isCompleted;

    case 'completed':
      return task.isCompleted === true;

    case 'routine':
      return task.routineId !== undefined && task.routineId !== null;

    default:
      return true;
  }
}

// ========================================
// ソート機能
// ========================================

function setupSortListeners() {
  const sortSelect = document.getElementById('sort-select');

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;

      // 設定を保存
      saveSearchFilterSettings();

      // タスクを再レンダリング
      if (typeof renderTasks === 'function') {
        renderTasks();
      }
    });
  }
}

function updateSortUI() {
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.value = currentSort;
  }
}

// タスクリストのソート
function sortTasks(tasks) {
  const sorted = [...tasks]; // コピーを作成

  switch (currentSort) {
    case 'time': // 期限が近い順
      sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
      break;

    case 'time-desc': // 期限が遠い順
      sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return -1;
        if (!b.dueDate) return 1;
        return new Date(b.dueDate) - new Date(a.dueDate);
      });
      break;

    case 'created': // 追加順（新しい順）
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;

    case 'created-desc': // 追加順（古い順）
      sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      break;

    case 'priority': // 優先順位順
      const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3, '': 4 };
      sorted.sort((a, b) => {
        // 緊急フラグが優先
        if (a.urgent && !b.urgent) return -1;
        if (!a.urgent && b.urgent) return 1;

        // 次に優先順位
        const aPriority = priorityOrder[a.priority || ''];
        const bPriority = priorityOrder[b.priority || ''];
        return aPriority - bPriority;
      });
      break;

    case 'title': // タスク名順（A→Z）
      sorted.sort((a, b) => {
        const titleA = (a.title || '').toLowerCase();
        const titleB = (b.title || '').toLowerCase();
        return titleA.localeCompare(titleB, 'ja');
      });
      break;

    default:
      // デフォルトは時間順
      sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
  }

  return sorted;
}

// ========================================
// 検索・フィルター・ソートの統合処理
// ========================================

// タスクリストに検索・フィルター・ソートを適用
function applySearchFilterSort(tasks) {
  let filteredTasks = tasks;

  // 1. 検索でフィルター
  if (searchKeyword) {
    filteredTasks = filteredTasks.filter(task => {
      const title = (task.title || '').toLowerCase();
      const memo = (task.memo || '').toLowerCase();
      const keyword = searchKeyword.toLowerCase();
      return title.includes(keyword) || memo.includes(keyword);
    });
  }

  // 2. フィルターを適用
  if (activeFilters.size > 0) {
    filteredTasks = filteredTasks.filter(task => matchesFilters(task));
  }

  // 3. ソート
  filteredTasks = sortTasks(filteredTasks);

  return filteredTasks;
}

// ========================================
// モーダル機能
// ========================================

function setupModalListeners() {
  const modal = document.getElementById('search-filter-modal');
  const closeBtn = document.getElementById('close-search-filter-btn');
  const applyBtn = document.getElementById('search-filter-apply-btn');
  const clearAllBtn = document.getElementById('search-filter-clear-all-btn');
  const modalSearchInput = document.getElementById('modal-search-input');
  const modalSearchClearBtn = document.getElementById('modal-search-clear-btn');
  const modalSortSelect = document.getElementById('modal-sort-select');

  // モーダルを閉じる
  if (closeBtn) {
    closeBtn.addEventListener('click', closeSearchFilterModal);
  }

  // モーダル外クリックで閉じる
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeSearchFilterModal();
      }
    });
  }

  // 適用ボタン
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      closeSearchFilterModal();
      if (typeof renderTasks === 'function') {
        renderTasks();
      }
    });
  }

  // すべてクリア
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      // 検索キーワードクリア
      searchKeyword = '';
      if (modalSearchInput) {
        modalSearchInput.value = '';
        modalSearchClearBtn.style.display = 'none';
      }

      // フィルタークリア
      activeFilters.clear();
      updateModalFilterUI();

      // ソートをデフォルトに戻す
      currentSort = 'time';
      if (modalSortSelect) {
        modalSortSelect.value = 'time';
      }

      // タスクを再レンダリング
      if (typeof renderTasks === 'function') {
        renderTasks();
      }
    });
  }

  // モーダル内検索入力
  if (modalSearchInput) {
    modalSearchInput.addEventListener('input', (e) => {
      searchKeyword = e.target.value.trim();

      if (searchKeyword) {
        modalSearchClearBtn.style.display = 'block';
      } else {
        modalSearchClearBtn.style.display = 'none';
      }
    });

    // Enterキーで検索履歴に追加
    modalSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && searchKeyword) {
        addToSearchHistory(searchKeyword);
      }
    });
  }

  // モーダル内検索クリアボタン
  if (modalSearchClearBtn) {
    modalSearchClearBtn.addEventListener('click', () => {
      modalSearchInput.value = '';
      searchKeyword = '';
      modalSearchClearBtn.style.display = 'none';
    });
  }

  // モーダル内ソート
  if (modalSortSelect) {
    modalSortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      saveSearchFilterSettings();
    });
  }

  // モーダル内フィルターボタン
  const modalFilterButtons = modal.querySelectorAll('.filter-btn[data-filter]');
  modalFilterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filterType = button.getAttribute('data-filter');

      if (activeFilters.has(filterType)) {
        activeFilters.delete(filterType);
        button.classList.remove('active');
      } else {
        activeFilters.add(filterType);
        button.classList.add('active');
      }
    });
  });
}

function openSearchFilterModal() {
  const modal = document.getElementById('search-filter-modal');
  const modalSearchInput = document.getElementById('modal-search-input');
  const modalSearchClearBtn = document.getElementById('modal-search-clear-btn');
  const modalSortSelect = document.getElementById('modal-sort-select');

  if (!modal) return;

  // 現在の設定をモーダルに反映
  if (modalSearchInput) {
    modalSearchInput.value = searchKeyword;
    modalSearchClearBtn.style.display = searchKeyword ? 'block' : 'none';
  }

  if (modalSortSelect) {
    modalSortSelect.value = currentSort;
  }

  updateModalFilterUI();

  // モーダルを表示
  modal.style.display = 'flex';
}

function closeSearchFilterModal() {
  const modal = document.getElementById('search-filter-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function updateModalFilterUI() {
  const modal = document.getElementById('search-filter-modal');
  if (!modal) return;

  const filterButtons = modal.querySelectorAll('.filter-btn[data-filter]');
  filterButtons.forEach(button => {
    const filterType = button.getAttribute('data-filter');
    if (activeFilters.has(filterType)) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
}

// ========================================
// エクスポート（グローバル変数として公開）
// ========================================

// グローバルスコープに公開
window.searchFilter = {
  init: initSearchFilter,
  apply: applySearchFilterSort,
  highlightSearchResult: highlightSearchResult,
  getSearchKeyword: () => searchKeyword,
  getActiveFilters: () => activeFilters,
  getCurrentSort: () => currentSort
};

// モーダルを開く関数をグローバルに公開
window.openSearchFilterModal = openSearchFilterModal;
