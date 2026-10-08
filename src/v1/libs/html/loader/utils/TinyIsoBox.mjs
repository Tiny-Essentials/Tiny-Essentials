/**
 * @fileoverview ISO base media file format (ISO/IEC 14496-12) box utilities.
 * Shared by the image and video probes, since HEIC, AVIF, MP4 and MOV all
 * use the same box tree.
 */
import { TinyNeedMoreData } from './TinyBufferReader.mjs';

/**
 * A parsed ISO BMFF box header.
 * @typedef {Object} IsoBox
 * @property {string} type - The 4-character box type.
 * @property {number} start - The offset of the first header byte.
 * @property {number} dataStart - The offset of the first payload byte.
 * @property {number} dataEnd - The offset after the last payload byte.
 * @property {number} end - The offset after the box.
 */

/**
 * The boxes whose payload is a plain list of child boxes.
 * @type {ReadonlySet<string>}
 */
const CONTAINERS = new Set([
  'moov',
  'trak',
  'mdia',
  'minf',
  'stbl',
  'edts',
  'dinf',
  'udta',
  'mvex',
  'moof',
  'traf',
  'iprp',
  'ipco',
  'mfra',
  'skip',
  'jxl ',
]);

/**
 * The boxes that start with a 4-byte version/flag field before their children.
 * @type {ReadonlySet<string>}
 */
const FULL_BOX_CONTAINERS = new Set(['meta']);

/**
 * Reads the header of the box that starts at the current offset.
 * @param {import('./TinyBufferReader.mjs').default} reader - The cursor.
 * @param {number} end - The offset after the last readable byte.
 * @returns {IsoBox} The parsed box header.
 * @throws {TinyNeedMoreData} If the header or the payload is truncated.
 */
export function readBox(reader, end) {
  const start = reader.offset;
  const size = reader.uint32();
  const type = reader.ascii(4);
  let headerSize = 8;
  let total = size;
  if (size === 1) {
    total = reader.uint64();
    headerSize = 16;
  } else if (size === 0) {
    total = end - start;
  }
  if (total < headerSize || start + total > end) {
    throw new TinyNeedMoreData();
  }
  return {
    type,
    start,
    dataStart: start + headerSize,
    dataEnd: start + total,
    end: start + total,
  };
}

/**
 * Iterates over the sibling boxes in the `[start, end)` range.
 * @param {import('./TinyBufferReader.mjs').default} reader - The cursor.
 * @param {number} start - The offset of the first box.
 * @param {number} end - The offset after the last box.
 * @yields {IsoBox} Every complete box found in the range.
 */
export function* boxes(reader, start, end) {
  let cursor = start;
  while (cursor + 8 <= end) {
    reader.seek(cursor);
    const box = readBox(reader, end);
    yield box;
    cursor = box.end;
  }
}

/**
 * Recursively searches for the first box whose type is in `types`.
 * @param {import('./TinyBufferReader.mjs').default} reader - The cursor.
 * @param {number} start - The offset of the first box.
 * @param {number} end - The offset after the last box.
 * @param {ReadonlySet<string>} types - The box types to match.
 * @param {number} [depth] - The current recursion depth.
 * @returns {IsoBox|null} The matching box, or null when it is not present.
 */
export function findBox(reader, start, end, types, depth = 0) {
  if (depth > 8) {
    return null;
  }
  for (const box of boxes(reader, start, end)) {
    if (types.has(box.type)) {
      return box;
    }
    if (CONTAINERS.has(box.type) || FULL_BOX_CONTAINERS.has(box.type)) {
      const skip = FULL_BOX_CONTAINERS.has(box.type) ? 4 : 0;
      const found = findBox(reader, box.dataStart + skip, box.dataEnd, types, depth + 1);
      if (found) {
        return found;
      }
    }
  }
  return null;
}
