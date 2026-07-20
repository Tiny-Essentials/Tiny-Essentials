import TinyHtmlInput from '../../TinyHtmlInput.mjs';

/**
 * TinyHtmlCheckboxInput is a helper class for managing <input type="checkbox"> elements.
 * It allows configuring standard attributes such as name, value, checked, readonly, and required,
 * with validation and getter/setter consistency.
 *
 * @example
 * const checkbox = new TinyHtmlCheckboxInput({
 *   name: 'acceptTerms',
 *   checked: true,
 *   value: 'yes'
 * });
 */
class TinyHtmlCheckboxInput extends TinyHtmlInput {
  /**
   * Creates a new TinyHtmlCheckboxInput instance.
   * @param {Object} config - Configuration object.
   * @param {boolean} [config.checked=false] - Whether the checkbox is checked.
   * @param {string} config.name - Input name attribute.
   * @param {string} [config.value] - Input value when checked.
   * @param {boolean} [config.readonly=false] - Whether the checkbox is readonly.
   * @param {boolean} [config.required=false] - Whether the checkbox is required.
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=''] - Main CSS class.
   * @throws {TypeError} If an attribute is of the wrong type.
   */
  constructor({
    checked = false,
    name,
    value,
    readonly = false,
    required = false,
    tags = [],
    mainClass = '',
  }) {
    super({ type: 'checkbox', name, tags, mainClass, readonly, required });

    // checked
    this.checked = checked;

    // value
    if (value !== undefined) this.value = value;
  }

  /** @param {boolean} checked */
  set checked(checked) {
    if (typeof checked !== 'boolean') {
      throw new TypeError('TinyHtmlCheckboxInput: "checked" must be a boolean.');
    }
    if (checked) this.addProp('checked');
    else this.removeProp('checked');
  }

  /** @returns {boolean} */
  get checked() {
    return this.hasProp('checked');
  }

  /** @param {string} value */
  set value(value) {
    if (typeof value !== 'string' && typeof value !== 'number') {
      throw new TypeError('TinyHtmlCheckboxInput: "value" must be a string.');
    }
    this.setAttr('value', value);
  }

  /** @returns {string|null} */
  get value() {
    return this.attrString('value');
  }

  /**
   * Checks the checkbox.
   * @returns {this}
   */
  check() {
    this.checked = true;
    return this;
  }

  /**
   * Unchecks the checkbox.
   * @returns {this}
   */
  uncheck() {
    this.checked = false;
    return this;
  }

  /**
   * Toggles the checkbox state.
   * @returns {this}
   */
  toggle() {
    this.checked = !this.checked;
    return this;
  }
}

export default TinyHtmlCheckboxInput;
