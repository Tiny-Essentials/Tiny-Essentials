import TinyHtmlInput from '../../TinyHtmlInput.mjs';

/**
 * TinyHtmlTextInput is a helper class for managing `<input type="text">` elements.
 * It provides validated getters and setters for common text input attributes
 * such as minlength, maxlength, pattern, autocomplete, and more.
 *
 * @example
 * const input = new TinyHtmlTextInput({
 *   name: 'username',
 *   placeholder: 'Enter your username',
 *   minlength: 3,
 *   maxlength: 20,
 *   required: true,
 *   autocomplete: 'username'
 * });
 */
class TinyHtmlTextInput extends TinyHtmlInput {
  /**
   * Creates a new TinyHtmlTextInput instance.
   * @param {Object} config - Configuration object.
   * @param {string} [config.value=""] - Initial value.
   * @param {number} [config.minlength] - Minimum length in UTF-16 code units.
   * @param {number} [config.maxlength] - Maximum length in UTF-16 code units.
   * @param {string} [config.name] - The name of the control.
   * @param {string} [config.pattern] - Regex pattern.
   * @param {string} [config.autocomplete] - Autocomplete hint ("on", "off", or a token like "email").
   * @param {'none'|'sentences'|'words'|'characters'} [config.autocapitalize] - Auto-capitalization mode.
   * @param {string} [config.dirname] - Name for directionality field (text-based inputs).
   * @param {number} [config.size] - Size of text input.
   * @param {string} [config.list] - ID of a <datalist>.
   * @param {boolean} [config.readonly=false] - Whether the input is read-only.
   * @param {boolean} [config.required=false] - Whether the input is required.
   * @param {string} [config.placeholder] - Placeholder text.
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=''] - Main CSS class.
   * @throws {TypeError} If any attribute is of the wrong type.
   */
  constructor({
    value = '',
    list,
    autocapitalize,
    placeholder,
    minlength,
    maxlength,
    readonly = false,
    required = false,
    pattern,
    size,
    dirname,
    autocomplete,
    name,
    tags = [],
    mainClass = '',
  } = {}) {
    super({ name, placeholder, type: 'text', tags, mainClass, readonly, required });

    // value
    if (value !== undefined) this.value = value;
    // minlength
    if (minlength !== undefined) this.minlength = minlength;
    // maxlength
    if (maxlength !== undefined) this.maxlength = maxlength;
    // pattern
    if (pattern !== undefined) this.pattern = pattern;
    // list
    if (list !== undefined) this.list = list;
    // autocapitalize
    if (autocapitalize !== undefined) this.autocapitalize = autocapitalize;
    // autocomplete
    if (autocomplete !== undefined) this.autocomplete = autocomplete;
    // dirname
    if (dirname !== undefined) this.dirname = dirname;
    // size
    if (size !== undefined) this.sizeEl = size;
  }

  /** @param {string} value */
  set value(value) {
    if (typeof value !== 'string') throw new TypeError('"value" must be a string.');
    this.setVal(value);
  }

  /** @returns {string} */
  get value() {
    return this.valTxt();
  }

  /** @param {number} minlength */
  set minlength(minlength) {
    if (!Number.isInteger(minlength) || minlength < 0)
      throw new TypeError('"minlength" must be a non-negative integer.');
    this.setAttr('minlength', minlength);
  }

  /** @returns {number|null} */
  get minlength() {
    return this.attrNumber('minlength');
  }

  /** @param {number} maxlength */
  set maxlength(maxlength) {
    if (!Number.isInteger(maxlength) || maxlength < 1)
      throw new TypeError('"maxlength" must be a positive integer.');
    this.setAttr('maxlength', maxlength);
  }

  /** @returns {number|null} */
  get maxlength() {
    return this.attrNumber('maxlength');
  }

  /** @param {string} pattern */
  set pattern(pattern) {
    if (typeof pattern !== 'string') throw new TypeError('"pattern" must be a string.');
    this.setAttr('pattern', pattern);
  }

  /** @returns {string|null} */
  get pattern() {
    return this.attrString('pattern');
  }

  /** @param {string} list */
  set list(list) {
    if (typeof list !== 'string') throw new TypeError('"list" must be a string (datalist id).');
    this.setAttr('list', list);
  }

  /** @returns {string|null} */
  get list() {
    return this.attrString('list');
  }

  /** @param {'none'|'sentences'|'words'|'characters'} autocapitalize */
  set autocapitalize(autocapitalize) {
    const valid = ['none', 'sentences', 'words', 'characters'];
    if (!valid.includes(autocapitalize))
      throw new TypeError(`"autocapitalize" must be one of ${valid.join(', ')}.`);
    this.setAttr('autocapitalize', autocapitalize);
  }

  /** @returns {string|null} */
  get autocapitalize() {
    return this.attrString('autocapitalize');
  }

  /** @param {string} autocomplete */
  set autocomplete(autocomplete) {
    if (typeof autocomplete !== 'string') throw new TypeError('"autocomplete" must be a string.');
    this.setAttr('autocomplete', autocomplete);
  }

  /** @returns {string|null} */
  get autocomplete() {
    return this.attrString('autocomplete');
  }

  /** @param {string} dirname */
  set dirname(dirname) {
    if (typeof dirname !== 'string') throw new TypeError('"dirname" must be a string.');
    this.setAttr('dirname', dirname);
  }

  /** @returns {string|null} */
  get dirname() {
    return this.attrString('dirname');
  }
}

export default TinyHtmlTextInput;
