/**
 * Node.js port of the browser based TinyPushRouter test environment
 * (`test/sw/TinyPushRouter.test.mjs`).
 *
 * Covers:
 * - TinyPushRouter registration (on / onMatch / use / otherwise / catch)
 * - TinyPushRouter.dispatch (guards, fallthrough, fallback and errors)
 *
 * @returns {Promise<number>}
 */

import { TestRunner, section, color } from './_helpers.mjs';

const { default: TinyPushRouter } =
  await import('../../dist/v1/libs/sw/service/TinyPushRouter.mjs');

/**
 * Node.js port of the browser TinyPushRouter test environment.
 * @returns {Promise<number>}
 */
const testPushRouter = async () => {
  const t = new TestRunner('TinyPushRouter');

  // -------------------------------------------------------------------
  // Registration
  // -------------------------------------------------------------------
  section('TinyPushRouter - registration', '🧭');
  const router = new TinyPushRouter();
  t.throws(() => router.on('', () => {}), 'on() rejects an empty type');
  t.throws(() => router.on('a', null), 'on() rejects a non-function handler');
  t.throws(() => router.onMatch('a', () => {}), 'onMatch() rejects a non-RegExp pattern');
  t.throws(() => router.use(null), 'use() rejects a non-function guard');
  t.throws(() => router.otherwise(null), 'otherwise() rejects a non-function handler');
  t.throws(() => router.catch(null), 'catch() rejects a non-function handler');

  const registry = new TinyPushRouter();
  registry.on('a', () => {});
  registry.onMatch(/^b/, () => {});
  t.equal(registry.size, 2, 'Tracks the registered handlers');
  t.equal(registry.has('a'), true, 'has() finds an exact handler');
  t.equal(registry.has('b1'), true, 'has() finds a pattern handler');
  t.equal(registry.has('c'), false, 'has() is false for unknown types');

  // -------------------------------------------------------------------
  // dispatch
  // -------------------------------------------------------------------
  section('TinyPushRouter - dispatch', '🚦');
  const invalid = new TinyPushRouter();
  t.equal(
    await invalid
      .dispatch(null, {})
      .then(() => false)
      .catch(() => true),
    true,
    'dispatch() rejects a null message',
  );
  t.equal(
    await invalid
      .dispatch({ type: 'a' }, null)
      .then(() => false)
      .catch(() => true),
    true,
    'dispatch() rejects a null context',
  );

  let called = 0;
  const exact = new TinyPushRouter();
  exact.on('a', () => {
    called += 1;
  });
  t.equal(await exact.dispatch({ type: 'a' }, {}), true, 'Runs the exact handler');
  t.equal(called, 1, 'Invokes the exact handler once');

  let guarded = 0;
  const guardedRouter = new TinyPushRouter();
  guardedRouter
    .use(() => false)
    .on('a', () => {
      guarded += 1;
    });
  t.equal(await guardedRouter.dispatch({ type: 'a' }, {}), true, 'A guard may drop the message');
  t.equal(guarded, 0, 'Dropped messages never reach the handler');

  const fallthrough = new TinyPushRouter();
  fallthrough.on('a', () => false);
  fallthrough.onMatch(/^a$/, () => {});
  t.equal(
    await fallthrough.dispatch({ type: 'a' }, {}),
    true,
    'Falls through when the handler returns false',
  );

  let fallback = false;
  const fallbackRouter = new TinyPushRouter();
  fallbackRouter.otherwise(() => {
    fallback = true;
  });
  t.equal(await fallbackRouter.dispatch({ type: 'z' }, {}), true, 'Uses the fallback handler');
  t.equal(fallback, true, 'Invokes the fallback handler');

  t.equal(
    await new TinyPushRouter().dispatch({ type: 'z' }, {}),
    false,
    'Returns false when nothing matches',
  );

  let captured = null;
  const errorRouter = new TinyPushRouter();
  errorRouter
    .on('a', () => {
      throw new Error('boom');
    })
    .catch((error) => {
      captured = error;
    });
  t.equal(
    await errorRouter.dispatch({ type: 'a' }, {}),
    true,
    'Routes errors to the catch handler',
  );
  t.equal(captured?.message, 'boom', 'Forwards the thrown error');

  const rethrow = new TinyPushRouter();
  rethrow.on('a', () => {
    throw new Error('boom');
  });
  t.equal(
    await rethrow
      .dispatch({ type: 'a' }, {})
      .then(() => false)
      .catch(() => true),
    true,
    'Rethrows when there is no catch handler',
  );

  console.log(`\n${color('gray', 'TinyPushRouter test-suite finished.')}`);

  return t.summary();
};

export default testPushRouter;
