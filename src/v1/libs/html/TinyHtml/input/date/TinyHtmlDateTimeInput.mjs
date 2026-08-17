import TinyHtmlInput from '../../TinyHtmlInput.mjs';

/**
 * TinyHtmlDateTimeInput is a helper class for managing
 * `<input type="datetime-local">` elements with validation.
 *
 * It supports attributes such as `value`, `min`, `max`, `step`,
 * `placeholder`, `autocomplete`, and more.
 *
 * @example
 * const dateTimeInput = new TinyHtmlDateTimeInput({
 *   value: '2025-09-25T14:30',
 *   min: '2025-01-01T00:00',
 *   max: '2025-12-31T23:59',
 *   step: 60,
 *   required: true,
 *   name: 'meetingTime'
 * });
 */
class TinyHtmlDateTimeInput extends TinyHtmlInput {
  /**
   * Creates a new TinyHtmlDateTimeInput instance.
   * @param {Object} config - Configuration object.
   * @param {string} [config.value] - Initial datetime value (`YYYY-MM-DDTHH:MM`).
   * @param {string} [config.min] - Minimum allowed datetime.
   * @param {string} [config.max] - Maximum allowed datetime.
   * @param {number} [config.step] - Granularity in seconds (or multiples).
   * @param {string} [config.name] - The name of the control.
   * @param {string} [config.placeholder] - Placeholder text.
   * @param {string} [config.autocomplete] - Autocomplete hint (e.g., "on", "off").
   * @param {string} [config.list] - The id of a <datalist> element.
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
    super({
      type: 'datetime-local',
      name,
      placeholder,
      tags,
      mainClass,
      readonly,
      required,
    });

    if (value !== undefined) this.value = value;
    if (min !== undefined) this.min = min;
    if (max !== undefined) this.max = max;
    if (step !== undefined) this.step = step;
    if (list !== undefined) this.list = list;
    if (autocomplete !== undefined) this.autocomplete = autocomplete;
  }

  /** @param {string|number|Date} value */
  set value(value) {
    if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date))
      throw new TypeError('TinyHtmlDateTimeInput: "value" must be a string or date.');
    this.setVal(value);
  }

  /** @returns {string|null} */
  get value() {
    return this.valTxt();
  }

  /** @param {string} min */
  set min(min) {
    if (typeof min !== 'string')
      throw new TypeError('TinyHtmlDateTimeInput: "min" must be a string (YYYY-MM-DDTHH:MM).');
    this.setAttr('min', min);
  }

  /** @returns {string|null} */
  get min() {
    return this.attrString('min');
  }

  /** @param {string} max */
  set max(max) {
    if (typeof max !== 'string')
      throw new TypeError('TinyHtmlDateTimeInput: "max" must be a string (YYYY-MM-DDTHH:MM).');
    this.setAttr('max', max);
  }

  /** @returns {string|null} */
  get max() {
    return this.attrString('max');
  }

  /** @param {number} step */
  set step(step) {
    if (!Number.isInteger(step) || step < 1)
      throw new TypeError('TinyHtmlDateTimeInput: "step" must be a positive integer.');
    this.setAttr('step', step);
  }

  /** @returns {number|null} */
  get step() {
    return this.attrNumber('step');
  }

  /** @param {string} list */
  set list(list) {
    if (typeof list !== 'string')
      throw new TypeError('TinyHtmlDateTimeInput: "list" must be a string (datalist id).');
    this.setAttr('list', list);
  }

  /** @returns {string|null} */
  get list() {
    return this.attrString('list');
  }

  /** @param {string} autocomplete */
  set autocomplete(autocomplete) {
    if (typeof autocomplete !== 'string')
      throw new TypeError('TinyHtmlDateTimeInput: "autocomplete" must be a string.');
    this.setAttr('autocomplete', autocomplete);
  }

  /** @returns {string|null} */
  get autocomplete() {
    return this.attrString('autocomplete');
  }
}

export default TinyHtmlDateTimeInput;
