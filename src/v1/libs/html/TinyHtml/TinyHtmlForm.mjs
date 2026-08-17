import TinyHtmlTemplate from './TinyHtmlTemplate.mjs';

/**
 * TinyHtmlForm is a helper for creating and managing <form> elements
 * with full attribute support and validation.
 *
 * @example
 * const form = new TinyHtmlForm({
 *   action: '/submit',
 *   method: 'post',
 *   enctype: 'multipart/form-data',
 *   autocomplete: 'on',
 *   novalidate: true,
 *   target: '_blank',
 *   tags: ['form', 'signup'],
 *   mainClass: 'primary-form'
 * });
 *
 * @extends TinyHtmlTemplate<HTMLFormElement>
 */
class TinyHtmlForm extends TinyHtmlTemplate {
  /**
   * Creates a new TinyHtmlForm instance.
   *
   * The constructor accepts a single `config` object with named options to
   * configure the created `<form>` element. Validation is performed for each
   * option and a `TypeError` is thrown when an invalid type or value is
   * provided. Deprecated attributes are accepted but will emit a console.warn.
   *
   * @param {Object} [config={}] - Configuration object.
   * @param {string} [config.action=""] - The URL that processes the form submission.
   *   If omitted the form will submit to the current document URL.
   * @param {'get'|'post'|'dialog'} [config.method='get'] - The HTTP method to submit the form with.
   *   - `get` (default): form data appended to the action URL.
   *   - `post`: form data sent in request body; `enctype` is relevant.
   *   - `dialog`: when the form is inside a `<dialog>`, closes the dialog and fires a submit event without sending data.
   * @param {'application/x-www-form-urlencoded'|'multipart/form-data'|'text/plain'} [config.enctype]
   *   The encoding type for form submission (only used when method is `post`).
   * @param {string} [config.acceptCharset] - The character encoding accepted by the server (e.g. "UTF-8").
   *   The specification recommends "UTF-8".
   * @param {'none'|'off'|'sentences'|'on'|'words'|'characters'} [config.autocapitalize]
   *   Controls automatic capitalization for text inputs inside the form.
   * @param {'on'|'off'} [config.autocomplete] - Hint to the browser whether autofill is allowed for controls in the form.
   * @param {string} [config.name] - The form name. Must be a non-empty string when provided.
   * @param {string} [config.rel] - Space-separated relationship tokens describing the form's link semantics.
   * @param {boolean} [config.novalidate=false] - When true, disables built-in form validation on submit.
   * @param {string} [config.target] - Target browsing context for the response.
   *   Can be one of `_self`, `_blank`, `_parent`, `_top`, `_unfencedTop` or a valid browsing context name
   *   (pattern: starts with a letter/underscore, then alphanumeric/`-`/`_`).
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes to apply to the form element.
   * @param {string} [config.mainClass=''] - Main CSS class to append to the element.
   *
   * @throws {TypeError} If `action` is provided and is not a string.
   * @throws {TypeError} If `method` is not one of 'get', 'post' or 'dialog'.
   * @throws {TypeError} If `enctype` is provided and is not one of the allowed encodings.
   * @throws {TypeError} If `acceptCharset` is provided and is not a string.
   * @throws {TypeError} If `autocapitalize` is provided and is not one of the allowed tokens.
   * @throws {TypeError} If `autocomplete` is provided and is not 'on' or 'off'.
   * @throws {TypeError} If `name` is provided and is not a non-empty string.
   * @throws {TypeError} If `rel` is provided and is not a string.
   * @throws {TypeError} If `novalidate` is not a boolean.
   * @throws {TypeError} If `target` is not a valid target keyword or a valid browsing context name.
   */
  constructor({
    action = '',
    method = 'get',
    enctype,
    acceptCharset,
    autocapitalize,
    autocomplete,
    name,
    rel,
    novalidate = false,
    target,
    tags = [],
    mainClass = '',
  } = {}) {
    super(document.createElement('form'), tags, mainClass);

    // action
    this.action = action;
    // method
    this.method = method;
    // enctype
    if (enctype !== undefined) this.enctype = enctype;
    // accept-charset
    if (acceptCharset !== undefined) this.acceptCharset = acceptCharset;
    // autocapitalize
    if (autocapitalize !== undefined) this.autocapitalize = autocapitalize;
    // autocomplete
    if (autocomplete !== undefined) this.autocomplete = autocomplete;
    // name
    if (name !== undefined) this.name = name;
    // rel
    if (rel !== undefined) this.rel = rel;
    // novalidate
    this.novalidate = novalidate;
    // target
    if (target !== undefined) this.target = target;
  }

  /** @param {string} action */
  set action(action) {
    if (typeof action !== 'string') throw new TypeError('TinyForm: "action" must be a string.');
    if (action) this.setAttr('action', action);
  }
  /** @returns {string|null} */
  get action() {
    return this.attrString('action');
  }

  /** @param {'get'|'post'|'dialog'} method */
  set method(method) {
    if (typeof method !== 'string') throw new TypeError('TinyForm: "method" must be a string.');
    const valid = ['get', 'post', 'dialog'];
    const norm = method.toLowerCase();
    if (!valid.includes(norm))
      throw new TypeError(`TinyForm: "method" must be one of ${valid.join(', ')}.`);
    this.setAttr('method', norm);
  }
  /** @returns {string|null} */
  get method() {
    return this.attrString('method');
  }

  /** @param {'application/x-www-form-urlencoded'|'multipart/form-data'|'text/plain'} enctype */
  set enctype(enctype) {
    const valid = ['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'];
    if (!valid.includes(enctype))
      throw new TypeError(`TinyForm: "enctype" must be one of ${valid.join(', ')}.`);
    this.setAttr('enctype', enctype);
  }
  /** @returns {string|null} */
  get enctype() {
    return this.attrString('enctype');
  }

  /** @param {string} charset */
  set acceptCharset(charset) {
    if (typeof charset !== 'string')
      throw new TypeError('TinyForm: "acceptCharset" must be a string.');
    if (charset.toUpperCase() !== 'UTF-8')
      console.warn('TinyForm: Only "UTF-8" is recommended for accept-charset.');
    this.setAttr('accept-charset', charset);
  }
  /** @returns {string|null} */
  get acceptCharset() {
    return this.attrString('accept-charset');
  }

  /** @param {'none'|'off'|'sentences'|'on'|'words'|'characters'} value */
  set autocapitalize(value) {
    const valid = ['none', 'off', 'sentences', 'on', 'words', 'characters'];
    if (!valid.includes(value))
      throw new TypeError(`TinyForm: "autocapitalize" must be one of ${valid.join(', ')}.`);
    this.setAttr('autocapitalize', value);
  }
  /** @returns {string|null} */
  get autocapitalize() {
    return this.attrString('autocapitalize');
  }

  /** @param {'on'|'off'} value */
  set autocomplete(value) {
    if (!['on', 'off'].includes(value))
      throw new TypeError('TinyForm: "autocomplete" must be "on" or "off".');
    this.setAttr('autocomplete', value);
  }
  /** @returns {string|null} */
  get autocomplete() {
    return this.attrString('autocomplete');
  }

  /** @param {string} name */
  set name(name) {
    if (typeof name !== 'string') throw new TypeError('TinyForm: "name" must be a string.');
    if (name.trim() === '') throw new TypeError('TinyForm: "name" cannot be empty.');
    this.setAttr('name', name);
  }
  /** @returns {string|null} */
  get name() {
    return this.attrString('name');
  }

  /** @param {string} rel */
  set rel(rel) {
    if (typeof rel !== 'string') throw new TypeError('TinyForm: "rel" must be a string.');
    this.setAttr('rel', rel);
  }
  /** @returns {string|null} */
  get rel() {
    return this.attrString('rel');
  }

  /** @param {boolean} novalidate */
  set novalidate(novalidate) {
    if (typeof novalidate !== 'boolean')
      throw new TypeError('TinyForm: "novalidate" must be a boolean.');
    if (novalidate) this.addProp('novalidate');
    else this.removeProp('novalidate');
  }
  /** @returns {boolean} */
  get novalidate() {
    return this.hasProp('novalidate');
  }

  /** @param {string} target */
  set target(target) {
    if (typeof target !== 'string') throw new TypeError('TinyForm: "target" must be a string.');
    const validTargets = ['_self', '_blank', '_parent', '_top', '_unfencedTop'];
    const validName = /^[a-zA-Z_][\w-]*$/;
    if (!validTargets.includes(target) && !validName.test(target))
      throw new TypeError(
        `TinyForm: "target" must be a valid context name or one of ${validTargets.join(', ')}.`,
      );
    this.setAttr('target', target);
  }
  /** @returns {string|null} */
  get target() {
    return this.attrString('target');
  }

  /**
   * Programmatically submits the form.
   * @returns {this}
   */
  submit() {
    this.el.submit();
    return this;
  }

  /**
   * Resets the form.
   * @returns {this}
   */
  reset() {
    this.el.reset();
    return this;
  }
}

export default TinyHtmlForm;
