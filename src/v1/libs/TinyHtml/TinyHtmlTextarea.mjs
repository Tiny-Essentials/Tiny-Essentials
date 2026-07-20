import TinyHtmlTemplate from './TinyHtmlTemplate.mjs';

/**
 * TinyTextarea is a helper class for managing <textarea> elements.
 * It allows configuring all standard attributes such as rows, cols, placeholder,
 * autocomplete, spellcheck, and more, with validation.
 *
 * @example
 * const textarea = new TinyHtmlTextarea({
 *   rows: 5,
 *   placeholder: 'Write here...',
 *   required: true,
 *   maxlength: 200
 * });
 *
 * @extends TinyHtmlTemplate<HTMLTextAreaElement>
 */
class TinyHtmlTextarea extends TinyHtmlTemplate {
  /**
   * Creates a new TinyTextarea instance.
   * @param {Object} config - Configuration object.
   * @param {string} [config.value=""] - Initial text inside the textarea.
   * @param {number} [config.rows] - Number of visible text lines.
   * @param {number} [config.cols] - Number of character columns.
   * @param {string} [config.placeholder] - Placeholder text.
   * @param {'none'|'sentences'|'words'|'characters'|'on'|'off'} [config.autocapitalize] - Controls automatic capitalization.
   * @param {string} [config.autocomplete] - Autocomplete behavior ("on", "off", or token list).
   * @param {boolean} [config.autocorrect] - Autocorrect behavior ("on" or "off").
   * @param {boolean} [config.autofocus=false] - Whether the textarea should autofocus on load.
   * @param {string} [config.dirname] - Directionality of submitted text.
   * @param {boolean} [config.disabled=false] - Whether the textarea is disabled.
   * @param {string} [config.form] - The id of the associated form.
   * @param {number} [config.maxlength] - Maximum length in UTF-16 code units.
   * @param {number} [config.minlength] - Minimum length in UTF-16 code units.
   * @param {string} [config.name] - The name of the control.
   * @param {boolean} [config.readonly=false] - Whether the textarea is read-only.
   * @param {boolean} [config.required=false] - Whether the textarea is required.
   * @param {boolean|"default"} [config.spellcheck] - Spellcheck behavior.
   * @param {"hard"|"soft"|"off"} [config.wrap] - Wrapping behavior.
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=''] - Main CSS class.
   * @throws {TypeError} If any attribute is of the wrong type.
   */
  constructor({
    value = '',
    rows,
    cols,
    placeholder,
    autocapitalize,
    autocomplete,
    autocorrect,
    autofocus = false,
    dirname,
    disabled = false,
    form,
    maxlength,
    minlength,
    name,
    readonly = false,
    required = false,
    spellcheck,
    wrap,
    tags = [],
    mainClass = '',
  } = {}) {
    super(document.createElement('textarea'), tags, mainClass);

    // value
    this.value = value;
    // rows
    if (rows !== undefined) this.rows = rows;
    // cols
    if (cols !== undefined) this.cols = cols;
    // placeholder
    if (placeholder !== undefined) this.placeholder = placeholder;
    // autocapitalize
    if (autocapitalize !== undefined) this.autocapitalize = autocapitalize;
    // autocomplete
    if (autocomplete !== undefined) this.autocomplete = autocomplete;
    // autocorrect
    if (autocorrect !== undefined) this.autocorrect = autocorrect;
    // autofocus
    this.autofocus = autofocus;
    // dirname
    if (dirname !== undefined) this.dirname = dirname;
    // disabled
    this.disabled = disabled;
    // form
    if (form !== undefined) this.form = form;
    // maxlength
    if (maxlength !== undefined) this.maxlength = maxlength;
    // minlength
    if (minlength !== undefined) this.minlength = minlength;
    // name
    if (name !== undefined) this.name = name;
    // --- readonly ---
    this.readonly = readonly;
    // --- required ---
    this.required = required;
    // spellcheck
    if (spellcheck !== undefined) this.spellcheck = spellcheck;
    // wrap
    if (wrap !== undefined) this.wrap = wrap;
  }

  /** @param {string} value */
  set value(value) {
    if (typeof value !== 'string') throw new TypeError('TinyTextarea: "value" must be a string.');
    this.setVal(value);
  }

  /** @returns {string} */
  get value() {
    return this.valTxt();
  }

  /** @param {number} rows */
  set rows(rows) {
    if (!Number.isInteger(rows) || rows < 1)
      throw new TypeError('TinyTextarea: "rows" must be a positive integer.');
    this.setAttr('rows', rows);
  }

  /** @returns {number|null} */
  get rows() {
    return this.attrNumber('rows');
  }

  /** @param {number} cols */
  set cols(cols) {
    if (!Number.isInteger(cols) || cols < 1)
      throw new TypeError('TinyTextarea: "cols" must be a positive integer.');
    this.setAttr('cols', cols);
  }

  /** @returns {number|null} */
  get cols() {
    return this.attrNumber('cols');
  }

  /** @param {string} placeholder */
  set placeholder(placeholder) {
    if (typeof placeholder !== 'string')
      throw new TypeError('TinyTextarea: "placeholder" must be a string.');
    this.setAttr('placeholder', placeholder);
  }

  /** @returns {string|null} */
  get placeholder() {
    return this.attrString('placeholder');
  }

  /** @param {'none'|'sentences'|'words'|'characters'|'on'|'off'} autocapitalize */
  set autocapitalize(autocapitalize) {
    const valid = ['none', 'sentences', 'words', 'characters', 'on', 'off'];
    if (!valid.includes(autocapitalize))
      throw new TypeError(`TinyTextarea: "autocapitalize" must be one of ${valid.join(', ')}.`);
    this.setAttr('autocapitalize', autocapitalize);
  }

  /** @returns {string|null} */
  get autocapitalize() {
    return this.attrString('autocapitalize');
  }

  /** @param {string} autocomplete */
  set autocomplete(autocomplete) {
    if (typeof autocomplete !== 'string')
      throw new TypeError('TinyTextarea: "autocomplete" must be a string.');
    this.setAttr('autocomplete', autocomplete);
  }

  /** @returns {string|null} */
  get autocomplete() {
    return this.attrString('autocomplete');
  }

  /** @param {boolean} autocorrect */
  set autocorrect(autocorrect) {
    if (typeof autocorrect !== 'boolean')
      throw new TypeError('TinyTextarea: "autocorrect" must be "true" or "false".');
    this.setAttr('autocorrect', autocorrect ? 'on' : 'off');
    return;
  }

  /** @returns {boolean|null} */
  get autocorrect() {
    const autocorrect = this.attrString('autocorrect');
    if (autocorrect === 'on') return true;
    else if (autocorrect === 'off') return false;
    return null;
  }

  /** @param {boolean} autofocus */
  set autofocus(autofocus) {
    if (typeof autofocus !== 'boolean') throw new TypeError('"autofocus" must be a boolean.');
    if (autofocus) this.addProp('autofocus');
    else this.removeProp('autofocus');
  }

  /** @returns {boolean} */
  get autofocus() {
    return this.hasProp('autofocus');
  }

  /** @param {string} dirname */
  set dirname(dirname) {
    if (typeof dirname !== 'string')
      throw new TypeError('TinyTextarea: "dirname" must be a string.');
    this.setAttr('dirname', dirname);
  }

  /** @returns {string|null} */
  get dirname() {
    return this.attrString('dirname');
  }

  /** @param {boolean} disabled */
  set disabled(disabled) {
    if (typeof disabled !== 'boolean') throw new TypeError('"disabled" must be a boolean.');
    if (disabled) this.addProp('disabled');
    else this.removeProp('disabled');
  }

  /** @returns {boolean} */
  get disabled() {
    return this.hasProp('disabled');
  }

  /** @param {string} form */
  set form(form) {
    if (typeof form !== 'string') throw new TypeError('TinyTextarea: "form" must be a string.');
    this.setAttr('form', form);
  }

  /** @returns {string|null} */
  get form() {
    return this.attrString('form');
  }

  /** @param {number} maxlength */
  set maxlength(maxlength) {
    if (!Number.isInteger(maxlength) || maxlength < 1)
      throw new TypeError('TinyTextarea: "maxlength" must be a positive integer.');
    this.setAttr('maxlength', maxlength);
  }

  /** @returns {number|null} */
  get maxlength() {
    return this.attrNumber('maxlength');
  }

  /** @param {number} minlength */
  set minlength(minlength) {
    if (!Number.isInteger(minlength) || minlength < 0)
      throw new TypeError('TinyTextarea: "minlength" must be a non-negative integer.');
    this.setAttr('minlength', minlength);
  }

  /** @returns {number|null} */
  get minlength() {
    return this.attrNumber('minlength');
  }

  /** @param {string} name */
  set name(name) {
    if (typeof name !== 'string') throw new TypeError('TinyTextarea: "name" must be a string.');
    this.setAttr('name', name);
  }

  /** @returns {string|null} */
  get name() {
    return this.attrString('name');
  }

  /** @param {boolean} readonly */
  set readonly(readonly) {
    if (typeof readonly !== 'boolean') throw new TypeError('"readonly" must be a boolean.');
    if (readonly) this.addProp('readonly');
    else this.removeProp('readonly');
  }

  /** @returns {boolean} */
  get readonly() {
    return this.hasProp('readonly');
  }

  /** @param {boolean} required */
  set required(required) {
    if (typeof required !== 'boolean') throw new TypeError('"required" must be a boolean.');
    if (required) this.addProp('required');
    else this.removeProp('required');
  }

  /** @returns {boolean} */
  get required() {
    return this.hasProp('required');
  }

  /** @param {boolean|'default'} spellcheck */
  set spellcheck(spellcheck) {
    if (![true, false, 'default'].includes(spellcheck))
      throw new TypeError('TinyTextarea: "spellcheck" must be "true", "false" or "default".');
    this.setAttr('spellcheck', typeof spellcheck === 'boolean' ? String(spellcheck) : spellcheck);
  }

  /** @returns {boolean|'default'|null} */
  get spellcheck() {
    const value = this.attrString('spellcheck');
    if (typeof value === 'boolean' || value === 'default') return value;
    return null;
  }

  /** @param {'hard'|'soft'|'off'} wrap */
  set wrap(wrap) {
    const valid = ['hard', 'soft', 'off'];
    if (!valid.includes(wrap))
      throw new TypeError(`TinyTextarea: "wrap" must be one of ${valid.join(', ')}.`);
    this.setAttr('wrap', wrap);
  }

  /** @returns {string|null} */
  get wrap() {
    return this.attrString('wrap');
  }
}

export default TinyHtmlTextarea;
