import TinyHtmlInput from '../../TinyHtmlInput.mjs';

/**
 * TinyHtmlSearchInput is a helper class for managing <input type="search"> elements.
 * It provides validation and convenient getters/setters for common attributes
 * such as minlength, maxlength, autocomplete, autocapitalize, pattern, and more.
 *
 * @example
 * const searchInput = new TinyHtmlSearchInput({
 *   name: 'search',
 *   placeholder: 'Search...',
 *   minlength: 3,
 *   maxlength: 100,
 *   required: true,
 *   autocomplete: 'on'
 * });
 *
 * @extends TinyHtmlInput
 */
class TinyHtmlSearchInput extends TinyHtmlInput {
  /**
   * Creates a new TinyHtmlSearchInput instance.
   * @param {Object} config - Configuration object.
   * @param {string} [config.value] - Initial input value.
   * @param {number} [config.minlength] - Minimum number of characters allowed.
   * @param {number} [config.maxlength] - Maximum number of characters allowed.
   * @param {string} [config.name] - The name of the control.
   * @param {string} [config.pattern] - Regex pattern for validation.
   * @param {string} [config.autocomplete] - Autocomplete behavior.
   * @param {'none'|'sentences'|'words'|'characters'} [config.autocapitalize] - Auto-capitalization rule.
   * @param {string} [config.dirname] - Name for directionality field (text-based inputs).
   * @param {number} [config.size] - Width of the input in characters.
   * @param {string} [config.list] - ID of a <datalist> element.
   * @param {boolean} [config.readonly=false] - Whether the input is read-only.
   * @param {boolean} [config.required=false] - Whether the input is required.
   * @param {string} [config.placeholder] - Placeholder text.
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=''] - Main CSS class.
   * @throws {TypeError} If any attribute is of the wrong type.
   */
  constructor({
    value,
    list,
    placeholder,
    autocapitalize,
    autocomplete,
    pattern,
    minlength,
    maxlength,
    readonly = false,
    required = false,
    size,
    dirname,
    name,
    tags = [],
    mainClass = '',
  } = {}) {
    super({ name, placeholder, type: 'search', tags, mainClass, readonly, required });

    if (value !== undefined) this.value = value;
    if (list !== undefined) this.list = list;
    if (pattern !== undefined) this.pattern = pattern;
    if (autocapitalize !== undefined) this.autocapitalize = autocapitalize;
    if (autocomplete !== undefined) this.autocomplete = autocomplete;
    if (dirname !== undefined) this.dirname = dirname;
    if (minlength !== undefined) this.minlength = minlength;
    if (maxlength !== undefined) this.maxlength = maxlength;
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

  /** @param {string} name */
  set name(name) {
    if (typeof name !== 'string') throw new TypeError('"name" must be a string.');
    this.setAttr('name', name);
  }

  /** @returns {string|null} */
  get name() {
    return this.attrString('name');
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
    const allowed = ['none', 'sentences', 'words', 'characters'];
    if (!allowed.includes(autocapitalize))
      throw new TypeError(`"autocapitalize" must be one of: ${allowed.join(', ')}.`);
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

export default TinyHtmlSearchInput;
