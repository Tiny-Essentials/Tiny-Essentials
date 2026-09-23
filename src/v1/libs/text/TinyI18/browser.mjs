import TinyI18 from './index.mjs';

/**
 * @typedef {import('./index.mjs').TinyI18Options} TinyI18Options
 */

/**
 * TinyI18 — Professional and flexible i18n manager with dual mode (local/file),
 * regex-based keys, and function-based entries for advanced rendering (incl. HTML).
 *
 * - Mode "local": in-memory resources.
 * - Keeps only default + selected locale in memory.
 * - Selected locale overrides default; fallback resolves to default.
 * - Supports string entries, regex pattern entries, and function-backed entries.
 * - Safe: no dynamic code eval from files; functions in file mode are referenced by name ("$fn").
 */
class TinyI18Browser extends TinyI18 {
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

/**
 * Joins URL segments into a single normalized path.
 *
 * @param {...string} segments - URL segments to join, in order.
 * @returns {string} The joined URL path.
 * @throws {TypeError} If any segment is not a string.
 */
const joinUrl = (...segments) => {
  for (const segment of segments) {
    if (typeof segment !== 'string') {
      throw new TypeError('TinyI18: "joinUrl" expects only string segments');
    }
  }

  const [head = '', ...tail] = segments;
  const base = head.replace(/\/+$/, '');
  const parts = tail
    .map((segment) => segment.replace(/^\/+/, '').replace(/\/+$/, ''))
    .filter((segment) => segment.length > 0);

  return parts.length === 0 ? base : `${base}/${parts.join('/')}`;
};

/**
 * Reads a file from the network using the Fetch API.
 *
 * @param {string} path - The URL of the file to read.
 * @returns {Promise<string>} A promise that resolves with the file contents as text.
 */
const readFile = async (path) => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`TinyI18: failed to load "${path}": ${response.status} ${response.statusText}`);
  }
  return response.text();
};

/**
 * Triggers a file download in the browser.
 *
 * @param {string} path - The file name (or path) used for the downloaded file.
 * @param {string} data - The file contents.
 * @returns {Promise<void>} A promise that resolves once the download has been triggered.
 */
const writeFile = async (path, data) => {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = path.split('/').pop() || 'download.json';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

/** @type {(...paths: string[]) => string} */
TinyI18Browser._join = joinUrl;
/** @type {false} */
TinyI18Browser._existsSync = false;
/** @type {(path: string, options?: string) => Promise<string>} */
TinyI18Browser._readFile = readFile;
/** @type {(path: string, data: string, options?: string) => Promise<void>} */
TinyI18Browser._writeFile = writeFile;

export default TinyI18Browser;
