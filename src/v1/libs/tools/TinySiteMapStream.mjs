import { Transform } from 'node:stream';
import TinySiteMap from './TinySiteMap.mjs';

/**
 * @typedef {Object} TinySiteMapStreamOptions
 * @property {string} [hostname] - Base URL for relative paths.
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
  /** @type {'normal'|'index'} */
  #type;
  /** @type {string} */
  #hostname;
  /** @type {TinySiteMapStreamOptions} */
  #options;
  /** @type {SitemapNamespace[]} */
  #namespaces;

  /**
   * @param {TinySiteMap} instance - An instance of TinySiteMap to inherit configuration.
   * @param {TinySiteMapStreamOptions} [options] - Stream-specific options.
   */
  constructor(instance, options = {}) {
    super({ objectMode: true });

    this.#type = instance.type;
    this.#hostname = options.hostname || instance.baseUrl;
    this.#options = {
      level: 'warn',
      lastmodDateOnly: false,
      ...options,
    };

    // Replicate the TinySiteMap state securely
    this._config = {
      baseUrl: new URL(this.#hostname),
      type: this.#type,
      maxResolvedUrlSize: instance.maxResolvedUrlSize || 2048,
      regex: TinySiteMap.xmlNameRegex,
    };

    // Mirrors the exact namespace resolution logic from TinySiteMap.generateXml()
    if (this.#options.xmlns) {
      this.#namespaces = this.#options.xmlns;
    } else {
      // Safely access the instance property. In a real scenario you might need an accessor
      // in TinySiteMap if namespaceStrategy is fully private, but assuming it's accessible:
      const dynamicNamespaces =
        typeof instance.namespaceStrategy === 'function'
          ? instance.namespaceStrategy(instance)
          : [];

      this.#namespaces = [...dynamicNamespaces, ...instance.namespaces];
    }
  }

  /**
   * Generates the XML fragment for a single entry.
   * @param {SitemapEntry|SitemapIndexEntry} entry
   * @param {'normal'|'index'} type
   * @param {boolean} [lastmodDateOnly]
   * @returns {string}
   */
  static generateEntryXml(entry, type, lastmodDateOnly = false) {
    /** @type {SitemapEntry} */
    const e = entry;

    let lastmodStr = '';
    if (e.lastmod) {
      const dateObj = new Date(e.lastmod);
      lastmodStr = lastmodDateOnly ? dateObj.toISOString().split('T')[0] : dateObj.toISOString();
    }

    if (type === 'index') {
      return `  <sitemap>\n    <loc>${TinySiteMap.escapeXml(e.loc, false)}</loc>\n${
        lastmodStr ? `    <lastmod>${lastmodStr}</lastmod>\n` : ''
      }  </sitemap>\n`;
    }

    let xml = `  <url>\n    <loc>${TinySiteMap.escapeXml(e.loc, false)}</loc>\n`;
    if (lastmodStr) xml += `    <lastmod>${lastmodStr}</lastmod>\n`;
    if (e.changefreq)
      xml += `    <changefreq>${TinySiteMap.escapeXml(e.changefreq, false)}</changefreq>\n`;
    if (e.priority !== undefined) xml += `    <priority>${e.priority.toFixed(1)}</priority>\n`;

    if (e.customTags) {
      for (const [tag, value] of Object.entries(e.customTags)) {
        xml += `    <${TinySiteMap.escapeXml(tag, true)}>${TinySiteMap.escapeXml(value, false)}</${tag}>\n`;
      }
    }
    xml += `  </url>\n`;
    return xml;
  }

  /**
   * Generates the XML header.
   * @param {SitemapNamespace[]} namespaces
   * @param {string} [xslUrl]
   * @param {'normal'|'index'} [type]
   * @returns {string}
   */
  static generateHeader(namespaces, xslUrl, type) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    if (xslUrl) {
      xml += `<?xml-stylesheet type="text/xsl" href="${TinySiteMap.escapeXml(xslUrl, true)}"?>\n`;
    }

    let rootAttributes = '';
    for (const ns of namespaces) {
      const nsType = ns.type ?? 'xmlns';
      const val = ns.value ?? ns.uri ?? '';

      if (nsType === 'attribute') {
        rootAttributes += ` ${ns.name}="${TinySiteMap.escapeXml(val, true)}"`;
      } else {
        const prefixPart = ns.prefix ? `:${ns.prefix}` : '';
        rootAttributes += ` xmlns${prefixPart}="${TinySiteMap.escapeXml(val, true)}"`;
      }
    }

    xml += type === 'index' ? `<sitemapindex${rootAttributes}>\n` : `<urlset${rootAttributes}>\n`;
    return xml;
  }

  /**
   * @param {import('./TinySiteMap.mjs').SitemapEntry | import('./TinySiteMap.mjs').SitemapIndexEntry} entry
   * @param {string} encoding
   * @param {import('node:stream').TransformCallback} callback
   */
  _transform(entry, encoding, callback) {
    try {
      if (!this.#hasHeadOutput) {
        const header = TinySiteMapStream.generateHeader(
          this.#namespaces,
          this.#options.xslUrl,
          this.#type,
        );
        this.push(header);
        this.#hasHeadOutput = true;
      }

      const validated = TinySiteMap.resolveAndValidate(
        entry,
        this._config.baseUrl,
        this.#type,
        this._config.maxResolvedUrlSize,
        this._config.regex,
      );

      const xmlFragment = TinySiteMapStream.generateEntryXml(
        validated,
        this.#type,
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
      // If nothing was written (empty stream), generate the header before closing
      const header = TinySiteMapStream.generateHeader(
        this.#namespaces,
        this.#options.xslUrl,
        this.#type,
      );
      this.push(header);
    }

    const footer = this.#type === 'index' ? '</sitemapindex>' : '</urlset>';
    this.push(footer);
    cb();
  }
}

export default TinySiteMapStream;
