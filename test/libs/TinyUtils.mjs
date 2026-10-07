/**
 * Node.js port of the browser based utils test environments
 * (`test/html/utils/*`).
 *
 * Covers:
 * - TinyCloner (plugin based deep cloning)
 * - TinyThrottledApi (concurrency limited API wrapper)
 */

import { TestRunner, section, color, sleep } from './_helpers.mjs';

const { default: TinyCloner } = await import('../../dist/v1/libs/utils/TinyCloner.mjs');
const { default: TinyThrottledApi } = await import('../../dist/v1/libs/utils/TinyThrottledApi.mjs');

/**
 * Node.js port of the browser utils test environments.
 * @returns {Promise<number>}
 */
const testUtils = async () => {
  const t = new TestRunner('TinyCloner');

  // -------------------------------------------------------------------
  // TinyCloner
  // -------------------------------------------------------------------
  section('TinyCloner - primitives & objects', '🧬');
  t.equal(TinyCloner.clone(42), 42, 'Clones primitives');
  t.equal(TinyCloner.clone('hello'), 'hello', 'Clones strings');
  t.equal(TinyCloner.clone(null), null, 'Clones null');

  const source = { a: 1, nested: { b: 2 } };
  const clone = TinyCloner.clone(source);
  t.deepEqual(clone, source, 'Clones a plain object');
  t.ok(clone !== source, 'Returns a new object');
  t.ok(clone.nested !== source.nested, 'Performs a deep clone');

  section('TinyCloner - built-in types', '📦');
  const date = new Date('2024-01-02T03:04:05.000Z');
  const dateClone = TinyCloner.clone(date);
  t.equal(dateClone instanceof Date, true, 'Clones Date instances');
  t.equal(dateClone.getTime(), date.getTime(), 'Keeps the Date value');
  t.ok(dateClone !== date, 'Date clone is a new instance');

  const arr = [1, [2, 3], { a: 4 }];
  const arrClone = TinyCloner.clone(arr);
  t.deepEqual(arrClone, arr, 'Clones nested arrays');
  t.ok(arrClone !== arr && arrClone[1] !== arr[1], 'Array clone is deep');

  section('TinyCloner - plugin registry', '🔌');
  const size = TinyCloner.size;
  t.ok(size > 0, 'Ships with default plugins');
  t.ok(Array.isArray(TinyCloner.ids), 'Exposes plugin ids');
  t.throws(
    () => TinyCloner.addPlugin({ id: 'x' }),
    'Rejects plugins without the required interface',
  );
  t.throws(() => TinyCloner.hasPlugin(5), 'hasPlugin validates the id type');

  const instance = new TinyCloner({ isolationMode: true });
  t.equal(instance.isolationMode, true, 'Honours the isolation mode flag');
  t.throws(() => new TinyCloner({ isolationMode: 'yes' }), 'Validates the isolation mode type');

  // -------------------------------------------------------------------
  // TinyThrottledApi
  // -------------------------------------------------------------------
  const a = new TestRunner('TinyThrottledApi');
  section('TinyThrottledApi - execution', '🚦');

  let active = 0;
  let maxActive = 0;
  const api = new TinyThrottledApi(2, async (value) => {
    active++;
    maxActive = Math.max(maxActive, active);
    await sleep(15);
    active--;
    return value * 2;
  });

  const results = await Promise.all([api.exec(1), api.exec(2), api.exec(3), api.exec(4)]);
  a.deepEqual(results, [2, 4, 6, 8], 'Resolves every queued request');
  a.ok(maxActive <= 2, 'Never exceeds the concurrency limit');
  a.equal(api.concurrencyLimit, 2, 'Exposes the concurrency limit');
  a.equal(api.activeCount, 0, 'Releases every slot when done');

  section('TinyThrottledApi - configuration', '⚙️');
  api.concurrencyLimit = 5;
  a.equal(api.concurrencyLimit, 5, 'Allows updating the concurrency limit');
  a.throws(() => (api.concurrencyLimit = 0), 'Rejects an invalid concurrency limit');

  api.timeoutValue = 50;
  a.equal(api.timeoutValue, 50, 'Allows updating the timeout value');
  a.throws(() => (api.timeoutValue = -1), 'Rejects a negative timeout value');

  a.throws(
    () => new TinyThrottledApi(0, async () => {}),
    'Rejects a non-positive concurrency limit',
  );
  a.throws(() => new TinyThrottledApi(1, 'nope'), 'Rejects a non-function API');

  api.destroy();
  a.equal(api.isDestroyed, true, 'destroy marks the instance as destroyed');
  a.throws(() => api.activeCount, 'Throws after being destroyed');

  console.log(`\n${color('gray', 'Utils test-suite finished.')}`);

  return t.summary() + a.summary();
};

export default testUtils;
