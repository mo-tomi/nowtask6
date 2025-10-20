# nowtask UI刷新 実装タスク

**作成日**: 2025年10月17日
**基準ドキュメント**: [requirements.md](./requirements.md)
**デザイン参照**: `ui-mockups-mobile.html`

---

## 📋 プロジェクト概要

モックアップで完成したUIデザインをAndroidアプリに適用する。既存の全機能を維持しながら、段階的かつ慎重に実装を進める。

### 基本方針
1. **段階的実装**: 各フェーズで独立して動作可能
2. **機能保持**: 既存機能を100%維持
3. **テスト駆動**: 各フェーズ完了後に全機能テスト
4. **ロールバック可能**: 問題発生時は即座に戻せる設計

---

## 🎯 全体計画

### フェーズ構成

| フェーズ | 内容 | 期間目安 | 優先度 |
|---------|------|----------|--------|
| Phase 1 | CSS基盤整備 | 1-2日 | 🔴 必須 |
| Phase 2 | ヘッダー刷新 | 1日 | 🔴 必須 |
| Phase 3 | タスクカード刷新 | 2-3日 | 🔴 必須 |
| Phase 4 | セクション・ラベル刷新 | 1日 | 🔴 必須 |
| Phase 5 | 24時間ゲージ刷新 | 2日 | 🟡 推奨 |
| Phase 6 | クイック入力・完了済み | 1-2日 | 🟡 推奨 |

**合計期間**: 8〜11日

---

## Phase 1: CSS基盤整備

### 🎯 目的
既存CSSに影響を与えずに、新しいデザインシステムを導入する基盤を作る。

### 📝 タスク

#### 1.1 新規CSSファイル作成
- [ ] `css/style-base.css` 作成
  - CSS変数定義（カラー、タイポグラフィ、スペーシング）
  - リセットCSS
  - ユーティリティクラス
- [ ] `css/style-components.css` 作成
  - ヘッダー
  - タスクカード
  - ボタン
  - セクションラベル
  - モーダル

#### 1.2 CSS変数定義
```css
/* style-base.css */
:root {
  /* カラーパレット */
  --color-primary: #000000;
  --color-bg: #ffffff;
  --color-bg-secondary: #f5f5f5;
  --color-text: #000000;
  --color-text-secondary: #666666;
  --color-text-tertiary: #999999;
  --color-border: #e0e0e0;
  --color-border-dark: #d0d0d0;

  /* 機能色 */
  --color-priority-high: #ff6b6b;
  --color-priority-medium: #ffa500;
  --color-priority-low: #4dabf7;
  --color-urgent: #d63031;
  --color-error: #f44336;

  /* スペーシング */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 20px;
  --space-xxl: 24px;

  /* タイポグラフィ */
  --text-xxl: 18px;
  --text-xl: 16px;
  --text-lg: 14px;
  --text-md: 12px;
  --text-sm: 11px;
  --text-xs: 10px;

  /* 角丸 */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* 影 */
  --shadow-sm: 0 2px 4px rgba(0,0,0,0.08);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.08);
  --shadow-lg: 0 4px 12px rgba(0,0,0,0.15);

  /* トランジション */
  --transition-fast: 0.15s ease;
  --transition-base: 0.2s ease;
  --transition-slow: 0.3s ease;
}
```

#### 1.3 index.html更新
```html
<!-- 既存 -->
<link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="animations.css">

<!-- 追加 -->
<link rel="stylesheet" href="css/style-base.css">
<link rel="stylesheet" href="css/style-components.css">
```

### ✅ 完了条件
- [ ] 新規CSSファイルが作成され、index.htmlで読み込まれている
- [ ] 既存のデザインが一切変わっていない
- [ ] ブラウザ・実機で表示確認OK

### ⚠️ 注意点
- **既存のstyle.cssは削除しない**（後方互換性）
- CSS変数は既存クラスに影響しない命名
- 新しいクラスには接頭辞 `.new-` を付ける（例: `.new-header`）

---

## Phase 2: ヘッダー刷新

### 🎯 目的
アプリヘッダーを新デザインに変更。SVGアイコンを導入。

### 📝 タスク

#### 2.1 SVGアイコン準備
- [ ] `android-app/app/src/main/assets/index.html` からSVGアイコンを抽出
  - カレンダーアイコン
  - アカウントアイコン
  - 設定アイコン（歯車）
  - メニューアイコン（縦3点）

#### 2.2 新ヘッダーHTML作成
```html
<!-- 既存のheaderの直後に追加 -->
<header class="new-header" id="new-header">
  <div class="new-header-content">
    <h1 class="new-app-title">nowtask</h1>
    <div class="new-header-actions">
      <button class="new-header-btn" id="new-calendar-btn" aria-label="カレンダー">
        <svg viewBox="0 0 24 24">...</svg>
      </button>
      <button class="new-header-btn" id="new-account-btn" aria-label="アカウント">
        <svg viewBox="0 0 24 24">...</svg>
      </button>
      <button class="new-header-btn" id="new-settings-btn" aria-label="設定">
        <svg viewBox="0 0 24 24">...</svg>
      </button>
      <button class="new-header-btn" id="new-menu-btn" aria-label="メニュー">
        <svg viewBox="0 0 24 24">...</svg>
      </button>
    </div>
  </div>
</header>
```

#### 2.3 CSS実装
```css
/* style-components.css */
.new-header {
  background: var(--color-bg);
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.new-app-title {
  font-size: var(--text-xxl);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.new-header-actions {
  display: flex;
  gap: var(--space-sm);
}

.new-header-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--transition-base);
}

.new-header-btn:hover {
  background: var(--color-bg-secondary);
}

.new-header-btn svg {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
}
```

#### 2.4 JavaScript連携
- [ ] `ui-main.js` または `events.js` に新ヘッダーのイベントリスナー追加
```javascript
// 既存のイベントリスナーをコピーして新IDに割り当て
document.getElementById('new-calendar-btn')?.addEventListener('click', () => {
  document.getElementById('calendar-icon-btn')?.click();
});

document.getElementById('new-account-btn')?.addEventListener('click', () => {
  document.getElementById('login-icon-btn')?.click();
});

document.getElementById('new-settings-btn')?.addEventListener('click', () => {
  document.getElementById('settings-icon-btn')?.click();
});

document.getElementById('new-menu-btn')?.addEventListener('click', () => {
  document.getElementById('header-menu-btn')?.click();
});
```

#### 2.5 切り替え機能実装
- [ ] 旧ヘッダーと新ヘッダーの切り替えフラグ追加
```javascript
// core.js に追加
const UI_VERSION = localStorage.getItem('ui-version') || 'new'; // 'old' or 'new'

function toggleUIVersion(version) {
  localStorage.setItem('ui-version', version);
  applyUIVersion();
}

function applyUIVersion() {
  const version = localStorage.getItem('ui-version') || 'new';
  const oldHeader = document.querySelector('.header');
  const newHeader = document.querySelector('.new-header');

  if (version === 'new') {
    oldHeader?.style.setProperty('display', 'none');
    newHeader?.style.setProperty('display', 'flex');
  } else {
    oldHeader?.style.setProperty('display', 'flex');
    newHeader?.style.setProperty('display', 'none');
  }
}

// 初期化時に実行
document.addEventListener('DOMContentLoaded', applyUIVersion);
```

### ✅ 完了条件
- [ ] 新ヘッダーが表示され、全ボタンが動作する
- [ ] 旧ヘッダーとの切り替えが可能
- [ ] SVGアイコンが正しく表示される
- [ ] スティッキー動作が正常
- [ ] 実機テスト完了

### ⚠️ 注意点
- 旧ヘッダーは削除せず `display: none` で非表示
- イベントリスナーは既存のボタンIDに委譲（既存機能を壊さない）
- z-indexの衝突に注意

---

## Phase 3: タスクカード刷新

### 🎯 目的
タスクカードを新デザインに変更。メニューボタンを追加。

### 📝 タスク

#### 3.1 新タスクカードHTML構造設計
```html
<div class="new-task-card" data-task-id="...">
  <div class="new-task-body">
    <div class="new-task-title">タスク名</div>
    <div class="new-task-meta">
      <span class="new-duration-badge">30分</span>
      <span class="new-urgent-badge">緊急</span>
    </div>
  </div>
  <button class="new-task-menu-btn" title="メニュー">
    <svg>⋮</svg>
  </button>
  <div class="new-task-checkbox"></div>
</div>
```

#### 3.2 CSS実装
```css
.new-task-card {
  display: flex;
  gap: var(--space-md);
  align-items: flex-start;
  padding: var(--space-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-sm);
  transition: box-shadow var(--transition-base);
}

.new-task-card:hover {
  box-shadow: var(--shadow-sm);
}

.new-task-body {
  flex: 1;
  min-width: 0;
}

.new-task-title {
  font-size: var(--text-lg);
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: var(--space-xs);
  word-wrap: break-word;
}

.new-task-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}

.new-duration-badge {
  display: inline-flex;
  align-items: center;
  background: var(--color-bg-secondary);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

.new-urgent-badge {
  display: inline-flex;
  align-items: center;
  background: #ffe6e6;
  color: var(--color-urgent);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 600;
}

.new-task-menu-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: background var(--transition-base);
}

.new-task-menu-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text);
}

.new-task-checkbox {
  width: 24px;
  height: 24px;
  border: 2px solid #ccc;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-base);
}

.new-task-checkbox.checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
  position: relative;
}

.new-task-checkbox.checked::after {
  content: '✓';
  color: white;
  font-size: 14px;
  font-weight: bold;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 優先度による色分け */
.new-task-card.priority-high {
  border-left: 4px solid var(--color-priority-high);
  background: #fff5f5;
}

.new-task-card.priority-medium {
  border-left: 4px solid var(--color-priority-medium);
  background: #fffbf5;
}

.new-task-card.priority-low {
  border-left: 4px solid var(--color-priority-low);
  background: #f0f8ff;
}

.new-task-card.urgent {
  border-left: 4px solid var(--color-urgent);
  background: #ffe6e6;
}

.new-task-card.completed {
  opacity: 0.6;
  background: #fafafa;
}

.new-task-card.completed .new-task-title {
  text-decoration: line-through;
  color: var(--color-text-tertiary);
}
```

#### 3.3 render.js 修正
- [ ] `renderTaskCard()` 関数に新デザイン分岐を追加
```javascript
function renderTaskCard(task) {
  const uiVersion = localStorage.getItem('ui-version') || 'new';

  if (uiVersion === 'new') {
    return renderNewTaskCard(task);
  } else {
    return renderOldTaskCard(task);
  }
}

function renderNewTaskCard(task) {
  const priorityClass = task.priority ? `priority-${task.priority}` : '';
  const urgentClass = task.urgent ? 'urgent' : '';
  const completedClass = task.completed ? 'completed' : '';
  const checkedClass = task.completed ? 'checked' : '';

  return `
    <div class="new-task-card ${priorityClass} ${urgentClass} ${completedClass}"
         data-task-id="${task.id}">
      <div class="new-task-body">
        <div class="new-task-title">${escapeHtml(task.title)}</div>
        <div class="new-task-meta">
          ${task.duration ? `<span class="new-duration-badge">${task.duration}分</span>` : ''}
          ${task.urgent ? `<span class="new-urgent-badge">緊急</span>` : ''}
        </div>
      </div>
      <button class="new-task-menu-btn" title="メニュー">⋮</button>
      <div class="new-task-checkbox ${checkedClass}"></div>
    </div>
  `;
}

function renderOldTaskCard(task) {
  // 既存のレンダリングロジックをそのまま維持
  // ...
}
```

#### 3.4 イベントリスナー追加
- [ ] `events.js` に新タスクカードのイベント追加
```javascript
// チェックボックスクリック
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('new-task-checkbox')) {
    const card = e.target.closest('.new-task-card');
    const taskId = card.dataset.taskId;
    toggleTaskCompletion(taskId);
  }
});

// メニューボタンクリック
document.addEventListener('click', (e) => {
  if (e.target.closest('.new-task-menu-btn')) {
    const card = e.target.closest('.new-task-card');
    const taskId = card.dataset.taskId;
    showTaskMenu(taskId, e);
  }
});

// タスクカードクリック（編集）
document.addEventListener('click', (e) => {
  if (e.target.closest('.new-task-card') &&
      !e.target.closest('.new-task-checkbox') &&
      !e.target.closest('.new-task-menu-btn')) {
    const card = e.target.closest('.new-task-card');
    const taskId = card.dataset.taskId;
    openTaskEditModal(taskId);
  }
});
```

#### 3.5 ドラッグ&ドロップ対応
- [ ] 既存のドラッグ機能を新タスクカードにも適用
```javascript
// render.js で既存のドラッグ初期化を新カードにも適用
function initializeDragAndDrop() {
  const uiVersion = localStorage.getItem('ui-version') || 'new';
  const selector = uiVersion === 'new' ? '.new-task-card' : '.task-card';

  document.querySelectorAll(selector).forEach(card => {
    card.setAttribute('draggable', 'true');
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragover', handleDragOver);
    card.addEventListener('drop', handleDrop);
    card.addEventListener('dragend', handleDragEnd);
  });
}
```

### ✅ 完了条件
- [ ] タスクカードが新デザインで表示される
- [ ] チェックボックスで完了/未完了の切り替えができる
- [ ] メニューボタンが動作する
- [ ] タスクカードクリックで編集モーダルが開く
- [ ] ドラッグ&ドロップが動作する
- [ ] 優先度による色分けが正しい
- [ ] 実機テスト完了

### ⚠️ 注意点
- `renderOldTaskCard()` は既存コードをコピー（後方互換性）
- イベント委譲を使い、動的に追加されるカードにも対応
- ドラッグ中のスタイル調整

---

## Phase 4: セクション・ラベル刷新

### 🎯 目的
セクションラベルに「+」ボタンを追加。スティッキー配置。

### 📝 タスク

#### 4.1 セクションラベルHTML
```html
<div class="new-section-label">
  <span class="new-section-title">本日のタスク</span>
  <button class="new-section-add-btn" title="タスク追加">+</button>
</div>
```

#### 4.2 CSS実装
```css
.new-section-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-primary);
  color: white;
  padding: var(--space-sm) var(--space-lg);
  font-size: var(--text-md);
  font-weight: 600;
  position: sticky;
  top: 57px; /* ヘッダーの高さ */
  z-index: 90;
  border-radius: 0;
}

.new-section-title {
  flex: 1;
}

.new-section-add-btn {
  width: 24px;
  height: 24px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all var(--transition-base);
}

.new-section-add-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}
```

#### 4.3 render.js 修正
- [ ] セクションラベル描画関数を追加
```javascript
function renderSectionLabel(dateKey, label) {
  const uiVersion = localStorage.getItem('ui-version') || 'new';

  if (uiVersion === 'new') {
    return `
      <div class="new-section-label" data-date="${dateKey}">
        <span class="new-section-title">${label}</span>
        <button class="new-section-add-btn"
                data-date="${dateKey}"
                title="タスク追加">+</button>
      </div>
    `;
  } else {
    return `<div class="section-label">${label}</div>`;
  }
}
```

#### 4.4 イベントリスナー
```javascript
// 追加ボタンクリック
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('new-section-add-btn')) {
    const dateKey = e.target.dataset.date;
    openTaskCreateModal({ dueDate: dateKey });
  }
});
```

### ✅ 完了条件
- [ ] セクションラベルが新デザインで表示される
- [ ] 「+」ボタンが動作し、タスク作成モーダルが開く
- [ ] スティッキー動作が正常（スクロール時に固定）
- [ ] 実機テスト完了

---

## Phase 5: 24時間ゲージ刷新

### 🎯 目的
24ステップ方式のゲージを実装。

### 📝 タスク

#### 5.1 ゲージHTML構造
```html
<section class="new-time-gauge">
  <header class="new-gauge-header">
    <button class="new-gauge-nav-btn" id="new-gauge-prev">‹</button>
    <div class="new-gauge-header-center">
      <div class="new-gauge-date-label">今日</div>
      <time class="new-current-time">14:32</time>
    </div>
    <button class="new-gauge-nav-btn" id="new-gauge-next">›</button>
  </header>

  <div class="new-gauge-wrapper">
    <div class="new-gauge-bar">
      <!-- 24個のブロック（0時〜23時） -->
      <div class="new-gauge-step"></div>
      <div class="new-gauge-step"></div>
      <!-- ... 24個 ... -->
    </div>
    <div class="new-time-labels">
      <span class="new-time-label">0:00</span>
      <span class="new-time-label">6:00</span>
      <span class="new-time-label">12:00</span>
      <span class="new-time-label">18:00</span>
      <span class="new-time-label">24:00</span>
    </div>
  </div>
</section>
```

#### 5.2 CSS実装
[GAUGE_SPECIFICATION.md](./GAUGE_SPECIFICATION.md) の仕様に従って実装

```css
.new-time-gauge {
  background: var(--color-bg);
  padding: var(--space-lg) var(--space-xl);
  margin-bottom: var(--space-md);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border);
}

.new-gauge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  gap: var(--space-md);
}

.new-gauge-nav-btn {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-dark);
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  color: var(--color-text);
}

.new-gauge-header-center {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  gap: var(--space-sm);
}

.new-gauge-date-label {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text);
}

.new-current-time {
  font-size: var(--text-md);
  color: var(--color-text-secondary);
  font-weight: 500;
}

.new-gauge-bar {
  display: flex;
  gap: 2px;
  margin-bottom: var(--space-sm);
}

.new-gauge-step {
  flex: 1;
  height: 24px;
  background: var(--color-border);
  border-radius: var(--radius-sm);
}

.new-gauge-step.active {
  background: var(--color-primary);
}

.new-gauge-step.active.current-marker {
  background: #f5f5f7;
  border: 2px solid #5f6368;
}

.new-time-labels {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  margin-top: var(--space-sm);
  padding: 0 2px;
}

.new-time-label {
  text-align: center;
  font-weight: 500;
}
```

#### 5.3 gauge.js 修正
- [ ] 新ゲージ対応のレンダリング関数追加
```javascript
function renderGauge() {
  const uiVersion = localStorage.getItem('ui-version') || 'new';

  if (uiVersion === 'new') {
    renderNewGauge();
  } else {
    renderOldGauge();
  }
}

function renderNewGauge() {
  const currentHour = new Date().getHours();
  const tasks = getTasksForSelectedDate();

  // 24個のブロックを生成
  const stepsHTML = Array.from({ length: 24 }, (_, i) => {
    const isActive = tasks.some(t => isHourCovered(t, i));
    const isCurrent = i === currentHour;
    const classes = ['new-gauge-step'];
    if (isActive) classes.push('active');
    if (isCurrent) classes.push('current-marker');
    return `<div class="${classes.join(' ')}"></div>`;
  }).join('');

  const gaugeContainer = document.querySelector('.new-gauge-bar');
  if (gaugeContainer) {
    gaugeContainer.innerHTML = stepsHTML;
  }
}

function isHourCovered(task, hour) {
  if (!task.startTime) return false;
  const [startHour] = task.startTime.split(':').map(Number);
  const endHour = startHour + Math.ceil(task.duration / 60);
  return hour >= startHour && hour < endHour;
}
```

#### 5.4 イベントリスナー
```javascript
// 前日/次日ボタン
document.getElementById('new-gauge-prev')?.addEventListener('click', () => {
  changeGaugeDate(-1);
  renderGauge();
});

document.getElementById('new-gauge-next')?.addEventListener('click', () => {
  changeGaugeDate(1);
  renderGauge();
});
```

### ✅ 完了条件
- [ ] 24個のブロックが正しく表示される
- [ ] タスクがある時間帯が黒く表示される
- [ ] 現在時刻のブロックがハイライトされる
- [ ] 日付切り替えが動作する
- [ ] 時間ラベルが正しい
- [ ] 実機テスト完了

---

## Phase 6: クイック入力・完了済みセクション

### 🎯 目的
画面下部のクイック入力バーと完了済みセクションを追加。

### 📝 タスク

#### 6.1 クイック入力バーHTML
```html
<div class="new-quick-add-bar">
  <button class="new-quick-history-btn" title="履歴">
    <svg><!-- 時計アイコン --></svg>
  </button>
  <div class="new-quick-input-wrapper">
    <input type="text"
           class="new-quick-input"
           placeholder="タスク名を入力してEnter"
           id="new-quick-input">
    <div class="new-quick-input-actions">
      <button class="new-quick-date-btn" title="日付設定">
        <svg><!-- カレンダーアイコン --></svg>
      </button>
      <button class="new-quick-submit-btn" title="追加">
        <svg><!-- チェックマークアイコン --></svg>
      </button>
    </div>
  </div>
</div>
```

#### 6.2 完了済みセクションHTML
```html
<div class="new-completed-section">
  <button class="new-completed-toggle">
    <span class="new-toggle-icon">▶</span>
    <span class="new-toggle-text">完了済み</span>
    <span class="new-completed-count">(2)</span>
  </button>
  <div class="new-completed-content" style="display: none;">
    <div id="new-completed-list"></div>
  </div>
</div>
```

#### 6.3 CSS実装
```css
/* クイック入力バー */
.new-quick-add-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-primary);
  padding: var(--space-md) var(--space-lg);
  box-shadow: 0 -4px 12px rgba(0,0,0,0.15);
  z-index: 999;
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.new-quick-history-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: var(--radius-sm);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
}

.new-quick-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border-radius: var(--radius-sm);
  padding-right: 4px;
  flex: 1;
}

.new-quick-input {
  flex: 1;
  padding: 10px 80px 10px 14px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--text-lg);
  outline: none;
}

.new-quick-input-actions {
  position: absolute;
  right: 4px;
  display: flex;
  gap: 4px;
}

.new-quick-date-btn,
.new-quick-submit-btn {
  background: var(--color-text-secondary);
  border: none;
  border-radius: var(--radius-sm);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
}

.new-quick-submit-btn {
  background: var(--color-primary);
}

/* 完了済みセクション */
.new-completed-section {
  margin-top: var(--space-xxl);
  padding: 0 var(--space-xl);
  margin-bottom: 80px; /* クイック入力バーの高さ分 */
}

.new-completed-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
  padding: var(--space-md) var(--space-lg);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--text-lg);
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: background var(--transition-base);
}

.new-completed-toggle:hover {
  background: #f0f0f0;
}

.new-toggle-icon {
  font-size: var(--text-md);
  color: var(--color-text-tertiary);
  transition: transform var(--transition-base);
}

.new-toggle-icon.expanded {
  transform: rotate(90deg);
}

.new-completed-count {
  margin-left: auto;
  color: var(--color-text-tertiary);
  font-size: var(--text-md);
}

.new-completed-content {
  margin-top: var(--space-md);
}
```

#### 6.4 JavaScript実装
```javascript
// クイック入力
const quickInput = document.getElementById('new-quick-input');
quickInput?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const title = quickInput.value.trim();
    if (title) {
      createQuickTask(title);
      quickInput.value = '';
    }
  }
});

document.querySelector('.new-quick-submit-btn')?.addEventListener('click', () => {
  const title = quickInput.value.trim();
  if (title) {
    createQuickTask(title);
    quickInput.value = '';
  }
});

// 完了済み折りたたみ
document.querySelector('.new-completed-toggle')?.addEventListener('click', () => {
  const content = document.querySelector('.new-completed-content');
  const icon = document.querySelector('.new-toggle-icon');

  if (content.style.display === 'none') {
    content.style.display = 'block';
    icon.classList.add('expanded');
  } else {
    content.style.display = 'none';
    icon.classList.remove('expanded');
  }
});
```

### ✅ 完了条件
- [ ] クイック入力バーが画面下部に固定表示
- [ ] Enter/送信ボタンでタスク作成
- [ ] 完了済みセクションの折りたたみ動作
- [ ] 完了タスク件数が正しく表示
- [ ] 実機テスト完了

---

## 🧪 テスト計画

### 各フェーズ完了時のテスト項目

#### 基本動作確認
- [ ] タスク作成・編集・削除
- [ ] タスク完了/未完了の切り替え
- [ ] サブタスク操作
- [ ] ドラッグ&ドロップ
- [ ] 日付変更
- [ ] 検索・フィルター
- [ ] ルーティン機能
- [ ] カレンダー表示
- [ ] 設定変更
- [ ] データ同期（Firestore）

#### UI/UX確認
- [ ] デザインがモックアップと一致
- [ ] スクロール動作
- [ ] タップ反応速度
- [ ] アニメーション
- [ ] スティッキー要素の動作

#### パフォーマンス確認
- [ ] 大量タスクでの動作（100件以上）
- [ ] スクロールの滑らかさ
- [ ] メモリ使用量

#### データ整合性確認
- [ ] 旧UI → 新UI 切り替え時のデータ保持
- [ ] リロード後のデータ保持
- [ ] 複数デバイス間の同期

---

## 🔄 ロールバック手順

各フェーズで問題が発生した場合の対処法：

### 即座のロールバック
```javascript
// 設定画面に追加
localStorage.setItem('ui-version', 'old');
location.reload();
```

### Git操作
```bash
# 直前のコミットに戻す
git reset --hard HEAD~1

# 特定のフェーズに戻す
git checkout <phase-tag>
```

---

## 📊 進捗管理

### 現在の状態

| フェーズ | 状態 | 完了日 | 備考 |
|---------|------|--------|------|
| Phase 1 | ✅ 完了 | 2025-10-18 | CSS基盤整備（style-base.css, style-components.css） |
| Phase 2 | ✅ 完了 | 2025-10-18 | ヘッダー刷新（新ヘッダーHTML、イベント連携、切り替え機能） |
| Phase 3 | ✅ 完了 | 2025-10-18 | タスクカード刷新（createNewTaskCard、ドラッグ&ドロップ対応） |
| Phase 4 | ✅ 完了 | 2025-10-18 | セクション・ラベル刷新（renderSectionLabel、+ボタン追加） |
| Phase 5 | ✅ 完了 | 2025-10-18 | 24時間ゲージ刷新（renderNewGauge、24ステップ方式） |
| Phase 6 | ✅ 完了 | 2025-10-18 | クイック入力・完了済み（既存フォーム活用、CSS実装） |

### 状態アイコン
- ⬜ 未着手
- 🔄 進行中
- ✅ 完了
- ⚠️ 問題あり
- 🔴 ブロック中

---

## 📝 変更履歴

| 日付 | 内容 | 担当 |
|------|------|------|
| 2025-10-17 | 初版作成 | Claude |
| 2025-10-18 | 全フェーズ実装完了を確認、進捗状況を更新 | Claude |

---

## 🔗 関連ドキュメント

- [requirements.md](./requirements.md) - 要件定義書
- [GAUGE_SPECIFICATION.md](./GAUGE_SPECIFICATION.md) - ゲージ仕様
- [ui-mockups-mobile.html](../ui-mockups-mobile.html) - デザインモックアップ
