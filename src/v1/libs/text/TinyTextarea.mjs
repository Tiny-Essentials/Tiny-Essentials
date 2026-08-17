/**
 * @typedef {Object} OnInputInfo
 * @property {number} breakLines - Total number of `\n` line breaks in the textarea value.
 * @property {number} height - Final calculated height (in pixels) applied to the textarea.
 * @property {number} scrollHeight - Internal scrollHeight before limiting.
 * @property {number} maxHeight - Maximum allowed height before scrolling is forced.
 * @property {number} lineHeight - Height of one line of text, computed from CSS.
 * @property {number} maxRows - Maximum number of visible rows allowed.
 * @property {number} rows - Effective number of visual rows being used.
 */

/**
 * A lightweight utility class that automatically adjusts the height of a `<textarea>`
 * element based on its content. It prevents scrollbars by expanding vertically as needed,
 * up to a configurable maximum number of visible rows.
 *
 * Features:
 * - Automatically resizes the textarea as the user types
 * - Prevents vertical scrollbars until a maximum row limit is reached
 * - Supports additional height padding
 * - Provides real-time callbacks for input and resize events
 * - Allows manual refresh and cleanup of behavior
 *
 * Ideal for chat inputs, note editors, or any form where dynamic space usage
 * is preferred without relying on scrollbars too early.
 *
 * @class
 * @beta
 */
class TinyTextarea {
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

  #lineHeight;
  #maxRows;
  #extraHeight;

  #lastKnownHeight = 0;
  #lastKnownRows = 0;

  /** @type {HTMLTextAreaElement} */
  #textarea;

  /**
   * @type {((info: OnInputInfo) => void) | null}
   */
  #onResize = null;

  /**
   * @type {((info: OnInputInfo) => void) | null}
   */
  #onInput = null;

  /**
   * Returns the computed line height in pixels.
   * @returns {number}
   */
  get lineHeight() {
    return this.#lineHeight;
  }

  /**
   * Returns the maximum number of rows allowed.
   * @returns {number}
   */
  get maxRows() {
    return this.#maxRows - 1;
  }

  /**
   * Returns the additional height added to the textarea.
   * @returns {number}
   */
  get extraHeight() {
    return this.#extraHeight;
  }

  /**
   * Returns the most recently applied height.
   * @returns {number}
   */
  get currentHeight() {
    return this.#lastKnownHeight;
  }

  /**
   * Returns the most recently calculated row count.
   * @returns {number}
   */
  get currentRows() {
    return this.#lastKnownRows;
  }

  /**
   * Returns the original textarea element managed by this instance.
   * @returns {HTMLTextAreaElement}
   */
  get textarea() {
    return this.#textarea;
  }

  /**
   * Creates a new TinyTextarea instance.
   *
   * @param {HTMLTextAreaElement} textarea - The `<textarea>` element to enhance.
   * @param {Object} [options={}] - Optional configuration parameters.
   * @param {number} [options.maxRows] - Maximum number of visible rows before scrolling.
   * @param {number} [options.extraHeight] - Additional pixels to add to final height.
   * @param {(info: OnInputInfo) => void} [options.onResize] - Callback when the number of rows changes.
   * @param {(info: OnInputInfo) => void} [options.onInput] - Callback on every input event.
   * @throws {Error} If `textarea` is not a valid `<textarea>` element.
   * @throws {TypeError} If provided options are of invalid types.
   */
  constructor(textarea, options = {}) {
    if (!(textarea instanceof HTMLTextAreaElement))
      throw new Error('TinyTextarea: Provided element is not a <textarea>.');
    if (typeof options !== 'object' || options === null)
      throw new TypeError('TinyTextarea: Options must be an object if provided.');
    if ('maxRows' in options && typeof options.maxRows !== 'number')
      throw new TypeError('TinyTextarea: `maxRows` must be a number.');
    if ('extraHeight' in options && typeof options.extraHeight !== 'number')
      throw new TypeError('TinyTextarea: `extraHeight` must be a number.');
    if ('onResize' in options && typeof options.onResize !== 'function')
      throw new TypeError('TinyTextarea: `onResize` must be a function.');
    if ('onInput' in options && typeof options.onInput !== 'function')
      throw new TypeError('TinyTextarea: `onInput` must be a function.');

    this.#textarea = textarea;
    this.#maxRows = (options.maxRows ?? 5) + 1;
    this.#extraHeight = options.extraHeight ?? 0;
    this.#onResize = options.onResize ?? null;
    this.#onInput = options.onInput ?? null;

    this.#lineHeight = this.#getLineHeight();

    textarea.style.overflowY = 'hidden';
    textarea.style.resize = 'none';

    this._handleInput = () => this.#resize();
    textarea.addEventListener('input', this._handleInput);
    this.#resize();
  }

  /**
   * Automatically resize the textarea based on its content and notify listeners.
   * Triggers `onResize` if the number of rows has changed.
   * Always triggers `onInput`.
   */
  #resize() {
    this.#textarea.style.height = 'auto';

    const style = window.getComputedStyle(this.#textarea);
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const paddingBottom = parseFloat(style.paddingBottom) || 0;

    const breakLines = (this.#textarea.value.match(/\n/g) || []).length;
    const scrollHeight = this.#textarea.scrollHeight;
    const maxHeight = this.#lineHeight * this.#maxRows;
    const newHeight = Math.ceil(
      Math.min(scrollHeight, maxHeight) - paddingTop - paddingBottom + this.#extraHeight,
    );

    // const rows = Math.round(newHeight / this.#lineHeight);
    const maxRows = this.#maxRows - 1;
    const rows = breakLines < maxRows ? breakLines + 1 : maxRows;

    this.#textarea.style.height = `${newHeight}px`;
    this.#textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    this.#lastKnownHeight = newHeight;

    const info = {
      breakLines,
      rows,
      height: newHeight,
      scrollHeight,
      maxHeight,
      lineHeight: this.#lineHeight,
      maxRows,
    };

    if (rows !== this.#lastKnownRows) {
      this.#lastKnownRows = rows;
      if (typeof this.#onResize === 'function') {
        this.#onResize({ ...info });
      }
    }

    if (typeof this.#onInput === 'function') {
      this.#onInput(info);
    }
  }

  /**
   * Computes the current line height from the textarea's computed styles.
   * Falls back to `fontSize * 1.2` if lineHeight is not a number.
   * @returns {number} - The computed line height in pixels.
   */
  #getLineHeight() {
    const style = window.getComputedStyle(this.#textarea);
    const line = parseFloat(style.lineHeight);
    if (!Number.isNaN(line)) return line;
    return parseFloat(style.fontSize) * 1.2;
  }

  /**
   * Returns the latest height and row count of the textarea.
   * @returns {{ height: number, rows: number }} - Last known resize state.
   */
  getData() {
    return {
      rows: this.#lastKnownRows,
      height: this.#lastKnownHeight,
    };
  }

  /**
   * Manually trigger a resize check.
   */
  refresh() {
    this.#resize();
  }

  /**
   * Cleans up internal listeners and disables dynamic behavior.
   */
  destroy() {
    if (this.destroyed) return;
    this.#textarea.removeEventListener('input', this._handleInput);

    // Lock the instance
    this.#destroyed = true;
  }
}

export default TinyTextarea;
