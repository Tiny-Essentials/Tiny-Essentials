import { joinUrl, readFile } from './browser-utils.mjs';
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
 * Not supported in the browser non-dom: `mergeLocaleFiles` is a build-time API.
 *
 * @type {(path: string, data: string, encoding?: string) => never}
 * @throws {Error} Always. Use the Node.js entry point instead.
 */
TinyI18Browser._writeFile = () => {
  throw new Error(
    'TinyI18: "mergeLocaleFiles" is not available in the browser; run it in Node.js at build time',
  );
};

/** @type {(...paths: string[]) => string} */
TinyI18Browser._join = joinUrl;
/** @type {false} */
TinyI18Browser._existsSync = false;
/** @type {(path: string, options?: string) => Promise<string>} */
TinyI18Browser._readFile = readFile;

export default TinyI18Browser;
