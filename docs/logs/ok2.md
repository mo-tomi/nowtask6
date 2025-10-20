# 問題解決ログ

## 2025-10-14: Googleアカウント連携とルーティン・空き時間計算のバグ修正

### 発生した問題

1. **デイリールーティンの設定が反映されない**
   - 設定画面で開始時刻と所要時間を設定して保存
   - トップ画面に作成されたタスクでは「未設定」と表示される

2. **空き時間の計算が不正確**
   - タスクの時間が重複している場合、重複分も二重にカウントしてしまう
   - 例: 10:00-11:00と10:30-11:30のタスクがあると、120分としてカウント（正しくは90分）

---

## 問題1: デイリールーティンの設定が反映されない

### 原因

**`modals.js`の`addRoutine()`関数**で、新しいルーティンを追加する際に既存のルーティンを再保存していましたが、その際に**開始時刻(`startTime`)と終了時刻(`endTime`)を保存していませんでした**。

```javascript
// 問題のあるコード (modals.js lines 544-552)
nameInputs.forEach((nameInput, index) => {
    const name = nameInput.value.trim();
    const existingRoutines = getRoutines();
    const routine = {
      id: existingRoutines[index]?.id || generateUUID(),
      name: name,
      duration: parseInt(durationInputs[index].value)
      // ❌ startTime と endTime が欠落！
    };
    routines.push(routine);
});
```

### 再現手順

1. 設定画面でルーティンを作成（例: 「朝食」開始時刻: 07:00, 所要時間: 30分）
2. 保存ボタンをクリック → 正常に保存される
3. 「ルーティンを追加」ボタンをクリックして2つ目のルーティンを追加
4. → 1つ目のルーティンの開始時刻と終了時刻が消える

### 解決方法

`addRoutine()`関数で既存ルーティンを保存する際に、時間フィールドも取得して保存するように修正:

```javascript
// 修正後のコード (modals.js v=38)
nameInputs.forEach((nameInput, index) => {
    const name = nameInput.value.trim();
    const existingRoutines = getRoutines();

    // 開始時刻と終了時刻を取得
    let startTime = '';
    let endTime = '';
    timeInputs.forEach(input => {
      const inputIndex = parseInt(input.dataset.index);
      if (inputIndex === index) {
        if (input.dataset.field === 'startTime') {
          startTime = input.value || '';
        } else if (input.dataset.field === 'endTime') {
          endTime = input.value || '';
        }
      }
    });

    const routine = {
      id: existingRoutines[index]?.id || generateUUID(),
      name: name,
      duration: parseInt(durationInputs[index].value),
      startTime: startTime,  // ✅ 追加
      endTime: endTime       // ✅ 追加
    };
    routines.push(routine);
});
```

**修正ファイル**: `modals.js` (v=38)

---

## 問題2: 空き時間の計算が不正確

### 原因

タスクの時間計算で、**重複する時間帯を考慮せずに単純に合計**していました。

```javascript
// 問題のあるコード
todayTasks.forEach(task => {
    if (task.startTime && task.endTime) {
        const startMinutes = /* ... */;
        const endMinutes = /* ... */;
        totalDurationMinutes += (endMinutes - startMinutes);
        // ❌ 重複を考慮していない
    }
});
```

**例**:
- タスクA: 10:00-11:00 (60分)
- タスクB: 10:30-11:30 (60分)
- 旧計算: 60 + 60 = 120分 → 空き時間が少なく表示される
- 正しい計算: 10:00-11:30 = 90分

### 解決方法

**タイムスロット統合アルゴリズム**を実装:

1. 各タスクの時間帯を`{ start, end }`オブジェクトとして収集
2. 開始時刻でソート
3. 重複するスロットを統合（マージ）
4. 統合後のスロットの合計時間を計算

```javascript
// 修正後のコード (gauge.js, share.js, calendar.js v=39)

// 1. タイムスロットを収集
const timeSlots = [];
todayTasks.forEach(task => {
    if (task.startTime && task.endTime) {
        let startMinutes = /* ... */;
        let endMinutes = /* ... */;

        // 現在時刻より前に終了するタスクはスキップ
        if (endMinutes <= currentMinutes) return;

        // 現在進行中のタスクは現在時刻から開始
        if (startMinutes < currentMinutes) {
            startMinutes = currentMinutes;
        }

        timeSlots.push({ start: startMinutes, end: endMinutes });
    }
});

// 2. タイムスロットを統合（重複を排除）
let totalDurationMinutes = 0;
if (timeSlots.length > 0) {
    // 開始時刻でソート
    timeSlots.sort((a, b) => a.start - b.start);

    // 重複するスロットをマージ
    const mergedSlots = [timeSlots[0]];
    for (let i = 1; i < timeSlots.length; i++) {
        const current = timeSlots[i];
        const last = mergedSlots[mergedSlots.length - 1];

        if (current.start <= last.end) {
            // 重複している: 統合
            last.end = Math.max(last.end, current.end);
        } else {
            // 重複していない: 新しいスロットとして追加
            mergedSlots.push(current);
        }
    }

    // 統合されたスロットの合計時間を計算
    totalDurationMinutes = mergedSlots.reduce((sum, slot) => {
        return sum + (slot.end - slot.start);
    }, 0);
}

// 3. 空き時間を計算
const remainingTimeInDay = (24 * 60) - currentMinutes;
const freeTimeMinutes = remainingTimeInDay - totalDurationMinutes;
```

**修正ファイル**:
- `gauge.js` (v=39) - メインの24時間ゲージの空き時間計算
- `share.js` (v=39) - X共有機能の空き時間計算
- `calendar.js` (v=39) - カレンダー月次統計の空き時間計算

---

## 修正結果

### 修正ファイル一覧

| ファイル | バージョン | 修正内容 |
|---------|----------|---------|
| `modals.js` | v=38 | デイリールーティンの時刻設定が保存されるように修正 |
| `gauge.js` | v=39 | 空き時間計算でタスク重複を考慮 |
| `share.js` | v=39 | 空き時間計算でタスク重複を考慮 |
| `calendar.js` | v=39 | 空き時間計算でタスク重複を考慮 |
| `index.html` | v=39 | WebViewキャッシュクリア用にバージョン更新 |

### 動作確認

1. **デイリールーティン設定**:
   - ✅ 開始時刻と所要時間を設定して保存
   - ✅ トップ画面のタスクに正しく反映される
   - ✅ 追加ルーティンを作成しても既存の設定が消えない

2. **空き時間計算**:
   - ✅ 重複するタスクがあっても正しく計算される
   - ✅ 24時間ゲージの空き時間表示が正確
   - ✅ X共有機能の空き時間表示が正確
   - ✅ カレンダーの月次統計が正確

---

## 今後の改善案

### 短期的改善
- [ ] ルーティン設定UIの改善（時刻設定がわかりやすく）
- [ ] 空き時間が0分の場合の表示を改善
- [ ] タスク重複の視覚的な警告機能

### 長期的改善
- [ ] ルーティンのテンプレート機能
- [ ] 空き時間の推移グラフ表示
- [ ] タスクの自動スケジューリング機能

---

## 参考資料

- プロジェクト開発計画: `docs/task.md`
- 前回の問題解決ログ: `docs/ok.md` (Google認証データ同期問題)
