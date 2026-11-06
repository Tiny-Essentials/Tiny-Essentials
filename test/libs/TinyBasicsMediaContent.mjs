import { TestRunner, section, color } from './_helpers.mjs';

/**
 * Node.js port of the browser based media content test environment
 * (`test/html/basics/mediaContent`).
 *
 * Covers `src/v1/basics/mediaContent.mjs`:
 *
 * - getMediaContentBase / MediaLoadingError
 * - generateSimpleHash / convertToBlobUrl / revokeContentUrls
 * - valMediaContentMetadata / valFetchMediaContent
 * - parseMediaMetadata (argument validation + merge pipeline)
 *
 * @returns {Promise<number>}
 */

// ---------------------------------------------------------------------------
// Minimal browser polyfill (must exist before the import below)
// ---------------------------------------------------------------------------
class FakeMediaElement {
  constructor(src = '') {
    this.src = src;
    this.duration = 10;
    this.readyState = 1;
    this._listeners = new Map();
  }
  addEventListener(type, handler) {
    if (!this._listeners.has(type)) this._listeners.set(type, new Set());
    this._listeners.get(type).add(handler);
  }
  removeEventListener(type, handler) {
    this._listeners.get(type)?.delete(handler);
  }
}

globalThis.HTMLMediaElement = FakeMediaElement;
globalThis.Audio = class extends FakeMediaElement {};
globalThis.URL.createObjectURL = () => 'blob:mock';
globalThis.URL.revokeObjectURL = () => {};

const {
  getMediaContentBase,
  MediaLoadingError,
  generateSimpleHash,
  convertToBlobUrl,
  revokeContentUrls,
  valMediaContentMetadata,
  valFetchMediaContent,
  parseMediaMetadata,
} = await import('../../dist/v1/basics/mediaContent.mjs');

/**
 * Node.js port of the browser media content test environment.
 * @returns {Promise<number>}
 */
const testBasicsMediaContent = async () => {
  const t = new TestRunner('basics/mediaContent');

  // -------------------------------------------------------------------
  // getMediaContentBase
  // -------------------------------------------------------------------
  section('mediaContent - getMediaContentBase', '🎵');
  const base = getMediaContentBase();
  t.equal(base.id, '', 'Starts with an empty id');
  t.equal(base.duration, 0, 'Starts with no duration');
  t.equal(base.weight, 1, 'Defaults the weight to 1');
  t.ok(getMediaContentBase() !== base, 'Returns a new object every call');

  // -------------------------------------------------------------------
  // MediaLoadingError
  // -------------------------------------------------------------------
  section('mediaContent - MediaLoadingError', '🚨');
  const error = new MediaLoadingError('boom', 'https://example.com/a.mp3', 'ID3');
  t.equal(error.name, 'MediaLoadingError', 'Sets the error name');
  t.equal(error.url, 'https://example.com/a.mp3', 'Stores the url');
  t.equal(error.stage, 'ID3', 'Stores the stage');
  t.throws(() => new MediaLoadingError(5, 'url', 'ID3'), 'Validates the message');
  t.throws(() => new MediaLoadingError('msg', 5, 'ID3'), 'Validates the url');
  t.throws(() => new MediaLoadingError('msg', 'url', 5), 'Validates the stage');

  // -------------------------------------------------------------------
  // generateSimpleHash
  // -------------------------------------------------------------------
  section('mediaContent - generateSimpleHash', '🔐');
  const hash = await generateSimpleHash('hello');
  t.equal(typeof hash, 'string', 'Returns a string');
  t.equal(hash.length, 8, 'Returns 8 characters');
  t.equal(await generateSimpleHash('hello'), hash, 'Is deterministic');
  await t.throwsAsync(() => generateSimpleHash(5), 'Validates the input');

  // -------------------------------------------------------------------
  // convertToBlobUrl / revokeContentUrls
  // -------------------------------------------------------------------
  section('mediaContent - convertToBlobUrl', '🖼️');
  const blobUrl = convertToBlobUrl(new Uint8Array([1, 2, 3]), 'image/png');
  t.equal(blobUrl, 'blob:mock', 'Converts a Uint8Array into a blob url');
  t.equal(
    convertToBlobUrl('https://example.com/a.png'),
    'https://example.com/a.png',
    'Keeps a plain url',
  );
  t.throws(() => convertToBlobUrl(5), 'Rejects an invalid data type');
  t.throws(() => convertToBlobUrl(new Uint8Array(), 5), 'Rejects an invalid format');

  revokeContentUrls({ picture: [{ data: 'blob:mock' }] });
  t.ok(true, 'revokeContentUrls accepts a content object');
  t.throws(() => revokeContentUrls(null), 'revokeContentUrls validates the content');

  // -------------------------------------------------------------------
  // valMediaContentMetadata / valFetchMediaContent
  // -------------------------------------------------------------------
  section('mediaContent - validation', '✅');
  t.equal(valMediaContentMetadata({}), undefined, 'Accepts an empty metadata object');
  t.throws(
    () => valMediaContentMetadata({ title: 5 }),
    'Rejects a non-string title',
  );
  t.throws(
    () => valMediaContentMetadata({ genre: 'nope' }),
    'Rejects a non-array genre',
  );
  t.throws(
    () => valMediaContentMetadata({ picture: [{ format: 'image/png' }] }),
    'Rejects an invalid picture entry',
  );
  t.throws(() => valMediaContentMetadata(null), 'Rejects a null metadata object');

  t.equal(valFetchMediaContent(undefined), true, 'Accepts undefined fetch data');
  t.equal(
    valFetchMediaContent({ common: {}, native: {}, format: {}, quality: {} }),
    true,
    'Accepts a valid fetch data object',
  );
  t.equal(
    valFetchMediaContent({ common: {}, native: {}, format: {} }, true),
    false,
    'Returns false for an incomplete fetch data object',
  );

  // -------------------------------------------------------------------
  // parseMediaMetadata
  // -------------------------------------------------------------------
  section('mediaContent - parseMediaMetadata', '📼');
  await t.throwsAsync(
    () => parseMediaMetadata(5),
    'Rejects an invalid source',
  );
  await t.throwsAsync(
    () => parseMediaMetadata('https://example.com/a.mp3', null),
    'Rejects invalid default metadata',
  );
  await t.throwsAsync(
    () => parseMediaMetadata('https://example.com/a.mp3', {}, null),
    'Rejects invalid metadata',
  );
  await t.throwsAsync(
    () => parseMediaMetadata('https://example.com/a.mp3', {}, {}, 'nope'),
    'Rejects an invalid parseFile',
  );
  await t.throwsAsync(
    () => parseMediaMetadata('https://example.com/a.mp3', {}, {}, undefined, { onProgress: 5 }),
    'Rejects an invalid onProgress callback',
  );
  await t.throwsAsync(
    () => parseMediaMetadata('https://example.com/a.mp3', {}, {}, undefined, { onError: 5 }),
    'Rejects an invalid onError callback',
  );

  const progress = [];
  const track = await parseMediaMetadata(
    'https://example.com/song.mp3',
    { album: 'Default Album' },
    { title: 'Manual Title' },
    async () => {
      throw new Error('no id3');
    },
    { onProgress: (event) => progress.push(event) },
    true,
    'Unknown Artist',
  );

  t.equal(track.title, 'Manual Title', 'Manual metadata wins over the fallback');
  t.equal(track.artist, 'Unknown Artist', 'Uses the unknown artist fallback');
  t.equal(track.album, 'Default Album', 'Merges the default metadata');
  t.equal(track.duration, 10000, 'Reads the media duration in milliseconds');
  t.ok(progress.some((event) => event.stage === 'COMPLETE'), 'Emits the COMPLETE stage');

  console.log(`\n${color('gray', 'basics/mediaContent test-suite finished.')}`);

  return t.summary();
};

export default testBasicsMediaContent;
