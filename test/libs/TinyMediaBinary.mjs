import { TestRunner, section, color } from './_helpers.mjs';

/**
 * Node.js port of the browser based binary parsing test environments
 * (`test/html/html/loader/*`).
 *
 * Covers:
 * - TinyBufferReader (bounds-checked cursor)
 * - TinyIsoBox (ISO BMFF box traversal)
 * - TinyImageProbe (intrinsic dimension sniffing)
 *
 * @returns {Promise<number>}
 */

const { default: TinyBufferReader, TinyNeedMoreData } =
  await import('../../dist/v1/libs/html/loader/utils/TinyBufferReader.mjs');
const { readBox, boxes, findBox } =
  await import('../../dist/v1/libs/html/loader/utils/TinyIsoBox.mjs');
const { default: TinyImageProbe } =
  await import('../../dist/v1/libs/html/loader/probe/TinyImageProbe.mjs');

/**
 * Builds a 1x1 PNG header with the given dimensions.
 * @param {number} width - The image width.
 * @param {number} height - The image height.
 * @returns {Uint8Array} The PNG header.
 */
const pngHeader = (width, height) => {
  const bytes = new Uint8Array(33);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
};

/**
 * Builds a GIF header with the given dimensions.
 * @param {number} width - The image width.
 * @param {number} height - The image height.
 * @returns {Uint8Array} The GIF header.
 */
const gifHeader = (width, height) => {
  const bytes = new Uint8Array(32);
  bytes.set([0x47, 0x49, 0x46, 0x38, 0x39, 0x61], 0); // GIF89a
  const view = new DataView(bytes.buffer);
  view.setUint16(6, width, true);
  view.setUint16(8, height, true);
  return bytes;
};

/**
 * Builds a single ISO BMFF box.
 * @param {string} type - The 4-character box type.
 * @param {Uint8Array} [payload] - The box payload.
 * @returns {Uint8Array} The serialized box.
 */
const isoBox = (type, payload = new Uint8Array(0)) => {
  const bytes = new Uint8Array(8 + payload.length);
  new DataView(bytes.buffer).setUint32(0, bytes.length);
  for (let i = 0; i < 4; i += 1) bytes[4 + i] = type.charCodeAt(i);
  bytes.set(payload, 8);
  return bytes;
};

/**
 * Concatenates byte arrays.
 * @param {Uint8Array[]} chunks - The chunks to join.
 * @returns {Uint8Array} The concatenated bytes.
 */
const concat = (chunks) => {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
};

/**
 * Node.js port of the browser binary parsing test environment.
 * @returns {Promise<number>}
 */
const testMediaBinary = async () => {
  const t = new TestRunner('TinyBufferReader');

  // -------------------------------------------------------------------
  // TinyBufferReader
  // -------------------------------------------------------------------
  section('TinyBufferReader - construction', '🔢');
  const bytes = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
  const reader = new TinyBufferReader(bytes);
  t.equal(reader.offset, 0, 'Starts at offset 0');
  t.equal(reader.limit, 8, 'Exposes the limit');
  t.equal(reader.remaining, 8, 'Exposes the remaining bytes');
  t.equal(reader.eof, false, 'Does not start at EOF');
  t.equal(reader.buffer, bytes, 'Exposes the backing buffer');
  t.throws(() => new TinyBufferReader('nope'), 'Rejects a non Uint8Array');
  t.throws(() => new TinyBufferReader(bytes, -1), 'Rejects a negative offset');
  t.throws(() => new TinyBufferReader(bytes, 0, 99), 'Rejects an out of bounds limit');

  section('TinyBufferReader - reads', '📖');
  const r = new TinyBufferReader(new Uint8Array([0x12, 0x34, 0x56, 0x78]));
  t.equal(r.uint8(), 0x12, 'Reads an unsigned 8-bit integer');
  t.equal(r.uint8(), 0x34, 'Advances the cursor');
  r.seek(0);
  t.equal(r.uint16(), 0x1234, 'Reads an unsigned 16-bit big-endian integer');
  r.seek(0);
  t.equal(r.uint16le(), 0x3412, 'Reads an unsigned 16-bit little-endian integer');
  r.seek(0);
  t.equal(r.uint32(), 0x12345678, 'Reads an unsigned 32-bit big-endian integer');
  r.seek(0);
  t.equal(r.uint32le(), 0x78563412, 'Reads an unsigned 32-bit little-endian integer');
  r.seek(0);
  t.equal(r.uint24(), 0x123456, 'Reads an unsigned 24-bit integer');
  const wide = new TinyBufferReader(new Uint8Array([0, 0, 0, 0, 0, 0, 0x30, 0x39]));
  t.equal(wide.uint64(), 0x3039, 'Reads an unsigned 64-bit integer');
  t.throws(() => r.seek(-1), 'seek() rejects a negative position');

  section('TinyBufferReader - ascii & bytes', '🔤');
  const text = new TinyBufferReader(new Uint8Array([0x61, 0x62, 0x63, 0x64]));
  t.equal(text.ascii(2), 'ab', 'Reads an ASCII string');
  t.deepEqual(Array.from(text.bytes(2)), [0x63, 0x64], 'Reads a byte slice');
  t.throws(() => text.ascii(-1), 'ascii() rejects a negative length');
  t.throws(() => text.bytes(-1), 'bytes() rejects a negative length');

  section('TinyBufferReader - bounds', '🛡️');
  const bounded = new TinyBufferReader(new Uint8Array([1, 2]));
  t.equal(bounded.has(2), true, 'has() accepts a fitting read');
  t.equal(bounded.has(3), false, 'has() rejects an oversized read');
  t.throws(() => bounded.has('nope'), 'has() validates the count');
  t.throws(() => bounded.uint32(), 'Reading past the end throws TinyNeedMoreData');
  t.throws(() => bounded.skip(-1), 'skip() rejects a negative count');
  bounded.seek(0);
  bounded.skip(2);
  t.equal(bounded.eof, true, 'skip() moves the cursor to the end');
  t.ok(new TinyNeedMoreData() instanceof Error, 'TinyNeedMoreData extends Error');

  // -------------------------------------------------------------------
  // TinyIsoBox
  // -------------------------------------------------------------------
  const b = new TestRunner('TinyIsoBox');
  section('TinyIsoBox - readBox', '📦');
  const ftyp = isoBox('ftyp');
  const boxReader = new TinyBufferReader(ftyp);
  const box = readBox(boxReader, ftyp.length);
  b.equal(box.type, 'ftyp', 'Reads the box type');
  b.equal(box.start, 0, 'Reports the box start');
  b.equal(box.dataStart, 8, 'Reports the payload start');
  b.equal(box.end, 8, 'Reports the box end');

  section('TinyIsoBox - traversal', '🌳');
  const tree = concat([isoBox('ftyp'), isoBox('mdat', new Uint8Array([1, 2, 3, 4]))]);
  const treeReader = new TinyBufferReader(tree);
  const types = Array.from(boxes(treeReader, 0, tree.length), (item) => item.type);
  b.deepEqual(types, ['ftyp', 'mdat'], 'boxes() yields every sibling');

  const nested = concat([isoBox('moov', isoBox('trak', isoBox('mdia')))]);
  const nestedReader = new TinyBufferReader(nested);
  const found = findBox(nestedReader, 0, nested.length, new Set(['mdia']));
  b.equal(found?.type, 'mdia', 'findBox() walks into container boxes');
  b.equal(
    findBox(nestedReader, 0, nested.length, new Set(['zzzz'])),
    null,
    'findBox() is null when nothing matches',
  );

  // -------------------------------------------------------------------
  // TinyImageProbe
  // -------------------------------------------------------------------
  const p = new TestRunner('TinyImageProbe');
  section('TinyImageProbe - PNG', '🖼️');
  const pngProbe = new TinyImageProbe();
  const png = pngProbe.push(pngHeader(640, 480));
  p.deepEqual({ width: png?.width, height: png?.height }, { width: 640, height: 480 }, 'Reads PNG');

  section('TinyImageProbe - GIF', '🎞️');
  const gifProbe = new TinyImageProbe();
  const gif = gifProbe.push(gifHeader(32, 24));
  p.deepEqual({ width: gif?.width, height: gif?.height }, { width: 32, height: 24 }, 'Reads GIF');

  section('TinyImageProbe - validation', '🛡️');
  p.throws(() => new TinyImageProbe('', 0), 'Rejects an invalid maxBytes');
  const emptyProbe = new TinyImageProbe();
  p.throws(() => emptyProbe.push('nope'), 'push() validates the chunk');
  p.equal(
    emptyProbe.push(new Uint8Array([0, 1, 2])),
    null,
    'Returns null while the header is short',
  );
  emptyProbe.close();
  p.equal(emptyProbe.push(pngHeader(1, 1)), null, 'Stays closed after close()');
  p.equal(emptyProbe.finalize(), null, 'finalize() is null for a static image');

  console.log(`\n${color('gray', 'Media binary test-suite finished.')}`);

  return t.summary() + b.summary() + p.summary();
};

export default testMediaBinary;
