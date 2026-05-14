// story-render.js — Story房 DOM render helper（V5.1.7）
// 依賴：_storyImagePath, _updatePageLeftScrollable（保留於 v5.html）

function _ensureStoryDOM() {
  const book = document.getElementById('book');
  if (!document.getElementById('story-house')) {
    const marker = document.createElement('div');
    marker.id = 'story-house';
    marker.className = 'hidden';
    marker.style.display = 'contents';
    book.appendChild(marker);
  }

  const left = document.getElementById('page-left');
  const right = document.getElementById('page-right');

  // Story DOM 已存在則不重建（避免每次 renderScene 都清空 page-left/page-right）
  if (document.getElementById('story-text-area')) return;

  window.returnNotebookElementsToHouse?.();
  left.innerHTML = `
    <div id="scene-chapter-tag-container" style="position:absolute;top:12px;left:12px;z-index:2;"></div>
    <div id="story-image-main" style="width:100%;aspect-ratio:16/9;background:#f6efe3;border-radius:8px;background-size:contain;background-repeat:no-repeat;background-position:center;position:relative;"></div>
    <div id="story-image-overlay" style="width:100%;aspect-ratio:16/9;background-size:contain;background-repeat:no-repeat;background-position:center;position:absolute;left:0;right:0;top:0;pointer-events:none;transform:translateY(20px);opacity:0;transition:opacity .35s ease, transform .35s ease;"></div>
    <div id="story-image-caption" style="min-height:24px;font-size:14px;color:#6b4e2e;text-align:center;margin-top:8px;"></div>
    <div id="story-image-display" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:100%;margin-top:14px;"></div>
  `;
  right.innerHTML = `
    <div id="story-header" style="margin-bottom:4px;">
      <div class="story-header-text" id="story-event-label"></div>
      <div class="story-scene-title" id="story-scene-title-el"></div>
    </div>
    <div id="story-text-area" style="flex:1;overflow-y:auto;font-size:21px;line-height:1.8;color:var(--ink);font-family:var(--serif);"></div>
    <div style="border-top:1px solid rgba(90,58,16,0.12);margin:12px 0 8px;"></div>
    <div id="story-question-area" style="min-height:42px;font-size:20px;font-weight:700;color:var(--ink);font-family:var(--hei);"></div>
    <div id="story-choices-area" style="display:flex;flex-direction:column;gap:10px;margin-top:8px;"></div>
    <div id="story-advance-btn" style="min-height:54px;margin-top:8px;display:flex;justify-content:flex-end;align-items:center;"></div>
  `;
  left.style.position = 'relative';
  left.style.boxSizing = 'border-box';
  left.style.padding = '24px';
  right.style.boxSizing = 'border-box';
  right.style.padding = '24px';
  right.style.display = 'flex';
  right.style.flexDirection = 'column';
}

function _setBackgroundImage(el, imageId) {
  if (!el || !imageId) {
    if (el) el.style.backgroundImage = '';
    return;
  }
  el.style.backgroundImage = `url("${_storyImagePath(imageId)}")`;
}

function updateStoryImage(presentation) {
  const main = document.getElementById('story-image-main');
  const overlay = document.getElementById('story-image-overlay');
  const display = document.getElementById('story-image-display');
  const caption = document.getElementById('story-image-caption');

  _setBackgroundImage(main, presentation?.image);
  if (caption) caption.textContent = presentation?.caption || '';
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.transform = 'translateY(20px)';
    overlay.style.backgroundImage = '';
  }
  if (display) {
    const images = presentation?.display_images || [];
    display.innerHTML = images.map(item => `
      <div style="min-width:0;">
        <div style="aspect-ratio:1/1;background:#f8f1e6;border-radius:8px;background-image:url('${_storyImagePath(item.image)}');background-size:contain;background-repeat:no-repeat;background-position:center;"></div>
        <div style="font-size:13px;text-align:center;color:#6b4e2e;margin-top:4px;white-space:normal;">${item.caption || ''}</div>
      </div>
    `).join('');
  }
  _updatePageLeftScrollable();
}

function _triggerImageCue(presentation, lineIndex) {
  const cue = (presentation?.image_cues || []).find(item => item.trigger_line_index === lineIndex);
  const overlay = document.getElementById('story-image-overlay');
  if (!cue || !overlay) return;
  _setBackgroundImage(overlay, cue.image);
  overlay.style.opacity = '1';
  overlay.style.transform = 'translateY(0)';
}

function _renderLines(lines, container) {
  container.innerHTML = (lines || []).map((line, lineIndex) => {
    const text = typeof line === 'string' ? line : (line?.text || '');
    const chars = Array.from(text).map((ch, charIndex) => {
      const extra = (lineIndex === 0 && charIndex === 0) ? ' hl-first' : '';
      return `<span class="hl${extra}">${ch}</span>`;
    }).join('');
    return `<p data-line-index="${lineIndex}" style="margin:0 0 14px;">${chars}</p>`;
  }).join('');
}

function _setQuestion(text) {
  document.getElementById('story-question-area').textContent = text || '';
}

function _clearStoryControls() {
  _setQuestion('');
  document.getElementById('story-choices-area').innerHTML = '';
  document.getElementById('story-advance-btn').innerHTML = '';
}
