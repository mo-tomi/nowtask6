# CODEX.md: nowtask プロジェクト用 Codex CLI ガイド

本ドキュメントは、Codex CLI を用いて nowtask リポジトリで作業する際のルールと手順をまとめたものです。既存機能を壊さず、段階的に UI を刷新しつつ、最小差分で保守性を高めることを目的とします。

## 1. 目的と原則
- 既存機能の維持: 機能は100%維持。UI刷新は段階導入。
- 最小差分: 変更は局所的に。命名や構造は既存スタイルに倣う。
- 文書整合: 仕様・計画（docs/requirements.md, docs/GAUGE_SPECIFICATION.md, docs/task2.md）に従う。
- 並走と後方互換: 既存 `style.css` は残し、新規は `css/style-base.css` と `css/style-components.css` を併用。新規クラスは `.new-` 接頭辞。
- 日本語で簡潔: 回答・コミットメッセージ（必要な場合）は簡潔な日本語で。

## 2. 着手前チェック
- 仕様/計画: `docs/requirements.md`, `docs/GAUGE_SPECIFICATION.md`, `docs/task2.md`, `docs/README.md`
- 中核ファイル: `index.html`, `style.css`, `css/*.css`, `js/*.js`, `manifest.json`, `sw.js`
- Android ラッパー: `android-app/`（Web資産同梱前提）。旧版は `OLD/` 直下に保管。原則触らない。
- もし `AGENTS.md` が存在する場合は当該スコープの指示を最優先で遵守。

## 3. 作業フロー（Codex CLI）
- 進め方の宣言: 実行前に1–2文でプレアンブル（何を・なぜ）。
- プラン運用: 複数工程は `update_plan` で管理。常に1ステップのみ `in_progress`。
- 検索の基本: `rg --files -uu` と `rg -n <pattern>`。出力閲覧は最大250行単位。
- 変更適用: `apply_patch` を小さく分けて安全に。不要なリネーム/再配置は禁止。
- 表現ルール: 日本語・簡潔・箇条書き中心。ファイル参照は相対パス+行指定（例: `js/ui-main.js:12`）。
- 権限とネットワーク: 書込/ネットが必要な操作は承認を取りつつ実行（サンドボックス設定に依存）。

## 4. 実装ポリシー
- JavaScript スタイル: 既存に合わせる。1文字変数は避け、冗長な抽象化はしない。
- UI/アクセシビリティ: `aria-*` 属性やキーボード操作は既存同等以上を維持。
- データ保存: `js/core.js` の `STORAGE_KEYS` に集約。`saveToStorage`/`loadFromStorage` 経由でアクセス。
- Firebase: `js/firebase-init.js` による匿名認証/Firestore 同期は非同期前提。失敗時は LocalStorage のみで継続。
- 外部依存: 新規ライブラリ追加やビルドツール変更は禁止（合意がある場合を除く）。

## 5. UI 刷新の進め方（抜粋）
- Phase 1: CSS 基盤
  - `css/style-base.css`: CSS 変数/リセット/ユーティリティ。
  - `css/style-components.css`: ヘッダー/カード/ラベル等の新スタイル。
  - `index.html` で読み込み順は `style-base.css` → `style-components.css` → 既存 `style.css`。
- Phase 2: ヘッダー刷新
  - `.header` は残したまま `.new-header` を直後に追加可能。
  - `js/events.js` で新ボタン → 既存ボタンへイベントフォワード。
  - UI 切替は `localStorage('ui-version')` 等のフラグで制御（'old'/'new'）。
- 24時間ゲージ
  - `js/gauge.js` の API/イベントは維持。見た目変更は CSS 優先。

## 6. バリデーション
- 手動確認: ヘッダー操作、タスク CRUD、クイック追加、テンプレート、モーダル、ゲージ日付遷移/現在時刻更新、完了折りたたみ。
- ローカル起動:
  - `python -m http.server 8000` で `http://localhost:8000/index.html`
  - Service Worker のため HTTP 配信推奨。
- ロールバック: 新旧 UI 並存期間を保ち、切替フラグで即時復帰可能に保つ。

## 7. 禁止・注意
- 無関係な大規模リファクタやファイル再配置。
- 仕様外の機能追加・削除。
- Android 側の依存追加や設定変更（別タスクで合意の上で対応）。
- 外部ネットワーク呼び出しの新規追加。

## 8. 主要ファイル（目安）
- エントリ: `index.html`, `manifest.json`, `sw.js`
- スタイル: `style.css`, `css/style-base.css`, `css/style-components.css`
- ロジック: `js/core.js`, `js/tasks.js`, `js/render.js`, `js/modals.js`, `js/gauge.js`, `js/analytics.js`, `js/overload.js`, `js/share.js`, `js/calendar.js`, `js/templates.js`, `js/events.js`, `js/ui-main.js`, `js/migration.js`
- ドキュメント: `docs/requirements.md`, `docs/GAUGE_SPECIFICATION.md`, `docs/task2.md`, `docs/README.md`
- Android: `android-app/`（WebView 同梱/Analytics/AdMob）

## 9. トラブルシューティング
- 文字化けドキュメント: 参照時は文脈から判断。修正は別コミット/PRで提案。
- Firebase 不可時: LocalStorage のみで動作継続可能であることを担保。
- 出力制限: 大きなファイルの閲覧は 250 行区切り。検索は ripgrep を優先。

## 10. コミュニケーション
- 進捗共有: 8–12語程度の短いアップデート。
- 次の一手: 「何を」「なぜ」を先に示す（例: 「ヘッダーCSSを追加します」）。

