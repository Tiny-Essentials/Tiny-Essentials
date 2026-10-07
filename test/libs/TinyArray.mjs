import TinyArrayComparator from '../../dist/v1/libs/array/TinyArrayComparator.mjs';
import TinyArrayPaginator from '../../dist/v1/libs/array/TinyArrayPaginator.mjs';
import { TestRunner, section, color } from './_helpers.mjs';

/**
 * Node.js port of the browser based array test environments
 * (`test/html/array/*`).
 *
 * Covers:
 * - TinyArrayComparator (add / remove / edit + deep diff)
 * - TinyArrayPaginator (paging, filtering and metadata)
 *
 * @returns {Promise<void>}
 */
const testArray = async () => {
  const t = new TestRunner('TinyArrayComparator');

  // ---------------------------------------------------------------------
  // TinyArrayComparator - identity based comparison
  // ---------------------------------------------------------------------
  section('TinyArrayComparator - identity comparison', '📦');
  const oldArray = [
    { id: 1, name: 'Apple', price: 10 },
    { id: 2, name: 'Banana', price: 5 },
    { id: 3, name: 'Cherry', price: 20 },
  ];
  const newArray = [
    { id: 1, name: 'Apple', price: 10 },
    { id: 2, name: 'Banana', price: 7 },
    { id: 4, name: 'Date', price: 15 },
  ];

  const comparator = new TinyArrayComparator(oldArray, { idKey: 'id' });
  const results = comparator.compare(newArray);

  const added = results.filter((r) => r.status === 'added').map((r) => r.item);
  const deleted = results.filter((r) => r.status === 'deleted').map((r) => r.item);
  const edited = results.filter((r) => r.status === 'edited');

  t.equal(added.length, 1, 'Detects one added item');
  t.equal(added[0].id, 4, 'Added item is the expected one');
  t.equal(deleted.length, 1, 'Detects one deleted item');
  t.equal(deleted[0].id, 3, 'Deleted item is the expected one');
  t.equal(edited.length, 1, 'Detects one edited item');
  t.equal(edited[0].item.id, 2, 'Edited item is the expected one');
  t.equal(edited[0].details.modified.price.oldValue, 5, 'Deep diff reports old price');
  t.equal(edited[0].details.modified.price.newValue, 7, 'Deep diff reports new price');

  // ---------------------------------------------------------------------
  // TinyArrayComparator - hash mode (no idKey)
  // ---------------------------------------------------------------------
  section('TinyArrayComparator - hash mode', '🔐');
  const hashComparator = new TinyArrayComparator([1, 2, 3]);
  const hashResults = hashComparator.compare([2, 3, 4]);
  t.equal(hashResults.filter((r) => r.status === 'added').length, 1, 'Hash mode detects additions');
  t.equal(
    hashResults.filter((r) => r.status === 'deleted').length,
    1,
    'Hash mode detects deletions',
  );

  // ---------------------------------------------------------------------
  // TinyArrayComparator - validation
  // ---------------------------------------------------------------------
  section('TinyArrayComparator - validation', '🛡️');
  t.throws(() => new TinyArrayComparator([], {}).compare('nope'), 'compare() rejects non-arrays');
  t.equal(
    TinyArrayComparator.generateHash({ a: 1 }),
    TinyArrayComparator.generateHash({ a: 1 }),
    'generateHash is deterministic',
  );

  // ---------------------------------------------------------------------
  // TinyArrayPaginator
  // ---------------------------------------------------------------------
  const p = new TestRunner('TinyArrayPaginator');
  const dataset = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    group: i % 2 === 0 ? 'A' : 'B',
  }));
  const paginator = new TinyArrayPaginator(dataset);

  section('TinyArrayPaginator - pagination', '📄');
  const firstPage = paginator.get({ page: 1, perPage: 10 });
  p.equal(firstPage.items.length, 10, 'Respects perPage');
  p.equal(firstPage.totalItems, 50, 'Reports total items');
  p.equal(firstPage.totalPages, 5, 'Reports total pages');
  p.equal(firstPage.hasPrev, false, 'First page has no previous');
  p.equal(firstPage.hasNext, true, 'First page has next');

  const lastPage = paginator.get({ page: 5, perPage: 10 });
  p.equal(lastPage.hasNext, false, 'Last page has no next');
  p.equal(lastPage.hasPrev, true, 'Last page has previous');

  const overflow = paginator.get({ page: 999, perPage: 10 });
  p.equal(overflow.page, 5, 'Clamps page to the last available page');

  section('TinyArrayPaginator - filtering', '🔎');
  const filtered = paginator.get({ page: 1, perPage: 100, filter: { group: 'A' } });
  p.equal(filtered.totalItems, 25, 'Object filter narrows the dataset');
  p.ok(
    filtered.items.every((i) => i.group === 'A'),
    'Object filter returns only matching items',
  );

  const fnFiltered = paginator.get({ page: 1, perPage: 100, filter: (item) => item.id <= 5 });
  p.equal(fnFiltered.totalItems, 5, 'Function filter narrows the dataset');

  const regexFiltered = paginator.get({ page: 1, perPage: 100, filter: { name: /User 1$/ } });
  p.equal(regexFiltered.totalItems, 1, 'RegExp filter works');

  section('TinyArrayPaginator - validation', '🛡️');
  p.throws(() => paginator.get({ page: 0, perPage: 10 }), 'Rejects invalid page');
  p.throws(() => paginator.get({ page: 1, perPage: 0 }), 'Rejects invalid perPage');
  p.throws(() => new TinyArrayPaginator('nope'), 'Rejects non-array data');

  console.log(`\n${color('gray', 'Array test-suite finished.')}`);

  return t.summary() + p.summary();
};

export default testArray;
