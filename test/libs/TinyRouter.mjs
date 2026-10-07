/**
 * Node.js port of the browser based router test environment
 * (`test/html/router/TinyRouter`).
 *
 * Covers:
 * - TinyRouter (route registration, history import/export, validation)
 *
 * A minimal `window` polyfill is installed before importing the module so the
 * router can be exercised outside of a real browser.
 */

import { TestRunner, section, color } from './_helpers.mjs';

// ---------------------------------------------------------------------------
// Minimal browser polyfill (must exist before importing TinyRouter)
// ---------------------------------------------------------------------------
if (typeof globalThis.window === 'undefined') {
  globalThis.window = globalThis;
}
if (!globalThis.window.location) {
  globalThis.window.location = { pathname: '/', search: '', href: 'http://localhost/' };
}
if (typeof globalThis.window.addEventListener !== 'function') {
  globalThis.window.addEventListener = () => {};
  globalThis.window.removeEventListener = () => {};
}
if (!globalThis.window.history) {
  globalThis.window.history = { pushState() {}, go() {} };
}

const { default: TinyRouter } = await import('../../dist/v1/libs/router/TinyRouter.mjs');

/**
 * Node.js port of the browser router test environment.
 * @returns {Promise<number>}
 */
const testRouter = async () => {
  const t = new TestRunner('TinyRouter');

  // -------------------------------------------------------------------
  // Route registration
  // -------------------------------------------------------------------
  section('TinyRouter - registration', '🧭');
  const router = new TinyRouter();
  router.add('/home', () => {});
  router.add('/user/:id', () => {});

  t.equal(router.size, 2, 'Tracks the amount of routes');
  t.deepEqual(router.routes, ['/home', '/user/:id'], 'Exposes the registered patterns');
  t.equal(router.has('/home'), true, 'has() finds a registered route');
  t.equal(router.has('/missing'), false, 'has() is false for unknown routes');
  t.throws(() => router.add('/home', () => {}), 'Rejects duplicate routes');
  t.throws(() => router.add(42, () => {}), 'Rejects an invalid pattern type');
  t.throws(() => router.add('/x', 'nope'), 'Rejects a non-function callback');

  router.remove('/home');
  t.equal(router.has('/home'), false, 'remove() deletes a route');
  t.equal(router.size, 1, 'Removing updates the size');

  // -------------------------------------------------------------------
  // History import / export
  // -------------------------------------------------------------------
  section('TinyRouter - history', '📜');
  const history = [
    { path: '/a', timestamp: 1 },
    { path: '/b', timestamp: 2 },
  ];
  router.history = history;
  t.deepEqual(router.history, history, 'Imports a history log');
  t.throws(() => (router.history = 'nope'), 'Rejects a non-array history');
  t.throws(
    () => (router.history = [{ path: '/a' }]),
    'Rejects history entries without a timestamp',
  );

  // -------------------------------------------------------------------
  // Options & lifecycle
  // -------------------------------------------------------------------
  section('TinyRouter - options', '⚙️');
  t.equal(router.started, false, 'Starts in the stopped state');
  t.equal(router.detectHistoryChange, true, 'Enables history detection by default');
  router.detectHistoryChange = false;
  t.equal(router.detectHistoryChange, false, 'Allows toggling history detection');
  t.throws(() => (router.detectHistoryChange = 'nope'), 'Validates the history flag type');
  t.throws(() => new TinyRouter({ historyLimit: -5 }), 'Validates the history limit');
  t.throws(() => new TinyRouter({ onRouteChanged: 'nope' }), 'Validates the route callback');

  router.destroy();
  t.equal(router.isDestroyed, true, 'destroy marks the instance as destroyed');
  t.throws(() => router.has('/user/:id'), 'Throws after being destroyed');

  console.log(`\n${color('gray', 'Router test-suite finished.')}`);

  return t.summary();
};

export default testRouter;
