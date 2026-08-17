import TinyHtml from '../TinyHtml.mjs';
import TinyHtmlTemplate from './TinyHtmlTemplate.mjs';

/**
 * TinyHtmlButton is a helper class for <button> elements with full attribute support and validation.
 * It extends TinyHtmlTemplate for direct DOM manipulation.
 *
 * Supported attributes:
 * - autofocus
 * - command, commandfor
 * - disabled
 * - form, formaction, formenctype, formmethod, formnovalidate, formtarget
 * - name
 * - popovertarget, popovertargetaction
 * - type (button|submit|reset)
 * - value
 *
 * @extends TinyHtmlTemplate<HTMLButtonElement>
 */
class TinyHtmlButton extends TinyHtmlTemplate {
  /**
   * Creates a new TinyHtmlButton instance.
   *
   * @param {Object} config - Configuration object for the button.
   * @param {string|Element|TinyHtml<any>} config.label - The text/HTML/element to place inside the button.
   *   If a non-string Element/TinyHtml is provided, `allowHtml` must be true.
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes to apply.
   * @param {boolean} [config.allowHtml=false] - Whether to allow HTML or DOM nodes as label.
   * @param {'button'|'submit'|'reset'} [config.type='button'] - Button type. Allowed values: "button", "submit", "reset".
   * @param {boolean} [config.autofocus=false] - Whether the button should autofocus on load.
   * @param {'show-modal'|'close'|'request-close'|'show-popover'|'hide-popover'|'toggle-popover'} [config.command] - Command action (built-ins: "show-modal","close","request-close","show-popover","hide-popover","toggle-popover")
   *   or a custom command which MUST start with `--` (two hyphens).
   * @param {string} [config.commandfor] - ID of the element controlled by the command. Must be a non-empty string.
   * @param {boolean} [config.disabled=false] - Whether the button is disabled.
   * @param {string} [config.form] - ID of the associated <form>. Must be a non-empty string if provided.
   * @param {string} [config.formaction] - URL that overrides the form action when this button is used to submit.
   * @param {'application/x-www-form-urlencoded'|'multipart/form-data'|'text/plain'} [config.formenctype]
   *   - Encoding type used when the button submits the form.
   * @param {'get'|'post'|'dialog'} [config.formmethod] - HTTP method used for this button submission.
   * @param {boolean} [config.formnovalidate=false] - If true, disables validation when this button submits.
   * @param {'_self'|'_blank'|'_parent'|'_top'|'_unfencedTop'} [config.formtarget] - Target browsing context for this button's submission (keywords or name).
   * @param {string} [config.name] - Button name (sent with value when submitting).
   * @param {string} [config.popovertarget] - ID of the popover to control (non-empty string).
   * @param {'show'|'hide'|'toggle'} [config.popovertargetaction] - Action for popovertarget.
   * @param {string} [config.value] - Value submitted with the form when this button is used.
   * @param {string} [config.mainClass=''] - Main CSS class to append to the element.
   *
   * @throws {TypeError} If `label` is not a string, Element, or TinyHtml instance.
   * @throws {Error} If an Element/TinyHtml `label` is passed but `allowHtml` is false.
   * @throws {TypeError} If `type` is not one of "button", "submit", "reset".
   * @throws {TypeError} If `allowHtml` is not a boolean.
   * @throws {TypeError} If `autofocus`, `disabled` or `formnovalidate` are not booleans.
   * @throws {TypeError} If `command` is not a valid builtin command nor a custom `--*` token.
   * @throws {TypeError} If `commandfor`, `form`, `formaction`, `name`, `popovertarget`, or `value` are not strings.
   * @throws {TypeError} If `formenctype` is not one of the allowed encodings.
   * @throws {TypeError} If `formmethod` is not one of 'get','post','dialog'.
   * @throws {TypeError} If `formtarget` is not a valid keyword or browsing context name.
   */
  constructor({
    label,
    tags = [],
    allowHtml = false,
    type = 'button',
    autofocus = false,
    command,
    commandfor,
    disabled = false,
    form,
    formaction,
    formenctype,
    formmethod,
    formnovalidate = false,
    formtarget,
    name,
    popovertarget,
    popovertargetaction,
    value,
    mainClass = '',
  }) {
    super(document.createElement('button'), tags, mainClass);

    if (label === undefined || label === null)
      throw new TypeError('TinyHtmlButton: "label" is required.');
    this.setLabel(label, allowHtml);

    this.type = type;
    this.autofocus = autofocus;
    this.disabled = disabled;
    this.formnovalidate = formnovalidate;

    if (command !== undefined) this.command = command;
    if (commandfor !== undefined) this.commandfor = commandfor;
    if (form !== undefined) this.form = form;
    if (formaction !== undefined) this.formaction = formaction;
    if (formenctype !== undefined) this.formenctype = formenctype;
    if (formmethod !== undefined) this.formmethod = formmethod;
    if (formtarget !== undefined) this.formtarget = formtarget;
    if (name !== undefined) this.name = name;
    if (popovertarget !== undefined) this.popovertarget = popovertarget;
    if (popovertargetaction !== undefined) this.popovertargetaction = popovertargetaction;
    if (value !== undefined) this.value = value;
  }

  /**
   * Updates the button label with text, HTML, or an element.
   *
   * @param {string|Element|TinyHtml<any>} label - The new label.
   * @param {boolean} [allowHtml=false] - Whether to allow raw HTML or DOM elements.
   * @returns {this}
   * @throws {TypeError} If the label is invalid.
   * @throws {Error} If DOM/HTML is passed but allowHtml=false.
   */
  setLabel(label, allowHtml = false) {
    if (typeof label === 'string') {
      if (!allowHtml) this.setText(label);
      else this.setHtml(label);
    } else if (label instanceof Element || label instanceof TinyHtml) {
      if (!allowHtml)
        throw new Error('setLabel: Passing an Element/TinyHtml requires allowHtml=true.');
      this.empty().append(label);
    } else {
      throw new TypeError("setLabel: 'label' must be a string, Element, or TinyHtml instance.");
    }
    return this;
  }

  // --- Getters & Setters ---

  /** @returns {string|null} */
  get type() {
    return this.attrString('type');
  }
  /** @param {'button'|'submit'|'reset'} val */
  set type(val) {
    const allowed = ['button', 'submit', 'reset'];
    if (typeof val !== 'string' || !allowed.includes(val))
      throw new TypeError(`TinyHtmlButton.type must be one of: ${allowed.join(', ')}`);
    this.setAttr('type', val);
  }

  /** @returns {boolean} */
  get disabled() {
    return this.hasProp('disabled');
  }
  /** @param {boolean} state */
  set disabled(state) {
    if (typeof state !== 'boolean') throw new TypeError('TinyHtmlButton.disabled must be boolean.');
    if (state) this.addProp('disabled');
    else this.removeProp('disabled');
  }

  /** @returns {boolean} */
  get autofocus() {
    return this.hasProp('autofocus');
  }
  /** @param {boolean} state */
  set autofocus(state) {
    if (typeof state !== 'boolean')
      throw new TypeError('TinyHtmlButton.autofocus must be boolean.');
    if (state) this.addProp('autofocus');
    else this.removeProp('autofocus');
  }

  /** @returns {boolean} */
  get formnovalidate() {
    return this.hasProp('formnovalidate');
  }
  /** @param {boolean} state */
  set formnovalidate(state) {
    if (typeof state !== 'boolean')
      throw new TypeError('TinyHtmlButton.formnovalidate must be boolean.');
    if (state) this.addProp('formnovalidate');
    else this.removeProp('formnovalidate');
  }

  /** @returns {string|null} */
  get command() {
    return this.attrString('command');
  }
  /** @param {'show-modal'|'close'|'request-close'|'show-popover'|'hide-popover'|'toggle-popover'} cmd */
  set command(cmd) {
    const builtins = [
      'show-modal',
      'close',
      'request-close',
      'show-popover',
      'hide-popover',
      'toggle-popover',
    ];
    if (typeof cmd !== 'string' || (!builtins.includes(cmd) && !cmd.startsWith('--')))
      throw new TypeError(
        'TinyHtmlButton.command must be a built-in or custom string starting with "--".',
      );
    this.setAttr('command', cmd);
  }

  /** @returns {string|null} */
  get commandfor() {
    return this.attrString('commandfor');
  }
  /** @param {string} val */
  set commandfor(val) {
    if (typeof val !== 'string' || !val.trim())
      throw new TypeError('TinyHtmlButton.commandfor must be a non-empty string.');
    this.setAttr('commandfor', val);
  }

  /** @returns {string|null} */
  get form() {
    return this.attrString('form');
  }
  /** @param {string} val */
  set form(val) {
    if (typeof val !== 'string' || !val.trim())
      throw new TypeError('TinyHtmlButton.form must be a non-empty string.');
    this.setAttr('form', val);
  }

  /** @returns {string|null} */
  get formaction() {
    return this.attrString('formaction');
  }
  /** @param {string} val */
  set formaction(val) {
    if (typeof val !== 'string' || !val.trim())
      throw new TypeError('TinyHtmlButton.formaction must be a non-empty string.');
    this.setAttr('formaction', val);
  }

  /** @returns {string|null} */
  get formenctype() {
    return this.attrString('formenctype');
  }
  /** @param {'application/x-www-form-urlencoded'|'multipart/form-data'|'text/plain'} val */
  set formenctype(val) {
    const valid = ['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'];
    if (!valid.includes(val))
      throw new TypeError(`TinyHtmlButton.formenctype must be one of: ${valid.join(', ')}`);
    this.setAttr('formenctype', val);
  }

  /** @returns {string|null} */
  get formmethod() {
    return this.attrString('formmethod');
  }
  /** @param {'get'|'post'|'dialog'} val */
  set formmethod(val) {
    const valid = ['get', 'post', 'dialog'];
    if (typeof val !== 'string' || !valid.includes(val.toLowerCase()))
      throw new TypeError(`TinyHtmlButton.formmethod must be one of: ${valid.join(', ')}`);
    this.setAttr('formmethod', val.toLowerCase());
  }

  /** @returns {string|null} */
  get formtarget() {
    return this.attrString('formtarget');
  }
  /** @param {'_self'|'_blank'|'_parent'|'_top'|'_unfencedTop'} val */
  set formtarget(val) {
    const validTargets = ['_self', '_blank', '_parent', '_top', '_unfencedTop'];
    const validName = /^[a-zA-Z_][\w-]*$/;
    if (typeof val !== 'string' || (!validTargets.includes(val) && !validName.test(val)))
      throw new TypeError(
        `TinyHtmlButton.formtarget must be a keyword (${validTargets.join(', ')}) or valid name.`,
      );
    this.setAttr('formtarget', val);
  }

  /** @returns {string|null} */
  get name() {
    return this.attr('name');
  }
  /** @param {string} val */
  set name(val) {
    if (typeof val !== 'string' || !val.trim())
      throw new TypeError('TinyHtmlButton.name must be a non-empty string.');
    this.setAttr('name', val);
  }

  /** @returns {string|null} */
  get popovertarget() {
    return this.attr('popovertarget');
  }
  /** @param {string} val */
  set popovertarget(val) {
    if (typeof val !== 'string' || !val.trim())
      throw new TypeError('TinyHtmlButton.popovertarget must be a non-empty string.');
    this.setAttr('popovertarget', val);
  }

  /** @returns {string|null} */
  get popovertargetaction() {
    return this.attrString('popovertargetaction');
  }
  /** @param {'show'|'hide'|'toggle'} val */
  set popovertargetaction(val) {
    const allowed = ['show', 'hide', 'toggle'];
    if (typeof val !== 'string' || !allowed.includes(val))
      throw new TypeError(
        `TinyHtmlButton.popovertargetaction must be one of: ${allowed.join(', ')}`,
      );
    this.setAttr('popovertargetaction', val);
  }

  /** @returns {string|null} */
  get value() {
    return this.valTxt();
  }
  set value(val) {
    if (typeof val !== 'string') throw new TypeError('TinyHtmlButton.value must be a string.');
    this.setAttr('value', val);
    this.setVal(val);
  }
}

export default TinyHtmlButton;
