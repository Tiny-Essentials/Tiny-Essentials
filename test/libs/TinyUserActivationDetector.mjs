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
  // pollInterval accessors
  // -------------------------------------------------------------------
  section('TinyUserActivationDetector - pollInterval', '⏱️');
  const defaultInterval = TinyUserActivationDetector.pollInterval;
  t.equal(defaultInterval, 100, 'Exposes the default polling interval');

  TinyUserActivationDetector.pollInterval = 250;
  t.equal(TinyUserActivationDetector.pollInterval, 250, 'Accepts a new polling interval');
  t.throws(() => (TinyUserActivationDetector.pollInterval = 0), 'Rejects a zero polling interval');
  t.throws(
    () => (TinyUserActivationDetector.pollInterval = -10),
    'Rejects a negative polling interval',
  );
  t.throws(
    () => (TinyUserActivationDetector.pollInterval = '100'),
    'Rejects a non-numeric polling interval',
  );
  t.throws(
    () => (TinyUserActivationDetector.pollInterval = NaN),
    'Rejects a non-finite polling interval',
  );
  t.equal(
    TinyUserActivationDetector.pollInterval,
    250,
    'Keeps the previous value after a rejected assignment',
  );
  TinyUserActivationDetector.pollInterval = defaultInterval;

  // -------------------------------------------------------------------
  // Constructor validation
  // -------------------------------------------------------------------
  section('TinyUserActivationDetector - constructor validation', '🛡️');
  t.throws(() => new TinyUserActivationDetector(null), 'Rejects a null options object');
  t.throws(() => new TinyUserActivationDetector('nope'), 'Rejects a non-object options value');
  t.throws(() => new TinyUserActivationDetector([]), 'Rejects an array of options');
  t.throws(
    () => new TinyUserActivationDetector({ debugMode: 'yes' }),
    'Rejects a non-boolean debugMode',
  );
  t.throws(
    () => new TinyUserActivationDetector({ useLogColors: 1 }),
    'Rejects a non-boolean useLogColors',
  );
  t.throws(
    () => new TinyUserActivationDetector({ logger: 'console' }),
    'Rejects a non-object logger',
  );

  // -------------------------------------------------------------------
  // Initial state
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

  t.throws(() => detector.whenReady('nope'), 'Rejects callbacks that are not functions');
  t.throws(() => detector.whenReady(() => {}, 42), 'Rejects a non-string key');
  t.throws(() => detector.whenReady(() => {}, ''), 'Rejects an empty key');
  t.equal(detector.size, 2, 'Does not queue invalid requests');

  detector.cancel('first');
  t.equal(detector.size, 1, 'cancel() discards a single request');
  t.throws(() => detector.cancel(42), 'cancel() rejects a non-string key');

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
  detector.whenReady(() => order.push(2), 'two');
  detector.whenReady(() => order.push(3), 'three');
  t.equal(detector.size, 3, 'Queues every request while locked');

  detector.unlock();
  t.equal(detector.unlocked, true, 'unlock() flips the unlocked flag');
  t.equal(detector.size, 0, 'unlock() flushes the queue');
  t.deepEqual(order, [1, 2, 3], 'Runs the callbacks in order');
  t.equal(detector.existsTime, false, 'Stops polling after the unlock');

  detector.unlock();
  t.equal(detector.unlocked, true, 'unlock() is idempotent');

  // -------------------------------------------------------------------
  // Errors are never swallowed
  // -------------------------------------------------------------------
  section('TinyUserActivationDetector - error propagation', '💥');
  installNavigator(false);
  const thrower = new TinyUserActivationDetector();
  const ran = [];
  thrower.whenReady(() => ran.push('before'), 'a');
  thrower.whenReady(() => {
    throw new Error('boom');
  }, 'b');
  thrower.whenReady(() => ran.push('after'), 'c');

  let single;
  try {
    thrower.unlock();
  } catch (err) {
    single = err;
  }
  t.equal(single?.message, 'boom', 'Rethrows the error of a failing callback');
  t.deepEqual(ran, ['before', 'after'], 'Still runs the remaining callbacks');
  t.equal(thrower.size, 0, 'Empties the queue even when a callback throws');

  installNavigator(false);
  const multi = new TinyUserActivationDetector();
  multi.whenReady(() => {
    throw new Error('one');
  }, 'a');
  multi.whenReady(() => {
    throw new Error('two');
  }, 'b');

  let aggregate;
  try {
    multi.unlock();
  } catch (err) {
    aggregate = err;
  }
  t.equal(
    aggregate instanceof AggregateError,
    true,
    'Wraps multiple failures in an AggregateError',
  );
  t.equal(aggregate?.errors.length, 2, 'Keeps every failure in the AggregateError');

  // -------------------------------------------------------------------
  // Requests after the unlock
  // -------------------------------------------------------------------
  section('TinyUserActivationDetector - after unlock', '⚡');
  let immediate = 0;
  const afterKey = detector.whenReady(() => immediate++);
  t.equal(immediate, 1, 'Runs the callback immediately when already unlocked');
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
