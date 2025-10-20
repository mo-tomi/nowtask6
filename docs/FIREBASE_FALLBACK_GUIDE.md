# Firebase Fallback and Offline Support Guide

## Overview

The nowtask Android app has robust offline support and Firebase fallback mechanisms to ensure the app continues functioning even when Firebase is unavailable or the device is offline.

## Architecture

### Two-Layer Data Storage

1. **Room Database (Local SQLite)** - Primary offline storage
   - All app data is cached in Room Database
   - Stores sync status (SYNCED, PENDING, FAILED)
   - Provides offline-first experience

2. **Firebase Firestore** - Cloud sync layer
   - Synced when online
   - Optional for core functionality
   - Enables multi-device data sync

### Components

#### MainActivity.kt (android-app/app/src/main/java/com/nowtask/app/MainActivity.kt)

**Firebase Initialization (lines 83-101):**
```kotlin
// Firebase初期化
firestore = FirebaseFirestore.getInstance()
auth = FirebaseAuth.getInstance()

// ログインチェック
checkUserStatus()
```

**Anonymous Sign-In Fallback (lines 103-124):**
- If Firebase Auth fails, userId is set to `"anonymous"`
- App continues functioning with local storage only
- No data loss occurs

```kotlin
if (currentUser == null) {
    auth.signInAnonymously().addOnCompleteListener { task ->
        if (task.isSuccessful) {
            userId = auth.currentUser?.uid
        } else {
            userId = "anonymous"  // ← Fallback on failure
        }
        setupUIAndLoadApp()
    }
}
```

#### FirestoreBridge.kt (android-app/app/src/main/java/com/nowtask/app/data/FirestoreBridge.kt)

**Key Features:**

1. **Offline Persistence (lines 99-110)**
   - Firestore offline persistence is enabled
   - Data automatically synced to local cache

2. **Automatic Sync Queue (lines 136-149)**
   - When offline, operations are added to `syncQueue`
   - Stored in Room Database with PENDING status
   - Automatically synced when network is restored

3. **Retry Logic (lines 154-206)**
   - 3 automatic retry attempts for failed saves
   - Exponential backoff: 2s, 4s, 6s
   - Failed operations stored for manual retry

4. **Network State Monitoring**
   - `isNetworkAvailable()` checks connectivity
   - Uses SOURCE.SERVER when online (guaranteed latest data)
   - Uses SOURCE.CACHE when offline
   - `onNetworkAvailable()` callback triggers sync

5. **Data Corruption Detection (lines 467-497)**
   - Detects "[object Object]" serialization errors
   - Automatically deletes corrupted data
   - Prevents infinite loops with bad data

## Operational Flows

### Data Save Flow

```
saveData(key, value)
    ↓
[Network Check]
    ├→ ONLINE: saveDataWithRetry() → Firestore
    │   ├→ Success: cache + Room(SYNCED)
    │   └→ Failure (after 3 retries): sync queue + Room(FAILED)
    │
    └→ OFFLINE: sync queue + Room(PENDING)
        └→ Notify JS: "onSaveQueued"
```

### Data Load Flow

```
loadData(key)
    ↓
[Cache Check] → Found: return cached data
    ↓ Not Found
[Network Check]
    ├→ ONLINE: Firestore (SOURCE.SERVER) → cache + Room(SYNCED)
    └→ OFFLINE: Room Database → cache
```

### Network Restoration Flow

```
onNetworkAvailable()
    ↓
syncPendingData()
    ├→ Retry all PENDING operations (with exponential backoff)
    ├→ Retry all FAILED operations
    └→ Remove successful ops from sync queue
        └→ Notify JS: "onNetworkAvailable"
```

## User Experience

### Scenario 1: Online Mode (Firebase Active)
✅ Full functionality
- Data synced to Firestore automatically
- Multi-device sync works
- No data loss risk

### Scenario 2: Offline Mode
✅ Full functionality
- All operations queued locally
- UI responds normally
- No data loss (stored in Room)
- Silent sync when online

### Scenario 3: Firebase Down / No google-services.json
✅ Full functionality (LocalStorage-only mode)
- Anonymous user ID used
- All data stored in Room
- No cloud sync, but no errors
- Single device use only

### Scenario 4: Network Restored After Outage
✅ Automatic sync
- Pending operations resent automatically
- Failed operations retried with exponential backoff
- User gets notification: "オンラインに復帰しました"

## Configuration

### Room Database Setup
Location: `android-app/app/src/main/java/com/nowtask/app/data/local/`

- `AppDatabase.kt` - Room database definition
- `KeyValueEntity.kt` - Data entity with SyncStatus
- `KeyValueDao.kt` - Query interface

### Firebase Settings
Location: `android-app/app/build.gradle`

```gradle
// Firebase BoM (Bill of Materials)
implementation platform('com.google.firebase:firebase-bom:32.7.0')
implementation 'com.google.firebase:firebase-firestore-ktx'
implementation 'com.google.firebase:firebase-auth-ktx'
```

### google-services.json
- **Location**: `android-app/app/google-services.json`
- **Required for**: Firebase Auth & Firestore features
- **If missing**: App falls back to anonymous + LocalStorage-only

## Testing Firebase Fallback

### Test 1: No google-services.json
1. Remove `android-app/app/google-services.json`
2. Build and run app
3. Expected: App starts with "anonymous" user, tasks stored locally ✅

### Test 2: Network Offline → Online
1. Enable airplane mode
2. Create tasks (stored in Room)
3. Disable airplane mode
4. Expected: Tasks automatically sync to Firestore ✅

### Test 3: Firebase Temporarily Down
1. Build with google-services.json
2. Disable internet
3. Create tasks
4. Enable internet
5. Wait 15-30 seconds
6. Expected: Tasks sync to Firestore ✅

### Test 4: Corrupted Data Recovery
1. Manually corrupt Firestore document (e.g., "[object Object]")
2. Load app
3. Expected: Corrupted data detected and auto-deleted ✅

## Debugging

### Enable Firestore Logging

In `MainActivity.kt`:
```kotlin
// Firebase logging (debug builds only)
if (BuildConfig.DEBUG) {
    FirebaseFirestore.setLoggingEnabled(true)
}
```

### Key Log Tags
- `FirestoreBridge` - Data sync logs
- `MainActivity` - Auth & initialization logs
- `NetworkMonitor` - Network state changes

### Check Sync Queue Status

```javascript
// In WebView console
FirestoreBridge.getPendingOperationsCount()  // Returns pending op count
FirestoreBridge.isOnline()                   // Returns network status
FirestoreBridge.getUserId()                  // Returns current user
```

## Important Notes

### Data Consistency
- **Single user**: Room Database is single-writer, safe to use from anywhere
- **Multi-device**: Firebase Firestore provides cloud sync
- **Timestamps**: All operations include `System.currentTimeMillis()` for ordering

### Security
- All Firebase collections require Authentication (Firestore Rules)
- Anonymous users are restricted to their own UID
- Room Database is device-local (not accessible to other apps)

### Known Limitations
- Multi-device sync requires Firebase (no sync without google-services.json)
- Manual sync is not available (always automatic on network change)
- Maximum 3 automatic retries (then marked FAILED)

### Performance
- Memory: 4GB max for Gradle build (gradle.properties)
- Room Database: Auto-limited to prevent memory bloat
- Firestore cache: CACHE_SIZE_UNLIMITED (managed by Firebase)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-20 | Initial fallback architecture |

## Related Files

- `MainActicitiy.kt` - Auth and network handling
- `FirestoreBridge.kt` - Data sync implementation
- `NetworkMonitor.kt` - Network state detection
- `AppDatabase.kt` - Room database schema
- `firebase-init.js` - JavaScript Firebase initialization
