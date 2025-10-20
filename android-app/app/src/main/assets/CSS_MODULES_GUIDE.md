# CSS Modules Guide (詳細分割版)

## 概要

**style.css** (97,254文字)を27個のモジュールに詳細分割しました。

- **Core Sections (1-19)**: 機能別に分割
- **Responsive Sections (20-27)**: モバイル対応を8つに分割

**合計: 27ファイル, 92,104文字 (カバー率: 94.8%)**

---

## ファイル構成

### 【基本スタイル】3ファイル

| # | ファイル | 行数 | 文字数 | 説明 |
|---|---------|------|--------|------|
| 1 | `style-01-reset-base.css` | 19 | 499 | リセット & グローバル設定 |
| 2 | `style-02-header.css` | 383 | 6,890 | ヘッダー & ナビゲーション |
| 3 | `style-03-main-content.css` | 17 | 282 | メインコンテンツエリア |

### 【ゲージ & タスク】6ファイル

| # | ファイル | 行数 | 文字数 | 説明 |
|---|---------|------|--------|------|
| 4 | `style-04-gauge-24hour.css` | 320 | 6,354 | 24時間時間ゲージ |
| 5 | `style-05-task-list.css` | 201 | 3,993 | タスクリスト基本 |
| 6 | `style-06-animations.css` | 358 | 5,930 | タスク追加/削除アニメーション |
| 7 | `style-07-empty-state.css` | 17 | 317 | 空状態メッセージ |
| 8 | `style-08-past-tasks.css` | 43 | 816 | 過去タスクセクション |
| 9 | `style-09-completed.css` | 65 | 1,123 | 完了済みセクション |

### 【UI要素】6ファイル

| # | ファイル | 行数 | 文字数 | 説明 |
|---|---------|------|--------|------|
| 10 | `style-10-fab.css` | 61 | 1,184 | フローティングアクションボタン |
| 11 | `style-11-modals.css` | 296 | 4,895 | モーダルダイアログ |
| 12 | `style-12-forms.css` | 50 | 867 | フォーム & 入力欄 |
| 13 | `style-13-timer.css` | 47 | 823 | タイマーセクション |
| 14 | `style-14-buttons.css` | 50 | 775 | ボタンスタイル |
| 15 | `style-15-subtasks.css` | 96 | 1,579 | サブタスクセクション |

### 【高度な機能】4ファイル

| # | ファイル | 行数 | 文字数 | 説明 |
|---|---------|------|--------|------|
| 16 | `style-16-search-filter.css` | 35 | 649 | 検索 & フィルター |
| 17 | `style-17-analytics.css` | 131 | 2,017 | 分析画面 |
| 18 | `style-18-calendar.css` | 67 | 1,423 | カレンダーモーダル |
| 19 | `style-19-accessibility.css` | 28 | 565 | アクセシビリティ |

### 【レスポンシブ】8ファイル

| # | ファイル | 行数 | 文字数 | 説明 |
|---|---------|------|--------|------|
| 20 | `style-20-responsive-01.css` | 366 | 7,188 | モバイル対応 Part 1 |
| 21 | `style-21-responsive-02.css` | 366 | 6,058 | モバイル対応 Part 2 |
| 22 | `style-22-responsive-03.css` | 366 | 6,212 | モバイル対応 Part 3 |
| 23 | `style-23-responsive-04.css` | 366 | 6,550 | モバイル対応 Part 4 |
| 24 | `style-24-responsive-05.css` | 366 | 6,007 | モバイル対応 Part 5 |
| 25 | `style-25-responsive-06.css` | 366 | 6,247 | モバイル対応 Part 6 |
| 26 | `style-26-responsive-07.css` | 366 | 6,404 | モバイル対応 Part 7 |
| 27 | `style-27-responsive-08.css` | 370 | 6,457 | モバイル対応 Part 8 |

---

## ロード順序

HTMLファイルで以下の順序でCSSを読み込んでください：

```html
<!-- 基本スタイル（必須） -->
<link rel="stylesheet" href="css/style-01-reset-base.css">
<link rel="stylesheet" href="css/style-02-header.css">
<link rel="stylesheet" href="css/style-03-main-content.css">

<!-- ゲージ & タスク -->
<link rel="stylesheet" href="css/style-04-gauge-24hour.css">
<link rel="stylesheet" href="css/style-05-task-list.css">
<link rel="stylesheet" href="css/style-06-animations.css">
<link rel="stylesheet" href="css/style-07-empty-state.css">
<link rel="stylesheet" href="css/style-08-past-tasks.css">
<link rel="stylesheet" href="css/style-09-completed.css">

<!-- UI要素 -->
<link rel="stylesheet" href="css/style-10-fab.css">
<link rel="stylesheet" href="css/style-11-modals.css">
<link rel="stylesheet" href="css/style-12-forms.css">
<link rel="stylesheet" href="css/style-13-timer.css">
<link rel="stylesheet" href="css/style-14-buttons.css">
<link rel="stylesheet" href="css/style-15-subtasks.css">

<!-- 高度な機能 -->
<link rel="stylesheet" href="css/style-16-search-filter.css">
<link rel="stylesheet" href="css/style-17-analytics.css">
<link rel="stylesheet" href="css/style-18-calendar.css">
<link rel="stylesheet" href="css/style-19-accessibility.css">

<!-- レスポンシブ（最後に読み込み） -->
<link rel="stylesheet" href="css/style-20-responsive-01.css">
<link rel="stylesheet" href="css/style-21-responsive-02.css">
<link rel="stylesheet" href="css/style-22-responsive-03.css">
<link rel="stylesheet" href="css/style-23-responsive-04.css">
<link rel="stylesheet" href="css/style-24-responsive-05.css">
<link rel="stylesheet" href="css/style-25-responsive-06.css">
<link rel="stylesheet" href="css/style-26-responsive-07.css">
<link rel="stylesheet" href="css/style-27-responsive-08.css">
```

---

## サイズ統計

| セクション | ファイル数 | 合計文字数 | 割合 |
|-----------|-----------|----------|------|
| 基本スタイル | 3 | 7,671 | 8.3% |
| ゲージ & タスク | 6 | 18,533 | 20.1% |
| UI要素 | 6 | 9,323 | 10.1% |
| 高度な機能 | 4 | 4,654 | 5.1% |
| レスポンシブ | 8 | 51,123 | 55.5% |
| **合計** | **27** | **92,104** | **100%** |

---

## 依存関係

### ロード依存関係
- **基本スタイル**は常に最初に読み込む
- **ゲージ & タスク**は基本スタイルの後
- **UI要素**はゲージ & タスクの後
- **レスポンシブ**は最後（後から読み込む方が優先順位が高い）

### マルチメディアクエリ
- レスポンシブセクション（20-27）に `@media` クエリが含まれます
- モバイルデバイス対応は自動的に適用されます

---

## 更新フロー

特定の機能を更新する場合：

1. **ヘッダーを変更** → `style-02-header.css`を編集
2. **タスクリスト機能を変更** → `style-05-task-list.css`または`style-06-animations.css`を編集
3. **モバイル対応を変更** → `style-20～27-responsive-*.css`を編集
4. **新機能を追加** → 関連するモジュールを編集またはファイルを追加

---

## パフォーマンス最適化

### ファイルサイズ削減案
1. **不要なセクション削除**: 使用していないセクション（例: `style-16-search-filter.css`）は削除可能
2. **CSS圧縮ツール**: 本番環境では minification ツール（sass, postcss等）で圧縮推奨
3. **条件付きロード**: JavaScriptで必要に応じてCSSを動的に読み込み

### 推奨される本番ビルド

```bash
# すべてのCSSを1つにバンドル & 圧縮
sass style-*.css --style compressed > dist/style.min.css
```

---

## トラブルシューティング

### スタイルが反映されない場合
1. ロード順序を確認（レスポンシブは最後）
2. ブラウザキャッシュをクリア
3. コンソールエラーを確認

### 競合が発生した場合
1. 詳細度（specificity）の高いセレクタを確認
2. `!important`の使用を避ける
3. レスポンシブセクションで上書きされていないか確認

---

## マイグレーション

元のモノリシック `style.css` から移行する手順：

```bash
# 1. 古いファイルをバックアップ
cp style.css style.css.backup

# 2. 新しいモジュールファイルをHTMLで読み込み開始
# (HTMLの<link>タグを上記のロード順序に従って追加)

# 3. 本番環境で動作確認

# 4. 元のstyle.cssは削除可能
rm style.css
```

---

## バージョン管理

| バージョン | 日付 | 変更内容 |
|-----------|------|--------|
| 1.0 | 2025-10-21 | 詳細分割版（27ファイル）を生成 |

---

## 関連ドキュメント

- **README_MODULES.md** - JavaScriptモジュール分割ガイド
- **PROJECT_SUMMARY.md** - プロジェクト全体概要

---

## サポート

このガイドについて質問がある場合：
1. ファイルメタコメントを確認
2. コンソール出力を確認
3. GitHubのissueを作成

---

**生成日**: 2025-10-21
**生成ツール**: Claude Code
**言語**: 日本語
