import TinyHtmlInput from '../../TinyHtmlInput.mjs';

/**
 * TinyHtmlUrlInput is a helper class for managing `<input type="url">` elements.
 * It provides strongly-typed getters and setters for common attributes,
 * with validation and error handling.
 *
 * @example
 * const urlInput = new TinyHtmlUrlInput({
 *   name: 'website',
 *   placeholder: 'https://example.com',
 *   required: true,
 *   maxLength: 200,
 * });
 */
class TinyHtmlUrlInput extends TinyHtmlInput {
  /**
   * Creates a new TinyHtmlUrlInput instance.
   * @param {Object} config - Configuration object.
   * @param {string} [config.value] - Initial value of the input.
   * @param {number} [config.minLength] - Minimum number of characters.
   * @param {number} [config.maxLength] - Maximum number of characters.
   * @param {string} [config.name] - The name of the control.
   * @param {string} [config.pattern] - Regex pattern for validation.
   * @param {string} [config.autocomplete] - Autocomplete hint (e.g., "on", "off", "email").
   * @param {string} [config.dirname] - Name for the directionality field (text-based inputs).
   * @param {number} [config.size] - Width of the input in characters.
   * @param {string} [config.list] - ID of an associated <datalist>.
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
    autocomplete,
    minLength,
    maxLength,
    readonly = false,
    required = false,
    dirname,
    size,
    pattern,
    name,
    tags = [],
    mainClass = '',
  } = {}) {
    super({ name, placeholder, type: 'url', tags, mainClass });

    // Assign attributes via setters for validation
    if (value !== undefined) this.value = value;
    if (list !== undefined) this.list = list;
    if (placeholder !== undefined) this.placeholder = placeholder;
    if (autocomplete !== undefined) this.autocomplete = autocomplete;
    if (minLength !== undefined) this.minLength = minLength;
    if (maxLength !== undefined) this.maxLength = maxLength;
    if (readonly !== undefined) this.readonly = readonly;
    if (required !== undefined) this.required = required;
    if (dirname !== undefined) this.dirname = dirname;
    if (size !== undefined) this.sizeEl = size;
    if (pattern !== undefined) this.pattern = pattern;
  }

  /** @param {string} value */
  set value(value) {
    if (typeof value !== 'string')
      throw new TypeError('TinyHtmlUrlInput: "value" must be a string.');
    this.setVal(value);
  }

  /** @returns {string} */
  get value() {
    return this.valTxt();
  }

  /** @param {number} minLength */
  set minLength(minLength) {
    if (!Number.isInteger(minLength) || minLength < 0)
      throw new TypeError('TinyHtmlUrlInput: "minLength" must be a non-negative integer.');
    this.setAttr('minlength', minLength);
  }

  /** @returns {number|null} */
  get minLength() {
    return this.attrNumber('minlength');
  }

  /** @param {number} maxLength */
  set maxLength(maxLength) {
    if (!Number.isInteger(maxLength) || maxLength < 1)
      throw new TypeError('TinyHtmlUrlInput: "maxLength" must be a positive integer.');
    this.setAttr('maxlength', maxLength);
  }

  /** @returns {number|null} */
  get maxLength() {
    return this.attrNumber('maxlength');
  }

  /** @param {string} name */
  set name(name) {
    if (typeof name !== 'string') throw new TypeError('TinyHtmlUrlInput: "name" must be a string.');
    this.setAttr('name', name);
  }

  /** @returns {string|null} */
  get name() {
    return this.attrString('name');
  }

  /** @param {string} pattern */
  set pattern(pattern) {
    if (typeof pattern !== 'string')
      throw new TypeError('TinyHtmlUrlInput: "pattern" must be a string.');
    this.setAttr('pattern', pattern);
  }

  /** @returns {string|null} */
  get pattern() {
    return this.attrString('pattern');
  }

  /** @param {string} autocomplete */
  set autocomplete(autocomplete) {
    if (typeof autocomplete !== 'string')
      throw new TypeError('TinyHtmlUrlInput: "autocomplete" must be a string.');
    this.setAttr('autocomplete', autocomplete);
  }

  /** @returns {string|null} */
  get autocomplete() {
    return this.attrString('autocomplete');
  }

  /** @param {string} dirname */
  set dirname(dirname) {
    if (typeof dirname !== 'string')
      throw new TypeError('TinyHtmlUrlInput: "dirname" must be a string.');
    this.setAttr('dirname', dirname);
  }

  /** @returns {string|null} */
  get dirname() {
    return this.attrString('dirname');
  }

  /** @param {string} list */
  set list(list) {
    if (typeof list !== 'string')
      throw new TypeError('TinyHtmlUrlInput: "list" must be a string (datalist id).');
    this.setAttr('list', list);
  }

  /** @returns {string|null} */
  get list() {
    return this.attrString('list');
  }
}

export default TinyHtmlUrlInput;
