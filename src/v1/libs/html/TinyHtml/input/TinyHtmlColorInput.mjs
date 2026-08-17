import TinyHtmlInput from '../TinyHtmlInput.mjs';

/**
 * TinyHtmlColorInput is a helper class for managing `<input type="color">` elements.
 * It provides strict validation for attributes such as `value`, `alpha`, `autocomplete`,
 * `list`, `readonly`, `required`, and `colorspace`.
 *
 * @example
 * const colorInput = new TinyHtmlColorInput({
 *   value: '#ff0000',
 *   alpha: 0.8,
 *   autocomplete: 'on',
 *   required: true
 * });
 */
class TinyHtmlColorInput extends TinyHtmlInput {
  /**
   * Creates a new TinyHtmlColorInput instance.
   * @param {Object} config - Configuration object.
   * @param {string} [config.value="#000000"] - Initial color value.
   * @param {number} [config.alpha] - Alpha (transparency) value.
   * @param {string} [config.placeholder] - Placeholder text.
   * @param {string} [config.name] - Name of the input.
   * @param {string} [config.autocomplete] - Autocomplete hint (e.g., "on", "off", "email").
   * @param {string} [config.list] - ID of a `<datalist>`.
   * @param {boolean} [config.readonly=false] - Whether the input is read-only.
   * @param {boolean} [config.required=false] - Whether the input is required.
   * @param {string} [config.colorspace] - Colorspace for image inputs (e.g., "sRGB").
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=''] - Main CSS class.
   * @throws {TypeError} If any attribute is of the wrong type.
   */
  constructor({
    list,
    value = '#000000',
    name,
    autocomplete,
    alpha,
    readonly = false,
    required = false,
    placeholder,
    colorspace,
    tags = [],
    mainClass = '',
  } = {}) {
    super({ type: 'color', name, placeholder, tags, mainClass });

    // Assign attributes via setters to ensure validation
    if (value !== undefined) this.value = value;
    if (alpha !== undefined) this.alpha = alpha;
    if (list !== undefined) this.list = list;
    if (autocomplete !== undefined) this.autocomplete = autocomplete;
    if (colorspace !== undefined) this.colorspace = colorspace;
    this.readonly = readonly;
    this.required = required;
  }

  /** @param {string} value */
  set value(value) {
    if (typeof value !== 'string' && typeof value !== 'number')
      throw new TypeError('TinyHtmlColorInput: "value" must be a string.');
    this.setAttr('value', String(value));
    this.setVal(String(value));
  }

  /** @returns {string|null} */
  get value() {
    return this.valTxt();
  }

  /** @param {number} alpha */
  set alpha(alpha) {
    if (typeof alpha !== 'string' && typeof alpha !== 'number')
      throw new TypeError('TinyHtmlColorInput: "alpha" must be a number.');
    this.setAttr('alpha', String(alpha));
  }

  /** @returns {number|null} */
  get alpha() {
    const value = this.attrString('alpha');
    return typeof value === 'string' ? parseFloat(value) : value;
  }

  /** @param {string} list */
  set list(list) {
    if (typeof list !== 'string')
      throw new TypeError('TinyHtmlColorInput: "list" must be a string (datalist id).');
    this.setAttr('list', list);
  }

  /** @returns {string|null} */
  get list() {
    return this.attrString('list');
  }

  /** @param {string} autocomplete */
  set autocomplete(autocomplete) {
    if (typeof autocomplete !== 'string')
      throw new TypeError('TinyHtmlColorInput: "autocomplete" must be a string.');
    this.setAttr('autocomplete', autocomplete);
  }

  /** @returns {string|null} */
  get autocomplete() {
    return this.attrString('autocomplete');
  }

  /** @param {string} colorspace */
  set colorspace(colorspace) {
    if (typeof colorspace !== 'string')
      throw new TypeError('TinyHtmlColorInput: "colorspace" must be a string (e.g., "sRGB").');
    this.setAttr('colorspace', colorspace);
  }

  /** @returns {string|null} */
  get colorspace() {
    return this.attrString('colorspace');
  }
}

export default TinyHtmlColorInput;
