/**
 * @fileoverview Probes the intrinsic dimensions of an image by parsing its
 * container header. It never decodes a frame, so it resolves after a few
 * hundred bytes instead of waiting for the whole file.
 *
 * Supported formats: PNG, JPEG, GIF, WebP, BMP, ICO, CUR, TIFF, AVIF, HEIC,
 * HEIF, SVG, JPEG XL and QOI.
 */
import TinyBufferReader, { TinyNeedMoreData } from '../utils/TinyBufferReader.mjs';
import { findBox } from '../utils/TinyIsoBox.mjs';

/**
 * @typedef {Object} ImageProbeSize
 * @property {number} width - The display width in pixels.
 * @property {number} height - The display height in pixels.
 */

/**
 * A format descriptor.
 * @typedef {Object} ImageFormat
 * @property {string} name - The format identifier.
 * @property {string} mime - The canonical MIME type.
 * @property {(bytes: Uint8Array) => boolean} sniff - The signature test.
 * @property {(reader: TinyBufferReader) => ImageProbeSize | null} parse - The parser.
 */

/**
 * The largest header the probe buffers before giving up.
 * @type {number}
 */
const MAX_HEADER_BYTES = 64 * 1024;

/**
 * The aspect ratios allowed by the JPEG XL size header.
 * @type {readonly number[]}
 */
const JXL_RATIOS = Object.freeze([1, 1.2, 4 / 3, 1.5, 16 / 9, 1.25, 2]);

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
 * @returns {ImageProbeSize|null} The dimensions.
 */
function parsePng(reader) {
  reader.seek(16);
  const width = reader.uint32();
  const height = reader.uint32();
  return width > 0 && height > 0 ? { width, height } : null;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {ImageProbeSize|null} The dimensions.
 */
function parseGif(reader) {
  reader.seek(6);
  const width = reader.uint16le();
  const height = reader.uint16le();
  return width > 0 && height > 0 ? { width, height } : null;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {ImageProbeSize|null} The dimensions.
 */
function parseBmp(reader) {
  reader.seek(18);
  const width = reader.int32le();
  const height = Math.abs(reader.int32le());
  return width > 0 && height > 0 ? { width, height } : null;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {ImageProbeSize|null} The dimensions.
 */
function parseIco(reader) {
  reader.seek(6);
  const width = reader.uint8() || 256;
  const height = reader.uint8() || 256;
  return { width, height };
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {ImageProbeSize|null} The dimensions.
 */
function parseJpeg(reader) {
  const end = reader.limit;
  reader.seek(2);
  while (reader.offset + 4 <= end) {
    if (reader.uint8() !== 0xff) {
      continue;
    }
    let marker = reader.uint8();
    while (marker === 0xff && reader.offset < end) {
      marker = reader.uint8();
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      continue;
    }
    if (marker === 0xda) {
      return null;
    }
    const length = reader.uint16();
    const isSof =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      reader.skip(1);
      const height = reader.uint16();
      const width = reader.uint16();
      return width > 0 && height > 0 ? { width, height } : null;
    }
    reader.skip(length - 2);
  }
  return null;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {ImageProbeSize|null} The dimensions.
 */
function parseWebp(reader) {
  reader.seek(12);
  const tag = reader.ascii(4);
  if (tag === 'VP8 ') {
    reader.seek(26);
    return { width: reader.uint16le() & 0x3fff, height: reader.uint16le() & 0x3fff };
  }
  if (tag === 'VP8L') {
    reader.seek(21);
    const bits = reader.uint32le();
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (tag === 'VP8X') {
    reader.seek(24);
    const width = 1 + (reader.uint8() | (reader.uint8() << 8) | (reader.uint8() << 16));
    const height = 1 + (reader.uint8() | (reader.uint8() << 8) | (reader.uint8() << 16));
    return { width, height };
  }
  return null;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {ImageProbeSize|null} The dimensions.
 */
function parseTiff(reader) {
  reader.seek(0);
  const little = reader.uint16() === 0x4949;
  reader.seek(4);
  const ifdOffset = little ? reader.uint32le() : reader.uint32();
  reader.seek(ifdOffset);
  const count = little ? reader.uint16le() : reader.uint16();
  let width = 0;
  let height = 0;
  for (let i = 0; i < count; i += 1) {
    const tag = little ? reader.uint16le() : reader.uint16();
    const type = little ? reader.uint16le() : reader.uint16();
    reader.skip(2);
    const raw = reader.bytes(4);
    let value;
    if (type === 3) {
      value = little ? raw[0] | (raw[1] << 8) : (raw[0] << 8) | raw[1];
    } else {
      value = little
        ? (raw[0] | (raw[1] << 8) | (raw[2] << 16) | (raw[3] << 24)) >>> 0
        : ((raw[0] << 24) | (raw[1] << 16) | (raw[2] << 8) | raw[3]) >>> 0;
    }
    if (tag === 0x0100) {
      width = value;
    } else if (tag === 0x0101) {
      height = value;
    }
  }
  return width > 0 && height > 0 ? { width, height } : null;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {ImageProbeSize|null} The dimensions.
 */
function parseIsoBmff(reader) {
  const end = reader.limit;
  const ispe = findBox(reader, 0, end, new Set(['ispe']));
  if (!ispe) {
    return null;
  }
  reader.seek(ispe.dataStart + 4);
  const width = reader.uint32();
  const height = reader.uint32();
  return width > 0 && height > 0 ? { width, height } : null;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {ImageProbeSize|null} The dimensions.
 */
function parseSvg(reader) {
  const length = Math.min(reader.limit, 8192);
  reader.seek(0);
  const text = new TextDecoder('utf-8').decode(reader.bytes(length));
  const match = text.match(/<svg\b[^>]*>/i);
  if (!match) {
    if (text.includes('<svg')) {
      throw new TinyNeedMoreData();
    }
    return null;
  }
  const attrs = match[0];
  /** @param {string} name */
  const read = (name) => {
    const found = attrs.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i'));
    if (!found) {
      return 0;
    }
    return Math.round(Number.parseFloat(found[1]));
  };
  const width = read('width');
  const height = read('height');
  if (width > 0 && height > 0) {
    return { width, height };
  }
  const viewBox = attrs.match(/viewBox\s*=\s*["']([^"']+)["']/i);
  if (viewBox) {
    const parts = viewBox[1]
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      return { width: Math.round(parts[2]), height: Math.round(parts[3]) };
    }
  }
  return null;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {ImageProbeSize|null} The dimensions.
 */
function parseJxl(reader) {
  reader.seek(0);
  const b0 = reader.uint8();
  const b1 = reader.uint8();
  let start = 2;
  if (!(b0 === 0xff && b1 === 0x0a)) {
    reader.seek(0);
    const end = reader.limit;
    let found = -1;
    while (reader.offset + 8 <= end) {
      const size = reader.uint32();
      const type = reader.ascii(4);
      if (type === 'jxlc') {
        found = reader.offset;
        break;
      }
      if (size < 8) {
        return null;
      }
      reader.seek(reader.offset - 8 + size);
    }
    if (found === -1) {
      return null;
    }
    start = found;
  }
  const bytes = reader.buffer;
  let bit = 0;
  /** @param {number} count */
  const readBits = (count) => {
    let value = 0;
    for (let i = 0; i < count; i += 1) {
      const byte = bytes[start + (bit >> 3)];
      value |= ((byte >> (bit & 7)) & 1) << i;
      bit += 1;
    }
    return value;
  };
  if (readBits(1) === 1) {
    const height = (readBits(5) + 1) * 8;
    const ratio = readBits(3);
    if (ratio === 0) {
      return { width: (readBits(8) + 1) * 8, height };
    }
    return { width: Math.round(height * JXL_RATIOS[ratio]), height };
  }
  const height = readBits(9) + 1;
  const ratio = readBits(3);
  if (ratio === 0) {
    return { width: readBits(9) + 1, height };
  }
  return { width: Math.round(height * JXL_RATIOS[ratio]), height };
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {ImageProbeSize|null} The dimensions.
 */
function parseQoi(reader) {
  reader.seek(4);
  const width = reader.uint32();
  const height = reader.uint32();
  return width > 0 && height > 0 ? { width, height } : null;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {ImageProbeSize|null} The dimensions.
 */
function parsePsd(reader) {
  reader.seek(14);
  const height = reader.uint32();
  const width = reader.uint32();
  return width > 0 && height > 0 ? { width, height } : null;
}

/**
 * The format registry. The order matters: the first signature that matches wins.
 * @type {ReadonlyArray<ImageFormat>}
 */
const FORMATS = Object.freeze([
  {
    name: 'png',
    mime: 'image/png',
    sniff: (b) => matches(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    parse: parsePng,
  },
  {
    name: 'jpeg',
    mime: 'image/jpeg',
    sniff: (b) => matches(b, [0xff, 0xd8, 0xff]),
    parse: parseJpeg,
  },
  {
    name: 'gif',
    mime: 'image/gif',
    sniff: (b) => matches(b, [0x47, 0x49, 0x46, 0x38]),
    parse: parseGif,
  },
  { name: 'bmp', mime: 'image/bmp', sniff: (b) => matches(b, [0x42, 0x4d]), parse: parseBmp },
  {
    name: 'webp',
    mime: 'image/webp',
    sniff: (b) => matches(b, [0x52, 0x49, 0x46, 0x46]) && matches(b, [0x57, 0x45, 0x42, 0x50], 8),
    parse: parseWebp,
  },
  {
    name: 'tiff',
    mime: 'image/tiff',
    sniff: (b) => matches(b, [0x49, 0x49, 0x2a, 0x00]) || matches(b, [0x4d, 0x4d, 0x00, 0x2a]),
    parse: parseTiff,
  },
  {
    name: 'ico',
    mime: 'image/x-icon',
    sniff: (b) => matches(b, [0x00, 0x00, 0x01, 0x00]),
    parse: parseIco,
  },
  {
    name: 'cur',
    mime: 'image/x-icon',
    sniff: (b) => matches(b, [0x00, 0x00, 0x02, 0x00]),
    parse: parseIco,
  },
  {
    name: 'qoi',
    mime: 'image/qoi',
    sniff: (b) => matches(b, [0x71, 0x6f, 0x69, 0x66]),
    parse: parseQoi,
  },
  {
    name: 'psd',
    mime: 'image/vnd.adobe.photoshop',
    sniff: (b) => matches(b, [0x38, 0x42, 0x50, 0x53]),
    parse: parsePsd,
  },
  {
    name: 'jxl',
    mime: 'image/jxl',
    sniff: (b) =>
      matches(b, [0xff, 0x0a]) || matches(b, [0x00, 0x00, 0x00, 0x0c, 0x4a, 0x58, 0x4c, 0x20]),
    parse: parseJxl,
  },
  {
    name: 'avif',
    mime: 'image/avif',
    sniff: (b) => matches(b, [0x66, 0x74, 0x79, 0x70], 4),
    parse: parseIsoBmff,
  },
  {
    name: 'svg',
    mime: 'image/svg+xml',
    sniff: (b) => {
      const head = new TextDecoder('utf-8').decode(b.subarray(0, 256)).trimStart();
      return (
        head.startsWith('<svg') || head.startsWith('<?xml') || head.startsWith('<!DOCTYPE svg')
      );
    },
    parse: parseSvg,
  },
]);

/**
 * Reads the intrinsic dimensions of an image from its container header.
 */
class TinyImageProbe {
  /** @type {Uint8Array} */
  #buffer = new Uint8Array(0);
  /** @type {ImageFormat|null} */
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
   * @returns {ImageProbeSize|null} The dimensions, or null when more data is needed.
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
   * @returns {ImageFormat|null} The detected format, or null when more data is needed.
   */
  #detect() {
    for (const format of FORMATS) {
      try {
        if (format.sniff(this.#buffer)) {
          return format;
        }
      } catch {
        return null;
      }
    }
    return null;
  }
}

export default TinyImageProbe;
