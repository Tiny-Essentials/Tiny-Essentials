import {
  shuffleArray,
  multiplyArrayBlocks,
  diffArrayList,
  arraySortPositions,
} from '../../dist/v1/basics/array.mjs';
import { TestRunner, section, color } from './_helpers.mjs';

/**
 * Node.js port of the browser based array helper test environment
 * (`test/html/basics/array`).
 *
 * Covers `src/v1/basics/array.mjs`:
 *
 * - shuffleArray
 * - multiplyArrayBlocks
 * - diffArrayList
 * - arraySortPositions
 *
 * @returns {Promise<number>}
 */
const testBasicsArray = async () => {
  const t = new TestRunner('basics/array');

  // -------------------------------------------------------------------
  // shuffleArray
  // -------------------------------------------------------------------
  section('array - shuffleArray', '🔀');
  const source = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const shuffled = shuffleArray([...source]);
  t.equal(shuffled.length, source.length, 'Keeps the array length');
  t.deepEqual([...shuffled].sort((a, b) => a - b), source, 'Keeps every element');
  t.equal(shuffleArray([]).length, 0, 'Handles empty arrays');
  t.throws(() => shuffleArray('nope'), 'Rejects non-array input');

  // -------------------------------------------------------------------
  // multiplyArrayBlocks
  // -------------------------------------------------------------------
  section('array - multiplyArrayBlocks', '🧱');
  t.deepEqual(
    multiplyArrayBlocks(['a', 'b'], [2, 3]),
    ['a', 'a', 'b', 'b', 'b'],
    'Repeats each phase according to the counts',
  );
  t.deepEqual(multiplyArrayBlocks([], []), [], 'Handles empty input');
  t.deepEqual(multiplyArrayBlocks(['x'], [0]), [], 'Supports zero counts');
  t.throws(() => multiplyArrayBlocks('nope', []), 'Rejects a non-array phases argument');
  t.throws(() => multiplyArrayBlocks([], 'nope'), 'Rejects a non-array counts argument');
  t.throws(() => multiplyArrayBlocks(['a'], [1, 2]), 'Rejects mismatched lengths');
  t.throws(() => multiplyArrayBlocks(['a'], ['x']), 'Rejects non-numeric counts');

  // -------------------------------------------------------------------
  // diffArrayList
  // -------------------------------------------------------------------
  section('array - diffArrayList', '🔍');
  t.deepEqual(
    diffArrayList(['a', 'b', 'c'], ['b', 'c', 'd']),
    { added: ['d'], removed: ['a'] },
    'Detects added and removed items',
  );
  t.deepEqual(diffArrayList([], []), { added: [], removed: [] }, 'Handles empty arrays');
  t.throws(() => diffArrayList('nope', []), 'Rejects a non-array oldItems');
  t.throws(() => diffArrayList([], 'nope'), 'Rejects a non-array newItems');

  // -------------------------------------------------------------------
  // arraySortPositions
  // -------------------------------------------------------------------
  section('array - arraySortPositions', '↕️');
  const items = [{ pos: 3 }, { pos: 1 }, { pos: 2 }];
  t.deepEqual(
    [...items].sort(arraySortPositions('pos')).map((i) => i.pos),
    [1, 2, 3],
    'Sorts ascending by key',
  );
  t.deepEqual(
    [...items].sort(arraySortPositions('pos', true)).map((i) => i.pos),
    [3, 2, 1],
    'Sorts descending by key',
  );
  t.deepEqual(
    [10, 2, 33].sort(arraySortPositions(null)),
    [2, 10, 33],
    'Sorts primitives when no key is provided',
  );
  t.throws(() => arraySortPositions(5), 'Rejects a non-string key');
  t.throws(() => arraySortPositions('pos', 'nope'), 'Rejects a non-boolean isReverse');

  console.log(`\n${color('gray', 'basics/array test-suite finished.')}`);

  return t.summary();
};

export default testBasicsArray;
