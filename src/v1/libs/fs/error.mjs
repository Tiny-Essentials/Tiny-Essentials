/**
 * @file Errno-style error helpers shared by every {@link TinyFSCore} backend.
 *
 * These helpers are intentionally dependency free so they can be imported from
 * the abstract class, from concrete backends and from user code without
 * creating circular imports.
 */

import { SUPPORTED_ENCODINGS } from './constants.mjs';

/** @type {string} */
const NULL_BYTE = '\u0000';

/**
 * @typedef {Object} FileSystemErrorProperties
 * @property {string} code POSIX error code, e.g. `ENOENT`.
 * @property {string} errno Alias of `code`, mirrors Node.js.
 * @property {string} syscall Name of the originating operation.
 * @property {string} path Path the operation was applied to.
 */

/**
 * @typedef {Error & FileSystemErrorProperties} FileSystemError
 */

/**
 * Builds an errno-style error that matches the shape produced by Node.js.
 *
 * @param {string} code POSIX error code, e.g. `ENOENT`.
 * @param {string} syscall Name of the originating operation.
 * @param {string} targetPath Path the operation was applied to.
 * @param {string} [detail] Extra human readable context.
 * @returns {FileSystemError} The formatted error.
 */
export const createFileSystemError = (code, syscall, targetPath, detail = '') => {
  const suffix = detail.length > 0 ? `, ${detail}` : '';
  /** @type {FileSystemError} */
  const error = /** @type {FileSystemError} */ (
    new Error(`${code}: ${syscall} '${targetPath}'${suffix}`)
  );
  error.code = code;
  error.errno = code;
  error.syscall = syscall;
  error.path = targetPath;
  return error;
};

/**
 * Translates a `DOMException` thrown by a Web API into an errno-style error.
 *
 * @param {unknown} error The value caught from a browser call.
 * @param {string} syscall Name of the originating operation.
 * @param {string} targetPath Path the operation was applied to.
 * @param {string} [mismatchCode] Error code used when the entry exists with the wrong type.
 * @returns {FileSystemError | Error} An errno-style error.
 */
export const toFileSystemError = (error, syscall, targetPath, mismatchCode = 'ENOTDIR') => {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    switch (error.name) {
      case 'NotFoundError':
        return createFileSystemError('ENOENT', syscall, targetPath);
      case 'TypeMismatchError':
        return createFileSystemError(mismatchCode, syscall, targetPath);
      case 'InvalidModificationError':
        return createFileSystemError('ENOTEMPTY', syscall, targetPath);
      case 'NoModificationAllowedError':
        return createFileSystemError('EBUSY', syscall, targetPath);
      case 'NotAllowedError':
        return createFileSystemError('EACCES', syscall, targetPath);
      default:
        return createFileSystemError('EIO', syscall, targetPath, error.message);
    }
  }
  return error instanceof Error ? error : new Error(String(error));
};

/**
 * Validates that a value is a usable path string.
 *
 * @param {unknown} value Candidate value.
 * @param {string} argumentName Name used in the thrown message.
 * @returns {string} The validated path.
 * @throws {TypeError} When the value is not a string or contains a null byte.
 * @throws {Error} When the value is empty.
 */
export const assertPath = (value, argumentName) => {
  if (typeof value !== 'string') {
    const received = value === null ? 'null' : typeof value;
    throw new TypeError(
      `The "${argumentName}" argument must be of type string. Received ${received}`,
    );
  }
  if (value.length === 0) {
    throw createFileSystemError('ENOENT', 'open', value, 'path must not be empty');
  }
  if (value.includes(NULL_BYTE)) {
    throw new TypeError('The "path" argument must not contain null bytes');
  }
  return value;
};

/**
 * Validates that a value is a plain options object.
 *
 * @param {unknown} value Candidate value.
 * @param {string} functionName Name used in the thrown message.
 * @returns {Record<string, unknown>} The validated options object.
 * @throws {TypeError} When the value is not a plain object.
 */
export const assertOptionsObject = (value, functionName) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    const received = value === null ? 'null' : Array.isArray(value) ? 'Array' : typeof value;
    throw new TypeError(
      `The "options" argument must be of type object. Received ${received} in ${functionName}()`,
    );
  }
  return /** @type {Record<string, unknown>} */ (value);
};

/**
 * Validates an encoding identifier.
 *
 * @param {unknown} value Candidate encoding.
 * @param {string} functionName Name used in the thrown message.
 * @returns {string | null} The validated encoding, or `null` for binary mode.
 * @throws {TypeError} When the encoding is not supported.
 */
export const assertEncoding = (value, functionName) => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string' || !SUPPORTED_ENCODINGS.includes(value)) {
    throw new TypeError(
      `The "encoding" option must be one of ${SUPPORTED_ENCODINGS.join(', ')}. ` +
        `Received ${String(value)} in ${functionName}()`,
    );
  }
  return value;
};

/**
 * Validates a POSIX permission bitmask.
 *
 * @param {unknown} value Candidate mode.
 * @param {string} argumentName Name used in the thrown message.
 * @returns {number} The validated mode.
 * @throws {TypeError} When the value is not an integer.
 * @throws {RangeError} When the value is outside the 12-bit range.
 */
export const assertMode = (value, argumentName) => {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new TypeError(`The "${argumentName}" argument must be an integer`);
  }
  if (value < 0 || value > 0o7777) {
    throw new RangeError(`The "${argumentName}" argument must be between 0o0000 and 0o7777`);
  }
  return value;
};

/**
 * Validates a non-negative integer.
 *
 * @param {unknown} value Candidate value.
 * @param {string} argumentName Name used in the thrown message.
 * @returns {number} The validated integer.
 * @throws {TypeError} When the value is not an integer.
 * @throws {RangeError} When the value is negative.
 */
export const assertInteger = (value, argumentName) => {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new TypeError(`The "${argumentName}" argument must be an integer`);
  }
  if (value < 0) {
    throw new RangeError(`The "${argumentName}" argument must not be negative`);
  }
  return value;
};
