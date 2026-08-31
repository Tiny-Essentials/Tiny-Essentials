/**
 * @typedef {Object} SitemapNamespace
 * @property {string} [prefix] - The namespace prefix (e.g., 'example').
 * @property {string} uri - The namespace URI (e.g., 'http://www.example.com/schemas/example_schema').
 */

/**
 * @typedef {(instance: TinySiteMap) => SitemapNamespace[]} NamespaceStrategy
 * A function that receives the TinySiteMap instance and returns an array of namespaces.
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
 * @property {SitemapNamespace[]} [namespaces] - Initial manual namespaces.
 * @property {NamespaceStrategy} [namespaceStrategy] - Dynamic logic to provide namespaces.
 * @property {SitemapEntry[] | SitemapIndexEntry[]} entries - Array of entries.
 */

/**
 * A service to manage and generate secure XML sitemaps or sitemap indexes.
 * This class handles URL resolution, namespace management, and XML escaping to prevent injection.
 */
class TinySiteMap {
  /** @type {URL} The base URL used for resolving relative paths. */
  #baseUrl;
  /** @type {(SitemapEntry|SitemapIndexEntry)[]} The internal list of validated entries. */
  #entries = [];
  /** @type {SitemapNamespace[]} The list of manually added namespaces. */
  #namespaces = [];
  /** @type {NamespaceStrategy | null} The dynamic strategy for generating namespaces. */
  #namespaceStrategy = null;
  /** @type {'normal'|'index'} The mode of the generator. */
  #type;
  /** @type {number} The maximum allowed length for a resolved URL. */
  #maxResolvedUrlSize = 2048;

  /**
   * Official limit established by sitemaps.org
   * @type {number}
   */
  static #MAX_URLS = 50000;

  static get maxUrls() {
    return TinySiteMap.#MAX_URLS;
  }

  static set maxUrls(value) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new TypeError('entry.priority must be a number.');
    }
    TinySiteMap.#MAX_URLS = value;
  }

  /**
   * @type {RegExp} Regex to validate XML Names/Prefixes.
   * From package "sitemap.js" by Eugene Kalinin.
   * @reference https://github.com/ekalinin/sitemap.js/blob/1a782cf41e0d391299029c9e00c8bfa8cdaad212/lib/sitemap-xml.ts
   */
  static #xmlNameRegex = /^[a-zA-Z_:][\w:.-]*$/;

  /**
   * @type {RegExp} Regex to validate XML Names/Prefixes.
   *
   * From package "sitemap.js" by Eugene Kalinin.
   * @reference https://github.com/ekalinin/sitemap.js/blob/1a782cf41e0d391299029c9e00c8bfa8cdaad212/lib/sitemap-xml.ts
   *
   */
  static get xmlNameRegex() {
    return new RegExp(TinySiteMap.#xmlNameRegex.source, TinySiteMap.#xmlNameRegex.flags);
  }

  /**
   * A static map storing predefined XML namespace identifiers and their corresponding URIs.
   * @type {Map<string, string>}
   */
  static #xmlns = new Map([
    ['ROOT', 'http://www.sitemaps.org/schemas/sitemap/0.9'],
    ['exampleSchema', 'http://www.example.com/schemas/example_schema'],
    ['news', 'http://www.google.com/schemas/sitemap-news/0.9'],
    ['xhtml', 'http://www.google.com/schemas/sitemap-news/0.9'],
    ['image', 'http://www.google.com/schemas/sitemap-news/0.9'],
    ['video', 'http://www.google.com/schemas/sitemap-news/0.9'],
    ['xsi', 'http://www.w3.org/2001/XMLSchema-instance'],
    [
      'schemaLocation:normal',
      'http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd',
    ],
    [
      'schemaLocation:index',
      'http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/siteindex.xsd',
    ],
  ]);

  /**
   * Retrieves the URI for a specific namespace ID.
   * @param {string} id - The namespace identifier.
   * @returns {string|undefined} The namespace URI or undefined if not found.
   */
  static getXmlns(id) {
    return TinySiteMap.#xmlns.get(id);
  }

  /**
   * Sets or updates a namespace URI for a specific ID.
   * @param {string} id - The namespace identifier.
   * @param {string} value - The namespace URI.
   * @throws {TypeError} If the ID or value are not strings.
   */
  static setXmlns(id, value) {
    if (typeof id !== 'string') throw new TypeError('Namespace ID must be a string.');
    if (typeof value !== 'string') throw new TypeError('Namespace URI must be a string.');
    TinySiteMap.#xmlns.set(id, value);
  }

  /**
   * Checks if a namespace ID exists.
   * @param {string} id - The namespace identifier.
   * @returns {boolean} True if it exists, false otherwise.
   */
  static hasXmlns(id) {
    return TinySiteMap.#xmlns.has(id);
  }

  /**
   * Gets all namespaces as a plain object.
   * @returns {Record<string, string>} A map of IDs to URIs.
   */
  static get xmlns() {
    return Object.fromEntries(TinySiteMap.#xmlns);
  }

  /**
   * Replaces all current namespaces with a new set.
   * @param {Record<string, string>} obj - The new namespace mapping.
   * @throws {TypeError} If the input is not a valid object or contains non-string values.
   */
  static set xmlns(obj) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      throw new TypeError('xmlns must be a non-null object.');
    }

    const xmlns = TinySiteMap.#xmlns;
    try {
      // Validate all values are strings before applying to ensure atomicity
      TinySiteMap.#xmlns = new Map();
      for (const [key, value] of Object.entries(obj)) {
        TinySiteMap.setXmlns(key, value);
      }
    } catch (err) {
      TinySiteMap.#xmlns = xmlns;
      throw err;
    }
  }

  /**
   * Gets the total number of registered namespaces.
   * @returns {number} The count of namespaces.
   */
  static get xmlnsSize() {
    return TinySiteMap.#xmlns.size;
  }

  /**
   * Initializes a new instance of the TinySiteMap class with the provided configuration.
   * @param {SitemapConfig} config - The configuration object.
   * @throws {TypeError} If the configuration is invalid.
   */
  constructor(config) {
    this.#validateConfig(config);
    this.#type = config.type ?? 'normal';
    this.#baseUrl = new URL(config.baseUrl);
    this.namespaces = config.namespaces ?? [];
    this.namespaceStrategy = config.namespaceStrategy ?? TinySiteMap.simpleStrategy;

    if (config.entries && config.entries.length > 0) {
      for (const entry of config.entries) {
        this.addEntry(entry);
      }
    }
  }

  /**
   * Validates a single namespace object.
   * @param {SitemapNamespace} ns
   * @param {RegExp} regex
   * @throws {TypeError}
   */
  #validateNamespace(ns, regex = TinySiteMap.#xmlNameRegex) {
    if (typeof ns !== 'object' || ns === null)
      throw new TypeError('Namespace must be a non-null object.');
    if (typeof ns.uri !== 'string') throw new TypeError('Namespace URI must be a string.');
    if (ns.prefix !== undefined && typeof ns.prefix !== 'string')
      throw new TypeError('Namespace prefix must be a string.');
    if (ns.prefix && !regex.test(ns.prefix))
      throw new TypeError(`Invalid namespace prefix: "${ns.prefix}".`);
  }

  /**
   * Validates a collection of namespaces.
   * @param {SitemapNamespace[]} namespaces
   * @throws {TypeError}
   */
  #validateNamespaceSet(namespaces) {
    if (!Array.isArray(namespaces)) throw new TypeError('namespaces must be an array.');
    for (const ns of namespaces) this.#validateNamespace(ns);
  }

  /**
   * Escapes special XML characters to prevent XML injection.
   * @param {string} str - The raw string to be escaped.
   * @reference https://github.com/ekalinin/sitemap.js/blob/1a782cf41e0d391299029c9e00c8bfa8cdaad212/lib/sitemap-xml.ts
   * @returns {string} The escaped string with characters like <, >, &, ", and ' replaced by entities.
   */
  static #escapeXml(str) {
    return str
      .replace(/[<>&"']/g, (char) => {
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
      })
      .replace(
        /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u0084\u0086-\u009F\uD800-\uDFFF\p{NChar}]/gu,
        '',
      );
  }

  /**
   * Escapes special XML characters to prevent XML injection.
   * @param {string} str - The raw string to be escaped.
   * @reference https://github.com/ekalinin/sitemap.js/blob/1a782cf41e0d391299029c9e00c8bfa8cdaad212/lib/sitemap-xml.ts
   * @returns {string} The escaped string with characters like <, >, &, ", and ' replaced by entities.
   */
  static escapeXml(str) {
    return this.#escapeXml(str);
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
  }

  /**
   * Resolves relative URLs, validates all fields, and returns a new normalized object.
   * @param {SitemapEntry | SitemapIndexEntry} entry - The entry object to process.
   * @param {URL} baseUrl
   * @param {'normal'|'index'} type
   * @param {number} maxUrlSize
   * @param {RegExp} regex
   * @returns {SitemapEntry | SitemapIndexEntry} A new, normalized, and validated entry object.
   * @throws {TypeError} If the entry is invalid, if loc is not a string, if origin doesn't match, or if field values are invalid.
   * @throws {RangeError} If the resolved URL exceeds maxResolvedUrlSize or if priority is outside [0.0, 1.0].
   */
  static #resolveAndValidate(entry, baseUrl, type, maxUrlSize, regex) {
    if (typeof entry !== 'object' || entry === null)
      throw new TypeError('Entry must be a non-null object.');

    // Validate loc: Must be string, must be valid URL, must match base origin
    if (typeof entry.loc !== 'string') throw new TypeError('entry.loc must be a string.');

    // Automatically handle relative paths using the baseUrl
    const resolvedUrl = new URL(entry.loc, baseUrl);

    // Security: Ensure the resolved URL belongs to the same origin
    if (resolvedUrl.origin !== baseUrl.origin) {
      throw new TypeError(
        `entry.loc "${entry.loc}" must belong to the same origin as ${baseUrl.origin}`,
      );
    }

    if (resolvedUrl.href.length >= maxUrlSize) {
      throw new RangeError(`entry.loc must be less than ${maxUrlSize} characters.`);
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
    if (type === 'normal') {
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
        if (normalizedEntry.priority < 0) {
          throw new RangeError('entry.priority must be greater than -1.');
        }
      }

      // Validate customTags
      if (normalizedEntry.customTags) {
        // Validation for customTags
        if (typeof normalizedEntry.customTags !== 'object' || normalizedEntry.customTags === null) {
          throw new TypeError('entry.customTags must be an object.');
        }
        for (const [tag, value] of Object.entries(normalizedEntry.customTags)) {
          // SECURITY: Validate that the tag name is a valid XML QName to prevent injection
          if (!regex.test(tag)) throw new TypeError(`Invalid custom tag name: "${tag}".`);
          // Validate content
          if (typeof value !== 'string')
            throw new TypeError(`The content for custom tag "${tag}" must be a string.`);
        }
      }
    } else if (type === 'index') {
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
   * Resolves relative URLs, validates all fields, and returns a new normalized object.
   * @param {SitemapEntry | SitemapIndexEntry} entry - The entry object to process.
   * @param {URL} baseUrl
   * @param {'normal'|'index'} type
   * @param {number} maxUrlSize
   * @param {RegExp} regex
   * @returns {SitemapEntry | SitemapIndexEntry} A new, normalized, and validated entry object.
   * @throws {TypeError} If the entry is invalid, if loc is not a string, if origin doesn't match, or if field values are invalid.
   * @throws {RangeError} If the resolved URL exceeds maxResolvedUrlSize or if priority is outside [0.0, 1.0].
   */
  static resolveAndValidate(entry, baseUrl, type, maxUrlSize, regex) {
    return TinySiteMap.#resolveAndValidate(entry, baseUrl, type, maxUrlSize, regex);
  }

  /**
   * Resolves relative URLs, validates all fields, and returns a new normalized object.
   * @param {SitemapEntry | SitemapIndexEntry} entry - The entry object to process.
   * @returns {SitemapEntry | SitemapIndexEntry} A new, normalized, and validated entry object.
   * @throws {TypeError} If the entry is invalid, if loc is not a string, if origin doesn't match, or if field values are invalid.
   * @throws {RangeError} If the resolved URL exceeds maxResolvedUrlSize or if priority is outside [0.0, 1.0].
   */
  #rav(entry) {
    return TinySiteMap.#resolveAndValidate(
      entry,
      this.#baseUrl,
      this.#type,
      this.#maxResolvedUrlSize,
      TinySiteMap.#xmlNameRegex,
    );
  }

  /**
   * @param {SitemapNamespace} ns - The namespace to add.
   * @throws {TypeError} If the namespace format is invalid.
   */
  addNamespace(ns) {
    this.#validateNamespace(ns);
    // Prevent duplicates by prefix/uri combination
    const exists = this.#namespaces.some(
      (existing) => existing.uri === ns.uri && existing.prefix === ns.prefix,
    );
    if (exists) {
      throw new Error(
        `Namespace with prefix "${ns.prefix || 'ROOT'}" and URI "${ns.uri}" already exists.`,
      );
    }
    this.#namespaces.push(ns);
  }

  /**
   * @param {string} prefix - The prefix to remove.
   */
  removeNamespace(prefix) {
    this.#namespaces = this.#namespaces.filter((ns) => ns.prefix !== prefix);
  }

  /**
   * Clears all manually added namespaces.
   */
  clearNamespaces() {
    this.#namespaces = [];
  }

  /**
   * Adds a new entry to the sitemap.
   * @param {SitemapEntry | SitemapIndexEntry} entry - The entry to add.
   * @param {number} [index] - The optional index at which to insert the entry.
   * @returns {number} The new length of the entries array.
   */
  addEntry(entry, index) {
    if (this.#entries.length >= TinySiteMap.#MAX_URLS) {
      throw new RangeError(`Sitemaps cannot exceed ${TinySiteMap.#MAX_URLS} entries.`);
    }
    const validated = this.#rav(entry);
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
    this.#entries[index] = this.#rav(updatedData);
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
   * Clears all manually added entries.
   */
  clearEntries() {
    this.#entries = [];
  }

  /**
   * Sets a dynamic strategy to provide namespaces based on the instance state.
   * @param {NamespaceStrategy} strategy - The strategy function.
   * @throws {TypeError} If the strategy is not a function.
   */
  set namespaceStrategy(strategy) {
    if (typeof strategy !== 'function') {
      throw new TypeError('namespaceStrategy must be a function.');
    }
    this.#namespaceStrategy = strategy;
  }

  /**
   * Returns a copy of the manually added namespaces.
   * @returns {SitemapNamespace[]}
   */
  get namespaces() {
    return this.#namespaces.map((i) => ({ ...i }));
  }

  set namespaces(nss) {
    if (!Array.isArray(nss)) throw new TypeError('namespaces must be an array.');
    const oldNamespaces = this.#namespaces;
    try {
      this.#namespaces = [];
      for (const ns of nss) this.addNamespace(ns);
    } catch (err) {
      this.#namespaces = oldNamespaces;
      throw err;
    }
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
    return this.#entries.map((/** @type {SitemapEntry} */ e) => ({
      ...e,
      ...(e.customTags ? { customTags: { ...e.customTags } } : {}),
    }));
  }

  set entries(entries) {
    if (!Array.isArray(entries)) throw new TypeError('entries must be an array.');
    const oldEntries = this.#entries;
    try {
      this.#entries = [];
      for (const entry of entries) this.addEntry(entry);
    } catch (err) {
      this.#entries = oldEntries;
      throw err;
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
      throw new TypeError('maxResolvedUrlSize must be a non-negative number.');
    }
    this.#maxResolvedUrlSize = value;
  }

  /**
   * Generates the sitemap or sitemap index as a valid XML string.
   * @returns {string} The generated XML content.
   */
  generateXml() {
    // 1. Collect all namespaces (Manual + Dynamic Strategy)
    const dynamicNamespaces = this.#namespaceStrategy ? this.#namespaceStrategy(this) : [];

    // 2. SECURITY: Validate all collected namespaces before rendering
    this.#validateNamespaceSet(dynamicNamespaces);
    const allNamespaces = [...dynamicNamespaces, ...this.#namespaces];

    const xmlChunks = [`<?xml version="1.0" encoding="UTF-8"?>\n`];
    let rootAttributes = '';

    for (const ns of allNamespaces) {
      // Handles the schemaLocation properly as an attribute, not an xmlns prefix
      if (ns.prefix === 'schemaLocation') {
        rootAttributes += ` xsi:schemaLocation="${TinySiteMap.#escapeXml(ns.uri)}"`;
      } else {
        const prefixPart = ns.prefix ? `:${ns.prefix}` : '';
        rootAttributes += ` xmlns${prefixPart}="${TinySiteMap.#escapeXml(ns.uri)}"`;
      }
    }

    if (this.#type === 'index') {
      xmlChunks.push(`<sitemapindex${rootAttributes}>\n`);
      for (const index in this.#entries) {
        /** @type {SitemapIndexEntry} */
        const entry = this.#entries[index];
        xmlChunks.push(`  <sitemap>\n`);
        xmlChunks.push(`    <loc>${TinySiteMap.#escapeXml(entry.loc)}</loc>\n`);
        if (entry.lastmod) {
          xmlChunks.push(`    <lastmod>${new Date(entry.lastmod).toISOString()}</lastmod>\n`);
        }
        xmlChunks.push(`  </sitemap>\n`);
      }
      xmlChunks.push(`</sitemapindex>`);
    } else {
      xmlChunks.push(`<urlset${rootAttributes}>\n`);
      for (const index in this.#entries) {
        /** @type {SitemapEntry} */
        const entry = this.#entries[index];
        xmlChunks.push(`  <url>\n`);
        // All dynamic content is passed through #escapeXml to prevent XML Injection
        xmlChunks.push(`    <loc>${TinySiteMap.#escapeXml(entry.loc)}</loc>\n`);
        if (entry.lastmod) {
          xmlChunks.push(`    <lastmod>${new Date(entry.lastmod).toISOString()}</lastmod>\n`);
        }
        if (entry.changefreq) {
          xmlChunks.push(
            `    <changefreq>${TinySiteMap.#escapeXml(entry.changefreq)}</changefreq>\n`,
          );
        }
        if (entry.priority !== undefined) {
          xmlChunks.push(`    <priority>${entry.priority.toFixed(1)}</priority>\n`);
        }

        // Render custom tags
        if (entry.customTags) {
          for (const [tag, value] of Object.entries(entry.customTags)) {
            xmlChunks.push(`    <${tag}>${TinySiteMap.#escapeXml(value)}</${tag}>\n`);
          }
        }
        xmlChunks.push(`  </url>\n`);
      }
      xmlChunks.push(`</urlset>`);
    }

    return xmlChunks.join('');
  }

  /**
   * Returns a namespace strategy that includes standard Google sitemaps namespaces (news, xhtml, image, and video).
   *
   * The function name is a fun reference to name of Eugene Kalinin. This strategy is inspired in the original "sitemap.js" package.
   * @reference https://github.com/ekalinin/sitemap.js/blob/1a782cf41e0d391299029c9e00c8bfa8cdaad212/lib/sitemap-stream.ts
   * @type {NamespaceStrategy}
   */
  static kaliStrategy() {
    const namespaces = [];
    namespaces.push({ uri: TinySiteMap.#xmlns.get('ROOT') ?? '' });
    namespaces.push({ uri: TinySiteMap.#xmlns.get('news') ?? '', prefix: 'news' });
    namespaces.push({ uri: TinySiteMap.#xmlns.get('xhtml') ?? '', prefix: 'xhtml' });
    namespaces.push({ uri: TinySiteMap.#xmlns.get('image') ?? '', prefix: 'image' });
    namespaces.push({ uri: TinySiteMap.#xmlns.get('video') ?? '', prefix: 'video' });
    return namespaces;
  }

  /**
   * Returns a basic namespace strategy that only includes the default XML sitemap ROOT namespace.
   * @type {NamespaceStrategy}
   */
  static simpleStrategy() {
    return [{ uri: TinySiteMap.#xmlns.get('ROOT') ?? '' }];
  }

  /**
   * Returns a comprehensive namespace strategy that includes the ROOT, XSI, and schemaLocation namespaces,
   * and conditionally includes custom namespaces based on the sitemap instance state.
   * @reference https://www.sitemaps.org/protocol.html
   * @type {NamespaceStrategy}
   */
  static protocolStrategy(instance) {
    const namespaces = [];

    // Base Namespace
    namespaces.push({ uri: TinySiteMap.#xmlns.get('ROOT') ?? '' });

    // XSI
    namespaces.push({ prefix: 'xsi', uri: TinySiteMap.#xmlns.get('xsi') ?? '' });

    // Schema Location
    const schemaUri =
      instance.type === 'normal'
        ? (TinySiteMap.#xmlns.get('schemaLocation:normal') ?? '')
        : (TinySiteMap.#xmlns.get('schemaLocation:index') ?? '');

    namespaces.push({ prefix: 'schemaLocation', uri: schemaUri });

    // Custom Tags logic (original insertNamespaces behavior)
    if (instance.type === 'normal') {
      const hasCustomTags = instance.entries.some(
        (/** @type {SitemapEntry} */ e) => e.customTags && Object.keys(e.customTags).length > 0,
      );
      if (hasCustomTags) {
        namespaces.push({ prefix: 'example', uri: TinySiteMap.#xmlns.get('exampleSchema') ?? '' });
      }
    }

    return namespaces;
  }
}

export default TinySiteMap;
