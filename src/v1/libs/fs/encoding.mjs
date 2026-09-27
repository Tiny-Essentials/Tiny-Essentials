/**
 * @file Byte/string conversion helpers shared by every {@link TinyFSCore} backend.
 */

/**
 * Converts a byte array into a base64 string.
 *
 * @param {Uint8Array} bytes Source bytes.
 * @returns {string} The base64 representation.
 */
export const bytesToBase64 = (bytes) => {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
};

/**
 * Converts a base64 string into a byte array.
 *
 * @param {string} value Source string.
 * @returns {Uint8Array} The decoded bytes.
 */
export const base64ToBytes = (value) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

/**
 * Converts a byte array into a lowercase hexadecimal string.
 *
 * @param {Uint8Array} bytes Source bytes.
 * @returns {string} The hexadecimal representation.
 */
export const bytesToHex = (bytes) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

/**
 * Converts a hexadecimal string into a byte array.
 *
 * @param {string} value Source string.
 * @returns {Uint8Array} The decoded bytes.
 * @throws {TypeError} When the string length is odd.
 */
export const hexToBytes = (value) => {
  if (value.length % 2 !== 0) {
    throw new TypeError('The "hex" encoded string must have an even length');
  }
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
};

/**
 * Decodes a byte array using the requested encoding.
 *
 * @param {Uint8Array} bytes Source bytes.
 * @param {string | null} encoding Target encoding, or `null` for binary.
 * @returns {string | Uint8Array} The decoded payload.
 */
export const decodeBytes = (bytes, encoding) => {
  if (encoding === null) {
    return bytes;
  }
  if (encoding === 'base64') {
    return bytesToBase64(bytes);
  }
  if (encoding === 'hex') {
    return bytesToHex(bytes);
  }
  return new TextDecoder('utf-8').decode(bytes);
};

/**
 * Converts supported input values into a byte array.
 *
 * @param {string | Uint8Array | ArrayBuffer | ArrayBufferView} data Source payload.
 * @param {string | null} encoding Encoding used when `data` is a string.
 * @returns {Uint8Array} The encoded bytes.
 * @throws {TypeError} When the payload type is not supported.
 */
export const toUint8Array = (data, encoding) => {
  if (typeof data === 'string') {
    if (encoding === 'base64') {
      return base64ToBytes(data);
    }
    if (encoding === 'hex') {
      return hexToBytes(data);
    }
    return new TextEncoder().encode(data);
  }
  if (data instanceof Uint8Array) {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  throw new TypeError('The "data" argument must be a string, an ArrayBuffer or an ArrayBufferView');
};
