package com.nowtask.app.utils

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Build

/**
 * ネットワーク接続をチェック
 */
fun isNetworkAvailable(context: Context): Boolean {
    val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    val network = connectivityManager.activeNetwork ?: return false
    val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false

    return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
}

/**
 * ネットワーク状態を監視するリスナー
 */
interface NetworkStateListener {
    fun onNetworkAvailable()
    fun onNetworkLost()
}

/**
 * ネットワーク状態を監視するマネージャー
 */
class NetworkMonitor(
    private val context: Context,
    private val listener: NetworkStateListener
) {
    private val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    private var networkCallback: ConnectivityManager.NetworkCallback? = null
    private var isRegistered = false

    companion object {
        private const val TAG = "NetworkMonitor"
    }

    /**
     * ネットワーク監視を開始
     */
    fun startMonitoring() {
        if (isRegistered) {
            android.util.Log.w(TAG, "Network monitoring already started")
            return
        }

        val networkRequest = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
            .addTransportType(NetworkCapabilities.TRANSPORT_CELLULAR)
            .build()

        networkCallback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                android.util.Log.d(TAG, "Network available: $network")
                listener.onNetworkAvailable()
            }

            override fun onLost(network: Network) {
                android.util.Log.d(TAG, "Network lost: $network")
                listener.onNetworkLost()
            }

            override fun onCapabilitiesChanged(
                network: Network,
                networkCapabilities: NetworkCapabilities
            ) {
                val hasInternet = networkCapabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                android.util.Log.d(TAG, "Network capabilities changed. Has internet: $hasInternet")
            }
        }

        try {
            connectivityManager.registerNetworkCallback(networkRequest, networkCallback!!)
            isRegistered = true
            android.util.Log.d(TAG, "Network monitoring started")
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Failed to register network callback", e)
        }
    }

    /**
     * ネットワーク監視を停止
     */
    fun stopMonitoring() {
        if (!isRegistered || networkCallback == null) {
            android.util.Log.w(TAG, "Network monitoring not started or already stopped")
            return
        }

        try {
            connectivityManager.unregisterNetworkCallback(networkCallback!!)
            isRegistered = false
            networkCallback = null
            android.util.Log.d(TAG, "Network monitoring stopped")
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Failed to unregister network callback", e)
        }
    }
}
