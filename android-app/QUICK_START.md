# 🚀 クイックスタートガイド（シンプル版）

広告もFirebaseも不要！LocalStorageを使ったシンプルなWebViewアプリです。

---

## 📝 必要な環境

- Android Studio（最新版推奨）
- Androidスマートフォンまたはエミュレータ

---

## ✅ ステップ1: Android Studioで開く

1. Android Studioを起動
2. 「Open」→ `android-app`フォルダを選択
3. Gradle同期が自動で開始されるので完了を待つ（初回は時間がかかる場合があります）

---

## ✅ ステップ2: 実行

### 実機で実行する場合:
1. スマホの「開発者向けオプション」を有効化
2. 「USBデバッグ」をONにする
3. USBケーブルでPCと接続
4. Android Studio上部の再生ボタン（▶）をクリック
5. 接続されたデバイスを選択

### エミュレータで実行する場合:
1. Android Studio上部の「Device Manager」を開く
2. 新しいデバイスを作成（推奨: Pixel 6 / API 33）
3. 再生ボタン（▶）をクリック
4. エミュレータを選択

---

## 🎯 アプリの機能

- nowtaskのWebサイトをWebViewで表示
- LocalStorage完全対応（データはアプリ内に保存）
- 戻るボタンでページ戻る機能
- スプラッシュ画面付き
- オフライン時のエラー表示

---

## 📁 ファイル構成

```
android-app/
├── app/
│   ├── build.gradle              ← 依存関係（広告・Firebase削除済み）
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml    ← アプリ設定
│           ├── java/com/nowtask/app/
│           │   └── MainActivity.kt    ← メインコード
│           └── res/
│               └── layout/
│                   └── activity_main.xml  ← レイアウト
└── build.gradle                  ← プロジェクト設定
```

---

## 💡 困ったときは

### Gradle同期エラー
→ Android Studioを再起動してください

### アプリが起動しない
→ LogCatを確認（Android Studio下部の「Logcat」タブ）

### WebViewが真っ白
→ インターネット接続を確認してください

---

## 🔧 カスタマイズ

### URLを変更したい場合:
`MainActivity.kt`の22行目を編集:
```kotlin
private val NOWTASK_URL = "https://your-url.com/"
```

### アプリ名を変更したい場合:
`app/src/main/res/values/strings.xml`を編集

---

完成です！🎉
