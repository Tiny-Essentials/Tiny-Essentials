import { TestRunner, section, color } from './_helpers.mjs';

/**
 * Node.js port of the browser based test environments for
 * `src/v1/basics/browserDetector.mjs` and `src/v1/basics/fullScreen.mjs`
 * (`test/html/basics/browserDetector` and `test/html/basics/fullScreen`).
 *
 * Both modules capture `window`/`document` at module evaluation time, so the
 * globals are installed *before* the dynamic import below.
 *
 * The existing `window` object is mutated in place (never replaced) so that
 * sibling suites which captured a reference to it keep working.
 *
 * @returns {Promise<number>}
 */

/** The single `document` stub shared with the modules under test. */
const documentStub = {
  fullscreenElement: null,
  documentElement: { requestFullscreen: async () => {} },
  addEventListener: () => {},
  removeEventListener: () => {},
  exitFullscreen: async () => {},
};

/** Snapshot of the globals replaced by this suite, restored on teardown. */
const original = {
  window: globalThis.window,
  document: globalThis.document,
  screen: globalThis.screen,
  navigator: globalThis.navigator,
  navigatorDescriptor: Object.getOwnPropertyDescriptor(globalThis, 'navigator'),
};

/**
 * (Re)installs the browser globals, reusing the same object instances so the
 * modules that captured them keep working.
 * @returns {Record<string, any>} The window stub.
 */
const installGlobals = () => {
  // Reuse the existing window object (if any) instead of replacing it: other
  // suites hold a reference to it and would break otherwise.
  const windowStub =
    typeof globalThis.window === 'object' && globalThis.window !== null ? globalThis.window : {};

  Object.assign(windowStub, {
    document: documentStub,
    getComputedStyle: () => ['-webkit-transform'],
    addEventListener: () => {},
    removeEventListener: () => {},
    innerWidth: 1920,
    innerHeight: 1080,
  });

  documentStub.fullscreenElement = null;
  documentStub.documentElement = { requestFullscreen: async () => {} };
  documentStub.addEventListener = () => {};
  documentStub.removeEventListener = () => {};
  documentStub.exitFullscreen = async () => {};

  globalThis.window = windowStub;
  globalThis.document = documentStub;
  globalThis.screen = { width: 1920, height: 1080 };
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36' },
    configurable: true,
    writable: true,
  });

  return windowStub;
};

/** Restores the globals replaced by {@link installGlobals}. */
const restoreGlobals = () => {
  if (original.window === undefined) delete globalThis.window;
  else globalThis.window = original.window;

  if (original.document === undefined) delete globalThis.document;
  else globalThis.document = original.document;

  if (original.screen === undefined) delete globalThis.screen;
  else globalThis.screen = original.screen;

  if (original.navigatorDescriptor) {
    Object.defineProperty(globalThis, 'navigator', original.navigatorDescriptor);
  } else if (original.navigator === undefined) {
    delete globalThis.navigator;
  } else {
    globalThis.navigator = original.navigator;
  }
};

const windowStub = installGlobals();

// A cache-busting query guarantees a fresh module instance: `browserDetector`
// caches `window` at evaluation time and other suites may have imported it
// already with a different stub.
const cacheBust = `?basicsBrowser=${Date.now()}`;

const {
  isBrowser,
  isBrowserAgent,
  getBrowserCssPrefix,
  getDuckTyping,
  getBrowserPings,
  browserIs,
} = await import(`../../dist/v1/basics/browserDetector.mjs${cacheBust}`);

const {
  documentIsFullScreen,
  isScreenFilled,
  isFullScreenMode,
  requestFullScreen,
  exitFullScreen,
  onFullScreenChange,
  offFullScreenChange,
} = await import(`../../dist/v1/basics/fullScreen.mjs${cacheBust}`);

/**
 * Node.js port of the browser detector + fullscreen test environments.
 * @returns {Promise<number>}
 */
const testBasicsBrowser = async () => {
  installGlobals();
  const t = new TestRunner('basics/browserDetector');

  try {
    // ---------------------------------------------------------------
    // isBrowser / isBrowserAgent
    // ---------------------------------------------------------------
    section('browserDetector - environment', '🌐');
    t.equal(isBrowser(), true, 'isBrowser detects the browser globals');
    t.equal(isBrowserAgent(), 'chrome', 'isBrowserAgent parses the user agent');

    const originalAgent = navigator.userAgent;
    navigator.userAgent = 'Mozilla/5.0 Firefox/121.0';
    t.equal(isBrowserAgent(), 'firefox', 'Detects Firefox');
    navigator.userAgent = 'Mozilla/5.0 (compatible; MSIE 10.0)';
    t.equal(isBrowserAgent(), 'ie', 'Detects Internet Explorer');
    navigator.userAgent = 'Mozilla/5.0 Edge/18.0';
    t.equal(isBrowserAgent(), 'edge', 'Detects Edge');
    navigator.userAgent = 'Mozilla/5.0 Safari/605.1.15';
    t.equal(isBrowserAgent(), 'safari', 'Detects Safari');
    navigator.userAgent = 'Mozilla/5.0 Opera/9.80';
    t.equal(isBrowserAgent(), 'opera', 'Detects Opera');
    navigator.userAgent = 'Mozilla/5.0 YaBrowser/23.0';
    t.equal(isBrowserAgent(), 'yandex', 'Detects Yandex');
    navigator.userAgent = 'curl/8.0.0';
    t.equal(isBrowserAgent(), 'other', 'Falls back to other');
    navigator.userAgent = originalAgent;

    // ---------------------------------------------------------------
    // CSS prefix + duck typing
    // ---------------------------------------------------------------
    section('browserDetector - css prefix', '🎨');
    windowStub.getComputedStyle = () => ['-webkit-transform'];
    t.equal(getBrowserCssPrefix(), 'webkit', 'Detects the webkit prefix');

    windowStub.getComputedStyle = () => ['-moz-appearance'];
    t.equal(getBrowserCssPrefix(), 'gecko', 'Detects the gecko prefix');

    windowStub.getComputedStyle = () => ['-ms-transform'];
    t.equal(getBrowserCssPrefix(), 'trident', 'Detects the trident prefix');

    windowStub.getComputedStyle = () => [];
    t.equal(getBrowserCssPrefix(), 'other', 'Falls back to other');

    section('browserDetector - duck typing', '🦆');
    const duck = getDuckTyping();
    t.equal(typeof duck.isOpera, 'boolean', 'Exposes isOpera');
    t.equal(typeof duck.isFirefox, 'boolean', 'Exposes isFirefox');
    t.equal(typeof duck.isSafari, 'boolean', 'Exposes isSafari');
    t.equal(typeof duck.isIE, 'boolean', 'Exposes isIE');
    t.equal(typeof duck.isEdge, 'boolean', 'Exposes isEdge');
    t.equal(typeof duck.isChrome, 'boolean', 'Exposes isChrome');
    t.equal(typeof duck.isBlink, 'boolean', 'Exposes isBlink');

    // ---------------------------------------------------------------
    // Pings
    // ---------------------------------------------------------------
    section('browserDetector - pings', '📊');
    windowStub.getComputedStyle = () => ['-webkit-transform'];
    navigator.userAgent = 'Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36';

    const pings = getBrowserPings();
    t.equal(typeof pings.chrome, 'number', 'Returns a ping map');
    t.equal(pings.chrome >= 1, true, 'Chrome accumulates at least one ping');
    t.equal(browserIs(), 'chrome', 'browserIs resolves the winner');

    const disabled = getBrowserPings(['chrome', 'safari', 'opera', 'edge']);
    t.equal(disabled.safari, 0, 'Honours the disable list');
    t.throws(() => getBrowserPings('nope'), 'Rejects a non-array disable list');
    t.throws(() => getBrowserPings(['nope']), 'Rejects unknown browser names');

    // ---------------------------------------------------------------
    // Fullscreen
    // ---------------------------------------------------------------
    const f = new TestRunner('basics/fullScreen');
    section('fullScreen - detection', '🖥️');
    f.equal(documentIsFullScreen(), false, 'Starts outside of fullscreen');
    f.equal(isScreenFilled(), true, 'Detects a filled screen');
    f.equal(isFullScreenMode(), true, 'isFullScreenMode combines both checks');

    windowStub.innerWidth = 800;
    windowStub.innerHeight = 600;
    f.equal(isScreenFilled(), false, 'Detects a windowed screen');
    f.equal(isFullScreenMode(), false, 'isFullScreenMode is false when windowed');

    documentStub.fullscreenElement = {};
    f.equal(documentIsFullScreen(), true, 'Detects the fullscreen element');
    documentStub.fullscreenElement = null;

    section('fullScreen - requests', '⛶');
    let requested = false;
    documentStub.documentElement.requestFullscreen = async () => {
      requested = true;
    };
    await requestFullScreen();
    f.equal(requested, true, 'requestFullScreen calls the native API');

    let exited = false;
    documentStub.exitFullscreen = async () => {
      exited = true;
    };
    await exitFullScreen();
    f.equal(exited, true, 'exitFullScreen calls the native API');

    section('fullScreen - listeners', '📡');
    const added = [];
    const removed = [];
    documentStub.addEventListener = (type) => added.push(type);
    documentStub.removeEventListener = (type) => removed.push(type);

    const handler = () => {};
    onFullScreenChange(handler);
    f.equal(added.length, 4, 'onFullScreenChange subscribes to every vendor event');
    offFullScreenChange(handler);
    f.equal(removed.length, 4, 'offFullScreenChange unsubscribes from every vendor event');

    console.log(`\n${color('gray', 'basics/browser test-suite finished.')}`);

    return t.summary() + f.summary();
  } finally {
    // Never leak the stubs into the sibling suites.
    restoreGlobals();
  }
};

export default testBasicsBrowser;
