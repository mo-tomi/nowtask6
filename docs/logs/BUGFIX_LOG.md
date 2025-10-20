# バグフィックスログ

**日付:** 2025年10月16日
**バージョン:** v=50 (hotfix)

---

## 修正内容

### 1. 起動するたびに「オンラインに復帰しました」メッセージが表示される問題

**ファイル:** `js/performance.js` (行 289-323)

**問題:**
- `OfflineManager.handleOnline()` 内で `console.log('✓ オンラインに戻りました')` が毎回起動時に実行される
- WebViewが起動するたびにネットワーク状態イベントが発火

**修正内容:**
```javascript
// 修正前
handleOnline() {
  this.isOnline = true;
  console.log('✓ オンラインに戻りました');  // ← ユーザーが不要
  // ...
}

// 修正後
handleOnline() {
  this.isOnline = true;
  // ユーザーが不要なので通知を表示しない
  // console.log('✓ オンラインに戻りました');

  // UI更新: オフラインバナーを非表示（既に表示されている場合のみ）
  const offlineBanner = document.querySelector('.offline-banner');
  if (offlineBanner && offlineBanner.style.display === 'block') {
    offlineBanner.style.display = 'none';
  }

  // 自動同期を開始（実際に変更があった場合のみ）
  if (this.pendingChanges.length > 0) {
    this.syncPendingChanges();
  }
}
```

**効果:**
- ✅ 起動時の不要なメッセージが表示されなくなる
- ✅ 実際にオフラインから復帰した時のみバナーが非表示に

---

### 2. クイック入力でタスク追加の説明が毎回起動時に出る問題

**ファイル:** `js/help.js` (行 412-447)

**問題:**
- `initHelp()` が複数回呼ばれている可能性
- チュートリアルがクイック入力時に毎回表示される

**修正内容:**
```javascript
// 修正前
function initHelp() {
  if (!localStorage.getItem('tutorialCompleted')) {
    setTimeout(() => {
      startTutorial();  // ← 毎回呼ばれる
    }, 1000);
  }
  // ...
}

// 修正後
let helpInitialized = false;  // ← 初期化フラグ

function initHelp() {
  // 重複初期化を防止
  if (helpInitialized) return;  // ← 2回目以降はスキップ
  helpInitialized = true;

  if (!localStorage.getItem('tutorialCompleted') &&
      !localStorage.getItem('_help_initialized')) {  // ← 2重チェック
    setTimeout(() => {
      startTutorial();
    }, 1000);
    localStorage.setItem('_help_initialized', 'true');  // ← フラグ設定
  }
  // ...
}
```

**効果:**
- ✅ チュートリアルは本当に初回起動時のみ表示
- ✅ `_help_initialized` フラグでローカルストレージにも記録
- ✅ 重複初期化を防止

---

## テスト方法

### テスト1: オンラインメッセージの確認

1. アプリを起動
2. DevTools のコンソール確認
3. **「✓ オンラインに戻りました」が表示されていないことを確認**
4. アプリを再起動
5. **引き続き、メッセージが表示されていないことを確認**

✅ 修正成功条件: メッセージが表示されない

---

### テスト2: チュートリアルの確認

1. **localStorage をクリア:**
   ```bash
   localStorage.clear()
   ```

2. アプリを再読み込み
3. **チュートリアルが一度表示される**
4. チュートリアルを完了
5. アプリを再読み込み
6. **チュートリアルが表示されない（3-5秒待機）**
7. 設定画面から「チュートリアルを再表示」をクリック
8. **チュートリアルが再度表示される**

✅ 修正成功条件:
- 初回のみ表示
- 2回目以降は表示されない
- 手動で再表示可能

---

## 修正前後の比較

| 項目 | 修正前 | 修正後 |
|------|-------|-------|
| **起動時のメッセージ** | 毎回表示 | 表示されない |
| **チュートリアル表示** | 毎回表示 | 初回のみ |
| **オフラインバナー** | 毎回非表示 | 状態確認後に非表示 |
| **ユーザー体験** | 煩わしい | スッキリ |

---

## 備考

### 保持されるローカルストレージキー

- `tutorialCompleted`: チュートリアル完了フラグ
- `_help_initialized`: Help初期化フラグ（今回追加）
- `showTutorialAgain`: チュートリアル再表示フラグ

### 改善の余地

今後の改善案:
1. ネットワーク状態の遷移検出の精密化
2. オフラインバナー表示タイミングの最適化
3. チュートリアル関連のlocalStorageキーを統一

---

**完了日:** 2025年10月16日
**バージョン:** v=50
**ステータス:** ✅ 修正完了・テスト実施
