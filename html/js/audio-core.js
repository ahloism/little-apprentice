// audio-core.js
// 核心層：TTS引擎 + 音樂系統
// 規格依據：核心層規格文件.md §五、§六

  // ========== TTS引擎 ==========

  let _ttsAudio = null;
  let _ttsHighlightTimer = null;
  let _ttsHighlightTimers = [];
  let _ttsStopped = false;
  let _ttsCancelled = false;
  let _ttsResolve = null;
  let _ttsSessionId = 0;

  const TTS_DEBUG = false;
  function ttsLog(...args) {
    if (TTS_DEBUG) console.log('[TTS]', ...args);
  }

  async function playLine(audioPath, timestampsPath, textElement) {
    if (!state.tts_on) return Promise.resolve();
    if (_ttsCancelled) return Promise.resolve();
    stopTTS();
    _ttsStopped = false;
    const mySession = _ttsSessionId;
    ttsLog(`playLine start session=${mySession}`, audioPath.split('/').pop());
    return new Promise(async (resolve) => {
      _ttsResolve = resolve;
      let timestamps = null;
      try {
        const res = await fetch(encodeURI(BASE_PATH + timestampsPath));
        if (res.ok) timestamps = await res.json();
      } catch (e) { /* fallback */ }

      if (mySession !== _ttsSessionId || _ttsCancelled || _ttsStopped) {
        ttsLog(`playLine aborted after fetch, mySession=${mySession}, current=${_ttsSessionId}`);
        resolve(); return;
      }

      ttsLog(`playLine before play session=${mySession}`, audioPath.split('/').pop());
      _ttsAudio = new Audio(encodeURI(BASE_PATH + audioPath));
      _ttsAudio.playbackRate = SPEED_RATE[state.speed];
      _ttsAudio.volume = _ttsTargetVolume;

      if (timestamps && textElement) {
        _ttsAudio.addEventListener('play', () => {
          _scheduleHighlights(timestamps.words, textElement);
        });
      }

      _ttsAudio.addEventListener('ended', () => {
        ttsLog(`playLine ended session=${mySession}`, audioPath.split('/').pop());
        _ttsResolve = null;
        document.dispatchEvent(new Event('tts:ended'));
        resolve();
      });
      _ttsAudio.addEventListener('error', async () => {
        logError('TTS mp3 failed, fallback', audioPath, state.uid);
        await _ttsWebSpeechFallback(textElement);
        _ttsResolve = null;
        resolve();
      });

      try {
        await _ttsAudio.play();
      } catch (e) {
        await _ttsWebSpeechFallback(textElement);
        _ttsResolve = null;
        resolve();
      }
    });
  }

  async function playTTS(filename, options = {}) {
    if (!state.tts_on) {
      if (options.lockUI !== false) _lockUI(false);
      if (options.onEnd) options.onEnd();
      return;
    }
    const mp3Path = TTS_BASE + filename;
    const tsPath = TTS_BASE + filename.replace('.mp3', '.json');
    const el = options.textElement || null;
    const mySession = ++_ttsSessionId;
    if (options.duckBGM !== false) duckBGM({ volume: 0.12, fadeMs: 200 });
    if (options.lockUI !== false) _lockUI(true);
    await playLine(mp3Path, tsPath, el);
    if (mySession !== _ttsSessionId) return;
    if (options.duckBGM !== false) restoreBGM({ fadeMs: 400 });
    if (options.lockUI !== false) _lockUI(false);
    if (options.onEnd) options.onEnd();
  }

  function stopTTS() {
    ttsLog(`stopTTS session=${_ttsSessionId}`);
    _ttsStopped = true;
    if (_ttsAudio) { _ttsAudio.pause(); _ttsAudio = null; }
    _ttsHighlightTimers.forEach(id => clearTimeout(id));
    _ttsHighlightTimers = [];
    if (_ttsHighlightTimer) { clearTimeout(_ttsHighlightTimer); _ttsHighlightTimer = null; }
    document.querySelectorAll('.hl.on').forEach(s => s.classList.remove('on'));
    window.speechSynthesis && window.speechSynthesis.cancel();
    if (_ttsResolve) { _ttsResolve(); _ttsResolve = null; }
  }

  function cancelTTSQueue() {
    _ttsSessionId++;
    ttsLog(`cancelTTSQueue new session=${_ttsSessionId}`);
    _ttsCancelled = true;
    stopTTS();
  }

  function resumeTTS() {
    _ttsCancelled = false;
  }

  function invalidateTTSSession(reason = '') {
    _ttsSessionId++;
    ttsLog(`invalidateTTSSession reason=${reason} new session=${_ttsSessionId}`);
  }

  function getTTSSessionId() {
    return _ttsSessionId;
  }

  function setSpeed(speed) {
    state.speed = speed;
    if (_ttsAudio) _ttsAudio.playbackRate = SPEED_RATE[speed];
  }

  function _scheduleHighlights(words, el) {
    if (!el || !words || words.length === 0) return;
    const spans = el.querySelectorAll('.hl');
    if (spans.length === 0) return;
    const rate = SPEED_RATE[state.speed] || 1;
    const timers = [];

    let charOffset = 0;
    words.forEach((w) => {
      const chars = Array.from(w.word || '');
      const wordLen = chars.length || 1;
      const startIdx = charOffset;
      charOffset += wordLen;
      const wordDuration = w.duration_ms || 300;
      const charInterval = wordDuration / wordLen;

      chars.forEach((_, ci) => {
        const charMs = (w.start_ms + ci * charInterval) / rate;
        const spanIdx = startIdx + ci;
        const tid = setTimeout(() => {
          if (_ttsStopped) return;
          spans.forEach(s => s.classList.remove('on'));
          const span = spans[spanIdx];
          if (span) {
            span.classList.add('on');
            const scrollContainer = span.closest('#story-text-area') || span.closest('[style*="overflow"]') || span.parentElement;
            if (scrollContainer) {
              const spanRect = span.getBoundingClientRect();
              const containerRect = scrollContainer.getBoundingClientRect();
              if (spanRect.bottom > containerRect.bottom || spanRect.top < containerRect.top) {
                span.scrollIntoView({ block: 'center', behavior: 'smooth' });
              }
            }
          }
        }, charMs);
        timers.push(tid);
      });
    });

    const lastWord = words[words.length - 1];
    const endMs = (lastWord.start_ms + (lastWord.duration_ms || 300)) / rate;
    const endTid = setTimeout(() => {
      spans.forEach(s => s.classList.remove('on'));
    }, endMs + 150);
    timers.push(endTid);

    _ttsHighlightTimers = timers;
  }

  async function _ttsWebSpeechFallback(textElement) {
    if (!window.speechSynthesis) return;
    const text = textElement ? textElement.textContent : '';
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'zh-HK';
    utt.rate = SPEED_RATE[state.speed];
    return new Promise(resolve => {
      utt.onend = resolve;
      window.speechSynthesis.speak(utt);
    });
  }

  function _lockUI(locked) {
    const rooms = document.querySelectorAll('#page-left, #page-right');
    rooms.forEach(el => el.style.pointerEvents = locked ? 'none' : '');
  }

  // ========== 音樂系統 ==========

  const BGM = {
    BGM_01: BGM_BASE + 'BGM_01.mp3',
    BGM_02: BGM_BASE + 'BGM_02.mp3',
    BGM_03: BGM_BASE + 'BGM_03.mp3',
    BGM_04: BGM_BASE + 'BGM_04.mp3',
  };

  const SFX = {
    SFX_01: SFX_BASE + 'SFX_01.mp3',
    SFX_02: SFX_BASE + 'SFX_02.mp3',
    SFX_03: SFX_BASE + 'SFX_03.mp3',
    SFX_04: SFX_BASE + 'SFX_04.mp3',
    SFX_05: SFX_BASE + 'SFX_05.mp3',
    SFX_06: SFX_BASE + 'SFX_06.mp3',
    SFX_07: SFX_BASE + 'SFX_07.mp3',
    SFX_08: SFX_BASE + 'SFX_08.mp3',
  };

  let _bgmAudio = null;
  let _bgmTrack = null;
  let _bgmTargetVolume = 0.5;
  let _sfxTargetVolume = 1.0;
  let _ttsTargetVolume = 1.0;
  const _sfxCooldown = {};
  const _sfxAudios = {};

  async function initAudioManager() {
    await preloadAudio(Object.values(SFX));
  }

  function unlockAudioContext() {
    Object.values(_sfxAudios).forEach(a => { a.load(); });
    if (_bgmAudio) _bgmAudio.load();
  }

  async function preloadAudio(audioList) {
    audioList.forEach(path => {
      const a = new Audio(BASE_PATH + path);
      a.preload = 'auto';
      _sfxAudios[path] = a;
    });
  }

  function playBGM(trackId, options = {}) {
    const path = BGM[trackId];
    if (!path || !state.bgm_on) return;
    if (_bgmTrack === trackId && _bgmAudio && !_bgmAudio.paused) return;
    if (_bgmAudio) { _bgmAudio.pause(); }
    _bgmAudio = new Audio(BASE_PATH + path);
    _bgmAudio.loop = options.loop !== false;
    _bgmAudio.volume = options.volume !== undefined ? options.volume : _bgmTargetVolume;
    _bgmTrack = trackId;
    _bgmAudio.play().catch(e => logError(e.message, 'playBGM', state.uid));
  }

  function stopBGM(options = {}) {
    if (!_bgmAudio) return;
    const fadeMs = options.fadeMs || 500;
    const audioToStop = _bgmAudio;
    _bgmAudio = null;
    _bgmTrack = null;
    _fadeVolume(audioToStop, audioToStop.volume, 0, fadeMs, () => {
      try { if (!audioToStop.paused) audioToStop.pause(); } catch (e) {}
    });
  }

  function switchBGM(trackId, options = {}) {
    stopBGM({ fadeMs: options.fadeMs || 500 });
    setTimeout(() => playBGM(trackId, options), options.fadeMs || 500);
  }

  function duckBGM(options = {}) {
    if (!_bgmAudio) return;
    _fadeVolume(_bgmAudio, _bgmAudio.volume, options.volume || 0.12, options.fadeMs || 200);
  }

  function restoreBGM(options = {}) {
    if (!_bgmAudio) return;
    _fadeVolume(_bgmAudio, _bgmAudio.volume, _bgmTargetVolume, options.fadeMs || 400);
  }

  function playSFX(sfxId, options = {}) {
    const path = SFX[sfxId];
    if (!path) return Promise.resolve();
    if (state.sfx_on === false) return Promise.resolve();
    const cooldownMs = options.cooldownMs || 500;
    const now = Date.now();
    if (_sfxCooldown[sfxId] && now - _sfxCooldown[sfxId] < cooldownMs) return Promise.resolve();
    _sfxCooldown[sfxId] = now;
    const a = _sfxAudios[path] ? _sfxAudios[path].cloneNode() : new Audio(BASE_PATH + path);
    a.volume = options.volume !== undefined ? options.volume : _sfxTargetVolume;
    return new Promise(resolve => {
      a.onended = resolve;
      a.onerror = resolve;
      a.play().catch(resolve);
    });
  }

  function stopSFX(sfxId) {
    const path = SFX[sfxId];
    if (_sfxAudios[path]) _sfxAudios[path].pause();
  }

  function stopAllSFX() {
    Object.values(_sfxAudios).forEach(a => a.pause());
  }

  function stopAllAudio() {
    stopTTS(); stopBGM(); stopAllSFX();
  }

  function handleRoomTransition(newRoom, options = {}) {
    stopAllAudio();
    const chapterTagContainer = document.getElementById('scene-chapter-tag-container');
    if (chapterTagContainer) chapterTagContainer.innerHTML = '';
    const bgmMap = {
      'room-story': 'BGM_01',
      'room-map': 'BGM_01',
      'room-opening': 'BGM_04',
      'room-report': 'BGM_01',
      'notebook': 'BGM_04',
      'game': 'BGM_04',
      'game-house': 'BGM_04',
    };
    const bgm = bgmMap[newRoom];
    if (bgm) setTimeout(() => playBGM(bgm), 300);
    const asuiChar = document.getElementById('asui-character');
    if (asuiChar) { asuiChar.style.display = 'none'; }
    const asuiBar = document.getElementById('asui-dialogue');
    if (asuiBar?.classList.contains('visible')) {
      asuiBar.classList.remove('visible');
      asuiBar.classList.add('hidden');
      asuiBar.querySelector('.asui-text').textContent = '';
      asuiBar.querySelector('.asui-buttons').innerHTML = '';
      if (typeof setAsuiCharacter === 'function') setAsuiCharacter('A27');
    }
    if (typeof asuiState !== 'undefined') {
      asuiState.isPlaying = false;
      asuiState.currentDialogue = null;
      asuiState.currentLineIndex = 0;
    }
    if (typeof _asuiOnComplete !== 'undefined' && _asuiOnComplete) {
      _asuiOnComplete = null;
    }
  }

  function setMuted(type, isMuted) {
    if (type === 'bgm') {
      state.bgm_on = !isMuted;
      if (isMuted) stopBGM(); else playBGM(_bgmTrack || 'BGM_01');
    }
    if (type === 'tts') { state.tts_on = !isMuted; }
    if (type === 'sfx') {
      state.sfx_on = !isMuted;
      if (isMuted) stopAllSFX();
    }
  }

  function setVolume(type, value) {
    if (type === 'bgm') {
      _bgmTargetVolume = value;
      if (_bgmAudio) _bgmAudio.volume = value;
    }
    if (type === 'sfx') {
      _sfxTargetVolume = value;
    }
    if (type === 'tts') {
      _ttsTargetVolume = value;
      if (_ttsAudio) _ttsAudio.volume = value;
    }
  }

  function _fadeVolume(audio, from, to, ms, onDone) {
    if (!audio) { if (onDone) onDone(); return; }
    const steps = 20;
    const stepMs = ms / steps;
    const diff = (to - from) / steps;
    let step = 0;
    const timer = setInterval(() => {
      if (!audio) { clearInterval(timer); return; }
      try {
        step++;
        audio.volume = Math.max(0, Math.min(1, from + diff * step));
        if (step >= steps) { clearInterval(timer); if (onDone) onDone(); }
      } catch (e) { clearInterval(timer); }
    }, stepMs);
  }
