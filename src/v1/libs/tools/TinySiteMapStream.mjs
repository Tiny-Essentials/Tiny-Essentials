import { Transform } from 'node:stream';
import TinySiteMap from './TinySiteMap.mjs';

/**
 * @typedef {Object} TinySiteMapStreamOptions
 * @property {URL} [hostname] - Base URL for relative paths.
 * @property {'silent'|'warn'|'error'} [level] - Error handling level. Defaults to 'warn'.
 * @property {boolean} [lastmodDateOnly] - Format lastmod as date only (YYYY-MM-DD).
 * @property {import('./TinySiteMap.mjs').SitemapNamespace[]} [xmlns] - XML namespaces or attributes to include.
 * @property {string} [xslUrl] - URL to XSL stylesheet.
 */

/**
 * @typedef {import('./TinySiteMap.mjs').SitemapEntry} SitemapEntry
 * @typedef {import('./TinySiteMap.mjs').SitemapIndexEntry} SitemapIndexEntry
 * @typedef {import('./TinySiteMap.mjs').SitemapNamespace} SitemapNamespace
 */

/**
 * A Transform stream for generating XML sitemaps incrementally.
 * @extends Transform
 */
class TinySiteMapStream extends Transform {
  /** @type {boolean} */
  #hasHeadOutput = false;
  /** @type {TinySiteMapStreamOptions} */
  #options;
  /** @type {TinySiteMap} */
  #instance;

  /**
   * @param {TinySiteMap} instance - An instance of TinySiteMap to inherit configuration.
   * @param {TinySiteMapStreamOptions} [options] - Stream-specific options.
   */
  constructor(instance, options = {}) {
    super({ objectMode: true });

    this.#instance = instance;
    this.#options = {
      level: 'warn',
      lastmodDateOnly: false,
      ...options,
    };
  }

  /**
   * @param {SitemapEntry | SitemapIndexEntry} entry
   * @param {string} encoding
   * @param {import('node:stream').TransformCallback} callback
   */
  _transform(entry, encoding, callback) {
    try {
      if (!this.#hasHeadOutput) {
        // O Stream envia a declaração XML e o header como os primeiros chunks
        this.push('<?xml version="1.0" encoding="UTF-8"?>\n');
        this.push(TinySiteMap._generateHeader(this.#instance.namespaces, this.#options.xslUrl, this.#instance.type));
        this.#hasHeadOutput = true;
      }

      const validated = TinySiteMap.resolveAndValidate(
        entry,
        this.#instance.baseUrl,
        this.#instance.type,
        this.#instance.maxResolvedUrlSize,
        TinySiteMap.xmlNameRegex,
      );

      // Usa o método estático que já lida com a lógica de cada entrada
      const xmlFragment = TinySiteMap._generateEntry(
        validated,
        this.#instance.type,
        this.#options.lastmodDateOnly,
      );

      this.push(xmlFragment);
      callback(); // Success
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));

      if (this.#options.level === 'error') {
        // Emit the error properly in the Node.js Stream
        callback(err);
      } else {
        if (this.#options.level === 'warn') {
          console.warn(`[TinySiteMapStream Warn]: Failed to process entry. Reason: ${err.message}`);
        }
        // If 'silent', we ignore the error and the invalid chunk is skipped.
        callback();
      }
    }
  }

  /**
   * @param {import('node:stream').TransformCallback } cb
   */
  _flush(cb) {
    if (!this.#hasHeadOutput) {
      this.push('<?xml version="1.0" encoding="UTF-8"?>\n');
      this.push(TinySiteMap._generateHeader(this.#instance.namespaces, this.#options.xslUrl, this.#instance.type));
    }

    // Usa o método estático para o footer
    this.push(TinySiteMap._generateFooter(this.#instance.type));
    cb();
  }
}

export default TinySiteMapStream;
