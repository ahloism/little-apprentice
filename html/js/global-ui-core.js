// global-ui-core.js
// 核心層：Global UI + Cloudflare Workers接口
// 規格依據：核心層規格文件.md §七、§八

  // ========== Global UI ==========

  function updateCoinDisplay() {
    document.getElementById('display-coins').textContent = '🪙 ' + state.coins + ' 文';
  }

  function initGlobalUI() {
    const btnBGM = document.getElementById('btn-bgm');
    const btnTTS = document.getElementById('btn-tts');
    const btnSpeed = document.getElementById('btn-speed');
    const btnProgress = document.getElementById('btn-progress');

    btnBGM.addEventListener('click', () => {
      state.bgm_on = !state.bgm_on;
      setMuted('bgm', !state.bgm_on);
      btnBGM.textContent = state.bgm_on ? '🎵 音樂' : '🎵 音樂✕';
      unlockAudioContext();
    });

    btnTTS.addEventListener('click', () => {
      state.tts_on = !state.tts_on;
      btnTTS.textContent = state.tts_on ? '🔊 語音' : '🔊 語音✕';
      btnSpeed.disabled = !state.tts_on;
      btnSpeed.style.opacity = state.tts_on ? '1' : '0.4';
      if (state.tts_on) {
        resumeTTS();
      } else {
        cancelTTSQueue();
        _lockUI(false);
        document.dispatchEvent(new Event('tts:ended'));
        setTimeout(() => _lockUI(false), 100);
      }
      unlockAudioContext();
    });

    const speeds = ['slow', 'normal', 'fast'];
    const speedLabels = { slow: '慢', normal: '正常', fast: '快' };
    btnSpeed.addEventListener('click', () => {
      const idx = speeds.indexOf(state.speed);
      const next = speeds[(idx + 1) % speeds.length];
      setSpeed(next);
      btnSpeed.textContent = speedLabels[next];
      unlockAudioContext();
    });

    btnProgress?.addEventListener('click', () => {
      openProgressPanel();
    });

    updateCoinDisplay();
  }

  // ========== Cloudflare Workers接口 ==========

  const WORKERS_ENDPOINT = 'https://little-apprentice-report.ahloism.workers.dev';

  async function requestReport(uid, eventId, dimensions, exploration, hiddenNodes) {
    try {
      const res = await fetch(`${WORKERS_ENDPOINT}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, event_id: eventId, dimensions, exploration, hidden_nodes: hiddenNodes })
      });
      const data = await res.json();
      return data.report || null;
    } catch (e) {
      logError(e.message, 'requestReport', uid);
      return null;
    }
  }

  async function requestNotify(uid, email, eventId, notebookSummary) {
    try {
      await fetch(`${WORKERS_ENDPOINT}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, email, event_id: eventId, notebook_summary: notebookSummary })
      });
    } catch (e) {
      logError(e.message, 'requestNotify', uid);
    }
  }
