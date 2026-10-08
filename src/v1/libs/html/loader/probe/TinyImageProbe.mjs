/**
 * @fileoverview Probes the intrinsic dimensions of an image by parsing its
 * container header. It supports PNG, JPEG, GIF, WebP and BMP.
 *
 * The probe is incremental: it buffers the chunks it receives and returns
 * `null` until it has seen enough of the header to resolve the dimensions. It
 * never decodes a frame, so it resolves after a few hundred bytes instead of
 * waiting for the whole file.
 */
/**
 * @typedef {Object} ImageProbeSize
 * @property {number} width - The display width in pixels.
 * @property {number} height - The display height in pixels.
 */
/**
 * The largest header the probe buffers before giving up.
 * @type {number}
 */
const MAX_HEADER_BYTES = 64 * 1024;
/**
 * The PNG signature, used to skip the leading magic bytes.
 * @type {readonly number[]}
 */
const PNG_SIGNATURE = Object.freeze([0x89, 0x50, 0x4e, 0x47]);
/**
 * The JPEG start-of-image marker.
 * @type {readonly number[]}
 */
const JPEG_SIGNATURE = Object.freeze([0xff, 0xd8, 0xff]);
/**
 * The GIF87a and GIF89a signature prefix.
 * @type {readonly number[]}
 */
const GIF_SIGNATURE = Object.freeze([0x47, 0x49, 0x46, 0x38]);
/**
 * The RIFF container signature used by WebP.
 * @type {readonly number[]}
 */
const RIFF_SIGNATURE = Object.freeze([0x52, 0x49, 0x46, 0x46]);
/**
 * The BMP signature.
 * @type {readonly number[]}
 */
const BMP_SIGNATURE = Object.freeze([0x42, 0x4d]);
/**
 * Reads the intrinsic dimensions of an image from its container header.
 */
class TinyImageProbe {
  /** @type {Uint8Array} */
  #buffer = new Uint8Array(0);
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
    this.#buffer = new Uint8Array(0);
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
    const size = this.#parse();
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
   * Dispatches to the parser that matches the detected signature.
   * @returns {ImageProbeSize|null} The dimensions, or null when more data is needed.
   */
  #parse() {
    if (this.#startsWith(PNG_SIGNATURE)) {
      return this.#parsePng();
    }
    if (this.#startsWith(JPEG_SIGNATURE)) {
      return this.#parseJpeg();
    }
    if (this.#startsWith(GIF_SIGNATURE)) {
      return this.#parseGif();
    }
    if (this.#startsWith(RIFF_SIGNATURE)) {
      return this.#parseWebp();
    }
    if (this.#startsWith(BMP_SIGNATURE)) {
      return this.#parseBmp();
    }
    return null;
  }
  /**
   * Checks whether the buffered header starts with the given signature.
   * @param {readonly number[]} signature - The bytes to match.
   * @returns {boolean} True when the buffer starts with the signature.
   */
  #startsWith(signature) {
    if (this.#buffer.length < signature.length) {
      return false;
    }
    return signature.every((byte, index) => this.#buffer[index] === byte);
  }
  /**
   * @returns {DataView} A view over the buffered header.
   */
  #view() {
    return new DataView(this.#buffer.buffer, this.#buffer.byteOffset, this.#buffer.length);
  }
  /**
   * Reads the IHDR chunk of a PNG stream.
   * @returns {ImageProbeSize|null} The dimensions, or null when the header is incomplete.
   */
  #parsePng() {
    if (this.#buffer.length < 24) {
      return null;
    }
    const view = this.#view();
    const width = view.getUint32(16);
    const height = view.getUint32(20);
    return width > 0 && height > 0 ? { width, height } : null;
  }
  /**
   * Reads the logical screen descriptor of a GIF stream.
   * @returns {ImageProbeSize|null} The dimensions, or null when the header is incomplete.
   */
  #parseGif() {
    if (this.#buffer.length < 10) {
      return null;
    }
    const view = this.#view();
    const width = view.getUint16(6, true);
    const height = view.getUint16(8, true);
    return width > 0 && height > 0 ? { width, height } : null;
  }
  /**
   * Reads the DIB header of a BMP stream.
   * @returns {ImageProbeSize|null} The dimensions, or null when the header is incomplete.
   */
  #parseBmp() {
    if (this.#buffer.length < 26) {
      return null;
    }
    const view = this.#view();
    const width = view.getInt32(18, true);
    const height = Math.abs(view.getInt32(22, true));
    return width > 0 && height > 0 ? { width, height } : null;
  }
  /**
   * Reads the VP8, VP8L or VP8X header of a WebP stream.
   * @returns {ImageProbeSize|null} The dimensions, or null when the header is incomplete.
   */
  #parseWebp() {
    if (this.#buffer.length < 30) {
      return null;
    }
    const view = this.#view();
    const tag = String.fromCharCode(...this.#buffer.subarray(12, 16));
    if (tag === 'VP8X') {
      const width = 1 + (view.getUint8(24) | (view.getUint8(25) << 8) | (view.getUint8(26) << 16));
      const height = 1 + (view.getUint8(27) | (view.getUint8(28) << 8) | (view.getUint8(29) << 16));
      return { width, height };
    }
    if (tag === 'VP8 ') {
      return {
        width: view.getUint16(26, true) & 0x3fff,
        height: view.getUint16(28, true) & 0x3fff,
      };
    }
    if (tag === 'VP8L') {
      const bits = view.getUint32(21, true);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    return null;
  }
  /**
   * Walks the JPEG segments looking for a start-of-frame marker.
   * @returns {ImageProbeSize|null} The dimensions, or null when more data is needed.
   */
  #parseJpeg() {
    const buffer = this.#buffer;
    let offset = 2;
    while (offset + 1 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      if (marker === 0xff) {
        offset += 1;
        continue;
      }
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
        offset += 2;
        continue;
      }
      if (offset + 3 >= buffer.length) {
        return null;
      }
      if (marker === 0xda) {
        return null;
      }
      const isStartOfFrame =
        marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isStartOfFrame) {
        if (offset + 8 >= buffer.length) {
          return null;
        }
        return {
          height: (buffer[offset + 5] << 8) | buffer[offset + 6],
          width: (buffer[offset + 7] << 8) | buffer[offset + 8],
        };
      }
      offset += 2 + ((buffer[offset + 2] << 8) | buffer[offset + 3]);
    }
    return null;
  }
}
export default TinyImageProbe;
