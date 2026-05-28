// state-core.js
// 核心層：狀態管理
// 規格依據：核心層規格文件.md §四

  const SPEED_RATE = { slow: 0.75, normal: 1.0, fast: 1.3 };

  const SAVE_POINTS = {
    '1_1': ['1_1_3','1_1_5','1_1_7','1_1_8','1_1_10'],
    '1_2': ['1_2_3','1_2_4','1_2_9'],
    '1_3': ['1_3_2','1_3_5','1_3_8'],
    '1_4': [],
    '1_5': ['1_5_2','1_5_4','1_5_7','1_5_8'],
    '1_6': ['1_6_2','1_6_4'],
    '1_7': [],
  };

  const state = {
    uid: null,
    current_scene: null,
    current_event: null,
    coins: 0,
    completed_events: [],
    map_segments: {},
    explored_scenes: [],
    visited_sub_scenes: {},
    assessment_nodes: [],
    claimed_rewards: [],
    speed: 'normal',
    bgm_on: true,
    tts_on: true,
  };

  const _saveCooldown = {};

  async function initProgress(uid) {
    let progress = await loadProgress(uid);
    if (!progress) {
      const cached = localStorage.getItem('la_progress');
      if (cached) progress = JSON.parse(cached);
    }
    if (progress) {
      Object.assign(state, progress);
      state.uid = uid;
      if (!state.current_event) {
        state.current_event = state.current_scene
          ? state.current_scene.split('_').slice(0,2).join('_')
          : null;
      }
      if (!state.claimed_rewards) {
        state.claimed_rewards = [];
      }
    }
  }

  async function saveCurrentProgress() {
    if (!state.uid) return;
    const key = 'scene_' + state.current_scene;
    const now = Date.now();
    if (_saveCooldown[key] && now - _saveCooldown[key] < 5000) return;
    _saveCooldown[key] = now;
    await saveProgress(state.uid, {
      current_scene: state.current_scene,
      current_event: state.current_event,
      coins: state.coins,
      completed_events: state.completed_events,
      map_segments: state.map_segments,
      explored_scenes: state.explored_scenes,
      visited_sub_scenes: state.visited_sub_scenes,
      claimed_rewards: state.claimed_rewards,
      assessment_nodes: state.assessment_nodes,
    });
  }

  function isSavePoint(sceneId) {
    const eventId = sceneId.split('_').slice(0,2).join('_');
    return (SAVE_POINTS[eventId] || []).includes(sceneId);
  }

  function addCoins(amount) {
    state.coins += amount;
    const cooldownKey = 'coins';
    const now = Date.now();
    if (!_saveCooldown[cooldownKey] || now - _saveCooldown[cooldownKey] >= 5000) {
      _saveCooldown[cooldownKey] = now;
      saveProgress(state.uid, { coins: state.coins });
    }
  }

  function markSceneVisited(sceneId) {
    if (!state.explored_scenes.includes(sceneId)) {
      state.explored_scenes.push(sceneId);
    }
  }

  function getCurrentUserId() { return state.uid; }
  function getCurrentScene() { return state.current_scene; }

  function setCurrentScene(sceneId) {
    state.current_scene = sceneId;
    state.current_event = sceneId ? sceneId.split('_').slice(0,2).join('_') : null;
  }

  function getSavedSceneForEvent(eventId) {
    return state.current_scene && state.current_scene.split('_').slice(0,2).join('_') === eventId
      ? state.current_scene
      : null;
  }

  function getVisitedSubSceneTags(parentSceneId) {
    return new Set(state.visited_sub_scenes[parentSceneId] || []);
  }

  function markSubSceneVisited(parentSceneId, tag, sceneId) {
    if (!state.visited_sub_scenes[parentSceneId]) state.visited_sub_scenes[parentSceneId] = [];
    if (tag && !state.visited_sub_scenes[parentSceneId].includes(tag)) {
      state.visited_sub_scenes[parentSceneId].push(tag);
    }
    markSceneVisited(sceneId || tag);
  }

  function markEventCompleted(eventId, location) {
    if (!state.completed_events.includes(eventId)) state.completed_events.push(eventId);
  }

  function recordAssessment(eventId, sceneId, data) {
    const exists = state.assessment_nodes.some(n => n.sceneId === sceneId);
    if (exists) return;
    state.assessment_nodes.push({ sceneId, ...data });
    // [DEPRECATED FALLBACK] la_assessment legacy cache
    // No runtime reads remain. Planned removal after expanded testing + V5.2 stable.
    // Do not add new reads. Do not rely on this for any feature logic.
    try {
      localStorage.setItem('la_assessment', JSON.stringify({ nodes: [...state.assessment_nodes] }));
    } catch {}
    const cooldownKey = 'assessment_' + sceneId;
    const now = Date.now();
    if (!_saveCooldown[cooldownKey] || now - _saveCooldown[cooldownKey] >= 5000) {
      _saveCooldown[cooldownKey] = now;
      saveAssessment(state.uid, eventId, sceneId, data);
    }
  }

  function claimReward(rewardId, amount) {
    if (!amount) return false;
    if (state.claimed_rewards.includes(rewardId)) return false;
    state.claimed_rewards.push(rewardId);
    addCoins(amount);
    saveCurrentProgress();
    return true;
  }

  function showReloadOptions() {
    if (typeof _renderOpeningButtons === 'function') _renderOpeningButtons();
  }
