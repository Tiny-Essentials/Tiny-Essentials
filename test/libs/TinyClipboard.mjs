import { TestRunner, section, color } from './_helpers.mjs';

/**
 * Node.js port of the browser based TinyClipboard test environment
 * (`test/html/text/TinyClipboard`).
 *
 * The Clipboard API is polyfilled before the module is imported so the class
 * can be exercised outside of a real browser.
 *
 * @returns {Promise<void>}
 */

// ---------------------------------------------------------------------------
// Minimal Clipboard API polyfill
// ---------------------------------------------------------------------------
class ClipboardItem {
  constructor(types) {
    this.types = Object.keys(types);
    this._data = types;
  }
  async getType(type) {
    return this._data[type];
  }
}

/** @type {any[]} */
let clipboardItems = [];

const clipboard = {
  async writeText() {},
  async write() {},
  async read() {
    return clipboardItems;
  },
};

const setupEnvironment = () => {
  globalThis.ClipboardItem = ClipboardItem;
  // Preserve any pre-existing navigator properties (e.g. userAgent) so that
  // sibling modules relying on them (browserDetector) keep working.
  const previous =
    typeof globalThis.navigator === 'object' && globalThis.navigator !== null
      ? globalThis.navigator
      : {};
  Object.defineProperty(globalThis, 'navigator', {
    value: { ...previous, clipboard },
    configurable: true,
    writable: true,
  });
  globalThis.document = { execCommand: () => true, body: { append() {}, remove() {} } };
};

setupEnvironment();

const { default: TinyClipboard } = await import('../../dist/v1/libs/text/TinyClipboard.mjs');

/**
 * Node.js port of the browser TinyClipboard test environment.
 * @returns {Promise<number>}
 */
const testTinyClipboard = async () => {
  // Re-apply the polyfill: sibling test modules may have replaced the globals.
  setupEnvironment();

  const t = new TestRunner('TinyClipboard');

  // -------------------------------------------------------------------
  // Capability detection
  // -------------------------------------------------------------------
  section('TinyClipboard - capabilities', '📋');
  const clipboardApi = new TinyClipboard();
  t.equal(clipboardApi.isNavigatorClipboardAvailable(), true, 'Detects the Clipboard API');
  t.equal(clipboardApi.isExecCommandAvailable(), true, 'Detects the execCommand fallback');
  t.equal(typeof clipboardApi.getCopyTextFunc(), 'function', 'Exposes a text copy function');
  t.equal(typeof clipboardApi.getCopyBlobFunc(), 'function', 'Exposes a blob copy function');

  // -------------------------------------------------------------------
  // Copy overrides
  // -------------------------------------------------------------------
  section('TinyClipboard - overrides', '📝');
  let copiedText = null;
  clipboardApi.setCopyText(async (text) => {
    copiedText = text;
  });
  await clipboardApi.copyText('hello');
  t.equal(copiedText, 'hello', 'setCopyText overrides the text handler');
  t.throws(() => clipboardApi.setCopyText('nope'), 'setCopyText validates the callback');
  t.throws(() => clipboardApi.copyText(42), 'copyText validates the input type');

  let copiedBlob = null;
  clipboardApi.setCopyBlob(async (blob) => {
    copiedBlob = blob;
  });
  const blob = new Blob(['data'], { type: 'text/plain' });
  await clipboardApi.copyBlob(blob);
  t.equal(copiedBlob, blob, 'setCopyBlob overrides the blob handler');
  t.throws(() => clipboardApi.setCopyBlob('nope'), 'setCopyBlob validates the callback');
  t.throws(() => clipboardApi.copyBlob('nope'), 'copyBlob validates the input type');

  // -------------------------------------------------------------------
  // Reading
  // -------------------------------------------------------------------
  section('TinyClipboard - reading', '📖');
  clipboardItems = [
    new ClipboardItem({ 'text/plain': new Blob(['hello world'], { type: 'text/plain' }) }),
  ];
  t.equal(await clipboardApi.readText(0), 'hello world', 'readText returns the clipboard text');
  t.equal((await clipboardApi.readAllTexts()).length, 1, 'readAllTexts returns every entry');
  t.equal((await clipboardApi.readAll()).length, 1, 'readAll returns every item');
  t.ok((await clipboardApi.readIndex(0)) instanceof ClipboardItem, 'readIndex returns an item');
  t.equal(await clipboardApi.readIndex(99), null, 'readIndex returns null when missing');

  clipboardItems = [new ClipboardItem({ 'image/png': new Blob(['x'], { type: 'image/png' }) })];
  const custom = await clipboardApi.readCustom('image/');
  t.ok(custom instanceof Blob, 'readCustom returns a Blob');
  t.equal((await clipboardApi.readAllCustom('image/')).length, 1, 'readAllCustom returns blobs');
  t.equal(
    (await clipboardApi.readAllData('custom', 'image/')).length,
    1,
    'readAllData returns data',
  );

  console.log(`\n${color('gray', 'TinyClipboard test-suite finished.')}`);

  return t.summary();
};

export default testTinyClipboard;
