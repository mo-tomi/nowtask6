# 📱 nowtask Androidアプリ プロジェクト概要

## 🎯 このプロジェクトについて

このプロジェクトは、nowtask（https://xn--0g3kz3aenxsj648k.com/）をAndroidアプリとして動作させるためのWebViewラッパーアプリです。

### 主な機能
- ✅ スプラッシュ画面（2秒間）
- ✅ WebViewでnowtaskを表示
- ✅ アプリ内でページ遷移（外部ブラウザに飛ばない）
- ✅ 戻るボタンで前のページに戻る
- ✅ オフライン検知とエラー表示
- ✅ AdMobバナー広告（画面下部）
- ✅ Firebase Analytics統合

---

## 📁 ファイル構成

```
android-app/
├── app/
│   ├── build.gradle                          # アプリの依存関係とビルド設定
│   ├── google-services.json                  # Firebaseの設定ファイル（要ダウンロード）
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml           # アプリの基本設定（権限、AdMob App ID）
│           ├── java/com/nowtask/app/
│           │   └── MainActivity.kt           # メインのKotlinコード
│           └── res/
│               ├── layout/
│               │   └── activity_main.xml     # UIレイアウト（WebView、広告、スプラッシュ）
│               └── values/
│                   └── strings.xml           # アプリ名などの文字列リソース
├── build.gradle                              # プロジェクト全体の設定
├── settings.gradle                           # プロジェクト構造の定義
├── README.md                                 # 詳細セットアップガイド
├── QUICK_START.md                            # クイックスタートガイド
└── PLAYSTORE_CHECKLIST.md                    # Play Store公開チェックリスト
```

---

## 🚀 使い方

### 初心者向け
1. **まず読む**: `QUICK_START.md` - 最速で動かす方法
2. **詳細**: `README.md` - 詳しい設定手順とトラブルシューティング
3. **公開準備**: `PLAYSTORE_CHECKLIST.md` - Play Storeで公開する方法

### 経験者向け
1. Android Studioで`android-app`フォルダを開く
2. Firebaseから`google-services.json`をダウンロードして`app/`に配置
3. AdMobで広告ユニットを作成し、IDを`AndroidManifest.xml`と`activity_main.xml`に記入
4. ビルド＆実行

---

## ⚙️ 設定が必要な項目

### 必須設定

#### 1. Firebase設定
- [ ] Firebaseプロジェクトを作成
- [ ] `google-services.json`をダウンロード
- [ ] `app/`フォルダに配置

#### 2. AdMob設定
- [ ] AdMobアカウントを作成
- [ ] アプリを追加してApp IDを取得
- [ ] `AndroidManifest.xml`のApp IDを書き換え
- [ ] バナー広告ユニットを作成
- [ ] `activity_main.xml`の広告ユニットIDを書き換え

### 推奨設定（公開時）

#### 3. パッケージ名の変更
- [ ] `app/build.gradle`の`applicationId`を変更
- [ ] `AndroidManifest.xml`の`package`を変更

#### 4. アプリアイコンの設定
- [ ] Android StudioのImage Assetツールでアイコンを作成

#### 5. バージョン情報
- [ ] `app/build.gradle`の`versionCode`と`versionName`を設定

---

## 🔑 重要なファイルの説明

### MainActivity.kt
**役割**: アプリのメインロジック

**主な機能**:
```kotlin
// WebViewの設定
- JavaScript有効化
- localStorage有効化
- アプリ内でページ遷移

// 広告の読み込み
- AdMob初期化
- バナー広告表示

// Firebase Analytics
- アプリ起動イベント
- ページ遷移イベント
- 戻るボタンイベント

// ネットワーク検知
- オフライン時のエラー表示
```

### activity_main.xml
**役割**: UIレイアウト

**構成**:
```xml
RelativeLayout
├── WebView（メインコンテンツ）
├── SplashView（起動時のスプラッシュ画面）
└── AdView（画面下部のバナー広告）
```

### AndroidManifest.xml
**役割**: アプリの基本設定

**重要な設定**:
```xml
- INTERNET権限
- ACCESS_NETWORK_STATE権限
- AdMob App ID（meta-data）
- 画面の向き（portrait固定）
```

### build.gradle（app）
**役割**: 依存関係とビルド設定

**主な依存関係**:
```gradle
- Firebase BoM
- Firebase Analytics
- AdMob（play-services-ads）
- Kotlin標準ライブラリ
- AndroidX
```

---

## 🛠️ 技術スタック

### 言語
- **Kotlin** 1.8.0

### フレームワーク
- **Android SDK** (minSdk 24, targetSdk 33)
  - Android 7.0以上をサポート

### ライブラリ
- **AndroidX**: 最新のAndroidサポートライブラリ
- **WebView**: Webコンテンツの表示
- **Firebase Analytics**: ユーザー行動分析
- **Google Mobile Ads SDK**: AdMob広告表示

### ビルドツール
- **Gradle** 8.0.2
- **Android Gradle Plugin** 8.0.2

---

## 📊 Firebase Analyticsで記録されるイベント

### 自動イベント
- アプリ起動
- アプリ終了
- セッション時間

### カスタムイベント（実装済み）
```kotlin
1. app_opened
   - page: "main"

2. page_view
   - url: 遷移先のURL

3. back_pressed
   - action: "webview_back"
```

### Firebase Consoleで見られるデータ
- アクティブユーザー数
- ユーザーの地域
- デバイス情報
- アプリのバージョン
- セッション時間

---

## 💰 AdMobの設定

### 現在の広告タイプ
- **バナー広告**: 画面下部に常時表示

### テスト広告ID（開発用）
```
App ID: ca-app-pub-3940256099942544~3347511713
広告ユニットID: ca-app-pub-3940256099942544/6300978111
```

⚠️ **本番リリース前に必ず自分のIDに変更してください**

### 収益化のポイント
- バナー広告の位置を最適化
- クリック率（CTR）を確認
- 将来的にインタースティシャル広告の追加を検討

---

## 🔒 セキュリティとプライバシー

### 収集するデータ
1. **Firebase Analytics**
   - 匿名の使用統計
   - デバイス情報
   - 地域情報

2. **AdMob**
   - 広告表示のための匿名データ
   - 興味関心カテゴリ

### ユーザーへの開示
- Play Storeの「データの安全性」セクションで開示必要
- プライバシーポリシーの作成が必須

---

## 🐛 よくある問題と解決方法

### 問題1: ビルドエラー
**症状**: Gradleの同期に失敗
**解決**:
- インターネット接続を確認
- Android Studioを再起動
- `File` → `Invalidate Caches / Restart`

### 問題2: google-services.jsonエラー
**症状**: `google-services.json が見つかりません`
**解決**:
- ファイルが`app/`直下にあるか確認
- ファイル名が正確か確認（スペース等）

### 問題3: 広告が表示されない
**症状**: AdViewが空白
**解決**:
- テスト広告IDを使用
- インターネット接続を確認
- AdMobでアプリが承認されるまで待つ（数時間〜数日）

### 問題4: WebViewが真っ白
**症状**: ページが表示されない
**解決**:
- `INTERNET`権限があるか確認
- URLが正しいか確認
- LogCatでエラーを確認

---

## 📈 次のステップ

### 短期目標（1週間）
- [ ] Firebase Analyticsでアクセスを計測
- [ ] AdMobで広告を表示
- [ ] 友人にテストしてもらう

### 中期目標（1ヶ月）
- [ ] Play Storeで公開
- [ ] ユーザーフィードバックを収集
- [ ] 初回アップデート

### 長期目標（3ヶ月〜）
- [ ] ユーザー数100人達成
- [ ] 広告最適化でCTR向上
- [ ] 新機能の追加検討
- [ ] インタースティシャル広告の導入

---

## 🎓 学習リソース

### Android開発
- **公式ドキュメント**: https://developer.android.com/
- **Kotlinガイド**: https://kotlinlang.org/docs/home.html

### Firebase
- **Firebase Console**: https://console.firebase.google.com/
- **ドキュメント**: https://firebase.google.com/docs

### AdMob
- **AdMob Console**: https://admob.google.com/
- **ポリシー**: https://support.google.com/admob/answer/6128543

---

## 📞 サポート

### 問題が解決しない場合
1. LogCatでエラーメッセージを確認
2. エラーメッセージでGoogle検索
3. Stack Overflowで質問
4. Android開発者コミュニティで質問

### 便利なツール
- **Logcat**: Android Studio下部の「Logcat」タブ
- **Device Manager**: エミュレータ管理
- **Profiler**: パフォーマンス分析

---

## ✅ チェックリスト

### 開発環境セットアップ
- [ ] Android Studioインストール済み
- [ ] プロジェクトをAndroid Studioで開いた
- [ ] Gradle同期が成功した

### Firebase設定
- [ ] Firebaseプロジェクト作成済み
- [ ] google-services.jsonダウンロード済み
- [ ] google-services.jsonを配置済み

### AdMob設定
- [ ] AdMobアカウント作成済み
- [ ] App ID取得済み
- [ ] 広告ユニットID取得済み
- [ ] AndroidManifest.xmlに記入済み
- [ ] activity_main.xmlに記入済み

### テスト
- [ ] エミュレータまたは実機で起動確認
- [ ] スプラッシュ画面が表示される
- [ ] Webサイトが正しく表示される
- [ ] 戻るボタンが動作する
- [ ] 広告が表示される

### 公開準備（任意）
- [ ] パッケージ名を変更した
- [ ] アプリアイコンを設定した
- [ ] プライバシーポリシーを用意した
- [ ] Play Console開発者登録済み

---

## 🎉 おめでとうございます！

このプロジェクトを使えば、nowtaskを手軽にAndroidアプリとして配信できます。

質問や問題があれば、各ドキュメント（README.md、QUICK_START.md、PLAYSTORE_CHECKLIST.md）を参照してください。

Good luck! 🚀
