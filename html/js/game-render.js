// game-render.js — 小遊戲 DOM render helper（V5.1.7）
// 依賴：_updatePageLeftScrollable, _optionImages, _escape（保留於 v5.html）

function _setGamePages(leftHTML, rightHTML) {
  document.getElementById('page-left').innerHTML = `<div class="game-page game-page-left">${leftHTML}</div>`;
  document.getElementById('page-right').innerHTML = `<div class="game-page game-page-right">${rightHTML}</div>`;
  _updatePageLeftScrollable();
}

function _showSecondStateVisuals(kind, optionIds) {
  const visual = document.getElementById('game-answer-visuals');
  if (!visual) return;
  if (kind === 'market') {
    visual.innerHTML = _optionImages(optionIds);
    _updatePageLeftScrollable();
    return;
  }
  if (kind === 'inn') {
    visual.innerHTML = _optionImages(optionIds);
    _updatePageLeftScrollable();
    return;
  }
  visual.innerHTML = _optionImages(optionIds);
  _updatePageLeftScrollable();
}

function _unlockGameOptions() {
  document.querySelectorAll('.game-option-btn').forEach(btn => { btn.disabled = false; });
}

function _button(id, text, extraClass = '') {
  return `<button id="${id}" class="game-action-btn ${extraClass} hidden">${_escape(text)}</button>`;
}

function _numberToChinese(n) {
  return ({1:'一',2:'兩',3:'三',4:'四',5:'五',6:'六',7:'七',8:'八',9:'九',10:'十'})[n] || String(n || '');
}
