/**
 * @fileoverview Bridge between the test harness UI and the TinyMediaLoader
 * family. This file never re-implements library logic: it only instantiates
 * the public classes, calls their public API and renders the results.
 */

import TinyMediaLoader from '/src/v1/libs/html/loader/TinyMediaLoader.mjs';
import TinyImageLoader from '/src/v1/libs/html/loader/TinyImageLoader.mjs';
import TinyVideoLoader from '/src/v1/libs/html/loader/TinyVideoLoader.mjs';
import TinyAudioLoader from '/src/v1/libs/html/loader/TinyAudioLoader.mjs';
import TinyMediaCache from '/src/v1/libs/html/loader/TinyMediaCache.mjs';
import TinyMediaProgress from '/src/v1/libs/html/loader/TinyMediaProgress.mjs';

/* ══════════════════════════════════════════════════════════════════
   DOM HELPERS
   ══════════════════════════════════════════════════════════════════ */

/** @param {string} selector @param {ParentNode} [scope] */
const $ = (selector, scope = document) => scope.querySelector(selector);

/** @param {string} selector @param {ParentNode} [scope] */
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

/** @param {string} id */
const byId = (id) => /** @type {HTMLInputElement} */ (document.getElementById(id));

/** @param {string} id */
const isChecked = (id) => byId(id).checked;

/** @param {string} id */
const textOf = (id) => byId(id).value.trim();

/** @param {string} id @param {number} fallback */
const numberOf = (id, fallback) => {
  const parsed = Number(byId(id).value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Formats a byte count into a human readable string.
 * @param {number} bytes - The raw byte count.
 * @returns {string} A string such as `1.44 MB`.
 */
function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** index;
  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

/**
 * Converts any value into a compact, single line, log friendly string.
 * @param {unknown} value - The value to describe.
 * @param {number} [depth] - The current recursion depth.
 * @returns {string} A readable representation of the value.
 */
function describe(value, depth = 0) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  const type = typeof value;
  if (type === 'string') return value;
  if (type === 'number' || type === 'boolean' || type === 'bigint') return String(value);
  if (type === 'function') return `[Function ${value.name || 'anonymous'}]`;
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (value instanceof Blob)
    return `Blob(${value.type || 'application/octet-stream'}, ${formatBytes(value.size)})`;
  if (value instanceof HTMLElement) return `<${value.tagName.toLowerCase()}>`;
  if (depth > 3) return '…';
  if (Array.isArray(value)) return `[${value.map((item) => describe(item, depth + 1)).join(', ')}]`;
  if (type === 'object') {
    const pairs = Object.entries(value).map(
      ([key, item]) => `${key}: ${describe(item, depth + 1)}`,
    );
    return `{ ${pairs.join(', ')} }`;
  }
  return String(value);
}

/* ══════════════════════════════════════════════════════════════════
   CONSOLE
   ══════════════════════════════════════════════════════════════════ */

const MAX_LOGS = 400;
const consoleEl = /** @type {HTMLElement} */ ($('#console-output'));
const consoleCountEl = /** @type {HTMLElement} */ ($('#console-count'));
let logCount = 0;

/**
 * Appends a line to the visual console.
 * @param {'info'|'success'|'warn'|'error'|'event'} level - The severity.
 * @param {string} message - The message to print.
 * @param {unknown} [payload] - An optional value appended to the message.
 * @returns {void}
 */
function log(level, message, payload) {
  const now = new Date();
  const time = `${now.toTimeString().slice(0, 8)}.${String(now.getMilliseconds()).padStart(3, '0')}`;
  const line = document.createElement('div');
  line.className = `log log--${level}`;

  const timeEl = document.createElement('span');
  timeEl.className = 'log__time';
  timeEl.textContent = time;

  const msgEl = document.createElement('span');
  msgEl.className = 'log__msg';
  msgEl.textContent = payload === undefined ? message : `${message} ${describe(payload)}`;

  line.append(timeEl, msgEl);
  consoleEl.prepend(line);

  logCount += 1;
  consoleCountEl.textContent = String(logCount);

  while (consoleEl.childElementCount > MAX_LOGS) {
    consoleEl.lastElementChild?.remove();
  }
}

/**
 * Runs a callback and reports the result in the console.
 * @param {string} label - The label printed before the result.
 * @param {() => unknown} callback - The code under test.
 * @returns {unknown} Whatever the callback returned, or `undefined` on throw.
 */
function attempt(label, callback) {
  try {
    const result = callback();
    log('success', `${label} →`, result);
    return result;
  } catch (error) {
    log('error', `${label} threw →`, error);
    return undefined;
  }
}

/* ══════════════════════════════════════════════════════════════════
   LOADER PANELS
   ══════════════════════════════════════════════════════════════════ */

/** @type {Record<string, any>} */
const loaders = { image: null, video: null, audio: null };

const LOADER_CLASSES = {
  image: TinyImageLoader,
  video: TinyVideoLoader,
  audio: TinyAudioLoader,
};

const CUSTOM_EVENTS = [
  'loadstart',
  'load',
  'loadend',
  'error',
  'abort',
  'timeout',
  'statechange',
  'srcchange',
  'cachehit',
  'cachemiss',
  'destroy',
];

const DOM_EVENTS = [
  'loadedmetadata',
  'canplay',
  'canplaythrough',
  'play',
  'playing',
  'pause',
  'seeking',
  'seeked',
  'waiting',
  'stalled',
  'suspend',
  'emptied',
  'ended',
  'durationchange',
  'ratechange',
  'volumechange',
  'timeupdate',
];

/** @type {TinyMediaCache|null} */
let sharedCache = null;

/** @param {string} kind */
const panelFor = (kind) => /** @type {HTMLElement} */ ($(`.loader[data-loader="${kind}"]`));

/**
 * Reads the shared configuration form.
 * @returns {Record<string, any>} The parsed configuration values.
 */
function readConfig() {
  return {
    src: textOf('cfg-src'),
    timeout: numberOf('cfg-timeout', 30000),
    crossOrigin: byId('cfg-crossorigin').value || null,
    preload: byId('cfg-preload').value,
    decoding: byId('cfg-decoding').value,
    stream: isChecked('cfg-stream'),
    autoReload: isChecked('cfg-autoreload'),
    autoplay: isChecked('cfg-autoplay'),
    loop: isChecked('cfg-loop'),
    muted: isChecked('cfg-muted'),
    autoMount: isChecked('cfg-automount'),
    useCache: isChecked('cfg-cache'),
  };
}

/**
 * Returns the shared cache, creating it on first use.
 * @returns {TinyMediaCache} The shared cache instance.
 */
function ensureCache() {
  if (!sharedCache || sharedCache.destroyed) {
    sharedCache = new TinyMediaCache({
      maxItems: numberOf('cfg-cache-max', 20),
      ttl: numberOf('cfg-cache-ttl', 0),
      strategy: byId('cfg-cache-strategy').value,
      ignoreSearch: isChecked('cfg-cache-ignore'),
    });
    log('info', 'TinyMediaCache created', sharedCache.stats);
  }
  return sharedCache;
}

/**
 * Renders the live state of one loader inside its panel.
 * @param {string} kind - The loader key (`image`, `video` or `audio`).
 * @returns {void}
 */
function renderLoaderState(kind) {
  const panel = panelFor(kind);
  const target = /** @type {HTMLElement} */ ($('[data-role="state"]', panel));
  const badge = /** @type {HTMLElement} */ (
    $('[data-role="state"]', panel.parentElement === null ? panel : panel)
  );
  const loader = loaders[kind];

  if (!loader) {
    target.innerHTML = '<dt>instance</dt><dd>null</dd>';
    badge.textContent = 'idle';
    return;
  }

  const meta = loader.metadata;
  const rows = [
    ['state', loader.state],
    ['src', loader.src || '—'],
    ['isLoading', String(loader.isLoading)],
    ['isLoaded', String(loader.isLoaded)],
    ['hasError', String(loader.hasError)],
    ['cacheHint', String(loader.cacheHint)],
    ['cacheAcquired', String(loader.cacheAcquired)],
    ['aborted', String(loader.aborted)],
    ['type', meta.type || '—'],
    ['dimensions', `${meta.width} × ${meta.height}`],
    ['duration', `${Number(meta.duration).toFixed(2)} s`],
    ['size', formatBytes(meta.size)],
    ['fromCache', String(meta.fromCache)],
    ['loadTime', `${Number(meta.loadTime).toFixed(1)} ms`],
  ];

  target.replaceChildren(
    ...rows.flatMap(([key, value]) => {
      const dt = document.createElement('dt');
      dt.textContent = key;
      const dd = document.createElement('dd');
      dd.textContent = value;
      dd.title = value;
      return [dt, dd];
    }),
  );

  badge.textContent = loader.state;
}

/**
 * Attaches every observable event of a loader to the visual console.
 * @param {string} kind - The loader key.
 * @param {any} loader - The loader instance.
 * @returns {void}
 */
function wireLoaderEvents(kind, loader) {
  for (const name of CUSTOM_EVENTS) {
    loader.on(name, (payload) => {
      if (name === 'error') {
        log('error', `[${kind}] error`, payload);
      } else {
        log('event', `[${kind}] ${name}`, payload);
      }
      renderLoaderState(kind);
    });
  }

  for (const name of DOM_EVENTS) {
    loader.on(name, () => {
      if (!isChecked('cfg-verbose')) return;
      log('info', `[${kind}] ${name}`);
    });
  }

  loader.on('progress', (snapshot) => {
    const panel = panelFor(kind);
    const bar = /** @type {HTMLElement} */ ($('[data-role="bar"]', panel));
    bar.style.width = `${Math.min(100, snapshot.percent || 0).toFixed(1)}%`;
    if (isChecked('cfg-verbose')) {
      log('info', `[${kind}] progress ${snapshot.percent.toFixed(1)}%`, snapshot);
    }
  });
}

/**
 * Creates a fresh loader instance for the given panel.
 * @param {string} kind - The loader key.
 * @returns {void}
 */
function createLoader(kind) {
  const config = readConfig();

  if (loaders[kind]) {
    log('warn', `[${kind}] replacing the previous instance`);
    try {
      loaders[kind].destroy();
    } catch (error) {
      log('error', `[${kind}] destroy failed`, error);
    }
  }

  const options = {
    src: config.src,
    timeout: config.timeout,
    crossOrigin: config.crossOrigin,
    autoReload: config.autoReload,
    stream: config.stream,
    cache: config.useCache ? ensureCache() : null,
  };

  if (kind === 'image') {
    options.decoding = config.decoding;
  } else {
    options.preload = config.preload;
    options.autoplay = config.autoplay;
    options.loop = config.loop;
    options.muted = config.muted;
  }

  const LoaderClass = LOADER_CLASSES[kind];
  const loader = new LoaderClass(options);
  loaders[kind] = loader;
  wireLoaderEvents(kind, loader);
  renderLoaderState(kind);
  log('success', `[${kind}] ${LoaderClass.name} created`, options);
}

/**
 * Mounts the loader element into the panel stage.
 * @param {string} kind - The loader key.
 * @returns {void}
 */
function mountLoader(kind) {
  const loader = loaders[kind];
  if (!loader) return;
  const stage = /** @type {HTMLElement} */ ($('[data-role="stage"]', panelFor(kind)));
  stage.replaceChildren();
  loader.mount(stage);
  log('info', `[${kind}] mounted into the stage`);
}

/**
 * Runs `load()` and reports the outcome.
 * @param {string} kind - The loader key.
 * @returns {Promise<void>} Resolves once the load settles.
 */
async function loadLoader(kind) {
  const loader = loaders[kind];
  if (!loader) {
    log('warn', `[${kind}] create the loader first`);
    return;
  }
  try {
    const metadata = await loader.load();
    if (isChecked('cfg-automount')) {
      mountLoader(kind);
    }
    log('success', `[${kind}] load() resolved`, metadata);
  } catch (error) {
    log('error', `[${kind}] load() rejected`, error);
  } finally {
    renderLoaderState(kind);
  }
}

/**
 * Binds every button of a loader panel.
 * @param {string} kind - The loader key.
 * @returns {void}
 */
function bindLoaderPanel(kind) {
  const panel = panelFor(kind);

  panel.addEventListener('click', async (event) => {
    const button = /** @type {HTMLElement} */ (event.target).closest('[data-action]');
    if (!button) return;
    const action = button.getAttribute('data-action');

    try {
      if (action === 'create') createLoader(kind);
      if (action === 'load') await loadLoader(kind);
      if (action === 'reload') {
        const metadata = await loaders[kind].reload();
        log('success', `[${kind}] reload() resolved`, metadata);
      }
      if (action === 'abort') log('info', `[${kind}] abort() →`, loaders[kind].abort());
      if (action === 'inspect') {
        log('info', `[${kind}] metadata`, loaders[kind].metadata);
        log('info', `[${kind}] element`, loaders[kind].element);
      }
      if (action === 'destroy') {
        loaders[kind].destroy();
        loaders[kind] = null;
        $('[data-role="stage"]', panel).replaceChildren();
        log('success', `[${kind}] destroy() completed`);
      }
    } catch (error) {
      log('error', `[${kind}] ${action}() threw`, error);
    } finally {
      renderLoaderState(kind);
    }
  });
}

/* ══════════════════════════════════════════════════════════════════
   CACHE PANEL
   ══════════════════════════════════════════════════════════════════ */

const cacheReadout = /** @type {HTMLElement} */ ($('#cache-readout'));

/**
 * Prints a value in the cache readout block.
 * @param {unknown} value - The value to print.
 * @returns {void}
 */
function printCache(value) {
  cacheReadout.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

$('#cache-readout')
  .closest('.panel')
  ?.addEventListener('click', (event) => {
    const button = /** @type {HTMLElement} */ (event.target).closest('[data-cache]');
    if (!button) return;

    const action = button.getAttribute('data-cache');
    const url = textOf('cache-url');

    try {
      switch (action) {
        case 'construct':
          sharedCache = new TinyMediaCache({
            maxItems: numberOf('cfg-cache-max', 20),
            ttl: numberOf('cfg-cache-ttl', 0),
            strategy: byId('cfg-cache-strategy').value,
            ignoreSearch: isChecked('cfg-cache-ignore'),
          });
          log('success', 'new TinyMediaCache()', sharedCache.stats);
          break;
        case 'set':
          printCache(
            sharedCache.set(url, new Blob([textOf('cache-blob')], { type: 'text/plain' })),
          );
          break;
        case 'get':
          printCache(sharedCache.get(url) ?? 'null');
          break;
        case 'has':
          printCache(String(sharedCache.has(url)));
          break;
        case 'acquire':
          printCache(sharedCache.acquire(url) ?? 'null');
          break;
        case 'release':
          printCache(String(sharedCache.release(url)));
          break;
        case 'pin':
          printCache(String(sharedCache.pin(url, byId('cache-pin').value === 'true')));
          break;
        case 'prune':
          printCache(`removed: ${sharedCache.prune()}`);
          break;
        case 'stats':
          printCache(sharedCache.stats);
          break;
        case 'clear':
          sharedCache.clear();
          printCache('cleared');
          break;
        case 'destroy':
          sharedCache.destroy();
          printCache('destroyed');
          break;
        case 'static-has':
          printCache(String(TinyMediaCache.has(url)));
          break;
        case 'static-size':
          printCache(String(TinyMediaCache.size));
          break;
        case 'static-bytes':
          printCache(formatBytes(TinyMediaCache.bytes));
          break;
        case 'static-instances':
          printCache(`instances: ${TinyMediaCache.instances.length}`);
          break;
        case 'static-clear':
          TinyMediaCache.clear();
          printCache('shared registry cleared');
          break;
        case 'static-destroy-all':
          TinyMediaCache.destroyAll();
          printCache('all instances destroyed');
          break;
        default:
          break;
      }
    } catch (error) {
      log('error', `cache.${action}() threw`, error);
      printCache(`${error.name}: ${error.message}`);
    }
  });

/* ══════════════════════════════════════════════════════════════════
   PROGRESS PANEL
   ══════════════════════════════════════════════════════════════════ */

/** @type {TinyMediaProgress|null} */
let progress = null;
const progressReadout = /** @type {HTMLElement} */ ($('#progress-readout'));

/** @returns {void} */
function printProgress() {
  progressReadout.textContent = progress
    ? JSON.stringify(progress.snapshot(), null, 2)
    : '// no progress instance';
}

$('#btn-progress-construct').addEventListener('click', () => {
  progress = new TinyMediaProgress(numberOf('progress-total', 0));
  log('success', 'new TinyMediaProgress()', progress.snapshot());
  printProgress();
});

$$('[data-progress]').forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.getAttribute('data-progress');
    if (!progress) {
      log('warn', 'Create a TinyMediaProgress instance first');
      return;
    }
    try {
      if (action === 'start') progress.start();
      if (action === 'push') progress.push(numberOf('progress-bytes', 0));
      if (action === 'reset') progress.reset();
      log('info', `progress.${action}()`, progress.snapshot());
      printProgress();
    } catch (error) {
      log('error', `progress.${action}() threw`, error);
    }
  });
});

/* ══════════════════════════════════════════════════════════════════
   GLOBAL CONTROLS
   ══════════════════════════════════════════════════════════════════ */

/**
 * Maps a loader kind to the local fixture served by the dev server.
 * @type {Record<'image'|'audio'|'video', { src: string, label: string }>}
 */
const PRESETS = {
  image: { src: '/6d01c26e-e523-4439-8bfc-f656a83cdab0.png', label: 'image' },
  audio: { src: '/temp/test.mp3', label: 'audio' },
  video: { src: '/temp/test.mp4', label: 'video' },
};

/**
 * Infers the loader kind from a file extension.
 * @param {string} src - The source URL or path.
 * @returns {'image'|'audio'|'video'|null} The detected kind, or `null` when unknown.
 */
function detectKind(src) {
  const clean = src.split('?')[0].split('#')[0].toLowerCase();
  if (/\.(png|jpe?g|gif|webp|avif|svg|bmp|ico)$/.test(clean)) return 'image';
  if (/\.(mp3|wav|ogg|oga|m4a|aac|flac|opus)$/.test(clean)) return 'audio';
  if (/\.(mp4|webm|ogv|mov|m4v|mkv)$/.test(clean)) return 'video';
  return null;
}

/**
 * Fills the shared form, creates a loader and immediately loads the fixture.
 * @param {'image'|'audio'|'video'} kind - The loader to exercise.
 * @returns {Promise<void>} Resolves once the load settles.
 */
async function runPreset(kind) {
  const preset = PRESETS[kind];
  if (!preset) {
    log('error', `Unknown preset: ${kind}`);
    return;
  }

  byId('cfg-src').value = preset.src;
  log('info', `[${kind}] quick start → ${preset.src}`);

  try {
    createLoader(kind);
    await loadLoader(kind);
  } catch (error) {
    log('error', `[${kind}] quick start failed`, error);
    return;
  }

  panelFor(kind).scrollIntoView({ behavior: 'smooth', block: 'start' });
}

$$('[data-preset]').forEach((button) => {
  button.addEventListener('click', () => {
    const kind = button.getAttribute('data-preset');
    if (kind) runPreset(/** @type {'image'|'audio'|'video'} */ (kind));
  });
});

$('#cfg-preset').addEventListener('change', (event) => {
  const value = /** @type {HTMLSelectElement} */ (event.target).value;
  if (!value) return;
  byId('cfg-src').value = value;
  const kind = detectKind(value);
  log('info', `src set to ${value}`, kind ? `(detected: ${kind})` : '(unknown kind)');
});

$('#btn-clear-console').addEventListener('click', () => {
  consoleEl.replaceChildren();
  logCount = 0;
  consoleCountEl.textContent = '0';
});

$('#btn-destroy-all').addEventListener('click', () => {
  for (const kind of Object.keys(loaders)) {
    if (!loaders[kind]) continue;
    try {
      loaders[kind].destroy();
      loaders[kind] = null;
      $('[data-role="stage"]', panelFor(kind)).replaceChildren();
      renderLoaderState(kind);
    } catch (error) {
      log('error', `[${kind}] destroy() threw`, error);
    }
  }
  log('success', 'All loaders destroyed');
});

/* ══════════════════════════════════════════════════════════════════
   BOOT
   ══════════════════════════════════════════════════════════════════ */

window.addEventListener('unhandledrejection', (event) => {
  log('error', 'Unhandled rejection', event.reason);
});

['image', 'video', 'audio'].forEach(bindLoaderPanel);
['image', 'video', 'audio'].forEach(renderLoaderState);

byId('cfg-src').value = PRESETS.video.src;

log('success', 'Harness ready', {
  TinyMediaLoader: typeof TinyMediaLoader,
  TinyMediaCache: typeof TinyMediaCache,
  TinyMediaProgress: typeof TinyMediaProgress,
});
