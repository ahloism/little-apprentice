// notebook-render.js — 學徒筆記 DOM render helper（V5.1.7）
// 依賴：_storyImagePath, _updatePageLeftScrollable（保留於 v5.html）

function renderNotebookLeft(content, reflectionList, eventId) {
  const left = content.notebook_left || {};
  const chapterNum = (eventId || '').split('_')[1] || '1';
  document.getElementById('notebook-title-left').textContent = `學徒筆記．第${_chapterToChinese(parseInt(chapterNum))}章`;
  document.getElementById('notebook-section-adventure').textContent = '今次的冒險……';

  const progressEl = document.getElementById('notebook-story-progress');
  progressEl.innerHTML = '';
  (left.story_progress || []).forEach(sentence => {
    const p = document.createElement('p');
    p.textContent = sentence;
    progressEl.appendChild(p);
  });

  const placesEl = document.getElementById('notebook-places');
  placesEl.innerHTML = '';
  if ((left.places_visited || []).length) {
    const label = document.createElement('span');
    label.className = 'notebook-meta-label';
    label.textContent = '去了：';
    placesEl.appendChild(label);
    (left.places_visited).forEach(place => {
      const tag = document.createElement('span');
      tag.className = 'notebook-tag';
      tag.textContent = place;
      placesEl.appendChild(tag);
    });
  }

  const peopleEl = document.getElementById('notebook-people');
  peopleEl.innerHTML = '';
  if ((left.people_met || []).length) {
    const label = document.createElement('span');
    label.className = 'notebook-meta-label';
    label.textContent = '遇到：';
    peopleEl.appendChild(label);
    (left.people_met).forEach(person => {
      const tag = document.createElement('span');
      tag.className = 'notebook-tag';
      tag.textContent = person;
      peopleEl.appendChild(tag);
    });
  }

  document.getElementById('notebook-reflection-title').textContent = '阿禾的筆記';

  const reflEl = document.getElementById('notebook-reflections');
  reflEl.innerHTML = '';
  reflectionList.forEach(r => {
    const p = document.createElement('p');
    p.className = 'notebook-reflection';
    p.textContent = r.text;
    reflEl.appendChild(p);
  });
}

function renderNotebookRight(content) {
  const right = content.notebook_right || {};
  document.getElementById('notebook-title-right').textContent = '今次學到了……';

  const lpEl = document.getElementById('notebook-learned-points');
  lpEl.innerHTML = '';
  (right.learned_points || []).forEach(lp => {
    const p = document.createElement('p');
    p.className = `notebook-lp notebook-lp-${lp.type || 'default'}`;
    p.textContent = lp.content;
    lpEl.appendChild(p);
  });

  const imgEl = document.getElementById('notebook-anchor-image');
  imgEl.innerHTML = '';
  if (right.anchor_image) {
    const img = document.createElement('img');
    img.src = _storyImagePath(right.anchor_image);
    img.className = 'notebook-anchor-image';
    imgEl.appendChild(img);
  }
}

function _mountNotebookPages() {
  const left = document.getElementById('page-left');
  const right = document.getElementById('page-right');
  const notebookHouse = document.getElementById('notebook-house');
  if (!left || !right || !notebookHouse) return;

  const leftIds = ['notebook-title-left','notebook-section-adventure','notebook-story-progress','notebook-places','notebook-people','notebook-reflection-title','notebook-reflections'];
  const rightIds = ['notebook-title-right','notebook-learned-points','notebook-anchor-image','notebook-advance-btn'];

  // 先把所有筆記元素歸還到 notebook-house，再清空書頁
  [...leftIds, ...rightIds].forEach(id => {
    const el = document.getElementById(id);
    if (el) notebookHouse.appendChild(el);
  });

  left.innerHTML = '';
  right.innerHTML = '';

  leftIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) left.appendChild(el);
  });
  rightIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) right.appendChild(el);
  });
  _updatePageLeftScrollable();
}
