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

    // デフォルト値を設定する関数
    const setDefaultValue = (key) => {
        if (key === STORAGE_KEYS.TASKS) window.appData[key] = [];
        if (key === STORAGE_KEYS.TRASH) window.appData[key] = [];
        if (key === STORAGE_KEYS.SETTINGS) window.appData[key] = {};
    };

    try {
        // FirestoreBridgeが存在するかチェック
        if (typeof FirestoreBridge !== 'undefined') {
            // FirestoreBridgeが利用可能な場合
            if (keyOrNull && keyOrNull !== 'null') {
                try {
                    // Kotlinからキャッシュされたデータを取得
                    const jsonData = FirestoreBridge.getCachedData(key);
                    console.log(`Retrieved cached data for ${key}, length: ${jsonData ? jsonData.length : 0}`);

                    if (jsonData) {
                        window.appData[key] = JSON.parse(jsonData);
                        console.log(`Successfully parsed data for ${key}, items:`, window.appData[key]);
                    } else {
                        // データがない場合はデフォルト値を使用
                        setDefaultValue(key);
                        console.log(`No cached data for ${key}, using default:`, window.appData[key]);
                    }
                } catch (bridgeError) {
                    console.error(`Error calling FirestoreBridge.getCachedData for ${key}:`, bridgeError);
                    // FirestoreBridge呼び出しエラー時はローカルストレージにフォールバック
                    loadFromLocalStorage(key);
                }
            } else {
                // Firestoreにデータがない場合はデフォルト値を使用
                setDefaultValue(key);
                console.log(`No data for ${key}, using default:`, window.appData[key]);
            }
        } else {
            // FirestoreBridgeが存在しない場合はローカルストレージを使用
            console.warn(`FirestoreBridge not available for ${key}, falling back to localStorage`);
            loadFromLocalStorage(key);
        }
    } catch (e) {
        console.error(`Error in onDataLoaded for key ${key}:`, e);
        // エラーが発生した場合もローカルストレージにフォールバック
        loadFromLocalStorage(key);
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
 * ローカルストレージからデータを読み込むフォールバック関数
 * @param {string} key - データキー
 */
function loadFromLocalStorage(key) {
    try {
        const localData = localStorage.getItem(key);
        if (localData) {
            window.appData[key] = JSON.parse(localData);
            console.log(`Loaded data from localStorage for ${key}:`, window.appData[key]);
        } else {
            // ローカルストレージにもデータがない場合はデフォルト値を使用
            if (key === STORAGE_KEYS.TASKS) window.appData[key] = [];
            if (key === STORAGE_KEYS.TRASH) window.appData[key] = [];
            if (key === STORAGE_KEYS.SETTINGS) window.appData[key] = {};
            console.log(`No localStorage data for ${key}, using default:`, window.appData[key]);
        }
    } catch (localStorageError) {
        console.error(`Error loading from localStorage for ${key}:`, localStorageError);
        // ローカルストレージエラー時もデフォルト値を設定
        if (key === STORAGE_KEYS.TASKS) window.appData[key] = [];
        if (key === STORAGE_KEYS.TRASH) window.appData[key] = [];
        if (key === STORAGE_KEYS.SETTINGS) window.appData[key] = {};
    }
}

/**
 * アプリの初期データをFirestoreから読み込む
 * @param {function} onComplete - 全データの読み込み完了時に呼ばれるコールバック
 */
function loadInitialData(onComplete) {
    onDataLoadComplete = onComplete;
    const keysToLoad = Object.values(STORAGE_KEYS);
    requiredLoads = keysToLoad.length;
    loadCounter = 0;

    if (requiredLoads === 0) {
        onComplete();
        return;
    }

    // FirestoreBridgeが存在するかチェック
    if (typeof FirestoreBridge !== 'undefined') {
        console.log("FirestoreBridge is available, loading data from Firestore");
        try {
            // 各キーに対応するグローバルコールバックを動的に作成
            keysToLoad.forEach(key => {
                const callbackName = `onDataLoaded_${key}`;
                window[callbackName] = (data) => onDataLoaded(key, data);

                try {
                    FirestoreBridge.loadData(key, callbackName);
                } catch (loadError) {
                    console.error(`Error loading data for ${key}:`, loadError);
                    // エラー時はローカルストレージにフォールバック
                    onDataLoaded(key, null);
                }
            });
        } catch (error) {
            console.error("Error initializing FirestoreBridge data loading:", error);
            // エラー時はすべてのキーをローカルストレージから読み込む
            loadAllFromLocalStorage(keysToLoad);
        }
    } else {
        // FirestoreBridgeが存在しない場合はローカルストレージから読み込む
        console.warn("FirestoreBridge not available, loading all data from localStorage");
        loadAllFromLocalStorage(keysToLoad);
    }
}

/**
 * すべてのキーのデータをローカルストレージから読み込む
 * @param {Array<string>} keys - 読み込むキーの配列
 */
function loadAllFromLocalStorage(keys) {
    keys.forEach(key => {
        onDataLoaded(key, null);
    });
}

// ストレージ関数をFirestoreブリッジでオーバーライド
function saveToStorage(key, data) {
    // ローカルキャッシュを更新
    window.appData[key] = data;

    // デバッグ: 保存するデータを確認
    const jsonString = JSON.stringify(data);
    console.log(`Saving data for key "${key}". Data type: ${typeof data}, JSON length: ${jsonString.length}`);
    console.log(`First 100 chars: ${jsonString.substring(0, 100)}`);

    // FirestoreBridgeが存在するかチェック
    if (typeof FirestoreBridge !== 'undefined') {
        try {
            // Firestoreに保存
            FirestoreBridge.saveData(key, jsonString);
            console.log(`Data saved to Firestore for key: ${key}`);
        } catch (bridgeError) {
            console.error(`Error saving to FirestoreBridge for ${key}:`, bridgeError);
            // FirestoreBridge エラー時はローカルストレージにフォールバック
            saveToLocalStorage(key, jsonString);
        }
    } else {
        // FirestoreBridgeが存在しない場合はローカルストレージに保存
        console.warn(`FirestoreBridge not available, saving to localStorage for key: ${key}`);
        saveToLocalStorage(key, jsonString);
    }

    return true;
}

/**
 * ローカルストレージにデータを保存するフォールバック関数
 * @param {string} key - データキー
 * @param {string} jsonString - JSON文字列
 */
function saveToLocalStorage(key, jsonString) {
    try {
        localStorage.setItem(key, jsonString);
        console.log(`Data saved to localStorage for key: ${key}`);
    } catch (localStorageError) {
        console.error(`Error saving to localStorage for ${key}:`, localStorageError);
        // ローカルストレージの容量制限などのエラーを通知
        if (localStorageError.name === 'QuotaExceededError') {
            console.error('localStorage quota exceeded. Consider clearing old data.');
        }
    }
}

function loadFromStorage(key, defaultValue = []) {
    return window.appData[key] || defaultValue;
}
