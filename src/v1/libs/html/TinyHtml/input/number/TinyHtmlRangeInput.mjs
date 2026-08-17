import TinyHtmlInput from '../../TinyHtmlInput.mjs';

/**
 * TinyHtmlRangeInput is a helper class for managing <input type="range"> elements.
 * It provides validation and convenient getters/setters for standard attributes
 * such as min, max, step, value, autocomplete, and list.
 *
 * @example
 * const range = new TinyHtmlRangeInput({
 *   min: 0,
 *   max: 100,
 *   step: 5,
 *   value: 50,
 *   name: 'volume',
 *   required: true
 * });
 */
class TinyHtmlRangeInput extends TinyHtmlInput {
  /**
   * Creates a new TinyHtmlRangeInput instance.
   * @param {Object} config - Configuration object.
   * @param {number} [config.min] - Minimum numeric value allowed.
   * @param {number} [config.max] - Maximum numeric value allowed.
   * @param {number} [config.step] - Step size for the value.
   * @param {number} [config.value] - Initial value of the range input.
   * @param {string} [config.name] - Name of the control.
   * @param {string} [config.autocomplete] - Autocomplete hint ("on", "off", "email", etc.).
   * @param {string} [config.list] - ID of an associated <datalist>.
   * @param {boolean} [config.readonly=false] - Whether the input is read-only.
   * @param {boolean} [config.required=false] - Whether the input is required.
   * @param {string} [config.placeholder] - Placeholder text (not commonly used for range).
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=''] - Main CSS class.
   * @throws {TypeError} If any attribute has an invalid type.
   */
  constructor({
    min,
    max,
    step,
    value,
    name,
    placeholder,
    autocomplete,
    list,
    readonly = false,
    required = false,
    tags = [],
    mainClass = '',
  } = {}) {
    super({ type: 'range', name, placeholder, tags, mainClass, readonly, required });

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
      throw new TypeError('TinyHtmlRangeInput: "value" must be a number.');
    this.setVal(value);
  }

  /** @returns {number} */
  get value() {
    return this.valNb();
  }

  /** @param {number} min */
  set min(min) {
    if (typeof min !== 'number') throw new TypeError('TinyHtmlRangeInput: "min" must be a number.');
    this.setAttr('min', String(min));
  }

  /** @returns {number|null} */
  get min() {
    return this.attrNumber('min');
  }

  /** @param {number} max */
  set max(max) {
    if (typeof max !== 'number') throw new TypeError('TinyHtmlRangeInput: "max" must be a number.');
    this.setAttr('max', String(max));
  }

  /** @returns {number|null} */
  get max() {
    return this.attrNumber('max');
  }

  /** @param {number} step */
  set step(step) {
    if (typeof step !== 'number')
      throw new TypeError('TinyHtmlRangeInput: "step" must be a number.');
    this.setAttr('step', String(step));
  }

  /** @returns {number|null} */
  get step() {
    return this.attrNumber('step');
  }

  /** @param {string} list */
  set list(list) {
    if (typeof list !== 'string')
      throw new TypeError('TinyHtmlRangeInput: "list" must be a string (datalist id).');
    this.setAttr('list', list);
  }

  /** @returns {string|null} */
  get list() {
    return this.attrString('list');
  }

  /** @param {string} autocomplete */
  set autocomplete(autocomplete) {
    if (typeof autocomplete !== 'string')
      throw new TypeError('TinyHtmlRangeInput: "autocomplete" must be a string.');
    this.setAttr('autocomplete', autocomplete);
  }

  /** @returns {string|null} */
  get autocomplete() {
    return this.attrString('autocomplete');
  }
}

export default TinyHtmlRangeInput;
