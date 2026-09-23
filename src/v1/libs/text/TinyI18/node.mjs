import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import TinyI18 from './index.mjs';

/**
 * @typedef {import('./index.mjs').TinyI18Options} TinyI18Options
 */

/**
 * TinyI18 — Professional and flexible i18n manager with dual mode (local/file),
 * regex-based keys, and function-based entries for advanced rendering (incl. HTML).
 *
 * - Mode "local": in-memory resources (Node + Browser).
 * - Mode "file": JSON files on disk via fs/path (Node only).
 * - Keeps only default + selected locale in memory.
 * - Selected locale overrides default; fallback resolves to default.
 * - Supports string entries, regex pattern entries, and function-backed entries.
 * - Safe: no dynamic code eval from files; functions in file mode are referenced by name ("$fn").
 */
class TinyI18Node extends TinyI18 {
  /**
   * Creates a new TinyI18 instance for managing localized strings and patterns.
   *
   * Supports two modes:
   * - "local": loads translations directly from provided objects.
   * - "file": loads translations from JSON files on demand.
   *
   * Ensures the default locale is always initialized. In "file" mode, `basePath` is required.
   *
   * @param {TinyI18Options} options - Configuration options for the instance.
   */
  constructor(options) {
    super(options);
  }
}

/** @type {import('path').join} */
TinyI18Node._join = (...args) => join(...args);
/** @type {import('fs').existsSync} */
TinyI18Node._existsSync = (...args) => existsSync(...args);
/** @type {(path: string, options: BufferEncoding) => Promise<string>} */
TinyI18Node._readFile = (...args) => readFile(...args);
/** @type {import('fs/promises').writeFile} */
TinyI18Node._writeFile = (...args) => writeFile(...args);

export default TinyI18Node;
