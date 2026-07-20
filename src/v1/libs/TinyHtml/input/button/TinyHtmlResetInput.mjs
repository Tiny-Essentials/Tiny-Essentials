import TinyHtmlInput from '../../TinyHtmlInput.mjs';

/**
 * TinyHtmlResetInput is a helper class for managing `<input type="reset">` elements.
 * It allows configuring common attributes such as value, name, placeholder,
 * readonly, and required, with validation and proper getter/setter methods.
 *
 * @example
 * const resetBtn = new TinyHtmlResetInput({
 *   value: 'Clear Form',
 *   name: 'resetButton',
 *   required: false,
 *   tags: ['btn', 'btn-reset'],
 * });
 */
class TinyHtmlResetInput extends TinyHtmlInput {
  /**
   * Creates a new TinyHtmlResetInput instance.
   * @param {Object} config - Configuration object.
   * @param {string} [config.value] - The initial value of the reset button.
   * @param {string} [config.name] - The name of the control.
   * @param {string} [config.placeholder] - Placeholder text (non-standard but supported).
   * @param {boolean} [config.readonly=false] - Whether the input is read-only.
   * @param {boolean} [config.required=false] - Whether the input is required.
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=''] - Main CSS class.
   * @throws {TypeError} If any attribute is of the wrong type.
   */
  constructor({
    value,
    name,
    placeholder,
    readonly = false,
    required = false,
    tags = [],
    mainClass = '',
  } = {}) {
    super({ name, placeholder, type: 'reset', tags, mainClass, readonly, required });

    // value
    if (value !== undefined) this.value = value;
  }

  /** @param {string|number} value */
  set value(value) {
    if (typeof value !== 'string' && typeof value !== 'number')
      throw new TypeError('TinyHtmlResetInput: "value" must be a string.');
    this.setAttr('value', value);
  }

  /** @returns {string|null} */
  get value() {
    return this.attrString('value');
  }
}

export default TinyHtmlResetInput;
