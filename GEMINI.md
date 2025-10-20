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