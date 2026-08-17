import TinyHtmlInput from '../../TinyHtmlInput.mjs';

/**
 * Validator to ensure the correct HTML5 date format (YYYY-MM-DD) and whether it is a real date.
 * @param {string} str
 * @returns {boolean}
 */
const isValidDateString = (str) => {
  if (typeof str !== 'string') return false;
  if (str.length < 1) return true;
  const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  if (!dateRegex.test(str)) return false;

  // Checks if the date is real in the calendar (e.g. blocks 2025-02-30)
  const date = new Date(str);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === str;
};

/**
 * TinyHtmlDateInput is a helper class for managing `<input type="date">` elements.
 * It provides validation and safe access to standard attributes such as `value`, `min`, `max`, `step`,
 * as well as common attributes like `name`, `placeholder`, `readonly`, `required`, etc.
 *
 * @example
 * const dateInput = new TinyHtmlDateInput({
 *   value: '2025-09-25',
 *   min: '2025-01-01',
 *   max: '2025-12-31',
 *   step: 1,
 *   required: true
 * });
 */
class TinyHtmlDateInput extends TinyHtmlInput {
  /**
   * Convert a Date to Date String.
   * @param {Date} value
   * @returns {string}
   */
  static dateToString(value) {
    if (!(value instanceof Date)) throw new TypeError('TinyHtmlDateInput: "value" must be a date.');

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Creates a new TinyHtmlDateInput instance.
   * @param {Object} config - Configuration object.
   * @param {string} [config.value] - Initial date value in `YYYY-MM-DD` format.
   * @param {string} [config.min] - Minimum allowed date (in `YYYY-MM-DD` format).
   * @param {string} [config.max] - Maximum allowed date (in `YYYY-MM-DD` format).
   * @param {number|'any'} [config.step] - Step value in days (number) or "any".
   * @param {string} [config.name] - The name of the input.
   * @param {string} [config.placeholder] - Placeholder text.
   * @param {string} [config.autocomplete] - Autocomplete hint (e.g., "on", "off", "bday").
   * @param {string} [config.list] - ID of a `<datalist>` element for suggestions.
   * @param {boolean} [config.readonly=false] - Whether the input is read-only.
   * @param {boolean} [config.required=false] - Whether the input is required.
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=''] - Main CSS class.
   * @throws {TypeError} If any attribute is of the wrong type.
   */
  constructor({
    value,
    min,
    max,
    step,
    name,
    placeholder,
    autocomplete,
    list,
    readonly = false,
    required = false,
    tags = [],
    mainClass = '',
  } = {}) {
    super({ type: 'date', name, placeholder, tags, mainClass });

    if (value !== undefined) this.value = value;
    if (min !== undefined) this.min = min;
    if (max !== undefined) this.max = max;
    if (step !== undefined) this.step = step;
    if (autocomplete !== undefined) this.autocomplete = autocomplete;
    if (list !== undefined) this.list = list;

    this.readonly = readonly;
    this.required = required;
  }

  /** @param {string} value */
  set value(value) {
    if (!isValidDateString(value))
      throw new TypeError(
        'TinyHtmlDateInput: "value" must be a valid real date string in YYYY-MM-DD format.',
      );
    this.setVal(value);
  }

  /** @returns {string|null} */
  get value() {
    return this.valTxt();
  }

  /** @param {string} min */
  set min(min) {
    if (!isValidDateString(min))
      throw new TypeError(
        'TinyHtmlDateInput: "min" must be a valid real date string in YYYY-MM-DD format.',
      );
    this.setAttr('min', min);
  }

  /** @returns {string|null} */
  get min() {
    return this.attrString('min');
  }

  /** @param {string} max */
  set max(max) {
    if (!isValidDateString(max))
      throw new TypeError(
        'TinyHtmlDateInput: "max" must be a valid real date string in YYYY-MM-DD format.',
      );
    this.setAttr('max', max);
  }

  /** @returns {string|null} */
  get max() {
    return this.attrString('max');
  }

  /** @param {number|'any'} step */
  set step(step) {
    if (!(typeof step === 'number' && step > 0) && step !== 'any')
      throw new TypeError('TinyHtmlDateInput: "step" must be a positive number or "any".');
    this.setAttr('step', step);
  }

  /** @returns {number|'any'|null} */
  get step() {
    const value = this.attrString('step');
    if (value === null || value === 'any') return value;
    return parseFloat(value);
  }

  /** @param {string} name */
  set name(name) {
    if (typeof name !== 'string')
      throw new TypeError('TinyHtmlDateInput: "name" must be a string.');
    this.setAttr('name', name);
  }

  /** @returns {string|null} */
  get name() {
    return this.attrString('name');
  }

  /** @param {string} placeholder */
  set placeholder(placeholder) {
    if (typeof placeholder !== 'string')
      throw new TypeError('TinyHtmlDateInput: "placeholder" must be a string.');
    this.setAttr('placeholder', placeholder);
  }

  /** @returns {string|null} */
  get placeholder() {
    return this.attrString('placeholder');
  }

  /** @param {string} autocomplete */
  set autocomplete(autocomplete) {
    if (typeof autocomplete !== 'string')
      throw new TypeError('TinyHtmlDateInput: "autocomplete" must be a string.');
    this.setAttr('autocomplete', autocomplete);
  }

  /** @returns {string|null} */
  get autocomplete() {
    return this.attrString('autocomplete');
  }

  /** @param {string} list */
  set list(list) {
    if (typeof list !== 'string')
      throw new TypeError('TinyHtmlDateInput: "list" must be a string (datalist id).');
    this.setAttr('list', list);
  }

  /** @returns {string|null} */
  get list() {
    return this.attrString('list');
  }
}

export default TinyHtmlDateInput;
