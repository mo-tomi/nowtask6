package com.nowtask.app.webview

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.Toast
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString

/**
 * 認証用のJavaScriptブリッジ
 */
class AndroidAuth(
    private val context: Context,
    private val auth: FirebaseAuth,
    private val webView: WebView,
    private val onSignInWithGoogle: () -> Unit
) {

    @JavascriptInterface
    fun signInWithGoogle() {
        android.util.Log.d("AndroidAuth", "signInWithGoogle called from JavaScript")
        Handler(Looper.getMainLooper()).post {
            android.util.Log.d("AndroidAuth", "Executing signInWithGoogle on main thread")
            onSignInWithGoogle()
        }
    }

    @JavascriptInterface
    fun signInWithTwitter() {
        Handler(Looper.getMainLooper()).post {
            Toast.makeText(context, "X (Twitter)認証機能は開発中です", Toast.LENGTH_SHORT).show()
        }
    }

    @JavascriptInterface
    fun signOut() {
        android.util.Log.d("AndroidAuth", "signOut called from JavaScript")
        Handler(Looper.getMainLooper()).post {
            val oldUid = auth.currentUser?.uid
            android.util.Log.d("AndroidAuth", "Signing out user: $oldUid")

            auth.signOut()
            Toast.makeText(context, "ログアウトしました", Toast.LENGTH_SHORT).show()

            auth.signInAnonymously()
                .addOnSuccessListener {
                    val newUid = auth.currentUser?.uid
                    android.util.Log.d("AndroidAuth", "Anonymous sign-in successful after logout. New UID: $newUid")
                    Toast.makeText(context, "匿名モードで再起動しました", Toast.LENGTH_SHORT).show()

                    // WebViewに通知してデータを再読み込み
                    Handler(Looper.getMainLooper()).post {
                        try {
                            webView.evaluateJavascript("if (typeof window.onAuthSignOut === 'function') { window.onAuthSignOut(); } else { console.error('onAuthSignOut not found'); }", null)
                            android.util.Log.d("AndroidAuth", "Called window.onAuthSignOut()")
                        } catch (e: Exception) {
                            android.util.Log.e("AndroidAuth", "Error calling onAuthSignOut", e)
                        }
                    }
                }
                .addOnFailureListener { e ->
                    android.util.Log.e("AndroidAuth", "Anonymous sign-in failed after logout", e)
                    Toast.makeText(context, "匿名モードへの切り替えに失敗しました", Toast.LENGTH_SHORT).show()
                }
        }
    }
}

// 旧FirestoreBridgeクラスは com.nowtask.app.data.FirestoreBridge に移行しました