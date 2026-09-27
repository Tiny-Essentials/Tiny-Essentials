/**
 * @file OPFS backend for {@link TinyFSCore}.
 */

import TinyFSCore from '../index.mjs';
import { createFileSystemError, toFileSystemError } from '../error.mjs';
import { toSegments } from '../path.mjs';
import { ROOT_PATH } from '../constants.mjs';

/**
 * @typedef {Object} OPFSFileSystemOptions
 * @property {FileSystemDirectoryHandle} [root] Custom OPFS root. Defaults to `navigator.storage.getDirectory()`.
 */

/**
 * Origin Private File System backend.
 *
 * OPFS has no symbolic links, no permission bits and no way to set
 * timestamps. Those operations are emulated by the base class and stored in
 * memory, so they are lost when the tab is closed.
 * @beta
 */
class TinyOPFSFileSystem extends TinyFSCore {
  /** @type {FileSystemDirectoryHandle | null} */
  #root;

  /**
   * @param {import('../index.mjs').FSOptions & OPFSFileSystemOptions} [options] Construction options.
   */
  constructor(options = {}) {
    super(options);
    this.#root = options.root ?? null;
  }

  /** @returns {import('../index.mjs').FSCapabilities} The capabilities advertised by OPFS. */
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

  /**
   * @returns {Promise<FileSystemDirectoryHandle>} The OPFS root directory.
   * @throws {Error} When OPFS is not reachable in the current context.
   */
  async #getRoot() {
    if (this.#root !== null) {
      return this.#root;
    }
    if (typeof navigator === 'undefined' || typeof navigator.storage?.getDirectory !== 'function') {
      throw createFileSystemError(
        'ENOSYS',
        'getDirectory',
        ROOT_PATH,
        'OPFS is not available in this environment',
      );
    }
    this.#root = await navigator.storage.getDirectory();
    return this.#root;
  }

  /**
   * @param {string[]} segments Normalised segments.
   * @param {boolean} create When `true`, missing directories are created.
   * @param {string} syscall Name of the originating operation.
   * @param {string} displayPath Path used in error messages.
   * @returns {Promise<FileSystemDirectoryHandle>} The resolved directory handle.
   */
  async #resolveDirectory(segments, create, syscall, displayPath) {
    let handle = await this.#getRoot();
    for (const segment of segments) {
      try {
        handle = await handle.getDirectoryHandle(segment, { create });
      } catch (error) {
        throw toFileSystemError(error, syscall, displayPath);
      }
    }
    return handle;
  }

  /**
   * @param {string} targetPath Absolute path of the entry.
   * @param {string} syscall Name of the originating operation.
   * @returns {Promise<{ parent: FileSystemDirectoryHandle, name: string }>} The parent handle and leaf name.
   */
  async #resolveParent(targetPath, syscall) {
    const segments = toSegments(targetPath);
    const name = segments.pop();
    if (name === undefined) {
      throw createFileSystemError('EINVAL', syscall, targetPath, 'the root has no parent');
    }
    const parent = await this.#resolveDirectory(segments, false, syscall, targetPath);
    return { parent, name };
  }

  /**
   * @param {FileSystemDirectoryHandle} directory Source directory.
   * @param {string} displayPath Path used in error messages.
   * @returns {Promise<Array<{ name: string, kind: 'file' | 'directory' }>>} The entries, sorted by name.
   */
  async #readEntries(directory, displayPath) {
    /** @type {Array<{ name: string, kind: 'file' | 'directory' }>} */
    const entries = [];
    try {
      for await (const [name, handle] of directory.entries()) {
        entries.push({ name, kind: handle.kind });
      }
    } catch (error) {
      throw toFileSystemError(error, 'readdir', displayPath);
    }
    return entries.sort((left, right) => left.name.localeCompare(right.name));
  }

  /**
   * @param {FileSystemDirectoryHandle} source Source directory.
   * @param {FileSystemDirectoryHandle} destination Destination directory.
   * @returns {Promise<void>} Resolves once the tree is copied.
   */
  async #copyTree(source, destination) {
    for await (const [name, entry] of source.entries()) {
      if (entry.kind === 'directory') {
        const childTarget = await destination.getDirectoryHandle(name, { create: true });
        await this.#copyTree(/** @type {FileSystemDirectoryHandle} */ (entry), childTarget);
        continue;
      }
      const fileHandle = /** @type {FileSystemFileHandle} */ (entry);
      const file = await fileHandle.getFile();
      const target = await destination.getFileHandle(name, { create: true });
      const writable = await target.createWritable();
      await writable.write(await file.arrayBuffer());
      await writable.close();
    }
  }

  /**
   * @override
   * @param {string} targetPath Absolute path of the file.
   * @returns {Promise<Uint8Array>} The raw file contents.
   */
  async _readFile(targetPath) {
    const { parent, name } = await this.#resolveParent(targetPath, 'readFile');
    try {
      const handle = await parent.getFileHandle(name);
      const file = await handle.getFile();
      return new Uint8Array(await file.arrayBuffer());
    } catch (error) {
      throw toFileSystemError(error, 'readFile', targetPath, 'EISDIR');
    }
  }

  /**
   * @override
   * @param {string} targetPath Absolute path of the file.
   * @param {Uint8Array} bytes Payload to persist.
   * @param {import('../index.mjs').TWriteFileOptions} options Write options.
   * @returns {Promise<void>} Resolves once the payload is committed.
   */
  async _writeFile(targetPath, bytes, options) {
    const { parent, name } = await this.#resolveParent(targetPath, 'writeFile');
    const payload = /** @type {Uint8Array<ArrayBuffer>} */ (bytes);
    try {
      const handle = await parent.getFileHandle(name, { create: true });
      const writable = await handle.createWritable({ keepExistingData: options.append === true });
      if (options.append === true) {
        const existing = await handle.getFile();
        await writable.write({ type: 'write', position: existing.size, data: payload });
      } else {
        await writable.write(payload);
      }
      await writable.close();
    } catch (error) {
      throw toFileSystemError(error, 'writeFile', targetPath);
    }
  }

  /**
   * @override
   * @param {string} targetPath Absolute path of the directory.
   * @returns {Promise<import('../stats.mjs').FSDirectoryEntry[]>} The directory entries.
   */
  async _readdir(targetPath) {
    const directory = await this.#resolveDirectory(
      toSegments(targetPath),
      false,
      'readdir',
      targetPath,
    );
    return this.#readEntries(directory, targetPath);
  }

  /**
   * @override
   * @param {string} targetPath Absolute path of the directory.
   * @param {import('../index.mjs').TMkdirOptions} options Creation options.
   * @returns {Promise<void>} Resolves once the directory exists.
   */
  async _mkdir(targetPath, options) {
    const segments = toSegments(targetPath);
    if (segments.length === 0) {
      if (options.recursive === true) {
        return;
      }
      throw createFileSystemError('EEXIST', 'mkdir', targetPath);
    }
    if (options.recursive === true) {
      await this.#resolveDirectory(segments, true, 'mkdir', targetPath);
      return;
    }
    const { parent, name } = await this.#resolveParent(targetPath, 'mkdir');
    const entries = await this.#readEntries(parent, targetPath);
    if (entries.some((entry) => entry.name === name)) {
      throw createFileSystemError('EEXIST', 'mkdir', targetPath);
    }
    try {
      await parent.getDirectoryHandle(name, { create: true });
    } catch (error) {
      throw toFileSystemError(error, 'mkdir', targetPath);
    }
  }

  /**
   * @override
   * @param {string} targetPath Absolute path of the entry.
   * @param {import('../index.mjs').TRmOptions} options Removal options.
   * @returns {Promise<void>} Resolves once the entry is gone.
   */
  async _rm(targetPath, options) {
    const { parent, name } = await this.#resolveParent(targetPath, 'rm');
    const entries = await this.#readEntries(parent, targetPath);
    const target = entries.find((entry) => entry.name === name);
    if (target === undefined) {
      if (options.force === true) {
        return;
      }
      throw createFileSystemError('ENOENT', 'rm', targetPath);
    }
    if (target.kind === 'directory' && options.recursive !== true) {
      const handle = await parent.getDirectoryHandle(name);
      const children = await this.#readEntries(handle, targetPath);
      if (children.length > 0) {
        throw createFileSystemError('ENOTEMPTY', 'rm', targetPath);
      }
    }
    try {
      await parent.removeEntry(name, { recursive: options.recursive === true });
    } catch (error) {
      throw toFileSystemError(error, 'rm', targetPath);
    }
  }

  /**
   * @override
   * @param {string} targetPath Absolute path of the entry.
   * @returns {Promise<import('../stats.mjs').FSStatDescriptor | undefined>}
   */
  async _stat(targetPath) {
    const segments = toSegments(targetPath);
    if (segments.length === 0) {
      return { name: ROOT_PATH, kind: 'directory', size: 0, mtimeMs: Date.now() };
    }
    const name = /** @type {string} */ (segments.pop());
    const parent = await this.#resolveDirectory(segments, false, 'stat', targetPath);
    const entries = await this.#readEntries(parent, targetPath);
    const target = entries.find((entry) => entry.name === name);
    if (target === undefined) {
      return undefined;
    }
    if (target.kind === 'directory') {
      return { name, kind: 'directory', size: 0, mtimeMs: Date.now() };
    }
    const handle = await parent.getFileHandle(name);
    const file = await handle.getFile();
    return { name, kind: 'file', size: file.size, mtimeMs: file.lastModified };
  }

  /**
   * @override
   * @param {string} oldPath Current absolute path.
   * @param {string} newPath Target absolute path.
   * @returns {Promise<void>} Resolves once the move is complete.
   */
  async _rename(oldPath, newPath) {
    const source = await this._stat(oldPath);
    if (source === undefined) {
      throw createFileSystemError('ENOENT', 'rename', oldPath);
    }
    if (source.kind === 'directory') {
      const sourceHandle = await this.#resolveDirectory(
        toSegments(oldPath),
        false,
        'rename',
        oldPath,
      );
      const destinationHandle = await this.#resolveDirectory(
        toSegments(newPath),
        true,
        'rename',
        newPath,
      );
      await this.#copyTree(sourceHandle, destinationHandle);
    } else {
      const bytes = await this._readFile(oldPath);
      await this._writeFile(newPath, bytes, { append: false });
    }
    await this._rm(oldPath, { recursive: true, force: true });
  }

  /**
   * @override
   * @param {string} sourcePath Absolute path of the source file.
   * @param {string} destinationPath Absolute path of the destination file.
   * @returns {Promise<void>} Resolves once the copy is complete.
   */
  async _copyFile(sourcePath, destinationPath) {
    const bytes = await this._readFile(sourcePath);
    await this._writeFile(destinationPath, bytes, { append: false });
  }
}

export default TinyOPFSFileSystem;
