import {
  asyncReplace,
  toTitleCase,
  toTitleCaseLowerFirst,
  safeTextTrim,
  diffObjList,
  addAiMarkerShortcut,
} from '../../dist/v1/basics/text.mjs';
import { TestRunner, section, color } from './_helpers.mjs';

/**
 * Node.js port of the browser based text helper test environment
 * (`test/html/basics/text`).
 *
 * Covers `src/v1/basics/text.mjs`:
 *
 * - asyncReplace
 * - toTitleCase / toTitleCaseLowerFirst
 * - safeTextTrim
 * - diffObjList
 * - addAiMarkerShortcut
 *
 * @returns {Promise<number>}
 */
const testBasicsText = async () => {
  const t = new TestRunner('basics/text');

  // -------------------------------------------------------------------
  // asyncReplace
  // -------------------------------------------------------------------
  section('text - asyncReplace', '🔁');
  const replaced = await asyncReplace('Hello @a and @b', /@\w+/g, async (match) =>
    match.toUpperCase(),
  );
  t.equal(replaced, 'Hello @A and @B', 'Replaces every match asynchronously');
  t.equal(await asyncReplace('abc', /x/g, async () => 'y'), 'abc', 'Keeps the string when nothing matches');
  await t.throwsAsync(() => asyncReplace(5, /x/g, async () => ''), 'Rejects a non-string input');
  await t.throwsAsync(() => asyncReplace('a', 'x', async () => ''), 'Rejects a non-RegExp');
  await t.throwsAsync(() => asyncReplace('a', /a/g, 'nope'), 'Rejects a non-function callback');

  // -------------------------------------------------------------------
  // toTitleCase / toTitleCaseLowerFirst
  // -------------------------------------------------------------------
  section('text - title case', '🔤');
  t.equal(toTitleCase('hello world'), 'Hello World', 'toTitleCase capitalizes each word');
  t.equal(toTitleCase('HELLO'), 'Hello', 'toTitleCase lowercases the rest');
  t.throws(() => toTitleCase(5), 'toTitleCase validates the input');

  t.equal(toTitleCaseLowerFirst('hello world'), 'hello World', 'toTitleCaseLowerFirst lowercases the first letter');
  t.throws(() => toTitleCaseLowerFirst(5), 'toTitleCaseLowerFirst validates the input');

  // -------------------------------------------------------------------
  // safeTextTrim
  // -------------------------------------------------------------------
  section('text - safeTextTrim', '✂️');
  t.equal(safeTextTrim('short', 20), 'short', 'Keeps short strings untouched');
  t.equal(
    safeTextTrim('the quick brown fox jumps', 15),
    'the quick brown...',
    'Cuts on a word boundary',
  );
  t.equal(safeTextTrim('abcdefghij', 5), 'abcde...', 'Falls back to a hard cut');
  t.throws(() => safeTextTrim(5, 10), 'Rejects a non-string text');
  t.throws(() => safeTextTrim('a', 0), 'Rejects an invalid limit');
  t.throws(() => safeTextTrim('a', 1, 5), 'Rejects an invalid safeCutZone');

  // -------------------------------------------------------------------
  // diffObjList
  // -------------------------------------------------------------------
  section('text - diffObjList', '🧾');
  const diff = diffObjList({ a: 1, b: 2 }, { b: 3, c: 4 });
  t.deepEqual(diff.added, { c: 4 }, 'Detects added keys');
  t.deepEqual(diff.removed, { a: 1 }, 'Detects removed keys');
  t.deepEqual(diff.modified, { b: { old: 2, new: 3 } }, 'Detects modified keys');
  t.throws(() => diffObjList(null, {}), 'Rejects a null old object');
  t.throws(() => diffObjList({}, []), 'Rejects an array new object');

  // -------------------------------------------------------------------
  // addAiMarkerShortcut
  // -------------------------------------------------------------------
  section('text - addAiMarkerShortcut', '🤖');
  const listeners = [];
  const classes = new Set();
  globalThis.HTMLElement = class {};
  globalThis.document = {
    body: {
      classList: {
        toggle: (name) => (classes.has(name) ? classes.delete(name) : classes.add(name)),
      },
    },
    addEventListener: (type, handler) => listeners.push({ type, handler }),
  };

  const handler = addAiMarkerShortcut();
  t.equal(typeof handler, 'function', 'Returns the keydown handler');
  t.equal(listeners.length, 1, 'Registers a keydown listener');

  let prevented = false;
  handler({
    ctrlKey: true,
    altKey: true,
    key: 'a',
    preventDefault: () => (prevented = true),
  });
  t.equal(prevented, true, 'Prevents the default action');
  t.equal(classes.has('detect-made-by-ai'), true, 'Toggles the marker class');

  t.throws(() => addAiMarkerShortcut({ key: 5 }), 'Validates the key option');
  t.throws(() => addAiMarkerShortcut({ className: 5 }), 'Validates the className option');

  console.log(`\n${color('gray', 'basics/text test-suite finished.')}`);

  return t.summary();
};

export default testBasicsText;
