// ========================================
// フェーズ 6.9: ヘルプとオンボーディング
// ========================================

/**
 * チュートリアルステップ定義
 */
const TUTORIAL_STEPS = [
  {
    target: '#quick-add-input',
    title: 'クイック入力でタスク追加',
    description: 'ここにタスク名を入力してEnterキーで素早くタスクを追加できます。「明日 14時 買い物」のように日時も入力できます',
    position: 'top',
    highlight: true
  },
  {
    target: '#time-gauge-container',
    title: '24時間タイムゲージ',
    description: '今日の時間配分が一目でわかります。青が予定時間、灰色が空き時間です',
    position: 'bottom',
    highlight: true
  },
  {
    target: '#search-input',
    title: 'タスクを検索',
    description: 'タスク名またはメモから素早くタスクを検索できます',
    position: 'bottom',
    highlight: false
  },
  {
    target: '#select-mode-icon-btn',
    title: '複数選択モード',
    description: '複数のタスクを選択して一括で操作できます',
    position: 'bottom',
    highlight: false
  },
  {
    target: '#create-task-btn',
    title: '新規タスク作成',
    description: 'より詳細な設定でタスクを作成できます（日時、メモ、優先度など）',
    position: 'top',
    highlight: false
  }
];

/**
 * ショートカット定義
 */
const SHORTCUTS = [
  {
    gesture: '右スワイプ →',
    action: 'タスク完了/未完了',
    icon: '✓'
  },
  {
    gesture: '← 左スワイプ',
    action: 'タスク削除',
    icon: '×'
  },
  {
    gesture: 'Enter キー',
    action: 'クイック入力フォーム送信',
    icon: '⏎'
  },
  {
    gesture: 'Escape キー',
    action: 'モーダルを閉じる',
    icon: 'Esc'
  },
  {
    gesture: 'Tab キー',
    action: 'フォーカスの移動',
    icon: '→'
  }
];

/**
 * FAQ データ
 */
const FAQ_ITEMS = [
  {
    question: '自然言語で日時を入力できますか？',
    answer: 'はい、できます。「明日 14時 買い物」「来週月曜 会議」など、自然な言語で日時を指定できます。'
  },
  {
    question: 'タスクを一括で操作できますか？',
    answer: 'はい。選択モード（アイコン）から複数タスクを選択して、一括で完了・削除・日付変更ができます。'
  },
  {
    question: 'オフラインでも使用できますか？',
    answer: 'はい、オフラインモードでもタスクの作成・編集が可能です。インターネット接続時に自動的に同期されます。'
  },
  {
    question: 'タスクを削除したら復元できますか？',
    answer: 'はい。削除時に「アンドゥ」ボタンが表示され、5秒以内なら復元できます。'
  },
  {
    question: '絵文字をタスクに追加できますか？',
    answer: 'はい。入力フィールドの絵文字アイコン（📝）から選択して追加できます。'
  },
  {
    question: '期限切れタスクはどうなりますか？',
    answer: '期限が過ぎたタスクは赤く表示されます。クイックアクションで明日に一括移動できます。'
  }
];

/**
 * チュートリアルを開始
 */
function startTutorial() {
  if (localStorage.getItem('tutorialCompleted') === 'true' &&
      !localStorage.getItem('showTutorialAgain')) {
    return; // チュートリアル既完了
  }

  let currentStep = 0;

  function showStep(stepIndex) {
    currentStep = stepIndex;

    // 前のハイライトを削除
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });

    const step = TUTORIAL_STEPS[stepIndex];
    const target = document.querySelector(step.target);

    if (!target) {
      // ターゲット要素が見つからない場合は次へ
      if (stepIndex < TUTORIAL_STEPS.length - 1) {
        setTimeout(() => showStep(stepIndex + 1), 300);
      } else {
        completeTutorial();
      }
      return;
    }

    // ハイライト
    if (step.highlight) {
      target.classList.add('tutorial-highlight');
    }

    // ツールチップ表示
    showTutorialTooltip(target, step, stepIndex);
  }

  showStep(0);

  function completeTutorial() {
    localStorage.setItem('tutorialCompleted', 'true');
    localStorage.removeItem('showTutorialAgain');
    hideTutorialOverlay();
    console.log('✅ チュートリアル完了');
  }

  // ウィンドウレベルで次へ/前へ関数を定義
  window.tutorialNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      showStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  window.tutorialPrev = () => {
    if (currentStep > 0) {
      showStep(currentStep - 1);
    }
  };

  window.tutorialSkip = completeTutorial;
}

/**
 * チュートリアル用ツールチップを表示
 */
function showTutorialTooltip(target, step, stepIndex) {
  // 既存のツールチップを削除
  document.querySelectorAll('.tutorial-tooltip').forEach(el => el.remove());

  const tooltip = document.createElement('div');
  tooltip.className = 'tutorial-tooltip';
  tooltip.setAttribute('role', 'dialog');
  tooltip.setAttribute('aria-label', `チュートリアル: ${step.title}`);

  const totalSteps = TUTORIAL_STEPS.length;

  tooltip.innerHTML = `
    <div class="tutorial-tooltip-header">
      <h3 class="tutorial-tooltip-title">${step.title}</h3>
      <span class="tutorial-step-counter">${stepIndex + 1}/${totalSteps}</span>
    </div>
    <p class="tutorial-tooltip-description">${step.description}</p>
    <div class="tutorial-tooltip-buttons">
      <button class="btn btn-secondary" onclick="tutorialPrev()"
              ${stepIndex === 0 ? 'disabled' : ''}>前へ</button>
      <button class="btn btn-secondary" onclick="tutorialSkip()">スキップ</button>
      <button class="btn btn-primary" onclick="tutorialNext()">
        ${stepIndex === totalSteps - 1 ? '完了' : '次へ'}
      </button>
    </div>
  `;

  document.body.appendChild(tooltip);

  // ツールチップを target の近くに配置
  positionTooltip(tooltip, target, step.position);
}

/**
 * ツールチップを配置
 */
function positionTooltip(tooltip, target, position) {
  const rect = target.getBoundingClientRect();
  const tooltipHeight = 200;
  const tooltipWidth = 280;
  const gap = 16;

  let top, left;

  if (position === 'top') {
    top = rect.top - tooltipHeight - gap;
    left = rect.left + rect.width / 2 - tooltipWidth / 2;
  } else {
    top = rect.bottom + gap;
    left = rect.left + rect.width / 2 - tooltipWidth / 2;
  }

  // ビューポート内に収まるように調整
  if (left < 0) left = 16;
  if (left + tooltipWidth > window.innerWidth) left = window.innerWidth - tooltipWidth - 16;

  tooltip.style.top = `${Math.max(16, top)}px`;
  tooltip.style.left = `${left}px`;
}

/**
 * チュートリアルオーバーレイを表示
 */
function showTutorialOverlay() {
  if (!document.getElementById('tutorial-overlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'tutorial-overlay';
    overlay.className = 'tutorial-overlay';
    document.body.appendChild(overlay);
  }
}

/**
 * チュートリアルオーバーレイを非表示
 */
function hideTutorialOverlay() {
  const overlay = document.getElementById('tutorial-overlay');
  if (overlay) {
    overlay.remove();
  }
  document.querySelectorAll('.tutorial-highlight').forEach(el => {
    el.classList.remove('tutorial-highlight');
  });
  document.querySelectorAll('.tutorial-tooltip').forEach(el => {
    el.remove();
  });
}

/**
 * ショートカットガイドを表示
 */
function showShortcutsGuide() {
  const dialog = document.createElement('div');
  dialog.className = 'shortcuts-modal';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-labelledby', 'shortcuts-title');

  let shortcutsHtml = '<h2 id="shortcuts-title" class="shortcuts-title">ジェスチャーショートカット</h2>';
  shortcutsHtml += '<div class="shortcuts-grid">';

  SHORTCUTS.forEach(shortcut => {
    shortcutsHtml += `
      <div class="shortcut-card">
        <div class="shortcut-icon">${shortcut.icon}</div>
        <div class="shortcut-gesture">${shortcut.gesture}</div>
        <div class="shortcut-action">${shortcut.action}</div>
      </div>
    `;
  });

  shortcutsHtml += '</div>';
  shortcutsHtml += `
    <div class="shortcuts-modal-footer">
      <button class="btn btn-primary" onclick="document.querySelector('.shortcuts-modal')?.remove()">
        閉じる
      </button>
    </div>
  `;

  dialog.innerHTML = shortcutsHtml;
  document.body.appendChild(dialog);
}

/**
 * FAQ を表示
 */
function showFAQ() {
  const faqContainer = document.createElement('div');
  faqContainer.className = 'faq-container';
  faqContainer.setAttribute('role', 'region');
  faqContainer.setAttribute('aria-label', 'よくある質問');

  let faqHtml = '<h2 class="faq-title">よくある質問（FAQ）</h2>';
  faqHtml += '<div class="faq-search">';
  faqHtml += '<input type="text" id="faq-search-input" placeholder="質問を検索..." aria-label="FAQ を検索">';
  faqHtml += '</div>';
  faqHtml += '<div class="faq-items">';

  FAQ_ITEMS.forEach((item, index) => {
    faqHtml += `
      <div class="faq-item">
        <button class="faq-question" onclick="this.nextElementSibling.classList.toggle('show')" aria-expanded="false">
          <span class="faq-q-icon">Q:</span> ${item.question}
        </button>
        <div class="faq-answer">
          <span class="faq-a-icon">A:</span> ${item.answer}
        </div>
      </div>
    `;
  });

  faqHtml += '</div>';

  faqContainer.innerHTML = faqHtml;
  document.body.appendChild(faqContainer);

  // 検索機能
  const searchInput = faqContainer.querySelector('#faq-search-input');
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('.faq-item').forEach(item => {
      const question = item.querySelector('.faq-question').textContent.toLowerCase();
      const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
      item.style.display = question.includes(query) || answer.includes(query) ? '' : 'none';
    });
  });
}

/**
 * ツールチップを追加
 */
function addTooltips() {
  const tooltipConfigs = [
    {
      selector: '#bulk-select-all-btn',
      text: '複数のタスクをすべて選択/解除できます'
    },
    {
      selector: '#search-input',
      text: 'タスク名またはメモから検索できます'
    },
    {
      selector: '#quick-date-btn',
      text: '日付と時間を詳しく設定できます'
    },
    {
      selector: '#settings-icon-btn',
      text: 'ルーティンやクイックアクション、設定を変更できます'
    }
  ];

  tooltipConfigs.forEach(config => {
    const element = document.querySelector(config.selector);
    if (element) {
      element.setAttribute('data-tooltip', config.text);
      element.classList.add('has-tooltip');
    }
  });
}

/**
 * チュートリアルの再表示オプションを設定画面に追加
 */
function addTutorialReplayOption() {
  const settingsModal = document.getElementById('settings-modal');
  if (!settingsModal) return;

  const existingOption = document.querySelector('.tutorial-replay-option');
  if (existingOption) return;

  const section = document.createElement('div');
  section.className = 'tutorial-replay-option';
  section.innerHTML = `
    <h3 class="settings-section-title">ヘルプとチュートリアル</h3>
    <button type="button" class="btn btn-secondary" onclick="startTutorial(); localStorage.setItem('showTutorialAgain', 'true');">
      チュートリアルを再表示
    </button>
    <button type="button" class="btn btn-secondary" onclick="showShortcutsGuide();">
      ショートカットガイド
    </button>
    <button type="button" class="btn btn-secondary" onclick="showFAQ();">
      よくある質問（FAQ）
    </button>
  `;

  const settingsBody = settingsModal.querySelector('.modal-body');
  if (settingsBody) {
    settingsBody.appendChild(section);
  }
}

/**
 * 初期化関数
 */
let helpInitialized = false;

function initHelp() {
  // 重複初期化を防止
  if (helpInitialized) return;
  helpInitialized = true;

  console.log('Initializing help and onboarding features...');

  // 初回起動時にチュートリアル表示（本当に初回のみ）
  // ユーザーからのフィードバックにより、自動表示は無効化
  // if (!localStorage.getItem('tutorialCompleted') && !localStorage.getItem('_help_initialized')) {
  //   setTimeout(() => {
  //     startTutorial();
  //   }, 1000);
  //   localStorage.setItem('_help_initialized', 'true');
  // }

  // ツールチップを追加
  addTooltips();

  // 設定画面にオプションを追加
  addTutorialReplayOption();

  // グローバル関数として公開
  window.showShortcutsGuide = showShortcutsGuide;
  window.showFAQ = showFAQ;

  console.log('✅ Help and onboarding features initialized');
}

// ページロード時に初期化（1回のみ）
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHelp);
} else {
  initHelp();
}
