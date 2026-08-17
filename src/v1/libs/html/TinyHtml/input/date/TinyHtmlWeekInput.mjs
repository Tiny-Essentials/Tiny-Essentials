import TinyHtmlInput from '../../TinyHtmlInput.mjs';

/**
 * TinyHtmlWeekInput is a helper class for managing `<input type="week">` elements.
 * It provides getters and setters for all standard attributes, ensuring type safety
 * and validation for each property.
 *
 * @example
 * const weekInput = new TinyHtmlWeekInput({
 *   value: '2023-W15',
 *   min: '2023-W01',
 *   max: '2023-W52',
 *   step: 1,
 *   required: true
 * });
 */
class TinyHtmlWeekInput extends TinyHtmlInput {
  /**
   * Creates a new TinyHtmlWeekInput instance.
   * @param {Object} config - Configuration object.
   * @param {string} [config.value] - Initial value (`YYYY-Www` format).
   * @param {string} [config.min] - Minimum allowed week (`YYYY-Www`).
   * @param {string} [config.max] - Maximum allowed week (`YYYY-Www`).
   * @param {number} [config.step] - Step interval in weeks.
   * @param {string} [config.name] - The name of the input.
   * @param {string} [config.placeholder] - Placeholder text.
   * @param {string} [config.autocomplete] - Autocomplete hint (e.g., "on", "off").
   * @param {string} [config.list] - ID of a `<datalist>`.
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
    super({ type: 'week', name, placeholder, tags, mainClass, readonly, required });

    if (value !== undefined) this.value = value;
    if (min !== undefined) this.min = min;
    if (max !== undefined) this.max = max;
    if (step !== undefined) this.step = step;
    if (list !== undefined) this.list = list;
    if (autocomplete !== undefined) this.autocomplete = autocomplete;
  }

  /** @param {string|Date} value */
  set value(value) {
    if (typeof value !== 'string' && !(value instanceof Date))
      throw new TypeError(
        'TinyHtmlWeekInput: "value" must be a string (format: YYYY-Www) or date.',
      );
    if (value instanceof Date) {
      // ISO week number calculation
      const temp = new Date(value.getTime());
      temp.setHours(0, 0, 0, 0);
      // Thursday in current week decides the year
      temp.setDate(temp.getDate() + 3 - ((temp.getDay() + 6) % 7));
      const weekYear = temp.getFullYear();
      const week1 = new Date(weekYear, 0, 4);
      const weekNo = Math.ceil(
        ((temp.valueOf() - week1.valueOf()) / 86400000 + ((week1.getDay() + 6) % 7) + 1) / 7,
      );
      this.setVal(`${weekYear}-W${String(weekNo).padStart(2, '0')}`);
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
      throw new TypeError('TinyHtmlWeekInput: "min" must be a string (format: YYYY-Www).');
    this.setAttr('min', min);
  }

  /** @returns {string|null} */
  get min() {
    return this.attrString('min');
  }

  /** @param {string} max */
  set max(max) {
    if (typeof max !== 'string')
      throw new TypeError('TinyHtmlWeekInput: "max" must be a string (format: YYYY-Www).');
    this.setAttr('max', max);
  }

  /** @returns {string|null} */
  get max() {
    return this.attrString('max');
  }

  /** @param {number} step */
  set step(step) {
    if (!Number.isInteger(step) || step < 1)
      throw new TypeError('TinyHtmlWeekInput: "step" must be a positive integer.');
    this.setAttr('step', String(step));
  }

  /** @returns {number|null} */
  get step() {
    return this.attrNumber('step');
  }

  /** @param {string} list */
  set list(list) {
    if (typeof list !== 'string')
      throw new TypeError('TinyHtmlWeekInput: "list" must be a string (datalist id).');
    this.setAttr('list', list);
  }

  /** @returns {string|null} */
  get list() {
    return this.attrString('list');
  }

  /** @param {string} autocomplete */
  set autocomplete(autocomplete) {
    if (typeof autocomplete !== 'string')
      throw new TypeError('TinyHtmlWeekInput: "autocomplete" must be a string.');
    this.setAttr('autocomplete', autocomplete);
  }

  /** @returns {string|null} */
  get autocomplete() {
    return this.attrString('autocomplete');
  }
}

export default TinyHtmlWeekInput;
