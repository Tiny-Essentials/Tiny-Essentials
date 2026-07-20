import TinyHtmlInput from '../../TinyHtmlInput.mjs';

/**
 * Validator to ensure the correct HTML5 time format (HH:MM or HH:MM:SS or HH:MM:SS.mmm)
 * @param {string} str
 * @returns {boolean}
 */
const isValidTimeString = (str) => {
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d(\.\d{1,3})?)?$/;
  return typeof str === 'string' && (str.length < 1 || timeRegex.test(str));
};

/**
 * TinyHtmlTimeInput is a helper class for managing `<input type="time">` elements.
 * It provides validated getters and setters for all relevant attributes such as
 * value, min, max, step, autocomplete, and more.
 *
 * @example
 * const timeInput = new TinyHtmlTimeInput({
 *   value: "12:30",
 *   min: "08:00",
 *   max: "18:00",
 *   step: 60,
 *   required: true,
 *   name: "appointmentTime"
 * });
 */
class TinyHtmlTimeInput extends TinyHtmlInput {
  /**
   * Convert a Date to Time String.
   * @param {Date} value
   * @returns {string}
   */
  static dateToString(value) {
    if (!(value instanceof Date)) throw new TypeError('TinyHtmlTimeInput: "value" must be a date.');

    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    const seconds = String(value.getSeconds()).padStart(2, '0');
    const milliSecondss = String(value.getMilliseconds()).padStart(3, '0');

    return `${hours}:${minutes}:${seconds}.${milliSecondss}`;
  }

  /**
   * Creates a new TinyHtmlTimeInput instance.
   * @param {Object} config - Configuration object.
   * @param {string} [config.value] - Initial time value in "HH:MM" format.
   * @param {string} [config.min] - Minimum allowed time (e.g., "08:00").
   * @param {string} [config.max] - Maximum allowed time (e.g., "18:00").
   * @param {number|'any'} [config.step] - Granularity in seconds (or "any").
   * @param {string} [config.name] - The name of the control.
   * @param {string} [config.placeholder] - Placeholder text.
   * @param {string} [config.autocomplete] - Autocomplete hint ("on", "off", or token list).
   * @param {string} [config.list] - The id of a `<datalist>`.
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
    super({ name, placeholder, type: 'time', tags, mainClass });

    // --- attributes initialization ---
    if (value !== undefined) this.value = value;
    if (min !== undefined) this.min = min;
    if (max !== undefined) this.max = max;
    if (step !== undefined) this.step = step;
    if (list !== undefined) this.list = list;
    if (autocomplete !== undefined) this.autocomplete = autocomplete;

    // --- boolean props ---
    this.readonly = readonly;
    this.required = required;
  }

  /** @param {string} value */
  set value(value) {
    if (!isValidTimeString(value))
      throw new TypeError(
        'TinyHtmlTimeInput: "value" must be a valid time string (HH:MM or HH:MM:SS).',
      );
    this.setVal(value);
  }

  /** @returns {string|null} */
  get value() {
    return this.attrString('value');
  }

  /** @param {string} min */
  set min(min) {
    if (!isValidTimeString(min))
      throw new TypeError(
        'TinyHtmlTimeInput: "min" must be a valid time string (HH:MM or HH:MM:SS).',
      );
    this.setAttr('min', min);
  }

  /** @returns {string|null} */
  get min() {
    return this.attrString('min');
  }

  /** @param {string} max */
  set max(max) {
    if (!isValidTimeString(max))
      throw new TypeError(
        'TinyHtmlTimeInput: "max" must be a valid time string (HH:MM or HH:MM:SS).',
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
      throw new TypeError('TinyHtmlTimeInput: "step" must be a positive number or "any".');
    this.setAttr('step', step);
  }

  /** @returns {number|'any'|null} */
  get step() {
    const value = this.attrString('step');
    if (value === null || value === 'any') return value;
    return parseFloat(value);
  }

  /** @param {string} list */
  set list(list) {
    if (typeof list !== 'string')
      throw new TypeError('TinyHtmlTimeInput: "list" must be a string (datalist id).');
    this.setAttr('list', list);
  }

  /** @returns {string|null} */
  get list() {
    return this.attrString('list');
  }

  /** @param {string} autocomplete */
  set autocomplete(autocomplete) {
    if (typeof autocomplete !== 'string')
      throw new TypeError('TinyHtmlTimeInput: "autocomplete" must be a string.');
    this.setAttr('autocomplete', autocomplete);
  }

  /** @returns {string|null} */
  get autocomplete() {
    return this.attrString('autocomplete');
  }
}

export default TinyHtmlTimeInput;
