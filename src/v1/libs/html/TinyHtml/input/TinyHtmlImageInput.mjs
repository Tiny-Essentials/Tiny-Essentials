import TinyHtmlInput from '../TinyHtmlInput.mjs';

/**
 * TinyHtmlImageInput is a helper class for managing <input type="image"> elements.
 * It supports validation and configuration of attributes such as alt, list, form actions,
 * form behaviors, and size constraints.
 *
 * @example
 * const imageInput = new TinyHtmlImageInput({
 *   name: 'submitImage',
 *   alt: 'Submit',
 *   formaction: '/submit',
 *   height: 40,
 *   width: 100,
 *   required: true
 * });
 */
class TinyHtmlImageInput extends TinyHtmlInput {
  /**
   * Creates a new TinyHtmlImageInput instance.
   * @param {Object} config - Configuration object.
   * @param {string} [config.name] - The name of the input.
   * @param {string} [config.placeholder] - Placeholder text.
   * @param {'application/x-www-form-urlencoded'|'multipart/form-data'|'text/plain'} [config.formenctype] - Encoding type.
   * @param {'get'|'post'|'dialog'} [config.formmethod] - Submission method.
   * @param {boolean} [config.formnovalidate=false] - Whether to bypass form validation.
   * @param {string} [config.formtarget] - Where to display the response.
   * @param {string} [config.autocomplete] - Autocomplete hint (e.g., "on", "off", "email").
   * @param {string} [config.alt] - Alternative text for the image input.
   * @param {string} [config.formaction] - URL to submit the form.
   * @param {number} [config.height] - Height in CSS pixels.
   * @param {number} [config.width] - Width in CSS pixels.
   * @param {string} [config.list] - ID of a <datalist>.
   * @param {string} [config.src] - Image source URL (**required**).
   * @param {boolean} [config.readonly=false] - Whether the input is read-only.
   * @param {boolean} [config.required=false] - Whether the input is required.
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=''] - Main CSS class.
   * @throws {TypeError} If any attribute has an invalid type or value.
   */
  constructor({
    list,
    formenctype,
    formmethod,
    formnovalidate = false,
    height,
    width,
    formtarget,
    formaction,
    placeholder,
    name,
    readonly = false,
    required = false,
    alt,
    autocomplete,
    src,
    tags = [],
    mainClass = '',
  } = {}) {
    super({ type: 'image', name, placeholder, tags, mainClass, readonly, required });
    if (src !== undefined) this.src = src;
    if (alt !== undefined) this.alt = alt;
    if (list !== undefined) this.list = list;
    if (formaction !== undefined) this.formaction = formaction;
    if (formenctype !== undefined) this.formenctype = formenctype;
    if (formmethod !== undefined) this.formmethod = formmethod;
    this.formnovalidate = formnovalidate;
    if (formtarget !== undefined) this.formtarget = formtarget;
    if (height !== undefined) this.height = height;
    if (width !== undefined) this.width = width;
    if (autocomplete !== undefined) this.autocomplete = autocomplete;
  }

  /** @param {string} value */
  set src(value) {
    if (typeof value !== 'string')
      throw new TypeError('TinyHtmlImageInput: "src" must be a string.');
    this.setAttr('src', value);
  }

  /** @returns {string|null} */
  get src() {
    return this.attrString('src');
  }

  /** @param {string} alt */
  set alt(alt) {
    if (typeof alt !== 'string') throw new TypeError('TinyHtmlImageInput: "alt" must be a string.');
    this.setAttr('alt', alt);
  }
  /** @returns {string|null} */
  get alt() {
    return this.attrString('alt');
  }

  /** @param {string} list */
  set list(list) {
    if (typeof list !== 'string')
      throw new TypeError('TinyHtmlImageInput: "list" must be a string (datalist id).');
    this.setAttr('list', list);
  }
  /** @returns {string|null} */
  get list() {
    return this.attrString('list');
  }

  /** @param {string} formaction */
  set formaction(formaction) {
    if (typeof formaction !== 'string')
      throw new TypeError('TinyHtmlImageInput: "formaction" must be a string.');
    this.setAttr('formaction', formaction);
  }
  /** @returns {string|null} */
  get formaction() {
    return this.attrString('formaction');
  }

  /** @param {'application/x-www-form-urlencoded'|'multipart/form-data'|'text/plain'} formenctype */
  set formenctype(formenctype) {
    const allowed = ['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'];
    if (!allowed.includes(formenctype))
      throw new TypeError(
        `TinyHtmlImageInput: "formenctype" must be one of ${allowed.join(', ')}.`,
      );
    this.setAttr('formenctype', formenctype);
  }
  /** @returns {string|null} */
  get formenctype() {
    return this.attrString('formenctype');
  }

  /** @param {'get'|'post'|'dialog'} formmethod */
  set formmethod(formmethod) {
    const allowed = ['get', 'post', 'dialog'];
    if (!allowed.includes(formmethod))
      throw new TypeError(`TinyHtmlImageInput: "formmethod" must be one of ${allowed.join(', ')}.`);
    this.setAttr('formmethod', formmethod);
  }
  /** @returns {string|null} */
  get formmethod() {
    return this.attrString('formmethod');
  }

  /** @param {boolean} formnovalidate */
  set formnovalidate(formnovalidate) {
    if (typeof formnovalidate !== 'boolean')
      throw new TypeError('TinyHtmlImageInput: "formnovalidate" must be a boolean.');
    if (formnovalidate) this.addProp('formnovalidate');
    else this.removeProp('formnovalidate');
  }
  /** @returns {boolean} */
  get formnovalidate() {
    return this.hasProp('formnovalidate');
  }

  /** @param {string} formtarget */
  set formtarget(formtarget) {
    if (typeof formtarget !== 'string')
      throw new TypeError('TinyHtmlImageInput: "formtarget" must be a string.');
    this.setAttr('formtarget', formtarget);
  }
  /** @returns {string|null} */
  get formtarget() {
    return this.attrString('formtarget');
  }

  /** @param {string} autocomplete */
  set autocomplete(autocomplete) {
    if (typeof autocomplete !== 'string')
      throw new TypeError('TinyHtmlImageInput: "autocomplete" must be a string.');
    this.setAttr('autocomplete', autocomplete);
  }
  /** @returns {string|null} */
  get autocomplete() {
    return this.attrString('autocomplete');
  }
}

export default TinyHtmlImageInput;
