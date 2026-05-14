// report-render.js — 報告房 DOM render helper（V5.1.7）
// 依賴：DIMENSION_CONFIG, DIMENSION_DESCRIPTIONS, _reportLevelToStars（保留於 v5.html）

function _renderDimensions(dimensions) {
  const container = document.getElementById('report-dimensions');
  container.innerHTML = '';
  DIMENSION_CONFIG.forEach(({ key, label }) => {
    const level = dimensions[key] || 4;
    const row = document.createElement('div');
    row.className = 'report-dimension-row';
    row.innerHTML = `
      <div class="dimension-label">${label}</div>
      <div class="dimension-stars">${_reportLevelToStars(level)}</div>
      <div class="dimension-desc">${DIMENSION_DESCRIPTIONS[key][level - 1]}</div>
    `;
    container.appendChild(row);
  });
}

function _showQualitativeLoading() {
  document.getElementById('report-qualitative-text').textContent = '';
  document.getElementById('report-qualitative-loading').classList.remove('hidden');
}

function _fillQualitativeReport(text) {
  document.getElementById('report-qualitative-loading').classList.add('hidden');
  document.getElementById('report-qualitative-text').textContent = text;
}
