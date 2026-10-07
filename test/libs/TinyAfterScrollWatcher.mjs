/**
 * Node.js port of the browser based TinyAfterScrollWatcher test environment
 * (`test/html/html/scroll/TinyAfterScrollWatcher`).
 *
 * A minimal `Element`/`Window` polyfill is installed before the module is
 * imported so the watcher can be exercised outside of a real browser.
 *
 * @returns {Promise<number>}
 */

import { TestRunner, section, color, sleep } from './_helpers.mjs';

// ---------------------------------------------------------------------------
// Minimal DOM polyfill (must exist before the module is imported)
// ---------------------------------------------------------------------------
class Element {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
  }
  addEventListener(type, handler) {
    if (!this._listeners.has(type)) this._listeners.set(type, new Set());
    this._listeners.get(type).add(handler);
  }
  removeEventListener(type, handler) {
    this._listeners.get(type)?.delete(handler);
  }
  dispatch(type, event = {}) {
    for (const handler of this._listeners.get(type) ?? []) handler({ type, ...event });
  }
  get listenerCount() {
    let total = 0;
    for (const set of this._listeners.values()) total += set.size;
    return total;
  }
}

class Window extends Element {}

/**
 * (Re)installs the DOM polyfill. Sibling test modules (e.g. the shared DOM
 * helper) replace these globals, so it is re-applied before every use.
 */
const installDom = () => {
  globalThis.Element = Element;
  globalThis.Window = Window;
};

installDom();

const { default: TinyAfterScrollWatcher } =
  await import('../../dist/v1/libs/html/scroll/TinyAfterScrollWatcher.mjs');

/**
 * Node.js port of the browser TinyAfterScrollWatcher test environment.
 * @returns {Promise<number>}
 */
const testAfterScrollWatcher = async () => {
  // Re-apply the polyfill: sibling test modules may have replaced the globals.
  installDom();

  const t = new TestRunner('TinyAfterScrollWatcher');

  // -------------------------------------------------------------------
  // Construction & validation
  // -------------------------------------------------------------------
  section('TinyAfterScrollWatcher - construction', '🖱️');
  const target = new Element();
  const watcher = new TinyAfterScrollWatcher(target, 10);
  t.equal(watcher.scrollTarget, target, 'Stores the scroll target');
  t.equal(watcher.inactivityTime, 10, 'Stores the inactivity time');
  t.equal(watcher.destroyed, false, 'Starts alive');
  t.throws(() => new TinyAfterScrollWatcher({}), 'Rejects invalid scroll targets');

  // -------------------------------------------------------------------
  // Queue execution after scroll stops
  // -------------------------------------------------------------------
  section('TinyAfterScrollWatcher - queue', '⏳');
  let executed = 0;
  watcher.doAfterScroll(() => executed++);
  t.equal(watcher.afterScrollQueueSize, 1, 'Queues the callback');
  t.throws(() => watcher.doAfterScroll('nope'), 'doAfterScroll validates the callback');

  target.dispatch('scroll');
  await sleep(30);
  t.equal(executed, 1, 'Runs the queued callback after scrolling stops');
  t.equal(watcher.afterScrollQueueSize, 0, 'Empties the queue after running');

  // -------------------------------------------------------------------
  // onStop / offStop
  // -------------------------------------------------------------------
  section('TinyAfterScrollWatcher - onStop', '🛑');
  let stopped = 0;
  const onStop = () => stopped++;
  watcher.onStop(onStop);
  target.dispatch('scroll');
  await sleep(30);
  t.equal(stopped, 1, 'Calls onStop listeners after scrolling stops');

  watcher.offStop(onStop);
  target.dispatch('scroll');
  await sleep(30);
  t.equal(stopped, 1, 'offStop removes the listener');
  t.throws(() => watcher.onStop('nope'), 'onStop validates the callback');
  t.throws(() => watcher.offStop('nope'), 'offStop validates the callback');

  // -------------------------------------------------------------------
  // External scroll listeners
  // -------------------------------------------------------------------
  section('TinyAfterScrollWatcher - scroll listeners', '📡');
  let scrolled = 0;
  const onScroll = () => scrolled++;
  watcher.onScroll(onScroll);
  target.dispatch('scroll');
  t.equal(scrolled, 1, 'Forwards scroll events to external listeners');
  watcher.offScroll(onScroll);
  target.dispatch('scroll');
  t.equal(scrolled, 1, 'offScroll removes the external listener');
  t.throws(() => watcher.onScroll('nope'), 'onScroll validates the callback');

  // -------------------------------------------------------------------
  // inactivityTime setter
  // -------------------------------------------------------------------
  section('TinyAfterScrollWatcher - inactivityTime', '⏱️');
  watcher.inactivityTime = 50;
  t.equal(watcher.inactivityTime, 50, 'Allows updating the inactivity time');
  t.throws(() => (watcher.inactivityTime = -1), 'Rejects a negative inactivity time');

  // -------------------------------------------------------------------
  // destroy
  // -------------------------------------------------------------------
  section('TinyAfterScrollWatcher - destroy', '💥');
  watcher.destroy();
  t.equal(watcher.destroyed, true, 'Marks the instance as destroyed');
  t.throws(() => watcher.onStop(() => {}), 'Throws after being destroyed');

  console.log(`\n${color('gray', 'TinyAfterScrollWatcher test-suite finished.')}`);

  return t.summary();
};

export default testAfterScrollWatcher;
