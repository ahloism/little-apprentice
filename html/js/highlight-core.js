// highlight-core.js
// 全產品共用高亮 helper
// 高亮不是故事房功能，而是全產品核心閱讀支援功能
// 所有模塊 render 文字時應使用 renderHLText / setHLText，確保 TTS 高亮生效

/**
 * 把文字逐字包成 .hl span
 * 用於任何需要 TTS 高亮的文字區域
 * @param {string} text
 * @returns {string} HTML string
 */
window.renderHLText = function(text) {
  return Array.from(text || '').map(function(ch) {
    var escaped = ch
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return '<span class="hl">' + escaped + '</span>';
  }).join('');
};

/**
 * 把元素的 innerHTML 設為 HL 包裝文字
 * 含保險：若 renderHLText 未載入，退化為 textContent
 * @param {Element} el
 * @param {string} text
 */
window.setHLText = function(el, text) {
  if (!el) return;
  if (typeof window.renderHLText === 'function') {
    el.innerHTML = window.renderHLText(text);
  } else {
    el.textContent = text || '';
  }
};
