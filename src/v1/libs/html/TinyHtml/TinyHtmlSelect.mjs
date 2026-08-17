import TinyHtml from '../TinyHtml.mjs';
import TinyHtmlTemplate from './TinyHtmlTemplate.mjs';

/**
 * TinyHtmlSelect is a helper class for managing <select> elements.
 * It supports all standard attributes (multiple, autocomplete, autofocus, disabled, etc.)
 * and provides helpers for managing <option> elements.
 *
 * @example
 * const select = new TinyHtmlSelect({
 *   options: [
 *     { value: '1', label: 'One' },
 *     { value: '2', label: 'Two', selected: true }
 *   ],
 *   multiple: true,
 *   required: true,
 *   size: 5,
 *   name: 'numbers',
 * });
 *
 * @extends TinyHtmlTemplate<HTMLSelectElement>
 */
class TinyHtmlSelect extends TinyHtmlTemplate {
  /**
   * Creates a new custom <select> element with configurable options and attributes.
   *
   * @param {Object} [config={}] Configuration object for the select element.
   * @param {Array<{
   *   value: string,
   *   label: string | Element | TinyHtml<any>,
   *   selected?: boolean,
   *   allowHtml?: boolean
   * }>} [config.options=[]]
   *   An array of option definitions. Each option must provide a `value` and a `label`.
   *   The `label` can be a string, a DOM element, or a TinyHtml instance.
   *   The `selected` flag sets the option as initially selected.
   *   If `allowHtml` is true, the label will be interpreted as HTML instead of plain text.
   *
   * @param {boolean} [config.multiple=false]
   *   If true, allows selecting multiple options.
   *
   * @param {string} [config.autocomplete]
   *   Provides autocomplete hints for the control.
   *   Possible values include `"on"` or `"off"`.
   *
   * @param {boolean} [config.autofocus=false]
   *   If true, the element will automatically receive focus when the page loads.
   *
   * @param {boolean} [config.disabled=false]
   *   If true, disables the select element so it cannot be interacted with.
   *
   * @param {string} [config.form]
   *   Associates the select element with the `id` of a form element.
   *
   * @param {string} [config.name]
   *   The name of the select control, used when submitting forms.
   *
   * @param {boolean} [config.required=false]
   *   If true, the control must be selected before submitting the form.
   *
   * @param {number} [config.size]
   *   Defines the number of visible options in the dropdown (without scrolling).
   *
   * @param {string | string[] | Set<string>} [config.tags=[]]
   *   A set of tags or CSS classes that can be used for styling or categorization.
   *
   * @param {string} [config.mainClass='']
   *   A primary CSS class name to be applied to the select element.
   */
  constructor({
    options = [],
    multiple = false,
    autocomplete,
    autofocus = false,
    disabled = false,
    form,
    name,
    required = false,
    size,
    tags = [],
    mainClass = '',
  } = {}) {
    super(document.createElement('select'), tags, mainClass);

    this.multiple = multiple;
    if (autocomplete !== undefined) this.autocomplete = autocomplete;
    this.autofocus = autofocus;
    this.disabled = disabled;
    if (form !== undefined) this.form = form;
    if (name !== undefined) this.name = name;
    this.required = required;
    if (size !== undefined) this.sizeEl = size;

    for (const opt of options) {
      this.addOption(opt);
    }
  }

  /** @param {boolean} multiple */
  set multiple(multiple) {
    if (typeof multiple !== 'boolean') throw new TypeError('"multiple" must be a boolean.');
    if (multiple) this.addProp('multiple');
    else this.removeProp('multiple');
  }

  /** @returns {boolean} */
  get multiple() {
    return this.hasProp('multiple');
  }

  /** @param {string} autocomplete */
  set autocomplete(autocomplete) {
    if (typeof autocomplete !== 'string') throw new TypeError('"autocomplete" must be a string.');
    this.setAttr('autocomplete', autocomplete);
  }

  /** @returns {string|null} */
  get autocomplete() {
    return this.attrString('autocomplete');
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
    if (typeof form !== 'string') throw new TypeError('"form" must be a string (form id).');
    this.setAttr('form', form);
  }

  /** @returns {string|null} */
  get form() {
    return this.attrString('form');
  }

  /** @param {string} name */
  set name(name) {
    if (typeof name !== 'string') throw new TypeError('"name" must be a string.');
    this.setAttr('name', name);
  }

  /** @returns {string|null} */
  get name() {
    return this.attrString('name');
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

  /** @param {number} size */
  set sizeEl(size) {
    if (!Number.isInteger(size) || size < 0)
      throw new TypeError('"size" must be a non-negative integer.');
    this.setAttr('size', size);
  }

  /** @returns {number|null} */
  get sizeEl() {
    return this.attrNumber('size');
  }

  /**
   * Adds an option element.
   * @param {{ value: string, label: string|Element|TinyHtml<any>, selected?: boolean, allowHtml?: boolean }} option
   * @returns {this}
   */
  addOption({ value, label, allowHtml = false, selected = false }) {
    if (typeof value !== 'string') throw new TypeError('"value" must be a string.');
    if (typeof selected !== 'boolean') throw new TypeError('"selected" must be a boolean.');

    const opt = new TinyHtml(document.createElement('option'));
    opt.setAttr('value', value);

    if (typeof label === 'string') {
      if (!allowHtml) opt.setText(label);
      else opt.setHtml(label);
    } else if (label instanceof Element || label instanceof TinyHtml) {
      if (!allowHtml)
        throw new Error('addOption: Passing an Element/TinyHtml requires allowHtml=true.');
      opt.append(label);
    } else {
      throw new TypeError('"label" must be a string, Element, or TinyHtml instance.');
    }

    if (selected) opt.addProp('selected');
    this.append(opt);
    return this;
  }

  /** @returns {string} */
  get value() {
    if (this.multiple)
      throw new Error('TinyHtmlSelect.value: Use "values" getter for multiple selects.');
    return this.valTxt();
  }

  /** @param {string} val */
  set value(val) {
    if (this.multiple)
      throw new Error('TinyHtmlSelect.value: Use "values" setter for multiple selects.');
    if (typeof val !== 'string') throw new TypeError('"value" must be a string.');
    this.setValue(val);
  }

  /** @returns {string[]} */
  get values() {
    if (!this.multiple)
      throw new Error('TinyHtmlSelect.values: Use "value" getter for single select.');
    return Array.from(this.prop('selectedOptions')).map((o) => o.value);
  }

  /** @param {string[]} vals */
  set values(vals) {
    if (!this.multiple)
      throw new Error('TinyHtmlSelect.values: Use "value" setter for single select.');
    if (!Array.isArray(vals) || !vals.every((v) => typeof v === 'string'))
      throw new TypeError('"values" must be an array of strings.');
    this.setValue(vals);
  }

  /**
   * Internal: apply selection to options.
   * @param {string|string[]} value
   * @returns {this}
   */
  setValue(value) {
    const values = Array.isArray(value) ? value : [value];
    for (const opt of this.prop('options')) {
      opt.selected = values.includes(opt.value);
    }
    return this;
  }
}

export default TinyHtmlSelect;
