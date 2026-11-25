/*
 * Node.js port of the browser based TinyUserActivationDetector test
 * environment.
 *
 * `navigator.userActivation` does not exist in Node, so a tiny stub is
 * installed before the module is imported. The stub is also used to simulate
 * the moment the visitor finally interacts with the page.
 */

import { TestRunner, section, color, sleep } from './_helpers.mjs';

/**
 * Installs a `navigator` stub with a controllable user activation flag.
 *
 * `userAgent` is required because `TinyDebugger` (the base class) runs the
 * browser detector while being constructed.
 *
 * @param {boolean} [hasBeenActive=false] - Initial activation state.
 * @returns {void}
 */
const installNavigator = (hasBeenActive = false) => {
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'node', userActivation: { hasBeenActive } },
    configurable: true,
    writable: true,
  });
};

/**
 * Simulates the visitor interacting with the page.
 * @returns {void}
 */
const activateUser = () => {
  globalThis.navigator.userActivation.hasBeenActive = true;
};

installNavigator(false);

const { default: TinyUserActivationDetector } =
  await import('../../dist/v1/libs/utils/TinyUserActivationDetector.mjs');

/**
 * Exercises the TinyUserActivationDetector queue, polling and lifecycle.
 * @returns {Promise<number>}
 */
const testUserActivation = async () => {
  const t = new TestRunner('TinyUserActivationDetector');

  // -------------------------------------------------------------------
  // Static helper
  // -------------------------------------------------------------------
  section('TinyUserActivationDetector - static helper', '🔎');
  installNavigator(false);
  t.equal(
    TinyUserActivationDetector.hasUserActivation(),
    false,
    'Reports no activation before any gesture',
  );
  activateUser();
  t.equal(
    TinyUserActivationDetector.hasUserActivation(),
    true,
    'Reads the sticky navigator.userActivation flag',
  );

  // -------------------------------------------------------------------
  // Construction & initial state
  // -------------------------------------------------------------------
  section('TinyUserActivationDetector - initial state', '🧱');
  installNavigator(false);
  const detector = new TinyUserActivationDetector();
  t.equal(detector.unlocked, false, 'Starts locked when there is no activation');
  t.equal(detector.size, 0, 'Starts with an empty queue');
  t.equal(detector.autoKey, 0, 'Starts the automatic key counter at zero');
  t.equal(detector.existsTime, false, 'Does not poll before the first request');

  // -------------------------------------------------------------------
  // Queueing
  // -------------------------------------------------------------------
  section('TinyUserActivationDetector - queue', '🗂️');
  const calls = [];
  const firstKey = detector.whenReady(() => calls.push('a'), 'first');
  t.equal(firstKey, 'first', 'Returns the provided key');
  t.equal(detector.size, 1, 'Queues the callback');
  t.equal(detector.existsTime, true, 'Starts polling the activation');

  detector.whenReady(() => calls.push('a2'), 'first');
  t.equal(detector.size, 1, 'Replaces a pending callback with the same key');

  detector.whenReady(() => calls.push('b'));
  t.equal(detector.size, 2, 'Generates an automatic key when none is given');
  t.equal(detector.autoKey, 1, 'Counts the generated automatic keys');

  t.equal(detector.whenReady('nope'), '', 'Ignores callbacks that are not functions');
  t.equal(detector.size, 2, 'Does not queue invalid callbacks');

  detector.cancel('first');
  t.equal(detector.size, 1, 'cancel() discards a single request');

  detector.clear();
  t.equal(detector.size, 0, 'clear() empties the queue');
  t.equal(detector.existsTime, false, 'clear() stops polling');
  t.equal(detector.autoKey, 1, 'clear() preserves the automatic key counter');

  // -------------------------------------------------------------------
  // Unlock & flush
  // -------------------------------------------------------------------
  section('TinyUserActivationDetector - unlock', '🔓');
  const order = [];
  detector.whenReady(() => order.push(1), 'one');
  detector.whenReady(() => {
    throw new Error('boom');
  }, 'broken');
  detector.whenReady(() => order.push(3), 'three');
  t.equal(detector.size, 3, 'Queues every request while locked');

  detector.unlock();
  t.equal(detector.unlocked, true, 'unlock() flips the unlocked flag');
  t.equal(detector.size, 0, 'unlock() flushes the queue');
  t.deepEqual(order, [1, 3], 'Runs the callbacks in order and survives a throwing one');
  t.equal(detector.existsTime, false, 'Stops polling after the unlock');

  detector.unlock();
  t.equal(detector.unlocked, true, 'unlock() is idempotent');

  // -------------------------------------------------------------------
  // Requests after the unlock
  // -------------------------------------------------------------------
  section('TinyUserActivationDetector - after unlock', '⚡');
  let ran = 0;
  const afterKey = detector.whenReady(() => ran++);
  t.equal(ran, 1, 'Runs the callback immediately when already unlocked');
  t.equal(afterKey, '', 'Returns an empty key for immediate callbacks');
  t.equal(detector.size, 0, 'Does not queue anything when already unlocked');

  // -------------------------------------------------------------------
  // Polling
  // -------------------------------------------------------------------
  section('TinyUserActivationDetector - polling', '⏱️');
  installNavigator(false);
  const polled = new TinyUserActivationDetector();
  let polledRuns = 0;
  polled.whenReady(() => polledRuns++, 'polled');
  t.equal(polledRuns, 0, 'Waits for the user activation');

  activateUser();
  await sleep(250);
  t.equal(polledRuns, 1, 'Flushes the queue once the activation is detected');
  t.equal(polled.unlocked, true, 'Marks the instance as unlocked after polling');

  // -------------------------------------------------------------------
  // Reset
  // -------------------------------------------------------------------
  section('TinyUserActivationDetector - reset', '♻️');
  installNavigator(false);
  const resettable = new TinyUserActivationDetector();
  resettable.whenReady(() => {}, 'a');
  resettable.whenReady(() => {});
  resettable.reset();
  t.equal(resettable.size, 0, 'reset() empties the queue');
  t.equal(resettable.autoKey, 0, 'reset() restores the automatic key counter');
  t.equal(resettable.existsTime, false, 'reset() stops polling');

  console.log(`\n${color('gray', 'TinyUserActivationDetector test-suite finished.')}`);

  return t.summary();
};

export default testUserActivation;
