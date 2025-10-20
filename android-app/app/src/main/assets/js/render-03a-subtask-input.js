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

