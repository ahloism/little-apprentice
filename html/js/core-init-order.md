# Core JS 載入順序說明

V5.2 Core extraction（2026-05-21）

## 載入順序

1. firebase-app-compat.js       （Firebase SDK，CDN）
2. firebase-auth-compat.js      （Firebase SDK，CDN）
3. firebase-firestore-compat.js （Firebase SDK，CDN）
4. highlight-core.js
5. story-render.js
6. notebook-render.js
7. game-render.js
8. report-render.js
9.  firebase-core.js    ← Firebase config/init + loadProgress/saveProgress/saveAssessment/logError
10. loader-core.js      ← BASE_PATH 常數 + globalData/eventData/gameData + load 函數
11. state-core.js       ← state 物件 + 狀態管理函數
12. audio-core.js       ← TTS引擎 + 音樂系統
13. global-ui-core.js   ← Global UI + Cloudflare Workers接口
14. v5.html <script>    ← 骨架函數(showRoom/playBookOpenAnimation) + 所有房間模塊 + 啟動 + DOM bindings

## 邊界設計原則

firebase-core.js = 純數據層
  - 包含：Firebase init（auth/db）+ loadProgress/saveProgress/saveAssessment/logError
  - 不包含：任何 DOM listener、onAuthStateChanged

v5.html 啟動區 = App lifecycle binding
  - init() 執行完畢後才綁定
  - onAuthStateChanged、btn-account、btn-notebook-nav、btn-back-to-map-nav

## 未拆出的模塊（V5.2 後期處理）

Opening房、Story房、學徒筆記層、學習進度面板、Map房、阿水層、小遊戲房、大地圖房、報告房
