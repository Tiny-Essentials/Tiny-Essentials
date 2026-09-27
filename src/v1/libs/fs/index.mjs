/**
 * @file Abstract, `node:fs/promises`-compatible file system.
 *
 * The class is a working implementation on its own: permissions, ownership and
 * timestamps are stored in an in-memory side table. Backends extend it and
 * override the `_`-prefixed protected hooks to delegate storage to a real
 * medium.
 *
 * @divergence Every protected hook receives and returns raw values. Encoding,
 * validation and metadata merging happen in the public methods.
 */

import {
  DEFAULT_DIRECTORY_MODE,
  DEFAULT_FILE_MODE,
  DEFAULT_UMASK,
  ROOT_PATH,
  constants,
} from './constants.mjs';
import {
  assertEncoding,
  assertInteger,
  assertMode,
  assertOptionsObject,
  assertPath,
  createFileSystemError,
} from './error.mjs';
import { decodeBytes, toUint8Array } from './encoding.mjs';
import { Dirent, Stats } from './stats.mjs';
import { FileHandle } from './handle.mjs';
import { toSegments } from './path.mjs';

/**
 * @typedef {import('./stats.mjs').FSDirectoryEntry} FSDirectoryEntry
 * @typedef {import('./stats.mjs').Stats} StatsModule
 * @typedef {import('./stats.mjs').FSMetadata} FSMetadata
 * @typedef {import('./stats.mjs').FSStatDescriptor} FSStatDescriptor
 */

/**
 * @typedef {Object} FSIdentity
 * @property {number} uid Effective user id.
 * @property {number} gid Effective group id.
 * @property {number[]} groups Supplementary group ids.
 */

/**
 * @typedef {Object} FSOptions
 * @property {string} [cwd] Working directory used to resolve relative paths.
 * @property {number} [umask] Permission mask applied on creation.
 * @property {FSIdentity} [identity] Effective identity used by `access`.
 */

/**
 * @typedef {Object} FSCapabilities
 * @property {boolean} permissions
 * @property {boolean} ownership
 * @property {boolean} symlinks
 * @property {boolean} timestamps
 * @property {boolean} atomicRename
 * @property {boolean} seekableHandles
 */

/**
 * @typedef {Object} TReadFileOptions
 * @property {string | null} [encoding] When omitted or `null`, a `Uint8Array` is returned.
 */

/**
 * @typedef {Object} TWriteFileOptions
 * @property {string | null} [encoding] Encoding used to serialise string input.
 * @property {boolean} [append] When `true`, the payload is appended.
 * @property {number} [mode] Permission bits applied when the file is created.
 */

/**
 * @typedef {Object} TReaddirOptions
 * @property {boolean} [withFileTypes] When `true`, resolves to `Dirent[]`.
 * @property {boolean} [recursive] When `true`, walks sub-directories depth-first.
 */

/**
 * @typedef {Object} TMkdirOptions
 * @property {boolean} [recursive] When `true`, missing parents are created.
 * @property {number} [mode] Permission bits applied to the new directory.
 */

/**
 * @typedef {Object} TRmOptions
 * @property {boolean} [recursive] When `true`, removes directories and their contents.
 * @property {boolean} [force] When `true`, a missing path is not an error.
 */

/**
 * @typedef {Object} TStatOptions
 * @property {boolean} [throwIfNoEntry] When `false`, resolves to `undefined` instead of throwing.
 */

/**
 * @typedef {Object} TCopyFileOptions
 * @property {number} [mode] Bitmask of `constants.COPYFILE_*` flags.
 */

/** @type {() => FSMetadata} */
const createDefaultMetadata = () => ({
  mode: null,
  uid: null,
  gid: null,
  atimeMs: null,
  mtimeMs: null,
  birthtimeMs: null,
});

/**
 * Abstract, `node:fs/promises`-compatible file system.
 * @beta
 */
class TinyFSCore {
  /** @type {Map<string, FSMetadata>} */
  #metadata = new Map();

  /** @type {string} */
  #cwd;

  /** @type {number} */
  #umask;

  /** @type {FSIdentity} */
  #identity;

  /**
   * @param {FSOptions} [options] Construction options.
   */
  constructor(options = {}) {
    const {
      cwd = ROOT_PATH,
      umask = DEFAULT_UMASK,
      identity,
    } = /** @type {FSOptions} */ (assertOptionsObject(options, 'constructor'));
    this.#cwd = typeof cwd === 'string' ? cwd : ROOT_PATH;
    this.#umask = typeof umask === 'number' ? umask : DEFAULT_UMASK;
    this.#identity = {
      uid: identity?.uid ?? 0,
      gid: identity?.gid ?? 0,
      groups: identity?.groups ?? [],
    };
  }

  /**
   * @returns {FSCapabilities} The capabilities advertised by the backend.
   */
  static get capabilities() {
    return Object.freeze({
      permissions: false,
      ownership: false,
      symlinks: false,
      timestamps: false,
      atomicRename: false,
      seekableHandles: false,
    });
  }

  /** @returns {string} Working directory used to resolve relative paths. */
  get cwd() {
    return this.#cwd;
  }

  /** @returns {number} Permission mask applied on creation. */
  get umask() {
    return this.#umask;
  }

  /** @returns {FSIdentity} Effective identity used by `access`. */
  get identity() {
    return this.#identity;
  }

  /* ------------------------------------------------------------------ */
  /* Protected hooks — override in backends                             */
  /* ------------------------------------------------------------------ */

  /**
   * @protected
   * @param {string} targetPath Absolute path of the file.
   * @returns {Promise<Uint8Array>} The raw file contents.
   */
  async _readFile(targetPath) {
    throw this.#unsupported('readFile', targetPath);
  }

  /**
   * @protected
   * @param {string} targetPath Absolute path of the file.
   * @param {Uint8Array} bytes Payload to persist.
   * @param {TWriteFileOptions} options Write options.
   * @returns {Promise<void>} Resolves once the payload is committed.
   */
  async _writeFile(targetPath, bytes, options) {
    throw this.#unsupported('writeFile', targetPath);
  }

  /**
   * @protected
   * @param {string} targetPath Absolute path of the directory.
   * @returns {Promise<FSDirectoryEntry[]>} The directory entries.
   */
  async _readdir(targetPath) {
    throw this.#unsupported('readdir', targetPath);
  }

  /**
   * @protected
   * @param {string} targetPath Absolute path of the directory.
   * @param {TMkdirOptions} options Creation options.
   * @returns {Promise<void>} Resolves once the directory exists.
   */
  async _mkdir(targetPath, options) {
    throw this.#unsupported('mkdir', targetPath);
  }

  /**
   * @protected
   * @param {string} targetPath Absolute path of the entry.
   * @param {TRmOptions} options Removal options.
   * @returns {Promise<void>} Resolves once the entry is gone.
   */
  async _rm(targetPath, options) {
    throw this.#unsupported('rm', targetPath);
  }

  /**
   * @protected
   * @param {string} targetPath Absolute path of the entry.
   * @returns {Promise<FSStatDescriptor | undefined>} The raw descriptor, or `undefined`.
   */
  async _stat(targetPath) {
    throw this.#unsupported('stat', targetPath);
  }

  /**
   * @protected
   * @param {string} oldPath Current absolute path.
   * @param {string} newPath Target absolute path.
   * @returns {Promise<void>} Resolves once the move is complete.
   */
  async _rename(oldPath, newPath) {
    throw this.#unsupported('rename', oldPath);
  }

  /**
   * @protected
   * @param {string} sourcePath Absolute path of the source file.
   * @param {string} destinationPath Absolute path of the destination file.
   * @param {number} mode Bitmask of `constants.COPYFILE_*` flags.
   * @returns {Promise<void>} Resolves once the copy is complete.
   */
  async _copyFile(sourcePath, destinationPath, mode) {
    throw this.#unsupported('copyFile', sourcePath);
  }

  /**
   * @protected
   * @param {string} targetPath Absolute path of the entry.
   * @returns {Promise<FSMetadata>} The stored metadata.
   */
  async _readMetadata(targetPath) {
    return this.#metadata.get(targetPath) ?? createDefaultMetadata();
  }

  /**
   * @protected
   * @param {string} targetPath Absolute path of the entry.
   * @param {FSMetadata} metadata Metadata to persist.
   * @returns {Promise<void>} Resolves once the metadata is committed.
   */
  async _writeMetadata(targetPath, metadata) {
    this.#metadata.set(targetPath, metadata);
  }

  /* ------------------------------------------------------------------ */
  /* Public API                                                        */
  /* ------------------------------------------------------------------ */

  /**
   * Reads the entire contents of a file.
   *
   * @param {string} path Absolute path of the file.
   * @param {TReadFileOptions} [options] Read options.
   * @returns {Promise<string | Uint8Array>} The file contents.
   */
  async readFile(path, options = {}) {
    const targetPath = assertPath(path, 'path');
    const { encoding } = assertOptionsObject(options, 'readFile');
    const resolvedEncoding = assertEncoding(encoding, 'readFile');
    const bytes = await this._readFile(targetPath);
    return decodeBytes(bytes, resolvedEncoding);
  }

  /**
   * Writes data to a file, replacing it when it already exists.
   *
   * @param {string} path Absolute path of the file.
   * @param {string | Uint8Array | ArrayBuffer} data Payload to persist.
   * @param {TWriteFileOptions} [options] Write options.
   * @returns {Promise<void>} Resolves once the payload is committed.
   */
  async writeFile(path, data, options = {}) {
    const targetPath = assertPath(path, 'path');
    const { encoding, append, mode } = assertOptionsObject(options, 'writeFile');
    const resolvedEncoding = assertEncoding(encoding, 'writeFile');
    const payload = toUint8Array(data, resolvedEncoding);
    const exists = await this.exists(targetPath);
    await this._writeFile(targetPath, payload, {
      append: append === true,
      mode: typeof mode === 'number' ? mode : undefined,
    });
    if (!exists) {
      const resolvedMode = typeof mode === 'number' ? mode : DEFAULT_FILE_MODE;
      await this._writeMetadata(targetPath, {
        ...createDefaultMetadata(),
        mode: resolvedMode & ~this.#umask,
        uid: this.#identity.uid,
        gid: this.#identity.gid,
        birthtimeMs: Date.now(),
        mtimeMs: Date.now(),
        atimeMs: Date.now(),
      });
    }
  }

  /**
   * Appends data to a file, creating it when missing.
   *
   * @param {string} path Absolute path of the file.
   * @param {string | Uint8Array | ArrayBuffer} data Payload to append.
   * @param {TWriteFileOptions} [options] Write options.
   * @returns {Promise<void>} Resolves once the payload is committed.
   */
  async appendFile(path, data, options = {}) {
    const targetPath = assertPath(path, 'path');
    const validated = assertOptionsObject(options, 'appendFile');
    return this.writeFile(targetPath, data, { ...validated, append: true });
  }

  /**
   * Reads the contents of a directory.
   *
   * @param {string} path Absolute path of the directory.
   * @param {TReaddirOptions} [options] Read options.
   * @returns {Promise<Array<string | Dirent>>} The entry names, or `Dirent` objects.
   */
  async readdir(path, options = {}) {
    const targetPath = assertPath(path, 'path');
    const { withFileTypes, recursive } = assertOptionsObject(options, 'readdir');
    const entries = await this._readdir(targetPath);
    /** @type {Array<string | Dirent>} */
    const output = [];
    for (const entry of entries) {
      output.push(withFileTypes === true ? new Dirent(entry.name, entry.kind) : entry.name);
      if (recursive === true && entry.kind === 'directory') {
        const nestedPath = `${targetPath.replace(/\/$/, '')}/${entry.name}`;
        const nested = await this.readdir(nestedPath, options);
        for (const nestedEntry of nested) {
          const nestedName = typeof nestedEntry === 'string' ? nestedEntry : nestedEntry.name;
          output.push(
            withFileTypes === true
              ? new Dirent(`${entry.name}/${nestedName}`, 'file')
              : `${entry.name}/${nestedName}`,
          );
        }
      }
    }
    return output;
  }

  /**
   * Creates a directory.
   *
   * @param {string} path Absolute path of the directory.
   * @param {TMkdirOptions} [options] Creation options.
   * @returns {Promise<string | undefined>} The created path when `recursive` is `true`.
   */
  async mkdir(path, options = {}) {
    const targetPath = assertPath(path, 'path');
    const { recursive, mode } = assertOptionsObject(options, 'mkdir');
    await this._mkdir(targetPath, { recursive: recursive === true });
    const resolvedMode = typeof mode === 'number' ? mode : DEFAULT_DIRECTORY_MODE;
    await this._writeMetadata(targetPath, {
      ...createDefaultMetadata(),
      mode: resolvedMode & ~this.#umask,
      uid: this.#identity.uid,
      gid: this.#identity.gid,
      birthtimeMs: Date.now(),
      mtimeMs: Date.now(),
      atimeMs: Date.now(),
    });
    return recursive === true ? targetPath : undefined;
  }

  /**
   * Removes a file or, when `recursive` is `true`, a directory tree.
   *
   * @param {string} path Absolute path of the entry.
   * @param {TRmOptions} [options] Removal options.
   * @returns {Promise<void>} Resolves once the entry is gone.
   */
  async rm(path, options = {}) {
    const targetPath = assertPath(path, 'path');
    const { recursive, force } = assertOptionsObject(options, 'rm');
    await this._rm(targetPath, { recursive: recursive === true, force: force === true });
    this.#metadata.delete(targetPath);
  }

  /**
   * Removes a file.
   *
   * @param {string} path Absolute path of the file.
   * @returns {Promise<void>} Resolves once the file is gone.
   */
  async unlink(path) {
    const targetPath = assertPath(path, 'path');
    const stats = await this.__stat(targetPath);
    if (stats?.isDirectory()) {
      throw createFileSystemError('EISDIR', 'unlink', targetPath);
    }
    await this.rm(targetPath, { force: false });
  }

  /**
   * Removes a directory.
   *
   * @param {string} path Absolute path of the directory.
   * @param {TRmOptions} [options] Removal options.
   * @returns {Promise<void>} Resolves once the directory is gone.
   */
  async rmdir(path, options = {}) {
    const targetPath = assertPath(path, 'path');
    const { recursive } = assertOptionsObject(options, 'rmdir');
    await this.rm(targetPath, { recursive: recursive === true });
  }

  /**
   * Renames or moves a file or directory.
   *
   * @param {string} oldPath Current absolute path.
   * @param {string} newPath Target absolute path.
   * @returns {Promise<void>} Resolves once the move is complete.
   */
  async rename(oldPath, newPath) {
    const sourcePath = assertPath(oldPath, 'oldPath');
    const destinationPath = assertPath(newPath, 'newPath');
    await this._rename(sourcePath, destinationPath);
    const metadata = await this._readMetadata(sourcePath);
    await this._writeMetadata(destinationPath, metadata);
    this.#metadata.delete(sourcePath);
  }

  /**
   * Copies a file.
   *
   * @param {string} sourcePath Absolute path of the source file.
   * @param {string} destinationPath Absolute path of the destination file.
   * @param {number | TCopyFileOptions} [mode] Bitmask of `constants.COPYFILE_*` flags.
   * @returns {Promise<void>} Resolves once the copy is complete.
   */
  async copyFile(sourcePath, destinationPath, mode = 0) {
    const source = assertPath(sourcePath, 'sourcePath');
    const destination = assertPath(destinationPath, 'destinationPath');
    const flags = typeof mode === 'number' ? mode : 0;
    await this._copyFile(source, destination, flags);
    const metadata = await this._readMetadata(source);
    await this._writeMetadata(destination, metadata);
  }

  /**
   * Retrieves metadata about a file or directory.
   *
   * @param {string} path Absolute path of the entry.
   * @param {TStatOptions} [options] Stat options.
   * @returns {Promise<Stats | undefined>} The metadata snapshot.
   */
  async __stat(path, options = {}) {
    const targetPath = assertPath(path, 'path');
    const { throwIfNoEntry } = assertOptionsObject(options, 'stat');
    const descriptor = await this._stat(targetPath);
    if (descriptor === undefined) {
      if (throwIfNoEntry === false) {
        return undefined;
      }
      throw createFileSystemError('ENOENT', 'stat', targetPath);
    }
    const metadata = await this._readMetadata(targetPath);
    const defaultMode =
      descriptor.kind === 'directory' ? DEFAULT_DIRECTORY_MODE : DEFAULT_FILE_MODE;
    return new Stats({
      path: targetPath,
      name: descriptor.name,
      kind: descriptor.kind,
      size: descriptor.size,
      mode: metadata.mode ?? defaultMode,
      uid: metadata.uid ?? 0,
      gid: metadata.gid ?? 0,
      atimeMs: metadata.atimeMs ?? descriptor.mtimeMs,
      mtimeMs: metadata.mtimeMs ?? descriptor.mtimeMs,
      birthtimeMs: metadata.birthtimeMs ?? descriptor.mtimeMs,
      ino: 0,
    });
  }

  /**
   * Retrieves metadata about a file or directory.
   *
   * @param {string} path Absolute path of the entry.
   * @param {TStatOptions} [options] Stat options.
   * @returns {Promise<Stats>} The metadata snapshot.
   */
  async stat(path, options = {}) {
    const targetPath = assertPath(path, 'path');
    const stats = await this.__stat(targetPath, options);
    if (typeof stats === 'undefined') {
      throw createFileSystemError('ENOENT', 'stat', targetPath);
    }
    return stats;
  }

  /**
   * Alias of `stat`. The base class has no symbolic links.
   *
   * @param {string} path Absolute path of the entry.
   * @param {TStatOptions} [options] Stat options.
   * @returns {Promise<Stats | undefined>} The metadata snapshot.
   */
  async lstat(path, options = {}) {
    return this.stat(path, options);
  }

  /**
   * Checks whether a path is reachable.
   *
   * @param {string} path Absolute path of the entry.
   * @param {number} [mode] Bitmask of `constants.F_OK`, `R_OK`, `W_OK` and `X_OK`.
   * @returns {Promise<void>} Resolves when the path is reachable.
   * @throws {Error} With `code: 'EACCES'` when the permission is missing.
   */
  async access(path, mode = constants.F_OK) {
    const targetPath = assertPath(path, 'path');
    if (typeof mode !== 'number' || !Number.isInteger(mode)) {
      throw new TypeError('The "mode" argument must be an integer');
    }
    const stats = await this.__stat(targetPath);
    if (mode === constants.F_OK) {
      return;
    }
    if (!stats) throw createFileSystemError('ENOENT', 'access', targetPath);
    const shift = this.#resolvePermissionShift(stats.uid, stats.gid);
    const granted = (stats.mode >> shift) & 0o7;
    if (mode & constants.R_OK && !(granted & 0o4)) {
      throw createFileSystemError('EACCES', 'access', targetPath);
    }
    if (mode & constants.W_OK && !(granted & 0o2)) {
      throw createFileSystemError('EACCES', 'access', targetPath);
    }
    if (mode & constants.X_OK && !(granted & 0o1)) {
      throw createFileSystemError('EACCES', 'access', targetPath);
    }
  }

  /**
   * Changes the permission bits of an entry.
   *
   * @param {string} path Absolute path of the entry.
   * @param {number} mode New permission bits.
   * @returns {Promise<void>} Resolves once the mode is committed.
   */
  async chmod(path, mode) {
    const targetPath = assertPath(path, 'path');
    const resolvedMode = assertMode(mode, 'mode');
    const metadata = await this._readMetadata(targetPath);
    await this._writeMetadata(targetPath, { ...metadata, mode: resolvedMode });
  }

  /**
   * Changes the owner of an entry.
   *
   * @param {string} path Absolute path of the entry.
   * @param {number} uid New owner user id.
   * @param {number} [gid] New owner group id. Defaults to `uid`.
   * @returns {Promise<void>} Resolves once the ownership is committed.
   */
  async chown(path, uid, gid) {
    const targetPath = assertPath(path, 'path');
    const resolvedUid = assertInteger(uid, 'uid');
    const resolvedGid = gid === undefined ? resolvedUid : assertInteger(gid, 'gid');
    const metadata = await this._readMetadata(targetPath);
    await this._writeMetadata(targetPath, { ...metadata, uid: resolvedUid, gid: resolvedGid });
  }

  /**
   * Updates the access and modification times of an entry.
   *
   * @param {string} path Absolute path of the entry.
   * @param {number} atimeMs New access time in milliseconds since the epoch.
   * @param {number} [mtimeMs] New modification time. Defaults to `atimeMs`.
   * @returns {Promise<void>} Resolves once the timestamps are committed.
   */
  async utimes(path, atimeMs, mtimeMs) {
    const targetPath = assertPath(path, 'path');
    const resolvedAtime = assertInteger(atimeMs, 'atimeMs');
    const resolvedMtime = mtimeMs === undefined ? resolvedAtime : assertInteger(mtimeMs, 'mtimeMs');
    const metadata = await this._readMetadata(targetPath);
    await this._writeMetadata(targetPath, {
      ...metadata,
      atimeMs: resolvedAtime,
      mtimeMs: resolvedMtime,
    });
  }

  /**
   * Truncates a file to the given length.
   *
   * @param {string} path Absolute path of the file.
   * @param {number} [length] Target length in bytes.
   * @returns {Promise<void>} Resolves once the file is truncated.
   */
  async truncate(path, length = 0) {
    const targetPath = assertPath(path, 'path');
    const resolvedLength = assertInteger(length, 'length');
    const current = await this.readFile(targetPath);
    const bytes = /** @type {Uint8Array} */ (current);
    const merged = new Uint8Array(resolvedLength);
    merged.set(bytes.subarray(0, resolvedLength));
    await this.writeFile(targetPath, merged);
  }

  /**
   * Resolves the canonical absolute path.
   *
   * @param {string} path Absolute path of the entry.
   * @returns {Promise<string>} The normalised absolute path.
   */
  async realpath(path) {
    const targetPath = assertPath(path, 'path');
    await this.__stat(targetPath);
    return `/${toSegments(targetPath).join('/')}`;
  }

  /**
   * Opens a file and returns a handle.
   *
   * @param {string} path Absolute path of the file.
   * @param {string} [flags] Access mode, e.g. `'r'`, `'w'`, `'a'`.
   * @returns {Promise<FileHandle>} The opened handle.
   */
  async open(path, flags = 'r') {
    const targetPath = assertPath(path, 'path');
    if (typeof flags !== 'string') {
      throw new TypeError('The "flags" argument must be of type string');
    }
    if (flags.includes('w')) {
      await this.writeFile(targetPath, new Uint8Array(0));
    } else if (flags.includes('a')) {
      await this.writeFile(targetPath, new Uint8Array(0), { append: true });
    } else {
      await this.__stat(targetPath);
    }
    return new FileHandle(this, targetPath, flags);
  }

  /**
   * Reports whether a path exists.
   *
   * @param {string} path Absolute path of the entry.
   * @returns {Promise<boolean>} `true` when the entry exists.
   */
  async exists(path) {
    const stats = await this.__stat(path, { throwIfNoEntry: false });
    return stats !== undefined;
  }

  /**
   * @param {string} syscall Name of the unsupported operation.
   * @param {string} targetPath Path the operation was applied to.
   * @returns {Error} The error to throw.
   */
  #unsupported(syscall, targetPath) {
    return createFileSystemError(
      'ENOSYS',
      syscall,
      targetPath,
      `${syscall}() is not implemented by ${this.constructor.name}`,
    );
  }

  /**
   * @param {number} uid Owner user id of the entry.
   * @param {number} gid Owner group id of the entry.
   * @returns {number} Bit shift applied to the permission triad.
   */
  #resolvePermissionShift(uid, gid) {
    if (uid === this.#identity.uid) {
      return 6;
    }
    if (gid === this.#identity.gid || this.#identity.groups.includes(gid)) {
      return 3;
    }
    return 0;
  }
}

export default TinyFSCore;
