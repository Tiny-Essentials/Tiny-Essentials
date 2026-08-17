import TinyHtmlInput from '../../TinyHtmlInput.mjs';

/**
 * TinyHtmlNumberInput is a helper class for managing <input type="number"> elements.
 * It provides typed getters and setters for standard number input attributes
 * such as min, max, step, value, and more.
 *
 * @example
 * const numberInput = new TinyHtmlNumberInput({
 *   min: 0,
 *   max: 100,
 *   step: 5,
 *   value: 10,
 *   required: true
 * });
 */
class TinyHtmlNumberInput extends TinyHtmlInput {
  /**
   * Creates a new TinyHtmlNumberInput instance.
   * @param {Object} config - Configuration object.
   * @param {number} [config.value] - Initial numeric value.
   * @param {number} [config.min] - Minimum allowed value.
   * @param {number} [config.max] - Maximum allowed value.
   * @param {number} [config.step] - Step size.
   * @param {string} [config.name] - Name of the control.
   * @param {string} [config.placeholder] - Placeholder text.
   * @param {string} [config.autocomplete] - Autocomplete hint (e.g., "on", "off", "email").
   * @param {string} [config.list] - ID of a <datalist>.
   * @param {boolean} [config.readonly=false] - Whether the input is read-only.
   * @param {boolean} [config.required=false] - Whether the input is required.
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=''] - Main CSS class.
   * @throws {TypeError} If any attribute is of the wrong type.
   */
  constructor({
    value,
    list,
    min,
    max,
    step,
    readonly = false,
    required = false,
    name,
    placeholder,
    autocomplete,
    tags = [],
    mainClass = '',
  } = {}) {
    super({ name, placeholder, type: 'number', tags, mainClass, readonly, required });

    if (value !== undefined) this.value = value;
    if (min !== undefined) this.min = min;
    if (max !== undefined) this.max = max;
    if (step !== undefined) this.step = step;
    if (list !== undefined) this.list = list;
    if (autocomplete !== undefined) this.autocomplete = autocomplete;
  }

  /** @param {number} value */
  set value(value) {
    if (typeof value !== 'number')
      throw new TypeError('TinyHtmlNumberInput: "value" must be a number.');
    this.setVal(value);
  }

  /** @returns {number} */
  get value() {
    return this.valNb();
  }

  /** @param {number} min */
  set min(min) {
    if (typeof min !== 'number')
      throw new TypeError('TinyHtmlNumberInput: "min" must be a number.');
    this.setAttr('min', String(min));
  }

  /** @returns {number|null} */
  get min() {
    return this.attrNumber('min');
  }

  /** @param {number} max */
  set max(max) {
    if (typeof max !== 'number')
      throw new TypeError('TinyHtmlNumberInput: "max" must be a number.');
    this.setAttr('max', String(max));
  }

  /** @returns {number|null} */
  get max() {
    return this.attrNumber('max');
  }

  /** @param {number} step */
  set step(step) {
    if (typeof step !== 'number')
      throw new TypeError('TinyHtmlNumberInput: "step" must be a number.');
    this.setAttr('step', String(step));
  }

  /** @returns {number|null} */
  get step() {
    return this.attrNumber('step');
  }

  /** @param {string} list */
  set list(list) {
    if (typeof list !== 'string')
      throw new TypeError('TinyHtmlNumberInput: "list" must be a string (datalist id).');
    this.setAttr('list', list);
  }

  /** @returns {string|null} */
  get list() {
    return this.attrString('list');
  }

  /** @param {string} autocomplete */
  set autocomplete(autocomplete) {
    if (typeof autocomplete !== 'string')
      throw new TypeError('TinyHtmlNumberInput: "autocomplete" must be a string.');
    this.setAttr('autocomplete', autocomplete);
  }

  /** @returns {string|null} */
  get autocomplete() {
    return this.attrString('autocomplete');
  }
}

export default TinyHtmlNumberInput;
