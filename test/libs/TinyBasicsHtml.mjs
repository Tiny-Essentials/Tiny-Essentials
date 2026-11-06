import { TestRunner, section, color } from './_helpers.mjs';
import { installDOM, TinyElement } from './_dom.mjs';

/**
 * Node.js port of the browser based test environment for
 * `src/v1/basics/html.mjs` (`test/html/basics/html`).
 *
 * The DOM/FileReader/fetch globals required by the module are polyfilled
 * before the module is imported so it can run outside of a real browser.
 *
 * @returns {Promise<number>}
 */

// ---------------------------------------------------------------------------
// Minimal browser polyfill (must exist before the import below)
// ---------------------------------------------------------------------------
class FakeFileReader {
  constructor() {
    this.result = null;
    this.error = null;
    this.onload = null;
    this.onerror = null;
  }
  readAsText(blob) {
    blob.text().then((text) => {
      this.result = text;
      this.onload?.();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buffer) => {
      const base64 = Buffer.from(buffer).toString('base64');
      this.result = `data:${blob.type || 'application/octet-stream'};base64,${base64}`;
      this.onload?.();
    });
  }
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onload?.();
    });
  }
  readAsBinaryString(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = Buffer.from(buffer).toString('binary');
      this.onload?.();
    });
  }
}

globalThis.FileReader = FakeFileReader;
globalThis.URL.createObjectURL = () => 'blob:mock';
globalThis.URL.revokeObjectURL = () => {};

/** @type {{ href: string, download: string }[]} */
const createdLinks = [];

/**
 * Builds the `document` stub used by `saveJsonFile`.
 * @returns {Record<string, any>}
 */
const createDocumentStub = () => ({
  body: {},
  createElement: () => {
    const link = {
      href: '',
      download: '',
      click() {
        createdLinks.push({ href: link.href, download: link.download });
      },
    };
    return link;
  },
});

globalThis.document = createDocumentStub();

const {
  readFileBlob,
  readBase64Blob,
  readJsonBlob,
  saveJsonFile,
  trackFetchProgress,
  fetchJson,
  fetchBlob,
  fetchText,
  loadImage,
  installWindowHiddenScript,
} = await import('../../dist/v1/basics/html.mjs');

/**
 * Builds a JSON `Response` stub.
 * @param {unknown} payload - The payload to serialize.
 * @param {string} [type] - The content type.
 * @returns {Response}
 */
const jsonResponse = (payload, type = 'application/json') =>
  new Response(JSON.stringify(payload), { headers: { 'content-type': type } });

/**
 * Node.js port of the browser html helper test environment.
 * @returns {Promise<number>}
 */
const testBasicsHtml = async () => {
  const t = new TestRunner('basics/html');

  // -------------------------------------------------------------------
  // readFileBlob
  // -------------------------------------------------------------------
  section('html - readFileBlob', '📄');
  const textBlob = new Blob(['hello world'], { type: 'text/plain' });
  t.equal(await readFileBlob(textBlob, 'readAsText'), 'hello world', 'Reads a blob as text');
  await t.throwsAsync(() => readFileBlob('nope', 'readAsText'), 'Rejects a non-Blob input');
  await t.throwsAsync(() => readFileBlob(textBlob, 'nope'), 'Rejects an invalid method');

  // -------------------------------------------------------------------
  // readBase64Blob
  // -------------------------------------------------------------------
  section('html - readBase64Blob', '🔐');
  const base64 = await readBase64Blob(textBlob);
  t.equal(base64, Buffer.from('hello world').toString('base64'), 'Returns the raw base64');
  const dataUrl = await readBase64Blob(textBlob, true);
  t.equal(dataUrl.startsWith('data:text/plain;base64,'), true, 'Returns a data URL');
  const customMime = await readBase64Blob(textBlob, 'image/png');
  t.equal(customMime.startsWith('data:image/png;base64,'), true, 'Honours a custom MIME type');
  await t.throwsAsync(() => readBase64Blob('nope'), 'Rejects a non-Blob input');
  await t.throwsAsync(() => readBase64Blob(textBlob, 5), 'Rejects an invalid isDataUrl');

  // -------------------------------------------------------------------
  // readJsonBlob
  // -------------------------------------------------------------------
  section('html - readJsonBlob', '🧾');
  const jsonBlob = new Blob(['{"a":1}'], { type: 'application/json' });
  t.deepEqual(await readJsonBlob(jsonBlob), { a: 1 }, 'Parses a JSON blob');
  await t.throwsAsync(
    () => readJsonBlob(new Blob(['   '], { type: 'application/json' })),
    'Rejects an empty file',
  );
  await t.throwsAsync(() => readJsonBlob(new Blob(['nope'])), 'Rejects invalid JSON');
  await t.throwsAsync(() => readJsonBlob('nope'), 'Rejects a non-Blob input');

  // -------------------------------------------------------------------
  // saveJsonFile
  // -------------------------------------------------------------------
  section('html - saveJsonFile', '💾');
  // Re-install the document stub: sibling suites replace `globalThis.document`.
  globalThis.document = createDocumentStub();
  saveJsonFile('test.json', { a: 1 });
  t.equal(createdLinks.length, 1, 'Triggers a download');
  t.equal(createdLinks[0].download, 'test.json', 'Uses the provided filename');
  t.throws(() => saveJsonFile(5, {}), 'Rejects a non-string filename');
  t.throws(() => saveJsonFile('a.json', {}, -1), 'Rejects an invalid spacing');

  // -------------------------------------------------------------------
  // trackFetchProgress
  // -------------------------------------------------------------------
  section('html - trackFetchProgress', '📶');
  const progress = [];
  const tracked = trackFetchProgress(jsonResponse({ ok: true }), (loaded, total) =>
    progress.push({ loaded, total }),
  );
  t.equal(tracked instanceof Response, true, 'Returns a Response');
  await tracked.json();
  t.equal(progress.length > 0, true, 'Reports the progress');
  t.throws(() => trackFetchProgress('nope', () => {}), 'Rejects a non-Response');
  t.throws(() => trackFetchProgress(jsonResponse({}), 'nope'), 'Rejects a non-function callback');

  // -------------------------------------------------------------------
  // fetchJson / fetchBlob / fetchText
  // -------------------------------------------------------------------
  section('html - fetch helpers', '🌐');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).endsWith('.json')) return jsonResponse({ hello: 'world' });
    if (String(url).endsWith('.txt')) {
      return new Response('plain text', { headers: { 'content-type': 'text/plain' } });
    }
    return new Response('binary', { headers: { 'content-type': 'application/octet-stream' } });
  };

  t.deepEqual(await fetchJson('https://example.com/a.json'), { hello: 'world' }, 'fetchJson parses');
  await t.throwsAsync(() => fetchJson(5), 'fetchJson rejects a non-string url');
  await t.throwsAsync(() => fetchJson('https://example.com/a.json', 5), 'Rejects bad options');
  await t.throwsAsync(() => fetchJson('https://example.com/a.json', {}, 5), 'Rejects bad onProgress');

  const text = await fetchText('https://example.com/a.txt');
  t.equal(text, 'plain text', 'fetchText returns the body');
  await t.throwsAsync(
    () => fetchText('https://example.com/a.txt', ['image/']),
    'fetchText blocks a MIME type',
  );
  await t.throwsAsync(() => fetchText(5), 'fetchText rejects a non-string url');

  const blob = await fetchBlob('https://example.com/a.bin');
  t.ok(blob instanceof Blob, 'fetchBlob returns a Blob');
  await t.throwsAsync(() => fetchBlob(5), 'fetchBlob rejects a non-string url');
  await t.throwsAsync(
    () => fetchBlob('https://example.com/a.bin', 'nope'),
    'fetchBlob rejects a non-array mime list',
  );

  globalThis.fetch = originalFetch;

  // -------------------------------------------------------------------
  // loadImage
  // -------------------------------------------------------------------
  section('html - loadImage', '🖼️');
  class FakeImage {
    constructor() {
      this.width = 10;
      this.height = 20;
      this.naturalWidth = 10;
      this.naturalHeight = 20;
    }
    set src(value) {
      this._src = value;
      setTimeout(() => this.onloadstart?.({ type: 'loadstart' }), 0);
      setTimeout(() => this.onload?.({ type: 'load' }), 1);
    }
    get src() {
      return this._src;
    }
  }
  globalThis.Image = FakeImage;

  const result = await loadImage({ url: 'https://example.com/a.png' });
  t.equal(result.isSuccess, true, 'Resolves a successful load');
  t.equal(result.status, 'loaded', 'Reports the loaded status');
  t.equal(result.dimensions.naturalWidth, 10, 'Exposes the dimensions');
  await t.throwsAsync(() => loadImage(null), 'Rejects a non-object options argument');
  await t.throwsAsync(() => loadImage({ url: 5 }), 'Rejects a non-string url');
  await t.throwsAsync(
    () => loadImage({ url: 'https://example.com/a.png', crossOrigin: 5 }),
    'Rejects a non-string crossOrigin',
  );
  await t.throwsAsync(
    () => loadImage({ url: 'https://example.com/a.png', onLoading: 5 }),
    'Rejects a non-function onLoading',
  );

  // -------------------------------------------------------------------
  // installWindowHiddenScript
  // -------------------------------------------------------------------
  section('html - installWindowHiddenScript', '👁️');
  const { document: domDocument } = installDOM();
  const element = new TinyElement('div');
  domDocument.body.appendChild(element);

  const uninstall = installWindowHiddenScript({ element });
  t.equal(typeof uninstall, 'function', 'Returns an uninstall function');
  uninstall();
  t.throws(() => installWindowHiddenScript(null), 'Rejects a null settings object');
  t.throws(
    () => installWindowHiddenScript({ element: {} }),
    'Rejects an element that is not an Element',
  );

  console.log(`\n${color('gray', 'basics/html test-suite finished.')}`);

  return t.summary();
};

export default testBasicsHtml;
