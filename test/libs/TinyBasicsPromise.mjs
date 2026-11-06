import { waitForTrue, createSingletonTask } from '../../dist/v1/basics/promiseUtils.mjs';
import { TestRunner, section, color, sleep } from './_helpers.mjs';

/**
 * Node.js port of the browser based promise helper test environment
 * (`test/html/basics/promiseUtils`).
 *
 * Covers `src/v1/basics/promiseUtils.mjs`:
 *
 * - waitForTrue
 * - createSingletonTask
 *
 * @returns {Promise<number>}
 */
const testBasicsPromise = async () => {
  const t = new TestRunner('basics/promiseUtils');

  // -------------------------------------------------------------------
  // waitForTrue
  // -------------------------------------------------------------------
  section('promiseUtils - waitForTrue', '⏳');
  let ready = false;
  const pending = waitForTrue(() => ready, 5);
  ready = true;
  await pending;
  t.ok(true, 'Resolves once the condition becomes true');

  t.throws(() => waitForTrue('nope'), 'Rejects a non-function getValue');
  t.throws(() => waitForTrue(() => true, 0), 'Rejects a non-positive interval');

  // -------------------------------------------------------------------
  // createSingletonTask - success
  // -------------------------------------------------------------------
  section('promiseUtils - createSingletonTask', '🔂');
  let calls = 0;
  const task = createSingletonTask(async (value) => {
    calls++;
    await sleep(10);
    return value * 2;
  });

  const [first, second] = await Promise.all([task.callback(2), task.callback(2)]);
  t.equal(first, 4, 'Resolves the base function result');
  t.equal(second, 4, 'Shares the in-flight promise');
  t.equal(calls, 1, 'Runs the base function only once');
  t.equal(task.isEnded(), true, 'isEnded is true after completion');
  t.equal(task.isFailed(), false, 'isFailed is false after success');
  t.equal(task.isLoading(), false, 'isLoading is false after completion');
  t.equal(task.getActivePromise(), null, 'Clears the active promise when autoReset is on');

  // -------------------------------------------------------------------
  // createSingletonTask - failure
  // -------------------------------------------------------------------
  section('promiseUtils - failures', '💥');
  const failing = createSingletonTask(async () => {
    throw new Error('boom');
  });

  let failed = false;
  await failing.callback().catch(() => (failed = true));
  t.equal(failed, true, 'Propagates the rejection');
  t.equal(failing.isFailed(), true, 'isFailed is true after a failure');

  // -------------------------------------------------------------------
  // createSingletonTask - manual reset
  // -------------------------------------------------------------------
  section('promiseUtils - manual reset', '🔄');
  let manualCalls = 0;
  const manual = createSingletonTask(async () => ++manualCalls, false);
  await manual.callback();
  await manual.callback();
  t.equal(manualCalls, 1, 'Keeps the lock when autoReset is off');
  t.ok(manual.getActivePromise() !== null, 'Keeps the active promise');
  manual.resetActivePromise();
  await manual.callback();
  t.equal(manualCalls, 2, 'resetActivePromise allows a new execution');

  t.throws(() => createSingletonTask('nope'), 'Rejects a non-function base function');

  console.log(`\n${color('gray', 'basics/promiseUtils test-suite finished.')}`);

  return t.summary();
};

export default testBasicsPromise;
