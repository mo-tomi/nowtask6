# nowtask Androidアプリ セットアップガイド

このガイドでは、nowtaskをAndroidアプリとして動かすための手順を、初心者の方でもわかるように説明します。

---

## 📋 必要なもの

1. **Android Studio**（最新版を推奨）
   - ダウンロード: https://developer.android.com/studio

2. **Googleアカウント**（FirebaseとAdMobの登録に必要）

3. **実機またはエミュレータ**（テスト用）

---

## 🚀 ステップ1: Android Studioでプロジェクトを開く

### 1-1. Android Studioを起動

### 1-2. 「Open」を選択し、`android-app`フォルダを開く

### 1-3. Gradleの同期を待つ
- 自動的に依存関係のダウンロードが始まります
- 「Sync Now」と表示されたらクリック
- 初回は10〜20分かかることがあります

---

## 🔥 ステップ2: Firebase Analyticsの設定

### 2-1. Firebaseプロジェクトを作成

1. **Firebase Consoleにアクセス**
   - https://console.firebase.google.com/
   - Googleアカウントでログイン

2. **「プロジェクトを追加」をクリック**

3. **プロジェクト名を入力**
   - 例: `nowtask-app`

4. **Google アナリティクスを有効にする**
   - 「続行」をクリック
   - アナリティクスの地域を「日本」に設定
   - 利用規約に同意して「プロジェクトを作成」

### 2-2. AndroidアプリをFirebaseに追加

1. **Firebaseのプロジェクトページで「Android」アイコンをクリック**

2. **パッケージ名を入力**
   - `com.nowtask.app`
   - （変更する場合は、`app/build.gradle`の`applicationId`も変更）

3. **アプリのニックネーム**
   - 例: `nowtask`（任意）

4. **デバッグ署名証明書SHA-1**
   - 今は空欄でOK（後で追加可能）

5. **「アプリを登録」をクリック**

### 2-3. google-services.jsonをダウンロード

1. **`google-services.json`ファイルをダウンロード**

2. **ファイルを`app`フォルダに配置**
   ```
   android-app/
   └── app/
       ├── build.gradle
       ├── google-services.json  ← ここに配置
       └── src/
   ```

3. **Android Studioでプロジェクトを再同期**
   - メニュー: `File` → `Sync Project with Gradle Files`

### 2-4. 完了確認

- Firebase Consoleで「次へ」→「コンソールに移動」
- これでFirebase Analyticsの設定は完了です！

---

## 💰 ステップ3: AdMobの設定

### 3-1. AdMobアカウントを作成

1. **AdMobにアクセス**
   - https://admob.google.com/
   - Googleアカウントでログイン

2. **「開始する」をクリック**

3. **アカウント情報を入力**
   - 国: 日本
   - タイムゾーン: (UTC+09:00) 東京
   - 支払い通貨: 日本円（JPY）

### 3-2. アプリを追加

1. **「アプリ」→「アプリを追加」をクリック**

2. **「アプリはすでに公開されていますか?」**
   - 「いいえ」を選択

3. **プラットフォーム**
   - 「Android」を選択

4. **アプリ名**
   - `nowtask`と入力

5. **「アプリを追加」をクリック**

### 3-3. AdMob App IDをコピー

1. **アプリ設定ページで「App ID」をコピー**
   - 形式: `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`

2. **`AndroidManifest.xml`を開く**
   - パス: `app/src/main/AndroidManifest.xml`

3. **以下の部分を自分のApp IDに書き換える**
   ```xml
   <meta-data
       android:name="com.google.android.gms.ads.APPLICATION_ID"
       android:value="ca-app-pub-3940256099942544~3347511713" />
   ```
   ↓
   ```xml
   <meta-data
       android:name="com.google.android.gms.ads.APPLICATION_ID"
       android:value="ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY" />
   ```

### 3-4. バナー広告ユニットを作成

1. **AdMobで「広告ユニット」→「広告ユニットを作成」をクリック**

2. **「バナー」を選択**

3. **広告ユニット名**
   - 例: `nowtask_banner`

4. **「広告ユニットを作成」をクリック**

5. **「広告ユニットID」をコピー**
   - 形式: `ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ`

6. **`activity_main.xml`を開く**
   - パス: `app/src/main/res/layout/activity_main.xml`

7. **以下の部分を自分の広告ユニットIDに書き換える**
   ```xml
   <com.google.android.gms.ads.AdView
       android:id="@+id/adView"
       ...
       ads:adUnitId="ca-app-pub-3940256099942544/6300978111" />
   ```
   ↓
   ```xml
   <com.google.android.gms.ads.AdView
       android:id="@+id/adView"
       ...
       ads:adUnitId="ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ" />
   ```

### 3-5. テスト広告について

- 開発中はテスト用の広告IDを使用することをおすすめします
- 本番公開時に自分の広告IDに変更してください
- **重要**: 自分のアプリで自分の広告をクリックしないでください（アカウント停止のリスクあり）

---

## 🔨 ステップ4: ビルドと実行

### 4-1. エミュレータまたは実機を準備

**エミュレータの場合:**
- メニュー: `Tools` → `Device Manager`
- 「Create Device」でエミュレータを作成
- Pixel 5などのデバイスを推奨

**実機の場合:**
1. スマホの「設定」→「開発者向けオプション」を有効化
   - 「ビルド番号」を7回タップ
2. 「USBデバッグ」を有効化
3. USBケーブルでPCと接続

### 4-2. アプリを実行

1. **ツールバーの再生ボタン（▶）をクリック**

2. **デバイスを選択して「OK」**

3. **ビルドが完了すると、アプリが起動します！**

---

## ✅ 動作確認チェックリスト

- [ ] スプラッシュ画面が2秒間表示される
- [ ] nowtaskのWebサイトが表示される
- [ ] ページ内のリンクをタップしても、アプリ内で開く
- [ ] 戻るボタンで前のページに戻れる
- [ ] 画面下部にバナー広告が表示される
- [ ] オフライン時に「ネットワークに接続できません」と表示される

---

## 📱 Play Storeで公開するための最低限の設定

### 1. パッケージ名の変更（推奨）

**`app/build.gradle`を開いて、以下を変更:**
```gradle
defaultConfig {
    applicationId "com.nowtask.app" // ← ここを変更
    // 例: applicationId "com.yourname.nowtask"
}
```

**パッケージ名を変更したら:**
- `AndroidManifest.xml`の`package`属性も同じ名前に変更
- Firebaseの設定で再度パッケージ名を登録
- AdMobでも新しいパッケージ名でアプリを追加

### 2. アプリアイコンの設定

1. **アイコン画像を準備**
   - 推奨サイズ: 512x512px（PNG形式）
   - 背景は透過または単色

2. **Image Assetツールを使う**
   - Android Studioで右クリック: `app` → `New` → `Image Asset`
   - 「Launcher Icons」を選択
   - 画像をアップロード
   - 「Next」→「Finish」

3. **自動的に各サイズのアイコンが生成されます**
   - `res/mipmap-*/ic_launcher.png`

### 3. バージョン管理

**`app/build.gradle`で管理:**
```gradle
defaultConfig {
    versionCode 1      // ← アップデートごとに数字を増やす
    versionName "1.0"  // ← ユーザーに見えるバージョン（例: "1.0.1"）
}
```

### 4. リリースビルド（APK/AAB）の作成

1. **メニュー: `Build` → `Generate Signed Bundle / APK`**

2. **「Android App Bundle」を選択（推奨）**
   - AAB形式はPlay Storeが推奨する形式

3. **キーストアを作成**
   - 「Create new...」をクリック
   - パスワードやエイリアスを設定
   - **このキーストアは絶対に失くさないでください！**

4. **リリースビルドを選択して「Create」**

5. **完成したAABファイルは `app/release/` に保存されます**

### 5. Play Consoleでの公開

1. **Google Play Consoleにアクセス**
   - https://play.google.com/console/
   - 初回は開発者登録（25ドルの登録料が必要）

2. **「アプリを作成」をクリック**

3. **必要情報を入力**
   - アプリ名
   - デフォルト言語
   - アプリの種類（アプリ）
   - 無料/有料

4. **AABファイルをアップロード**
   - 「本番環境」→「新しいリリースを作成」
   - AABファイルをドラッグ&ドロップ

5. **ストア掲載情報を入力**
   - アプリの説明
   - スクリーンショット（最低2枚）
   - アイコン（512x512px）
   - カテゴリ

6. **審査に提出**
   - 通常2〜3日で審査完了

---

## 🐛 よくあるエラーと解決方法

### エラー1: `google-services.json が見つかりません`

**解決方法:**
- `google-services.json`が`app/`フォルダ直下にあるか確認
- ファイル名が正確か確認（スペースや大文字小文字に注意）

### エラー2: `Manifest merger failed`

**解決方法:**
- AndroidManifest.xmlの書式エラーをチェック
- `<application>`タグの中に`<meta-data>`があるか確認

### エラー3: 広告が表示されない

**解決方法:**
- **テスト中の場合**: テスト用広告IDを使っているか確認
- **本番の場合**: AdMobでアプリが承認されているか確認（数時間〜数日かかる）
- インターネット接続を確認
- LogCatでエラーメッセージを確認

### エラー4: `Cleartext HTTP traffic not permitted`

**解決方法:**
- `AndroidManifest.xml`に以下が含まれているか確認:
  ```xml
  android:usesCleartextTraffic="true"
  ```

### エラー5: WebViewが真っ白

**解決方法:**
- インターネット接続を確認
- URLが正しいか確認
- LogCatでエラーメッセージを確認
- `INTERNET`権限が`AndroidManifest.xml`にあるか確認

---

## 📞 サポート

問題が解決しない場合:
1. LogCatでエラーメッセージを確認
2. Android Studio下部の「Logcat」タブを開く
3. エラーメッセージをGoogleで検索

---

## 🎉 完成！

これで、nowtaskがAndroidアプリとして動作し、広告収益を得られる状態になりました！

**次のステップ:**
- [ ] 実機でテスト
- [ ] 友人に使ってもらってフィードバック収集
- [ ] Play Storeで公開
- [ ] AdMobの収益をチェック
- [ ] Firebase Analyticsでユーザー行動を分析

Good luck! 🚀
