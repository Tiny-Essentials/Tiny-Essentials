/**
 * @typedef {Object} SitemapNamespace
 * @property {string} [prefix] - The namespace prefix (e.g., 'example').
 * @property {string} uri - The namespace URI (e.g., 'http://www.example.com/schemas/example_schema').
 */

/**
 * A map where keys are the XML tag names and values are the tag contents.
 * @typedef {Object} CustomTagMap
 * @property {string} [tag] - The tag name (key in the object, e.g., 'example:tag').
 * @property {string} [value] - The content of the tag (value in the object).
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
 * @typedef {Object} SitemapIndexEntry
 * @property {string} loc - The absolute URL of the sitemap file.
 * @property {string} [lastmod] - The last modified date in ISO 8601 format.
 */

/**
 * @typedef {Object} SitemapConfig
 * @property {'normal'|'index'} [type] - The type of sitemap to generate. Defaults to 'normal'.
 * @property {string} baseUrl - The base URL of the website.
 * @property {SitemapNamespace[]} [namespaces] - Custom namespaces to declare.
 * @property {SitemapEntry[] | SitemapIndexEntry[]} entries - Array of entries.
 */

/**
 * A service to manage and generate secure XML sitemaps or sitemap indexes.
 * This class handles URL resolution, namespace management, and XML escaping to prevent injection.
 */
class TinySitemapGenerator {
  /** @type {URL} The base URL used for resolving relative paths. */
  #baseUrl;
  /** @type {(SitemapEntry|SitemapIndexEntry)[]} The internal list of validated entries. */
  #entries;
  /** @type {SitemapNamespace[]} The list of XML namespaces to be declared in the root element. */
  #namespaces;
  /** @type {'normal'|'index'} The mode of the generator (normal sitemap or index). */
  #type;
  /** @type {number} The maximum allowed length for a resolved URL. */
  #maxResolvedUrlSize = 2048;

  /**
   * Creates an instance of TinySitemapGenerator.
   * @param {SitemapConfig} config - The configuration object.
   * @throws {TypeError} If the configuration is invalid or the baseUrl is not a valid absolute URL.
   */
  constructor(config) {
    this.#validateConfig(config);
    this.#type = config.type ?? 'normal';
    this.#baseUrl = new URL(config.baseUrl);
    this.#entries = [];
    this.#namespaces = [...(config.namespaces ?? [])];

    // Default Namespaces
    this.#namespaces.push({ uri: 'http://www.sitemaps.org/schemas/sitemap/0.9' });
    this.#namespaces.push({ prefix: 'xsi', uri: 'http://www.w3.org/2001/XMLSchema-instance' });

    if (this.#type === 'normal') {
      this.#namespaces.push({
        prefix: 'schemaLocation',
        uri: 'http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd',
      });
    } else {
      this.#namespaces.push({
        prefix: 'schemaLocation',
        uri: 'http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/siteindex.xsd',
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
   * Escapes special XML characters to prevent XML injection.
   * @param {string} str - The raw string to be escaped.
   * @returns {string} The escaped string with characters like <, >, &, ", and ' replaced by entities.
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
   * Validates the initial configuration object.
   * @param {SitemapConfig} config - The configuration to validate.
   * @throws {TypeError} If config is not an object, baseUrl is invalid, type is unsupported, or namespaces are malformed.
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
    if (config.type && !['normal', 'index'].includes(config.type)) {
      throw new TypeError('config.type must be either "normal" or "index".');
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
            'Each namespace must have an optional string "prefix" and a valid string "uri".',
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
   * Gets the maximum allowed URL size.
   * @returns {number} The current maximum size.
   */
  get maxResolvedUrlSize() {
    return this.#maxResolvedUrlSize;
  }

  /**
   * Sets the maximum allowed URL size.
   * @param {number} value - The new maximum size.
   * @throws {TypeError} If the value is not a non-negative finite number.
   */
  set maxResolvedUrlSize(value) {
    if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value) || value < 0) {
      throw new TypeError('maxResolvedUrlSize must be a non negative number.');
    }
    this.#maxResolvedUrlSize = value;
  }

  /**
   * Resolves relative URLs, validates all fields, and returns a new normalized object.
   * @param {SitemapEntry | SitemapIndexEntry} entry - The entry object to process.
   * @returns {SitemapEntry | SitemapIndexEntry} A new, normalized, and validated entry object.
   * @throws {TypeError} If the entry is invalid, if loc is not a string, if origin doesn't match, or if field values are invalid.
   * @throws {RangeError} If the resolved URL exceeds maxResolvedUrlSize or if priority is outside [0.0, 1.0].
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

    /** @type {SitemapEntry} */
    const normalizedEntry = { ...entry, loc: resolvedUrl.href };

    // Validate lastmod (Shared by both types)
    if (normalizedEntry.lastmod && typeof normalizedEntry.lastmod === 'string') {
      if (Number.isNaN(Date.parse(normalizedEntry.lastmod))) {
        throw new TypeError(`entry.lastmod "${normalizedEntry.lastmod}" is an invalid date.`);
      }
    }

    // Type-specific validation
    if (this.#type === 'normal') {
      // Validate changefreq
      const validFreqs = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
      if (normalizedEntry.changefreq && !validFreqs.includes(normalizedEntry.changefreq)) {
        throw new TypeError(`entry.changefreq must be one of: ${validFreqs.join(', ')}`);
      }

      // Validate priority
      if (normalizedEntry.priority !== undefined) {
        if (
          typeof normalizedEntry.priority !== 'number' ||
          Number.isNaN(normalizedEntry.priority)
        ) {
          throw new TypeError('entry.priority must be a number.');
        }
        if (normalizedEntry.priority < 0 || normalizedEntry.priority > 1) {
          throw new RangeError('entry.priority must be between 0.0 and 1.0.');
        }
      }

      // Validate customTags
      if (normalizedEntry.customTags) {
        // Regex to validate an XML QName (prefix:localName)
        const xmlNameRegex = /^[a-zA-Z_][\w.-]*$/;
        const qNameRegex = new RegExp(`^${xmlNameRegex.source}(:${xmlNameRegex.source})?$`);

        // Validation for customTags
        if (typeof normalizedEntry.customTags !== 'object' || normalizedEntry.customTags === null) {
          throw new TypeError('entry.customTags must be an object.');
        }
        for (const [tag, value] of Object.entries(normalizedEntry.customTags)) {
          // SECURITY: Validate that the tag name is a valid XML QName to prevent injection
          if (!qNameRegex.test(tag)) throw new TypeError(`Invalid custom tag name: "${tag}".`);
          // Validate content
          if (typeof value !== 'string')
            throw new TypeError(`The content for custom tag "${tag}" must be a string.`);
        }
      }
    } else {
      // Strict mode for 'index': forbid properties that don't belong to <sitemap>
      if (normalizedEntry.changefreq || normalizedEntry.priority || normalizedEntry.customTags) {
        throw new TypeError(
          'Sitemap Index entries cannot contain changefreq, priority, or customTags.',
        );
      }
    }

    return normalizedEntry;
  }

  /**
   * Adds a new entry to the sitemap.
   * @param {SitemapEntry | SitemapIndexEntry} entry - The entry to add.
   * @param {number} [index] - The optional index at which to insert the entry.
   * @returns {number} The new length of the entries array.
   */
  addEntry(entry, index) {
    const validated = this.#resolveAndValidate(entry);
    const newSize = this.#entries.push(validated);
    if (typeof index !== 'undefined') this.moveEntry(newSize - 1, index);
    return newSize;
  }

  /**
   * Removes an entry from the sitemap by its index.
   * @param {number} index - The index of the entry to remove.
   * @returns {boolean} True if an element was removed, false otherwise.
   * @throws {RangeError} If the index is out of bounds.
   */
  removeEntry(index) {
    if (index < 0 || index >= this.#entries.length) {
      throw new RangeError('Index out of bounds.');
    }
    const oldSize = this.#entries.length;
    this.#entries.splice(index, 1);
    return oldSize !== this.#entries.length;
  }

  /**
   * Updates an existing entry with new data.
   * @param {number} index - The index of the entry to update.
   * @param {Partial<SitemapEntry | SitemapIndexEntry>} entryData - The partial data to merge into the existing entry.
   * @throws {RangeError} If the index is out of bounds.
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
   * Changes the position of an entry within the list.
   * @param {number} fromIndex - The current index of the entry.
   * @param {number} toIndex - The new index for the entry.
   * @throws {RangeError} If either index is out of bounds.
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
   * Gets the sitemap type.
   * @returns {'normal'|'index'} The type of sitemap.
   */
  get type() {
    return this.#type;
  }

  /**
   * Gets the base URL string.
   * @returns {string} The href of the base URL.
   */
  get baseUrl() {
    return this.#baseUrl.href;
  }

  /**
   * Gets a shallow copy of the current entries.
   * @returns {SitemapEntry[] | SitemapIndexEntry[]} A copy of the entries array.
   */
  get entries() {
    return this.#entries.map((e) => ({ ...e }));
  }

  /**
   * Generates the sitemap or sitemap index as a valid XML string.
   * @returns {string} The generated XML content.
   */
  generateXml() {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;

    const namespaces = [...this.#namespaces];

    if (this.#type === 'normal') {
      const existsCustomTags =
        this.#entries.findIndex(
          (/** @type {SitemapEntry} */ entry) =>
            entry.customTags && Object.keys(entry.customTags).length > 0,
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

    if (this.#type === 'index') {
      xml += `<sitemapindex${namespaceAttributes}>\n`;
      for (const index in this.#entries) {
        /** @type {SitemapIndexEntry} */
        const entry = this.#entries[index];
        xml += `  <sitemap>\n`;
        xml += `    <loc>${this.#escapeXml(entry.loc)}</loc>\n`;
        if (entry.lastmod)
          xml += `    <lastmod>${new Date(entry.lastmod).toISOString()}</lastmod>\n`;
        xml += `  </sitemap>\n`;
      }
    } else {
      xml += `<urlset${namespaceAttributes}>\n`;

      for (const index in this.#entries) {
        /** @type {SitemapEntry} */
        const entry = this.#entries[index];
        xml += `  <url>\n`;
        // All dynamic content is passed through #escapeXml to prevent XML Injection
        xml += `    <loc>${this.#escapeXml(entry.loc)}</loc>\n`;
        if (entry.lastmod)
          xml += `    <lastmod>${new Date(entry.lastmod).toISOString()}</lastmod>\n`;
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
    }

    xml += `</${this.#type === 'index' ? 'sitemapindex' : 'urlset'}>`;
    return xml;
  }
}

export default TinySitemapGenerator;
