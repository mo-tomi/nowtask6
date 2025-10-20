/**
 * ========================================
 * 認証関連のUIロジック
 * ========================================
 */

// DOM要素
const loginModal = document.getElementById('login-modal');
const mainContent = document.querySelector('.main-content');
const fab = document.getElementById('create-task-btn');
const googleLoginBtn = document.getElementById('google-login-btn');
const twitterLoginBtn = document.getElementById('twitter-login-btn');
const headerLoginBtn = document.getElementById('login-icon-btn');

/**
 * 認証状態をチェックしてUIを切り替える
 */
async function checkLoginState() {
    if (typeof FirestoreBridge === 'undefined' || typeof AndroidAuth === 'undefined') {
        console.log("Waiting for Android bridges to be available...");
        setTimeout(checkLoginState, 200);
        return;
    }

    try {
        const userId = FirestoreBridge.getUserId();

        if (userId && userId !== 'anonymous') {
            // ログイン済み: データを読み込んでからアプリを起動
            console.log("User is logged in (Google account). Loading initial data...");
            loadInitialData(startApp);
        } else {
            // 匿名ユーザー: アプリを起動（ログインは任意）
            console.log("User is anonymous. Starting app anyway...");
            loadInitialData(startApp);
        }
    } catch (e) {
        console.error("Error checking login state:", e);
        // エラーが発生してもアプリを起動
        loadInitialData(startApp);
    }
}

/**
 * ログイン画面を表示
 */
function showLogin() {
    console.log("=== showLogin called ===");
    if (!loginModal) {
        console.error("loginModal element not found!");
        return;
    }

    // ログイン状態に応じてモーダルの内容を切り替え
    updateLoginModal();

    loginModal.style.display = 'flex';
    if (mainContent) mainContent.style.display = 'none';
    if (fab) fab.style.display = 'none';
    console.log("Login modal displayed, main content hidden");
}

/**
 * ログインモーダルの内容を更新
 */
function updateLoginModal() {
    console.log("updateLoginModal called");
    if (typeof FirestoreBridge === 'undefined') {
        console.log("FirestoreBridge is undefined, skipping modal update");
        return;
    }

    const isAnon = FirestoreBridge.isAnonymous();
    console.log("User is anonymous:", isAnon);

    const loginFormSection = document.getElementById('login-form-section');
    const accountInfoSection = document.getElementById('account-info-section');
    const modalTitle = document.getElementById('login-modal-title');

    console.log("Modal elements found:", {
        loginFormSection: !!loginFormSection,
        accountInfoSection: !!accountInfoSection,
        modalTitle: !!modalTitle
    });

    if (isAnon) {
        // 匿名ユーザー: ログインフォームを表示
        console.log("Showing login form for anonymous user");
        if (loginFormSection) loginFormSection.style.display = 'block';
        if (accountInfoSection) accountInfoSection.style.display = 'none';
        if (modalTitle) modalTitle.textContent = 'ログイン';
    } else {
        // ログイン済みユーザー: アカウント情報を表示
        console.log("Showing account info for logged-in user");
        if (loginFormSection) loginFormSection.style.display = 'none';
        if (accountInfoSection) accountInfoSection.style.display = 'block';
        if (modalTitle) modalTitle.textContent = 'アカウント';

        // アカウント情報を取得して表示
        const displayName = FirestoreBridge.getUserDisplayName();
        const email = FirestoreBridge.getUserEmail();
        console.log("Account info:", { displayName, email });

        const displayNameEl = document.getElementById('account-display-name');
        const emailEl = document.getElementById('account-email');
        const statusEl = document.getElementById('account-status');

        console.log("Account info elements found:", {
            displayNameEl: !!displayNameEl,
            emailEl: !!emailEl,
            statusEl: !!statusEl
        });

        if (displayNameEl) displayNameEl.textContent = displayName;
        if (emailEl) emailEl.textContent = email || 'メールアドレス未設定';
        if (statusEl) statusEl.textContent = 'Googleアカウントでログイン済み';
    }
}

/**
 * メインアプリ画面を表示
 */
function showMainApp() {
    console.log("=== showMainApp called ===");
    console.log("loginModal:", loginModal, "mainContent:", mainContent, "fab:", fab);

    if (loginModal) {
        loginModal.style.display = 'none';
        console.log("Login modal hidden");
    }
    if (mainContent) {
        mainContent.style.display = 'block';
        console.log("Main content displayed");
    }
    if (fab) {
        fab.style.display = 'flex';
        console.log("FAB displayed");
    }
    console.log("=== showMainApp completed ===");
}

// イベントリスナーが既に初期化されたかのフラグ
let authListenersInitialized = false;

/**
 * 認証関連のイベントリスナーを初期化
 */
function initAuthEventListeners() {
    // 既に初期化済みなら何もしない
    if (authListenersInitialized) {
        console.log("Auth event listeners already initialized, skipping");
        return;
    }

    console.log("Initializing auth event listeners");
    authListenersInitialized = true;

    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            if (googleLoginBtn.disabled) {
                console.log("Google login already in progress, ignoring click");
                return;
            }

            googleLoginBtn.disabled = true;
            console.log("Google login button clicked, calling AndroidAuth.signInWithGoogle()");

            if (typeof AndroidAuth !== 'undefined') {
                AndroidAuth.signInWithGoogle();
            }

            // ボタンを5秒後に再有効化（認証が失敗した場合のため）
            setTimeout(() => {
                googleLoginBtn.disabled = false;
                console.log("Google login button re-enabled");
            }, 5000);
        });
    }

    if (twitterLoginBtn) {
        twitterLoginBtn.addEventListener('click', () => {
            if (twitterLoginBtn.disabled) return;

            twitterLoginBtn.disabled = true;

            if (typeof AndroidAuth !== 'undefined') {
                AndroidAuth.signInWithTwitter();
            }

            setTimeout(() => {
                twitterLoginBtn.disabled = false;
            }, 5000);
        });
    }

    if (headerLoginBtn) {
        headerLoginBtn.addEventListener('click', () => {
            console.log("Login icon button clicked");
            // ログイン状態に関わらず、モーダルを表示
            // モーダル内で匿名ユーザーならログインフォーム、ログイン済みならアカウント情報を表示
            showLogin();
        });
    }

    // ログインモーダルの閉じるボタン
    const closeLoginBtn = document.getElementById('close-login-btn');
    if (closeLoginBtn) {
        closeLoginBtn.addEventListener('click', () => {
            showMainApp();
        });
    }

    // 匿名のまま使い続けるボタン
    const continueAnonymousBtn = document.getElementById('continue-anonymous-btn');
    if (continueAnonymousBtn) {
        continueAnonymousBtn.addEventListener('click', () => {
            showMainApp();
        });
    }

    // ログアウトボタン
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // ログインモーダルを先に閉じる
            if (loginModal) loginModal.style.display = 'none';

            // 確認ダイアログを表示
            confirmAction('ログアウトしますか？\n\n匿名モードに戻ります。\nログアウト後もデータはクラウドに保存されており、次回ログイン時に復元できます。', () => {
                if (typeof AndroidAuth !== 'undefined') {
                    AndroidAuth.signOut();
                }
            });
        });
    }
}

/**
 * 認証機能の初期化
 */
function initAuth() {
    initAuthEventListeners();
    checkLoginState();
}

// グローバルスコープに関数を公開（ネイティブからのコールバック用）
window.onAuthSuccess = function() {
    console.log("=== onAuthSuccess called ===");

    // ログインボタンを再有効化
    if (googleLoginBtn) googleLoginBtn.disabled = false;
    if (twitterLoginBtn) twitterLoginBtn.disabled = false;

    try {
        console.log("Starting loadInitialData...");
        // データを再読み込み
        loadInitialData(() => {
            console.log("Data reloaded after authentication.");
            console.log("appData.nowtask_tasks:", window.appData['nowtask_tasks']);
            console.log("Number of tasks:", window.appData['nowtask_tasks'] ? window.appData['nowtask_tasks'].length : 0);

            console.log("Calling renderTasks()...");
            renderTasks();
            console.log("renderTasks() completed.");

            // モーダルを閉じてメインアプリを表示
            console.log("Calling showMainApp()...");
            showMainApp();
            console.log("showMainApp() completed.");

            console.log("=== UI updated successfully after authentication ===");
        });
    } catch (e) {
        console.error("Error in onAuthSuccess:", e);
        // エラーが発生してもアプリは使えるようにする
        showMainApp();
    }
}

window.onAuthCanceled = function() {
    console.log("Authentication was canceled or failed, re-enabling login buttons.");

    // ログインボタンを再有効化
    if (googleLoginBtn) googleLoginBtn.disabled = false;
    if (twitterLoginBtn) twitterLoginBtn.disabled = false;
}

window.onAuthSignOut = function() {
    console.log("=== onAuthSignOut called ===");

    try {
        console.log("Starting loadInitialData for anonymous user...");
        // データを再読み込み（匿名ユーザーのデータを読み込む）
        loadInitialData(() => {
            console.log("Data reloaded after sign out.");
            console.log("appData.nowtask_tasks:", window.appData['nowtask_tasks']);
            console.log("Number of tasks:", window.appData['nowtask_tasks'] ? window.appData['nowtask_tasks'].length : 0);

            console.log("Calling renderTasks()...");
            renderTasks();
            console.log("renderTasks() completed.");

            // モーダルを閉じてメインアプリを表示
            console.log("Calling showMainApp()...");
            showMainApp();
            console.log("showMainApp() completed.");

            console.log("=== UI updated successfully after sign out ===");
        });
    } catch (e) {
        console.error("Error in onAuthSignOut:", e);
        // エラーが発生してもアプリは使えるようにする
        showMainApp();
    }
}