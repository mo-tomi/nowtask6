# 24時間ゲージ仕様書

## 概要

24時間ゲージは、1日の時間経過と予定状況を視覚的に表現するコンポーネントです。モノクロデザインの nowtask アプリケーションに統合されます。

**確定デザイン**: **24ステップ方式**（1時間＝1ブロック）

---

## デザイン仕様

### 基本構成

```
[← 今日 14:32 残り: 6時間 →]  ← ナビゲーションヘッダー
[■][■][■][■][■][■][□][□]...  ← ゲージバー（24ステップ、■=予定済み/経過、□=空き）
0:00  6:00  12:00  18:00  24:00  ← 時間表記ラベル（5点表記）
```

### ゲージヘッダー

- **構成要素**
  - 前日ボタン（‹）: 前の日に移動
  - 日付ラベル: 「今日」「明日」「昨日」または日付表示
  - 現在時刻表示: HH:MM 形式
  - 残り時間表示: 「残り: X時間」
  - 次日ボタン（›）: 次の日に移動

- **スタイル**
  - ナビゲーションボタン: 32x32px、背景 #f5f5f5、枠線 #d0d0d0
  - 日付ラベル: 14px、太字、色 #000
  - 現在時刻: 12px、色 #666
  - 残り時間: 12px、色 #666

### ゲージバー（24ステップ方式）

- **全体構成**
  - 24個のブロック（0時～23時、各1時間を表現）
  - ブロック間にギャップ: 2px
  - 現在時刻のブロックを特別なスタイルでハイライト

- **ブロックの状態と色**

  | 状態 | クラス | 色 | 意味 |
  |------|--------|-----|------|
  | 予定済み | `.gauge-step.active` | #333（ダークグレー） | タスクが予定されている時間 |
  | 空き時間 | `.gauge-step` | #e0e0e0（ライトグレー） | 予定がない時間 |
  | 現在時刻 | `.gauge-step.active.current-marker-highlight` | #f5f5f7（背景）+ #5f6368（枠線2px） | 現在時刻のブロック |

- **寸法**
  - 各ブロック高さ: 24px
  - 角丸: 4px
  - ブロック間ギャップ: 2px

---

## 時間表記パターン

ゲージの下部に表示される時間ラベルは、**5点表記（推奨）** を採用：

### 標準パターン: 5点表記（0:00, 6:00, 12:00, 18:00, 24:00）- 推奨

```
0:00          6:00          12:00         18:00         24:00
```

- **用途**: Androidアプリの標準表記（**24ステップ方式で採用**）
- **特徴**:
  - 最小限の情報で見やすさを重視
  - 24時間を4等分した主要時刻 + 終端（24:00）を表示
  - 均等配置（justify-content: space-between）
- **表記タイミング**: 0時, 6時, 12時, 18時, 24時
- **フォントサイズ**: 11px
- **フォントウェイト**: 500
- **色**: #999（ミディアムグレー）

---

### 代替パターン（参考）

以下のパターンは、特殊な要件がある場合にのみ使用を検討してください。

#### パターンA: 数字のみ（0-23）

```
0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23
```

- **用途**: 最もコンパクト。全時刻を表示したい場合
- **特徴**: 24個のラベルで視認性が低下する可能性
- **フォントサイズ**: 7-9px
- **色**: #999

#### パターンB: 3時間区切り表記

```
0:00      3:00      6:00      9:00      12:00     15:00     18:00     21:00
```

- **用途**: より詳細な時刻情報が必要な場合
- **特徴**: 8個のラベルで見やすさとのバランス
- **表記タイミング**: 0時, 3時, 6時, 9時, 12時, 15時, 18時, 21時
- **フォントサイズ**: 9px
- **色**: #999

---

## 色仕様

### ゲージのカラーパレット（24ステップ方式）

| 要素 | 色コード | 用途 |
|------|---------|------|
| 予定済みブロック | #333（ダークグレー） | タスクが予定されている時間 |
| 空きブロック | #e0e0e0（ライトグレー） | 予定がない時間 |
| 現在時刻ブロック（背景） | #f5f5f7 | 現在時刻のブロック背景 |
| 現在時刻ブロック（枠線） | #5f6368 | 現在時刻のブロック枠線（2px） |
| ラベルテキスト | #999 | 時間表記ラベルの色 |
| ゲージ枠線 | #e0e0e0 | ゲージコンテナの枠線 |

### 背景色とコンテナ

- **ゲージコンテナ背景**: #ffffff（ホワイト）
- **ボックスシャドウ**: 0 2px 8px rgba(0,0,0,0.08)
- **枠線**: 1px solid #e0e0e0
- **角丸**: 12px（コンテナ）、4px（各ブロック）

---

## レイアウト仕様

### ゲージの配置（24ステップ方式）

```
┌──────────────────────────────────────────────┐
│ [←]   今日   14:32   残り: 6時間   [→]      │ ← ヘッダー
│                                              │
│ [■][■][■][■][■][⬚][□][□]...(24ブロック)  │ ← バー（24px高）
│                                              │
│ 0:00    6:00    12:00    18:00    24:00     │ ← ラベル
└──────────────────────────────────────────────┘
```

### 間隔とパディング

- **コンテナ**:
  - パディング: 16px 20px
  - マージン下: 12px

- **ヘッダー**:
  - マージン下: 14px
  - ナビゲーションボタン間のギャップ: 12px

- **ゲージバー**:
  - 高さ: 24px（各ブロック）
  - ブロック間ギャップ: 2px
  - マージン下: 8px

- **時間ラベル**:
  - マージン上: 8px
  - パディング: 0 2px
  - フォントサイズ: 11px（5点表記）または 9px（数字のみ）

### レスポンシブ対応

- **デバイス幅**: 375px（モバイル）で設計
- **スケーリング**: フレックスボックスで自動調整
- **最小幅**: 320px
- **最大幅**: 800px（デスクトップ）

---

## 実装仕様

### HTML構造（24ステップ方式）

```html
<div class="time-gauge">
  <!-- ヘッダー -->
  <div class="time-gauge-header">
    <button class="gauge-nav-btn">‹</button>
    <div class="gauge-header-center">
      <div class="gauge-date-label">今日</div>
      <time class="current-time">14:32</time>
      <div class="remaining-tasks">残り: 6時間</div>
    </div>
    <button class="gauge-nav-btn">›</button>
  </div>

  <!-- ゲージバー本体（24ステップ） -->
  <div class="gauge-wrapper">
    <div class="gauge-bar-2">
      <!-- 0時～23時の24ブロック -->
      <div class="gauge-step"></div>
      <div class="gauge-step"></div>
      <div class="gauge-step"></div>
      <div class="gauge-step active"></div>
      <div class="gauge-step active"></div>
      <div class="gauge-step active current-marker-highlight"></div>
      <div class="gauge-step"></div>
      <!-- ... 残り18ブロック ... -->
    </div>

    <!-- 時間ラベル（5点表記） -->
    <div class="time-labels">
      <span class="time-label">0:00</span>
      <span class="time-label">6:00</span>
      <span class="time-label">12:00</span>
      <span class="time-label">18:00</span>
      <span class="time-label">24:00</span>
    </div>
  </div>
</div>
```

### CSSクラス（24ステップ方式）

| クラス | 用途 |
|--------|------|
| `.time-gauge` | ゲージ全体のコンテナ（白背景・シャドウ・枠線） |
| `.time-gauge-header` | ナビゲーションとステータス表示のヘッダー |
| `.gauge-nav-btn` | 前日/次日ナビゲーションボタン |
| `.gauge-header-center` | 日付・時刻・残り時間の中央表示エリア |
| `.gauge-date-label` | 日付ラベル（「今日」「明日」など） |
| `.current-time` | 現在時刻表示 |
| `.remaining-tasks` | 残り時間表示 |
| `.gauge-wrapper` | バーとラベルを含むラッパー |
| `.gauge-bar-2` | 24ブロックの親要素（display: flex, gap: 2px） |
| `.gauge-step` | 各1時間ブロック（空き時間：#e0e0e0） |
| `.gauge-step.active` | 予定済みブロック（#333） |
| `.gauge-step.current-marker-highlight` | 現在時刻のブロック（#f5f5f7 + 枠線#5f6368） |
| `.time-labels` | 時間表記コンテナ（justify-content: space-between） |
| `.time-label` | 個別の時間ラベル |

---

## データフォーマット

### ゲージの状態（JavaScript）

```javascript
{
  // 日付情報
  date: "2025-01-15",
  dateLabel: "今日",  // "今日", "明日", "昨日", または "1/15（水）"

  // 時刻情報
  currentTime: "14:32",
  currentHour: 14,
  currentMinute: 32,

  // タスク情報
  tasks: [
    {
      id: "task1",
      startTime: "09:00",
      endTime: "09:30",
      duration: 30,
      title: "会議の準備"
    },
    {
      id: "task2",
      startTime: "10:00",
      endTime: "11:00",
      duration: 60,
      title: "プロジェクト計画"
    }
    // ... その他のタスク
  ],

  // ゲージ表示用データ
  gauge: {
    elapsed: {
      start: 0,        // 0時
      end: 14.53,      // 14:32 = 14.53時間
      percentage: 60.5 // 24時間中の割合
    },
    scheduled: {
      start: 9,        // 9時
      end: 17,         // 17時
      duration: 8,     // 8時間
      percentage: 33.3 // 24時間中の割合
    },
    remaining: {
      hours: 6,
      display: "残り: 6時間"
    }
  }
}
```

### 時刻から位置への計算

```javascript
// 時刻（HH:MM）から percentage を計算
function timeToPercentage(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  const percentage = (totalMinutes / 1440) * 100; // 1440 = 24 * 60
  return percentage;
}

// 使用例
const currentPosition = timeToPercentage("14:32"); // 60.5%
```

---

## 使用例

### 基本的な実装例

```javascript
// ゲージデータを作成
const gaugeData = {
  date: new Date(),
  tasks: getTodayTasks(),
  currentTime: getCurrentTime()
};

// ゲージを更新
function updateGauge(data) {
  // 現在時刻の位置を計算
  const currentPercent = timeToPercentage(data.currentTime);

  // 予定時間の範囲を計算
  const scheduledRanges = calculateScheduledRanges(data.tasks);

  // DOMを更新
  document.querySelector('.time-gauge-elapsed').style.width = `${currentPercent}%`;
  document.querySelector('.time-marker').style.left = `${currentPercent}%`;
  document.querySelector('.current-time').textContent = data.currentTime;

  // 予定時間バーを描画
  scheduledRanges.forEach(range => {
    const elem = document.createElement('div');
    elem.className = 'time-gauge-scheduled';
    elem.style.left = `${range.startPercent}%`;
    elem.style.width = `${range.duration}%`;
    document.querySelector('.gauge-bar').appendChild(elem);
  });
}
```

---

## 更新履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2025-10-17 | 1.0.0 | 初版作成。4つの時間表記パターン（24ステップ方式）を定義 |
| 2025-10-17 | 2.0.0 | ~~連続バー方式に変更~~（不採用） |
| 2025-10-17 | 3.0.0 | **確定仕様**。24ステップ方式に確定。5点時刻表記（0:00, 6:00, 12:00, 18:00, 24:00）を標準化 |

---

## 参考リンク

- **モックアップファイル**: `ui-mockups-mobile.html` - 実装済みの視覚的な参考
- **実装ファイル**: `android-app/app/src/main/assets/js/gauge.js` - Androidアプリの実装コード
- **スタイルファイル**: `android-app/app/src/main/assets/style.css` - ゲージのCSS定義

---

## 補足事項

### アニメーション

- 現在時刻マーカーは1分ごとに自動更新
- 日付変更時（00:00）にゲージ全体をリセット
- ナビゲーションボタンクリック時はスムーズに遷移

### アクセシビリティ

- ナビゲーションボタンに `aria-label` を設定
- 時刻表示に `<time>` タグを使用
- 残り時間表示に `role="status"` と `aria-live="polite"` を設定
- キーボード操作対応（矢印キーで日付移動）

### パフォーマンス

- ゲージの更新は1分ごと（秒単位の更新は不要）
- DOM操作は最小限に（position と width のみ変更）
- 日付切り替え時のみ完全再描画

