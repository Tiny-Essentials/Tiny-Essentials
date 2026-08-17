/**
 * Utility class to handle clipboard operations for text and blob data.
 * Supports modern Clipboard API, custom platform, and legacy execCommand fallback.
 */
class TinyClipboard {
  /**
   * Indicates whether the legacy `document.execCommand()` API is available.
   * Used as a fallback for clipboard operations when modern APIs are not supported.
   *
   * @type {boolean}
   */
  #existExecCommand = false;

  /**
   * Indicates whether the modern Clipboard API (`navigator.clipboard`) is available.
   *
   * @type {boolean}
   */
  #existNavigator = false;

  /**
   * Function used to copy plain text to the clipboard.
   * Can be overridden using `setCopyText()`.
   *
   * @type {((text: string) => Promise<void>) | null}
   */
  #copyText = null;

  /**
   * Function used to copy a Blob (binary data) to the clipboard.
   * Can be overridden using `setCopyBlob()`.
   *
   * @type {((blob: Blob) => Promise<void>) | null}
   */
  #copyBlob = null;

  /**
   * Constructs a new TinyClipboard instance.
   * Automatically detects and configures available clipboard APIs.
   */
  constructor() {
    // Whether the Clipboard API is available.
    if (typeof navigator.clipboard !== 'undefined' && navigator.clipboard !== null) {
      this.#existNavigator = true;
      this.#copyText = (text) => navigator.clipboard.writeText(text);
      this.#copyBlob = (blob) =>
        navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob,
          }),
        ]);
    }

    /**
     * @type {boolean}
     * Whether the legacy execCommand API is available.
     */
    this.#existExecCommand =
      typeof document.execCommand !== 'undefined' && document.execCommand !== null;
  }

  /**
   * Override the default text copy behavior.
   * This allows you to provide your own clipboard implementation or
   * integrate with external systems like Capacitor or Electron.
   *
   * @param {(text: string) => Promise<void>} callback - The function to use for copying text.
   * @throws {TypeError} If the callback is not a function.
   */
  setCopyText(callback) {
    if (typeof callback !== 'function')
      throw new TypeError('setCopyText expected a function that returns Promise<void>.');
    this.#copyText = callback;
  }

  /**
   * Override the default blob copy behavior.
   * This allows you to provide a custom clipboard handling method for blob data.
   *
   * @param {(blob: Blob) => Promise<void>} callback - The function to use for copying blob data.
   * @throws {TypeError} If the callback is not a function.
   */
  setCopyBlob(callback) {
    if (typeof callback !== 'function')
      throw new TypeError('setCopyBlob expected a function that returns Promise<void>.');
    this.#copyBlob = callback;
  }

  /**
   * Copy a plain text string to the clipboard.
   * Uses modern or legacy fallback.
   *
   * @param {string} text - The text string to be copied.
   * @returns {Promise<void>} A promise resolving when the text is copied or boolean for legacy.
   */
  copyText(text) {
    if (typeof text !== 'string') throw new TypeError('copyText expected a string.');
    // Clipboard API
    if (this.#copyText) return this.#copyText(text);
    // Classic API
    else if (this.#existExecCommand) {
      const host = document.body;
      const copyInput = document.createElement('input');
      copyInput.style.position = 'fixed';
      copyInput.style.opacity = '0';
      copyInput.value = text;
      host.append(copyInput);

      copyInput.select();
      copyInput.setSelectionRange(0, 99999);
      document.execCommand('Copy');
      copyInput.remove();
      return new Promise((resolve) => resolve(undefined));
    }
    throw new Error('Clipboard API not found!');
  }

  /**
   * Copy a Blob (binary data) to the clipboard.
   *
   * @param {Blob} blob - The blob object to copy.
   * @returns {Promise<void>} A promise that resolves when the blob is copied or null on fallback.
   */
  copyBlob(blob) {
    if (!(blob instanceof Blob)) throw new TypeError('copyBlob expected a Blob instance.');
    return new Promise((resolve, reject) => {
      if (this.#copyBlob) {
        return this.#copyBlob(blob).then(resolve).catch(reject);
      }
      throw new Error('Clipboard API not found!');
    });
  }

  /**
   * Internal: Handle getting blob data from a clipboard item.
   *
   * @private
   * @param {string} type - The MIME type to fetch.
   * @param {ClipboardItem} clipboardItem - Clipboard item instance.
   * @returns {Promise<Blob>} A promise that resolves with the Blob.
   */
  _handleBlob(type, clipboardItem) {
    return clipboardItem.getType(type);
  }

  /**
   * Internal: Handle getting plain text from a clipboard item.
   *
   * @private
   * @param {string} type - The MIME type (should be 'text/plain').
   * @param {ClipboardItem} clipboardItem - Clipboard item instance.
   * @returns {Promise<string>} A promise that resolves with the text content.
   */
  _handleText(type, clipboardItem) {
    return this._handleBlob(type, clipboardItem).then((blob) => blob.text());
  }

  /**
   * Read clipboard data based on filters like type, mime, index.
   *
   * @param {number|null} [index=0] - Item index or null for all.
   * @param {'text'|'custom'|null} [type=null] - Data type to filter.
   * @param {string|null} [mimeFormat=null] - MIME type or prefix.
   * @param {boolean} [fixValue=false] - If true, exact match on MIME type.
   * @returns {Promise<Blob|string|Array<Blob|string>|null>} A promise resolving with matching data.
   * @private
   */
  _readData(index = 0, type = null, mimeFormat = null, fixValue = false) {
    return new Promise((resolve, reject) => {
      this._read(index)
        .then((items) => {
          if (!items) return resolve(null);
          /** @type {Array<Blob|string>} */
          const finalResult = [];

          // Complete task
          let continueLoop = true;

          /**
           * @param {string} mimeType
           * @param {ClipboardItem} item
           */
          const completeTask = async (mimeType, item) => {
            if (!continueLoop) return;
            // Custom
            if (
              (type === null || type === 'custom') &&
              typeof mimeFormat === 'string' &&
              ((!fixValue && mimeType.startsWith(mimeFormat)) ||
                (fixValue && mimeType === mimeFormat))
            ) {
              continueLoop = false;
              const result = await this._handleBlob(mimeType, item);
              if (result) finalResult.push(result);
            }

            // Text
            else if ((type === null || type === 'text') && mimeType === 'text/plain') {
              continueLoop = false;
              const result = await this._handleText(mimeType, item);
              if (result) finalResult.push(result);
            }

            // Blob
            else if (type === null) {
              continueLoop = false;
              const result = await this._handleBlob(mimeType, item);
              if (result) finalResult.push(result);
            }
          };

          /** @type {Promise<void>[]} */
          const promises = [];

          /**
           * Read Item
           * @param {ClipboardItem | ClipboardItems} item
           */
          const readItem = (item) => {
            if (!(item instanceof ClipboardItem))
              throw new Error('Expected ClipboardItem when reading data.');
            for (const tIndex in item.types) promises.push(completeTask(item.types[tIndex], item));
          };

          // Specific Item
          if (
            typeof index === 'number' &&
            !Number.isNaN(index) &&
            Number.isFinite(index) &&
            index > -1
          ) {
            readItem(items);
            Promise.all(promises)
              .then(() => {
                if (finalResult[0]) resolve(finalResult[0]);
                else resolve(null);
              })
              .catch(reject);
          }

          // All
          else if (Array.isArray(items)) {
            for (const tIndex in items) readItem(items[tIndex]);
            Promise.all(promises)
              .then(() => resolve(finalResult))
              .catch(reject);
          }
        })
        // Fail
        .catch(reject);
    });
  }

  /**
   * Read plain text from the clipboard (single item by index).
   *
   * @param {number} [index=0] - The index of the clipboard item to read.
   * @returns {Promise<string|null>} A promise that resolves to the clipboard text or null.
   */
  async readText(index = 0) {
    const value = await this._readData(index, 'text');
    if (typeof value !== 'string') throw new Error('Failed to read text: expected string result.');
    return value;
  }

  /**
   * Read custom clipboard data based on MIME type from a specific index.
   *
   * @param {string|null} [mimeFormat=null] - MIME prefix to match (e.g., "image/").
   * @param {boolean} [fixValue=false] - If true, matches exact MIME instead of prefix.
   * @param {number} [index=0] - Clipboard item index.
   * @returns {Promise<Blob|null>} A promise resolving with a blob or null.
   */
  async readCustom(mimeFormat = null, fixValue = false, index = 0) {
    const value = await this._readData(index, 'custom', mimeFormat, fixValue);
    if (!(value instanceof Blob)) throw new Error('Failed to read custom data: expected Blob.');
    return value;
  }

  /**
   * Read all available plain text entries from the clipboard.
   *
   * @returns {Promise<string[]>} A promise resolving to an array of strings or null.
   */
  async readAllTexts() {
    const values = await this._readData(null, 'text');
    if (!Array.isArray(values))
      throw new Error('Expected array of strings when reading all texts.');
    if (!values.every((value) => typeof value === 'string'))
      throw new Error('Some values returned were not strings.');
    return values;
  }

  /**
   * Read all clipboard data matching a specific custom MIME type.
   *
   * @param {string|null} [mimeFormat=null] - MIME prefix or exact type.
   * @param {boolean} [fixValue=false] - Match prefix or exact MIME.
   * @returns {Promise<Blob[]>} A promise resolving with array of Blobs or null.
   */
  async readAllCustom(mimeFormat = null, fixValue = false) {
    const values = await this._readData(null, 'custom', mimeFormat, fixValue);
    if (!Array.isArray(values))
      throw new Error('Expected array of blobs when reading all custom items.');
    if (!values.every((value) => value instanceof Blob))
      throw new Error('Some values returned were not Blob instances.');
    return values;
  }

  /**
   * Read all clipboard data as Blob or text depending on type.
   *
   * @param {'text'|'custom'|null} [type=null] - The type of data to retrieve.
   * @param {string|null} [mimeFormat=null] - The MIME type or prefix to match.
   * @returns {Promise<Array<Blob|string>>} A promise resolving with matching data array.
   */
  async readAllData(type = null, mimeFormat = null) {
    const value = await this._readData(null, type, mimeFormat);
    if (!Array.isArray(value)) throw new Error('Expected array result when reading all data.');
    return value;
  }

  /**
   * Read clipboard data at a specific index or all if null.
   *
   * @param {number|null} index - Index of the item to retrieve or null to get all.
   * @returns {Promise<ClipboardItem|ClipboardItems|null>} A promise resolving with a clipboard item or array of items.
   * @private
   */
  _read(index) {
    return new Promise((resolve, reject) => {
      if (!this.#existNavigator) reject(new Error('Clipboard API not found!'));
      navigator.clipboard
        .read()
        .then((items) => {
          // Index is number
          if (typeof index === 'number') {
            if (Number.isNaN(index) || !Number.isFinite(index) || index < 0)
              throw new Error(`Invalid index value: ${index}`);
            if (items[index]) resolve(items[index]);
            // Not found
            else resolve(null);
          }
          // Get All
          resolve(items);
        })
        .catch(reject);
    });
  }

  /**
   * Read clipboard data at a specific index.
   *
   * @param {number} index - Index of the item to retrieve
   * @returns {Promise<ClipboardItem|null>} A promise resolving with a clipboard item.
   */
  async readIndex(index) {
    const value = await this._read(index);
    if (value !== null && !(value instanceof ClipboardItem))
      throw new Error(`Value at index ${index} is not a ClipboardItem.`);
    return value;
  }

  /**
   * Read all clipboard content without any filters.
   *
   * @returns {Promise<ClipboardItems>} A promise resolving with all clipboard items.
   */
  async readAll() {
    const value = await this._read(null);
    if (!Array.isArray(value)) throw new Error('Expected array result from clipboard read.');
    for (const item of value) {
      if (!(item instanceof ClipboardItem))
        throw new Error('Invalid item type found in clipboard result.');
    }
    return value;
  }

  /**
   * Returns whether the legacy `document.execCommand()` API is available.
   * This can be used to determine if a fallback clipboard method is usable.
   *
   * @returns {boolean} True if `document.execCommand` is available.
   */
  isExecCommandAvailable() {
    return this.#existExecCommand;
  }

  /**
   * Returns whether the modern Clipboard API (`navigator.clipboard`) is available.
   * Useful to know if full clipboard features can be accessed.
   *
   * @returns {boolean} True if `navigator.clipboard` is available.
   */
  isNavigatorClipboardAvailable() {
    return this.#existNavigator;
  }

  /**
   * Returns the function used to copy plain text to the clipboard.
   * This function may be built-in or set manually via `setCopyText`.
   *
   * @returns {((text: string) => Promise<void>) | null} The current text copy function or null if unavailable.
   */
  getCopyTextFunc() {
    return this.#copyText;
  }

  /**
   * Returns the function used to copy Blob (binary data) to the clipboard.
   * This function may be built-in or set manually via `setCopyBlob`.
   *
   * @returns {((blob: Blob) => Promise<void>) | null} The current blob copy function or null if unavailable.
   */
  getCopyBlobFunc() {
    return this.#copyBlob;
  }
}

export default TinyClipboard;
