import TinyHtmlInput from '../../TinyHtmlInput.mjs';

/**
 * TinyHtmlRadioInput is a helper class for managing `<input type="radio">` elements.
 * It provides strict validation for attributes like `name`, `value`, `checked`, `readonly`,
 * and `required`, with convenient getters and setters.
 *
 * @example
 * const radio = new TinyHtmlRadioInput({
 *   name: 'gender',
 *   value: 'female',
 *   checked: true,
 *   required: true
 * });
 *
 * // Check state
 * radio.checked = false;
 * console.log(radio.checked); // false
 */
class TinyHtmlRadioInput extends TinyHtmlInput {
  /**
   * Creates a new TinyHtmlRadioInput instance.
   * @param {Object} config - Configuration object.
   * @param {string} config.name - Radio group name (required).
   * @param {string} [config.value] - Value for this radio option.
   * @param {boolean} [config.checked=false] - Whether this radio is selected.
   * @param {boolean} [config.readonly=false] - Whether the input is readonly.
   * @param {boolean} [config.required=false] - Whether the input is required.
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=''] - Main CSS class.
   * @throws {TypeError} If an attribute is of the wrong type.
   */
  constructor({
    name,
    value,
    checked = false,
    readonly = false,
    required = false,
    tags = [],
    mainClass = '',
  }) {
    super({ tags, mainClass, type: 'radio' });

    // --- name (required) ---
    if (typeof name !== 'string') {
      throw new TypeError('TinyHtmlRadioInput: "name" is required and must be a string.');
    }
    this.name = name;

    // --- value ---
    if (value !== undefined) this.value = value;

    // --- checked ---
    this.checked = checked;

    // --- readonly ---
    this.readonly = readonly;

    // --- required ---
    this.required = required;
  }

  /** @param {string} value */
  set value(value) {
    if (typeof value !== 'string' && typeof value !== 'number') {
      throw new TypeError('TinyHtmlRadioInput: "value" must be a string or number.');
    }
    this.setAttr('value', value);
  }

  /** @returns {string|null} */
  get value() {
    return this.attrString('value');
  }

  /** @param {string} name */
  set name(name) {
    if (typeof name !== 'string') {
      throw new TypeError('TinyHtmlRadioInput: "name" must be a string.');
    }
    this.setAttr('name', name);
  }

  /** @returns {string|null} */
  get name() {
    return this.attrString('name');
  }

  /** @param {boolean} checked */
  set checked(checked) {
    if (typeof checked !== 'boolean') {
      throw new TypeError('TinyHtmlRadioInput: "checked" must be a boolean.');
    }
    if (checked) this.addProp('checked');
    else this.removeProp('checked');
  }

  /** @returns {boolean} */
  get checked() {
    return this.hasProp('checked');
  }

  /**
   * Toggles the checked state of the radio.
   * @returns {this}
   */
  toggle() {
    this.checked = !this.checked;
    return this;
  }
}

export default TinyHtmlRadioInput;
