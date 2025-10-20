// Firebase初期化とデータ同期（簡略化版）
(function() {
  // Firebase設定
  const firebaseConfig = {
    apiKey: "AIzaSyCJR0lvmiXMJyxwD3NmQ0VQAC43f3yk090",
    authDomain: "nowtask-7f9a5.firebaseapp.com",
    projectId: "nowtask-7f9a5",
    storageBucket: "nowtask-7f9a5.firebasestorage.app",
    messagingSenderId: "768185031227",
    appId: "1:768185031227:web:cc9f19eecd4123e2645a1e",
    measurementId: "G-RCL4RZ4ZZD"
  };

  // Firebase初期化
  try {
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    let currentUserId = null;
    let isFirebaseReady = false;

    // 匿名認証（非同期で実行、完了を待たない）
    auth.signInAnonymously()
      .then((userCredential) => {
        currentUserId = userCredential.user.uid;
        console.log('Firebase認証成功:', currentUserId);
        isFirebaseReady = true;
      })
      .catch((error) => {
        console.error('Firebase認証エラー:', error);
        // エラーでもLocalStorageは使えるので続行
        isFirebaseReady = false;
      });

    // 認証状態の監視
    auth.onAuthStateChanged((user) => {
      if (user) {
        currentUserId = user.uid;
        isFirebaseReady = true;
      } else {
        currentUserId = null;
        isFirebaseReady = false;
      }
    });

    // Firestoreからデータを読み込み（非同期で実行）
    function loadAllDataFromFirestore() {
      if (!currentUserId) return;

      const keys = [
        'nowtask_tasks',
        'nowtask_trash',
        'nowtask_shelved',
        'nowtask_settings',
        'nowtask_routines',
        'nowtask_task_history',
        'nowtask_templates',
        'nowtask_sort_pref'
      ];

      // 各データを非同期で読み込み（処理の完了を待たない）
      keys.forEach(key => {
        db.collection('users')
          .doc(currentUserId)
          .collection('nowtask_data')
          .doc(key)
          .get()
          .then((doc) => {
            if (doc.exists) {
              const data = doc.data().data;
              localStorage.setItem(key, data);
              console.log('Firestoreから読み込み:', key);
              
              // データが更新されたら画面を再描画（必要に応じて）
              if (typeof renderTasks === 'function') {
                setTimeout(renderTasks, 100);  // 少し遅延させて再描画
              }
            }
          })
          .catch((error) => {
            console.error('Firestore読み込みエラー:', key, error);
          });
      });
    }

    // 元のsaveToStorage関数を拡張
    window.originalSaveToStorage = window.saveToStorage || saveToStorage;
    window.saveToStorage = function(key, data) {
      // 常にLocalStorageに保存
      const result = window.originalSaveToStorage(key, data);

      // Firestoreにも保存（非同期で実行、重さを軽減）
      if (isFirebaseReady && currentUserId) {
        setTimeout(() => {
          const dataMap = {
            data: JSON.stringify(data),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          };

          db.collection('users')
            .doc(currentUserId)
            .collection('nowtask_data')
            .doc(key)
            .set(dataMap)
            .then(() => {
              console.log('Firestoreに保存成功:', key);
            })
            .catch((error) => {
              console.error('Firestore保存エラー:', key, error);
            });
        }, 0);  // 非同期で実行してUIのブロックを防ぐ
      }

      return result;
    };

    // 元のloadFromStorage関数を拡張
    window.originalLoadFromStorage = window.loadFromStorage || loadFromStorage;
    window.loadFromStorage = function(key, defaultValue = []) {
      // 常にLocalStorageから読み込み
      const localData = window.originalLoadFromStorage(key, defaultValue);

      // Firestoreから最新データを非同期で取得（処理の完了を待たない）
      if (isFirebaseReady && currentUserId) {
        setTimeout(() => {
          db.collection('users')
            .doc(currentUserId)
            .collection('nowtask_data')
            .doc(key)
            .get()
            .then((doc) => {
              if (doc.exists) {
                const data = JSON.parse(doc.data().data);
                localStorage.setItem(key, JSON.stringify(data));

                // データが更新されたら画面を再描画
                if (JSON.stringify(data) !== JSON.stringify(localData)) {
                  if (typeof renderTasks === 'function') {
                    renderTasks();
                  }
                }
              }
            })
            .catch((error) => {
              console.error('Firestore読み込みエラー:', key, error);
            });
        }, 0);  // 非同期で実行してUIのブロックを防ぐ
      }

      return localData;
    };

    // FirebaseのユーザーIDを取得する関数
    window.getFirebaseUserId = function() {
      return currentUserId || 'anonymous';
    };

    // Firebase準備完了フラグ
    window.isFirebaseReady = function() {
      return isFirebaseReady;
    };

  } catch (error) {
    console.error('Firebase初期化エラー:', error);
    // Firebase初期化に失敗しても、LocalStorageによる基本機能は使える
    
    // Firebaseを使用しない単純なsaveToStorageとloadFromStorageを設定
    window.saveToStorage = window.saveToStorage || saveToStorage;
    window.loadFromStorage = window.loadFromStorage || loadFromStorage;
    
    window.isFirebaseReady = function() {
      return false;
    };
  }

  console.log('Firebase初期化スクリプト読み込み完了');
})();
