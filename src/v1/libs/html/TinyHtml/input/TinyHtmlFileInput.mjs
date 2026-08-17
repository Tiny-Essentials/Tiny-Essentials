import TinyHtmlInput from '../TinyHtmlInput.mjs';

/**
 * TinyHtmlFileInput is a helper class for managing <input type="file"> elements.
 * It allows configuring attributes such as `accept`, `multiple`, `capture`,
 * `readonly`, and `required` with validation, while exposing a safe getter for files.
 *
 * @example
 * const fileInput = new TinyHtmlFileInput({
 *   accept: '.png,.jpg',
 *   multiple: true,
 *   required: true
 * });
 *
 * document.body.appendChild(fileInput.el);
 *
 * @extends TinyHtmlInput
 */
class TinyHtmlFileInput extends TinyHtmlInput {
  /**
   * Creates a new TinyHtmlFileInput instance.
   * @param {Object} config - Configuration object.
   * @param {string} [config.name] - The name of the input control.
   * @param {string} [config.placeholder] - Placeholder text (not widely supported for file inputs).
   * @param {string|boolean} [config.capture] - Capture mode ("user", "environment", or `true`).
   * @param {boolean} [config.multiple=false] - Whether multiple files can be selected.
   * @param {string} [config.accept] - Accepted file types (e.g., ".jpg,.png" or "image/*").
   * @param {boolean} [config.readonly=false] - Whether the input is read-only.
   * @param {boolean} [config.required=false] - Whether the input is required.
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=''] - Main CSS class.
   * @throws {TypeError} If any attribute is of the wrong type.
   */
  constructor({
    name,
    capture,
    multiple = false,
    accept,
    placeholder,
    readonly = false,
    required = false,
    tags = [],
    mainClass = '',
  } = {}) {
    super({ type: 'file', name, placeholder, tags, mainClass, readonly, required });

    // --- multiple ---
    this.multiple = multiple;

    // --- accept ---
    if (accept !== undefined) this.accept = accept;

    // --- capture ---
    if (capture !== undefined) this.capture = capture;
  }

  /** @param {boolean} multiple */
  set multiple(multiple) {
    if (typeof multiple !== 'boolean')
      throw new TypeError('TinyHtmlFileInput: "multiple" must be a boolean.');
    if (multiple) this.addProp('multiple');
    else this.removeProp('multiple');
  }

  /** @returns {boolean} */
  get multiple() {
    return this.hasProp('multiple');
  }

  /** @param {string} accept */
  set accept(accept) {
    if (typeof accept !== 'string')
      throw new TypeError('TinyHtmlFileInput: "accept" must be a string.');
    this.setAttr('accept', accept);
  }

  /** @returns {string|null} */
  get accept() {
    return this.attrString('accept');
  }

  /** @param {string|boolean} capture */
  set capture(capture) {
    if (typeof capture !== 'string' && typeof capture !== 'boolean')
      throw new TypeError('TinyHtmlFileInput: "capture" must be a string or boolean.');
    this.setAttr('capture', capture);
  }

  /** @returns {string|boolean|null} */
  get capture() {
    const val = this.attrString('capture');
    if (val === null) return null;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }

  /**
   * Gets the list of selected files.
   * @returns {FileList|null}
   */
  get files() {
    return this.el.files;
  }
}

export default TinyHtmlFileInput;
