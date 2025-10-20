// ========================================
// フェーズ 6.5: 入力体験の改善
// ========================================

/**
 * 自然言語で日時を解析
 * 例: "明日 14時", "来週月曜", "3日後 15:30", "今週末"
 */
function parseNaturalDatetime(input) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let parsedDate = null;
  let parsedTime = null;

  // テキストを正規化
  const normalized = input.toLowerCase().trim();

  // ===== 日付パターン解析 =====

  // "今日" パターン
  if (normalized.includes('今日')) {
    parsedDate = new Date(today);
  }
  // "明日" パターン
  else if (normalized.includes('明日')) {
    parsedDate = new Date(today);
    parsedDate.setDate(parsedDate.getDate() + 1);
  }
  // "昨日" パターン
  else if (normalized.includes('昨日')) {
    parsedDate = new Date(today);
    parsedDate.setDate(parsedDate.getDate() - 1);
  }
  // "来週" パターン (月曜から)
  else if (normalized.includes('来週')) {
    parsedDate = new Date(today);
    // 来週の月曜を計算
    const dayOfWeek = parsedDate.getDay();
    const daysUntilMonday = (8 - dayOfWeek) % 7 || 1;
    parsedDate.setDate(parsedDate.getDate() + daysUntilMonday + 6);
  }
  // "今週末" または "週末" パターン (土曜)
  else if (normalized.includes('今週末') || (normalized.includes('週末') && !normalized.includes('来週'))) {
    parsedDate = new Date(today);
    const dayOfWeek = parsedDate.getDay();
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 6;
    parsedDate.setDate(parsedDate.getDate() + daysUntilSaturday);
  }
  // "来週末" パターン
  else if (normalized.includes('来週末')) {
    parsedDate = new Date(today);
    const dayOfWeek = parsedDate.getDay();
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 6;
    parsedDate.setDate(parsedDate.getDate() + daysUntilSaturday + 7);
  }
  // "N日後" パターン
  else {
    const daysMatch = normalized.match(/(\d+)\s*(?:日|日後|days?)/);
    if (daysMatch) {
      parsedDate = new Date(today);
      parsedDate.setDate(parsedDate.getDate() + parseInt(daysMatch[1]));
    }
  }

  // ===== 曜日パターン解析 =====

  const weekdayMap = {
    '月': 1, '火': 2, '水': 3, '木': 4, '金': 5, '土': 6, '日': 0,
    'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6, 'sun': 0
  };

  for (const [day, dayNum] of Object.entries(weekdayMap)) {
    if (normalized.includes(day) && !parsedDate) {
      // 曜日指定 （例：「来週月曜」「月曜」）
      parsedDate = new Date(today);

      // "来週" 付き
      if (normalized.includes('来週')) {
        // 来週の指定曜日
        const weekPlus = 7;
        const currentDay = parsedDate.getDay();
        let daysAhead = dayNum - currentDay;
        if (daysAhead <= 0) daysAhead += 7;
        parsedDate.setDate(parsedDate.getDate() + daysAhead + weekPlus);
      } else {
        // 今週の指定曜日（過去になる場合は来週）
        const currentDay = parsedDate.getDay();
        let daysAhead = dayNum - currentDay;
        if (daysAhead <= 0) daysAhead += 7;
        parsedDate.setDate(parsedDate.getDate() + daysAhead);
      }
      break;
    }
  }

  // ===== 時刻パターン解析 =====

  // "HH:MM" または "HH時MM分" パターン
  const timeMatch = normalized.match(/(\d{1,2})\s*[:時]\s*(\d{0,2})/);
  if (timeMatch) {
    const hour = parseInt(timeMatch[1]);
    const minute = parseInt(timeMatch[2]) || 0;

    // 有効な時刻チェック
    if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
      parsedTime = {
        hour: hour,
        minute: minute
      };
    }
  }
  // "N時" パターン（分なし）
  else {
    const hourMatch = normalized.match(/(\d{1,2})\s*時(?!\d)/);
    if (hourMatch) {
      const hour = parseInt(hourMatch[1]);
      if (hour >= 0 && hour < 24) {
        parsedTime = {
          hour: hour,
          minute: 0
        };
      }
    }
  }

  // ===== 期限日の決定 =====

  if (!parsedDate) {
    // パターンマッチしなかった場合は null を返す
    return null;
  }

  parsedDate.setHours(parsedTime?.hour || 12, parsedTime?.minute || 0, 0, 0);

  return {
    dueDate: parsedDate.toISOString(),
    startTime: parsedTime ? `${String(parsedTime.hour).padStart(2, '0')}:${String(parsedTime.minute).padStart(2, '0')}` : null,
    endTime: null,
    duration: null
  };
}

/**
 * 自然言語入力を処理してクイック入力フォームに反映
 */
function processNaturalInput(input) {
  // "明日 14時 買い物" → {date: tomorrow, time: 14:00, title: "買い物"}

  // 日時を抽出
  const datetimeResult = parseNaturalDatetime(input);

  if (datetimeResult && datetimeResult.dueDate) {
    // 日付と時刻を抽出した場合、日付フィールドを更新
    const dateStr = datetimeResult.dueDate.split('T')[0];
    const quickDateInput = document.getElementById('quick-add-date');
    if (quickDateInput) {
      quickDateInput.value = dateStr;

      // 日付ボタンに「has-date」クラスを追加
      const quickDateBtn = document.getElementById('quick-date-btn');
      if (quickDateBtn) {
        quickDateBtn.classList.add('has-date');
      }
    }

    // 開始時刻を設定（モーダルの場合）
    if (datetimeResult.startTime) {
      const taskStartTime = document.getElementById('task-start-time');
      if (taskStartTime) {
        taskStartTime.value = datetimeResult.startTime;
      }
    }

    // 日時部分をタスク名から削除
    let taskTitle = input;
    // 日付部分を削除
    taskTitle = taskTitle.replace(/明日|今日|昨日|来週|今週末|来週末|(\d+)日(?:後)?|(\d+)\s*[:時].*?(?:分)?/g, '').trim();

    return {
      hasDatetime: true,
      taskTitle: taskTitle || input,
      dueDate: datetimeResult.dueDate,
      startTime: datetimeResult.startTime
    };
  }

  return {
    hasDatetime: false,
    taskTitle: input,
    dueDate: null,
    startTime: null
  };
}

/**
 * 定型文テンプレート（オートコンプリート）
 */
const TEMPLATE_SNIPPETS = [
  { text: '買い物', memo: '', duration: 30 },
  { text: '会議準備', memo: '', duration: 60 },
  { text: 'メール確認', memo: '', duration: 15 },
  { text: 'コード レビュー', memo: '', duration: 90 },
  { text: 'ドキュメント作成', memo: '', duration: 120 },
  { text: 'チーム会議', memo: '', duration: 45 },
  { text: 'ランチ', memo: '', duration: 60 },
  { text: '運動', memo: '', duration: 45 },
  { text: '読書', memo: '', duration: 30 },
  { text: '掃除', memo: '', duration: 30 }
];

/**
 * テンプレート補完を提案（マッチするテンプレート）
 */
function getTemplateCompletions(input) {
  if (!input || input.length < 2) {
    return [];
  }

  const normalized = input.toLowerCase();
  return TEMPLATE_SNIPPETS.filter(template =>
    template.text.toLowerCase().includes(normalized) ||
    normalized.includes(template.text.toLowerCase())
  ).slice(0, 5); // 最大5件
}

/**
 * オートコンプリート UI を更新
 */
function updateAutocompleteUI(input) {
  const completions = getTemplateCompletions(input);

  // オートコンプリート表示エリアが なければ作成
  let autocompleteContainer = document.getElementById('input-autocomplete-container');
  if (!autocompleteContainer) {
    autocompleteContainer = document.createElement('div');
    autocompleteContainer.id = 'input-autocomplete-container';
    autocompleteContainer.className = 'input-autocomplete-container';

    const quickInputWrapper = document.querySelector('.quick-input-wrapper');
    if (quickInputWrapper) {
      quickInputWrapper.appendChild(autocompleteContainer);
    }
  }

  if (completions.length === 0) {
    autocompleteContainer.innerHTML = '';
    autocompleteContainer.style.display = 'none';
    return;
  }

  // オートコンプリート項目を表示
  autocompleteContainer.innerHTML = completions.map(completion => `
    <div class="autocomplete-item" onclick="applyTemplate(this)">
      <strong>${escapeHtml(completion.text)}</strong>
      ${completion.duration ? `<span class="duration">${completion.duration}分</span>` : ''}
    </div>
  `).join('');

  autocompleteContainer.style.display = 'block';
}

/**
 * テンプレートを適用
 */
function applyTemplate(element) {
  const templateText = element.querySelector('strong').textContent;
  const quickInput = document.getElementById('quick-add-input');
  if (quickInput) {
    quickInput.value = templateText;
    quickInput.focus();
  }

  const autocompleteContainer = document.getElementById('input-autocomplete-container');
  if (autocompleteContainer) {
    autocompleteContainer.innerHTML = '';
    autocompleteContainer.style.display = 'none';
  }
}

/**
 * HTML特殊文字をエスケープ
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * 絵文字ピッカー（シンプル版）
 */
const COMMON_EMOJIS = [
  '🎯', '📝', '✅', '⏰', '📅', '💼', '🚀', '📊', '💡', '🎨',
  '🔧', '🐛', '📖', '🎓', '💬', '🌟', '🎉', '📞', '✉️', '🗂️'
];

/**
 * 絵文字ピッカー UI を表示
 */
function showEmojiPicker() {
  let emojiContainer = document.getElementById('emoji-picker-container');
  if (!emojiContainer) {
    emojiContainer = document.createElement('div');
    emojiContainer.id = 'emoji-picker-container';
    emojiContainer.className = 'emoji-picker-container';
    emojiContainer.innerHTML = `
      <div class="emoji-picker-header">
        <span>よく使う絵文字</span>
        <button type="button" class="emoji-picker-close">&times;</button>
      </div>
      <div class="emoji-picker-grid">
        ${COMMON_EMOJIS.map(emoji => `
          <button type="button" class="emoji-item" onclick="insertEmoji(this)">${emoji}</button>
        `).join('')}
      </div>
    `;

    const quickInputWrapper = document.querySelector('.quick-input-wrapper');
    if (quickInputWrapper) {
      quickInputWrapper.appendChild(emojiContainer);
    }
  }

  const isVisible = emojiContainer.style.display === 'block';
  emojiContainer.style.display = isVisible ? 'none' : 'block';

  // 閉じるボタン
  const closeBtn = emojiContainer.querySelector('.emoji-picker-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      emojiContainer.style.display = 'none';
    });
  }
}

/**
 * 絵文字をタスク名に挿入
 */
function insertEmoji(element) {
  const emoji = element.textContent;
  const quickInput = document.getElementById('quick-add-input');
  if (quickInput) {
    const start = quickInput.selectionStart;
    const end = quickInput.selectionEnd;
    const text = quickInput.value;
    quickInput.value = text.substring(0, start) + emoji + text.substring(end);
    quickInput.selectionStart = quickInput.selectionEnd = start + emoji.length;
    quickInput.focus();
  }
}

/**
 * キーボード表示時の画面調整
 */
function setupKeyboardHandling() {
  const quickAddForm = document.getElementById('quick-add-form');
  const quickInput = document.getElementById('quick-add-input');

  if (!quickAddForm || !quickInput) return;

  quickInput.addEventListener('focus', () => {
    // キーボード表示時、クイック入力フォームをスクロール位置に持ってくる
    setTimeout(() => {
      quickAddForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 300);
  });

  quickInput.addEventListener('blur', () => {
    // オートコンプリートを非表示
    const autocompleteContainer = document.getElementById('input-autocomplete-container');
    if (autocompleteContainer) {
      autocompleteContainer.style.display = 'none';
    }
  });
}

/**
 * 初期化
 */
function initInputExperience() {
  const quickInput = document.getElementById('quick-add-input');
  if (!quickInput) return;

  // 自然言語入力のためのリスナー
  quickInput.addEventListener('input', (e) => {
    const value = e.target.value.trim();

    // 自然言語日時の解析
    if (value.length > 2) {
      const result = processNaturalInput(value);
      // コンソールに結果を出力（デバッグ用）
      // console.log('Natural language parsing:', result);
    }

    // テンプレート補完の提案
    updateAutocompleteUI(value);
  });

  // キーボード処理
  setupKeyboardHandling();

  // Enterキー処理の改善
  quickInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      // 自然言語入力を処理
      const result = processNaturalInput(e.target.value);

      // フォーム送信（通常のイベントで処理される）
      e.target.form.dispatchEvent(new Event('submit'));
    }
  });

  // 絵文字ピッカーボタン（存在する場合）
  // NOTE: 将来的に絵文字ボタンを追加する場合

  console.log('Input experience enhancement initialized');
}

// ページロード時に初期化
document.addEventListener('DOMContentLoaded', initInputExperience);

// 動的に追加された場合の再初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initInputExperience);
} else {
  initInputExperience();
}
