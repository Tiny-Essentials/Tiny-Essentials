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
    if (typeof value !== 'boolean') throw new TypeError('freeMode must be a boolean.');
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
      // Captura todos os atributos (e os espaços entre eles) em um único grupo de captura.
      regexString += `([^>]*)`;
    } else {
      // Usa os lookaheads para capturar atributos específicos isoladamente.
      for (const attr of this.#attributes) {
        // This pattern handles:
        // 1. quoted: attr="value" or attr='value'
        // 2. unquoted: attr=value
        // 3. solitary: attr
        regexString += `(?=[^>]*?\\s+${attr}(?:=(?:["']([^"']*)["']|([^"'>\\s]+)))?(?=\\s|>|\\/))`;
      }
      // Consome o resto da tag de abertura sem criar um novo grupo de captura
      regexString += `[^>]*`;
    }

    // Fecha a tag de abertura (o > final), adiciona o grupo de conteúdo e a tag de fechamento
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
    // Forçamos a flag 'g' para garantir que possamos iterar sobre todas as ocorrências.
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

        // Quebra a string bruta em pares de chave e valor
        const attrRegex = /([^\s=]+)(?:\s*=\s*(?:(?:"([^"]*)")|(?:'([^']*)')|([^\s"'>]+)))?/g;
        let attrMatch;

        while ((attrMatch = attrRegex.exec(attrString)) !== null) {
          const attrName = attrMatch[1];
          // Se o valor existir em algum dos grupos, pegamos. Se não, é um atributo solitário (ex: disabled = true).
          const attrValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? true;
          attributesObj[attrName] = attrValue;
        }
      } else {
        // Modo com atributos específicos baseados no array de config
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
