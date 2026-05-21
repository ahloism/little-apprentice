// firebase-core.js
// 核心層：Firebase 數據層
// 規格依據：核心層規格文件.md §二
// 注意：onAuthStateChanged / btn-account / 底部導航 listeners 全部在 v5.html 啟動區綁定

  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAiXcaWGypMAi3z-PoVi3tjuUuqwA8rO_w",
    authDomain: "little-apprentice.firebaseapp.com",
    projectId: "little-apprentice",
    storageBucket: "little-apprentice.firebasestorage.app",
    messagingSenderId: "854629298975",
    appId: "1:854629298975:web:d8c376bcad938c7945f62a",
    measurementId: "G-4GGG1CHRW5"
  };

  const _firebaseReady = FIREBASE_CONFIG.apiKey !== '';
  let auth = null;
  let db = null;

  if (_firebaseReady) {
    firebase.initializeApp(FIREBASE_CONFIG);
    auth = firebase.auth();
    db = firebase.firestore();
  } else {
    console.warn('[Dev] Firebase config未填，跳過Firebase初始化，核心層以mock模式運行');
    console.warn('[Dev] Firebase config 未設定，登入功能未啟用；請填入 Firebase web app config。');
  }

  async function loadProgress(uid) {
    try {
      const doc = await db.collection('users').doc(uid).collection('progress').doc('current').get();
      return doc.exists ? doc.data() : null;
    } catch (e) {
      logError(e.message, 'loadProgress', uid);
      return null;
    }
  }

  async function saveProgress(uid, data) {
    try {
      await db.collection('users').doc(uid).collection('progress').doc('current').set(
        { ...data, updated_at: firebase.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
      localStorage.setItem('la_progress', JSON.stringify({ ...state, updated_at: Date.now() }));
    } catch (e) {
      logError(e.message, 'saveProgress', uid);
    }
  }

  async function saveAssessment(uid, eventId, sceneId, data) {
    try {
      await db.collection('users').doc(uid)
        .collection('assessment').doc(eventId)
        .collection('scenes').doc(sceneId)
        .set({ ...data, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
    } catch (e) {
      logError(e.message, 'saveAssessment', uid);
    }
  }

  async function logError(message, context, userId) {
    if (!db) {
      console.warn('[Dev] logError skipped:', message, context, userId);
      return;
    }
    if (!userId) {
      console.warn('[logError] no userId, skipping Firestore write:', message, context);
      return;
    }
    try {
      await db.collection('users').doc(userId).collection('errors').add({
        message, context,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (e) {
      console.error('logError failed:', e);
    }
  }
