import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import TinyPushRouter from '../../../src/v1/libs/sw/service/TinyPushRouter.mjs';

/** @returns {{ message: object, context: object }} */
const ctx = () => ({ message: { type: 'a' }, context: {} });

describe('TinyPushRouter registration', () => {
  test('validates the arguments', () => {
    const router = new TinyPushRouter();
    assert.throws(() => router.on('', () => {}), TypeError);
    assert.throws(() => router.on('a', null), TypeError);
    assert.throws(() => router.onMatch('a', () => {}), TypeError);
    assert.throws(() => router.use(null), TypeError);
    assert.throws(() => router.otherwise(null), TypeError);
    assert.throws(() => router.catch(null), TypeError);
  });

  test('tracks the registered handlers', () => {
    const router = new TinyPushRouter();
    router.on('a', () => {});
    router.onMatch(/^b/, () => {});
    assert.equal(router.size, 2);
    assert.equal(router.has('a'), true);
    assert.equal(router.has('b1'), true);
    assert.equal(router.has('c'), false);
  });
});

describe('TinyPushRouter.dispatch', () => {
  test('validates the arguments', async () => {
    const router = new TinyPushRouter();
    await assert.rejects(() => router.dispatch(null, {}), TypeError);
    await assert.rejects(() => router.dispatch({ type: 'a' }, null), TypeError);
  });

  test('runs the exact handler', async () => {
    const router = new TinyPushRouter();
    let called = 0;
    router.on('a', () => {
      called += 1;
    });
    assert.equal(await router.dispatch({ type: 'a' }, {}), true);
    assert.equal(called, 1);
  });

  test('drops the message when a guard returns false', async () => {
    const router = new TinyPushRouter();
    let called = 0;
    router
      .use(() => false)
      .on('a', () => {
        called += 1;
      });
    assert.equal(await router.dispatch({ type: 'a' }, {}), true);
    assert.equal(called, 0);
  });

  test('falls through when the handler returns false', async () => {
    const router = new TinyPushRouter();
    router.on('a', () => false);
    router.onMatch(/^a$/, () => {});
    assert.equal(await router.dispatch({ type: 'a' }, {}), true);
  });

  test('uses the fallback when nothing matches', async () => {
    const router = new TinyPushRouter();
    let fallback = false;
    router.otherwise(() => {
      fallback = true;
    });
    assert.equal(await router.dispatch({ type: 'z' }, {}), true);
    assert.equal(fallback, true);
  });

  test('returns false when nothing matches', async () => {
    assert.equal(await new TinyPushRouter().dispatch({ type: 'z' }, {}), false);
  });

  test('routes errors to the catch handler', async () => {
    const router = new TinyPushRouter();
    let captured = null;
    router
      .on('a', () => {
        throw new Error('boom');
      })
      .catch((error) => {
        captured = error;
      });
    assert.equal(await router.dispatch({ type: 'a' }, {}), true);
    assert.equal(captured.message, 'boom');
  });

  test('rethrows when there is no catch handler', async () => {
    const router = new TinyPushRouter();
    router.on('a', () => {
      throw new Error('boom');
    });
    await assert.rejects(() => router.dispatch({ type: 'a' }, {}), /boom/);
  });
});
