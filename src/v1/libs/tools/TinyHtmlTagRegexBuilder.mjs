/**
 * const genHtmlRegexString = (freeMode = false) =>
 * freeMode
 *   ? [`<a\\s+[^>]*?href=["\\']`, `["\\'][^>]*>[\\s\\S]*?</a\\s*>`]
 *   : [`<a\\s+(?:[^>]*?\\s+)?href=["\\']`, `["\\'][^>]*>.*?</a>`];
 */

/**
 * @template {string} TagName
 * @typedef {Object} HtmlRegexConfig
 * @property {TagName} tagName - O nome da tag HTML (ex: 'a', 'div').
 * @property {boolean} [freeMode=false] - Se verdadeiro, permite que o conteúdo interno contenha quebras de linha.
 * @property {boolean} [captureAllAttributes=false] - Se verdadeiro, ignora atributos específicos e foca na tag.
 * @property {string} [targetAttribute='href'] - O atributo específico para buscar (ex: 'href', 'src').
 * @property {string} [contentPattern='[\s\S]*?'] - O padrão de regex para o conteúdo interno da tag.
 */

/**
 * Classe responsável por construir expressões regulares para captura de tags HTML
 * de forma altamente configurável.
 * @template {string} TagName
 */
class TinyHtmlTagRegexBuilder {
  #tagName;
  #freeMode = false;
  #captureAllAttributes = false;
  #targetAttribute = '';
  #contentPattern = '';

  /**
   * @param {HtmlRegexConfig<TagName>} config - Objeto de configuração inicial.
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
    this.freeMode = config.freeMode ?? false;
    this.captureAllAttributes = config.captureAllAttributes ?? false;
    this.targetAttribute = config.targetAttribute || 'href';
    this.contentPattern = config.contentPattern || (this.#freeMode ? '[\\s\\S]*?' : '.*?');
  }

  // --- Getters e Setters com Validação ---

  /** @returns {TagName} */
  get tagName() {
    return this.#tagName;
  }

  get freeMode() {
    return this.#freeMode;
  }

  set freeMode(value) {
    if (typeof value !== 'boolean') {
      throw new TypeError('freeMode must be a boolean.');
    }
    this.#freeMode = value;
  }

  get captureAllAttributes() {
    return this.#captureAllAttributes;
  }

  set captureAllAttributes(value) {
    if (typeof value !== 'boolean') {
      throw new TypeError('captureAllAttributes must be a boolean.');
    }
    this.#captureAllAttributes = value;
  }

  get targetAttribute() {
    return this.#targetAttribute;
  }

  set targetAttribute(value) {
    if (typeof value !== 'string' || value.includes(' ')) {
      throw new TypeError('targetAttribute must be a single word string.');
    }
    this.#targetAttribute = value;
  }

  get contentPattern() {
    return this.#contentPattern;
  }

  set contentPattern(value) {
    if (typeof value !== 'string') {
      throw new TypeError('contentPattern must be a string.');
    }
    this.#contentPattern = value;
  }

  /**
   * Constrói o string do RegExp.
   * @returns {string} A string da expressão regular configurada.
   */
  toString() {
    // 1. Construção da parte de abertura da tag
    // Se captureAllAttributes for true, aceita qualquer atributo.
    // Se false, busca especificamente pelo targetAttribute.
    const openingTagPattern = this.#captureAllAttributes
      ? `<${this.#tagName}\\s+[^>]*?>`
      : `<${this.#tagName}\\s+[^>]*?\\s+${this.#targetAttribute}=["'][^"']*["'][^>]*?>`;

    // 2. Construção da parte de fechamento da tag
    const closingTagPattern = `</${this.#tagName}>`;

    // 3. Combinação final: <tag> (conteúdo) </tag>
    // Usamos parênteses ao redor do contentPattern para criar um grupo de captura (Group 1)
    const fullRegexString = `${openingTagPattern}>(${this.#contentPattern})${closingTagPattern}`;

    return fullRegexString;
  }

  /**
   * Constrói e retorna o objeto RegExp final.
   * @param {string} [flag='g']
   * @returns {RegExp} A expressão regular configurada.
   */
  toRegExp(flag) {
    return new RegExp(this.toString(), flag);
  }
}

export default TinyHtmlTagRegexBuilder;
