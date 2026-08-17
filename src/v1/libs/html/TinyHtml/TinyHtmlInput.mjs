import TinyHtmlTemplate from './TinyHtmlTemplate.mjs';

/**
 * TinyHtmlInput is a helper class for managing <input> elements.
 * It allows configuring all standard attributes such as type, value, placeholder,
 * name, and form-related flags with validation.
 *
 * @example
 * const input = new TinyHtmlInput({
 *   type: 'text',
 *   placeholder: 'Your name',
 *   required: true
 * });
 *
 * @extends TinyHtmlTemplate<HTMLInputElement>
 */
class TinyHtmlInput extends TinyHtmlTemplate {
  /**
   * Creates a new TinyHtmlInput instance.
   * @param {Object} config - Configuration object.
   * @param {string} [config.type="text"] - Input type (e.g., "text", "password", "email").
   * @param {string} [config.placeholder] - Placeholder text.
   * @param {string} [config.name] - Input name.
   * @param {boolean} [config.disabled=false] - Whether input is disabled.
   * @param {boolean} [config.readonly=false] - Whether input is readonly.
   * @param {boolean} [config.required=false] - Whether input is required.
   * @param {string} [config.form] - ID of a form element.
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=''] - Main CSS class.
   * @throws {TypeError} If any attribute is of the wrong type.
   */
  constructor({
    type = 'text',
    placeholder,
    name,
    disabled = false,
    readonly = false,
    required = false,
    form,
    tags = [],
    mainClass = '',
  } = {}) {
    super(document.createElement('input'), tags, mainClass);

    this.type = type;
    if (placeholder !== undefined) this.placeholder = placeholder;
    if (name !== undefined) this.name = name;
    this.disabled = disabled;
    this.readonly = readonly;
    this.required = required;
    if (form !== undefined) this.form = form;
  }

  /** @param {string} type */
  set type(type) {
    if (typeof type !== 'string' || !type.trim())
      throw new TypeError('TinyHtmlInput: "type" must be a non-empty string.');
    this.setAttr('type', type);
  }

  /** @returns {string|null} */
  get type() {
    return this.attrString('type');
  }

  /** @param {string} placeholder */
  set placeholder(placeholder) {
    if (typeof placeholder !== 'string')
      throw new TypeError('TinyHtmlInput: "placeholder" must be a string.');
    this.setAttr('placeholder', placeholder);
  }

  /** @returns {string|null} */
  get placeholder() {
    return this.attrString('placeholder');
  }

  /** @param {string} name */
  set name(name) {
    if (typeof name !== 'string') throw new TypeError('TinyHtmlInput: "name" must be a string.');
    this.setAttr('name', name);
  }

  /** @returns {string|null} */
  get name() {
    return this.attrString('name');
  }

  /** @param {boolean} disabled */
  set disabled(disabled) {
    if (typeof disabled !== 'boolean')
      throw new TypeError('TinyHtmlInput: "disabled" must be a boolean.');
    if (disabled) this.addProp('disabled');
    else this.removeProp('disabled');
  }

  /** @returns {boolean} */
  get disabled() {
    return this.hasProp('disabled');
  }

  /** @param {boolean} readonly */
  set readonly(readonly) {
    if (typeof readonly !== 'boolean')
      throw new TypeError('TinyHtmlInput: "readonly" must be a boolean.');
    if (readonly) this.addProp('readonly');
    else this.removeProp('readonly');
  }

  /** @returns {boolean} */
  get readonly() {
    return this.hasProp('readonly');
  }

  /** @param {boolean} required */
  set required(required) {
    if (typeof required !== 'boolean')
      throw new TypeError('TinyHtmlInput: "required" must be a boolean.');
    if (required) this.addProp('required');
    else this.removeProp('required');
  }

  /** @returns {boolean} */
  get required() {
    return this.hasProp('required');
  }

  /** @param {string} form */
  set form(form) {
    if (typeof form !== 'string') throw new TypeError('TinyHtmlInput: "form" must be a string.');
    this.setAttr('form', form);
  }

  /** @returns {string|null} */
  get form() {
    return this.attrString('form');
  }

  /** @param {number} size */
  set sizeEl(size) {
    if (!Number.isInteger(size) || size < 1)
      throw new TypeError('TinyHtmlUrlInput: "size" must be a positive integer.');
    this.setAttr('size', size);
  }

  /** @returns {number|null} */
  get sizeEl() {
    return this.attrNumber('size');
  }
}

export default TinyHtmlInput;
