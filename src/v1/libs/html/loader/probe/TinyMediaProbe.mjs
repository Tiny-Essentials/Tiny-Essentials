/**
 * @fileoverview Probes the intrinsic dimensions of a video stream by parsing
 * its container header. It never decodes a frame, so it works for codecs the
 * browser cannot play.
 *
 * Supported containers: ISO base media (MP4, MOV, M4V, 3GP), Matroska/WebM,
 * AVI, Ogg/Theora and MPEG-1/2 video elementary streams.
 */
import TinyBufferReader, { TinyNeedMoreData } from '../utils/TinyBufferReader.mjs';
import { findBox } from '../utils/TinyIsoBox.mjs';

/**
 * @typedef {Object} MediaProbeSize
 * @property {number} width - The display width in pixels.
 * @property {number} height - The display height in pixels.
 */

/**
 * A container descriptor.
 * @typedef {Object} MediaFormat
 * @property {string} name - The container identifier.
 * @property {(bytes: Uint8Array) => boolean} sniff - The signature test.
 * @property {(reader: TinyBufferReader) => MediaProbeSize | null} parse - The parser.
 */

/**
 * The largest header the probe buffers before giving up.
 * @type {number}
 */
const MAX_HEADER_BYTES = 8 * 1024 * 1024;

/**
 * The EBML element identifiers the WebM parser descends into.
 * @type {ReadonlySet<number>}
 */
const WEBM_CONTAINERS = new Set([0x18538067, 0x1654ae6b, 0xae, 0xe0]);

/**
 * @param {Uint8Array} bytes - The buffer to test.
 * @param {readonly number[]} signature - The expected prefix.
 * @param {number} [offset] - The offset to test at.
 * @returns {boolean} True when the buffer starts with the signature.
 */
function matches(bytes, signature, offset = 0) {
  if (bytes.length < offset + signature.length) {
    return false;
  }
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {MediaProbeSize|null} The dimensions.
 */
function parseIsoBmff(reader) {
  const end = reader.limit;
  const moov = findBox(reader, 0, end, new Set(['moov']));
  if (moov) {
    let cursor = moov.dataStart;
    while (cursor + 8 <= moov.dataEnd) {
      reader.seek(cursor);
      const size = reader.uint32();
      const type = reader.ascii(4);
      if (size < 8) {
        break;
      }
      if (type === 'trak') {
        const tkhd = findBox(reader, cursor + 8, cursor + size, new Set(['tkhd']));
        if (tkhd) {
          const version = reader.seek(tkhd.dataStart).uint8();
          reader.seek(tkhd.start + (version === 1 ? 96 : 84));
          const width = reader.uint32() / 65536;
          const height = reader.uint32() / 65536;
          if (width > 0 && height > 0) {
            return { width: Math.round(width), height: Math.round(height) };
          }
        }
      }
      cursor += size;
    }
  }
  const ispe = findBox(reader, 0, end, new Set(['ispe']));
  if (ispe) {
    reader.seek(ispe.dataStart + 4);
    const width = reader.uint32();
    const height = reader.uint32();
    if (width > 0 && height > 0) {
      return { width, height };
    }
  }
  return null;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {MediaProbeSize|null} The dimensions.
 */
function parseWebm(reader) {
  return scanWebm(reader, 0, reader.limit);
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @param {number} start - The first byte of the range.
 * @param {number} end - The byte after the range.
 * @returns {MediaProbeSize|null} The dimensions.
 */
function scanWebm(reader, start, end) {
  let offset = start;
  while (offset < end) {
    const id = readVint(reader, offset, true);
    if (!id) {
      return null;
    }
    const size = readVint(reader, offset + id.length, false);
    if (!size) {
      return null;
    }
    const dataStart = offset + id.length + size.length;
    const dataEnd = dataStart + size.value;
    if (dataEnd > end) {
      return null;
    }
    if (id.value === 0xe0) {
      return readWebmVideo(reader, dataStart, dataEnd);
    }
    if (WEBM_CONTAINERS.has(id.value)) {
      const result = scanWebm(reader, dataStart, dataEnd);
      if (result) {
        return result;
      }
    }
    offset = dataEnd;
  }
  return null;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @param {number} start - The first byte of the `Video` payload.
 * @param {number} end - The byte after the `Video` payload.
 * @returns {MediaProbeSize|null} The dimensions.
 */
function readWebmVideo(reader, start, end) {
  let width = 0;
  let height = 0;
  let offset = start;
  while (offset < end) {
    const id = readVint(reader, offset, true);
    if (!id) {
      return null;
    }
    const size = readVint(reader, offset + id.length, false);
    if (!size) {
      return null;
    }
    const dataStart = offset + id.length + size.length;
    const dataEnd = dataStart + size.value;
    if (dataEnd > end) {
      return null;
    }
    if (id.value === 0xb0) {
      width = readUint(reader, dataStart, size.value);
    } else if (id.value === 0xba) {
      height = readUint(reader, dataStart, size.value);
    }
    offset = dataEnd;
  }
  return width > 0 && height > 0 ? { width, height } : null;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @param {number} offset - The first byte of the integer.
 * @param {boolean} keepMarker - Whether the length marker bit is preserved.
 * @returns<{ value: number, length: number }|null>} The decoded value and its byte length.
 */
function readVint(reader, offset, keepMarker) {
  const bytes = reader.buffer;
  if (offset >= bytes.length) {
    return null;
  }
  const first = bytes[offset];
  if (first === 0) {
    return null;
  }
  let length = 1;
  let mask = 0x80;
  while (length <= 8 && !(first & mask)) {
    mask >>= 1;
    length += 1;
  }
  if (length > 8 || offset + length > bytes.length) {
    return null;
  }
  let value = keepMarker ? first : first & (mask - 1);
  for (let i = 1; i < length; i += 1) {
    value = value * 256 + bytes[offset + i];
  }
  return { value, length };
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @param {number} offset - The first byte of the integer.
 * @param {number} length - The number of bytes to read.
 * @returns {number} The decoded value.
 */
function readUint(reader, offset, length) {
  const bytes = reader.buffer;
  let value = 0;
  for (let i = 0; i < length; i += 1) {
    value = value * 256 + bytes[offset + i];
  }
  return value;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {MediaProbeSize|null} The dimensions.
 */
function parseAvi(reader) {
  const end = reader.limit;
  let offset = 12;
  while (offset + 8 <= end) {
    reader.seek(offset);
    const id = reader.ascii(4);
    const size = reader.uint32le();
    if (id === 'avih') {
      reader.seek(offset + 8 + 32);
      const width = reader.uint32le();
      const height = reader.uint32le();
      return width > 0 && height > 0 ? { width, height } : null;
    }
    offset += 8 + size + (size % 2);
  }
  return null;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {MediaProbeSize|null} The dimensions.
 */
function parseOgg(reader) {
  reader.seek(26);
  const segments = reader.uint8();
  reader.skip(segments);
  const payload = reader.offset;
  reader.seek(payload);
  const signature = reader.ascii(7);
  if (signature !== '\x80theora') {
    return null;
  }
  reader.seek(payload + 10);
  const width = reader.uint24();
  const height = reader.uint24();
  return width > 0 && height > 0 ? { width, height } : null;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {MediaProbeSize|null} The dimensions.
 */
function parseMpeg(reader) {
  const end = reader.limit;
  let offset = 0;
  while (offset + 4 <= end) {
    if (reader.seek(offset).uint24() === 0x000001 && reader.uint8() === 0xb3) {
      const a = reader.uint8();
      const b = reader.uint8();
      const c = reader.uint8();
      return { width: (a << 4) | (b >> 4), height: ((b & 0x0f) << 8) | c };
    }
    offset += 1;
  }
  return null;
}

/**
 * The container registry. The order matters: the first signature that matches wins.
 * @type {ReadonlyArray<MediaFormat>}
 */
const FORMATS = Object.freeze([
  { name: 'iso-bmff', sniff: (b) => matches(b, [0x66, 0x74, 0x79, 0x70], 4), parse: parseIsoBmff },
  { name: 'matroska', sniff: (b) => matches(b, [0x1a, 0x45, 0xdf, 0xa3]), parse: parseWebm },
  {
    name: 'avi',
    sniff: (b) => matches(b, [0x52, 0x49, 0x46, 0x46]) && matches(b, [0x41, 0x56, 0x49, 0x20], 8),
    parse: parseAvi,
  },
  { name: 'ogg', sniff: (b) => matches(b, [0x4f, 0x67, 0x67, 0x53]), parse: parseOgg },
  {
    name: 'mpeg',
    sniff: (b) => matches(b, [0x00, 0x00, 0x01, 0xba]) || matches(b, [0x00, 0x00, 0x01, 0xb3]),
    parse: parseMpeg,
  },
]);

/**
 * Reads the intrinsic dimensions of a video stream from its container header.
 */
class TinyMediaProbe {
  /** @type {Uint8Array} */
  #buffer = new Uint8Array(0);
  /** @type {MediaFormat|null} */
  #format = null;
  /** @type {boolean} */
  #resolved = false;
  /** @type {boolean} */
  #abandoned = false;
  /** @type {number} */
  #maxBytes;

  /**
   * @param {string} [type] - The MIME type from the response headers. Unused, kept for API compatibility.
   * @param {number} [maxBytes] - The maximum number of header bytes to buffer.
   * @throws {RangeError} If `maxBytes` is not a positive number.
   */
  constructor(type = '', maxBytes = MAX_HEADER_BYTES) {
    if (typeof maxBytes !== 'number' || Number.isNaN(maxBytes) || maxBytes < 1) {
      throw new RangeError('The "maxBytes" argument must be a positive number.');
    }
    this.#maxBytes = maxBytes;
  }

  /**
   * Appends a chunk and returns the dimensions once they are known.
   * @param {Uint8Array} chunk - The bytes received so far.
   * @returns {MediaProbeSize|null} The dimensions, or null when more data is needed.
   * @throws {TypeError} If `chunk` is not a Uint8Array.
   */
  push(chunk) {
    if (!(chunk instanceof Uint8Array)) {
      throw new TypeError('The "chunk" argument must be a Uint8Array.');
    }
    if (this.#resolved || this.#abandoned) {
      return null;
    }
    const merged = new Uint8Array(this.#buffer.length + chunk.length);
    merged.set(this.#buffer);
    merged.set(chunk, this.#buffer.length);
    this.#buffer = merged;
    if (!this.#format) {
      this.#format = this.#detect();
      if (!this.#format) {
        if (this.#buffer.length > 512) {
          this.#abandoned = true;
        }
        return null;
      }
    }
    try {
      const size = this.#format.parse(new TinyBufferReader(this.#buffer));
      if (size) {
        this.#resolved = true;
        this.#buffer = new Uint8Array(0);
        return size;
      }
    } catch (error) {
      if (!(error instanceof TinyNeedMoreData)) {
        throw error;
      }
    }
    if (this.#buffer.length > this.#maxBytes) {
      this.#abandoned = true;
      this.#buffer = new Uint8Array(0);
    }
    return null;
  }

  /**
   * Releases the buffered header.
   * @returns {void}
   */
  close() {
    this.#buffer = new Uint8Array(0);
    this.#abandoned = true;
  }

  /**
   * @returns {MediaFormat|null} The detected format, or null when more data is needed.
   */
  #detect() {
    for (const format of FORMATS) {
      if (format.sniff(this.#buffer)) {
        return format;
      }
    }
    return null;
  }
}

export default TinyMediaProbe;
