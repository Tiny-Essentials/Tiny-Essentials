/**
 * @typedef {Object} DiffResult
 * @property {string} value
 * @property {"normal"|"added"|"deleted"} type
 */

/**
 * A utility class to store a history of text strings and compute the differences
 * between any two versions, generating a detailed diff output.
 */
class TinyTextDiffer {
  /** @type {string[]} */
  #history = [];

  /** @type {boolean} */
  #destroyed = false;

  /**
   * Retrieves a shallow copy of the current history array.
   * @returns {string[]}
   */
  get history() {
    return [...this.#history];
  }

  /**
   * Overwrites the current history array, ensuring all elements are valid strings.
   * @param {string[]} history
   */
  set history(history) {
    if (!Array.isArray(history)) {
      throw new TypeError('History data must be provided as an array.');
    }
    if (!history.every((item) => typeof item === 'string')) {
      throw new TypeError('All items in the history array must be strings.');
    }
    /** @type {string[]} */
    this.#history = [...history];
  }

  /**
   * Gets the total number of versions currently stored in the history.
   * @returns {number}
   */
  get size() {
    return this.#history.length;
  }

  /**
   * Initializes a new instance of TinyTextDiffer.
   * @param {string[]} [history=[]]
   */
  constructor(history = []) {
    this.history = history;
  }

  /**
   * @throws {Error}
   * @returns {void}
   */
  #checkDestroyed() {
    if (this.#destroyed) {
      throw new Error('Cannot perform operations on a destroyed TinyTextDiffer instance.');
    }
  }

  /**
   * @param {any} index
   * @throws {TypeError}
   * @returns {void}
   */
  #checkIndex(index) {
    if (typeof index !== 'number') {
      throw new TypeError('The provided index must be a valid number.');
    }
  }

  /**
   * @param {any} text
   * @throws {TypeError}
   * @returns {void}
   */
  #checkText(text) {
    if (typeof text !== 'string') {
      throw new TypeError('The provided text must be a valid string.');
    }
  }

  /**
   * Retrieves the text string at the specified index.
   * @param {number} index
   * @returns {string}
   */
  get(index) {
    this.#checkDestroyed();
    this.#checkIndex(index);
    if (typeof this.#history[index] === 'undefined') {
      throw new Error(`No text version found at index ${index}.`);
    }
    return this.#history[index];
  }

  /**
   * Checks if a text string exists at the specified index.
   * @param {number} index
   * @returns {boolean}
   */
  has(index) {
    this.#checkDestroyed();
    this.#checkIndex(index);
    return typeof this.#history[index] !== 'undefined';
  }

  /**
   * Appends a new text string to the end of the history.
   * @param {string} text
   * @returns {void}
   */
  add(text) {
    this.#checkDestroyed();
    this.#checkText(text);
    this.#history.push(text);
  }

  /**
   * Removes and returns the last text string from the history.
   * @returns {string | undefined}
   */
  remove() {
    this.#checkDestroyed();
    return this.#history.pop();
  }

  /**
   * Inserts a text string at the specified index position.
   * @param {number} index
   * @param {string} text
   * @returns {void}
   */
  addAt(index, text) {
    this.#checkDestroyed();
    this.#checkIndex(index);
    this.#checkText(text);
    this.#history.splice(index, 0, text);
  }

  /**
   * Removes the text string at the specified index position.
   * @param {number} index
   * @returns {boolean}
   */
  removeAt(index) {
    this.#checkDestroyed();
    this.#checkIndex(index);
    const oldSize = this.#history.length;
    this.#history.splice(index, 1);
    const newSize = this.#history.length;
    return oldSize !== newSize;
  }

  /**
   * Empties the entire history.
   * @returns {void}
   */
  clear() {
    this.#checkDestroyed();
    this.#history = [];
  }

  /**
   * Compares two text strings from the history based on their indices
   * and returns an array representing the differences.
   * @param {number} index1
   * @param {number} index2
   * @returns {DiffResult[]}
   */
  compare(index1, index2) {
    this.#checkDestroyed();

    if (index1 === undefined || index2 === undefined) {
      throw new Error('Both index1 and index2 are required to perform a comparison.');
    }

    if (this.#history[index1] === undefined || this.#history[index2] === undefined) {
      throw new Error('One or both of the provided indices are out of bounds.');
    }

    /** @type {string} */
    const str1 = this.#history[index1];
    /** @type {string} */
    const str2 = this.#history[index2];

    return this._computeDiff(str1, str2);
  }

  /**
   * Computes the Longest Common Subsequence (LCS) to generate the diff result.
   * @private
   * @param {string} str1
   * @param {string} str2
   * @returns {DiffResult[]}
   */
  _computeDiff(str1, str2) {
    /** @type {number} */
    const len1 = str1.length;
    /** @type {number} */
    const len2 = str2.length;

    /** @type {number[][]} */
    const matrix = Array(len1 + 1)
      .fill(null)
      .map(() => Array(len2 + 1).fill(0));

    /** @type {number} */
    let i = 1;
    /** @type {number} */
    let j = 1;

    for (i = 1; i <= len1; i++) {
      for (j = 1; j <= len2; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1] + 1;
        } else {
          matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
        }
      }
    }

    i = len1;
    j = len2;

    /** @type {DiffResult[]} */
    const result = [];

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && str1[i - 1] === str2[j - 1]) {
        result.unshift({ value: str1[i - 1], type: 'normal' });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
        result.unshift({ value: str2[j - 1], type: 'added' });
        j--;
      } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
        result.unshift({ value: str1[i - 1], type: 'deleted' });
        i--;
      }
    }

    return result.reduce((/** @type {DiffResult[]} */ acc, /** @type {DiffResult} */ curr) => {
      /** @type {number} */
      const lastIndex = acc.length - 1;

      if (acc.length > 0 && acc[lastIndex].type === curr.type) {
        acc[lastIndex].value += curr.value;
      } else {
        acc.push(curr);
      }
      return acc;
    }, []);
  }

  /**
   * Cleans up internal references and marks the instance as destroyed to prevent memory leaks.
   * @returns {void}
   */
  destroy() {
    if (this.#destroyed) return;
    this.#history = [];
    this.#destroyed = true;
  }
}

export default TinyTextDiffer;
