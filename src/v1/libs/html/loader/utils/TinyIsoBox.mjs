/**
 * @fileoverview ISO base media file format (ISO/IEC 14496-12) box utilities.
 * Shared by the image and video probes, since HEIC, AVIF, MP4 and MOV all
 * use the same box tree.
 */
import { TinyNeedMoreData } from './TinyBufferReader.mjs';

/**
 * Represents a parsed ISO BMFF box header.
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
 * Reads the header of the box starting at the current reader offset.
 * @param {import('./TinyBufferReader.mjs').default} reader - The binary cursor used for reading.
 * @param {number} end - The absolute offset marking the end of the readable buffer.
 * @returns {IsoBox} The parsed box header containing metadata about the box.
 * @throws {TinyNeedMoreData} If the buffer is truncated and cannot provide the full header or payload size.
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
 * A generator that iterates over all sibling boxes within the specified byte range.
 * @param {import('./TinyBufferReader.mjs').default} reader - The binary cursor used for reading.
 * @param {number} start - The absolute offset where the sequence of boxes begins.
 * @param {number} end - The absolute offset marking the end of the range.
 * @yields {IsoBox} Every complete ISO box found in the specified range.
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
 * Recursively searches through the box tree for the first box that matches one of the specified types.
 * @param {import('./TinyBufferReader.mjs').default} reader - The binary cursor used for reading.
 * @param {number} start - The absolute offset where the search begins.
 * @param {number} end - The absolute offset marking the end of the search range.
 * @param {ReadonlySet<string>} types - A set of 4-character box types to match against.
 * @param {number} [depth] - The current recursion depth, used to prevent infinite loops or stack overflows.
 * @returns {IsoBox|null} The first matching box header found, or null if no match exists within the range.
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
