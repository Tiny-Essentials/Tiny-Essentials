import TinyHtmlInput from '../../TinyHtmlInput.mjs';

/**
 * TinyHtmlMonthInput is a helper class for managing `<input type="month">` elements.
 * It provides validation and convenient getters/setters for standard attributes.
 *
 * @example
 * const monthInput = new TinyHtmlMonthInput({
 *   value: '2025-09',
 *   min: '2020-01',
 *   max: '2030-12',
 *   step: 1,
 *   required: true,
 *   name: 'billingMonth'
 * });
 */
class TinyHtmlMonthInput extends TinyHtmlInput {
  /**
   * Creates a new TinyHtmlMonthInput instance.
   * @param {Object} config - Configuration object.
   * @param {string} [config.value] - Initial value (formatted as "YYYY-MM").
   * @param {string} [config.min] - Minimum allowed value (formatted as "YYYY-MM").
   * @param {string} [config.max] - Maximum allowed value (formatted as "YYYY-MM").
   * @param {number} [config.step] - Step size (in months).
   * @param {string} [config.name] - Name of the input control.
   * @param {string} [config.placeholder] - Placeholder text.
   * @param {string} [config.autocomplete] - Autocomplete hint (e.g., "on", "off", "email").
   * @param {string} [config.list] - ID of a linked `<datalist>`.
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
    name,
    readonly = false,
    required = false,
    placeholder,
    autocomplete,
    tags = [],
    mainClass = '',
  } = {}) {
    super({ name, placeholder, type: 'month', tags, mainClass });

    // --- set initial values ---
    if (value !== undefined) this.value = value;
    if (min !== undefined) this.min = min;
    if (max !== undefined) this.max = max;
    if (step !== undefined) this.step = step;
    if (list !== undefined) this.list = list;
    if (autocomplete !== undefined) this.autocomplete = autocomplete;
    this.readonly = readonly;
    this.required = required;
  }

  /** @param {string|Date} value */
  set value(value) {
    if (typeof value !== 'string' && !(value instanceof Date))
      throw new TypeError(
        'TinyHtmlMonthInput: "value" must be a string in format "YYYY-MM" or date.',
      );
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const formatted = `${year}-${month}`;
      this.setVal(formatted);
      return;
    }
    this.setVal(value);
  }

  /** @returns {string|null} */
  get value() {
    return this.valTxt();
  }

  /** @param {string} min */
  set min(min) {
    if (typeof min !== 'string')
      throw new TypeError('TinyHtmlMonthInput: "min" must be a string in format "YYYY-MM".');
    this.setAttr('min', min);
  }

  /** @returns {string|null} */
  get min() {
    return this.attrString('min');
  }

  /** @param {string} max */
  set max(max) {
    if (typeof max !== 'string')
      throw new TypeError('TinyHtmlMonthInput: "max" must be a string in format "YYYY-MM".');
    this.setAttr('max', max);
  }

  /** @returns {string|null} */
  get max() {
    return this.attrString('max');
  }

  /** @param {number} step */
  set step(step) {
    if (!Number.isInteger(step) || step < 1)
      throw new TypeError('TinyHtmlMonthInput: "step" must be a positive integer.');
    this.setAttr('step', step);
  }

  /** @returns {number|null} */
  get step() {
    return this.attrNumber('step');
  }

  /** @param {string} list */
  set list(list) {
    if (typeof list !== 'string')
      throw new TypeError('TinyHtmlMonthInput: "list" must be a string (datalist id).');
    this.setAttr('list', list);
  }

  /** @returns {string|null} */
  get list() {
    return this.attrString('list');
  }

  /** @param {string} autocomplete */
  set autocomplete(autocomplete) {
    if (typeof autocomplete !== 'string')
      throw new TypeError('TinyHtmlMonthInput: "autocomplete" must be a string.');
    this.setAttr('autocomplete', autocomplete);
  }

  /** @returns {string|null} */
  get autocomplete() {
    return this.attrString('autocomplete');
  }
}

export default TinyHtmlMonthInput;
