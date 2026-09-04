/**
 * Defines the valid types for an HTML attribute name.
 * @typedef {never|string} Attribute
 */

/**
 * Configuration object used to define the parameters for the regex builder.
 * @template {string} TagName
 * @template {boolean} CaptureAllAttributes
 * @template {Attribute} Attributes
 * @typedef {Object} HtmlRegexConfig
 * @property {TagName} tagName - The HTML tag name (e.g., 'a', 'div').
 * @property {Attributes[]} [attributes=[]] - An array of attribute names to capture in individual groups.
 * @property {boolean} [freeMode=false] - If true, allows the inner content to contain newlines.
 * @property {CaptureAllAttributes} captureAllAttributes - If true, ignores specific attributes and focuses on the tag structure.
 * @property {string} [contentPattern='[\s\S]*?'] - The regex pattern for the tag's inner content.
 */

/**
 * Represents the structured result of a parsed HTML tag.
 * @typedef {Object} ParsedHtmlTag
 * @property {Record<string, string|boolean>} attributes - Object containing all parsed attributes.
 * @property {string} child - The inner content of the HTML tag.
 */

/**
 * Class responsible for constructing highly configurable regular expressions
 * to capture HTML tags and their specific attributes.
 * @template {string} TagName
 * @template {boolean} CaptureAllAttributes
 * @template {Attribute} Attributes
 */
class TinyHtmlTagRegexBuilder {
  /**
   * The name of the HTML tag to be matched.
   * @type {TagName}
   */
  #tagName;

  /**
   * The list of specific attribute names to be captured.
   * @type {Attributes[]}
   */
  #attributes = [];

  /**
   * Indicates if the content pattern should allow newlines.
   * @type {boolean}
   */
  #freeMode = false;

  /**
   * Indicates if all attributes should be captured in a single group.
   * @type {CaptureAllAttributes}
   */
  #captureAllAttributes;

  /**
   * The regex pattern used for the tag's inner content.
   * @type {string}
   */
  #contentPattern = '';

  /**
   * Initializes a new instance of the TinyHtmlTagRegexBuilder.
   * @param {HtmlRegexConfig<TagName, CaptureAllAttributes, Attributes>} config - Initial configuration object.
   */
  constructor(config) {
    const tagName = config.tagName;
    if (typeof tagName !== 'string') {
      throw new TypeError('The tagName must be a string.');
    }
    if (/[<>\s]/.test(tagName)) {
      throw new TypeError('The tagName must be a single word without spaces or < > characters.');
    }
    this.#tagName = tagName;

    // Attribute validation
    if (config.attributes) {
      if (!Array.isArray(config.attributes)) {
        throw new TypeError('The attributes property must be an array of strings.');
      }
      for (const attr of config.attributes) {
        if (typeof attr !== 'string' || /[<>\s]/.test(attr)) {
          throw new TypeError(
            'Each attribute name must be a single word string without spaces or < > characters.',
          );
        }
      }
      this.#attributes = config.attributes;
    }

    if (typeof config.captureAllAttributes !== 'boolean') {
      throw new TypeError('captureAllAttributes must be a boolean.');
    }
    this.#captureAllAttributes = config.captureAllAttributes;

    this.freeMode = config.freeMode ?? false;
    this.contentPattern = config.contentPattern || (this.#freeMode ? '[\\s\\S]*?' : '.*?');
  }

  // --- Getters and Setters with Validation ---

  /**
   * Gets the target HTML tag name.
   * @returns {TagName}
   */
  get tagName() {
    return this.#tagName;
  }

  /**
   * Gets a copy of the attributes to be captured.
   * @returns {Attributes[]}
   */
  get attributes() {
    return [...this.#attributes];
  }

  /**
   * Gets the current free mode status.
   * @returns {boolean}
   */
  get freeMode() {
    return this.#freeMode;
  }

  /**
   * Sets the free mode status.
   * @param {boolean} value
   */
  set freeMode(value) {
    if (typeof value !== 'boolean') throw new TypeError('freeMode must be a boolean.');
    this.#freeMode = value;
  }

  /**
   * Gets the attribute capture mode.
   * @returns {CaptureAllAttributes}
   */
  get captureAllAttributes() {
    return this.#captureAllAttributes;
  }

  /**
   * Gets the current regex pattern for the tag's content.
   * @returns {string}
   */
  get contentPattern() {
    return this.#contentPattern;
  }

  /**
   * Sets the regex pattern for the tag's content.
   * @param {string} value
   */
  set contentPattern(value) {
    if (typeof value !== 'string') throw new TypeError('contentPattern must be a string.');
    this.#contentPattern = value;
  }

  /**
   * Constructs the RegExp string.
   * @returns {string} The constructed regular expression string.
   */
  toString() {
    let regexString = `<${this.#tagName}`;

    if (this.#captureAllAttributes) {
      // Captures all attributes (and the spaces between them) in a single capture group.
      regexString += `([^>]*)`;
    } else {
      // Uses lookaheads to capture specific attributes individually.
      for (const attr of this.#attributes) {
        // This pattern handles:
        // 1. quoted: attr="value" or attr='value'
        // 2. unquoted: attr=value
        // 3. solitary: attr
        regexString += `(?=[^>]*?\\s+${attr}(?:=(?:["']([^"']*)["']|([^"'>\\s]+)))?(?=\\s|>|\\/))`;
      }
      // Consumes the rest of the opening tag without creating a new capture group
      regexString += `[^>]*`;
    }

    // Closes the opening tag (the final >), adds the content group, and the closing tag
    regexString += `>(${this.#contentPattern})</${this.#tagName}>`;

    return regexString;
  }

  /**
   * Constructs and returns the final RegExp object.
   * @param {string} [flag='g']
   * @returns {RegExp} The configured regular expression.
   */
  toRegExp(flag = 'g') {
    return new RegExp(this.toString(), flag);
  }

  /**
   * Executes the generated regex against an HTML string and organizes the results.
   *
   * @param {string} htmlString - The HTML text to be parsed.
   * @returns {ParsedHtmlTag[]} An array containing an object for each matched tag, with its attributes and child.
   */
  parse(htmlString) {
    // We force the 'g' flag to ensure we can iterate over all occurrences.
    const regex = this.toRegExp('g');
    /** @type {ParsedHtmlTag[]} */
    const results = [];
    let match;

    while ((match = regex.exec(htmlString)) !== null) {
      /** @type {Record<string, string|boolean>} */
      const attributesObj = {};
      let child = '';

      if (this.#captureAllAttributes) {
        const attrString = match[1] || '';
        child = match[2] || '';

        // Splits the raw string into key-value pairs
        const attrRegex = /([^\s=]+)(?:\s*=\s*(?:(?:"([^"]*)")|(?:'([^']*)')|([^\s"'>]+)))?/g;
        let attrMatch;

        while ((attrMatch = attrRegex.exec(attrString)) !== null) {
          const attrName = attrMatch[1];
          // If the value exists in any of the groups, we take it. Otherwise, it is a solitary attribute (e.g., disabled = true).
          const attrValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? true;
          attributesObj[attrName] = attrValue;
        }
      } else {
        // Mode with specific attributes based on the configuration array
        for (let i = 0; i < this.#attributes.length; i++) {
          const attrName = this.#attributes[i];
          const quotedValue = match[i * 2 + 1];
          const unquotedValue = match[i * 2 + 2];

          attributesObj[attrName] = quotedValue ?? unquotedValue ?? true;
        }
        child = match[this.#attributes.length * 2 + 1] || '';
      }

      results.push({
        attributes: attributesObj,
        child: child,
      });
    }

    return results;
  }
}

export default TinyHtmlTagRegexBuilder;
