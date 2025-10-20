# GEMINI.md: nowtask プロジェクトガイド (Android版)

## 重要: 関連ドキュメント

このプロジェクトの現在の開発計画とタスクリストは、`docs/task.md`で管理されています。開発を進める際は、まずそちらのドキュメントを確認してください。

---

## 1. プロジェクト概要

**nowtask**は、モノクロデザインを特徴とするシンプルなタスク管理アプリケーションです。このプロジェクトは現在、**Androidネイティブアプリ開発に完全に移行**しており、PWA（Progressive Web App）としての開発は終了しました。

- **プロジェクトの現状:** Androidアプリ開発に注力
- **Android App:**
  - **目的:** `android-app`ディレクトリにあるこのアプリは、元々はPWA版のWebサイトをWebViewで表示するためのラッパーでしたが、今後はAndroidネイティブアプリとして独立して機能開発を行います。
  - **技術スタック:** Kotlin, Gradle, Android SDK
  - **主要機能:** WebViewによるコンテンツ表示、AdMob広告、Firebase Analytics

## 2. ビルドと実行

### Android App

Androidアプリは、`android-app`ディレクトリ内の標準的なGradleプロジェクトです。

1.  **Android Studioで開く:**
    Android Studioを起動し、「Open an Existing Project」から `android-app` ディレクトリを選択します。
2.  **Firebase設定:**
    Firebaseコンソールから `google-services.json` ファイルをダウンロードし、`android-app/app/` ディレクトリに配置する必要があります。
3.  **ビルドと実行:**
    Android Studioの `Run 'app'` ボタン、またはターミナルから以下のGradleコマンドを実行します。
    ```shell
    # android-app ディレクトリに移動
    cd android-app

    # デバッグビルドを実行
    ./gradlew assembleDebug

    # デバイスにインストール
    ./gradlew installDebug
    ```
    詳細は `android-app/QUICK_START.md` を参照してください。

## 3. 開発規約とコード構成

### Android (Kotlin)

- `MainActivity.kt` が唯一のActivityであり、WebViewのセットアップ、広告の初期化、Firebase Analyticsのイベント送信など、アプリのロジックを担っています。
- UIレイアウトは `activity_main.xml` で定義されています。
- 詳細なドキュメントが `android-app` ディレクトリ内に豊富に用意されています (`PROJECT_SUMMARY.md`, `README.md` など)。開発を始める前にこれらを読むことが強く推奨されます。

## 4. デバッグとログ確認

### Android端末でのテスト時の手順

Android端末やエミュレータでアプリの動作確認を行う際は、以下の手順に従ってください：

1. **logcatでログを監視**
   ```bash
   adb logcat -c  # ログをクリア
   adb logcat > docs/log.txt  # ログをファイルに保存
   ```

   または、特定のタグだけを監視：
   ```bash
   adb logcat | grep -E "MainActivity|AndroidAuth|FirestoreBridge|WebView"
   ```

2. **アプリで動作確認後、必ずログを確認**
   - ログは `docs/log.txt` に保存されます
   - **重要**: 動作確認後は必ず `docs/log.txt` の内容を確認してください
   - エラーや警告が出ていないかチェックし、問題があれば報告してください

3. **特に確認すべきログ**
   - `MainActivity`: 認証フロー、Google Sign-In の結果
   - `AndroidAuth`: ログイン/ログアウトの処理
   - `FirestoreBridge`: データの保存/読み込み
   - `WebView`: JavaScriptコンソール出力、エラー
   - `E/` または `W/` で始まる行: エラーと警告

4. **ログの報告方法**
   - 問題が発生した場合は、`docs/log.txt` に関連するログを貼り付けてください
   - 「ログを確認してください」と言われたら、`docs/log.txt` を開いて内容を共有してください

## 5. 主要機能の説明

### 5.1 ルーティン機能

ルーティン機能を使用すると、毎日または特定期間に繰り返すタスクを自動生成できます。

#### 使い方

1. **設定画面を開く**
   - アプリ右上の設定アイコン（⚙️）をタップ

2. **ルーティンを追加**
   - 「＋ルーティン追加」ボタンをタップ
   - ルーティン名と所要時間を入力

3. **詳細設定（オプション）**
   - 時刻設定ボタン（⏰）をタップすると詳細設定が開きます
   - **UI設計**: 全ての設定項目は右スクロールなしで1画面に収まるよう縦並びレイアウトで設計されています
   - **開始時刻**: タスクの開始予定時刻
   - **終了時刻**: タスクの終了予定時刻
   - **緊急**: 緊急フラグをONにすると、タスクが赤く表示されます
   - **優先順位**: 高・中・低から選択可能
   - **期間設定**:
     - **期日なし（毎日）**: 過去7日 + 今日 + 未来14日（計22日分）のタスクを自動生成（デフォルト）
     - **期間設定**: 開始日と終了日を指定すると、その期間だけタスクを生成

4. **保存**
   - 「保存」ボタンをタップすると、ルーティンが保存されます
   - 既に登録されている未完了のルーティンタスクにも変更が反映されます
   - 新規のタスクが自動的に生成されます

#### パフォーマンス最適化

- **期日なしモード**: 無限にタスクを生成すると重くなるため、22日分のみ生成
- **重複チェック**: 同じ日に同じルーティンタスクが複数作成されるのを防止
- **既存タスク更新**: ルーティン設定を変更すると、未完了タスクのみ更新（完了済みは保持）

#### データ構造

ルーティンデータは以下の構造で保存されます：

```javascript
{
  id: "uuid",                    // 一意のID
  name: "朝のランニング",         // ルーティン名
  duration: 30,                  // 所要時間（分）
  startTime: "07:00",            // 開始時刻（オプション）
  endTime: "07:30",              // 終了時刻（オプション）
  urgent: false,                 // 緊急フラグ
  priority: "high",              // 優先順位 (high/medium/low/'')
  dateRange: {                   // 期間設定
    type: "none",                // 'none' = 期日なし, 'period' = 期間設定
    startDate: null,             // 開始日（type='period'の場合のみ）
    endDate: null                // 終了日（type='period'の場合のみ）
  }
}
```

#### 関連ファイル

- **タスク生成ロジック**: `android-app/app/src/main/assets/js/tasks.js`
  - `createRoutineTasks()`: ルーティンタスクの一括生成
  - `createRoutineTaskForDate()`: 指定日のタスク生成
  - `updateRoutineTasks()`: 既存タスクへの変更反映
- **UI**: `android-app/app/src/main/assets/js/modals.js`
  - `renderRoutinesList()`: ルーティン設定画面の描画
  - `saveSettings()`: ルーティン保存処理