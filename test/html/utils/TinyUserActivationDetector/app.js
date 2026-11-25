import TinyUserActivationDetector from '/src/v1/libs/utils/TinyUserActivationDetector.mjs';

window.TinyUserActivationDetector = TinyUserActivationDetector;

const detector = new TinyUserActivationDetector({ debugMode: true });
window.detector = detector;

const $ = (id) => document.getElementById(id);
const logEl = $('log');

/**
 * Appends a line to the on-page log.
 * @param {string} message - The message to print.
 * @param {'info'|'ok'|'warn'} [level='info'] - The message level.
 * @returns {void}
 */
const log = (message, level = 'info') => {
  const time = new Date().toLocaleTimeString();
  const line = document.createElement('div');
  line.className = `log-line ${level}`;
  line.textContent = `[${time}] ${message}`;
  logEl.prepend(line);
  console.log(message);
};

/**
 * Refreshes every status field.
 * @returns {void}
 */
const render = () => {
  $('status-supported').textContent = String(!!navigator.userActivation);
  $('status-active').textContent = String(navigator.userActivation?.hasBeenActive ?? false);
  $('status-unlocked').textContent = String(detector.unlocked);
  $('status-size').textContent = String(detector.size);
  $('status-autokey').textContent = String(detector.autoKey);
  $('status-timer').textContent = String(detector.existsTime);
};

// The activation is sticky, so a single interaction is enough for the whole
// session. The interval only keeps the panel in sync with the browser state.
setInterval(render, 200);
render();

$('btn-queue').addEventListener('click', () => {
  const input = $('key-input');
  const key = input.value.trim() || undefined;
  const result = detector.whenReady(() => {
    log(`callback executed (key: ${key ?? 'auto'})`, 'ok');
    render();
  }, key);
  log(`queued with key "${result || '(ran immediately)'}"`);
  input.value = '';
  render();
});

$('btn-queue-auto').addEventListener('click', () => {
  const result = detector.whenReady(() => {
    log('anonymous callback executed', 'ok');
    render();
  });
  log(`queued with automatic key "${result || '(ran immediately)'}"`);
  render();
});

$('btn-cancel').addEventListener('click', () => {
  const key = $('cancel-input').value.trim();
  detector.cancel(key);
  log(`cancel("${key}")`);
  $('cancel-input').value = '';
  render();
});

$('btn-unlock').addEventListener('click', () => {
  detector.unlock();
  log('unlock() called', 'warn');
  render();
});

$('btn-clear').addEventListener('click', () => {
  detector.clear();
  log('clear() called', 'warn');
  render();
});

$('btn-reset').addEventListener('click', () => {
  detector.reset();
  log('reset() called', 'warn');
  render();
});

$('btn-clear-log').addEventListener('click', () => (logEl.innerHTML = ''));

$('btn-play').addEventListener('click', () => {
  const audio = $('audio');
  detector.whenReady(() => {
    audio
      .play()
      .then(() => log('audio started', 'ok'))
      .catch((err) => log(`audio error: ${err.message}`, 'warn'));
  });
  log('audio playback queued until the user activation');
  render();
});

log('TinyUserActivationDetector ready. Interact with the page to unlock the queue.');
