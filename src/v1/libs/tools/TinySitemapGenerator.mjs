/**
 * @typedef {Object} SitemapEntry
 * @property {string} loc - The absolute URL of the page.
 * @property {string} [lastmod] - The last modified date in ISO 8601 format (e.g., '2023-10-27T10:00:00Z').
 * @property {'always'|'hourly'|'daily'|'weekly'|'monthly'|'yearly'|'never'} [changefreq] - How frequently the page is likely to change.
 * @property {number} [priority] - The importance of this URL relative to others (0.0 to 1.0).
 */

/**
 * @typedef {Object} SitemapConfig
 * @property {string} baseUrl - The base URL of the website (e.g., 'https://example.com').
 * @property {SitemapEntry[]} entries - An array of page entries to include in the sitemap.
 */

/**
 * A service to generate valid XML sitemaps.
 */
class TinySitemapGenerator {
  /** @type {string} */
  #baseUrl;
  /** @type {SitemapEntry[]} */
  #entries;

  /**
   * @param {SitemapConfig} config
   * @throws {TypeError} If the configuration structure or property types are invalid.
   * @throws {RangeError} If any entry priority is outside the 0.0 - 1.0 range.
   * @throws {Error} If the URL provided is malformed.
   */
  constructor(config) {
    this.#validateConfig(config);

    // Defensive Copy: We store a copy to prevent external mutation of the original array
    this.#baseUrl = config.baseUrl;
    this.#entries = config.entries.map((entry) => ({ ...entry }));
  }

  /**
   * Sanitizes strings to prevent XML Injection.
   * @param {string} str - The raw string.
   * @returns {string} The escaped string.
   */
  #escapeXml(str) {
    return str.replace(/[<>&"']/g, (char) => {
      switch (char) {
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '&':
          return '&amp;';
        case '"':
          return '&quot;';
        case "'":
          return '&apos;';
        default:
          return char;
      }
    });
  }

  /**
   * @param {SitemapConfig} config
   * @throws {TypeError}
   */
  #validateConfig(config) {
    if (typeof config !== 'object' || config === null) {
      throw new TypeError('Configuration must be a non-null object.');
    }

    if (typeof config.baseUrl !== 'string') {
      throw new TypeError('config.baseUrl must be a string.');
    }

    let base;
    try {
      base = new URL(config.baseUrl);
    } catch {
      throw new TypeError('config.baseUrl must be a valid absolute URL.');
    }
    this.#baseUrl = base.href; // Store normalized URL

    if (!Array.isArray(config.entries)) {
      throw new TypeError('config.entries must be an array.');
    }

    for (const entry of config.entries) {
      this.#validateEntry(entry, base);
    }
  }

  /**
   * @param {SitemapEntry} entry
   * @param {URL} baseUrlObj - The parsed base URL for origin comparison.
   * @throws {TypeError}
   * @throws {RangeError}
   */
  #validateEntry(entry, baseUrlObj) {
    if (typeof entry !== 'object' || entry === null) {
      throw new TypeError('Each entry must be a non-null object.');
    }

    // Validate loc: Must be string, must be valid URL, must match base origin
    if (typeof entry.loc !== 'string') {
      throw new TypeError('entry.loc must be a string.');
    }

    let entryUrl;
    try {
      entryUrl = new URL(entry.loc);
    } catch {
      throw new TypeError(`entry.loc "${entry.loc}" is not a valid absolute URL.`);
    }

    if (entryUrl.origin !== baseUrlObj.origin) {
      throw new TypeError(
        `entry.loc origin must match the base URL origin (${baseUrlObj.origin}).`,
      );
    }

    // Validate lastmod
    if (entry.lastmod !== undefined) {
      if (typeof entry.lastmod !== 'string' || Number.isNaN(Date.parse(entry.lastmod))) {
        throw new TypeError(
          `entry.lastmod "${entry.lastmod}" must be a valid ISO 8601 date string.`,
        );
      }
    }

    // Validate changefreq
    const validFreqs = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
    if (entry.changefreq !== undefined && !validFreqs.includes(entry.changefreq)) {
      throw new TypeError(`entry.changefreq must be one of: ${validFreqs.join(', ')}`);
    }

    // Validate priority
    if (entry.priority !== undefined) {
      if (typeof entry.priority !== 'number' || Number.isNaN(entry.priority)) {
        throw new TypeError('entry.priority must be a number.');
      }
      if (entry.priority < 0 || entry.priority > 1) {
        throw new RangeError('entry.priority must be between 0.0 and 1.0.');
      }
    }
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  /**
   * Generates the sitemap as a valid XML string with sanitized content.
   * @returns {string} The secure XML content.
   */
  generateXml() {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const entry of this.#entries) {
      xml += `  <url>\n`;
      // All dynamic content is passed through #escapeXml to prevent XML Injection
      xml += `    <loc>${this.#escapeXml(entry.loc)}</loc>\n`;

      if (entry.lastmod) {
        xml += `    <lastmod>${new Date(entry.lastmod).toISOString()}</lastmod>\n`;
      }

      if (entry.changefreq) {
        xml += `    <changefreq>${this.#escapeXml(entry.changefreq)}</changefreq>\n`;
      }

      if (entry.priority !== undefined) {
        xml += `    <priority>${entry.priority.toFixed(1)}</priority>\n`;
      }

      xml += `  </url>\n`;
    }

    xml += `</urlset>`;
    return xml;
  }
}

export default TinySitemapGenerator;
