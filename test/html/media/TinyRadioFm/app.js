import { TinyDragDropDetector } from '/src/v1/libs/html/drag/TinyDragDropDetector.mjs';
import { TinyRadioFm } from '/src/v1/libs/media/TinyRadioFm.mjs';
import { TinyMediaPlayer } from '/src/v1/libs/media/TinyMediaPlayer.mjs';
import { HtmlAudioAdapter } from '/src/v1/libs/media/TinyMediaPlayer/HtmlAudio.mjs';
import { MockMediaAdapter } from '/src/v1/libs/media/TinyMediaPlayer/Mock.mjs';
import { TinyPromiseQueue } from '/src/v1/libs/utils/TinyPromiseQueue.mjs';
import { parseBlob } from 'https://cdn.jsdelivr.net/npm/music-metadata@11.13.0/+esm';

window.TinyRadioFm = TinyRadioFm;
window.TinyDragDropDetector = TinyDragDropDetector;

const queue = new TinyPromiseQueue();
const draggerDetector = new TinyDragDropDetector(document.body, {
  fullscreen: true,
  onDrop: console.log,
  onEnter: console.log,
  onLeave: console.log,
});
window.draggerDetector = draggerDetector;

const btnApplyCfg = document.getElementById('btn-apply-cfg');
const btnImport = document.getElementById('btn-import');
const volumeSlider = document.getElementById('volume-slider');
const btnResync = document.getElementById('btn-resync');
const btnMute = document.getElementById('btn-mute');
const btnStart = document.getElementById('btn-start-engine');

/**
 * @class TestEnvironment
 * Controller for the TinyRadioFm test UI and audio synchronization.
 */
class TestEnvironment {
  /** @private @type {TinyRadioFm} */
  #radio;
  /** @private @type {TinyMediaPlayer} */
  #player;
  /** @private @type {string|null} */
  #currentPlayingId;
  /** @private @type {boolean} */
  #isEngineStarted;
  /** @private @type {number} */
  #tickCounter;
  /** @private @type {HTMLElement} */
  #imgEl;

  /** @returns {TinyRadioFm} */
  get radio() {
    return this.#radio;
  }
  /** @param {TinyRadioFm} value @throws {TypeError} */
  set radio(value) {
    if (!value) throw new TypeError('radio must be a valid instance.');
    this.#radio = value;
  }

  /** @returns {TinyMediaPlayer} */
  get player() {
    return this.#player;
  }
  /** @param {TinyMediaPlayer} value @throws {TypeError} */
  set player(value) {
    if (!value) throw new TypeError('player must be a valid instance.');
    this.#player = value;
  }

  /** @returns {string|null} */
  get currentPlayingId() {
    return this.#currentPlayingId;
  }
  /** @param {string|null} value @throws {TypeError} */
  set currentPlayingId(value) {
    if (value !== null && typeof value !== 'string')
      throw new TypeError('currentPlayingId must be a string or null.');
    this.#currentPlayingId = value;
  }

  /** @returns {boolean} */
  get isEngineStarted() {
    return this.#isEngineStarted;
  }
  /** @param {boolean} value @throws {TypeError} */
  set isEngineStarted(value) {
    if (typeof value !== 'boolean') throw new TypeError('isEngineStarted must be a boolean.');
    this.#isEngineStarted = value;
  }

  /** @returns {number} */
  get tickCounter() {
    return this.#tickCounter;
  }
  /** @param {number} value @throws {TypeError} */
  set tickCounter(value) {
    if (typeof value !== 'number') throw new TypeError('tickCounter must be a number.');
    this.#tickCounter = value;
  }

  /** @returns {HTMLElement} */
  get imgEl() {
    return this.#imgEl;
  }
  /** @param {HTMLElement} value @throws {TypeError} */
  set imgEl(value) {
    if (!(value instanceof HTMLElement)) throw new TypeError('imgEl must be an HTMLElement.');
    this.#imgEl = value;
  }

  constructor() {
    this.radio = new TinyRadioFm();
    this.player = new TinyMediaPlayer({ debugMode: true, useLogColors: true });
    this.player.registerAdapter(new HtmlAudioAdapter());
    this.player.registerAdapter(new MockMediaAdapter());

    this.currentPlayingId = null;
    this.isEngineStarted = false;
    this.tickCounter = 0; // Used to spaced updates (e.g. Query Engine)

    this.imgEl = document.getElementById('st-thumb');

    this.setupEventListeners();
    this.bindRadioEvents();
    this.startUpdateLoop();
    this.log('Environment Ready. Click "Start Engine" to unlock audio context.');
    this.imgEl.addEventListener('error', () => this.resetThumbnail());

    this.syncConfigUI();
  }

  /**
   * Appends a message to the system logs UI.
   * @param {string} msg - The message to log.
   */
  log(msg) {
    const logs = document.getElementById('system-logs');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">[${new Date().toLocaleTimeString()}]</span> <div class="log-entry-content"><span class="log-msg">${msg}</span></div\>`;
    logs.prepend(entry);
  }

  /**
   * Removes a specific track from the media player to prevent memory leaks and desync.
   * @param {string} id - The ID of the track to remove.
   * @returns {void}
   * @throws {TypeError} Thrown if the id is not a string.
   */
  #removeTrackFromPlayer(id) {
    if (typeof id !== 'string') throw new TypeError('id must be a string.');
    try {
      const searchResult = this.player.searchTrack((track) => track.id === id);
      if (searchResult && searchResult.length > 0) {
        this.player.removeTrack(searchResult[0].index);
        this.log(`Player Sync: Track ${id} removed from media player.`);
      }
    } catch (error) {
      this.log(`Player Sync Warning: Could not remove track ${id}.`);
    }
  }

  /**
   * Clears all tracks from the media player. Used when the radio state is imported or reset.
   * @returns {void}
   */
  #clearPlayerTracks() {
    try {
      this.player.clearPlaylist();
      this.log('Player Sync: All tracks cleared from media player.');
    } catch (error) {
      this.log('Player Sync Warning: Failed to clear player tracks.');
    }
  }

  /**
   * Binds event listeners to the radio instance to sync the UI.
   */
  bindRadioEvents() {
    // Automatically update the entire interface when data changes
    const syncUI = () => {
      this.updateLists();
      this.handleQuery(); // Ensure that the forecast of the future is updated immediately
      this.syncConfigUI(); // Update configuration panels
    };

    this.radio.on('unknownArtistChanged', (d) => {
      this.log(`Event: unknownArtistChanged -> ${d.unknownArtist}`);
      syncUI();
    });
    this.radio.on('seedChanged', (d) => {
      this.log(`Event: seedChanged -> ${d.seed}`);
      syncUI();
    });
    this.radio.on('configChanged', (d) => {
      this.log(`Event: configChanged`);
      console.log('New Config:', d.config);
      syncUI();
    });

    this.radio.on('contentAdded', (d) => {
      this.log(`Event: contentAdded -> [${d.type}] ${d.data.title}`);
      syncUI();
    });
    this.radio.on('taskScheduled', (d) => {
      this.log(`Event: taskScheduled -> ${d.action} on ${d.type}`);
      syncUI();
    });

    this.radio.on('contentRemoved', (d) => {
      this.log(`Event: contentRemoved -> ID ${d.id}`);
      this.#removeTrackFromPlayer(d.id);
      syncUI();
    });

    this.radio.on('taskExecuted', (d) => {
      this.log(`Event: taskExecuted -> ${d.action} completed.`);
      syncUI();
    });

    this.radio.on('customPositionExpired', (d) => {
      this.log(`Event: customPositionExpired -> ID ${d.contentId}`);
      this.#removeTrackFromPlayer(d.contentId);
      syncUI();
    });

    this.radio.on('stateImported', () => {
      this.log(`Event: stateImported -> Success`);
      syncUI();
    });
  }

  /**
   * Attaches standard DOM event listeners.
   */
  setupEventListeners() {
    // Add Content
    document.getElementById('btn-add').addEventListener('click', () => this.handleAddContent());

    // Config
    btnApplyCfg.addEventListener('click', () => this.handleApplyConfig());

    // Schedule
    document
      .getElementById('btn-schedule')
      .addEventListener('click', () => this.handleScheduleTask());
    document.getElementById('btn-remove-now').addEventListener('click', () => {
      const id = document.getElementById('manage-id').value;
      if (id) this.radio.remove(id);
    });

    // Queries
    document.getElementById('btn-query').addEventListener('click', () => this.handleQuery());
    document.getElementById('btn-search-custom').addEventListener('click', () => {
      const pos = this.radio.searchCustomPositions();
      this.log(`Found ${pos.length} custom positions active. Check DevTools console.`);
      console.table(pos);
    });

    // State
    document.getElementById('btn-export').addEventListener('click', () => this.handleExport());
    btnImport.addEventListener('click', () => document.getElementById('import-file').click());
    document.getElementById('import-file').addEventListener('change', (e) => this.handleImport(e));

    // Player Setup
    btnStart.addEventListener('click', () => this.startEngine());
    btnResync.addEventListener('click', () => this.resyncAudio());

    // Mute / Pause logic
    btnMute.addEventListener('click', async () => {
      btnMute.disabled = true;
      if (this.player.isMuted) await this.player.unMute();
      else await this.player.mute();

      if (this.player.isMuted) {
        btnMute.title = 'Unmute Audio';
        btnMute.innerText = '▶️';
        btnMute.classList.add('btn-danger');
        btnMute.classList.remove('btn-outline');
      } else {
        btnMute.title = 'Mute Audio';
        btnMute.innerText = '⏸️';
        btnMute.classList.remove('btn-danger');
        btnMute.classList.add('btn-outline');
        await this.resyncAudio();
      }
      btnMute.disabled = false;
    });

    // Volume Configuration and Persistence

    // Try loading the localStorage volume
    const savedVolume = localStorage.getItem('tinyRadioFm_volume');
    if (savedVolume !== null) {
      volumeSlider.value = Number(savedVolume);
      this.player.volume = Number(savedVolume);
    } else {
      // If you have nothing, set the audio to the default HTML value (0.7)
      this.player.volume = Number(volumeSlider.value);
    }

    // Update audio and save in localStorage
    volumeSlider.addEventListener('input', (e) => {
      const newVolume = Number(e.target.value);
      this.player.volume = newVolume;
      localStorage.setItem('tinyRadioFm_volume', String(newVolume));
    });
  }

  /**
   * Syncs the HTML inputs with the radio configuration.
   */
  syncConfigUI() {
    // Synchronize direct properties
    if (this.radio.seed !== undefined) document.getElementById('cfg-seed').value = this.radio.seed;
    if (this.radio.unknownArtist !== undefined)
      document.getElementById('cfg-unknown-artist').value = this.radio.unknownArtist;

    // Synchronize options within the config object
    const cfg = this.radio.config;
    if (cfg) {
      if (cfg.mode !== undefined) document.getElementById('cfg-mode').value = cfg.mode;
      if (cfg.voiceMode !== undefined)
        document.getElementById('cfg-voiceMode').value = cfg.voiceMode;
      if (cfg.silenceDuration !== undefined)
        document.getElementById('cfg-silence').value = cfg.silenceDuration;
      if (cfg.voiceWeight !== undefined)
        document.getElementById('cfg-voiceWeight').value = cfg.voiceWeight;
      if (cfg.queryLimit !== undefined)
        document.getElementById('cfg-queryLimit').value = cfg.queryLimit;
      if (cfg.voiceAfterMusic !== undefined)
        document.getElementById('cfg-voiceAfterMusic').checked = cfg.voiceAfterMusic;
      if (cfg.voiceMin !== undefined) document.getElementById('cfg-voiceMin').value = cfg.voiceMin;
      if (cfg.voiceMax !== undefined) document.getElementById('cfg-voiceMax').value = cfg.voiceMax;
      if (cfg.musicMaxConsecutive !== undefined)
        document.getElementById('cfg-musicMaxConsecutive').value = cfg.musicMaxConsecutive;
      if (cfg.voiceMaxConsecutive !== undefined)
        document.getElementById('cfg-voiceMaxConsecutive').value = cfg.voiceMaxConsecutive;
    }
  }

  /**
   * Unlocks the AudioContext correctly without breaking media elements.
   * @returns {Promise<void>}
   */
  async startEngine() {
    if (this.isEngineStarted || !this.currentPlayingId) return;
    this.isEngineStarted = true;
    return new Promise((resolve, reject) => {
      try {
        btnStart.innerText = 'Engine Running';
        btnStart.classList.replace('btn-primary', 'btn-outline');
        btnStart.disabled = true;

        btnResync.disabled = false;
        btnMute.disabled = false;

        this.log('Audio Engine Unlocked.');
        this.resyncAudio().then(resolve);
      } catch (e) {
        this.log('Error starting engine: ' + e.message);
        reject(e);
      }
    });
  }

  /**
   * Parses and adds new content to the radio.
   * @returns {Promise<void>}
   */
  async handleAddContent() {
    const file = document.getElementById('file-input').files[0];
    if (!file) return alert('Select an audio file.');
    const type = document.getElementById('content-type').value;
    const customTs = parseInt(document.getElementById('custom-ts').value);

    // Handle Custom Metadata
    const metadataRaw = document.getElementById('custom-metadata').value.trim();
    let metadata = {};
    if (metadataRaw) {
      try {
        metadata = JSON.parse(metadataRaw);
      } catch (e) {
        this.log(`Error: Invalid JSON in metadata field.`);
        return;
      }
    }

    try {
      this.log(`Processing ${file.name}...`);

      // Convert the audio file directly to a Base64 string (Date URL)
      const base64Url = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file.'));
        reader.readAsDataURL(file);
      });

      const content = await TinyRadioFm.parseContent(base64Url, {}, metadata, parseBlob, {
        onProgress: (p) => console.log(`[${p.stage}] ${p.status}`),
        onError: (e) => console.error(`Failed at ${e.stage} for ${e.url}: ${e.error.message}`),
      });

      if (type === 'custom') content.timestamp = customTs > 0 ? customTs : Date.now();

      this.radio.add(type, content);

      // If the engine is running, force a resync to catch the new content immediately
      if (this.isEngineStarted) {
        this.log('Engine running. Resyncing to new content...');
        await this.resyncCurrentEvent();
      }
    } catch (err) {
      this.log(`Error: ${err.message}`);
    }
  }

  /**
   * Applies configurations and reboots the active tracking in a locked queue.
   * @returns {Promise<void>}
   */
  async handleApplyConfig() {
    btnApplyCfg.disabled = true;
    try {
      const seed = parseInt(document.getElementById('cfg-seed').value);
      const unknownArtist = document.getElementById('cfg-unknown-artist').value;

      const cfg = {
        mode: document.getElementById('cfg-mode').value,
        voiceMode: document.getElementById('cfg-voiceMode').value,
        silenceDuration: parseInt(document.getElementById('cfg-silence').value),
        voiceWeight: parseFloat(document.getElementById('cfg-voiceWeight').value),
        queryLimit: parseInt(document.getElementById('cfg-queryLimit').value),
        voiceAfterMusic: document.getElementById('cfg-voiceAfterMusic').checked,
        voiceMin: parseInt(document.getElementById('cfg-voiceMin').value),
        voiceMax: parseInt(document.getElementById('cfg-voiceMax').value),
        musicMaxConsecutive: parseInt(document.getElementById('cfg-musicMaxConsecutive').value),
        voiceMaxConsecutive: parseInt(document.getElementById('cfg-voiceMaxConsecutive').value),
      };

      this.radio.seed = seed;
      TinyRadioFm.unknownArtist = unknownArtist;
      this.radio.setConfig(cfg);

      // Force rebooting of the instance by cleaning the current screening
      this.currentPlayingId = null;
      await this.player.pause();
      await this.resyncCurrentEvent();
    } catch (e) {
      this.log(`Config Error: ${e.message}`);
    } finally {
      btnApplyCfg.disabled = false;
    }
  }

  /**
   * Schedules an action dynamically.
   */
  handleScheduleTask() {
    try {
      const delay = parseInt(document.getElementById('task-delay').value);
      const action = document.getElementById('task-action').value;
      const type = document.getElementById('task-type').value;
      const targetId = document.getElementById('task-id').value;
      const newIndex = parseInt(document.getElementById('task-newIndex').value);
      const timestamp = Date.now() + delay;

      let payload;
      if (action === 'add') {
        payload = {
          id: 'mock-' + Math.random().toString(36).substr(2, 5),
          title: 'Mock Scheduled ' + type,
          artist: 'System',
          duration: 5000,
          url: '',
        };
      } else if (action === 'remove') {
        payload = targetId;
      } else if (action === 'move') {
        payload = { id: targetId, newIndex: newIndex };
      }

      this.radio.scheduleTask(timestamp, action, type, payload);
    } catch (e) {
      this.log(`Schedule Error: ${e.message}`);
    }
  }

  /**
   * Queries the radio timeline.
   */
  handleQuery() {
    try {
      const offset = parseInt(document.getElementById('query-offset').value);
      const results = this.radio.queryTimeline(Date.now() + offset, 30);
      const container = document.getElementById('query-results');
      container.innerHTML = results.length ? '' : 'No upcoming events.';
      results.forEach((ev) => {
        container.innerHTML += `<div class="log-entry">
                <div class="log-entry-content">
                  <span class="truncate-title">${ev.title}</span>
                  <span style="color:var(--text-secondary)">@ ${new Date(ev.absoluteStart).toLocaleTimeString()}</span>
                </div\>
              </div\>`;
      });
    } catch (e) {
      console.warn(`Query Warning: ${e.message}`); // Using warn to not float UI logs
    }
  }

  /**
   * Jumps the audio position to correctly match the radio's current time.
   * @returns {Promise<void>}
   */
  async resyncAudio() {
    btnResync.disabled = true;
    const event = this.radio.getCurrentEvent();
    if (!event) {
      btnResync.disabled = false;
      return;
    }
    this.log('Resyncing audio to radio timeline...');
    await this.player.seek(event.duration - event.remainingTime);
    if (this.player.isPaused && this.isEngineStarted) {
      await this.player.play();
    }
    btnResync.disabled = false;
  }

  /**
   * Updates the player track based on the current radio event and prevents unwanted autoplay.
   * @param {Object|null} event - The current radio event data or null if idle.
   * @returns {Promise<void>}
   */
  async syncAudioWithRadio(event) {
    if (!event) {
      if (this.currentPlayingId !== null) {
        await this.player.pause();
        this.currentPlayingId = null;
        this.resetThumbnail();
      }
      return;
    }

    if (this.currentPlayingId !== event.id) {
      this.currentPlayingId = event.id;

      let searchResult = this.player.searchTrack((track) => track.id === event.id);

      if (searchResult.length === 0) {
        this.player.addTrack({
          id: event.id,
          url: event.url,
          title: event.title ?? 'Unknown Title',
          artist: event.artist ?? 'Unknown Artist',
          duration: event.duration,
        });

        // Search immediately again to guarantee exact index extraction
        searchResult = this.player.searchTrack((track) => track.id === event.id);
      }

      if (searchResult.length > 0) {
        const index = searchResult[0].index;
        // Await the transition to prevent race conditions in the next interval tick
        await this.player.skipTo(index);
      } else {
        await this.player.stop();
      }

      this.loadThumbnail(event.id);

      // Block auto-play securely if the engine is not started yet.
      if (!this.isEngineStarted) {
        await this.player.pause();
      } else {
        await this.player.play().catch((e) => this.log('Autoplay blocked. Click Start Engine.'));
      }
    } else if (this.player.isEnded && this.isEngineStarted) {
      // Workaround: Since the radio has one song only, the ID doesn't change, but the audio is over.
      // We need to get it to play again from scratch!
      await this.player.seek(0);
      await this.player.play().catch((e) => this.log('Autoplay error: ' + e.message));
    }
  }

  /**
   * Parses and injects the thumbnail base64 image into the UI.
   * @param {string} id - The ID string of the track.
   */
  loadThumbnail(id) {
    this.resetThumbnail();

    // Search lists for the original content that has the picture array
    let content = this.radio.allList.find((c) => c.id === id);
    if (!content) {
      const cp = this.radio.customPositions.find((c) => c.content.id === id);
      if (cp) content = cp.content;
    }

    // If we find a picture extracted by the music-metadata
    if (content && content.picture && content.picture.length > 0) {
      const pic = content.picture[0];
      this.imgEl.classList.remove('default');
      this.imgEl.src = pic.data;
    }
  }

  /**
   * Resets the cover art image element to default state.
   */
  resetThumbnail() {
    this.imgEl.classList.add('default');
    this.imgEl.src =
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M9 18V5l12-2v13'></path><circle cx='6' cy='18' r='3'></circle><circle cx='18' cy='16' r='3'></circle></svg>";
  }

  /**
   * Generates and downloads a JSON of the system state.
   * @returns {Promise<void>}
   */
  async handleExport() {
    this.log('Generating Export...');
    const jsonString = await this.radio.exportState();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tinyradiofm-state-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    this.log('Export complete.');
  }

  /**
   * Safely resets the event loop and synchronizes time if the engine is running.
   * @returns {Promise<void>}
   */
  async resyncCurrentEvent() {
    // If the audio engine is already on, restart and sync time
    if (this.isEngineStarted) {
      const newEvent = this.radio.getCurrentEvent();
      await this.syncAudioWithRadio(newEvent ?? null);
      await this.resyncAudio();
    }
  }

  /**
   * Imports a JSON state file and fully cleans up the active media player inside the queue.
   * @param {Event} event - The DOM event triggered by the file input change.
   * @returns {Promise<void>}
   */
  async handleImport(event) {
    btnImport.disabled = true;
    const file = event.target.files[0];
    return new Promise((resolve, reject) => {
      if (!file) {
        btnImport.disabled = false;
        resolve(null);
        return;
      }

      const reader = new FileReader();
      let isErr = false;

      reader.onload = async (e) => {
        try {
          const json = JSON.parse(e.target.result);
          this.#clearPlayerTracks();
          this.radio.importState(json);

          // Force rebooting of the instance by cleaning the current screening
          this.currentPlayingId = null;
          await this.player.pause();
          this.log('Import success.');

          await this.resyncCurrentEvent();
        } catch (err) {
          this.log(`Import error: ${err.message}`);
          isErr = true;
          reject(err);
        } finally {
          btnImport.disabled = false;
          event.target.value = '';
          if (!isErr) resolve(null);
        }
      };

      reader.onerror = (err) => {
        this.log(`Import error: Failed to read file.`);
        btnImport.disabled = false;
        event.target.value = '';
        isErr = true;
        reject(err);
      };

      // Zerate input in case you want to import the same file again later
      reader.readAsText(file);
    });
  }

  /**
   * Updates UI tables for music, voices and tasks.
   */
  updateLists() {
    const mList = document.getElementById('list-music');
    const oList = document.getElementById('list-others');
    mList.innerHTML = '';
    oList.innerHTML = '';

    this.radio.musicList.forEach(
      (m) =>
        (mList.innerHTML += `<div class="log-entry"><span class="tag tag-music">M</span> <div class="log-entry-content"><span class="truncate-title">${m.title}</span><small style="color:var(--text-secondary)">ID: ${m.id}</small></div\></div\>`),
    );

    this.radio.voiceList.forEach(
      (v) =>
        (oList.innerHTML += `<div class="log-entry"><span class="tag tag-voice">V</span> <div class="log-entry-content"><span class="truncate-title">${v.title}</span><small style="color:var(--text-secondary)">ID: ${v.id}</small></div\></div\>`),
    );

    this.radio.customPositions.forEach(
      (c) =>
        (oList.innerHTML += `<div class="log-entry"><span class="tag tag-custom">C</span> <div class="log-entry-content"><span class="truncate-title">${c.content.title}</span><small style="color:var(--text-secondary)">ID: ${c.content.id} @ ${c.intendedTimestamp}</small></div\></div\>`),
    );

    this.radio.scheduledTasks.forEach(
      (t) =>
        (oList.innerHTML += `<div class="log-entry"><span class="tag tag-task">T</span> <div class="log-entry-content"><span>Action: ${t.action} [${t.type}]</span><small style="color:var(--text-secondary)">Exec: ${t.timestamp}</small></div\></div\>`),
    );
  }

  /**
   * Runs the interval for the UI timeline rendering.
   */
  startUpdateLoop() {
    setInterval(
      () =>
        queue.enqueue(async () => {
          // Clock
          document.getElementById('clock').innerText = new Date().toLocaleTimeString();

          // QueryEngine Autoupdate every 1 second (10 ticks)
          this.tickCounter++;
          if (this.tickCounter % 10 === 0) this.handleQuery();

          // Live Status
          const event = this.radio.getCurrentEvent();

          // Update UI Status
          const stTitle = document.getElementById('st-title');
          const stArtist = document.getElementById('st-artist');
          const stRem = document.getElementById('st-rem');
          const prog = document.getElementById('progress-bar');

          if (event) {
            stTitle.innerText = event.title;
            stArtist.innerText = event.artist;
            stRem.innerText = `${Math.floor(event.remainingTime / 1000)}s`;
            prog.style.width = `${event.progress * 100}%`;

            // Sync the Audio Engine
            await this.syncAudioWithRadio(event);
          } else {
            stTitle.innerText = 'Idle';
            stArtist.innerText = '-';
            stRem.innerText = '-';
            prog.style.width = '0%';
            await this.syncAudioWithRadio(null);
          }
        }),
      100,
    );
  }
}

// Initialize the environment
window.addEventListener('DOMContentLoaded', () => {
  window.env = new TestEnvironment();
});
