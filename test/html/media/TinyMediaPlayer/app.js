import { TinyMediaPlayer } from '/src/v1/libs/media/TinyMediaPlayer.mjs';
import { YoutubeMediaAdapter } from '/src/v1/libs/media/TinyMediaPlayer/Youtube.mjs';
import { SoundCloudMediaAdapter } from '/src/v1/libs/media/TinyMediaPlayer/SoundCloud.mjs';
import { HtmlAudioAdapter } from '/src/v1/libs/media/TinyMediaPlayer/HtmlAudio.mjs';

// Initialize Player
const player = new TinyMediaPlayer({
  repeatCurrentOnPrev: true,
  smoothPlayPauseVolume: true,
  smoothStopVolume: true,
});
window.player = player;

// Setup Adapters
SoundCloudMediaAdapter.defaultContainer = SoundCloudMediaAdapter.createIframeContainer({
  videoId: '328270345',
  hidden: true,
  autoplay: false,
});

YoutubeMediaAdapter.defaultContainer = YoutubeMediaAdapter.createIframeContainer({
  videoId: 'fzKvGbQ9SgY',
  hidden: true,
  controls: false,
  disableKb: true,
  fs: false,
  ivLoadPolicy: false,
  rel: false,
  autoplay: false,
});

const scAdapter = new SoundCloudMediaAdapter();
const ytAdapter = new YoutubeMediaAdapter();
const htmlAdapter = new HtmlAudioAdapter();

player.registerAdapter(scAdapter);
player.registerAdapter(ytAdapter);
player.registerAdapter(htmlAdapter);

// DOM Elements
const logsContainer = document.getElementById('system-logs');
const eventMonitor = document.getElementById('event-monitor');
const playlistView = document.getElementById('playlist-view');
const volumeSlider = document.getElementById('volume-slider');
const progressSlider = document.getElementById('progress-slider');
const displayTitle = document.getElementById('display-title');
const displayArtist = document.getElementById('display-artist');
const timeCurrent = document.getElementById('time-current');
const timeTotal = document.getElementById('time-total');

// --- UTILITIES ---

/**
 * Log manager to handle the recording of messages and events in the DOM,
 * featuring an automatic pruning system to prevent memory overload.
 */
class LogManager {
  #logsContainer;
  #eventMonitor;
  #maxLines;

  /**
   * @param {HTMLElement} logsContainer - The DOM element where general logs will be displayed.
   * @param {HTMLElement} eventMonitor - The DOM element where events will be displayed.
   * @param {number} [maxLines=100] - The maximum number of lines to keep in each container.
   * @throws {TypeError} If the containers are not valid HTML elements.
   * @throws {RangeError} If maxLines is not a positive number.
   */
  constructor(logsContainer, eventMonitor, maxLines = 100) {
    if (!(logsContainer instanceof HTMLElement)) {
      throw new TypeError('The logsContainer parameter must be an instance of HTMLElement.');
    }
    if (!(eventMonitor instanceof HTMLElement)) {
      throw new TypeError('The eventMonitor parameter must be an instance of HTMLElement.');
    }
    if (typeof maxLines !== 'number' || maxLines <= 0) {
      throw new RangeError('The maxLines parameter must be a number greater than zero.');
    }

    this.#logsContainer = logsContainer;
    this.#eventMonitor = eventMonitor;
    this.#maxLines = maxLines;
  }

  /**
   * Gets the current configured line limit.
   * @returns {number}
   */
  get maxLines() {
    return this.#maxLines;
  }

  /**
   * Sets a new line limit.
   * @param {number} value - The new line limit.
   * @throws {RangeError} If the value is less than or equal to zero.
   */
  set maxLines(value) {
    if (typeof value !== 'number' || value <= 0) {
      throw new RangeError('The maxLines value must be a positive number.');
    }
    this.#maxLines = value;
  }

  /**
   * Logs a simple message.
   * @param {string} message - The message to be displayed.
   * @throws {TypeError} If the message is not a string.
   */
  logMsg(message) {
    if (typeof message !== 'string') {
      throw new TypeError('The log message must be a string.');
    }

    const time = new Date().toLocaleTimeString();
    this.#logsContainer.textContent = `[${time}] ${message}\n` + this.#logsContainer.textContent;
    this.#prune(this.#logsContainer);
  }

  /**
   * Logs an event with optional data.
   * @param {string} eventName - The name of the event occurred.
   * @param {any} [data] - Additional data associated with the event.
   * @throws {TypeError} If eventName is not a string.
   */
  logEvent(eventName, data) {
    if (typeof eventName !== 'string') {
      throw new TypeError('The event name (eventName) must be a string.');
    }

    const time = new Date().toLocaleTimeString();
    let dataStr = '';

    if (data !== undefined) {
      try {
        // Security implementation: prevents log breakage if the object has circular references
        dataStr = ` | Data: ${JSON.stringify(data)}`;
      } catch (error) {
        dataStr = ' | Data: [Error serializing data]';
      }
    }

    this.#eventMonitor.textContent =
      `[${time}] EVENT: ${eventName}${dataStr}\n` + this.#eventMonitor.textContent;
    this.#prune(this.#eventMonitor);
  }

  /**
   * Private method that removes the oldest lines (the last ones in the text)
   * to keep the container within the defined limit.
   * @param {HTMLElement} container - The container to be pruned.
   * @private
   */
  #prune(container) {
    const lines = container.textContent.split('\n').filter((line) => line.trim() !== '');

    if (lines.length > this.#maxLines) {
      // Keeps only the first N lines (which are the most recent, since we are using prepend)
      container.textContent = lines.slice(0, this.#maxLines).join('\n') + '\n';
    }
  }
}

const logger = new LogManager(logsContainer, eventMonitor, 50);

const formatTime = (ms) => {
  if (isNaN(ms) || ms < 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

// --- VISUAL PLAYER LOGIC ---

const updateVisualPlayer = () => {
  const track = player.playlist[player.currentIndex];
  if (track) {
    displayTitle.textContent = track.title || 'Unknown Title';
    displayArtist.textContent = track.artist || 'Unknown Artist';
  } else {
    displayTitle.textContent = 'No Track Loaded';
    displayArtist.textContent = '---';
  }

  const total = player.getTotalDuration();
  const current = player.getCurrentTime();

  timeCurrent.textContent = formatTime(current);
  timeTotal.textContent = formatTime(total);

  // Update Slider position
  if (total > 0) {
    progressSlider.value = (current / total) * 100;
  } else {
    progressSlider.value = 0;
  }
};

// --- EVENT MONITOR AUTOMATION ---

// List of all events we want to monitor from the player
const eventsToMonitor = [
  'play',
  'pause',
  'stop',
  'next',
  'prev',
  'seek',
  'ended',
  'timeupdate',
  'trackChange',
  'playlistUpdate',
  'volumeChange',
  'loopModeChange',
  'randomModeChange',
  'destroyed',
];

eventsToMonitor.forEach((eventName) => {
  player.on(eventName, (data) => {
    logger.logEvent(eventName, data);
    // Trigger UI updates for specific events
    if (eventName === 'timeupdate' || eventName === 'seek') updateVisualPlayer();
    if (eventName === 'trackChange' || eventName === 'playlistUpdate') renderPlaylist();
  });
});

// --- INTERACTIVE ELEMENTS ---

progressSlider.addEventListener('input', async (e) => {
  const percent = e.target.value / 100;
  const total = player.getTotalDuration();
  const targetMs = Math.floor(percent * total);
  try {
    await player.seek(targetMs);
  } catch (err) {
    logger.logMsg(`Seek Error: ${err.message}`);
  }
});

// --- CORE FUNCTIONS (REUSED FROM YOUR ORIGINAL) ---

/**
 * Renders the playlist array to the UI and attaches dynamic event listeners.
 */
const renderPlaylist = () => {
  playlistView.innerHTML = '';
  const list = player.playlist;
  if (list.length === 0) {
    playlistView.innerHTML =
      '<div style="color: var(--text-muted); padding: 0.5rem;">Playlist is empty.</div>';
    return;
  }

  list.forEach((track, index) => {
    const div = document.createElement('div');
    div.className = `playlist-item ${player.currentIndex === index ? 'active' : ''}`;

    div.innerHTML = `
            <div>
              <span>${index}. ${track.title}</span><br/>
              <span style="font-size: 0.8rem; color: var(--text-muted)">ID: ${track.id}</span>
            </div>
            <button class="btn-danger btn-small remove-btn" data-index="${index}">Remove</button>
          `;
    playlistView.appendChild(div);
  });

  // Attach listeners for dynamic remove buttons
  document.querySelectorAll('.remove-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      try {
        await player.removeTrack(idx);
        logger.logMsg(`Removed track at index: ${index} (via list button).`);
        renderPlaylist();
      } catch (error) {
        logger.logMsg(`ERROR: ${error.message}`);
      }
    });
  });
};

/**
 * Updates UI inputs to match the current class state.
 */
const syncUIWithState = () => {
  volumeSlider.value = player.volume;
  document.getElementById('loop-select').value = player.loopMode;
  document.getElementById('random-checkbox').checked = player.isRandom;
  document.getElementById('persist-volume-checkbox').checked = player.persistVolume;
  document.getElementById('storage-key-input').value = player.volumeStorageKey;
  renderPlaylist();
  updateVisualPlayer();
};

// Bind Audio Ended Event to trigger next() automatically for testing
player.on('ended', async () => {
  logger.logMsg('Track ended naturally. Invoking player.next()');
  await player.next();
  renderPlaylist();
});

// ==========================================
// EVENT LISTENERS
// ==========================================

// Playback Controls
const play = document.getElementById('btn-play');
play.addEventListener('click', async () => {
  play.disabled = true;
  try {
    await player.play();
    logger.logMsg(`Playing track index: ${player.currentIndex}`);
  } catch (error) {
    logger.logMsg(`ERROR: ${error.message}`);
  }
  play.disabled = false;
});

const pause = document.getElementById('btn-pause');
pause.addEventListener('click', async () => {
  pause.disabled = true;
  await player.pause();
  logger.logMsg('Playback paused.');
  pause.disabled = false;
});

const stop = document.getElementById('btn-stop');
stop.addEventListener('click', async () => {
  stop.disabled = true;
  await player.stop();
  logger.logMsg('Playback stopped.');
  stop.disabled = false;
});

const next = document.getElementById('btn-next');
next.addEventListener('click', async () => {
  next.disabled = true;
  await player.next();
  logger.logMsg(`Skipped to next. Current index: ${player.currentIndex}`);
  renderPlaylist();
  next.disabled = false;
});

const prev = document.getElementById('btn-prev');
prev.addEventListener('click', async () => {
  prev.disabled = true;
  await player.prev();
  logger.logMsg(`Returned to previous. Current index: ${player.currentIndex}`);
  renderPlaylist();
  prev.disabled = false;
});

const seek = document.getElementById('btn-seek');
seek.addEventListener('click', async () => {
  seek.disabled = true;
  const timeMs = parseInt(document.getElementById('seek-input').value, 10);
  try {
    await player.seek(timeMs);
    logger.logMsg(`Seeked to ${timeMs}ms.`);
  } catch (error) {
    logger.logMsg(`ERROR: ${error.message}`);
  }
  seek.disabled = false;
});

const step = document.getElementById('btn-step');
step.addEventListener('click', async () => {
  step.disabled = true;
  const stepMs = parseInt(document.getElementById('step-input').value, 10);
  try {
    await player.step(stepMs);
    logger.logMsg(`Stepped timeline by ${stepMs}ms.`);
  } catch (error) {
    logger.logMsg(`ERROR: ${error.message}`);
  }
  step.disabled = false;
});

// State Controls
volumeSlider.addEventListener('input', (e) => {
  try {
    player.volume = parseFloat(e.target.value);
    logger.logMsg(`Volume set to: ${player.volume.toFixed(2)}`);
  } catch (error) {
    logger.logMsg(`ERROR: ${error.message}`);
  }
});

document.getElementById('loop-select').addEventListener('change', (e) => {
  player.loopMode = e.target.value;
  logger.logMsg(`Loop mode changed to: ${player.loopMode}`);
});

document.getElementById('random-checkbox').addEventListener('change', (e) => {
  player.isRandom = e.target.checked;
  logger.logMsg(`Random mode is now: ${player.isRandom}`);
});

document.getElementById('persist-volume-checkbox').addEventListener('change', (e) => {
  player.persistVolume = e.target.checked;
  logger.logMsg(`Persist Volume changed to: ${player.persistVolume}`);
});

document.getElementById('btn-update-storage').addEventListener('click', () => {
  try {
    const newKey = document.getElementById('storage-key-input').value;
    player.volumeStorageKey = newKey;
    logger.logMsg(`Storage key updated to: ${newKey}`);
  } catch (error) {
    logger.logMsg(`ERROR: ${error.message}`);
  }
});

// Playlist Controls
const addNewTrack = (url, title) => {
  try {
    // Creating a mock MediaContent object
    const content = {
      id: `track_${Date.now()}`,
      url: url,
      title: title || 'Unknown Title',
      artist: 'Unknown Artist',
      duration: 0,
    };
    player.addTrack(content);
    logger.logMsg(`Added track: ${title}`);
    renderPlaylist();
  } catch (error) {
    logger.logMsg(`ERROR: ${error.message}`);
  }
};
document.getElementById('btn-add-track').addEventListener('click', () => {
  const url = document.getElementById('track-url').value;
  const title = document.getElementById('track-title').value;
  addNewTrack(url, title);
});

addNewTrack('https://api.soundcloud.com/tracks/328270345', 'Play Again (2015)(no lyrics)');
addNewTrack('https://www.youtube.com/watch?v=fzKvGbQ9SgY', 'Tiny Wag Meme');
addNewTrack(
  'https://api.soundcloud.com/tracks/260505529',
  'Mystery Star Battlefield (Mystery Planet Remake)',
);

document.getElementById('btn-clear-playlist').addEventListener('click', async () => {
  await player.clearPlaylist();
  logger.logMsg('Playlist cleared and playback stopped.');
  renderPlaylist();
});

// Search, Inspect & Remove Controls
document.getElementById('btn-search-track').addEventListener('click', () => {
  const query = document.getElementById('search-track-input').value;
  if (!query) {
    logger.logMsg('Please enter a search query.');
    return;
  }

  try {
    const results = player.searchTrack(query);
    if (results.length === 0) {
      logger.logMsg(`Search: No tracks found matching "${query}".`);
    } else {
      logger.logMsg(`Search found ${results.length} match(es):`);
      results.forEach((res) => {
        logger.logMsg(` - Index ${res.index}: ${res.track.title}`);
      });
    }
  } catch (error) {
    logger.logMsg(`ERROR: ${error.message}`);
  }
});

document.getElementById('btn-get-track').addEventListener('click', () => {
  const indexValue = document.getElementById('get-track-index').value;
  const index = parseInt(indexValue, 10);

  try {
    if (player.existsTrack(index)) {
      const track = player.getTrack(index);
      logger.logMsg(`Track at index ${index} exists. Title: ${track.title}`);
    } else {
      logger.logMsg(`Track at index ${index} does not exist in the current playlist.`);
    }
  } catch (error) {
    logger.logMsg(`ERROR: ${error.message}`);
  }
});

// EXPLICIT REMOVE TRACK CONTROL
document.getElementById('btn-remove-track').addEventListener('click', async () => {
  const indexValue = document.getElementById('remove-track-index').value;
  const index = parseInt(indexValue, 10);
  try {
    await player.removeTrack(index);
    logger.logMsg(`Successfully removed track at index ${index} (via input field).`);
    renderPlaylist();
  } catch (error) {
    logger.logMsg(`ERROR: ${error.message}`);
  }
});

// Initial Render
syncUIWithState();
logger.logMsg('System initialized. QA Monitor Active.');
