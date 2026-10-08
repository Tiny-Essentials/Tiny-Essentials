/**
 * @fileoverview Probes the intrinsic dimensions of a video stream by parsing
 * the container header. It supports the ISO base media file format (MP4, M4V,
 * MOV) and the Matroska/WebM container.
 *
 * The probe is incremental: it buffers the chunks it receives and returns
 * `null` until it has seen enough of the header to resolve the dimensions. It
 * never decodes a frame, so it works for codecs the browser cannot play.
 */

/**
 * @typedef {Object} MediaProbeSize
 * @property {number} width - The display width in pixels.
 * @property {number} height - The display height in pixels.
 */

/**
 * The largest header the probe buffers before giving up. A `moov` box that has
 * not started after 8 MB is treated as "not present", which is the case for
 * non-faststart files whose metadata lives at the end of the file.
 * @type {number}
 */
const MAX_HEADER_BYTES = 8 * 1024 * 1024;

/**
 * The EBML element identifiers the WebM parser descends into.
 * @type {ReadonlySet<number>}
 */
const WEBM_CONTAINERS = new Set([0x18538067, 0x1654ae6b, 0xae, 0xe0]);

/**
 * Reads the intrinsic dimensions of a video stream from its container header.
 */
class TinyMediaProbe {
  /** @type {Uint8Array} */
  #buffer = new Uint8Array(0);
  /** @type {'mp4'|'webm'} */
  #format;
  /** @type {boolean} */
  #resolved = false;
  /** @type {boolean} */
  #abandoned = false;

  /**
   * @param {string} type - The MIME type from the response headers.
   * @throws {TypeError} If `type` is not a string.
   */
  constructor(type) {
    if (typeof type !== 'string') {
      throw new TypeError('The "type" argument must be a string.');
    }
    const mime = type.split(';')[0].trim().toLowerCase();
    this.#format = mime.includes('webm') || mime.includes('matroska') ? 'webm' : 'mp4';
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

    const size = this.#format === 'webm' ? this.#parseWebm() : this.#parseMp4();
    if (size) {
      this.#resolved = true;
      this.#buffer = new Uint8Array(0);
      return size;
    }
    if (this.#buffer.length > MAX_HEADER_BYTES) {
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
   * Walks the top-level MP4 boxes looking for the movie header.
   * @returns {MediaProbeSize|null} The dimensions, or null when more data is needed.
   */
  #parseMp4() {
    let offset = 0;
    while (offset + 8 <= this.#buffer.length) {
      const header = this.#readBoxHeader(offset);
      if (!header) {
        return null;
      }
      if (offset + header.size > this.#buffer.length) {
        return null;
      }
      if (header.type === 'moov') {
        const size = this.#findTrak(offset + header.headerSize, offset + header.size);
        if (size) {
          return size;
        }
      }
      offset += header.size;
    }
    return null;
  }

  /**
   * Finds the first `trak` with a non-zero display size.
   * @param {number} start - The first byte of the `moov` payload.
   * @param {number} end - The byte after the `moov` payload.
   * @returns {MediaProbeSize|null} The dimensions, or null when not found.
   */
  #findTrak(start, end) {
    let offset = start;
    while (offset + 8 <= end) {
      const header = this.#readBoxHeader(offset);
      if (!header || header.size < 8) {
        return null;
      }
      if (header.type === 'trak') {
        const size = this.#findTkhd(offset + header.headerSize, offset + header.size);
        if (size) {
          return size;
        }
      }
      offset += header.size;
    }
    return null;
  }

  /**
   * Reads the display size from a `tkhd` box.
   * @param {number} start - The first byte of the `trak` payload.
   * @param {number} end - The byte after the `trak` payload.
   * @returns {MediaProbeSize|null} The dimensions, or null when not found.
   */
  #findTkhd(start, end) {
    let offset = start;
    while (offset + 8 <= end) {
      const header = this.#readBoxHeader(offset);
      if (!header || header.size < 8) {
        return null;
      }
      if (header.type === 'tkhd') {
        const version = this.#buffer[offset + 8];
        const cursor = offset + (version === 1 ? 96 : 84);
        if (cursor + 8 > this.#buffer.length) {
          return null;
        }
        const view = new DataView(this.#buffer.buffer, this.#buffer.byteOffset + cursor, 8);
        const width = view.getUint32(0) / 65536;
        const height = view.getUint32(4) / 65536;
        if (width > 0 && height > 0) {
          return { width, height };
        }
      }
      offset += header.size;
    }
    return null;
  }

  /**
   * Reads the size and type of the box that starts at `offset`.
   * @param {number} offset - The first byte of the box.
   * @returns {{ size: number, type: string, headerSize: number }|null} The box header, or null when it is incomplete.
   */
  #readBoxHeader(offset) {
    if (offset + 8 > this.#buffer.length) {
      return null;
    }
    const view = new DataView(this.#buffer.buffer, this.#buffer.byteOffset + offset);
    let size = view.getUint32(0);
    const type = String.fromCharCode(
      this.#buffer[offset + 4],
      this.#buffer[offset + 5],
      this.#buffer[offset + 6],
      this.#buffer[offset + 7],
    );
    let headerSize = 8;
    if (size === 1) {
      if (offset + 16 > this.#buffer.length) {
        return null;
      }
      size = view.getUint32(8) * 0x100000000 + view.getUint32(12);
      headerSize = 16;
    } else if (size === 0) {
      size = this.#buffer.length - offset;
    }
    return { size, type, headerSize };
  }

  /**
   * Walks the EBML tree looking for the video dimensions.
   * @returns {MediaProbeSize|null} The dimensions, or null when more data is needed.
   */
  #parseWebm() {
    return this.#scanWebm(0, this.#buffer.length);
  }

  /**
   * Recursively scans an EBML range.
   * @param {number} start - The first byte of the range.
   * @param {number} end - The byte after the range.
   * @returns {MediaProbeSize|null} The dimensions, or null when not found.
   */
  #scanWebm(start, end) {
    let offset = start;
    while (offset < end) {
      const id = this.#readVint(offset, true);
      if (!id) {
        return null;
      }
      const size = this.#readVint(offset + id.length, false);
      if (!size) {
        return null;
      }
      const dataStart = offset + id.length + size.length;
      const dataEnd = dataStart + size.value;
      if (dataEnd > end) {
        return null;
      }
      if (id.value === 0xe0) {
        return this.#readWebmVideo(dataStart, dataEnd);
      }
      if (WEBM_CONTAINERS.has(id.value)) {
        const result = this.#scanWebm(dataStart, dataEnd);
        if (result) {
          return result;
        }
      }
      offset = dataEnd;
    }
    return null;
  }

  /**
   * Reads the `PixelWidth` and `PixelHeight` of a WebM `Video` element.
   * @param {number} start - The first byte of the `Video` payload.
   * @param {number} end - The byte after the `Video` payload.
   * @returns {MediaProbeSize|null} The dimensions, or null when not found.
   */
  #readWebmVideo(start, end) {
    let width = 0;
    let height = 0;
    let offset = start;
    while (offset < end) {
      const id = this.#readVint(offset, true);
      if (!id) {
        return null;
      }
      const size = this.#readVint(offset + id.length, false);
      if (!size) {
        return null;
      }
      const dataStart = offset + id.length + size.length;
      const dataEnd = dataStart + size.value;
      if (dataEnd > end) {
        return null;
      }
      if (id.value === 0xb0) {
        width = this.#readUint(dataStart, size.value);
      } else if (id.value === 0xba) {
        height = this.#readUint(dataStart, size.value);
      }
      offset = dataEnd;
    }
    return width > 0 && height > 0 ? { width, height } : null;
  }

  /**
   * Reads an EBML variable-length integer.
   * @param {number} offset - The first byte of the integer.
   * @param {boolean} keepMarker - Whether the length marker bit is preserved.
   * @returns {{ value: number, length: number }|null} The decoded value and its byte length, or null when incomplete.
   */
  #readVint(offset, keepMarker) {
    if (offset >= this.#buffer.length) {
      return null;
    }
    const first = this.#buffer[offset];
    if (first === 0) {
      return null;
    }
    let length = 1;
    let mask = 0x80;
    while (length <= 8 && !(first & mask)) {
      mask >>= 1;
      length += 1;
    }
    if (length > 8 || offset + length > this.#buffer.length) {
      return null;
    }
    let value = keepMarker ? first : first & (mask - 1);
    for (let i = 1; i < length; i += 1) {
      value = value * 256 + this.#buffer[offset + i];
    }
    return { value, length };
  }

  /**
   * Reads a big-endian unsigned integer.
   * @param {number} offset - The first byte of the integer.
   * @param {number} length - The number of bytes to read.
   * @returns {number} The decoded value.
   */
  #readUint(offset, length) {
    let value = 0;
    for (let i = 0; i < length; i += 1) {
      value = value * 256 + this.#buffer[offset + i];
    }
    return value;
  }
}

export default TinyMediaProbe;
