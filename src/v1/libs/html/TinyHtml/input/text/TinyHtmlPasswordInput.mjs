import TinyHtmlInput from '../../TinyHtmlInput.mjs';

/**
 * TinyHtmlPasswordInput is a helper class for managing
 * `<input type="password">` elements with validation and attribute control.
 *
 * @example
 * const passwordInput = new TinyHtmlPasswordInput({
 *   name: 'user-password',
 *   required: true,
 *   minlength: 8,
 *   maxlength: 32,
 *   pattern: '[A-Za-z0-9]+',
 *   placeholder: 'Enter your password...'
 * });
 */
class TinyHtmlPasswordInput extends TinyHtmlInput {
  /**
   * Creates a new TinyHtmlPasswordInput instance.
   * @param {Object} config - Configuration object.
   * @param {string} [config.value] - Initial value.
   * @param {number} [config.minlength] - Minimum length in UTF-16 code units.
   * @param {number} [config.maxlength] - Maximum length in UTF-16 code units.
   * @param {string} [config.name] - Name of the input.
   * @param {string} [config.pattern] - Regex pattern to validate against.
   * @param {string} [config.autocomplete] - Autocomplete hint (e.g., "on", "off", "email").
   * @param {number} [config.size] - Number of characters visible.
   * @param {boolean} [config.readonly=false] - Whether the input is read-only.
   * @param {boolean} [config.required=false] - Whether the input is required.
   * @param {string} [config.placeholder] - Placeholder text.
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=''] - Main CSS class.
   * @throws {TypeError} If any attribute is of the wrong type.
   */
  constructor({
    value,
    minlength,
    maxlength,
    name,
    pattern,
    autocomplete,
    size,
    readonly = false,
    required = false,
    placeholder,
    tags = [],
    mainClass = '',
  } = {}) {
    super({ type: 'password', name, placeholder, tags, mainClass });

    // Apply attributes if provided
    if (minlength !== undefined) this.minlength = minlength;
    if (maxlength !== undefined) this.maxlength = maxlength;
    if (pattern !== undefined) this.pattern = pattern;
    if (autocomplete !== undefined) this.autocomplete = autocomplete;
    if (size !== undefined) this.sizeEl = size;
    if (value !== undefined) this.value = value;

    // Boolean props
    this.readonly = readonly;
    this.required = required;
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
      throw new TypeError('TinyHtmlPasswordInput: "minlength" must be a non-negative integer.');
    this.setAttr('minlength', minlength);
  }

  /** @returns {number|null} */
  get minlength() {
    return this.attrNumber('minlength');
  }

  /** @param {number} maxlength */
  set maxlength(maxlength) {
    if (!Number.isInteger(maxlength) || maxlength < 1)
      throw new TypeError('TinyHtmlPasswordInput: "maxlength" must be a positive integer.');
    this.setAttr('maxlength', maxlength);
  }

  /** @returns {number|null} */
  get maxlength() {
    return this.attrNumber('maxlength');
  }

  /** @param {string} pattern */
  set pattern(pattern) {
    if (typeof pattern !== 'string')
      throw new TypeError('TinyHtmlPasswordInput: "pattern" must be a string.');
    this.setAttr('pattern', pattern);
  }

  /** @returns {string|null} */
  get pattern() {
    return this.attrString('pattern');
  }

  /** @param {string} autocomplete */
  set autocomplete(autocomplete) {
    if (typeof autocomplete !== 'string')
      throw new TypeError('TinyHtmlPasswordInput: "autocomplete" must be a string.');
    this.setAttr('autocomplete', autocomplete);
  }

  /** @returns {string|null} */
  get autocomplete() {
    return this.attrString('autocomplete');
  }
}

export default TinyHtmlPasswordInput;
