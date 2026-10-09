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
 * @property {number} [frames] - The frames counter.
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
  if (width === 0 || height === 0) {
    return null;
  }
  return { width, height, frames: countApngFrames(reader.buffer) };
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
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {ImageProbeSize|null} The dimensions.
 */
function parseJp2(reader) {
  const ihdr = findBox(reader, 0, reader.limit, new Set(['ihdr']));
  if (!ihdr) {
    return null;
  }
  reader.seek(ihdr.dataStart + 4);
  const height = reader.uint32();
  const width = reader.uint32();
  return width > 0 && height > 0 ? { width, height } : null;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {ImageProbeSize|null} The dimensions.
 */
function parseJ2k(reader) {
  reader.seek(2);
  while (reader.remaining > 4) {
    if (reader.uint16() === 0xff51) {
      reader.skip(3);
      const height = reader.uint32() - reader.uint32() + 1;
      const width = reader.uint32() - reader.uint32() + 1;
      return { width, height };
    }
    reader.skip(reader.uint16() - 2);
  }
  return null;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {ImageProbeSize|null} The dimensions.
 */
function parsePnm(reader) {
  const length = Math.min(reader.limit, 1024);
  reader.seek(0);
  const text = new TextDecoder('latin1').decode(reader.bytes(length));
  const tokens = text
    .replace(/#[^\n]*/g, ' ')
    .trim()
    .split(/\s+/);
  if (tokens[0] === 'P7') {
    const width = Number(tokens[tokens.indexOf('WIDTH') + 1]);
    const height = Number(tokens[tokens.indexOf('HEIGHT') + 1]);
    return width > 0 && height > 0 ? { width, height } : null;
  }
  const width = Number(tokens[1]);
  const height = Number(tokens[2]);
  return width > 0 && height > 0 ? { width, height } : null;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {ImageProbeSize|null} The dimensions.
 */
function parsePcx(reader) {
  reader.seek(4);
  const xmin = reader.uint16le();
  const ymin = reader.uint16le();
  const xmax = reader.uint16le();
  const ymax = reader.uint16le();
  return { width: xmax - xmin + 1, height: ymax - ymin + 1 };
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {ImageProbeSize|null} The dimensions.
 */
function parseSgi(reader) {
  reader.seek(6);
  return { width: reader.uint16(), height: reader.uint16() };
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {ImageProbeSize|null} The dimensions.
 */
function parseSun(reader) {
  reader.seek(4);
  return { width: reader.uint32(), height: reader.uint32() };
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {ImageProbeSize|null} The dimensions.
 */
function parseHdr(reader) {
  const length = Math.min(reader.limit, 4096);
  reader.seek(0);
  const text = new TextDecoder('latin1').decode(reader.bytes(length));
  const match = text.match(/-Y\s+(\d+)\s*\+X\s+(\d+)/);
  return match ? { width: Number(match[2]), height: Number(match[1]) } : null;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {ImageProbeSize|null} The dimensions.
 */
function parseIff(reader) {
  let offset = 12;
  const end = reader.limit;
  while (offset + 8 <= end) {
    reader.seek(offset);
    const type = reader.ascii(4);
    const size = reader.uint32();
    if (type === 'BMHD') {
      return { width: reader.uint16(), height: reader.uint16() };
    }
    offset += 8 + size + (size % 2);
  }
  return null;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {ImageProbeSize|null} The dimensions.
 */
function parseMng(reader) {
  reader.seek(8);
  const length = reader.uint32();
  if (reader.ascii(4) !== 'MHDR' || length < 16) {
    return null;
  }
  return { width: reader.uint32(), height: reader.uint32() };
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {ImageProbeSize|null} The dimensions.
 */
function parseFlif(reader) {
  reader.seek(4);
  reader.uint8();
  const depth = reader.uint8();
  const read = () => {
    let value = 0;
    for (let i = 0; i < depth; i += 1) {
      value = value * 256 + reader.uint8();
    }
    return value + 1;
  };
  return { width: read(), height: read() };
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {ImageProbeSize|null} The dimensions.
 */
function parseBpg(reader) {
  reader.seek(4);
  const read = () => {
    let value = 0;
    for (let i = 0; i < 4; i += 1) {
      const byte = reader.uint8();
      value = (value << 7) | (byte & 0x7f);
      if (!(byte & 0x80)) {
        break;
      }
    }
    return value;
  };
  return { width: read(), height: read() };
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {ImageProbeSize|null} The dimensions.
 */
function parseJxr(reader) {
  reader.seek(4);
  const read = () => {
    let value = 0;
    for (let i = 0; i < 4; i += 1) {
      const byte = reader.uint8();
      value = (value << 7) | (byte & 0x7f);
      if (!(byte & 0x80)) {
        break;
      }
    }
    return value + 1;
  };
  return { width: read(), height: read() };
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {ImageProbeSize|null} The dimensions.
 */
function parseFits(reader) {
  const length = Math.min(reader.limit, 28800);
  reader.seek(0);
  const text = new TextDecoder('latin1').decode(reader.bytes(length));
  const width = text.match(/NAXIS1\s*=\s*(\d+)/);
  const height = text.match(/NAXIS2\s*=\s*(\d+)/);
  return width && height ? { width: Number(width[1]), height: Number(height[1]) } : null;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {ImageProbeSize|null} The dimensions.
 */
function parseNrrd(reader) {
  const length = Math.min(reader.limit, 4096);
  reader.seek(0);
  const text = new TextDecoder('latin1').decode(reader.bytes(length));
  const match = text.match(/sizes:\s*(\d+)(?:\s+(\d+))?/);
  return match ? { width: Number(match[1]), height: match[2] ? Number(match[2]) : 1 } : null;
}

/**
 * Counts the frames of an animated GIF by walking the block list.
 * @param {Uint8Array} bytes - The full GIF stream.
 * @returns {number} The number of image descriptors, or 0 when the stream is truncated.
 */
function countGifFrames(bytes) {
  if (bytes.length < 13) {
    return 0;
  }
  const packed = bytes[10];
  let offset = 13;
  if (packed & 0x80) {
    offset += 3 * (1 << ((packed & 0x07) + 1));
  }
  let frames = 0;
  while (offset < bytes.length) {
    const block = bytes[offset];
    if (block === 0x3b) {
      return frames;
    }
    if (block === 0x21) {
      offset = skipGifSubBlocks(bytes, offset + 2);
    } else if (block === 0x2c) {
      frames += 1;
      const local = bytes[offset + 9];
      offset += 10;
      if (local & 0x80) {
        offset += 3 * (1 << ((local & 0x07) + 1));
      }
      offset = skipGifSubBlocks(bytes, offset + 1);
    } else {
      return frames;
    }
  }
  return frames;
}

/**
 * Skips a GIF sub-block chain and returns the offset after its terminator.
 * @param {Uint8Array} bytes - The full GIF stream.
 * @param {number} offset - The first sub-block length byte.
 * @returns {number} The offset after the terminator.
 */
function skipGifSubBlocks(bytes, offset) {
  let cursor = offset;
  while (cursor < bytes.length) {
    const size = bytes[cursor];
    cursor += 1;
    if (size === 0) {
      return cursor;
    }
    cursor += size;
  }
  return cursor;
}

/**
 * Counts the frames of an animated WebP by counting the `ANMF` chunks.
 * @param {Uint8Array} bytes - The full WebP stream.
 * @returns {number} The number of frames, or 1 when the stream is not animated.
 */
function countWebpFrames(bytes) {
  let offset = 12;
  let frames = 0;
  while (offset + 8 <= bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 8);
    const fourcc = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3],
    );
    const size = view.getUint32(4, true);
    if (fourcc === 'ANMF') {
      frames += 1;
    }
    offset += 8 + size + (size % 2);
  }
  return frames || 1;
}

/**
 * Reads the frame count declared by the APNG `acTL` chunk.
 * @param {Uint8Array} bytes - The full PNG stream.
 * @returns {number} The frame count, or 1 for a still PNG.
 */
function countApngFrames(bytes) {
  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 8);
    const size = view.getUint32(0);
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7],
    );
    if (type === 'acTL') {
      return new DataView(bytes.buffer, bytes.byteOffset + offset + 8, 4).getUint32(0);
    }
    if (type === 'IDAT' || type === 'IEND') {
      return 1;
    }
    offset += 12 + size;
  }
  return 1;
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
  {
    name: 'jp2',
    mime: 'image/jp2',
    sniff: (b) => matches(b, [0x00, 0x00, 0x00, 0x0c, 0x6a, 0x50, 0x20, 0x20]),
    parse: parseJp2,
  },
  {
    name: 'j2k',
    mime: 'image/j2k',
    sniff: (b) => matches(b, [0xff, 0x4f, 0xff, 0x51]),
    parse: parseJ2k,
  },
  {
    name: 'pnm',
    mime: 'image/x-portable-anymap',
    sniff: (b) => b[0] === 0x50 && b[1] >= 0x31 && b[1] <= 0x37,
    parse: parsePnm,
  },
  {
    name: 'pcx',
    mime: 'image/vnd.zbrush.pcx',
    sniff: (b) => b[0] === 0x0a && b[2] <= 1 && b[3] <= 8,
    parse: parsePcx,
  },
  { name: 'sgi', mime: 'image/x-sgi', sniff: (b) => matches(b, [0x01, 0xda]), parse: parseSgi },
  {
    name: 'sun',
    mime: 'image/x-cmu-raster',
    sniff: (b) => matches(b, [0x59, 0xa6, 0x6a, 0x95]),
    parse: parseSun,
  },
  {
    name: 'hdr',
    mime: 'image/vnd.radiance',
    sniff: (b) => matches(b, [0x23, 0x3f, 0x52, 0x41, 0x44, 0x49, 0x41, 0x4e, 0x43, 0x45]),
    parse: parseHdr,
  },
  {
    name: 'ilbm',
    mime: 'image/x-ilbm',
    sniff: (b) => matches(b, [0x46, 0x4f, 0x52, 0x4d]) && matches(b, [0x49, 0x4c, 0x42, 0x4d], 8),
    parse: parseIff,
  },
  {
    name: 'mng',
    mime: 'image/x-mng',
    sniff: (b) => matches(b, [0x8a, 0x4d, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    parse: parseMng,
  },
  {
    name: 'flif',
    mime: 'image/flif',
    sniff: (b) => matches(b, [0x46, 0x4c, 0x49, 0x46]),
    parse: parseFlif,
  },
  {
    name: 'bpg',
    mime: 'image/bpg',
    sniff: (b) => matches(b, [0x42, 0x50, 0x47, 0xfb]),
    parse: parseBpg,
  },
  {
    name: 'jxr',
    mime: 'image/jxr',
    sniff: (b) => matches(b, [0x49, 0x49, 0xbc, 0x01]) || matches(b, [0x4d, 0x4d, 0x01, 0xbc]),
    parse: parseJxr,
  },
  {
    name: 'fits',
    mime: 'image/fits',
    sniff: (b) => matches(b, [0x53, 0x49, 0x4d, 0x50, 0x4c, 0x45, 0x20, 0x20, 0x3d]),
    parse: parseFits,
  },
  {
    name: 'nrrd',
    mime: 'image/x-nrrd',
    sniff: (b) => matches(b, [0x4e, 0x52, 0x52, 0x44]),
    parse: parseNrrd,
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
  /** @type {boolean} */
  #animated = false;

  /**
   * Returns the metadata that is only known once the stream ends. It is a
   * no-op for still images and for the formats whose frame count is already
   * carried by the header.
   * @returns {{ frames: number }|null} The final metadata, or null when there is nothing to add.
   */
  finalize() {
    if (!this.#animated || !this.#format) {
      return null;
    }
    const frames = this.#countFrames();
    return frames > 1 ? { frames } : null;
  }

  /**
   * @returns {number} The number of frames in the buffered stream.
   */
  #countFrames() {
    const name = this.#format?.name;
    if (!name) return 1;
    if (name === 'gif') {
      return countGifFrames(this.#buffer);
    }
    if (name === 'webp') {
      return countWebpFrames(this.#buffer);
    }
    if (name === 'png') {
      return countApngFrames(this.#buffer);
    }
    return 1;
  }

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
    if (this.#abandoned) {
      return null;
    }
    const merged = new Uint8Array(this.#buffer.length + chunk.length);
    merged.set(this.#buffer);
    merged.set(chunk, this.#buffer.length);
    this.#buffer = merged;
    if (this.#resolved) {
      return null;
    }
    if (!this.#format) {
      this.#format = this.#detect();
      if (!this.#format) {
        if (this.#buffer.length > 512) {
          this.#abandoned = true;
        }
        return null;
      }
      this.#animated = ['gif', 'webp', 'png'].includes(this.#format.name);
    }
    try {
      const size = this.#format.parse(new TinyBufferReader(this.#buffer));
      if (size) {
        this.#resolved = true;
        // Animated formats keep the buffer alive so `finalize` can count the
        // frames once the stream ends. Still images release it immediately.
        if (!this.#animated) {
          this.#buffer = new Uint8Array(0);
        }
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
