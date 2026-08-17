import TinyHtmlInput from '../../TinyHtmlInput.mjs';

/**
 * TinyHtmlSubmitInput is a helper class for managing
 * <input type="submit"> elements with validation and attribute/property handling.
 *
 * @example
 * const submitBtn = new TinyHtmlSubmitInput({
 *   value: 'Send',
 *   formaction: '/submit',
 *   formenctype: 'multipart/form-data',
 *   formmethod: 'post',
 *   formnovalidate: true,
 *   formtarget: '_blank'
 * });
 */
class TinyHtmlSubmitInput extends TinyHtmlInput {
  /**
   * Creates a new TinyHtmlSubmitInput instance.
   * @param {Object} config - Configuration object.
   * @param {string} [config.value] - Initial value (button label).
   * @param {string} [config.name] - Name of the input control.
   * @param {string} [config.placeholder] - Placeholder text (not common for submit inputs).
   * @param {'application/x-www-form-urlencoded'|'multipart/form-data'|'text/plain'} [config.formenctype] - Form encoding type.
   * @param {'get'|'post'|'dialog'} [config.formmethod] - Submission method.
   * @param {boolean} [config.formnovalidate=false] - Whether to bypass form validation.
   * @param {'_self'|'_blank'|'_parent'|'_top'|string} [config.formtarget] - Target browsing context for submission.
   * @param {string} [config.formaction] - URL to which the form is submitted.
   * @param {boolean} [config.readonly=false] - Whether the input is read-only.
   * @param {boolean} [config.required=false] - Whether the input is required.
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=''] - Main CSS class.
   * @throws {TypeError} If any attribute is of the wrong type.
   */
  constructor({
    formenctype,
    formmethod,
    formnovalidate = false,
    formtarget,
    formaction,
    readonly = false,
    required = false,
    value,
    tags = [],
    name,
    placeholder,
    mainClass = '',
  } = {}) {
    super({ name, placeholder, type: 'submit', tags, mainClass, readonly, required });

    if (value !== undefined) this.value = value;
    if (formaction !== undefined) this.formaction = formaction;
    if (formenctype !== undefined) this.formenctype = formenctype;
    if (formmethod !== undefined) this.formmethod = formmethod;
    this.formnovalidate = formnovalidate;
    if (formtarget !== undefined) this.formtarget = formtarget;
  }

  /** @param {string} value */
  set value(value) {
    if (typeof value !== 'string' && typeof value !== 'number')
      throw new TypeError('TinyHtmlSubmitInput: "value" must be a string or number.');
    this.setAttr('value', value);
    this.setVal(value);
  }

  /** @returns {string|null} */
  get value() {
    return this.valTxt();
  }

  /** @param {string} formaction */
  set formaction(formaction) {
    if (typeof formaction !== 'string')
      throw new TypeError('TinyHtmlSubmitInput: "formaction" must be a string.');
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
        `TinyHtmlSubmitInput: "formenctype" must be one of ${allowed.join(', ')}.`,
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
      throw new TypeError(
        `TinyHtmlSubmitInput: "formmethod" must be one of ${allowed.join(', ')}.`,
      );
    this.setAttr('formmethod', formmethod);
  }

  /** @returns {string|null} */
  get formmethod() {
    return this.attrString('formmethod');
  }

  /** @param {boolean} formnovalidate */
  set formnovalidate(formnovalidate) {
    if (typeof formnovalidate !== 'boolean')
      throw new TypeError('TinyHtmlSubmitInput: "formnovalidate" must be a boolean.');
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
      throw new TypeError('TinyHtmlSubmitInput: "formtarget" must be a string.');
    this.setAttr('formtarget', formtarget);
  }

  /** @returns {string|null} */
  get formtarget() {
    return this.attrString('formtarget');
  }
}

export default TinyHtmlSubmitInput;
