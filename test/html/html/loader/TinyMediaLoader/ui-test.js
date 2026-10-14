/**
 * @fileoverview Bridge between the test harness UI and the TinyMediaLoader
 * family. It never re-implements library logic: it instantiates the public
 * classes, calls their public API and renders the results. Every card owns one
 * loader instance so that two loads can be compared side by side.
 */

import TinyImageLoader from '/src/v1/libs/html/loader/formats/TinyImageLoader.mjs';
import TinyVideoLoader from '/src/v1/libs/html/loader/beta/formats/TinyVideoLoader.mjs';
import TinyAudioLoader from '/src/v1/libs/html/loader/beta/formats/TinyAudioLoader.mjs';
import TinyMediaCache from '/src/v1/libs/html/loader/utils/TinyMediaCache.mjs';
import TinyMediaProgress from '/src/v1/libs/html/loader/utils/TinyMediaProgress.mjs';

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
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
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

  while (consoleEl.childElementCount > MAX_LOGS) consoleEl.lastElementChild?.remove();
}

/* ══════════════════════════════════════════════════════════════════
   CONFIGURATION
   ══════════════════════════════════════════════════════════════════ */

const LOADER_CLASSES = {
  image: TinyImageLoader,
  video: TinyVideoLoader,
  audio: TinyAudioLoader,
};

/**
 * Events emitted by the loader itself (not forwarded from the DOM).
 * Keep this list in sync with the `this.emit(...)` calls in TinyMediaLoader.
 * @type {string[]}
 */
const CUSTOM_EVENTS = [
  'loadstart',
  'metadata',
  'loaded',
  'loadend',
  'error',
  'abort',
  'timeout',
  'statechange',
  'srcchange',
  'srctransition',
  'cachehit',
  'cachemiss',
  'destroy',
];

/**
 * Custom events whose payload is a full MediaMetadata snapshot. They are the
 * only ones allowed to refresh the card metadata block, because calling
 * `loader.metadata` from inside a `statechange` handler would read a stale
 * object.
 * @type {Set<string>}
 */
const METADATA_EVENTS = new Set(['metadata', 'loaded']);

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

/**
 * Returns the shared cache, creating it on first use.
 * @returns {TinyMediaCache} The shared cache instance.
 */
function ensureCache() {
  if (!sharedCache || sharedCache.destroyed) {
    sharedCache = new TinyMediaCache({ maxItems: 50, ttl: 0, strategy: 'manual' });
    log('info', 'TinyMediaCache created', sharedCache.stats);
  }
  return sharedCache;
}

/**
 * Reads the spawn form.
 * @returns {Record<string, any>} The parsed configuration values.
 */
function readConfig() {
  return {
    src: textOf('cfg-src'),
    kind: byId('cfg-kind').value,
    timeout: numberOf('cfg-timeout', Infinity),
    crossOrigin: byId('cfg-crossorigin').value || null,
    preload: byId('cfg-preload').value,
    animationControl: byId('cfg-animation').value,
    stream: isChecked('cfg-stream'),
    progressive: isChecked('cfg-progressive'),
    autoReload: isChecked('cfg-autoreload'),
    autoplay: isChecked('cfg-autoplay'),
    loop: isChecked('cfg-loop'),
    muted: isChecked('cfg-muted'),
    controls: isChecked('cfg-controls'),
    autoMount: isChecked('cfg-automount'),
    useCache: isChecked('cfg-cache'),
  };
}

/**
 * @param {string} url
 * @returns {string}
 */
function getCleanUrl(src) {
  let candidate = src;
  if (candidate.startsWith('/__slow')) {
    candidate = new URL(candidate, location.origin).searchParams.get('src') || '';
  }
  return candidate;
}

/**
 * Último recurso: infere pela extensão da URL caso as requisições de rede falhem.
 */
function detectKindByExtension(src) {
  const candidate = getCleanUrl(src);
  const clean = candidate.split('?')[0].split('#')[0].toLowerCase();
  if (/\.(png|jpe?g|gif|webp|avif|svg|bmp|ico)$/.test(clean)) return 'image';
  if (/\.(mp3|wav|ogg|oga|m4a|aac|flac|opus)$/.test(clean)) return 'audio';
  if (/\.(mp4|webm|ogv|mov|m4v|mkv)$/.test(clean)) return 'video';
  return null;
}

/**
 * Padrão de Produção: Detecta o tipo de mídia de forma segura analisando
 * o cabeçalho do servidor ou extraindo os Magic Numbers diretamente do arquivo.
 */
async function detectKindByContent(url) {
  // 1. Tenta descobrir pelo Content-Type via requisição HEAD
  try {
    const response = await fetch(getCleanUrl(url), { method: 'HEAD' });
    const contentType = response.headers.get('content-type');
    if (contentType) {
      if (contentType.startsWith('image/')) return 'image';
      if (contentType.startsWith('video/')) return 'video';
      if (contentType.startsWith('audio/')) return 'audio';
    }
  } catch (e) {
    // Falha silenciosa
  }

  // 2. Fallback: Magic Numbers
  try {
    const response = await fetch(url, {
      headers: { Range: 'bytes=0-64' },
    });

    if (response.ok || response.status === 206) {
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const check = (sig, offset = 0) => sig.every((b, i) => bytes[offset + i] === b);

      // Assinaturas de Imagem
      if (check([0x89, 0x50, 0x4e, 0x47])) return 'image'; // PNG
      if (check([0xff, 0xd8, 0xff])) return 'image'; // JPEG
      if (check([0x47, 0x49, 0x46, 0x38])) return 'image'; // GIF
      if (check([0x52, 0x49, 0x46, 0x46]) && check([0x57, 0x45, 0x42, 0x50], 8)) return 'image'; // WebP
      if (check([0x42, 0x4d])) return 'image'; // BMP

      // Assinaturas de Áudio puro
      if (check([0x49, 0x44, 0x33]) || check([0xff, 0xfb])) return 'audio'; // MP3
      if (check([0x66, 0x4c, 0x61, 0x43])) return 'audio'; // FLAC
      if (check([0x52, 0x49, 0x46, 0x46]) && check([0x57, 0x41, 0x56, 0x45], 8)) return 'audio'; // WAV

      // Assinaturas de Containers (Vídeo/Áudio multiplexado)
      if (check([0x66, 0x74, 0x79, 0x70], 4)) {
        // ftyp (ISOBMFF). Se a sub-assinatura for M4A, geralmente é áudio exclusivo.
        if (check([0x4d, 0x34, 0x41, 0x20], 8)) return 'audio';
        return 'video'; // MP4 genérico assume vídeo na UI
      }
      if (check([0x1a, 0x45, 0xdf, 0xa3])) return 'video'; // WebM/MKV
      if (check([0x4f, 0x67, 0x67, 0x53])) return 'video'; // Ogg
      if (check([0x46, 0x4c, 0x56, 0x01])) return 'video'; // FLV
    }
  } catch (e) {
    // Falha silenciosa
  }

  // 3. Extensão da URL
  return detectKindByExtension(url);
}

/**
 * Indicates whether a source must bypass the throttled endpoint.
 * @param {string} raw - The raw source URL.
 * @returns {boolean} True when the source must not be wrapped.
 */
function isExternal(raw) {
  return /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(raw) || /^(?:data|blob):/i.test(raw);
}

/**
 * Wraps a source in the throttled endpoint when the toggle is on.
 * @param {string} raw - The original source URL.
 * @returns {string} The URL the loader must fetch.
 */
function buildSrc(raw) {
  if (!isChecked('cfg-slow')) {
    return raw;
  }
  if (isExternal(raw)) {
    log('warn', `[throttle] bypassed for external source: ${raw}`);
    return raw;
  }
  const params = new URLSearchParams({
    src: raw,
    chunk: String(numberOf('cfg-slow-chunk', 65536)),
    delay: String(numberOf('cfg-slow-delay', 150)),
  });
  return `/__slow?${params}`;
}

/* ══════════════════════════════════════════════════════════════════
   LAB
   ══════════════════════════════════════════════════════════════════ */

const labEl = $('#lab');
const labCountEl = $('#lab-count');
const labDiffEl = $('#lab-diff');

/** @type {Map<number, any>} */
const instances = new Map();
let nextId = 1;

/**
 * Builds the DOM skeleton of a card.
 * @param {number} id - The instance id.
 * @param {string} kind - The loader kind.
 * @param {string} src - The resolved source URL.
 * @returns {HTMLElement} The card element.
 */
function createCard(id, kind, src) {
  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.status = 'idle';
  card.innerHTML = `
    <header class="card__head">
      <span class="card__kind">${kind} #${id}</span>
      <span class="badge" data-role="state">idle</span>
      <button class="btn btn--ghost card__close" data-role="remove" title="Remove">✕</button>
    </header>
    <div class="card__stage" data-role="stage"></div>
    <div class="progress"><div class="progress__bar" data-role="bar"></div></div>
    <dl class="kv" data-role="meta"></dl>
    <div class="card__actions">
      <button class="btn" data-role="load">load()</button>
      <button class="btn" data-role="abort">abort()</button>
      <button class="btn" data-role="reload">reload()</button>
      <button class="btn btn--danger" data-role="destroy">destroy()</button>
    </div>
    ${
      kind === 'image'
        ? `
        <div class="card__actions card__actions--anim">
          <button class="btn btn--ghost" data-role="play" title="Play (Controlled mode only)">▶</button>
          <button class="btn btn--ghost" data-role="pause" title="Pause (Controlled mode only)">⏸</button>
          <button class="btn btn--ghost" data-role="freeze" title="Freeze frame">❄</button>
          <button class="btn btn--ghost" data-role="unfreeze" title="Unfreeze">🔥</button>
          <input type="number" class="card__rate" data-role="rate" value="1.0" step="0.25" min="0.1" title="Playback Rate (Controlled)" />
        </div>`
        : ''
    }
    <ol class="timeline" data-role="timeline"></ol>
  `;
  card.title = src;
  return card;
}

/**
 * Renders the metadata block of a card.
 * @param {any} entry - The instance registry entry.
 * @returns {void}
 */
function renderMeta(entry) {
  const { loader, card } = entry;
  const target = $('[data-role="meta"]', card);
  const badge = $('[data-role="state"]', card);

  if (!loader) {
    target.replaceChildren();
    badge.textContent = 'null';
    return;
  }

  const meta = loader.metadata;
  const element = loader.element;

  // Extrai as novas propriedades de animação caso existam no metadata
  const hasAnim = meta.animation != null;
  const frames = hasAnim ? meta.animation.frames : meta.frames || 0;
  const duration = hasAnim ? meta.animation.duration / 1000 : meta.duration || 0;
  const loopCount = hasAnim ? meta.animation.loopCount : '—';

  const rows = [
    ['size', `${formatBytes(meta.size)} (${meta.size} B)`],
    ['loadTime', `${Number(meta.loadTime).toFixed(1)} ms`],
    ['fromCache', String(meta.fromCache)],
    ['type', meta.type || '—'],
    ['dimensions', `${meta.width} × ${meta.height}`],
    ['frames', String(frames)],
    ['duration', duration > 0 ? `${Number(duration).toFixed(2)} s` : 'NaN'],
    ['loops', String(loopCount)],
    ['original-src', element?.getAttribute('original-src') ?? '—'],
    ['element.src', element?.getAttribute('src')?.slice(0, 42) ?? '—'],
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
  card.dataset.status = loader.state;
}

/**
 * Appends a timestamped line to the card timeline.
 * @param {any} entry - The instance registry entry.
 * @param {string} label - The event name.
 * @returns {void}
 */
function pushTimeline(entry, label) {
  const list = $('[data-role="timeline"]', entry.card);
  const item = document.createElement('li');
  const elapsed = entry.startedAt ? `+${(performance.now() - entry.startedAt).toFixed(0)}ms` : '—';
  item.textContent = `${elapsed.padStart(8)} · ${label}`;
  list.prepend(item);
  while (list.childElementCount > 24) list.lastElementChild?.remove();
}

/**
 * Wires the loader events into the card and the console.
 * @param {any} entry - The instance registry entry.
 * @returns {void}
 */
function wire(entry) {
  const { loader, card, id } = entry;

  for (const name of CUSTOM_EVENTS) {
    loader.on(name, (payload) => {
      pushTimeline(entry, name);
      if (name === 'error') {
        log('error', `[#${id}] error`, payload);
      } else if (name === 'metadata') {
        log('info', `[#${id}] metadata (early)`, payload);
      } else if (name !== 'statechange') {
        log('event', `[#${id}] ${name}`, payload);
      }
      if (METADATA_EVENTS.has(name) || name === 'statechange') {
        renderMeta(entry);
      }
    });
  }
  for (const name of DOM_EVENTS) {
    loader.on(name, () => {
      if (isChecked('cfg-verbose')) log('info', `[#${id}] ${name}`);
    });
  }
  loader.on('progress', (snapshot) => {
    const bar = $('[data-role="bar"]', card);
    bar.style.width = `${Math.min(100, snapshot.percent || 0).toFixed(1)}%`;
    if (isChecked('cfg-verbose'))
      log('info', `[#${id}] progress ${snapshot.percent.toFixed(1)}%`, snapshot);
  });

  // Action Buttons Delegation
  card.addEventListener('click', (event) => {
    const button = event.target.closest('[data-role]');
    if (!button) return;
    const role = button.getAttribute('data-role');

    // Core Actions
    if (role === 'remove') removeInstance(id);
    if (role === 'load') loadInstance(id);
    if (role === 'abort') abortInstance(id);
    if (role === 'reload') reloadInstance(id);
    if (role === 'destroy') destroyInstance(id);

    // Animation Actions
    if (role === 'play' && typeof loader.play === 'function') {
      loader.play();
      log('info', `[#${id}] play()`);
    }
    if (role === 'pause' && typeof loader.pause === 'function') {
      loader.pause();
      log('info', `[#${id}] pause()`);
    }
    if (role === 'freeze' && typeof loader.freeze === 'function') {
      loader.freeze();
      log('info', `[#${id}] freeze()`);
    }
    if (role === 'unfreeze' && typeof loader.unfreeze === 'function') {
      loader.unfreeze();
      log('info', `[#${id}] unfreeze()`);
    }
  });

  // Animation PlaybackRate Binding
  const rateInput = card.querySelector('[data-role="rate"]');
  if (rateInput) {
    rateInput.addEventListener('change', (e) => {
      if ('playbackRate' in loader) {
        loader.playbackRate = Number(e.target.value);
        log('info', `[#${id}] playbackRate set to`, loader.playbackRate);
      }
    });
  }
}

/**
 * Creates a loader instance and its card.
 * @param {Record<string, any>} config - The spawn configuration.
 * @returns {Promise<any>} The created registry entry.
 */
async function spawn(config) {
  let kind = config.kind;

  if (kind === 'auto') {
    kind = await detectKindByContent(config.src);
  }

  if (!kind) {
    log('error', `Could not detect the media kind for ${config.src}`);
    return null;
  }

  const id = nextId++;
  const card = createCard(id, kind, config.src);
  const LoaderClass = LOADER_CLASSES[kind];
  const options = {
    src: config.src,
    timeout: config.timeout,
    crossOrigin: config.crossOrigin,
    autoReload: config.autoReload,
    stream: config.stream,
    progressive: config.progressive,
    cache: config.useCache ? ensureCache() : null,
  };
  if (kind === 'image') {
    options.decoding = 'async';
    options.animationControl = config.animationControl; // Paramêtro avançado de Animação
  } else {
    options.preload = config.preload;
    options.autoplay = config.autoplay;
    options.loop = config.loop;
    options.muted = config.muted;
    options.controls = config.controls;
  }
  const loader = new LoaderClass(options);
  const entry = { id, kind, card, loader, startedAt: 0 };
  instances.set(id, entry);
  wire(entry);
  labEl.append(card);
  renderMeta(entry);
  updateLabCount();
  log('success', `[#${id}] ${LoaderClass.name} created`, options);
  return entry;
}

/**
 * Loads one instance and mounts it on success.
 * @param {number} id - The instance id.
 * @returns {Promise<void>} Resolves once the load settles.
 */
async function loadInstance(id) {
  const entry = instances.get(id);
  if (!entry) return;
  entry.startedAt = performance.now();
  pushTimeline(entry, 'load() called');
  try {
    const loadPromise = entry.loader.load();
    if (readConfig().autoMount) {
      const stage = $('[data-role="stage"]', entry.card);
      stage.replaceChildren();
      entry.loader.mount(stage);
    }
    const metadata = await loadPromise;
    log('success', `[#${id}] load() resolved`, metadata);
  } catch (error) {
    log('error', `[#${id}] load() rejected`, error);
  } finally {
    renderMeta(entry);
  }
}

/**
 * Aborts one instance.
 * @param {number} id - The instance id.
 * @returns {void}
 */
function abortInstance(id) {
  const entry = instances.get(id);
  if (!entry) return;
  const result = entry.loader.abort();
  pushTimeline(entry, `abort() → ${result}`);
  log(result ? 'warn' : 'info', `[#${id}] abort() → ${result}`);
}

/**
 * Reloads one instance.
 * @param {number} id - The instance id.
 * @returns {Promise<void>} Resolves once the reload settles.
 */
async function reloadInstance(id) {
  const entry = instances.get(id);
  if (!entry) return;
  entry.startedAt = performance.now();
  try {
    await entry.loader.reload();
  } catch (error) {
    log('error', `[#${id}] reload() rejected`, error);
  }
}

/**
 * Destroys one instance and removes its card.
 * @param {number} id - The instance id.
 * @returns {void}
 */
function destroyInstance(id) {
  const entry = instances.get(id);
  if (!entry) return;
  try {
    entry.loader.destroy();
  } catch (error) {
    log('error', `[#${id}] destroy() threw`, error);
  }
  entry.card.remove();
  instances.delete(id);
  updateLabCount();
}

/**
 * Removes one instance without destroying it.
 * @param {number} id - The instance id.
 * @returns {void}
 */
function removeInstance(id) {
  const entry = instances.get(id);
  if (!entry) return;
  entry.card.remove();
  instances.delete(id);
  updateLabCount();
}

/**
 * Refreshes the instance counter and the cold/warm diff line.
 * @returns {void}
 */
function updateLabCount() {
  labCountEl.textContent = `${instances.size} instance${instances.size === 1 ? '' : 's'}`;
  const loaded = Array.from(instances.values()).filter((entry) => entry.loader.isLoaded);
  if (loaded.length < 2) {
    labDiffEl.textContent = '';
    return;
  }
  const [cold, warm] = loaded;
  const sizeDelta = warm.loader.metadata.size - cold.loader.metadata.size;
  const timeDelta = warm.loader.metadata.loadTime - cold.loader.metadata.loadTime;
  labDiffEl.textContent =
    `#${cold.id} → #${warm.id} · ` +
    `size Δ ${sizeDelta >= 0 ? '+' : ''}${sizeDelta} B · ` +
    `loadTime Δ ${timeDelta >= 0 ? '+' : ''}${timeDelta.toFixed(1)} ms · ` +
    `fromCache ${cold.loader.metadata.fromCache} → ${warm.loader.metadata.fromCache}`;
}

/* ══════════════════════════════════════════════════════════════════
   CACHE INSPECTOR
   ══════════════════════════════════════════════════════════════════ */

const cacheRowsEl = $('#cache-rows');
const cacheSummaryEl = $('#cache-summary');

/**
 * Rebuilds the cache table from the shared registry.
 * @returns {void}
 */
function renderCache() {
  const registry = TinyMediaCache.registry;
  cacheSummaryEl.textContent = `${registry.length} blobs · ${formatBytes(TinyMediaCache.bytes)}`;
  cacheRowsEl.replaceChildren(
    ...registry.map((record) => {
      const row = document.createElement('tr');
      const key = document.createElement('td');
      key.textContent = record.key.length > 48 ? `…${record.key.slice(-46)}` : record.key;
      key.title = record.key;
      const size = document.createElement('td');
      size.textContent = formatBytes(record.size);
      const refs = document.createElement('td');
      refs.textContent = String(record.refs);
      const url = document.createElement('td');
      url.textContent = record.objectUrl.slice(0, 24);
      url.title = record.objectUrl;
      row.append(key, size, refs, url);
      return row;
    }),
  );
}

setInterval(() => {
  if (isChecked('cache-live')) renderCache();
}, 500);
$('#btn-cache-refresh').addEventListener('click', renderCache);

/* ══════════════════════════════════════════════════════════════════
   PROGRESS PANEL
   ══════════════════════════════════════════════════════════════════ */

let progress = null;
const progressReadout = $('#progress-readout');

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
    if (!progress) return log('warn', 'Create a TinyMediaProgress instance first');
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

$('#btn-spawn').addEventListener('click', async () => {
  const config = readConfig();
  config.src = buildSrc(config.src);
  await spawn(config);
});

$('#btn-spawn-pair').addEventListener('click', async () => {
  const config = readConfig();
  if (!config.useCache) {
    log('warn', 'Enable "use cache" so the second load can be a cache hit.');
  }
  const resolved = buildSrc(config.src);

  const cold = await spawn({ ...config, src: resolved });
  if (!cold) return;
  await loadInstance(cold.id);

  const warm = await spawn({ ...config, src: resolved });
  if (!warm) return;
  await loadInstance(warm.id);

  updateLabCount();
});

$('#btn-load-all').addEventListener('click', () => {
  for (const id of instances.keys()) loadInstance(id);
});

$('#btn-abort-all').addEventListener('click', () => {
  for (const id of instances.keys()) abortInstance(id);
});

$('#btn-clear-console').addEventListener('click', () => {
  consoleEl.replaceChildren();
  logCount = 0;
  consoleCountEl.textContent = '0';
});

$('#btn-destroy-all').addEventListener('click', () => {
  for (const id of Array.from(instances.keys())) destroyInstance(id);
  log('success', 'All loaders destroyed');
});

$('#cfg-preset').addEventListener('change', async (event) => {
  const value = event.target.value;
  if (!value) return;
  byId('cfg-src').value = value;
  const kind = await detectKindByContent(value);
  log('info', `src set to ${value}`, kind ? `(detected by content: ${kind})` : '(unknown kind)');
});

/**
 * Updates the resolved URL preview.
 * @returns {void}
 */
function updateSlowPreview() {
  const raw = textOf('cfg-src') || '/temp/test.mp4';
  const resolved = buildSrc(raw);
  $('#slow-preview').textContent = resolved.length > 60 ? `…${resolved.slice(-58)}` : resolved;
  $('#slow-preview').title = resolved;
}

['cfg-src', 'cfg-slow', 'cfg-slow-chunk', 'cfg-slow-delay'].forEach((id) => {
  byId(id).addEventListener('input', updateSlowPreview);
  byId(id).addEventListener('change', updateSlowPreview);
});

window.addEventListener('unhandledrejection', (event) => {
  log('error', 'Unhandled rejection', event.reason);
});

/* ══════════════════════════════════════════════════════════════════
   BOOT
   ══════════════════════════════════════════════════════════════════ */

byId('cfg-src').value = '/temp/test.mp4';
updateSlowPreview();
renderCache();
log('success', 'Harness ready', {
  TinyMediaCache: typeof TinyMediaCache,
  TinyMediaProgress: typeof TinyMediaProgress,
});
