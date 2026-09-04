/**
 * @typedef {never|string} Attribute
 */

/**
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
 * Class responsible for constructing highly configurable regular expressions
 * to capture HTML tags and their specific attributes.
 * @template {string} TagName
 * @template {boolean} CaptureAllAttributes
 * @template {Attribute} Attributes
 */
class TinyHtmlTagRegexBuilder {
  /** @type {TagName} */
  #tagName;
  /** @type {Attributes[]} */
  #attributes = [];
  /** @type {boolean} */
  #freeMode = false;
  /** @type {CaptureAllAttributes} */
  #captureAllAttributes;
  /** @type {string} */
  #contentPattern = '';

  /**
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

  /** @returns {TagName} */
  get tagName() {
    return this.#tagName;
  }

  /** @returns {Attributes[]} */
  get attributes() {
    return [...this.#attributes];
  }

  /** @returns {boolean} */
  get freeMode() {
    return this.#freeMode;
  }

  /** @param {boolean} value */
  set freeMode(value) {
    if (typeof value !== 'boolean') {
      throw new TypeError('freeMode must be a boolean.');
    }
    this.#freeMode = value;
  }

  /** @returns {CaptureAllAttributes} */
  get captureAllAttributes() {
    return this.#captureAllAttributes;
  }

  /** @returns {string} */
  get contentPattern() {
    return this.#contentPattern;
  }

  /** @param {string} value */
  set contentPattern(value) {
    if (typeof value !== 'string') {
      throw new TypeError('contentPattern must be a string.');
    }
    this.#contentPattern = value;
  }

  /**
   * Constructs the RegExp string.
   *
   * Note on Capture Groups:
   * - For every attribute in the 'attributes' array, two capture groups are added:
   *   - Group (2n - 1): The value if it is wrapped in quotes (e.g., attr="val").
   *   - Group (2n): The value if it is unquoted (e.g., attr=val).
   *   - If the attribute is solitary (e.g., 'disabled'), both groups will be undefined.
   * - The final capture group is the tag's inner content.
   *
   * @returns {string} The constructed regular expression string.
   */
  toString() {
    let regexString = `<${this.#tagName}`;

    // If we are not ignoring attributes, add lookaheads for each requested attribute.
    // Lookaheads allow attributes to appear in any order within the tag.
    if (!this.#captureAllAttributes) {
      for (const attr of this.#attributes) {
        // This pattern handles:
        // 1. quoted: attr="value" or attr='value'
        // 2. unquoted: attr=value
        // 3. solitary: attr
        regexString += `(?=[^>]*?\\s+${attr}(?:=(?:["']([^"']*)["']|([^"'>\\s]+)))?(?=\\s|>|\\/))`;
      }
    }

    // Close the opening tag by consuming the remaining attributes/spaces with [^>]*
    // and then add the content group and closing tag.
    regexString += `[^>]*>(${this.#contentPattern})</${this.#tagName}>`;

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
}

export default TinyHtmlTagRegexBuilder;
