import { Transform } from 'node:stream';
import TinySiteMap from './TinySiteMap.mjs';

/**
 * @typedef {Object} TinySiteMapStreamOptions
 * @property {string} [hostname] - Base URL for relative paths.
 * @property {'silent'|'warn'|'error'} [level] - Error handling level. Defaults to 'warn'.
 * @property {boolean} [lastmodDateOnly] - Format lastmod as date only (YYYY-MM-DD).
 * @property {import('./TinySiteMap.mjs').SitemapNamespace[]} [xmlns] - XML namespaces to include.
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

    // Puxa as namespaces passadas nas opções ou herda as manuais da instância
    this.#namespaces = this.#options.xmlns || instance.namespaces;
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
      return `  <sitemap>\n    <loc>${TinySiteMap.escapeXml(e.loc)}</loc>\n    ${lastmodStr ? `<lastmod>${lastmodStr}</lastmod>\n` : ''}  </sitemap>\n`;
    }

    let xml = `  <url>\n    <loc>${TinySiteMap.escapeXml(e.loc)}</loc>\n`;
    if (lastmodStr) xml += `    <lastmod>${lastmodStr}</lastmod>\n`;
    if (e.changefreq)
      xml += `    <changefreq>${TinySiteMap.escapeXml(e.changefreq)}</changefreq>\n`;
    if (e.priority !== undefined) xml += `    <priority>${e.priority.toFixed(1)}</priority>\n`;

    if (e.customTags) {
      for (const [tag, value] of Object.entries(e.customTags)) {
        xml += `    <${tag}>${TinySiteMap.escapeXml(value)}</${tag}>\n`;
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
      xml += `<?xml-stylesheet type="text/xsl" href="${TinySiteMap.escapeXml(xslUrl)}"?>\n`;
    }

    let namespaceAttributes = '';
    for (const ns of namespaces) {
      const prefixPart = ns.prefix ? `:${ns.prefix}` : '';
      namespaceAttributes += ` xmlns${prefixPart}="${TinySiteMap.escapeXml(ns.uri)}"`;
    }

    xml +=
      type === 'index'
        ? `<sitemapindex${namespaceAttributes}>\n`
        : `<urlset${namespaceAttributes}>\n`;
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
      callback();
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      // Tratamento de erros baseado no nível configurado
      if (this.#options.level === 'error') {
        callback();
      } else {
        if (this.#options.level === 'warn') {
          console.warn(
            `[TinySiteMapStream Warn]: Falha ao processar entrada. Motivo: ${err.message}`,
          );
        }
        // Se for 'silent', simplesmente ignoramos o erro e o chunk inválido não vai pro XML.
        callback();
      }
    }
  }

  /**
   * @param {import('node:stream').TransformCallback } cb
   */
  _flush(cb) {
    if (!this.#hasHeadOutput) {
      // Se nada foi escrito (stream vazio), gera o header antes de fechar
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
