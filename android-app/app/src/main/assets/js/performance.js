// ========================================
// フェーズ7: パフォーマンス最適化
// ========================================
// 起動速度、メモリ使用量、ネットワーク通信の最適化

/**
 * 7.1: 起動速度の最適化
 * - Splash画面の改善
 * - 遅延読み込みの実装
 */

// パフォーマンスメトリクス追跡
const performanceMetrics = {
  startTime: performance.now(),
  loadingPhases: {},
  memorySnapshots: []
};

/**
 * 初期化処理の非同期実行
 * 7.1.1: 起動時の初期化処理を非同期化
 */
async function initializeAsync() {
  const initStart = performance.now();

  try {
    // Phase 1: 同期的な最小初期化（UIの最初の描画）
    initializeSplashScreen();
    recordPhase('splash', performance.now() - initStart);

    // Phase 2: 非同期初期化（バックグラウンド）
    await Promise.all([
      loadTasksAsyncWithPriority(),
      initializeEventHandlersLazy(),
      preloadCommonResources()
    ]);

    recordPhase('async_init', performance.now() - initStart);

    // Phase 3: オプショナルリソース（遅延読み込み）
    scheduleDeferredInitialization();

    hideSplashScreen();
    recordPhase('total_init', performance.now() - initStart);

    console.log('✓ 初期化完了:', performanceMetrics.loadingPhases);

  } catch (error) {
    console.error('初期化エラー:', error);
    hideSplashScreen();
  }
}

/**
 * フェーズ記録
 */
function recordPhase(phaseName, duration) {
  performanceMetrics.loadingPhases[phaseName] = Math.round(duration);
}

/**
 * Splash画面の表示
 */
function initializeSplashScreen() {
  const splash = document.getElementById('splash-screen');
  if (splash) {
    splash.style.display = 'flex';
    splash.style.opacity = '1';
  }
}

/**
 * Splash画面の非表示
 */
function hideSplashScreen() {
  const splash = document.getElementById('splash-screen');
  if (splash) {
    splash.style.opacity = '0';
    setTimeout(() => {
      splash.style.display = 'none';
    }, 300);
  }
}

/**
 * プログレスインジケーターの更新
 */
function updateSplashProgress(percentage) {
  const progressBar = document.querySelector('.splash-progress');
  if (progressBar) {
    progressBar.style.width = percentage + '%';
  }
}

/**
 * 優先度付きでタスクを非同期読み込み
 * - 表示予定のタスク（今日、明日）を優先
 * - その他は遅延読み込み
 */
async function loadTasksAsyncWithPriority() {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        // 優先度高: 表示予定のタスク
        const tasks = loadFromStorage(STORAGE_KEYS.TASKS, []);
        const today = formatDateISO(new Date());
        const tomorrow = formatDateISO(new Date(Date.now() + 86400000));

        // キャッシュに分類して保存
        const priorityCache = {
          today: tasks.filter(t => t.dueDate === today),
          tomorrow: tasks.filter(t => t.dueDate === tomorrow),
          other: tasks.filter(t => !t.dueDate || (t.dueDate !== today && t.dueDate !== tomorrow))
        };

        localStorage.setItem('_priority_cache', JSON.stringify(priorityCache));
        updateSplashProgress(60);
        resolve();
      } catch (error) {
        console.error('タスク読み込みエラー:', error);
        resolve();
      }
    }, 0);
  });
}

/**
 * イベントハンドラーの遅延初期化
 */
async function initializeEventHandlersLazy() {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        // 重要なイベントのみ即座に登録
        if (document.getElementById('quick-add-input')) {
          document.getElementById('quick-add-input').addEventListener('keypress', handleQuickAddEnter);
        }

        updateSplashProgress(75);
        resolve();
      } catch (error) {
        console.error('イベントハンドラー初期化エラー:', error);
        resolve();
      }
    }, 100);
  });
}

/**
 * 共通リソースの事前読み込み
 */
async function preloadCommonResources() {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        // SVGアイコン、CSS、フォントをプリロード
        const resourcesPreload = [
          'js/templates.js',
          'js/calendar.js'
        ];

        resourcesPreload.forEach(resource => {
          const link = document.createElement('link');
          link.rel = 'modulepreload';
          link.href = resource;
          document.head.appendChild(link);
        });

        updateSplashProgress(85);
        resolve();
      } catch (error) {
        resolve(); // エラーは無視して続行
      }
    }, 150);
  });
}

/**
 * 遅延初期化のスケジュール
 * requestIdleCallback()で、ブラウザがアイドル状態の時に実行
 */
function scheduleDeferredInitialization() {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      loadDeferredResources();
    }, { timeout: 2000 });
  } else {
    setTimeout(loadDeferredResources, 2000);
  }
}

/**
 * 遅延読み込みリソース
 * - Analytics, Share機能, Calendar など
 */
async function loadDeferredResources() {
  const deferredScripts = [
    'js/analytics.js',
    'js/share.js',
    'js/calendar.js'
  ];

  for (const script of deferredScripts) {
    try {
      const moduleScript = document.createElement('script');
      moduleScript.src = script + '?v=49';
      moduleScript.async = true;
      document.head.appendChild(moduleScript);
      await new Promise(resolve => {
        moduleScript.onload = resolve;
        moduleScript.onerror = resolve;
      });
    } catch (error) {
      console.warn(`遅延リソース読み込み失敗: ${script}`, error);
    }
  }
}

/**
 * 7.2: メモリ使用量の最適化
 * - WebViewのメモリ管理
 * - データ処理の効率化
 */

/**
 * WebViewメモリキャッシュの最適化
 * 7.2.1: キャッシュの定期的なクリア
 */
class MemoryManager {
  constructor() {
    this.cacheSize = 0;
    this.maxCacheSize = 50 * 1024 * 1024; // 50MB
    this.lastCleanup = Date.now();
    this.cleanupInterval = 5 * 60 * 1000; // 5分
  }

  /**
   * メモリ使用量をチェック
   */
  checkMemory() {
    if (performance.memory) {
      const usedJSHeapSize = performance.memory.usedJSHeapSize;
      const jsHeapSizeLimit = performance.memory.jsHeapSizeLimit;
      const percentUsed = (usedJSHeapSize / jsHeapSizeLimit) * 100;

      // メモリ使用率が85%を超えたらクリア
      if (percentUsed > 85) {
        this.clearUnusedCache();
      }

      return {
        used: Math.round(usedJSHeapSize / 1024 / 1024),
        limit: Math.round(jsHeapSizeLimit / 1024 / 1024),
        percent: Math.round(percentUsed)
      };
    }
    return null;
  }

  /**
   * 不要なキャッシュをクリア
   */
  clearUnusedCache() {
    try {
      // グローバルキャッシュをクリア
      if (window.dataCache) {
        // 重要でないデータのみ削除
        ['_priority_cache', '_temp_cache'].forEach(key => {
          delete window.dataCache[key];
        });
      }

      // DOM内の隠れた要素をクリア
      const hiddenElements = document.querySelectorAll('[style*="display: none"]');
      hiddenElements.forEach(el => {
        if (el.innerHTML && el.innerHTML.length > 10000) {
          el.innerHTML = ''; // 大きなDOMはクリア
        }
      });

      console.log('✓ キャッシュクリア完了');
    } catch (error) {
      console.error('キャッシュクリアエラー:', error);
    }
  }

  /**
   * 定期的なメモリ監視を開始
   */
  startMonitoring() {
    setInterval(() => {
      if (Date.now() - this.lastCleanup > this.cleanupInterval) {
        this.checkMemory();
        this.lastCleanup = Date.now();
      }
    }, 30000); // 30秒ごとにチェック
  }
}

// メモリマネージャー初期化
const memoryManager = new MemoryManager();

/**
 * 7.2.2: 大量タスク時のパフォーマンス改善
 * - 仮想スクロール実装
 * - 不要なDOM操作の削減
 */

class VirtualScroller {
  constructor(containerId, itemHeight = 60) {
    this.container = document.getElementById(containerId);
    this.itemHeight = itemHeight;
    this.items = [];
    this.visibleRange = { start: 0, end: 0 };
    this.scrollTop = 0;
    this.viewport = null;
    this.virtualDOM = null;
    this.setupEventListener();
  }

  /**
   * アイテムを設定
   */
  setItems(items) {
    this.items = items;
    this.render();
  }

  /**
   * スクロールイベントリスナー設定
   */
  setupEventListener() {
    if (this.container) {
      this.container.addEventListener('scroll', () => this.onScroll());
    }
  }

  /**
   * スクロール時の処理
   */
  onScroll() {
    if (!this.container) return;

    this.scrollTop = this.container.scrollTop;
    const containerHeight = this.container.clientHeight;

    // 表示範囲の計算
    this.visibleRange.start = Math.floor(this.scrollTop / this.itemHeight);
    this.visibleRange.end = Math.ceil((this.scrollTop + containerHeight) / this.itemHeight);

    // バッファ追加（スムーズなスクロール用）
    this.visibleRange.start = Math.max(0, this.visibleRange.start - 5);
    this.visibleRange.end = Math.min(this.items.length, this.visibleRange.end + 5);

    this.render();
  }

  /**
   * 表示範囲のアイテムのみレンダリング
   */
  render() {
    if (!this.container) return;

    const fragment = document.createDocumentFragment();

    for (let i = this.visibleRange.start; i < this.visibleRange.end; i++) {
      const item = this.items[i];
      if (item) {
        const element = this.createItemElement(item, i);
        fragment.appendChild(element);
      }
    }

    // 全要素をクリアして新しい要素をレンダリング
    this.container.innerHTML = '';
    this.container.appendChild(fragment);
  }

  /**
   * アイテムの要素を作成
   */
  createItemElement(item, index) {
    const div = document.createElement('div');
    div.style.height = this.itemHeight + 'px';
    div.style.position = 'absolute';
    div.style.top = (index * this.itemHeight) + 'px';
    div.innerHTML = item.html || '';
    return div;
  }
}

/**
 * 7.3: ネットワーク通信の最適化
 * - Firestoreクエリの最適化
 * - オフライン対応の完全化
 */

/**
 * 7.3.1: Firestoreクエリの最適化
 * - 必要最小限のデータ取得
 * - インデックスの適切な設定
 * - バッチ処理の活用
 */
class FirestoreOptimizer {
  constructor() {
    this.queryCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5分
    this.batchQueue = [];
    this.batchSize = 25;
    this.batchDelay = 500; // ms
  }

  /**
   * クエリ結果をキャッシュ
   */
  cacheQuery(queryKey, data) {
    this.queryCache.set(queryKey, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * キャッシュからクエリ結果を取得
   */
  getCachedQuery(queryKey) {
    const cached = this.queryCache.get(queryKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    this.queryCache.delete(queryKey);
    return null;
  }

  /**
   * 必要最小限のフィールドのみ取得
   */
  optimizeFields(data, fieldsNeeded = ['id', 'title', 'dueDate', 'isCompleted']) {
    if (Array.isArray(data)) {
      return data.map(item => {
        const optimized = {};
        fieldsNeeded.forEach(field => {
          if (field in item) optimized[field] = item[field];
        });
        return optimized;
      });
    }
    return data;
  }

  /**
   * バッチ処理のキュー
   */
  queueBatchOperation(operation) {
    this.batchQueue.push(operation);
    if (this.batchQueue.length === this.batchSize) {
      this.executeBatch();
    } else if (this.batchQueue.length === 1) {
      setTimeout(() => this.executeBatch(), this.batchDelay);
    }
  }

  /**
   * バッチを実行
   */
  executeBatch() {
    if (this.batchQueue.length === 0) return;

    const batch = this.batchQueue.splice(0, this.batchSize);
    console.log(`バッチ実行: ${batch.length}件の操作`);

    // FirestoreBridgeでバッチ処理
    if (typeof FirestoreBridge !== 'undefined') {
      FirestoreBridge.executeBatch(JSON.stringify(batch));
    }
  }
}

const firestoreOptimizer = new FirestoreOptimizer();

/**
 * 7.3.2: オフライン動作の完全対応
 * - オフライン時の完全機能提供
 * - 自動同期メカニズム
 * - 競合解決ロジック
 */

class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.pendingChanges = [];
    this.syncInProgress = false;
    this.lastSyncTime = null;
    this.setupNetworkListener();
  }

  /**
   * ネットワーク状態リスナー
   */
  setupNetworkListener() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  /**
   * オンライン状態に戻ったときの処理
   */
  handleOnline() {
    this.isOnline = true;
    // ユーザーが不要なので通知を表示しない
    // console.log('✓ オンラインに戻りました');

    // UI更新: オフラインバナーを非表示（既に表示されている場合のみ）
    const offlineBanner = document.querySelector('.offline-banner');
    if (offlineBanner && offlineBanner.style.display === 'block') {
      offlineBanner.style.display = 'none';
    }

    // 自動同期を開始
    if (this.pendingChanges.length > 0) {
      this.syncPendingChanges();
    }
  }

  /**
   * オフライン状態になったときの処理
   */
  handleOffline() {
    this.isOnline = false;
    console.log('⚠ オフライン状態です');

    // UI更新: オフラインバナーを表示
    const offlineBanner = document.querySelector('.offline-banner');
    if (offlineBanner) {
      offlineBanner.style.display = 'block';
    }
  }

  /**
   * 変更をローカルキューに追加
   */
  queueChange(change) {
    this.pendingChanges.push({
      ...change,
      timestamp: Date.now(),
      clientId: this.getClientId()
    });

    // ローカルストレージに保存
    this.savePendingChanges();
  }

  /**
   * ペンディング変更を保存
   */
  savePendingChanges() {
    try {
      localStorage.setItem('_pending_changes', JSON.stringify(this.pendingChanges));
    } catch (error) {
      console.error('ペンディング変更の保存失敗:', error);
    }
  }

  /**
   * ペンディング変更を読み込み
   */
  loadPendingChanges() {
    try {
      const data = localStorage.getItem('_pending_changes');
      this.pendingChanges = data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('ペンディング変更の読み込み失敗:', error);
      this.pendingChanges = [];
    }
  }

  /**
   * ペンディング変更を同期
   */
  async syncPendingChanges() {
    if (this.syncInProgress || !this.isOnline || this.pendingChanges.length === 0) {
      return;
    }

    this.syncInProgress = true;

    try {
      this.loadPendingChanges();

      for (const change of this.pendingChanges) {
        await this.syncChange(change);
      }

      // 同期完了後、ペンディングキューをクリア
      this.pendingChanges = [];
      this.savePendingChanges();
      this.lastSyncTime = Date.now();

      console.log('✓ 同期完了');

    } catch (error) {
      console.error('同期エラー:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * 個別の変更を同期
   */
  async syncChange(change) {
    try {
      if (typeof FirestoreBridge !== 'undefined') {
        FirestoreBridge.syncChange(JSON.stringify(change));
      }
    } catch (error) {
      console.error('変更の同期失敗:', error);
      throw error;
    }
  }

  /**
   * クライアントIDの取得/生成
   */
  getClientId() {
    let clientId = localStorage.getItem('_client_id');
    if (!clientId) {
      clientId = generateUUID();
      localStorage.setItem('_client_id', clientId);
    }
    return clientId;
  }

  /**
   * 競合解決: タイムスタンプベースの最後の書き込み勝ち
   */
  resolveConflict(localChange, remoteChange) {
    if (localChange.timestamp > remoteChange.timestamp) {
      return localChange;
    }
    return remoteChange;
  }
}

const offlineManager = new OfflineManager();

/**
 * 初期化時に呼び出す関数
 */
function initializePerformanceOptimization() {
  // メモリ監視を開始
  memoryManager.startMonitoring();

  // オフラインマネージャーの初期化
  offlineManager.loadPendingChanges();

  // Firestore最適化の初期化
  firestoreOptimizer.cacheQuery('initial', loadFromStorage(STORAGE_KEYS.TASKS, []));

  console.log('✓ パフォーマンス最適化を初期化しました');
}

/**
 * ブラウザアイドル時の最適化タスク
 */
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    // Firestoreキャッシュをクリア（古いデータ削除）
    const now = Date.now();
    firestoreOptimizer.queryCache.forEach((value, key) => {
      if (now - value.timestamp > 10 * 60 * 1000) {
        firestoreOptimizer.queryCache.delete(key);
      }
    });
  }, { timeout: 5000 });
}

// パフォーマンスメトリクスの記録
window.addEventListener('load', () => {
  performanceMetrics.loadTime = performance.now() - performanceMetrics.startTime;
  console.log(`📊 ページロード時間: ${Math.round(performanceMetrics.loadTime)}ms`);
});
