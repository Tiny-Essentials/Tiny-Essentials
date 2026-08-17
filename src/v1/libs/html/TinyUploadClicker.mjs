import { isJsonObject } from '../../basics/objChecker.mjs';

/**
 * @typedef {Object} UploaderConfig
 *
 * @property {string | HTMLElement | Array<string | HTMLElement>} triggers -
 *    Single or multiple elements (or selectors) that will act as upload triggers.
 *
 * @property {boolean} [multiple=false] -
 *    Whether to allow selection of multiple files.
 *
 * @property {string|string[]} [accept=""] -
 *    A comma-separated list of accepted file types (e.g., ".png,.jpg" or "image/*").
 *
 * @property {Record<string, string>} [inputAttributes={}] -
 *    Additional attributes to apply to the created `<input type="file">`.
 *
 * @property {Partial<CSSStyleDeclaration>} [inputStyles={ display: 'none' }] -
 *    Inline CSS styles to apply to the hidden input. Default hides the element.
 *
 * @property {((triggerElement: HTMLElement) => void)|null} [onClick=null] -
 *    Callback executed when a trigger is clicked (before the file dialog opens).
 *
 * @property {((files: FileList, triggerElement: HTMLElement) => void)|null} [onFileLoad=null] -
 *    Callback executed when files are selected through the file input.
 */

/**
 * TinyUploadClicker is a lightweight utility class for attaching custom clickable elements
 * (like buttons, divs, icons, etc.) that trigger hidden file input elements.
 *
 * It provides full control over the input file element without needing to display it,
 * and allows per-trigger customization, style injection, and event handling.
 *
 * Each trigger element creates its own associated hidden file input, enabling multiple
 * upload zones with different behaviors. You can handle `onClick` and `onFileLoad` callbacks,
 * define accepted file types, allow multiple selections, and cleanly destroy everything via `destroy()`.
 *
 * Designed for maximum flexibility in pure JavaScript environments, including dynamic UI rendering.
 *
 * @example
 * const uploader = new TinyUploadClicker({
 *   triggers: '#uploadBtn',
 *   accept: ['.png', '.jpg'],
 *   multiple: true,
 *   inputAttributes: { 'data-tracker': 'upload' },
 *   inputStyles: { display: 'none' },
 *   onClick: (el) => console.log('Trigger clicked:', el),
 *   onFileLoad: (files, el) => console.log('Files selected:', files)
 * });
 *
 * // Later, if needed:
 * uploader.destroy();
 */
class TinyUploadClicker {
  /**
   * Tracks whether the instance has been destroyed.
   * @type {boolean}
   */
  #destroyed = false;

  /**
   * Gets the current destruction status of the instance.
   *
   * @returns {boolean} True if the instance is destroyed, false otherwise.
   */
  get destroyed() {
    return this.#destroyed;
  }

  /** @type {UploaderConfig} */
  #config;

  /** @type {Array<HTMLElement|Element|null>} */
  #triggerElements = [];

  /** @type {WeakMap<HTMLElement, HTMLInputElement>} */
  #inputs = new WeakMap();

  /** @type {(ev: MouseEvent) => void} */
  #boundClick;

  /**
   * Creates a new instance of TinyUploadClicker.
   *
   * @param {UploaderConfig} options - Configuration object for customizing the uploader behavior and appearance.
   * @throws {TypeError} If the config is invalid or required options are missing.
   */
  constructor(options) {
    if (!isJsonObject(options))
      throw new TypeError('TinyUploadClicker: "options" must be a valid object.');

    this.#config = {
      multiple: false,
      accept: '',
      inputAttributes: {},
      inputStyles: { display: 'none' },
      onClick: null,
      onFileLoad: null,
      ...options,
    };

    const { triggers } = options;

    if (
      !Array.isArray(triggers) &&
      typeof triggers !== 'string' &&
      !(triggers instanceof HTMLElement)
    )
      throw new TypeError(
        'TinyUploadClicker: "triggers" is required and must be a string, HTMLElement, or an array of them.',
      );

    const triggerList = Array.isArray(this.#config.triggers)
      ? this.#config.triggers
      : [this.#config.triggers];

    const resolvedTriggers = triggerList.map((ref) => {
      if (typeof ref === 'string') {
        const el = document.querySelector(ref);
        if (!el) {
          throw new Error(`TinyUploadClicker: No element found for selector "${ref}".`);
        }
        return el;
      }

      if (!(ref instanceof HTMLElement))
        throw new TypeError(
          'TinyUploadClicker: All triggers must be either strings (selectors) or HTMLElements.',
        );
      return ref;
    });

    // Validate optional values
    if (
      options.accept !== undefined &&
      typeof options.accept !== 'string' &&
      !Array.isArray(options.accept)
    )
      throw new TypeError('TinyUploadClicker: "accept" must be a string or an array of strings.');

    if (
      options.onClick !== undefined &&
      typeof options.onClick !== 'function' &&
      options.onClick !== null
    )
      throw new TypeError('TinyUploadClicker: "onClick" must be a function or null.');

    if (
      options.onFileLoad !== undefined &&
      typeof options.onFileLoad !== 'function' &&
      options.onFileLoad !== null
    )
      throw new TypeError('TinyUploadClicker: "onFileLoad" must be a function or null.');

    if (options.inputAttributes !== undefined && !isJsonObject(options.inputAttributes))
      throw new TypeError('TinyUploadClicker: "inputAttributes" must be an object.');

    if (options.inputStyles !== undefined && !isJsonObject(options.inputStyles))
      throw new TypeError('TinyUploadClicker: "inputStyles" must be an object.');

    this.#boundClick = this.#handleClick.bind(this);
    this.#triggerElements = resolvedTriggers;

    this.#triggerElements.forEach((trigger) => {
      if (!(trigger instanceof HTMLElement)) return;
      const input = document.createElement('input');
      input.type = 'file';
      if (this.#config.multiple) input.multiple = true;
      if (typeof this.#config.accept === 'string') input.accept = this.#config.accept;
      else if (Array.isArray(this.#config.accept)) input.accept = this.#config.accept.join(',');

      // Apply attributes
      const attr = this.#config.inputAttributes;
      if (attr && typeof attr === 'object') {
        for (const [key, value] of Object.entries(attr)) {
          input.setAttribute(key, value);
        }
      }

      // Apply styles
      Object.assign(input.style, this.#config.inputStyles || { display: 'none' });

      // Listen for file changes
      input.addEventListener('change', () => {
        if (input.files && typeof this.#config.onFileLoad === 'function')
          this.#config.onFileLoad(input.files, trigger);

        input.value = ''; // reset so same file can be reselected
      });

      document.body.appendChild(input);
      this.#inputs.set(trigger, input);

      trigger.addEventListener('click', this.#boundClick);
    });
  }

  /**
   * Handles the click on a trigger element and forwards it to the associated file input.
   *
   * @param {MouseEvent} event - The click event object.
   */
  #handleClick(event) {
    const trigger = event.currentTarget;
    if (!(trigger instanceof HTMLElement)) return;
    const input = this.#inputs.get(trigger);
    if (!input) return;

    if (typeof this.#config.onClick === 'function') this.#config.onClick(trigger);

    input.click();
  }

  /**
   * Cleans up all internal elements and event listeners, removing created inputs and breaking references.
   */
  destroy() {
    if (this.destroyed) return;
    for (const trigger of this.#triggerElements) {
      if (!(trigger instanceof HTMLElement)) return;
      trigger.removeEventListener('click', this.#boundClick);

      const input = this.#inputs.get(trigger);
      if (input && input.parentNode) input.remove();

      this.#inputs.delete(trigger);
    }

    this.#triggerElements = [];

    // Lock the instance
    this.#destroyed = true;
  }
}

export default TinyUploadClicker;
