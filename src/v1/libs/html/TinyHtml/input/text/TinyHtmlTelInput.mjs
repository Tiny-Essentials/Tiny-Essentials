import TinyHtmlInput from '../../TinyHtmlInput.mjs';

/**
 * TinyHtmlTelInput is a helper class for managing <input type="tel"> elements.
 * It supports all standard attributes relevant for telephone inputs,
 * including minlength, maxlength, pattern, autocomplete, and more.
 *
 * @example
 * const telInput = new TinyHtmlTelInput({
 *   name: 'phone',
 *   placeholder: 'Enter your phone number',
 *   required: true,
 *   minlength: 8,
 *   maxlength: 15,
 *   pattern: '[0-9]+'
 * });
 *
 * @extends TinyHtmlInput
 */
class TinyHtmlTelInput extends TinyHtmlInput {
  /**
   * Creates a new TinyHtmlTelInput instance.
   * @param {Object} config - Configuration object.
   * @param {string} [config.value] - Initial value of the input.
   * @param {number} [config.minlength] - Minimum number of characters allowed.
   * @param {number} [config.maxlength] - Maximum number of characters allowed.
   * @param {string} [config.name] - The name of the control.
   * @param {string} [config.autocomplete] - Autocomplete hint (e.g., "on", "off", "tel", "email").
   * @param {'none'|'sentences'|'words'|'characters'} [config.autocapitalize] - Auto-capitalization behavior.
   * @param {string} [config.dirname] - Name for directionality field.
   * @param {number} [config.size] - Size of the input box in characters.
   * @param {string} [config.list] - ID of a <datalist>.
   * @param {boolean} [config.readonly=false] - Whether the input is read-only.
   * @param {boolean} [config.required=false] - Whether the input is required.
   * @param {string} [config.placeholder] - Placeholder text.
   * @param {string} [config.pattern] - Regular expression pattern for validation.
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=''] - Main CSS class.
   * @throws {TypeError} If any attribute is of the wrong type.
   */
  constructor({
    value,
    minlength,
    maxlength,
    name,
    autocomplete,
    autocapitalize,
    dirname,
    size,
    list,
    readonly = false,
    required = false,
    placeholder,
    pattern,
    tags = [],
    mainClass = '',
  } = {}) {
    super({ type: 'tel', name, placeholder, readonly, required, tags, mainClass });

    if (minlength !== undefined) this.minlength = minlength;
    if (maxlength !== undefined) this.maxlength = maxlength;
    if (pattern !== undefined) this.pattern = pattern;
    if (list !== undefined) this.list = list;
    if (autocapitalize !== undefined) this.autocapitalize = autocapitalize;
    if (autocomplete !== undefined) this.autocomplete = autocomplete;
    if (dirname !== undefined) this.dirname = dirname;
    if (size !== undefined) this.sizeEl = size;
    if (value !== undefined) this.value = value;
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
      throw new TypeError('TinyHtmlTelInput: "minlength" must be a non-negative integer.');
    this.setAttr('minlength', minlength);
  }

  /** @returns {number|null} */
  get minlength() {
    return this.attrNumber('minlength');
  }

  /** @param {number} maxlength */
  set maxlength(maxlength) {
    if (!Number.isInteger(maxlength) || maxlength < 1)
      throw new TypeError('TinyHtmlTelInput: "maxlength" must be a positive integer.');
    this.setAttr('maxlength', maxlength);
  }

  /** @returns {number|null} */
  get maxlength() {
    return this.attrNumber('maxlength');
  }

  /** @param {string} pattern */
  set pattern(pattern) {
    if (typeof pattern !== 'string')
      throw new TypeError('TinyHtmlTelInput: "pattern" must be a string.');
    this.setAttr('pattern', pattern);
  }

  /** @returns {string|null} */
  get pattern() {
    return this.attrString('pattern');
  }

  /** @param {string} list */
  set list(list) {
    if (typeof list !== 'string')
      throw new TypeError('TinyHtmlTelInput: "list" must be a string (datalist id).');
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
      throw new TypeError(`TinyHtmlTelInput: "autocapitalize" must be one of ${valid.join(', ')}.`);
    this.setAttr('autocapitalize', autocapitalize);
  }

  /** @returns {string|null} */
  get autocapitalize() {
    return this.attrString('autocapitalize');
  }

  /** @param {string} autocomplete */
  set autocomplete(autocomplete) {
    if (typeof autocomplete !== 'string')
      throw new TypeError('TinyHtmlTelInput: "autocomplete" must be a string.');
    this.setAttr('autocomplete', autocomplete);
  }

  /** @returns {string|null} */
  get autocomplete() {
    return this.attrString('autocomplete');
  }

  /** @param {string} dirname */
  set dirname(dirname) {
    if (typeof dirname !== 'string')
      throw new TypeError('TinyHtmlTelInput: "dirname" must be a string.');
    this.setAttr('dirname', dirname);
  }

  /** @returns {string|null} */
  get dirname() {
    return this.attrString('dirname');
  }
}

export default TinyHtmlTelInput;
