import TinyURLSecurityVerifier from './TinyURLSecurityVerifier.mjs';

/**
 * @typedef {Object} SitemapNamespace
 * @property {'xmlns'|'attribute'} [type] - Defines if it's a namespace declaration or a raw root attribute. Defaults to 'xmlns'.
 * @property {string} [prefix] - The namespace prefix (e.g., 'example'). Used only if type is 'xmlns'.
 * @property {string} [name] - The exact attribute name (e.g., 'xsi:schemaLocation'). Required if type is 'attribute'.
 * @property {string} [uri] - The namespace URI. Used if type is 'xmlns'.
 * @property {string} [value] - The attribute value. Used if type is 'attribute' (acts as an alias to 'uri' for flexibility).
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
 * @property {string} [xslUrl] - URL to XSL stylesheet.
 * @property {boolean} [xslUrlPathnameOnly=true]
 * @property {boolean} [lastmodDateOnly] - Format lastmod as date only (YYYY-MM-DD).
 * @property {'normal'|'index'} [type] - The type of sitemap to generate. Defaults to 'normal'.
 * @property {string} baseUrl - The base URL of the website.
 * @property {SitemapNamespace[]} [namespaces] - Initial manual namespaces or root attributes.
 * @property {NamespaceStrategy} [namespaceStrategy] - Dynamic logic to provide namespaces.
 * @property {SitemapEntry[] | SitemapIndexEntry[]} entries - Array of entries.
 */

/**
 * A service to manage and generate secure XML sitemaps or sitemap indexes.
 * This class handles URL resolution, root attributes management, and XML escaping to prevent injection.
 */
class TinySiteMap {
  /** @type {TinyURLSecurityVerifier} */
  #urlVerifier = new TinyURLSecurityVerifier();
  /** @type {URL} The base URL used for resolving relative paths. */
  #baseUrl;
  /** @type {(SitemapEntry|SitemapIndexEntry)[]} The internal list of validated entries. */
  #entries = [];
  /** @type {SitemapNamespace[]} The list of manually added namespaces/attributes. */
  #namespaces = [];
  /** @type {NamespaceStrategy | null} The dynamic strategy for generating namespaces. */
  #namespaceStrategy = null;
  /** @type {'normal'|'index'} The mode of the generator. */
  #type;
  /** @type {number} The maximum allowed length for a resolved URL. */
  #maxResolvedUrlSize = 2048;
  /** @type {boolean} Determines if the 'lastmod' field is formatted as a simple date (YYYY-MM-DD) instead of full ISO 8601. */
  #lastmodDateOnly = false;
  /** @type {URL|null} The URL of the XSL stylesheet used to style the XML output in web browsers. */
  #xslUrl = null;
  /** @type {boolean} */
  #xslUrlPathnameOnly = true;

  /**
   * Official limit established by sitemaps.org
   * @type {number}
   */
  static #MAX_URLS = 50000;

  /**
   * Gets the maximum number of URLs allowed in a single sitemap.
   * @returns {number}
   */
  static get maxUrls() {
    return TinySiteMap.#MAX_URLS;
  }

  /**
   * Sets the maximum number of URLs allowed in a single sitemap.
   * @param {number} value
   * @throws {TypeError} If the value is not a number.
   */
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
  static #attrValues = new Map([
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
  static getAttrVal(id) {
    return TinySiteMap.#attrValues.get(id);
  }

  /**
   * Sets or updates a namespace URI for a specific ID.
   * @param {string} id - The namespace identifier.
   * @param {string} value - The namespace URI.
   * @throws {TypeError} If the ID or value are not strings.
   */
  static setAttrVal(id, value) {
    if (typeof id !== 'string') throw new TypeError('Namespace ID must be a string.');
    if (typeof value !== 'string') throw new TypeError('Namespace URI must be a string.');
    TinySiteMap.#attrValues.set(id, value);
  }

  /**
   * Checks if a namespace ID exists.
   * @param {string} id - The namespace identifier.
   * @returns {boolean} True if it exists, false otherwise.
   */
  static hasAttrVal(id) {
    return TinySiteMap.#attrValues.has(id);
  }

  /**
   * Gets all namespaces as a plain object.
   * @returns {Record<string, string>} A map of IDs to URIs.
   */
  static get attrValues() {
    return Object.fromEntries(TinySiteMap.#attrValues);
  }

  /**
   * Replaces all current namespaces with a new set.
   * @param {Record<string, string>} obj - The new namespace mapping.
   * @throws {TypeError} If the input is not a valid object or contains non-string values.
   */
  static set attrValues(obj) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      throw new TypeError('attrValues must be a non-null object.');
    }

    const attrValues = TinySiteMap.#attrValues;
    try {
      // Validate all values are strings before applying to ensure atomicity
      TinySiteMap.#attrValues = new Map();
      for (const [key, value] of Object.entries(obj)) {
        TinySiteMap.setAttrVal(key, value);
      }
    } catch (err) {
      TinySiteMap.#attrValues = attrValues;
      throw err;
    }
  }

  /**
   * Gets the total number of registered namespaces.
   * @returns {number} The count of namespaces.
   */
  static get attrValuesSize() {
    return TinySiteMap.#attrValues.size;
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
    this.xslUrlPathnameOnly = config.xslUrlPathnameOnly ?? true;
    this.#xslUrl = config.xslUrl
      ? this.#xslUrlPathnameOnly
        ? new URL(config.xslUrl, this.#baseUrl.origin)
        : new URL(config.xslUrl)
      : null;
    this.lastmodDateOnly = config.lastmodDateOnly ?? false;
    this.namespaces = config.namespaces ?? [];
    this.namespaceStrategy = config.namespaceStrategy ?? TinySiteMap.simpleStrategy;

    if (config.entries && config.entries.length > 0) {
      for (const entry of config.entries) {
        this.addEntry(entry);
      }
    }
  }

  /**
   * Validates a single namespace object for correct structure and XML naming compliance.
   * @param {SitemapNamespace} ns
   * @param {RegExp} regex
   * @throws {TypeError}
   */
  #validateNamespace(ns, regex = TinySiteMap.#xmlNameRegex) {
    if (typeof ns !== 'object' || ns === null)
      throw new TypeError('Namespace or Attribute must be a non-null object.');

    const type = ns.type ?? 'xmlns';
    if (!['xmlns', 'attribute'].includes(type))
      throw new TypeError('Type must be either "xmlns" or "attribute".');

    const val = ns.value ?? ns.uri;
    if (typeof val !== 'string')
      throw new TypeError('Namespace URI or Attribute value must be a string.');

    if (type === 'xmlns') {
      if (ns.prefix !== undefined && typeof ns.prefix !== 'string')
        throw new TypeError('Namespace prefix must be a string.');

      if (ns.prefix && !regex.test(ns.prefix))
        throw new TypeError(`Invalid namespace prefix: "${ns.prefix}".`);
    } else if (type === 'attribute') {
      if (typeof ns.name !== 'string')
        throw new TypeError('Attribute name must be a string when type is "attribute".');

      if (!regex.test(ns.name)) throw new TypeError(`Invalid attribute name: "${ns.name}".`);
    }
  }

  /**
   * Validates a collection of namespace objects.
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
   * @param {boolean} isOtag
   * @reference https://github.com/ekalinin/sitemap.js/blob/1a782cf41e0d391299029c9e00c8bfa8cdaad212/lib/sitemap-xml.ts
   * @returns {string} The escaped string with characters like <, >, &, ", and ' replaced by entities.
   */
  static #escapeXml(str, isOtag) {
    const amp = /&/g;
    const lt = /</g;
    const gt = />/g;
    const apos = /'/g;
    const quot = /"/g;
    let result = str;
    result = result.replace(amp, '&amp;').replace(lt, '&lt;').replace(gt, '&gt;');
    if (isOtag) {
      result = result.replace(apos, '&apos;').replace(quot, '&quot;');
    }
    return result.replace(
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u0084\u0086-\u009F\uD800-\uDFFF\p{NChar}]/gu,
      '',
    );
  }

  /**
   * Escapes special XML characters to prevent XML injection.
   * @param {string} str - The raw string to be escaped.
   * @param {boolean} isOtag
   * @reference https://github.com/ekalinin/sitemap.js/blob/1a782cf41e0d391299029c9e00c8bfa8cdaad212/lib/sitemap-xml.ts
   * @returns {string} The escaped string with characters like <, >, &, ", and ' replaced by entities.
   */
  static escapeXml(str, isOtag) {
    return this.#escapeXml(str, isOtag);
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
   * @param {TinyURLSecurityVerifier} urlVerifier
   * @returns {SitemapEntry | SitemapIndexEntry} A new, normalized, and validated entry object.
   * @throws {TypeError} If the entry is invalid, if loc is not a string, if origin doesn't match, or if field values are invalid.
   * @throws {RangeError} If the resolved URL exceeds maxResolvedUrlSize or if priority is outside [0.0, 1.0].
   */
  static #resolveAndValidate(entry, baseUrl, type, maxUrlSize, regex, urlVerifier) {
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

    if (urlVerifier.isDangerous(resolvedUrl)) {
      throw new Error('');
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
        if (normalizedEntry.priority < 0 || normalizedEntry.priority > 1) {
          throw new RangeError('entry.priority must be between 0.0 and 1.0.');
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
   * @param {TinyURLSecurityVerifier} urlVerifier
   * @returns {SitemapEntry | SitemapIndexEntry} A new, normalized, and validated entry object.
   * @throws {TypeError} If the entry is invalid, if loc is not a string, if origin doesn't match, or if field values are invalid.
   * @throws {RangeError} If the resolved URL exceeds maxResolvedUrlSize or if priority is outside [0.0, 1.0].
   */
  static resolveAndValidate(entry, baseUrl, type, maxUrlSize, regex, urlVerifier) {
    return TinySiteMap.#resolveAndValidate(entry, baseUrl, type, maxUrlSize, regex, urlVerifier);
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
      this.#urlVerifier,
    );
  }

  /**
   * Adds a namespace to the sitemap, preventing duplicate prefixes or attribute names.
   * @param {SitemapNamespace} ns - The namespace to add.
   * @throws {TypeError} If the namespace format is invalid.
   */
  addNamespace(ns) {
    this.#validateNamespace(ns);
    const newType = ns.type ?? 'xmlns';

    // Prevent duplicate attributes or prefixes
    const exists = this.#namespaces.some((existing) => {
      const existingType = existing.type ?? 'xmlns';
      if (existingType !== newType) return false;

      if (newType === 'attribute') {
        return existing.name === ns.name;
      }
      return existing.prefix === ns.prefix;
    });

    if (exists) {
      const identifier = newType === 'attribute' ? ns.name : ns.prefix || 'ROOT';
      throw new Error(`Root declaration with identifier "${identifier}" already exists.`);
    }

    this.#namespaces.push(ns);
  }

  /**
   * Removes a namespace from the sitemap list by its identifier (prefix or name).
   * @param {string} identifier - The identifier to remove.
   */
  removeNamespace(identifier) {
    this.#namespaces = this.#namespaces.filter((ns) => {
      const type = ns.type ?? 'xmlns';
      if (type === 'attribute') return ns.name !== identifier;
      return ns.prefix !== identifier;
    });
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

  get urlVerifier() {
    return this.#urlVerifier;
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

  /**
   * Sets the manual namespaces for the sitemap.
   * @param {SitemapNamespace[]} nss - The array of namespaces to set.
   */
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
   * Gets the base URL.
   * @returns {URL} The copy of the base URL instance.
   */
  get baseUrl() {
    return new URL(this.#baseUrl.href);
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

  /**
   * Sets the sitemap entries, validating each one via the addEntry method.
   * @param {SitemapEntry[] | SitemapIndexEntry[]} entries - The entries to set.
   */
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
   * Gets the current configuration state for 'lastmod' date formatting.
   * @returns {boolean} True if date-only formatting is enabled, false otherwise.
   */
  get lastmodDateOnly() {
    return this.#lastmodDateOnly;
  }

  /**
   * Sets whether the 'lastmod' field should be formatted as a simple date (YYYY-MM-DD).
   * @param {boolean} value - True to use YYYY-MM-DD format, false to use full ISO 8601.
   * @throws {TypeError} If the provided value is not a boolean.
   */
  set lastmodDateOnly(value) {
    if (typeof value !== 'boolean') {
      throw new TypeError('lastmodDateOnly must be a boolean.');
    }
    this.#lastmodDateOnly = value;
  }

  /**
   * Gets the URL of the XSL stylesheet used to style the XML output.
   * @returns {string|null} The XSL stylesheet URL or null.
   */
  get xslUrl() {
    return this.#xslUrlPathnameOnly
      ? (this.#xslUrl?.pathname ?? null)
      : (this.#xslUrl?.href ?? null);
  }

  /**
   * Sets the URL of the XSL stylesheet used to style the XML output.
   * @param {string|null} value - The XSL stylesheet URL or null.
   * @throws {TypeError} If the value is provided but is not a string.
   */
  set xslUrl(value) {
    if (value !== null && typeof value !== 'string') {
      throw new TypeError('xslUrl must be a string or null.');
    }
    this.#xslUrl = value
      ? this.#xslUrlPathnameOnly
        ? new URL(value, this.#baseUrl.origin)
        : new URL(value)
      : null;
  }

  get xslUrlPathnameOnly() {
    return this.#xslUrlPathnameOnly;
  }

  set xslUrlPathnameOnly(value) {
    if (value !== null && typeof value !== 'boolean') {
      throw new TypeError('xslUrlPathnameOnly must be a boolean or null.');
    }
    this.#xslUrlPathnameOnly = value;
  }

  get entriesSize() {
    return this.#entries.length;
  }

  get namespacesSize() {
    return this.#namespaces.length;
  }

  /**
   * Generates the XML header.
   * @param {SitemapNamespace[]} namespaces
   * @param {string} [xslUrl]
   * @param {'normal'|'index'} [type]
   * @returns {string}
   */
  static #generateHeader(namespaces, xslUrl, type) {
    let header = '';
    if (xslUrl) {
      header += `<?xml-stylesheet type="text/xsl" href="${TinySiteMap.#escapeXml(xslUrl, true)}"?>\n`;
    }

    let rootAttributes = '';
    for (const ns of namespaces) {
      const nsType = ns.type ?? 'xmlns';
      const val = ns.value ?? ns.uri ?? '';

      // Handles the schemaLocation properly as an attribute, not an xmlns prefix
      if (nsType === 'attribute') {
        rootAttributes += ` ${ns.name}="${TinySiteMap.#escapeXml(val, true)}"`;
      } else {
        const prefixPart = ns.prefix ? `:${ns.prefix}` : '';
        rootAttributes += ` xmlns${prefixPart}="${TinySiteMap.#escapeXml(val, true)}"`;
      }
    }

    header +=
      type === 'index' ? `<sitemapindex${rootAttributes}>\n` : `<urlset${rootAttributes}>\n`;
    return header;
  }

  /**
   * Generates the XML fragment for a single entry.
   * @param {SitemapEntry} entry
   * @param {'normal'|'index'} type
   * @param {boolean} [lastmodDateOnly=false]
   * @returns {string}
   */
  static #generateEntry(entry, type, lastmodDateOnly = false) {
    let lastmodStr = '';
    if (entry.lastmod) {
      const dateObj = new Date(entry.lastmod);
      lastmodStr = TinySiteMap.#escapeXml(
        lastmodDateOnly ? dateObj.toISOString().split('T')[0] : dateObj.toISOString(),
        false,
      );
    }

    // All dynamic content is passed through #escapeXml to prevent XML Injection
    if (type === 'index') {
      return `  <sitemap>\n    <loc>${TinySiteMap.#escapeXml(entry.loc, false)}</loc>\n${
        lastmodStr ? `    <lastmod>${lastmodStr}</lastmod>\n` : ''
      }  </sitemap>\n`;
    }

    let xml = `  <url>\n    <loc>${TinySiteMap.#escapeXml(entry.loc, false)}</loc>\n`;
    if (lastmodStr) xml += `    <lastmod>${lastmodStr}</lastmod>\n`;
    if (entry.changefreq)
      xml += `    <changefreq>${TinySiteMap.#escapeXml(entry.changefreq, false)}</changefreq>\n`;
    if (entry.priority !== undefined)
      xml += `    <priority>${entry.priority.toFixed(1)}</priority>\n`;

    // Render custom tags
    if (entry.customTags) {
      for (const [tag, value] of Object.entries(entry.customTags)) {
        xml += `    <${TinySiteMap.#escapeXml(tag, true)}>${TinySiteMap.#escapeXml(value, false)}</${tag}>\n`;
      }
    }
    xml += `  </url>\n`;
    return xml;
  }

  /**
   * Generates the XML footer.
   * @param {'normal'|'index'} type
   * @returns {string}
   */
  static #generateFooter(type) {
    return type === 'index' ? '</sitemapindex>' : '</urlset>';
  }

  /**
   * Generates the XML header.
   * @param {SitemapNamespace[]} namespaces
   * @param {string} [xslUrl]
   * @param {'normal'|'index'} [type]
   * @returns {string}
   */
  static _generateHeader(namespaces, xslUrl, type) {
    return TinySiteMap.#generateHeader(namespaces, xslUrl, type);
  }

  /**
   * Generates the XML fragment for a single entry.
   * @param {SitemapEntry} entry
   * @param {'normal'|'index'} type
   * @param {boolean} [lastmodDateOnly=false]
   * @returns {string}
   */
  static _generateEntry(entry, type, lastmodDateOnly = false) {
    return TinySiteMap.#generateEntry(entry, type, lastmodDateOnly);
  }

  /**
   * Generates the XML footer.
   * @param {'normal'|'index'} type
   * @returns {string}
   */
  static _generateFooter(type) {
    return TinySiteMap.#generateFooter(type);
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

    // 3. Add header (Stylesheet + Root Tag)
    xmlChunks.push(
      TinySiteMap.#generateHeader(
        allNamespaces,
        this.#xslUrl ? this.#xslUrl.href : undefined,
        this.#type,
      ),
    );

    // 4. Add entries
    for (const entry of this.#entries) {
      xmlChunks.push(TinySiteMap.#generateEntry(entry, this.#type, this.#lastmodDateOnly));
    }

    // 5. Add o footer
    xmlChunks.push(TinySiteMap.#generateFooter(this.#type));

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
    /** @type {SitemapNamespace[]} */
    const namespaces = [];
    namespaces.push({ type: 'xmlns', uri: TinySiteMap.#attrValues.get('ROOT') ?? '' });
    namespaces.push({
      type: 'xmlns',
      uri: TinySiteMap.#attrValues.get('news') ?? '',
      prefix: 'news',
    });
    namespaces.push({
      type: 'xmlns',
      uri: TinySiteMap.#attrValues.get('xhtml') ?? '',
      prefix: 'xhtml',
    });
    namespaces.push({
      type: 'xmlns',
      uri: TinySiteMap.#attrValues.get('image') ?? '',
      prefix: 'image',
    });
    namespaces.push({
      type: 'xmlns',
      uri: TinySiteMap.#attrValues.get('video') ?? '',
      prefix: 'video',
    });
    return namespaces;
  }

  /**
   * Returns a basic namespace strategy that only includes the default XML sitemap ROOT namespace.
   * @type {NamespaceStrategy}
   */
  static simpleStrategy() {
    return [{ type: 'xmlns', uri: TinySiteMap.#attrValues.get('ROOT') ?? '' }];
  }

  /**
   * Returns a comprehensive namespace strategy that includes the ROOT, XSI, and schemaLocation namespaces,
   * and conditionally includes custom namespaces based on the sitemap instance state.
   * @reference https://www.sitemaps.org/protocol.html
   * @type {NamespaceStrategy}
   */
  static protocolStrategy(instance) {
    /** @type {SitemapNamespace[]} */
    const namespaces = [];

    // Default xmlns
    namespaces.push({ type: 'xmlns', uri: TinySiteMap.#attrValues.get('ROOT') ?? '' });

    // xmlns:xsi
    namespaces.push({
      type: 'xmlns',
      prefix: 'xsi',
      uri: TinySiteMap.#attrValues.get('xsi') ?? '',
    });

    // Schema Location
    const schemaUri =
      instance.type === 'normal'
        ? (TinySiteMap.#attrValues.get('schemaLocation:normal') ?? '')
        : (TinySiteMap.#attrValues.get('schemaLocation:index') ?? '');

    namespaces.push({ type: 'attribute', name: 'xsi:schemaLocation', value: schemaUri });

    // Custom Tags logic (original insertNamespaces behavior)
    if (instance.type === 'normal') {
      const hasCustomTags = instance.entries.some(
        (/** @type {SitemapEntry} */ e) => e.customTags && Object.keys(e.customTags).length > 0,
      );
      if (hasCustomTags) {
        namespaces.push({
          type: 'xmlns',
          prefix: 'example',
          uri: TinySiteMap.#attrValues.get('exampleSchema') ?? '',
        });
      }
    }

    return namespaces;
  }
}

export default TinySiteMap;
