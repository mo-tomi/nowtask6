# 問題解決レポート

## 2025-10-13: Android WebViewアプリでボタンが反応しない問題

### 発生した問題
- Androidアプリを起動しても画面が真っ白で、ボタンをタップしても何も反応しない
- WebViewにHTMLは読み込まれているが、JavaScriptが正常に動作していない

### 根本的な原因

#### 1. **スクリプトの読み込み順序の問題**
```
エラー: Uncaught ReferenceError: STORAGE_KEYS is not defined
場所: file:///android_asset/js/firebase-init.js?v=33:9
```

**原因**: `index.html`でスクリプトの読み込み順序が誤っていた
- `firebase-init.js`が`STORAGE_KEYS`を使用しているが、この定数は`core.js`で定義されている
- しかし、HTMLでは`firebase-init.js`が`core.js`より先に読み込まれていた

```html
<!-- 誤った順序 -->
<script src="js/firebase-init.js?v=33"></script>
<script src="js/core.js?v=33"></script>  <!-- STORAGE_KEYSはここで定義 -->
```

#### 2. **未定義の関数呼び出し**
```
エラー: Uncaught ReferenceError: initAuth is not defined
場所: file:///android_asset/js/ui-main.js?v=33:71
```

**原因**: `ui-main.js`で`initAuth()`を呼び出しているが、`auth.js`がコメントアウトされていた
- `auth.js`には認証関連のロジックと`initAuth()`関数が定義されている
- しかし、`index.html`で`<script src="js/auth.js?v=33"></script>`がコメントアウトされていた
- MainActivity.ktで既に匿名認証が実装されているため、`auth.js`は不要だが、`ui-main.js`がそれに依存していた

### 解決方法

#### 修正1: スクリプトの読み込み順序を修正 (index.html)
```diff
- <script src="js/firebase-init.js?v=33"></script>
  <script src="js/core.js?v=33"></script>
+ <script src="js/firebase-init.js?v=33"></script>
```

**ファイル**: `android-app/app/src/main/assets/index.html:482-483`

#### 修正2: auth.js依存を削除 (ui-main.js)
```javascript
// 追加: showMainApp関数の代替実装
function showMainApp() {
  const loginModal = document.getElementById('login-modal');
  const mainContent = document.querySelector('.main-content');
  const fab = document.getElementById('create-task-btn');
  if (loginModal) loginModal.style.display = 'none';
  if (mainContent) mainContent.style.display = 'block';
  if (fab) fab.style.display = 'flex';
}

// 修正: init関数をauth.js非依存に変更
function init() {
    // MainActivity.ktで既に匿名認証済みなので、直接データを読み込んでアプリを起動
    loadInitialData(startApp);
}
```

**ファイル**: `android-app/app/src/main/assets/js/ui-main.js:69-84`

### 同じことが起きないようにするための対策

#### 1. **依存関係の明確化**
- 各JSファイルの冒頭にコメントで依存関係を記述する

```javascript
/**
 * firebase-init.js
 *
 * 依存:
 * - core.js (STORAGE_KEYS定数を使用)
 *
 * このファイルは必ず core.js の後に読み込むこと
 */
```

#### 2. **未定義チェックの追加**
- 重要な定数や関数が存在するかチェックする

```javascript
// firebase-init.js の冒頭に追加
if (typeof STORAGE_KEYS === 'undefined') {
    console.error('STORAGE_KEYS is not defined. Make sure core.js is loaded first.');
    throw new Error('Dependency error: core.js must be loaded before firebase-init.js');
}
```

#### 3. **WebView Console Logの確認を習慣化**
- AndroidのlogcatでWebViewのコンソールログを確認する
- `adb logcat | grep WebView` でフィルタリングできる
- または、logcatをファイルに出力: `adb logcat > docs/log.txt`

#### 4. **モジュールバンドラーの導入検討**
- webpack、Rollup、Viteなどのバンドラーを使用すれば、依存関係が自動解決される
- 現在は手動でスクリプトタグを管理しているため、順序ミスが発生しやすい

#### 5. **段階的な機能削除のプロセス**
- 既存の機能（auth.js）をコメントアウトする場合、依存しているコードがないか確認
- `grep -r "initAuth" js/` などで参照箇所を検索してから削除する

### デバッグ時の手順

1. **logcatの確認**
   ```bash
   adb logcat > docs/log.txt
   # または
   adb logcat | grep -i "error\|webview\|console"
   ```

2. **JavaScriptエラーの特定**
   - logcatで`WebView`タグの`Uncaught`エラーを探す
   - エラーメッセージから未定義の変数/関数を特定

3. **依存関係の追跡**
   - エラーが出ている変数/関数がどこで定義されているか検索
   - `grep -r "const STORAGE_KEYS" .` など

4. **読み込み順序の確認**
   - `index.html`のscriptタグの順序を確認
   - 依存される側が先、依存する側が後

### 汎用的なトラブルシューティングプロンプト

```markdown
# Android WebView JavaScript エラーのデバッグ

@docs/log.txt に挙動や問題の詳細を書いたので、以下の手順で調査してください：

1. logcatのWebViewコンソールログからJavaScriptエラーを特定
2. エラーメッセージから未定義の変数や関数を抽出
3. 該当する変数/関数の定義場所をコードベース全体から検索
4. index.htmlのscriptタグの読み込み順序を確認
5. 依存関係を整理し、適切な順序に修正
6. コメントアウトされた機能がある場合、それに依存するコードがないか確認
7. 修正内容と今後の対策を ok.md にレポートとして記録

特に以下の点に注目してください：
- "ReferenceError: XXX is not defined" エラー
- スクリプトの読み込み順序の問題
- コメントアウトされたファイルへの依存
```

### 学んだこと

1. **JavaScriptの実行順序は重要**
   - ブラウザは上から順にスクリプトを実行する
   - 定数や関数は使用前に定義されている必要がある

2. **WebViewのデバッグはlogcatが必須**
   - ブラウザのDevToolsが使えないため、logcatが唯一の手がかり
   - コンソールログを確認する習慣をつける

3. **機能削除時は影響範囲の確認が重要**
   - 1つのファイルをコメントアウトすると、連鎖的にエラーが発生する可能性
   - grepなどで参照箇所を事前に確認する

4. **エラーメッセージは貴重な情報源**
   - "XXX is not defined" → 定義されていない、または読み込み順序が誤り
   - ファイル名と行番号から問題箇所を特定できる

---

## 今後の改善案

### 短期的な改善
- [ ] 各JSファイルに依存関係コメントを追加
- [ ] 未定義チェックを主要ファイルに追加
- [ ] README.mdにデバッグ手順を追記

### 長期的な改善
- [ ] モジュールバンドラー（webpack/Vite）の導入検討
- [ ] TypeScriptへの移行（型チェックで未定義エラーを防ぐ）
- [ ] 自動テストの導入（ビルド時にJavaScriptエラーを検出）

---

## 2025-10-14: Phase 4 - ログイン機構の実装

### 実装内容

#### 1. ログインモーダルUI (index.html)

**追加要素:**
- ログイン/アカウントモーダル (id="login-modal")
  - 未ログイン時: ログインフォーム (id="login-form-section")
    - Googleログインボタン (id="google-login-btn")
    - X(Twitter)ログインボタン (id="twitter-login-btn")
    - 匿名継続ボタン (id="continue-anonymous-btn")
  - ログイン済み時: アカウント情報 (id="account-info-section")
    - 表示名 (id="account-display-name")
    - メールアドレス (id="account-email")
    - アカウント状態 (id="account-status")
    - ログアウトボタン (id="logout-btn")
- ヘッダーにログインアイコンボタン (id="login-icon-btn")

**ファイル**: `android-app/app/src/main/assets/index.html`
- Lines 64-69: ログインアイコンボタン
- Lines 488-557: ログインモーダル

#### 2. 認証フローのJavaScript実装 (auth.js)

**主な機能:**
- `showLogin()`: ログイン状態に応じてモーダル内容を切り替え
- `updateLoginModal()`: 匿名/ログイン済みでUI切り替え
- `checkLoginState()`: 匿名ユーザーでもアプリ使用可能に変更
- `initAuthEventListeners()`: 各種ボタンのイベントリスナー設定
- `window.onAuthSuccess()`: ログイン成功時のコールバック

**イベントリスナー:**
- Google/Twitterログインボタン → AndroidAuth経由で認証開始
- ログインアイコンボタン → ログイン済みならログアウト確認、匿名ならログインモーダル表示
- ログアウトボタン → 確認後にAndroidAuth.signOut()実行
- 閉じる/匿名継続ボタン → モーダル閉じてアプリ継続

**ファイル**: `android-app/app/src/main/assets/js/auth.js`
- Lines 18-42: checkLoginState() - 匿名でもアプリ使用可能に
- Lines 47-92: showLogin(), updateLoginModal() - UI切り替え
- Lines 103-164: initAuthEventListeners() - イベントハンドラー
- Lines 176-185: onAuthSuccess() - 認証成功時の処理

**再有効化:**
- `index.html` line 542: auth.jsのコメントアウトを解除

#### 3. 匿名→Google認証のデータ移行 (MainActivity.kt)

**変更内容:**
- `firebaseAuthWithGoogle()`: 匿名ユーザーには`linkWithCredential()`を使用
  - 既存のuidを維持したままGoogle認証を追加
  - データ移行不要（uidが変わらないため）
- 非匿名ユーザーには通常の`signInWithCredential()`を使用

**ファイル**: `android-app/app/src/main/java/com/nowtask/app/MainActivity.kt`
- Lines 109-151: firebaseAuthWithGoogle() - 匿名ユーザー判定と適切な認証方法の選択

#### 4. ユーザー情報取得API (WebAppInterface.kt)

**AndroidAuthクラスの変更:**
- userId引数を削除（FirebaseAuthから直接取得するため）
- signOut()に匿名再ログインのトースト追加

**FirestoreBridgeクラスの変更:**
- userId引数をFirebaseAuthに変更
- 全メソッドでauth.currentUser?.uidを直接参照
- 新規メソッド追加:
  - `getUserEmail()`: ユーザーのメールアドレス取得
  - `getUserDisplayName()`: 表示名取得（フォールバック: email → "ユーザー"）
  - `isAnonymous()`: 匿名ユーザー判定

**ファイル**: `android-app/app/src/main/java/com/nowtask/app/webview/WebAppInterface.kt`
- Lines 17-48: AndroidAuth - userId引数削除
- Lines 53-120: FirestoreBridge - auth経由でuid取得、新規メソッド追加

**MainActivityの修正:**
- FirestoreBridge初期化時にauthを渡すように変更
- AndroidAuth初期化時のuserId引数を削除

**ファイル**: `android-app/app/src/main/java/com/nowtask/app/MainActivity.kt`
- Lines 88-91: ブリッジ初期化の引数修正

#### 5. UI初期化フローの修正 (ui-main.js)

**変更内容:**
- 重複していた`showMainApp()`関数を削除（auth.jsにあるため）
- `init()`関数を`initAuth()`呼び出しに変更

**ファイル**: `android-app/app/src/main/assets/js/ui-main.js`
- Lines 66-73: init()をinitAuth()呼び出しに簡略化

### 主な技術的ポイント

1. **linkWithCredential()の利用**
   - 匿名ユーザーのuidを維持したままGoogle認証を追加
   - Firestoreのデータパスが変わらないため、データ移行不要
   - シームレスなアップグレード体験を提供

2. **動的なユーザー情報取得**
   - 固定のuserId変数ではなく、常にFirebaseAuth.currentUserから取得
   - ログイン/ログアウト時のuid更新漏れを防止

3. **状態に応じたUI切り替え**
   - モーダルの内容を匿名/ログイン済みで動的に変更
   - JavaScriptからKotlinのブリッジメソッドを呼び出して状態確認

### テスト時の確認ポイント

#### 基本フロー
1. **匿名ユーザーのアプリ使用**
   - [ ] アプリ起動時、自動的に匿名認証される
   - [ ] ログインせずにタスクの作成・編集・削除ができる
   - [ ] データがローカルストレージとFirestoreに保存される

2. **Googleログイン**
   - [ ] ログインアイコンをタップしてモーダルが開く
   - [ ] 「Googleでログイン」ボタンでGoogle認証画面が開く
   - [ ] 認証成功後、既存のタスクデータが保持されている
   - [ ] ログイン後もアプリが正常に動作する

3. **アカウント情報表示**
   - [ ] ログイン後、ログインアイコンをタップするとアカウント情報が表示される
   - [ ] 表示名、メールアドレス、ログイン状態が正しく表示される

4. **ログアウト**
   - [ ] ログアウトボタンで確認ダイアログが表示される
   - [ ] ログアウト後、匿名モードに戻る
   - [ ] 匿名モードで新規タスクを作成できる

5. **データ同期**
   - [ ] ログイン後、データがFirestoreに保存される
   - [ ] 別デバイスで同じアカウントでログインすると、データが同期される

#### エラーケース
- [ ] Google認証キャンセル時のハンドリング
- [ ] ネットワークエラー時の挙動
- [ ] 既に他のGoogleアカウントでログイン済みの場合

#### UI/UX
- [ ] モーダルのアニメーション
- [ ] ボタンのタップ反応
- [ ] ローディング中の表示
- [ ] トースト通知のタイミング

### 既知の制限事項

1. **X (Twitter) 認証**
   - 現在は「開発中です」のトーストを表示するのみ
   - 今後の実装が必要

2. **アカウント切り替え**
   - ログアウト→別アカウントでログインは可能
   - しかし、匿名データが新アカウントに移行されない
   - これは仕様通り（linkWithCredentialは初回ログイン時のみ）

3. **プロフィール画像**
   - 現在はデフォルトアイコンのみ
   - Googleアカウントのプロフィール画像表示は今後の拡張

### 次のステップ

Phase 4の実装が完了したら、以下を確認:
1. 実機またはエミュレータでの動作テスト
2. logcatでのエラーチェック
3. Firestoreコンソールでのデータ確認
4. 複数デバイスでの同期テスト

Phase 5以降の開発計画は`docs/task.md`を参照。
