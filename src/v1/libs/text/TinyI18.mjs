import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join as pathJoin } from 'path';
import { createCheckDestroyed } from '../utils/tools.mjs';

const checkDestroy = createCheckDestroyed('TinyI18');

/**
 * Supported operating modes for TinyI18.
 * - `"local"` → All translations are managed entirely in memory (browser + Node.js).
 * - `"file"` → Translations are loaded from JSON files on disk (Node.js only).
 * @typedef {"local" | "file"} ModeTypes
 */

/**
 * Dictionary of translation keys mapped to values.
 *
 * @typedef {Record<string, any>} Dict - A collection of key-value pairs for translations.
 */

/**
 * Represents a translation entry as it appears in JSON files.
 *
 * @typedef {Object} FileValueBase
 * @property {string} $pattern - Regex string (will be compiled into RegExp).
 * @property {string} $fn - Helper function name associated with this entry.
 * @property {string} [key] - Additional key-value pairs for interpolation or extra metadata.
 */

/**
 * @typedef {FileValueBase & { [key: string]: string }} FileValue
 */

/**
 * Represents a valid locale code string.
 * Example: "en", "pt-BR", "fr".
 *
 * @typedef {string} LocaleCode - A string representing a valid locale identifier.
 */

/**
 * Value types stored per locale.
 *
 * @typedef {string|{ $fn: string; args?: any }} TranslationValue - The type of a value used in a translation entry.
 */

/**
 * A resolved translation value.
 *
 * @typedef {string|null} SimpleTranslationValue - A resolved translation value, typically a string or null.
 */

/**
 * Represents a single regex-based translation entry.
 *
 * @typedef {Object} PatternEntry - A representation of a translation entry that matches via a regular expression.
 * @property {RegExp} $pattern - Compiled regular expression used for matching.
 * @property {TranslationValue} value - Translation value or resolver function associated with the pattern.
 * @property {TranslationValue} elseValue - Translation value or resolver function associated with the pattern.
 */

/**
 * Configuration options for the TinyI18 instance.
 *
 * @typedef {Object} TinyI18Options - Configuration options for the TinyI18 constructor.
 * @property {ModeTypes} mode
 * @property {LocaleCode} defaultLocale
 * @property {string} [basePath] - Required in file mode. Directory with <locale>.json
 * @property {Dict} [localResources] - Optional initial map { locale: dict } for local mode
 * @property {boolean} [strict=true] - If true, throws on missing keys; else returns key
 * @property {boolean} [acceptNullResults=false]
 */

/**
 * Options used to customize the translation resolution process.
 *
 * @typedef {Object} ResolveOptions - Options to control the translation resolution process.
 * @property {LocaleCode} [locale] - force resolve using a specific locale first
 */

/**
 * Statistics for a specific locale.
 *
 * @typedef {Object} StatLocale - Information about the contents and status of a specific locale.
 * @property {string} locale - The locale code (e.g., "en", "pt-BR").
 * @property {number} strings - Total number of static string entries in this locale.
 * @property {number} patterns - Total number of regex-based pattern entries in this locale.
 * @property {boolean} isDefault - Whether this locale is the default fallback.
 * @property {boolean} isCurrent - Whether this locale is currently loaded/active.
 */

/**
 * Read-only view of registered helpers, exposed to function-based entries.
 *
 * Provides safe access to:
 * - check if a helper exists by name
 * - call a helper by name, passing arguments
 *
 * @template {any} T
 * @template {any} R
 * @typedef {Object} HelpersReadonly - A read-only interface for interacting with registered helpers.
 * @property {(name: string) => boolean} [has] - Check if a helper with given name is registered.
 * @property {(name: string, arg: T, extras?: HelpersReadonly<T, R>) => R} [call] -
 * Invoke a helper by name with an argument and optional extras.
 */

/**
 * A helper callback function used in translations.
 *
 * - Receives user-supplied parameters and a read-only facade for calling other helpers.
 * - Must return a string (e.g. processed, interpolated, or formatted output).
 *
 * @template {any} T
 * @template {any} R
 * @callback HelperCallback
 * @param {Dict} params - Key-value parameters passed from the translation entry.
 * @param {HelpersReadonly<T, R>} helpers - Read-only access to other registered helpers.
 * @returns {string} Processed string result.
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
class TinyI18 {
  /**
   * Merges multiple JSON locale files into a single file for TinyI18 usage.
   * @param {Object} options
   * @param {string[]} options.files - List of JSON file paths to merge.
   * @param {string} options.output - Path where the merged JSON file will be written.
   * @param {number} [options.spaces=0] - Number of spaces to use for indentation in the output file (0 for compact JSON).
   * @throws {TypeError} If arguments are invalid.
   * @throws {Error} If file reading or writing fails.
   */
  static async mergeLocaleFiles({ files, output, spaces = 0 }) {
    if (typeof spaces !== 'number' || Number.isNaN(spaces) || spaces < 0)
      throw new TypeError('mergeLocaleFiles: "spaces" must be a non-negative number');
    if (!Array.isArray(files) || files.length === 0)
      throw new TypeError('mergeLocaleFiles: "files" must be a non-empty array of file paths');
    if (typeof output !== 'string' || !output)
      throw new TypeError('mergeLocaleFiles: "output" must be a non-empty string path');

    const merged = {};

    for (const filePath of files) {
      if (typeof filePath !== 'string' || !filePath)
        throw new TypeError('mergeLocaleFiles: each file path must be a non-empty string');
      if (!existsSync(filePath))
        throw new Error(`mergeLocaleFiles: file "${filePath}" does not exist`);

      const raw = await readFile(filePath, 'utf-8');
      let json;
      try {
        json = JSON.parse(raw);
      } catch (err) {
        throw new Error(`mergeLocaleFiles: file "${filePath}" is not valid JSON`);
      }

      // Deep merge (locale-based)
      Object.assign(merged, json);
    }

    await writeFile(output, JSON.stringify(merged, null, spaces), 'utf-8');
  }

  /**
   * Tracks whether the instance has been destroyed.
   * @type {boolean}
   */
  #destroyed = false;

  /**
   * Gets the current destruction status of the instance.
   *
   * @returns {boolean} True if the instance is destroyed, false otherwise.
   */
  get destroyed() {
    return this.#destroyed;
  }

  /** @type {ModeTypes} */
  #mode;
  /** @type {LocaleCode} */
  #defaultLocale;
  /** @type {LocaleCode|null} */
  #currentLocale = null;
  /** @type {boolean} */
  #strict;
  /** @type {boolean} */
  #acceptNullResults = false;
  /** @type {string|null} */
  #basePath = null;

  /** @type {Map<LocaleCode, Dict>} */
  #stringTables = new Map(); // plain key => string | { $fn } | Function

  /** @type {Map<LocaleCode, PatternEntry[]>} */
  #patternTables = new Map(); // array of { $pattern: RegExp, value }

  // Helpers registry for function-based entries in both modes.
  /** @type {Map<string, HelperCallback<any, any>>} */
  #helpers = new Map();

  /** @type {Map<string, RegExp>} */
  #regexCache = new Map();

  /**
   * Gets the currently selected locale, or null if only default is active.
   * @returns {LocaleCode|null}
   */
  get currentLocale() {
    checkDestroy(this.#destroyed);
    return this.#currentLocale;
  }

  /**
   * The default locale code chosen at construction time.
   * This locale is always kept in memory as a fallback.
   * @type {LocaleCode}
   */
  get defaultLocale() {
    checkDestroy(this.#destroyed);
    return this.#defaultLocale;
  }

  /**
   * The current operating mode of this instance.
   * Determines whether translations are managed in memory ("local")
   * or loaded from JSON files ("file").
   * @type {ModeTypes}
   */
  get mode() {
    checkDestroy(this.#destroyed);
    return this.#mode;
  }

  /**
   * Whether strict mode is enabled.
   * - `true` → Missing keys, invalid regex, or helper errors throw exceptions.
   * - `false` → Failures are ignored silently, returning fallback values.
   * @type {boolean}
   */
  get strict() {
    checkDestroy(this.#destroyed);
    return this.#strict;
  }

  get acceptNullResults() {
    checkDestroy(this.#destroyed);
    return this.#acceptNullResults;
  }

  /**
   * Base directory path used in `"file"` mode to locate locale JSON files.
   * - In `"local"` mode this will always be `null`.
   * - In `"file"` mode this is the root folder passed to the constructor.
   * @type {string|null}
   */
  get basePath() {
    checkDestroy(this.#destroyed);
    return this.#basePath;
  }

  /**
   * Returns basic stats for debugging/memory insights.
   * @returns {StatLocale[]}
   */
  get stats() {
    checkDestroy(this.#destroyed);
    const locales = [];
    for (const loc of this.#stringTables.keys()) locales.push(this.getStatsForLocale(loc));
    return locales;
  }

  /**
   * Deep-cloned view of string tables (Map → Object).
   * Preserves strings, $fn objects, and functions.
   * @returns {Record<string, Dict>}
   */
  get stringTables() {
    checkDestroy(this.#destroyed);
    /** @type {Record<string, Dict>} */
    const obj = {};
    for (const [locale, dict] of this.#stringTables.entries()) {
      obj[locale] = this.#deepClone(dict);
    }
    return obj;
  }

  /**
   * Deep-cloned view of pattern tables (Map → Object).
   * Recreates RegExp objects to avoid mutation.
   * @returns {Record<string, PatternEntry[]>}
   */
  get patternTables() {
    checkDestroy(this.#destroyed);
    /** @type {Record<string, PatternEntry[]>} */
    const obj = {};
    for (const [locale, arr] of this.#patternTables.entries()) {
      obj[locale] = arr.map((e) => ({
        $pattern: new RegExp(e.$pattern.source, e.$pattern.flags),
        value: this.#deepClone(e.value),
        elseValue: this.#deepClone(e.elseValue),
      }));
    }
    return obj;
  }

  /**
   * Deep-cloned view of helpers (Map → Object).
   * Functions are referenced (cannot deep clone functions).
   * @returns {Record<string, HelperCallback<any, any>>}
   */
  get helpers() {
    checkDestroy(this.#destroyed);
    /** @type {Record<string, HelperCallback<any, any>>} */
    const obj = {};
    for (const [name, fn] of this.#helpers.entries()) {
      obj[name] = fn;
    }
    return obj;
  }

  /**
   * Deep-cloned view of regex cache (Map → Object).
   * Recreates RegExp objects to avoid mutation.
   * @returns {Record<string, RegExp>}
   */
  get regexCache() {
    checkDestroy(this.#destroyed);
    /** @type {Record<string, RegExp>} */
    const obj = {};
    for (const [key, re] of this.#regexCache.entries()) {
      obj[key] = new RegExp(re.source, re.flags);
    }
    return obj;
  }

  // -------------------- Internal: resolution & materialization --------------------

  /**
   * Utility for deep cloning values inside Maps.
   * - Strings are returned as-is
   * - Objects/arrays are recursively cloned
   * - Functions are returned as-is
   * - RegExp are cloned
   * @param {any} value
   * @returns {any}
   */
  #deepClone(value) {
    if (
      value == null ||
      typeof value === 'string' ||
      typeof value === 'function' ||
      typeof value === 'number'
    )
      return value;
    if (value instanceof RegExp) return new RegExp(value.source, value.flags);
    if (Array.isArray(value)) return value.map((v) => this.#deepClone(v));
    if (typeof value === 'object') {
      /** @type {Record<string, any>} */
      const clone = {};
      for (const [k, v] of Object.entries(value)) {
        clone[k] = this.#deepClone(v);
      }
      return clone;
    }
    return value;
  }

  /**
   * Determines the resolution order of locales.
   *
   * @param {string} [forceLocale] - Optional locale to prioritize first.
   * @returns {string[]} Ordered list of locale codes to try.
   */
  #resolveOrder(forceLocale) {
    if (forceLocale !== undefined && typeof forceLocale !== 'string')
      throw new TypeError('#resolveOrder: "forceLocale" must be a string if provided');

    /** @type {LocaleCode[]} */
    const order = [];
    if (forceLocale && typeof forceLocale === 'string' && this.#stringTables.has(forceLocale))
      order.push(forceLocale);
    else if (this.#currentLocale) order.push(this.#currentLocale);

    // default is always last if not skipped externally
    order.push(this.#defaultLocale);
    return order;
  }

  /**
   * Resolves a key exactly from a set of locales.
   *
   * @param {string[]} order - Array of locale codes in resolution order.
   * @param {string} key - Key to look up.
   * @returns {any} The value for the key if found, otherwise undefined.
   */
  #resolveExact(order, key) {
    if (!Array.isArray(order) || !order.every((value) => typeof value === 'string'))
      throw new TypeError('#resolveExact: "order" must be an array of strings');
    if (typeof key !== 'string' || !key)
      throw new TypeError('#resolveExact: "key" must be a non-empty string');
    for (const loc of order) {
      const table = /** @type {Dict} */ (this.#stringTables.get(loc));
      if (table && Object.prototype.hasOwnProperty.call(table, key)) {
        return table[key];
      }
    }
    return undefined;
  }

  /**
   * Resolves a key by matching it against regex patterns in the locale tables.
   *
   * @param {string[]} order - Array of locale codes in resolution order.
   * @param {string} key - Key to match against patterns.
   * @returns {any} The value associated with the matching pattern, or undefined.
   */
  #resolveByPattern(order, key) {
    if (!Array.isArray(order) || !order.every((value) => typeof value === 'string'))
      throw new TypeError('#resolveByPattern: "order" must be an array of strings');
    if (typeof key !== 'string' || !key)
      throw new TypeError('#resolveByPattern: "key" must be a non-empty string');
    for (const loc of order) {
      const patterns = this.#patternTables.get(loc) || [];
      for (const entry of patterns) {
        if (entry.$pattern.test(key)) return entry.value;
        else return entry.elseValue ?? undefined;
      }
    }
    return undefined;
  }

  /**
   * Value can be:
   * - string
   * - function (params, helpers) => any
   * - { $fn: string, args?: any }   // file mode placeholder resolved via helpers
   *
   * @template {any} T
   * @template {any} R
   * @param {string | HelperCallback<T, R> | { $fn: string; args?: any }} value
   * @param {Dict} [params]
   * @returns {string}
   */
  #materialize(value, params) {
    if (value === null || value === undefined) {
      if (this.#strict) throw new TypeError('#materialize: "value" cannot be null or undefined');
      return '';
    }

    if (typeof value === 'string') return this.#interpolate(value, params);
    if (typeof value === 'function') return value(params ?? {}, this.#helpersReadonly());

    if (value && typeof value === 'object' && typeof value.$fn === 'string') {
      const fn = this.#helpers.get(value.$fn);
      if (typeof fn !== 'function') {
        if (this.#strict) throw new Error(`TinyI18: helper "${value.$fn}" is not registered`);
        return '';
      }
      const args = value.args !== undefined ? value.args : undefined;
      return fn({ ...(params ?? {}), args }, this.#helpersReadonly());
    }
    // Unknown entry type
    if (this.#strict) throw new Error('TinyI18: unsupported entry type');
    return '';
  }

  /**
   * Interpolates values into a template string using {named} placeholders.
   *
   * @param {string} template - Template string containing placeholders.
   * @param {Dict} [params] - Object containing values to interpolate.
   * @returns {string} The interpolated string.
   */
  #interpolate(template, params) {
    if (typeof template !== 'string')
      throw new TypeError('#interpolate: "template" must be a string');
    if (params !== undefined && (params === null || typeof params !== 'object'))
      throw new TypeError('#interpolate: "params" must be an object if provided');

    if (!params || typeof params !== 'object') return template;
    // Simple {name} interpolation, no ICU. Escapes are not added; caller controls HTML safety.
    return template.replace(/\{([a-zA-Z0-9_.$-]+)\}/g, (_, name) => {
      const val = this.#dotGet(params, name);
      return val === undefined || val === null ? '' : String(val);
    });
  }

  /**
   * Safely retrieves a nested property from an object using dot notation.
   *
   * @param {Dict} obj - Object to retrieve from.
   * @param {string} path - Dot-separated path string (e.g., "a.b.c").
   * @returns {Dict|undefined} Value at the given path, or undefined if any part is missing.
   */
  #dotGet(obj, path) {
    if (!obj || typeof obj !== 'object') throw new TypeError('#dotGet: "obj" must be an object');
    if (typeof path !== 'string' || !path)
      throw new TypeError('#dotGet: "path" must be a non-empty string');

    const parts = path.split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return undefined;
      cur = cur[p];
    }
    return cur;
  }

  /**
   * Provides a read-only facade for calling registered helpers safely.
   *
   * @returns {HelpersReadonly<any, any>} Read-only helper access.
   */
  #helpersReadonly() {
    // Provide a minimal read-only facade for helpers to call other helpers safely if needed.
    return {
      has: (name) => this.#helpers.has(name),
      call: (name, arg, extras) => {
        const fn = this.#helpers.get(name);
        if (typeof fn !== 'function') throw new Error(`Helper "${name}" not found`);
        return fn(arg, extras ?? {});
      },
    };
  }

  // -------------------- Internal: ingesting locale data --------------------

  /**
   * Ingests and flattens locale data into the internal string and pattern tables.
   *
   * @param {string} locale - Locale code to ingest.
   * @param {Dict} raw - Raw locale data object.
   */
  #ingestLocale(locale, raw) {
    if (typeof locale !== 'string' || !locale)
      throw new TypeError('#ingestLocale: "locale" must be a non-empty string');
    if (!raw || typeof raw !== 'object')
      throw new TypeError('#ingestLocale: "raw" must be an object');

    if (typeof locale !== 'string' || !locale) throw new TypeError('#ingestLocale: invalid locale');
    if (!raw || typeof raw !== 'object')
      throw new TypeError('#ingestLocale: "raw" must be an object');

    /** @type {Dict} */
    const flat = { ...(this.#stringTables.get(locale) ?? {}) };
    /** @type {PatternEntry[]} */
    const patterns = [...(this.#patternTables.get(locale) ?? [])];

    /**
     * @param {string} prefix
     * @param {Dict} node
     */
    const walk = (prefix, node) => {
      if (node == null) return;
      if (
        typeof node === 'string' ||
        typeof node === 'function' ||
        (node && typeof node === 'object' && typeof node.$fn === 'string')
      ) {
        if (!prefix) throw new TypeError('Leaf value requires a key path');
        flat[prefix] = node;
        return;
      }
      if (node && typeof node === 'object') {
        // Pattern form in local mode can be { $pattern: RegExp, value: ... }
        if (
          node.$pattern instanceof RegExp &&
          Object.prototype.hasOwnProperty.call(node, 'value')
        ) {
          patterns.push({ $pattern: node.$pattern, value: node.value, elseValue: node.elseValue });
          return;
        }
        for (const [k, v] of Object.entries(node)) {
          const path = prefix ? `${prefix}.${k}` : k;
          walk(path, v);
        }
      }
    };

    walk('', raw);

    this.#stringTables.set(locale, flat);
    this.#patternTables.set(locale, patterns);

    // Ensure default exists
    if (!this.#stringTables.has(this.#defaultLocale)) {
      this.#stringTables.set(this.#defaultLocale, {});
      this.#patternTables.set(this.#defaultLocale, []);
    }
  }

  /**
   * Unloads a previously loaded locale, except the default locale.
   *
   * @param {string} locale - Locale code to unload.
   */
  #unloadLocale(locale) {
    if (typeof locale !== 'string' || !locale)
      throw new TypeError('#unloadLocale: "locale" must be a non-empty string');
    if (locale === this.#defaultLocale) return; // never unload default
    this.#stringTables.delete(locale);
    this.#patternTables.delete(locale);
  }

  // -------------------- File mode loading --------------------

  /**
   * Loads and flattens a locale JSON file into internal maps (file mode only).
   *
   * - Keys are dot-flattened.
   * - `$pattern` entries are compiled to RegExp and stored in the pattern table.
   * - `$fn` references are preserved for later resolution via helpers.
   *
   * @param {LocaleCode} locale - Locale identifier (e.g. "en", "pt-BR").
   * @returns {Promise<void>}
   */
  async #loadLocaleFromFile(locale) {
    if (typeof locale !== 'string' || !locale)
      throw new TypeError('#loadLocaleFromFile: "locale" must be a non-empty string');
    if (typeof this.#basePath !== 'string' || !this.#basePath)
      throw new TypeError('#loadLocaleFromFile: "this.#basePath" must be a non-empty string');
    const file = pathJoin(this.#basePath, `${locale}.json`);
    let json;
    try {
      const raw = await readFile(file, 'utf8');
      json = JSON.parse(raw);
    } catch (err) {
      if (!(err instanceof Error)) return;
      if (this.#strict) throw new Error(`TinyI18: failed to load or parse ${file}: ${err.message}`);
      // register empty to avoid repeated I/O
      this.#stringTables.set(locale, {});
      this.#patternTables.set(locale, []);
      return;
    }

    /**
     * Convert JSON to internal form: flatten + compile patterns + keep $fn placeholders
     * @type {Dict}
     */
    const flat = { ...(this.#stringTables.get(locale) ?? {}) };
    /** @type {PatternEntry[]} */
    const patterns = [...(this.#patternTables.get(locale) ?? [])];

    /**
     * @param {string} prefix
     * @param {FileValue|SimpleTranslationValue} node
     */
    const walk = (prefix, node) => {
      if (node == null) return;

      // { "$pattern": "regex", "value": ... }
      if (
        node &&
        typeof node === 'object' &&
        typeof node.$pattern === 'string' &&
        Object.prototype.hasOwnProperty.call(node, 'value')
      ) {
        const regex = this.#safeRegExp(node.$pattern);
        patterns.push({
          $pattern: regex,
          value: this.#coerceFileValue(node.value),
          elseValue: this.#coerceFileValue(node.elseValue),
        });
        return;
      }

      // Leaf as string or $fn reference
      if (
        typeof node === 'string' ||
        (node && typeof node === 'object' && typeof node.$fn === 'string')
      ) {
        if (!prefix) throw new TypeError('Leaf value requires a key path');
        flat[prefix] = this.#coerceFileValue(node);
        return;
      }

      // Nested object
      if (node && typeof node === 'object') {
        for (const [k, v] of Object.entries(node)) {
          const path = prefix ? `${prefix}.${k}` : k;
          walk(path, v);
        }
      }
    };

    walk('', json);

    this.#stringTables.set(locale, flat);
    this.#patternTables.set(locale, patterns);
  }

  /**
   * Returns a cached RegExp for the given source, compiling if needed.
   * In strict mode, throws on invalid regex; otherwise returns a never-matching regex.
   *
   * @param {string} src - Regex source pattern (no flags allowed).
   * @returns {RegExp}
   */
  #safeRegExp(src) {
    if (typeof src !== 'string' || !src)
      throw new TypeError('#safeRegExp: "src" must be a non-empty string');
    const tinyReg = this.#regexCache.get(src);
    if (tinyReg) return tinyReg;
    // Basic safety wrapper; no flags support in JSON to keep it simple and deterministic.
    try {
      const re = new RegExp(src);
      this.#regexCache.set(src, re);
      return re;
    } catch {
      if (this.#strict) throw new Error(`TinyI18: invalid regex "${src}" in file`);
      return /^$/; // never matches
    }
  }

  /**
   * Normalizes a file-based JSON value into an internal representation.
   *
   * Supported:
   * - string → returned as-is
   * - { $fn: string, args?: any } → preserved for helper resolution
   *
   * @param {string|FileValue} v
   * @returns {TranslationValue}
   */
  #coerceFileValue(v) {
    // Strings pass through; objects with $fn kept as-is; everything else ignored gracefully
    if (typeof v === 'string') return v;
    if (v && typeof v === 'object' && typeof v.$fn === 'string') {
      // ensure only serializable args pass through
      return { $fn: String(v.$fn), args: v.args };
    }
    if (this.#strict) throw new Error('TinyI18: unsupported value in file JSON');
    return '';
  }

  // -------------------- External: constructor stuff --------------------

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
    if (!options || typeof options !== 'object') {
      throw new TypeError('TinyI18: options must be an object');
    }
    const {
      mode,
      defaultLocale,
      basePath,
      localResources,
      strict = true,
      acceptNullResults = false,
    } = options;

    if (mode !== 'local' && mode !== 'file')
      throw new TypeError('TinyI18: "mode" must be "local" or "file"');
    if (typeof defaultLocale !== 'string' || !defaultLocale)
      throw new TypeError('TinyI18: "defaultLocale" must be a non-empty string');
    if (typeof strict !== 'boolean') throw new TypeError('TinyI18: "strict" must be a boolean');
    if (typeof acceptNullResults !== 'boolean')
      throw new TypeError('TinyI18: "acceptNullResults" must be a boolean');

    if (mode === 'file') {
      if (typeof basePath !== 'string' || !basePath)
        throw new TypeError('TinyI18: "basePath" is required in file mode');
      this.#basePath = basePath;
    }

    this.#mode = mode;
    this.#defaultLocale = defaultLocale;
    this.#strict = strict;
    this.#acceptNullResults = acceptNullResults;

    if (mode === 'local' && localResources && typeof localResources === 'object') {
      for (const [loc, data] of Object.entries(localResources)) {
        this.#ingestLocale(loc, data);
      }
    }

    // Ensure default locale is present (empty if not provided yet).
    if (!this.#stringTables.has(this.#defaultLocale)) {
      this.#stringTables.set(this.#defaultLocale, {});
      this.#patternTables.set(this.#defaultLocale, []);
    }

    // Selected locale starts null; user may call setLocale() after constructor.
  }

  /**
   * Clears the internal regex cache.
   *
   * The regex cache stores compiled {@link RegExp} objects to avoid
   * recompiling frequently used patterns. This wrapper ensures cache
   * management is always controlled via the API instead of direct access.
   */
  clearRegexCache() {
    checkDestroy(this.#destroyed);
    this.#regexCache.clear();
  }

  /**
   * Registers a helper function available to function-based entries and $fn references.
   * @template {any} T
   * @template {any} R
   * @param {string} name
   * @param {HelperCallback<T, R>} fn
   */
  registerHelper(name, fn) {
    checkDestroy(this.#destroyed);
    if (typeof name !== 'string' || !name)
      throw new TypeError('registerHelper: "name" must be non-empty string');
    if (typeof fn !== 'function') throw new TypeError('registerHelper: "fn" must be a function');
    this.#helpers.set(name, fn);
  }

  /**
   * Unregisters a previously registered helper function.
   *
   * If the helper does not exist, this method silently does nothing.
   *
   * @param {string} name - The name of the helper to remove.
   * @returns {boolean} `true` if the helper was removed, `false` if it was not found.
   */
  unregisterHelper(name) {
    checkDestroy(this.#destroyed);
    if (typeof name !== 'string' || !name)
      throw new TypeError('unregisterHelper: "name" must be non-empty string');
    return this.#helpers.delete(name);
  }

  /**
   * Loads or updates a locale data in-memory (local mode only).
   * @param {LocaleCode} locale
   * @param {Dict} data
   */
  loadLocaleLocal(locale, data) {
    checkDestroy(this.#destroyed);
    if (this.#mode !== 'local')
      throw new TypeError('loadLocaleLocal is only available in "local" mode');
    this.#ingestLocale(locale, data);
  }

  /**
   * Sets the current selected locale. In file mode, loads it from disk.
   * Keeps only the default and the selected locale in memory (unloads previous selected).
   * @param {LocaleCode|null} locale - null -> keep only default
   */
  async setLocale(locale) {
    checkDestroy(this.#destroyed);
    if (locale !== null && (typeof locale !== 'string' || !locale))
      throw new TypeError('setLocale: "locale" must be string or null');

    const prev = this.#currentLocale;
    // Load or ensure presence
    if (locale !== null) {
      if (this.#mode === 'file') await this.#loadLocaleFromFile(locale);
      else if (!this.#stringTables.has(locale)) {
        // local mode: if not previously provided, create empty containers
        this.#stringTables.set(locale, {});
        this.#patternTables.set(locale, []);
      }
    }

    // Unload previous selected if different and not default
    if (this.#mode === 'file' && prev && prev !== this.#defaultLocale && prev !== locale)
      this.#unloadLocale(prev);

    this.#currentLocale = locale;
  }

  /**
   * Resolves a translation by exact key.
   *
   * Resolution order:
   * 1. Current locale (if set)
   * 2. Default locale (fallback)
   *
   * @param {string} key - Translation key (dot.notation).
   * @param {Dict} [params] - Parameters for string interpolation or helper functions.
   * @param {ResolveOptions} [options] - Override resolution options (e.g., force locale).
   * @returns {SimpleTranslationValue} - Usually string, but may be HTMLElement, DocumentFragment, or any return type from a helper.
   */
  t(key, params = undefined, options = undefined) {
    return this.get(key, params, options);
  }

  /**
   * Alias of t()
   * @param {string} key
   * @param {Dict} [params]
   * @param {ResolveOptions} [options]
   * @returns {SimpleTranslationValue}
   */
  get(key, params = undefined, options = undefined) {
    checkDestroy(this.#destroyed);
    if (typeof key !== 'string' || !key)
      throw new TypeError('get: "key" must be a non-empty string');

    const { locale: forceLocale } = options || {};

    const order = this.#resolveOrder(forceLocale);
    let resolved = this.#resolveExact(order, key);
    if (resolved === undefined) {
      if (this.#strict) throw new Error(`TinyI18: missing translation for key "${key}"`);
      if (this.#acceptNullResults) return null;
      return key; // graceful fallback to key
    }

    return this.#materialize(resolved, params);
  }

  /**
   * Resolves a translation by regex pattern match.
   *
   * If multiple patterns exist, returns the first matching entry.
   *
   * @param {string} key - Input string to test against regex patterns.
   * @param {ResolveOptions} [options] - Override resolution options (e.g., force locale).
   * @returns {SimpleTranslationValue} - Translation value (string or custom return type).
   */
  p(key, options) {
    return this.resolveByPattern(key, options);
  }

  /**
   * Alias of p()
   * @param {string} key
   * @param {ResolveOptions} [options]
   * @returns {SimpleTranslationValue}
   */
  resolveByPattern(key, options) {
    checkDestroy(this.#destroyed);
    if (typeof key !== 'string' || !key)
      throw new TypeError('get: "key" must be a non-empty string');
    const { locale: forceLocale } = options || {};
    const order = this.#resolveOrder(forceLocale);
    let resolved = this.#resolveByPattern(order, key);
    if (resolved === undefined) {
      if (this.#strict) throw new Error(`TinyI18: missing translation for key "${key}"`);
      if (this.#acceptNullResults) return null;
      return key; // graceful fallback to key
    }
    return resolved;
  }

  /**
   * Clears everything except the default locale (keeps its data).
   * Selected locale becomes null.
   */
  resetToDefaultOnly() {
    checkDestroy(this.#destroyed);
    if (this.#mode === 'file') {
      for (const loc of Array.from(this.#stringTables.keys())) {
        if (loc !== this.#defaultLocale) {
          this.#unloadLocale(loc);
        }
      }
    }
    this.#currentLocale = null;
  }

  /**
   * Returns stats for a specific locale.
   * @param {LocaleCode} locale
   * @returns {StatLocale}
   * @throws {Error} If the locale is not registered.
   */
  getStatsForLocale(locale) {
    checkDestroy(this.#destroyed);
    if (typeof locale !== 'string' || !locale)
      throw new TypeError('getStatsForLocale: "locale" must be a non-empty string');
    if (!this.#stringTables.has(locale))
      throw new Error(`getStatsForLocale: locale "${locale}" is not registered`);

    const strings = Object.keys(this.#stringTables.get(locale) ?? {}).length;
    const patterns = this.#patternTables.get(locale)?.length ?? 0;

    return {
      locale,
      strings,
      patterns,
      isDefault: locale === this.#defaultLocale,
      isCurrent: locale === this.#currentLocale,
    };
  }

  /**
   * Destroys the TinyI18 instance, clearing all internal maps and references
   * to free up memory. Once destroyed, the instance cannot be reused.
   *
   * @throws {Error} If the instance has already been destroyed.
   * @returns {void}
   */
  destroy() {
    if (this.#destroyed) return;

    // Clear all internal maps to release memory
    this.#stringTables.clear();
    this.#patternTables.clear();
    this.#helpers.clear();
    this.#regexCache.clear();

    // Reset locale and path configurations
    this.#currentLocale = null;
    this.#basePath = null;

    // Mark the instance as destroyed
    this.#destroyed = true;
  }
}

export default TinyI18;
