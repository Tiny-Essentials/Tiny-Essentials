/**
 * Node.js port of the browser based OPFS test environment
 * (`test/html/fs`).
 *
 * Covers:
 * - path helpers (`src/v1/libs/fs/path.mjs`)
 * - encoding helpers (`src/v1/libs/fs/encoding.mjs`)
 * - constants (`src/v1/libs/fs/constants.mjs`)
 * - TinyOPFSFileSystem (backed by an in-memory File System Access API shim)
 *
 * @returns {Promise<number>}
 */

import { TestRunner, section, color } from './_helpers.mjs';

import * as path from '../../dist/v1/libs/fs/path.mjs';
import * as encoding from '../../dist/v1/libs/fs/encoding.mjs';
import {
  constants,
  DEFAULT_FILE_MODE,
  DEFAULT_DIRECTORY_MODE,
} from '../../dist/v1/libs/fs/constants.mjs';

// ---------------------------------------------------------------------------
// Minimal in-memory File System Access API
// ---------------------------------------------------------------------------
class MemoryFileHandle {
  constructor(name) {
    this.kind = 'file';
    this.name = name;
    this._data = new Uint8Array();
  }
  async getFile() {
    const data = this._data;
    return {
      name: this.name,
      size: data.byteLength,
      lastModified: Date.now(),
      arrayBuffer: async () =>
        data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
      text: async () => new TextDecoder().decode(data),
    };
  }
  async createWritable(options = {}) {
    let buffer = options.keepExistingData ? this._data.slice() : new Uint8Array();
    return {
      write: async (chunk) => {
        const isWriteParams = chunk && !(chunk instanceof Uint8Array) && 'data' in chunk;
        const data = isWriteParams ? chunk.data : chunk;
        const position = isWriteParams ? chunk.position : undefined;
        const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
        if (typeof position === 'number') {
          const merged = new Uint8Array(Math.max(buffer.length, position + bytes.length));
          merged.set(buffer, 0);
          merged.set(bytes, position);
          buffer = merged;
        } else {
          const merged = new Uint8Array(buffer.length + bytes.length);
          merged.set(buffer, 0);
          merged.set(bytes, buffer.length);
          buffer = merged;
        }
      },
      close: async () => {
        this._data = buffer;
      },
    };
  }
}

class MemoryDirectoryHandle {
  constructor(name = '') {
    this.kind = 'directory';
    this.name = name;
    this._entries = new Map();
  }
  async getDirectoryHandle(name, options = {}) {
    const existing = this._entries.get(name);
    if (existing) return existing;
    if (!options.create) throw new Error(`ENOENT: ${name}`);
    const dir = new MemoryDirectoryHandle(name);
    this._entries.set(name, dir);
    return dir;
  }
  async getFileHandle(name, options = {}) {
    const existing = this._entries.get(name);
    if (existing) return existing;
    if (!options.create) throw new Error(`ENOENT: ${name}`);
    const file = new MemoryFileHandle(name);
    this._entries.set(name, file);
    return file;
  }
  async removeEntry(name) {
    this._entries.delete(name);
  }
  async *entries() {
    for (const entry of this._entries) yield entry;
  }
  async *values() {
    yield* this._entries.values();
  }
}

const { default: TinyOPFSFileSystem } =
  await import('../../dist/v1/libs/fs/plugins/OPFS/index.mjs');

/**
 * Node.js port of the browser OPFS test environment.
 * @returns {Promise<number>}
 */
const testFs = async () => {
  const t = new TestRunner('TinyFS - path');

  // -------------------------------------------------------------------
  // path helpers
  // -------------------------------------------------------------------
  section('TinyFS - path', '📁');
  t.equal(path.normalize('/a/b/../c'), '/a/c', 'normalize resolves ..');
  t.equal(path.join('a', 'b', 'c'), '/a/b/c', 'join concatenates segments');
  t.equal(path.dirname('/a/b/c.txt'), '/a/b', 'dirname returns the parent');
  t.equal(path.basename('/a/b/c.txt'), 'c.txt', 'basename returns the file name');
  t.equal(path.basename('/a/b/c.txt', '.txt'), 'c', 'basename strips the extension');
  t.equal(path.extname('/a/b/c.txt'), '.txt', 'extname returns the extension');
  t.equal(path.isAbsolute('/a'), true, 'isAbsolute detects absolute paths');
  t.equal(path.isAbsolute('a'), false, 'isAbsolute rejects relative paths');
  t.equal(path.relative('/a/b', '/a/c'), '../c', 'relative computes the path');
  t.deepEqual(path.parse('/a/b.txt').ext, '.txt', 'parse extracts the extension');
  t.equal(path.format({ dir: '/a', base: 'b.txt' }), '/a/b.txt', 'format rebuilds the path');

  // -------------------------------------------------------------------
  // encoding helpers
  // -------------------------------------------------------------------
  section('TinyFS - encoding', '🔤');
  const bytes = new Uint8Array([104, 101, 108, 108, 111]);
  t.equal(encoding.bytesToBase64(bytes), 'aGVsbG8=', 'bytesToBase64 encodes');
  t.deepEqual(encoding.base64ToBytes('aGVsbG8='), bytes, 'base64ToBytes decodes');
  t.equal(encoding.bytesToHex(bytes), '68656c6c6f', 'bytesToHex encodes');
  t.deepEqual(encoding.hexToBytes('68656c6c6f'), bytes, 'hexToBytes decodes');
  t.equal(encoding.decodeBytes(bytes, 'utf8'), 'hello', 'decodeBytes decodes utf8');
  t.deepEqual(encoding.toUint8Array('hello'), bytes, 'toUint8Array converts strings');

  // -------------------------------------------------------------------
  // constants
  // -------------------------------------------------------------------
  section('TinyFS - constants', '🔢');
  t.equal(typeof constants.F_OK, 'number', 'Exposes F_OK');
  t.equal(typeof DEFAULT_FILE_MODE, 'number', 'Exposes the default file mode');
  t.equal(typeof DEFAULT_DIRECTORY_MODE, 'number', 'Exposes the default directory mode');

  // -------------------------------------------------------------------
  // TinyOPFSFileSystem
  // -------------------------------------------------------------------
  const f = new TestRunner('TinyOPFSFileSystem');
  section('TinyOPFSFileSystem - files', '🗄️');
  const root = new MemoryDirectoryHandle('');
  const fs = new TinyOPFSFileSystem({ root });

  await fs.writeFile('/hello.txt', 'hello world');
  f.equal(await fs.exists('/hello.txt'), true, 'writeFile creates a file');
  f.equal(
    await fs.readFile('/hello.txt', { encoding: 'utf8' }),
    'hello world',
    'readFile reads it back',
  );

  await fs.appendFile('/hello.txt', '!');
  f.equal(
    await fs.readFile('/hello.txt', { encoding: 'utf8' }),
    'hello world!',
    'appendFile appends data',
  );

  await fs.mkdir('/dir');
  f.equal((await fs.stat('/dir')).isDirectory(), true, 'mkdir creates a directory');

  await fs.rename('/hello.txt', '/dir/renamed.txt');
  f.equal(await fs.exists('/hello.txt'), false, 'rename removes the source');
  f.equal(await fs.exists('/dir/renamed.txt'), true, 'rename moves the file');

  await fs.copyFile('/dir/renamed.txt', '/copy.txt');
  f.equal(await fs.exists('/copy.txt'), true, 'copyFile duplicates the file');

  const entries = await fs.readdir('/dir');
  f.equal(entries.length, 1, 'readdir lists the directory');

  await fs.unlink('/copy.txt');
  f.equal(await fs.exists('/copy.txt'), false, 'unlink removes the file');

  await fs.rm('/dir', { recursive: true });
  f.equal(await fs.exists('/dir'), false, 'rm removes a directory recursively');

  console.log(`\n${color('gray', 'FS test-suite finished.')}`);

  return t.summary() + f.summary();
};

export default testFs;
