/**
 * @fileoverview Bounds-checked binary cursor shared by every media probe.
 * Every read either returns the requested value or throws {@link TinyNeedMoreData},
 * which is what makes the incremental parsing possible: the probe catches the
 * sentinel, keeps the buffered bytes and retries once the next chunk arrives.
 */

/**
 * Signals that the buffer does not hold enough bytes to satisfy a read.
 * It is a control-flow signal, not a failure.
 * @augments Error
 */
export class TinyNeedMoreData extends Error {
  /**
   * @param {string} [message] - The error message.
   */
  constructor(message = 'The buffer does not hold enough bytes to satisfy the read.') {
    super(message);
    this.name = 'TinyNeedMoreData';
  }
}

/**
 * A forward-only, bounds-checked cursor over a {@link Uint8Array}.
 */
export default class TinyBufferReader {
  /** @type {Uint8Array} */
  #bytes;
  /** @type {DataView} */
  #view;
  /** @type {number} */
  #offset;
  /** @type {number} */
  #limit;

  /**
   * @param {Uint8Array} bytes - The backing buffer.
   * @param {number} [offset] - The first readable byte.
   * @param {number} [limit] - The byte after the last readable byte.
   * @throws {TypeError} If `bytes` is not a Uint8Array.
   * @throws {RangeError} If `offset` or `limit` is out of bounds.
   */
  constructor(bytes, offset = 0, limit = bytes.length) {
    if (!(bytes instanceof Uint8Array)) {
      throw new TypeError('The "bytes" argument must be a Uint8Array.');
    }
    if (!Number.isInteger(offset) || offset < 0 || offset > bytes.length) {
      throw new RangeError('The "offset" argument is out of bounds.');
    }
    if (!Number.isInteger(limit) || limit < offset || limit > bytes.length) {
      throw new RangeError('The "limit" argument is out of bounds.');
    }
    this.#bytes = bytes;
    this.#view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.#offset = offset;
    this.#limit = limit;
  }

  /** @returns {number} The absolute cursor position. */
  get offset() {
    return this.#offset;
  }

  /** @returns {number} The byte after the last readable byte. */
  get limit() {
    return this.#limit;
  }

  /** @returns {number} The number of readable bytes left. */
  get remaining() {
    return this.#limit - this.#offset;
  }

  /** @returns {boolean} True when the cursor reached the limit. */
  get eof() {
    return this.#offset >= this.#limit;
  }

  /** @returns {Uint8Array} The full backing buffer. */
  get buffer() {
    return this.#bytes;
  }

  /**
   * @param {number} count - The number of bytes to test.
   * @returns {boolean} True when at least `count` bytes are readable.
   */
  has(count) {
    return count >= 0 && this.#offset + count <= this.#limit;
  }

  /**
   * @param {number} count - The number of bytes required.
   * @returns {void}
   * @throws {TinyNeedMoreData} If fewer than `count` bytes are readable.
   */
  #require(count) {
    if (!this.has(count)) {
      throw new TinyNeedMoreData();
    }
  }

  /**
   * @param {number} position - The absolute position to move to.
   * @returns {TinyBufferReader} The current instance for chaining.
   * @throws {RangeError} If `position` is not a positive integer.
   */
  seek(position) {
    if (!Number.isInteger(position) || position < 0) {
      throw new RangeError('The "position" argument must be a positive integer.');
    }
    this.#offset = position;
    return this;
  }

  /**
   * @param {number} count - The number of bytes to skip.
   * @returns {TinyBufferReader} The current instance for chaining.
   * @throws {TinyNeedMoreData} If fewer than `count` bytes are readable.
   */
  skip(count) {
    this.#require(count);
    this.#offset += count;
    return this;
  }

  /** @returns {number} The next unsigned 8-bit integer. */
  uint8() {
    this.#require(1);
    return this.#view.getUint8(this.#offset++);
  }

  /** @returns {number} The next unsigned 16-bit big-endian integer. */
  uint16() {
    this.#require(2);
    const value = this.#view.getUint16(this.#offset);
    this.#offset += 2;
    return value;
  }

  /** @returns {number} The next unsigned 16-bit little-endian integer. */
  uint16le() {
    this.#require(2);
    const value = this.#view.getUint16(this.#offset, true);
    this.#offset += 2;
    return value;
  }

  /** @returns {number} The next unsigned 24-bit big-endian integer. */
  uint24() {
    this.#require(3);
    const value =
      (this.#bytes[this.#offset] << 16) |
      (this.#bytes[this.#offset + 1] << 8) |
      this.#bytes[this.#offset + 2];
    this.#offset += 3;
    return value;
  }

  /** @returns {number} The next unsigned 32-bit big-endian integer. */
  uint32() {
    this.#require(4);
    const value = this.#view.getUint32(this.#offset);
    this.#offset += 4;
    return value;
  }

  /** @returns {number} The next unsigned 32-bit little-endian integer. */
  uint32le() {
    this.#require(4);
    const value = this.#view.getUint32(this.#offset, true);
    this.#offset += 4;
    return value;
  }

  /** @returns {number} The next signed 32-bit little-endian integer. */
  int32le() {
    this.#require(4);
    const value = this.#view.getInt32(this.#offset, true);
    this.#offset += 4;
    return value;
  }

  /**
   * Reads an unsigned 64-bit big-endian integer as a Number. Values above 2^53
   * lose precision, which is acceptable for the box sizes and offsets we read.
   * @returns {number} The decoded value.
   */
  uint64() {
    const high = this.uint32();
    const low = this.uint32();
    return high * 0x100000000 + low;
  }

  /**
   * @param {number} length - The number of bytes to read.
   * @returns {string} The decoded Latin-1 string.
   */
  ascii(length) {
    this.#require(length);
    let value = '';
    for (let i = 0; i < length; i += 1) {
      value += String.fromCharCode(this.#bytes[this.#offset + i]);
    }
    this.#offset += length;
    return value;
  }

  /**
   * @param {number} length - The number of bytes to read.
   * @returns {Uint8Array} A view over the requested bytes.
   */
  bytes(length) {
    this.#require(length);
    const slice = this.#bytes.subarray(this.#offset, this.#offset + length);
    this.#offset += length;
    return slice;
  }
}
