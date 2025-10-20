# nowtask

モノクロデザインのシンプルなタスク管理アプリです。PWA として動作し、ローカル保存（必要に応じて Firebase 同期）に対応。Android プロジェクトから同梱して配布できます。

## クイックスタート（ローカル表示）

静的サイトのため、HTTP で配信してブラウザで `index.html` を開きます。

- Python: `python -m http.server 8000` → `http://localhost:8000/index.html`
- Node: `npx http-server .` または `npx serve .`

Service Worker の都合で `file://` ではなく HTTP 配信を推奨します。

## 開発者ガイド

- Codex CLI 用ルール: [CODEX.md](CODEX.md)
- ドキュメント目次: [docs/README.md](docs/README.md)
- Claude 用ガイド: [CLAUDE.md](CLAUDE.md)
- Gemini 用ガイド: [GEMINI.md](GEMINI.md)

## Android アプリ

`android-app/` に Android Studio 用プロジェクトがあります。セットアップ手順は以下を参照してください。

- クイックスタート: `android-app/QUICK_START.md`
- ガイド: `android-app/README.md`, `android-app/PROJECT_SUMMARY.md`

## ライセンス

このリポジトリのライセンス表記がある場合はそれに従います。未定義の場合はオーナーに確認してください。
