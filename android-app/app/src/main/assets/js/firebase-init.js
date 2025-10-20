/**
 * ========================================
 * Firebaseデータブリッジ & 初期化
 * ========================================
 */

// グローバルなデータキャッシュ
window.appData = {
    [STORAGE_KEYS.TASKS]: [],
    [STORAGE_KEYS.TRASH]: [],
    [STORAGE_KEYS.SETTINGS]: {}
};

// データ読み込みの完了を追跡するためのカウンター
let loadCounter = 0;
let requiredLoads = 0;
let onDataLoadComplete = null;

/**
 * Firestoreから特定のキーのデータを読み込むコールバック
 * @param {string | null} keyOrNull - データキー（またはnull）
 */
function onDataLoaded(key, keyOrNull) {
    console.log(`onDataLoaded called for key: ${key}, keyOrNull: ${keyOrNull}`);
    try {
        if (keyOrNull && keyOrNull !== 'null') {
            // Kotlinからキャッシュされたデータを取得
            const jsonData = FirestoreBridge.getCachedData(key);
            console.log(`Retrieved cached data for ${key}, length: ${jsonData ? jsonData.length : 0}`);

            if (jsonData) {
                window.appData[key] = JSON.parse(jsonData);
                console.log(`Successfully parsed data for ${key}, items:`, window.appData[key]);
            } else {
                // データがない場合はデフォルト値を使用
                if (key === STORAGE_KEYS.TASKS) window.appData[key] = [];
                if (key === STORAGE_KEYS.TRASH) window.appData[key] = [];
                if (key === STORAGE_KEYS.SETTINGS) window.appData[key] = {};
                console.log(`No cached data for ${key}, using default:`, window.appData[key]);
            }
        } else {
            // Firestoreにデータがない場合はデフォルト値を使用
            if (key === STORAGE_KEYS.TASKS) window.appData[key] = [];
            if (key === STORAGE_KEYS.TRASH) window.appData[key] = [];
            if (key === STORAGE_KEYS.SETTINGS) window.appData[key] = {};
            console.log(`No data for ${key}, using default:`, window.appData[key]);
        }
    } catch (e) {
        console.error(`Error parsing data for key ${key}:`, e);
        // エラーが発生してもデフォルト値を設定
        if (key === STORAGE_KEYS.TASKS) window.appData[key] = [];
        if (key === STORAGE_KEYS.TRASH) window.appData[key] = [];
        if (key === STORAGE_KEYS.SETTINGS) window.appData[key] = {};
    }

    loadCounter++;
    console.log(`Load progress: ${loadCounter}/${requiredLoads}`);
    if (loadCounter >= requiredLoads && typeof onDataLoadComplete === 'function') {
        console.log("All data loaded, calling onDataLoadComplete");
        onDataLoadComplete();
        onDataLoadComplete = null; // 一度だけ実行
    }
}

/**
 * アプリの初期データをFirestoreから読み込む
 * @param {function} onComplete - 全データの読み込み完了時に呼ばれるコールバック
 */
function loadInitialData(onComplete) {
    if (typeof FirestoreBridge === 'undefined') {
        console.log("Waiting for FirestoreBridge...");
        setTimeout(() => loadInitialData(onComplete), 200);
        return;
    }

    onDataLoadComplete = onComplete;
    const keysToLoad = Object.values(STORAGE_KEYS);
    requiredLoads = keysToLoad.length;
    loadCounter = 0;

    if (requiredLoads === 0) {
        onComplete();
        return;
    }

    // 各キーに対応するグローバルコールバックを動的に作成
    keysToLoad.forEach(key => {
        const callbackName = `onDataLoaded_${key}`;
        window[callbackName] = (data) => onDataLoaded(key, data);
        FirestoreBridge.loadData(key, callbackName);
    });
}

// ストレージ関数をFirestoreブリッジでオーバーライド
function saveToStorage(key, data) {
    if (typeof FirestoreBridge === 'undefined') {
        console.error("FirestoreBridge is not available.");
        return false;
    }
    // ローカルキャッシュも更新
    window.appData[key] = data;

    // デバッグ: 保存するデータを確認
    const jsonString = JSON.stringify(data);
    console.log(`Saving data for key "${key}". Data type: ${typeof data}, JSON length: ${jsonString.length}`);
    console.log(`First 100 chars: ${jsonString.substring(0, 100)}`);

    // Firestoreに保存
    FirestoreBridge.saveData(key, jsonString);
    return true;
}

function loadFromStorage(key, defaultValue = []) {
    return window.appData[key] || defaultValue;
}
