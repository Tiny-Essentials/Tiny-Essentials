import TinyHtmlInput from '../../TinyHtmlInput.mjs';

/**
 * TinyHtmlButtonInput is a helper class for managing `<input type="button">` elements.
 * It provides validation and easy configuration for standard and button-specific attributes.
 *
 * @example
 * const button = new TinyHtmlButtonInput({
 *   value: 'Click me',
 *   name: 'myButton',
 *   popovertarget: 'popoverId',
 *   popovertargetaction: 'toggle'
 * });
 */
class TinyHtmlButtonInput extends TinyHtmlInput {
  /**
   * Creates a new TinyHtmlButtonInput instance.
   * @param {Object} config - Configuration object.
   * @param {string} [config.name] - The name of the input.
   * @param {string} [config.placeholder] - Placeholder text (non-standard for buttons).
   * @param {string} [config.popovertarget] - The ID of the target popover.
   * @param {"show"|"hide"|"toggle"} [config.popovertargetaction] - The action applied to the popover.
   * @param {string} [config.value="Button"] - The label displayed on the button.
   * @param {boolean} [config.readonly=false] - Whether the input is read-only.
   * @param {boolean} [config.required=false] - Whether the input is required.
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=''] - Main CSS class applied.
   * @throws {TypeError} If attributes are of the wrong type.
   */
  constructor({
    value = 'Button',
    tags = [],
    placeholder,
    popovertarget,
    popovertargetaction,
    readonly = false,
    required = false,
    name,
    mainClass = '',
  } = {}) {
    super({ name, placeholder, type: 'button', tags, mainClass, readonly, required });

    this.value = value;
    if (popovertarget !== undefined) this.popovertarget = popovertarget;
    if (popovertargetaction !== undefined) this.popovertargetaction = popovertargetaction;
  }

  /** @param {string} value */
  set value(value) {
    if (typeof value !== 'string' && typeof value !== 'number')
      throw new TypeError('TinyHtmlButtonInput: "value" must be a string.');
    this.setAttr('value', String(value));
    this.setVal(String(value));
  }

  /** @returns {string|null} */
  get value() {
    return this.valTxt();
  }

  /** @param {string} popovertarget */
  set popovertarget(popovertarget) {
    if (typeof popovertarget !== 'string')
      throw new TypeError('TinyHtmlButtonInput: "popovertarget" must be a string.');
    this.setAttr('popovertarget', popovertarget);
  }

  /** @returns {string|null} */
  get popovertarget() {
    return this.attrString('popovertarget');
  }

  /** @param {"show"|"hide"|"toggle"} action */
  set popovertargetaction(action) {
    const allowed = ['show', 'hide', 'toggle'];
    if (!allowed.includes(action))
      throw new TypeError(
        `TinyHtmlButtonInput: "popovertargetaction" must be one of ${allowed.join(', ')}.`,
      );
    this.setAttr('popovertargetaction', action);
  }

  /** @returns {string|null} */
  get popovertargetaction() {
    return this.attrString('popovertargetaction');
  }
}

export default TinyHtmlButtonInput;
