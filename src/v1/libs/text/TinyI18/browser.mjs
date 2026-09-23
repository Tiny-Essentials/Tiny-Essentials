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

/** @type {false} */
TinyI18Browser._existsSync = false;

export default TinyI18Browser;
