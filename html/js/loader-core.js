// loader-core.js
// 核心層：JSON載入器
// 規格依據：核心層規格文件.md §三

  const BASE_PATH = '../';
  const BGM_BASE = 'audio/';
  const SFX_BASE = 'audio/';
  const TTS_BASE = 'audio/tts/';
  const IMAGE_BASE = 'image/';
  const JSON_BASE = 'json/';

  const globalData = {
    config: null,
    map: null,
    asui_dialogues: null,
    asui_manifest: null,
    asui_presentation: null,
  };

  const eventData = {
    story: null,
    manifest: null,
    evaluation: null,
    presentation: null,
    notebook_content: null,
    notebook_presentation: null,
  };

  const gameData = {
    content: null,
    manifest: null,
    evaluation: null,
    presentation: null,
  };

  async function loadJSON(path) {
    const res = await fetch(BASE_PATH + path);
    if (!res.ok) throw new Error(`JSON load failed: ${path}`);
    return res.json();
  }

  async function loadGlobalData() {
    try {
      [
        globalData.config,
        globalData.map,
        globalData.asui_dialogues,
        globalData.asui_manifest,
        globalData.asui_presentation,
      ] = await Promise.all([
        loadJSON('json/config_global.json'),
        loadJSON('json/map_daliang.json'),
        loadJSON('json/asui_dialogues.json'),
        loadJSON('json/asui_manifest.json'),
        loadJSON('json/asui_presentation.json'),
      ]);
      const savedVersion = localStorage.getItem('la_json_version');
      if (savedVersion && savedVersion !== String(globalData.config.json_version)) {
        localStorage.removeItem('la_progress');
        localStorage.removeItem('la_assessment');
      }
      localStorage.setItem('la_json_version', String(globalData.config.json_version));
    } catch (e) {
      logError(e.message, 'loadGlobalData', state.uid);
    }
  }

  async function loadEventData(eventId) {
    try {
      [
        eventData.story,
        eventData.manifest,
        eventData.evaluation,
        eventData.presentation,
        eventData.notebook_content,
        eventData.notebook_presentation,
      ] = await Promise.all([
        loadJSON(`json/story_data_${eventId}.json`),
        loadJSON(`json/manifest_${eventId}.json`),
        loadJSON(`json/evaluation_data_${eventId}.json`),
        loadJSON(`json/presentation_schema_${eventId}.json`),
        loadJSON(`json/notebook_content_${eventId}.json`),
        loadJSON(`json/notebook_presentation_${eventId}.json`),
      ]);
    } catch (e) {
      logError(e.message, `loadEventData_${eventId}`, state.uid);
    }
  }

  async function loadGameData(gameIdOrLocation) {
    const locationMap = {
      game_1_warehouse: 'warehouse',
      game_1_market: 'market',
      game_1_bridge: 'bridge',
      game_1_inn: 'inn',
      game_1_dock: 'dock',
    };
    const location = locationMap[gameIdOrLocation] || gameIdOrLocation;
    try {
      [
        gameData.content,
        gameData.manifest,
        gameData.evaluation,
        gameData.presentation,
      ] = await Promise.all([
        loadJSON(`json/game_1_content_${location}.json`),
        loadJSON(`json/game_1_manifest_${location}.json`),
        loadJSON(`json/game_1_evaluation_${location}.json`),
        loadJSON(`json/game_1_presentation_${location}.json`),
      ]);
      return gameData;
    } catch (e) {
      logError(e.message, `loadGameData_${location}`, state.uid);
      return null;
    }
  }
