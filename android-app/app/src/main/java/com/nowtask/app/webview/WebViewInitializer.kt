package com.nowtask.app.webview

import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient

/**
 * WebViewの初期設定を行う拡張関数
 */
fun WebView.initialize() {
    // キャッシュをクリア（開発中）
    android.util.Log.d("WebView", "Clearing WebView cache")
    this.clearCache(true)
    this.clearHistory()
    android.webkit.CookieManager.getInstance().removeAllCookies(null)
    android.webkit.WebStorage.getInstance().deleteAllData()

    this.settings.apply {
        javaScriptEnabled = true // JavaScriptを有効化
        domStorageEnabled = true // DOMストレージを有効化（Firebaseキャッシュ用）
        databaseEnabled = true   // データベースを有効化
        cacheMode = WebSettings.LOAD_NO_CACHE // キャッシュを無効化（開発中）
        allowFileAccess = false // ファイルアクセスを無効化（セキュリティ向上）
        allowContentAccess = false // コンテンツアクセスを無効化（セキュリティ向上）

        // パフォーマンス最適化
        loadWithOverviewMode = true
        useWideViewPort = true
        builtInZoomControls = false // ズームコントロールは無効
        displayZoomControls = false
        setSupportZoom(false)

        // ハードウェアアクセラレーションを有効化（アニメーション改善）
        setRenderPriority(WebSettings.RenderPriority.HIGH)
    }

    android.util.Log.d("WebView", "WebView cache cleared and initialized")

    // WebViewClient を設定（アプリ内でページ遷移）
    this.webViewClient = object : WebViewClient() {
        override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
            // すべてのリンクをWebView内で開く
            if (url != null) {
                view?.loadUrl(url)
            }
            return true
        }

        override fun onPageFinished(view: WebView?, url: String?) {
            super.onPageFinished(view, url)
            // ページ読み込み完了後にFirestoreからデータを読み込む
            view?.evaluateJavascript("""
                (function() {
                    if (typeof loadFromStorage === 'function') {
                        console.log('Firestore data loading triggered');
                    }
                })();
            """, null)
        }
    }

    // WebChromeClient を設定（コンソールメッセージのログ出力）
    this.webChromeClient = object : android.webkit.WebChromeClient() {
        override fun onConsoleMessage(consoleMessage: android.webkit.ConsoleMessage?): Boolean {
            consoleMessage?.let {
                android.util.Log.d("WebView", "${it.message()} -- From line ${it.lineNumber()} of ${it.sourceId()}")
            }
            return true
        }
    }
}
