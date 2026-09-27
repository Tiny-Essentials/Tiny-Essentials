/**
 * @file Immutable metadata snapshots returned by {@link FS#stat}.
 */

import { FILE_TYPE } from './constants.mjs';

/**
 * @typedef {'file' | 'directory' | 'symbolic-link'} FSEntryKind
 */

/**
 * @typedef {Object} FSStatDescriptor
 * @property {string} name Base name of the entry.
 * @property {FSEntryKind} kind Entry kind.
 * @property {number} size Size in bytes. Ignored for directories.
 * @property {number} mtimeMs Last modification time in milliseconds since the epoch.
 */

/**
 * @typedef {Object} FSDirectoryEntry
 * @property {string} name Base name of the entry.
 * @property {FSEntryKind} kind Entry kind.
 */

/**
 * @typedef {Object} FSMetadata
 * @property {number | null} mode POSIX permission bits, or `null` when unset.
 * @property {number | null} uid Owner user id.
 * @property {number | null} gid Owner group id.
 * @property {number | null} atimeMs Last access time in milliseconds since the epoch.
 * @property {number | null} mtimeMs Last modification time in milliseconds since the epoch.
 * @property {number | null} birthtimeMs Creation time in milliseconds since the epoch.
 */

/**
 * @typedef {Object} StatsOptions
 * @property {string} path Absolute path of the entry.
 * @property {string} name Base name of the entry.
 * @property {FSEntryKind} kind Entry kind.
 * @property {number} size Size in bytes.
 * @property {number} mode POSIX permission bits.
 * @property {number} uid Owner user id.
 * @property {number} gid Owner group id.
 * @property {number} atimeMs Last access time in milliseconds since the epoch.
 * @property {number} mtimeMs Last modification time in milliseconds since the epoch.
 * @property {number} birthtimeMs Creation time in milliseconds since the epoch.
 * @property {number} ino Inode number. `0` when the backend has no inodes.
 */

/**
 * Immutable snapshot of a file system entry, shaped like `node:fs.Stats`.
 */
export class Stats {
  /** @type {StatsOptions} */
  #options;

  /**
   * @param {StatsOptions} options Snapshot values.
   */
  constructor(options) {
    this.#options = Object.freeze({ ...options });
  }

  /** @returns {string} Absolute path of the entry. */
  get path() {
    return this.#options.path;
  }

  /** @returns {string} Base name of the entry. */
  get name() {
    return this.#options.name;
  }

  /** @returns {number} Size in bytes, or `0` for directories. */
  get size() {
    return this.#options.kind === 'directory' ? 0 : this.#options.size;
  }

  /** @returns {number} POSIX permission bits. */
  get mode() {
    return this.#options.mode;
  }

  /** @returns {number} Owner user id. */
  get uid() {
    return this.#options.uid;
  }

  /** @returns {number} Owner group id. */
  get gid() {
    return this.#options.gid;
  }

  /** @returns {number} Inode number, or `0` when unsupported. */
  get ino() {
    return this.#options.ino;
  }

  /** @returns {number} Number of hard links. Always `1`. */
  get nlink() {
    return 1;
  }

  /** @returns {number} Last access time in milliseconds since the epoch. */
  get atimeMs() {
    return this.#options.atimeMs;
  }

  /** @returns {number} Last modification time in milliseconds since the epoch. */
  get mtimeMs() {
    return this.#options.mtimeMs;
  }

  /** @returns {number} Creation time in milliseconds since the epoch. */
  get birthtimeMs() {
    return this.#options.birthtimeMs;
  }

  /** @returns {Date} Last access time. */
  get atime() {
    return new Date(this.#options.atimeMs);
  }

  /** @returns {Date} Last modification time. */
  get mtime() {
    return new Date(this.#options.mtimeMs);
  }

  /** @returns {Date} Change time. Alias of `mtime`. */
  get ctime() {
    return new Date(this.#options.mtimeMs);
  }

  /** @returns {Date} Creation time. */
  get birthtime() {
    return new Date(this.#options.birthtimeMs);
  }

  /** @returns {boolean} `true` when the entry is a regular file. */
  isFile() {
    return this.#options.kind === 'file';
  }

  /** @returns {boolean} `true` when the entry is a directory. */
  isDirectory() {
    return this.#options.kind === 'directory';
  }

  /** @returns {boolean} `true` when the entry is a symbolic link. */
  isSymbolicLink() {
    return this.#options.kind === 'symbolic-link';
  }

  /** @returns {boolean} Always `false`. */
  isBlockDevice() {
    return false;
  }

  /** @returns {boolean} Always `false`. */
  isCharacterDevice() {
    return false;
  }

  /** @returns {boolean} Always `false`. */
  isFIFO() {
    return false;
  }

  /** @returns {boolean} Always `false`. */
  isSocket() {
    return false;
  }

  /** @returns {number} The `st_mode` field, including the file type bits. */
  get modeWithType() {
    const type = this.isDirectory() ? FILE_TYPE.DIRECTORY : FILE_TYPE.FILE;
    return type | this.#options.mode;
  }
}

/**
 * Directory entry returned by `readdir` when `withFileTypes` is `true`.
 */
export class Dirent {
  /** @type {string} */
  #name;

  /** @type {FSEntryKind} */
  #kind;

  /**
   * @param {string} name Base name of the entry.
   * @param {FSEntryKind} kind Entry kind.
   */
  constructor(name, kind) {
    this.#name = name;
    this.#kind = kind;
  }

  /** @returns {string} Base name of the entry. */
  get name() {
    return this.#name;
  }

  /** @returns {boolean} `true` when the entry is a regular file. */
  isFile() {
    return this.#kind === 'file';
  }

  /** @returns {boolean} `true` when the entry is a directory. */
  isDirectory() {
    return this.#kind === 'directory';
  }

  /** @returns {boolean} `true` when the entry is a symbolic link. */
  isSymbolicLink() {
    return this.#kind === 'symbolic-link';
  }

  /** @returns {boolean} Always `false`. */
  isBlockDevice() {
    return false;
  }

  /** @returns {boolean} Always `false`. */
  isCharacterDevice() {
    return false;
  }

  /** @returns {boolean} Always `false`. */
  isFIFO() {
    return false;
  }

  /** @returns {boolean} Always `false`. */
  isSocket() {
    return false;
  }
}
