/**
 * @typedef {Object} SitemapNamespace
 * @property {string} [prefix] - The namespace prefix (e.g., 'example').
 * @property {string} uri - The namespace URI (e.g., 'http://www.example.com/schemas/example_schema').
 */

/**
 * @typedef {Object} CustomTagMap
 * @property {string} [tag] - The tag name (key in the object, e.g., 'example:tag').
 * @property {string} [value] - The content of the tag (value in the object).
 * @description A map where keys are the XML tag names and values are the tag contents.
 */

/**
 * @typedef {Object} SitemapEntry
 * @property {string} loc - The absolute URL of the page (or relative path).
 * @property {string} [lastmod] - The last modified date in ISO 8601 format (e.g., '2023-10-27T10:00:00Z').
 * @property {'always'|'hourly'|'daily'|'weekly'|'monthly'|'yearly'|'never'} [changefreq] - Frequency of change.
 * @property {number} [priority] - Importance of the URL (0.0 to 1.0).
 * @property {CustomTagMap} [customTags] - Custom XML tags to include in this entry.
 */

/**
 * @typedef {Object} SitemapConfig
 * @property {string} baseUrl - The base URL of the website.
 * @property {SitemapNamespace[]} [namespaces] - Custom namespaces to declare in the urlset.
 * @property {SitemapEntry[]} entries - An array of page entries.
 */

/**
 * A service to manage and generate secure XML sitemaps.
 */
class TinySitemapGenerator {
  /** @type {URL} */
  #baseUrl;
  /** @type {SitemapEntry[]} */
  #entries;
  /** @type {SitemapNamespace[]} */
  #namespaces; // New private field to store namespaces
  /** @type {string} */
  #type = 'normal';

  /**
   * @param {SitemapConfig} config
   * @throws {TypeError} If the configuration is invalid.
   */
  constructor(config) {
    this.#validateConfig(config);
    this.#baseUrl = new URL(config.baseUrl);
    this.#entries = [];
    this.#namespaces = config.namespaces ?? []; // Initialize namespaces

    this.#namespaces.push({ uri: 'http://www.sitemaps.org/schemas/sitemap/0.9' });
    this.#namespaces.push({ prefix: 'xsi', uri: 'http://www.w3.org/2001/XMLSchema-instance' });

    if (this.#type === 'normal') {
      this.#namespaces.push({
        prefix: 'schemaLocation',
        uri: '"http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd',
      });
    }

    // If initial entries are provided, add them through the secure method
    if (config.entries && config.entries.length > 0) {
      for (const entry of config.entries) {
        this.addEntry(entry);
      }
    }
  }

  /**
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
   */
  #validateConfig(config) {
    if (typeof config !== 'object' || config === null) {
      throw new TypeError('Configuration must be a non-null object.');
    }
    if (typeof config.baseUrl !== 'string') {
      throw new TypeError('config.baseUrl must be a string.');
    }
    try {
      new URL(config.baseUrl);
    } catch {
      throw new TypeError('config.baseUrl must be a valid absolute URL.');
    }

    // Regex to validate XML Name
    const xmlNameRegex = /^[a-zA-Z_][\w.-]*$/;

    if (config.namespaces) {
      if (!Array.isArray(config.namespaces)) {
        throw new TypeError('config.namespaces must be an array.');
      }
      for (const ns of config.namespaces) {
        if (
          (typeof ns.prefix !== 'undefined' && typeof ns.prefix !== 'string') ||
          typeof ns.uri !== 'string'
        ) {
          throw new TypeError(
            'Each namespace must have a optional string "prefix" and a valid string "uri".',
          );
        }
        // SECURITY: Validating prefix to prevent XML Injection in attribute names
        if (typeof ns.prefix !== 'undefined' && !xmlNameRegex.test(ns.prefix)) {
          throw new TypeError(
            `Invalid namespace prefix: "${ns.prefix}". Prefixes must follow XML Name rules.`,
          );
        }
      }
    }
  }

  /**
   * URL must be less than 2,048 characters.
   * @type {number}
   */
  #maxResolvedUrlSize = 2048;

  /**
   * Resolves relative URLs, validates all fields, and returns a new normalized object.
   * @param {SitemapEntry} entry - The entry to process.
   * @returns {SitemapEntry} The normalized and validated entry.
   * @throws {TypeError} If validation fails.
   * @throws {RangeError} If priority is invalid or URL is too long.
   */
  #resolveAndValidate(entry) {
    if (typeof entry !== 'object' || entry === null) {
      throw new TypeError('Entry must be a non-null object.');
    }

    // Validate loc: Must be string, must be valid URL, must match base origin
    if (typeof entry.loc !== 'string') {
      throw new TypeError('entry.loc must be a string.');
    }

    // Automatically handle relative paths using the baseUrl
    const resolvedUrl = new URL(entry.loc, this.#baseUrl);

    // Security: Ensure the resolved URL belongs to the same origin
    if (resolvedUrl.origin !== this.#baseUrl.origin) {
      throw new TypeError(
        `entry.loc "${entry.loc}" must belong to the same origin as ${this.#baseUrl.origin}`,
      );
    }

    if (resolvedUrl.href.length >= this.#maxResolvedUrlSize) {
      throw new RangeError(`entry.loc must be less than ${this.#maxResolvedUrlSize} characters.`);
    }

    const normalizedEntry = { ...entry, loc: resolvedUrl.href };

    // Validate lastmod
    if (normalizedEntry.lastmod && typeof normalizedEntry.lastmod === 'string') {
      if (Number.isNaN(Date.parse(normalizedEntry.lastmod))) {
        throw new TypeError(`entry.lastmod "${normalizedEntry.lastmod}" is an invalid date.`);
      }
    }

    // Validate changefreq
    const validFreqs = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
    if (normalizedEntry.changefreq && !validFreqs.includes(normalizedEntry.changefreq)) {
      throw new TypeError(`entry.changefreq must be one of: ${validFreqs.join(', ')}`);
    }

    // Validate priority
    if (normalizedEntry.priority !== undefined) {
      if (typeof normalizedEntry.priority !== 'number' || Number.isNaN(normalizedEntry.priority)) {
        throw new TypeError('entry.priority must be a number.');
      }
      if (normalizedEntry.priority < 0 || normalizedEntry.priority > 1) {
        throw new RangeError('entry.priority must be between 0.0 and 1.0.');
      }
    }

    // Validation for customTags
    if (entry.customTags) {
      if (typeof entry.customTags !== 'object' || entry.customTags === null) {
        throw new TypeError('entry.customTags must be an object.');
      }
      for (const [tag, value] of Object.entries(entry.customTags)) {
        if (typeof value !== 'string') {
          throw new TypeError(`The content for custom tag "${tag}" must be a string.`);
        }
      }
    }

    // Regex to validate an XML QName (prefix:localName)
    const xmlNameRegex = /^[a-zA-Z_][\w.-]*$/;
    const qNameRegex = new RegExp(`^${xmlNameRegex.source}(:${xmlNameRegex.source})?$`);

    // Validation for customTags
    if (entry.customTags) {
      if (typeof entry.customTags !== 'object' || entry.customTags === null) {
        throw new TypeError('entry.customTags must be an object.');
      }
      for (const [tag, value] of Object.entries(entry.customTags)) {
        // SECURITY: Validate that the tag name is a valid XML QName to prevent injection
        if (!qNameRegex.test(tag)) {
          throw new TypeError(`Invalid custom tag name: "${tag}". Tag must be a valid XML QName.`);
        }
        // Validate content
        if (typeof value !== 'string') {
          throw new TypeError(`The content for custom tag "${tag}" must be a string.`);
        }
      }
    }

    return normalizedEntry;
  }

  /**
   * Adds a new entry to the sitemap.
   * @param {SitemapEntry} entry
   * @param {number} [index]
   * @returns {number}
   */
  addEntry(entry, index) {
    const validated = this.#resolveAndValidate(entry);
    const newSize = this.#entries.push(validated);
    if (typeof index !== 'undefined') this.moveEntry(newSize - 1, index);
    return newSize;
  }

  /**
   * Removes an entry by its index.
   * @param {number} index
   * @returns {boolean}
   */
  removeEntry(index) {
    if (index < 0 || index >= this.#entries.length) {
      throw new RangeError('Index out of bounds.');
    }
    const oldSize = this.#entries.length;
    this.#entries.splice(index, 1);
    const newSize = this.#entries.length;
    return oldSize !== newSize;
  }

  /**
   * Updates an existing entry.
   * @param {number} index - The index of the entry to update.
   * @param {Partial<SitemapEntry>} entryData - The new data to merge.
   */
  updateEntry(index, entryData) {
    if (index < 0 || index >= this.#entries.length) {
      throw new RangeError('Index out of bounds.');
    }
    // Merge current data with new data to allow partial updates
    const updatedData = { ...this.#entries[index], ...entryData };
    // Re-validate the entire merged object
    this.#entries[index] = this.#resolveAndValidate(updatedData);
  }

  /**
   * Changes the position of an entry in the list.
   * @param {number} fromIndex - Current position.
   * @param {number} toIndex - New position.
   */
  moveEntry(fromIndex, toIndex) {
    if (
      fromIndex < 0 ||
      fromIndex >= this.#entries.length ||
      toIndex < 0 ||
      toIndex >= this.#entries.length
    ) {
      throw new RangeError('Index out of bounds.');
    }
    const [movedItem] = this.#entries.splice(fromIndex, 1);
    this.#entries.splice(toIndex, 0, movedItem);
  }

  /**
   * @returns {string} The base URL string.
   */
  get baseUrl() {
    return this.#baseUrl.href;
  }

  /**
   * @returns {SitemapEntry[]} A copy of the current entries.
   */
  get entries() {
    // Return a shallow copy to prevent external mutation of the array
    return this.#entries.map((e) => ({ ...e }));
  }

  /**
   * Generates the sitemap as a valid XML string with sanitized content.
   * @returns {string} The secure XML content.
   */
  generateXml() {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;

    const namespaces = [...this.#namespaces];

    if (this.#type === 'normal') {
      const existsCustomTags =
        this.#entries.findIndex(
          (entry) =>
            entry.customTags &&
            (typeof entry.customTags.tag === 'string' ||
              typeof entry.customTags.value === 'string'),
        ) > -1;

      if (existsCustomTags) {
        /** @type {SitemapNamespace} */
        const customTagNs = {
          uri: 'http://www.example.com/schemas/example_schema',
          prefix: 'example',
        };
        if (
          namespaces.findIndex(
            (ns) => ns.prefix === customTagNs.prefix && ns.uri === customTagNs.uri,
          ) < 0
        )
          namespaces.push(customTagNs);
      }
    }

    // Build the xmlns attributes string
    let namespaceAttributes = '';
    for (const ns of namespaces) {
      namespaceAttributes += ` xmlns${typeof ns.prefix !== 'undefined' ? `:${ns.prefix}` : ''}="${this.#escapeXml(ns.uri)}"`;
    }

    xml += `<urlset${namespaceAttributes}>\n`;

    for (const entry of this.#entries) {
      xml += `  <url>\n`;
      // All dynamic content is passed through #escapeXml to prevent XML Injection
      xml += `    <loc>${this.#escapeXml(entry.loc)}</loc>\n`;
      if (entry.lastmod) xml += `    <lastmod>${new Date(entry.lastmod).toISOString()}</lastmod>\n`;
      if (entry.changefreq)
        xml += `    <changefreq>${this.#escapeXml(entry.changefreq)}</changefreq>\n`;
      if (entry.priority !== undefined)
        xml += `    <priority>${entry.priority.toFixed(1)}</priority>\n`;

      // Render custom tags
      if (entry.customTags) {
        for (const [tag, value] of Object.entries(entry.customTags)) {
          xml += `    <${tag}>${this.#escapeXml(value)}</${tag}>\n`;
        }
      }

      xml += `  </url>\n`;
    }
    xml += `</urlset>`;
    return xml;
  }
}

export default TinySitemapGenerator;
