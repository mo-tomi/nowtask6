# nowtask ドキュメント

このディレクトリには、nowtask プロジェクトの技術ドキュメントがまとまっています。進行中タスク、要件、仕様、履歴、ログなどを参照できます。

## 👩‍💻 開発者ガイド

- Codex CLI での開発ルール: [CODEX.md](../CODEX.md)
- Claude 用ガイド: [CLAUDE.md](../CLAUDE.md)
- Gemini 用ガイド: [GEMINI.md](../GEMINI.md)

## 📋 現在進行中のタスク

- [task2.md](./task2.md) - モバイルUI実装・フェーズ別計画
- [requirements.md](./requirements.md) - UI刷新の要件定義書

## 📐 仕様書

- [GAUGE_SPECIFICATION.md](./GAUGE_SPECIFICATION.md) - 24時間ゲージの詳細仕様

## 📁 サブディレクトリ

### archive/
完了したフェーズの実装レポートや完了報告書を保管します（旧 task.md、フェーズ別の実装レポート、完了サマリーなど）。

### specs/
技術仕様書と API リファレンスを保管します。
- `api_reference.md` - API リファレンス
- `development_guide.md` - 開発ガイド

### logs/
開発中のログファイルとバグ修正記録を保管します。
- デバイスログ（例: `log.txt`, `widget_log.txt`）
- バグ修正ログ（`BUGFIX_LOG.md`）
- その他ログファイル

## 🔍 ドキュメントの探し方

1. 現在のタスクを確認したい → `task2.md`
2. 要件や仕様を確認したい → `requirements.md` または `GAUGE_SPECIFICATION.md`
3. 過去の実装履歴を見たい → `archive/`
4. API仕様を確認したい → `specs/api_reference.md`
5. バグ修正履歴を見たい → `logs/BUGFIX_LOG.md`

## 📝 ドキュメント作成ルール

- タスク管理: `task2.md` を更新。フェーズ完了後は `archive/` に移動
- 新しい仕様: ルートに `XXX_SPECIFICATION.md` を作成
- 完了レポート: 作成後すぐに `archive/` に移動
- ログファイル: `logs/` ディレクトリに保管

## 🎯 現在のプロジェクト状況

- Phase: UI刷新フェーズ（モバイルモックからの実装）
- 目標: `ui-mockups-mobile.html` のデザインを Android アプリに適用
- 進行状況: 要件定義完了 → 実装計画立案中

