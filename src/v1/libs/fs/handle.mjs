/**
 * @file Thin facade returned by {@link FS#open}.
 */

import { createFileSystemError } from './error.mjs';

/**
 * Handle returned by `open()`, shaped like `node:fs/promises.FileHandle`.
 *
 * The handle is a facade over the originating {@link FS} instance.
 * Every method delegates back to the file system, so no file descriptor is
 * actually held open.
 */
export class FileHandle {
  /** @type {import('./index.mjs').default} */
  #fs;

  /** @type {string} */
  #path;

  /** @type {string} */
  #flags;

  /** @type {boolean} */
  #closed;

  /**
   * @param {import('./index.mjs').default} fs Originating file system.
   * @param {string} path Absolute path of the opened file.
   * @param {string} flags Access mode the handle was opened with.
   */
  constructor(fs, path, flags) {
    this.#fs = fs;
    this.#path = path;
    this.#flags = flags;
    this.#closed = false;
  }

  /** @returns {string} Absolute path of the opened file. */
  get path() {
    return this.#path;
  }

  /** @returns {string} Access mode the handle was opened with. */
  get flags() {
    return this.#flags;
  }

  /** @returns {boolean} `true` once `close()` has been awaited. */
  get closed() {
    return this.#closed;
  }

  /**
   * @param {import('./index.mjs').TReadFileOptions} [options] Read options.
   * @returns {Promise<string | Uint8Array>} The file contents.
   */
  async readFile(options) {
    this.#assertOpen();
    return this.#fs.readFile(this.#path, options);
  }

  /**
   * @param {string | Uint8Array | ArrayBuffer} data Payload to persist.
   * @param {import('./index.mjs').TWriteFileOptions} [options] Write options.
   * @returns {Promise<void>} Resolves once the payload is committed.
   */
  async writeFile(data, options) {
    this.#assertOpen();
    return this.#fs.writeFile(this.#path, data, options);
  }

  /**
   * @param {string | Uint8Array | ArrayBuffer} data Payload to append.
   * @param {import('./index.mjs').TWriteFileOptions} [options] Write options.
   * @returns {Promise<void>} Resolves once the payload is committed.
   */
  async appendFile(data, options) {
    this.#assertOpen();
    return this.#fs.appendFile(this.#path, data, options);
  }

  /**
   * @returns {Promise<import('./stats.mjs').Stats>} A fresh snapshot of the file metadata.
   */
  async stat() {
    this.#assertOpen();
    return this.#fs.stat(this.#path);
  }

  /**
   * @param {number} [length] Target length in bytes.
   * @returns {Promise<void>} Resolves once the file is truncated.
   */
  async truncate(length) {
    this.#assertOpen();
    return this.#fs.truncate(this.#path, length);
  }

  /**
   * @returns {Promise<void>} Resolves once the handle is released.
   */
  async close() {
    this.#closed = true;
  }

  /**
   * @returns {void}
   * @throws {Error} When the handle has already been closed.
   */
  #assertOpen() {
    if (this.#closed) {
      throw createFileSystemError('EBADF', 'read', this.#path, 'file handle is closed');
    }
  }
}
