import TinyHtmlInput from '../TinyHtmlInput.mjs';

/**
 * TinyHtmlHiddenInput is a helper class for managing
 * <input type="hidden"> elements. It provides validation
 * and structured getters/setters for common attributes.
 *
 * @example
 * const hidden = new TinyHtmlHiddenInput({
 *   name: 'csrf_token',
 *   value: '12345',
 *   required: true
 * });
 *
 * @extends TinyHtmlInput
 */
class TinyHtmlHiddenInput extends TinyHtmlInput {
  /**
   * Creates a new TinyHtmlHiddenInput instance.
   * @param {Object} config - Configuration object.
   * @param {string} [config.value] - Initial value of the input.
   * @param {string} [config.name] - The name of the control.
   * @param {string} [config.autocomplete] - Autocomplete hint (e.g., "on", "off", "email").
   * @param {string} [config.dirname] - Directionality field name (for text-based inputs).
   * @param {boolean} [config.readonly=false] - Whether the input is read-only.
   * @param {boolean} [config.required=false] - Whether the input is required.
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=''] - Main CSS class.
   * @throws {TypeError} If any attribute is of the wrong type.
   */
  constructor({
    name,
    value,
    dirname,
    autocomplete,
    readonly = false,
    required = false,
    tags = [],
    mainClass = '',
  } = {}) {
    super({ type: 'hidden', name, tags, mainClass });

    if (value !== undefined) this.value = value;
    if (autocomplete !== undefined) this.autocomplete = autocomplete;
    if (dirname !== undefined) this.dirname = dirname;
    this.readonly = readonly;
    this.required = required;
  }

  /** @param {string} value */
  set value(value) {
    if (typeof value !== 'string')
      throw new TypeError('TinyHtmlHiddenInput: "value" must be a string.');
    this.setAttr('value', String(value));
  }

  /** @returns {string|null} */
  get value() {
    return this.attrString('value');
  }

  /** @param {string} name */
  set name(name) {
    if (typeof name !== 'string')
      throw new TypeError('TinyHtmlHiddenInput: "name" must be a string.');
    this.setAttr('name', name);
  }

  /** @returns {string|null} */
  get name() {
    return this.attrString('name');
  }

  /** @param {string} autocomplete */
  set autocomplete(autocomplete) {
    if (typeof autocomplete !== 'string')
      throw new TypeError('TinyHtmlHiddenInput: "autocomplete" must be a string.');
    this.setAttr('autocomplete', autocomplete);
  }

  /** @returns {string|null} */
  get autocomplete() {
    return this.attrString('autocomplete');
  }

  /** @param {string} dirname */
  set dirname(dirname) {
    if (typeof dirname !== 'string')
      throw new TypeError('TinyHtmlHiddenInput: "dirname" must be a string.');
    this.setAttr('dirname', dirname);
  }

  /** @returns {string|null} */
  get dirname() {
    return this.attrString('dirname');
  }
}

export default TinyHtmlHiddenInput;
