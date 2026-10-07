import { TestRunner, section, color } from './_helpers.mjs';

/**
 * Node.js port of the browser based TinyBrowserMonitor test environment
 * (`test/html/tools/TinyBrowserMonitor`).
 *
 * The browser globals required by the monitor are polyfilled before the module
 * is dynamically imported so it can run outside of a real browser.
 *
 * @returns {Promise<void>}
 */

// ---------------------------------------------------------------------------
// Minimal browser environment polyfill
// ---------------------------------------------------------------------------
const setupEnvironment = () => {
  const listeners = new Map();
  const addEventListener = (type, handler) => {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(handler);
  };
  const removeEventListener = (type, handler) => {
    listeners.get(type)?.delete(handler);
  };

  const screen = {
    width: 1920,
    height: 1080,
    availWidth: 1920,
    availHeight: 1040,
    colorDepth: 24,
    pixelDepth: 24,
    orientation: { type: 'landscape-primary' },
  };

  const windowStub = {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 2,
    screen,
    addEventListener,
    removeEventListener,
  };

  const navigatorStub = {
    onLine: true,
    deviceMemory: 8,
    hardwareConcurrency: 8,
    connection: {
      downlink: 10,
      rtt: 50,
      effectiveType: '4g',
      saveData: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    },
  };

  // Merge into any existing window stub so sibling test modules keep working.
  globalThis.window = Object.assign(globalThis.window || {}, windowStub);
  Object.defineProperty(globalThis, 'navigator', {
    value: navigatorStub,
    configurable: true,
    writable: true,
  });
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
  globalThis.PerformanceObserver = class {
    observe() {}
    disconnect() {}
  };
};

setupEnvironment();

const { default: TinyBrowserMonitor } =
  await import('../../dist/v1/libs/tools/TinyBrowserMonitor.mjs');

/**
 * Node.js port of the browser TinyBrowserMonitor test environment.
 * @returns {Promise<number>}
 */
const testTinyBrowserMonitor = async () => {
  // Re-apply the polyfill: sibling test modules may have replaced the globals.
  setupEnvironment();

  const t = new TestRunner('TinyBrowserMonitor');

  // -------------------------------------------------------------------
  // Construction & validation
  // -------------------------------------------------------------------
  section('TinyBrowserMonitor - construction', '🌐');
  const monitor = new TinyBrowserMonitor({ systems: ['connectivity', 'quality'] });
  t.ok(monitor instanceof TinyBrowserMonitor, 'Creates an instance');
  t.equal(monitor.has('connectivity'), true, 'Enables the requested systems');
  t.equal(monitor.has('battery'), false, 'Does not enable unrequested systems');
  t.equal(monitor.size, 2, 'Reports the amount of enabled systems');
  t.ok(Array.isArray(TinyBrowserMonitor.VALID_SYSTEMS), 'Exposes the valid systems list');
  t.throws(() => monitor.has(5), 'has() validates the system type');
  t.throws(
    () => new TinyBrowserMonitor({ systems: ['nope'] }),
    'Rejects invalid system identifiers',
  );
  t.throws(
    () => new TinyBrowserMonitor({ resourceLimit: -5 }),
    'Rejects an invalid resource limit',
  );
  t.throws(
    () => new TinyBrowserMonitor({ memoryIntervalMs: 1 }),
    'Rejects an invalid memory interval',
  );

  // -------------------------------------------------------------------
  // State accessors
  // -------------------------------------------------------------------
  section('TinyBrowserMonitor - state', '📡');
  t.equal(typeof monitor.connectivity.isOnline, 'boolean', 'Exposes the connectivity status');
  t.equal(typeof monitor.quality.downlink, 'number', 'Exposes the connection quality');
  t.ok(Array.isArray(monitor.resources), 'Exposes the resources list');
  t.ok(Array.isArray(monitor.enabledSystems), 'Exposes the enabled systems');
  t.equal(typeof monitor.windowMetrics.width, 'number', 'Exposes the window metrics');
  t.equal(typeof monitor.screenMetrics.width, 'number', 'Exposes the screen metrics');
  t.equal(typeof monitor.battery.level, 'number', 'Exposes the battery status');
  t.equal(typeof monitor.fps.fps, 'number', 'Exposes the FPS metrics');
  t.equal(typeof monitor.performance, 'object', 'Exposes the performance metrics');
  t.equal(typeof monitor.memoryUsage, 'object', 'Exposes the memory usage');

  // -------------------------------------------------------------------
  // Memory formatting
  // -------------------------------------------------------------------
  section('TinyBrowserMonitor - memory formatting', '🧠');
  const usage = { usedJSHeapSize: 1024, totalJSHeapSize: 2048, jsHeapSizeLimit: 4096 };
  t.deepEqual(
    monitor.getFormattedMemoryUsage('bytes', usage),
    { used: 1024, total: 2048, limit: 4096 },
    'Formats bytes',
  );
  t.deepEqual(
    monitor.getFormattedMemoryUsage('KB', usage),
    { used: 1, total: 2, limit: 4 },
    'Formats kilobytes',
  );
  t.throws(() => monitor.getFormattedMemoryUsage('TB', usage), 'Rejects invalid formats');
  t.throws(
    () => monitor.getFormattedMemoryUsage('KB', { usedJSHeapSize: 'x' }),
    'Rejects malformed memory usage',
  );

  // -------------------------------------------------------------------
  // Events & teardown
  // -------------------------------------------------------------------
  section('TinyBrowserMonitor - events & teardown', '🔔');
  let notified = 0;
  monitor.on('NetworkUpdated', () => notified++);
  t.equal(notified, 0, 'Starts without notifications');

  monitor.destroy();
  t.equal(monitor.isDestroyed, true, 'destroy marks the instance as destroyed');
  t.throws(() => monitor.connectivity, 'Accessors throw after destroy');
  t.equal(monitor.destroy(), undefined, 'destroy is idempotent');

  console.log(`\n${color('gray', 'TinyBrowserMonitor test-suite finished.')}`);

  return t.summary();
};

export default testTinyBrowserMonitor;
