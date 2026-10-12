/**
 * @fileoverview Probes the intrinsic dimensions of an image by parsing its
 * container header. For animated formats, it retains the buffer to extract
 * full animation data (frames, loops, and duration) upon finalization.
 *
 * Supported Web formats: PNG (incl. APNG), JPEG, GIF, WebP, BMP, ICO, CUR, AVIF, and SVG.
 */
import TinyBufferReader, { TinyNeedMoreData } from '../utils/TinyBufferReader.mjs';
import { findBox } from '../utils/TinyIsoBox.mjs';

/**
 * Represents detailed animation information.
 * @typedef {Object} AnimationProbeData
 * @property {number} frames - Total number of frames.
 * @property {number} loopCount - Number of times to loop (0 usually means infinite).
 * @property {number} duration - Total duration of the animation in milliseconds.
 */

/**
 * Represents the intrinsic dimensions of an image.
 * @typedef {Object} ImageProbeSize
 * @property {number} width - The display width in pixels.
 * @property {number} height - The display height in pixels.
 * @property {AnimationProbeData} [animation] - The animation data.
 */

/**
 * Describes an image format and how to identify and parse its dimensions.
 * @typedef {Object} ImageFormat
 * @property {string} name - The format identifier.
 * @property {string} mime - The canonical MIME type.
 * @property {(bytes: Uint8Array) => boolean} sniff - A function that tests if the provided bytes match the format's signature.
 * @property {(reader: TinyBufferReader) => ImageProbeSize | null} parse - A function that parses the container to extract image dimensions.
 */

/**
 * The largest header the probe buffers before giving up.
 * @type {number}
 */
const MAX_HEADER_BYTES = 64 * 1024;

/**
 * Checks if a buffer starts with a specific byte signature at a given offset.
 * @param {Uint8Array} bytes - The buffer to test.
 * @param {readonly number[]} signature - The expected byte prefix.
 * @param {number} [offset] - The offset at which to perform the test.
 * @returns {boolean} True when the buffer starts with the signature at the specified offset.
 */
function matches(bytes, signature, offset = 0) {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

/**
 * Parses a PNG image to extract its dimensions and frame count.
 * @param {TinyBufferReader} reader - The binary cursor used for reading.
 * @returns {ImageProbeSize|null} The extracted dimensions, or null if the PNG is malformed.
 */
function parsePng(reader) {
  reader.seek(16);
  const width = reader.uint32();
  const height = reader.uint32();
  return { width, height };
}

/**
 * Parses a GIF image to extract its dimensions and frames.
 * @param {TinyBufferReader} reader - The binary cursor used for reading.
 * @returns {ImageProbeSize|null} The extracted dimensions, or null if the GIF is malformed.
 */
function parseGif(reader) {
  reader.seek(6);
  const width = reader.uint16le();
  const height = reader.uint16le();
  return width > 0 && height > 0 ? { width, height } : null;
}

/**
 * Parses a BMP image to extract its dimensions.
 * @param {TinyBufferReader} reader - The binary cursor used for reading.
 * @returns {ImageProbeSize|null} The extracted dimensions, or null if the BMP is malformed.
 */
function parseBmp(reader) {
  reader.seek(18);
  const width = reader.int32le();
  const height = Math.abs(reader.int32le());
  return width > 0 && height > 0 ? { width, height } : null;
}

/**
 * Parses an ICO or CUR image to extract its dimensions.
 * @param {TinyBufferReader} reader - The binary cursor used for reading.
 * @returns {ImageProbeSize|null} The extracted dimensions.
 */
function parseIco(reader) {
  reader.seek(6);
  const width = reader.uint8() || 256;
  const height = reader.uint8() || 256;
  return { width, height };
}

/**
 * Parses a JPEG image to extract its dimensions.
 * @param {TinyBufferReader} reader - The binary cursor used for reading.
 * @returns {ImageProbeSize|null} The extracted dimensions, or null if no SOF marker is found.
 */
function parseJpeg(reader) {
  const end = reader.limit;
  reader.seek(2);
  while (reader.offset + 4 <= end) {
    if (reader.uint8() !== 0xff) continue;
    let marker = reader.uint8();
    while (marker === 0xff && reader.offset < end) {
      marker = reader.uint8();
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) continue;
    if (marker === 0xda) return null;

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
 * Parses a WebP image to extract its dimensions and frames.
 * @param {TinyBufferReader} reader - The binary cursor used for reading.
 * @returns {ImageProbeSize|null} The extracted dimensions, or null if the format is unsupported.
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
 * Parses an ISO BMFF image (e.g. AVIF) to extract dimensions.
 * @param {TinyBufferReader} reader - The binary cursor used for reading.
 * @returns {ImageProbeSize|null} The extracted dimensions, or null if not found.
 */
function parseIsoBmff(reader) {
  const end = reader.limit;
  const ispe = findBox(reader, 0, end, new Set(['ispe']));
  if (!ispe) return null;
  reader.seek(ispe.dataStart + 4);
  const width = reader.uint32();
  const height = reader.uint32();
  return width > 0 && height > 0 ? { width, height } : null;
}

/**
 * Parses an SVG image to extract dimensions from the `<svg>` tag attributes or `viewBox`.
 * @param {TinyBufferReader} reader - The binary cursor used for reading.
 * @returns {ImageProbeSize|null} The extracted dimensions, or null if not found.
 */
function parseSvg(reader) {
  const length = Math.min(reader.limit, 8192);
  reader.seek(0);
  const text = new TextDecoder('utf-8').decode(reader.bytes(length));
  const match = text.match(/<svg\b[^>]*>/i);
  if (!match) {
    if (text.includes('<svg')) throw new TinyNeedMoreData();
    return null;
  }
  const attrs = match[0];
  /** @param {string} name */
  const read = (name) => {
    const found = attrs.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i'));
    if (!found) return 0;
    return Math.round(Number.parseFloat(found[1]));
  };
  const width = read('width');
  const height = read('height');
  if (width > 0 && height > 0) return { width, height };

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
 * @param {Uint8Array<ArrayBufferLike>} bytes
 * @param {number} offset
 */
function skipGifSubBlocks(bytes, offset) {
  let cursor = offset;
  while (cursor < bytes.length) {
    const size = bytes[cursor];
    cursor += 1;
    if (size === 0) return cursor;
    cursor += size;
  }
  return cursor;
}

/**
 * Extracts comprehensive animation metadata from a GIF stream.
 * @param {Uint8Array} bytes
 * @returns {AnimationProbeData|null}
 */
function getGifAnimation(bytes) {
  if (bytes.length < 13) return null;
  let offset = 13;
  const packed = bytes[10];
  if (packed & 0x80) offset += 3 * (1 << ((packed & 0x07) + 1));

  let frames = 0;
  let loopCount = 1;
  let hasLoop = false;
  let duration = 0;

  while (offset < bytes.length) {
    const block = bytes[offset];
    if (block === 0x3b) break;

    if (block === 0x21) {
      const ext = bytes[offset + 1];
      if (ext === 0xff && bytes[offset + 2] === 11) {
        if (
          matches(
            bytes,
            [0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30],
            offset + 3,
          )
        ) {
          const subSize = bytes[offset + 14];
          if (subSize === 3 && bytes[offset + 15] === 1) {
            loopCount = bytes[offset + 16] | (bytes[offset + 17] << 8);
            hasLoop = true;
          }
        }
      } else if (ext === 0xf9) {
        const delay = bytes[offset + 4] | (bytes[offset + 5] << 8);
        duration += delay * 10;
      }
      offset = skipGifSubBlocks(bytes, offset + 2);
    } else if (block === 0x2c) {
      frames += 1;
      const localPacked = bytes[offset + 8];
      offset += 11;
      if (localPacked & 0x80) offset += 3 * (1 << ((localPacked & 0x07) + 1));
      offset = skipGifSubBlocks(bytes, offset);
    } else {
      break;
    }
  }
  if (frames <= 1) return null;
  return { frames, loopCount: hasLoop ? loopCount : 1, duration };
}

/**
 * Extracts comprehensive animation metadata from a WebP stream.
 * @param {Uint8Array} bytes
 * @returns {AnimationProbeData|null}
 */
function getWebpAnimation(bytes) {
  let offset = 12;
  let frames = 0;
  let loopCount = 1;
  let duration = 0;
  let isAnimated = false;

  while (offset + 8 <= bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 8);
    const fourcc = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3],
    );
    const size = view.getUint32(4, true);
    const payload = offset + 8;

    if (fourcc === 'ANIM' && payload + 6 <= bytes.length) {
      isAnimated = true;
      loopCount = bytes[payload + 4] | (bytes[payload + 5] << 8);
    } else if (fourcc === 'ANMF' && payload + 15 <= bytes.length) {
      frames += 1;
      const dur = bytes[payload + 12] | (bytes[payload + 13] << 8) | (bytes[payload + 14] << 16);
      duration += dur;
    }
    offset += 8 + size + (size % 2);
  }
  if (!isAnimated || frames <= 1) return null;
  return { frames, loopCount, duration };
}

/**
 * Extracts comprehensive animation metadata from an APNG stream.
 * @param {Uint8Array} bytes
 * @returns {AnimationProbeData|null}
 */
function getApngAnimation(bytes) {
  let offset = 8;
  let frames = 0;
  let loopCount = 1;
  let duration = 0;
  let hasAcTL = false;

  while (offset + 8 <= bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 8);
    const size = view.getUint32(0);
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7],
    );
    const payload = offset + 8;

    if (type === 'acTL' && payload + 8 <= bytes.length) {
      hasAcTL = true;
      const acTLView = new DataView(bytes.buffer, bytes.byteOffset + payload, 8);
      frames = acTLView.getUint32(0);
      loopCount = acTLView.getUint32(4);
    } else if (type === 'fcTL' && payload + 26 <= bytes.length) {
      const fcTLView = new DataView(bytes.buffer, bytes.byteOffset + payload, 26);
      const delayNum = fcTLView.getUint16(20);
      const delayDen = fcTLView.getUint16(22) || 100;
      duration += Math.round((delayNum / delayDen) * 1000);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + size;
  }
  if (!hasAcTL || frames <= 1) return null;
  return { frames, loopCount, duration };
}

/**
 * Extracts comprehensive animation metadata from an AVIF (ISOBMFF) stream.
 * @param {Uint8Array} bytes
 * @returns {AnimationProbeData|null}
 */
function getAvifAnimation(bytes) {
  const reader = new TinyBufferReader(bytes);
  const end = reader.limit;

  // Encontra a caixa principal
  const moov = findBox(reader, 0, end, new Set(['moov']));
  if (!moov) return null;

  // Encontra o cabeçalho do filme (duração da animação)
  const mvhd = findBox(reader, moov.dataStart, moov.dataEnd, new Set(['mvhd']));
  let duration = 0;
  if (mvhd) {
    reader.seek(mvhd.dataStart);
    const version = reader.uint8();
    reader.skip(3);
    let timescale, dur;
    if (version === 1) {
      reader.skip(16);
      timescale = reader.uint32();
      const durBig = reader.bytes(8);
      dur = (durBig[4] << 24) | (durBig[5] << 16) | (durBig[6] << 8) | durBig[7];
    } else {
      reader.skip(8);
      timescale = reader.uint32();
      dur = reader.uint32();
    }
    if (timescale > 0) {
      duration = Math.round((dur / timescale) * 1000);
    }
  }

  // Mergulha pelas caixas container até chegar na tabela de tamanhos (stsz) para contar os frames
  const trak = findBox(reader, moov.dataStart, moov.dataEnd, new Set(['trak']));
  if (!trak) return null;

  const mdia = findBox(reader, trak.dataStart, trak.dataEnd, new Set(['mdia']));
  if (!mdia) return null;

  const minf = findBox(reader, mdia.dataStart, mdia.dataEnd, new Set(['minf']));
  if (!minf) return null;

  const stbl = findBox(reader, minf.dataStart, minf.dataEnd, new Set(['stbl']));
  if (!stbl) return null;

  const stsz = findBox(reader, stbl.dataStart, stbl.dataEnd, new Set(['stsz']));

  let frames = 0;
  if (stsz) {
    reader.seek(stsz.dataStart + 4);
    reader.uint32(); // sample_size
    frames = reader.uint32(); // sample_count
  }

  if (frames <= 1) return null;

  return { frames, loopCount: 0, duration };
}

/**
 * The format registry for web-supported images. The order matters: the first signature that matches wins.
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
    name: 'avif',
    mime: 'image/avif',
    sniff: (b) => matches(b, [0x66, 0x74, 0x79, 0x70], 4),
    parse: parseIsoBmff,
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
 * Reads the intrinsic dimensions and animation frames of a web image from its container header.
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
  /** @type {number} */
  #width = 0;
  /** @type {number} */
  #height = 0;
  /** @type {number} */
  #lastFrames = 0;

  finalize() {
    if (!this.#animated || !this.#format || !this.#resolved) {
      return null;
    }
    const animation = this.#extractAnimation();
    this.#buffer = new Uint8Array(0);
    return animation ? { animation } : null;
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
   * Helper interno para invocar o extrator correto baseado no formato.
   */
  #extractAnimation() {
    const name = this.#format?.name;
    if (name === 'gif') return getGifAnimation(this.#buffer);
    if (name === 'webp') return getWebpAnimation(this.#buffer);
    if (name === 'png') return getApngAnimation(this.#buffer);
    if (name === 'avif') return getAvifAnimation(this.#buffer);
    return null;
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
    if (this.#abandoned) return null;

    // Se já resolvemos a dimensão e sabemos que é uma imagem estática, descartamos o resto.
    if (this.#resolved && !this.#animated) {
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
      this.#animated = ['gif', 'webp', 'png', 'avif'].includes(this.#format.name);
    }

    // Se as dimensões já foram resolvidas e a imagem for animada, procuramos por novos frames.
    if (this.#resolved && this.#animated) {
      const anim = this.#extractAnimation();
      if (anim && anim.frames > this.#lastFrames) {
        this.#lastFrames = anim.frames;
        // Retornamos as dimensões conhecidas + a animação atualizada para o loader emitir
        return { width: this.#width, height: this.#height, animation: anim };
      }
      return null;
    }

    // PRIMEIRA RESOLUÇÃO DO HEADER:
    try {
      const size = this.#format.parse(new TinyBufferReader(this.#buffer));
      if (size) {
        this.#resolved = true;
        this.#width = size.width;
        this.#height = size.height;

        if (this.#animated) {
          const anim = this.#extractAnimation();
          if (anim) {
            size.animation = anim;
            this.#lastFrames = anim.frames;
          }
        } else {
          this.#buffer = new Uint8Array(0); // Libera memória imediata se for estática
        }
        return size;
      }
    } catch (error) {
      if (!(error instanceof TinyNeedMoreData)) throw error;
    }

    // Abandona a leitura apenas se o cabeçalho estourar o limite E a dimensão ainda não foi resolvida
    if (this.#buffer.length > this.#maxBytes && !this.#resolved) {
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
        if (format.sniff(this.#buffer)) return format;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export default TinyImageProbe;
