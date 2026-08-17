import TinyHtmlInput from '../../TinyHtmlInput.mjs';

/**
 * TinyHtmlEmailInput is a helper class for managing <input type="email"> elements.
 * It provides strongly typed getters and setters for common attributes such as
 * minlength, maxlength, pattern, autocomplete, multiple, and more.
 *
 * @example
 * const emailInput = new TinyHtmlEmailInput({
 *   placeholder: 'Enter your email',
 *   required: true,
 *   maxlength: 100,
 *   autocomplete: 'email'
 * });
 */
class TinyHtmlEmailInput extends TinyHtmlInput {
  /**
   * Creates a new TinyHtmlEmailInput instance.
   * @param {Object} config - Configuration object.
   * @param {string} [config.value] - Initial value.
   * @param {number} [config.minLength] - Minimum number of characters allowed.
   * @param {number} [config.maxLength] - Maximum number of characters allowed.
   * @param {string} [config.pattern] - Regex pattern for validation.
   * @param {string} [config.autocomplete] - Autocomplete hint (e.g., "on", "off", "email").
   * @param {string} [config.dirname] - Name of the directionality field (text-based inputs).
   * @param {string} [config.list] - ID of a <datalist> element.
   * @param {boolean} [config.multiple=false] - Whether multiple values are allowed.
   * @param {number} [config.size] - Size of the input box in characters.
   * @param {boolean} [config.readonly=false] - Whether the input is readonly.
   * @param {boolean} [config.required=false] - Whether the input is required.
   * @param {string} [config.placeholder] - Placeholder text.
   * @param {string} [config.name] - Name of the control.
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=''] - Main CSS class.
   * @throws {TypeError} If any attribute is of the wrong type.
   */
  constructor({
    value,
    list,
    placeholder,
    readonly = false,
    required = false,
    multiple = false,
    minLength,
    autocomplete,
    size,
    pattern,
    maxLength,
    dirname,
    name,
    tags = [],
    mainClass = '',
  } = {}) {
    super({ type: 'email', name, placeholder, readonly, required, tags, mainClass });

    if (minLength !== undefined) this.minLength = minLength;
    if (maxLength !== undefined) this.maxLength = maxLength;
    if (pattern !== undefined) this.pattern = pattern;
    if (multiple !== undefined) this.multiple = multiple;
    if (list !== undefined) this.list = list;
    if (autocomplete !== undefined) this.autocomplete = autocomplete;
    if (dirname !== undefined) this.dirname = dirname;
    if (size !== undefined) this.sizeEl = size;
    if (value !== undefined) this.value = value;
  }

  /** @param {string} value */
  set value(value) {
    if (typeof value !== 'string')
      throw new TypeError('TinyHtmlEmailInput: "value" must be a string.');
    this.setVal(value);
  }

  /** @returns {string} */
  get value() {
    return this.valTxt();
  }

  /** @param {number} minLength */
  set minLength(minLength) {
    if (!Number.isInteger(minLength) || minLength < 0)
      throw new TypeError('TinyHtmlEmailInput: "minLength" must be a non-negative integer.');
    this.setAttr('minlength', minLength);
  }

  /** @returns {number|null} */
  get minLength() {
    return this.attrNumber('minlength');
  }

  /** @param {number} maxLength */
  set maxLength(maxLength) {
    if (!Number.isInteger(maxLength) || maxLength < 1)
      throw new TypeError('TinyHtmlEmailInput: "maxLength" must be a positive integer.');
    this.setAttr('maxlength', maxLength);
  }

  /** @returns {number|null} */
  get maxLength() {
    return this.attrNumber('maxlength');
  }

  /** @param {string} pattern */
  set pattern(pattern) {
    if (typeof pattern !== 'string')
      throw new TypeError('TinyHtmlEmailInput: "pattern" must be a string.');
    this.setAttr('pattern', pattern);
  }

  /** @returns {string|null} */
  get pattern() {
    return this.attrString('pattern');
  }

  /** @param {boolean} multiple */
  set multiple(multiple) {
    if (typeof multiple !== 'boolean')
      throw new TypeError('TinyHtmlEmailInput: "multiple" must be a boolean.');
    if (multiple) this.addProp('multiple');
    else this.removeProp('multiple');
  }

  /** @returns {boolean} */
  get multiple() {
    return this.hasProp('multiple');
  }

  /** @param {string} list */
  set list(list) {
    if (typeof list !== 'string')
      throw new TypeError('TinyHtmlEmailInput: "list" must be a string (datalist id).');
    this.setAttr('list', list);
  }

  /** @returns {string|null} */
  get list() {
    return this.attrString('list');
  }

  /** @param {string} autocomplete */
  set autocomplete(autocomplete) {
    if (typeof autocomplete !== 'string')
      throw new TypeError('TinyHtmlEmailInput: "autocomplete" must be a string.');
    this.setAttr('autocomplete', autocomplete);
  }

  /** @returns {string|null} */
  get autocomplete() {
    return this.attrString('autocomplete');
  }

  /** @param {string} dirname */
  set dirname(dirname) {
    if (typeof dirname !== 'string')
      throw new TypeError('TinyHtmlEmailInput: "dirname" must be a string.');
    this.setAttr('dirname', dirname);
  }

  /** @returns {string|null} */
  get dirname() {
    return this.attrString('dirname');
  }

  /** @param {number} size */
  set sizeEl(size) {
    if (!Number.isInteger(size) || size < 1)
      throw new TypeError('TinyHtmlEmailInput: "size" must be a positive integer.');
    this.setAttr('size', size);
  }

  /** @returns {number|null} */
  get sizeEl() {
    return this.attrNumber('size');
  }
}

export default TinyHtmlEmailInput;
