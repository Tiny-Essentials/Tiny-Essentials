/**
 * Shared helpers for the Node.js test-suite.
 *
 * These utilities are intentionally dependency free so that every test file can
 * be executed in isolation (`node test/index.mjs <command>`) without pulling in
 * the whole test-runner.
 */

/** ANSI color palette used across the whole suite. */
export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

/**
 * Paints a string with a given ANSI color from {@link colors}.
 * @param {keyof typeof colors} color - The color name.
 * @param {string|number} text - The text to paint.
 * @returns {string}
 */
export const color = (color, text) => `${colors[color] ?? ''}${text}${colors.reset}`;

/**
 * Prints a section header.
 * @param {string} title - The section title.
 * @param {string} [emoji='🧪'] - An optional leading emoji.
 * @returns {void}
 */
export const section = (title, emoji = '🧪') => {
  console.log(`\n${color('bright', color('cyan', `${emoji}  ${title}`))}`);
  console.log(color('gray', '─'.repeat(50)));
};

/**
 * Prints a success message.
 * @param {string} text - The message.
 * @returns {void}
 */
export const success = (text) => console.log(`${color('green', '✅')} ${text}`);

/**
 * Prints an informational message.
 * @param {string} text - The message.
 * @returns {void}
 */
export const info = (text) => console.log(`${color('yellow', '🔎')} ${text}`);

/**
 * Prints a failure message.
 * @param {string} text - The message.
 * @returns {void}
 */
export const fail = (text) => console.error(`${color('red', '❌')} ${text}`);

/**
 * Minimal assertion helper that keeps track of the amount of executed checks.
 */
export class TestRunner {
  /** @type {number} */
  #passed = 0;
  /** @type {number} */
  #failed = 0;

  /**
   * @param {string} title - The name of the suite.
   */
  constructor(title) {
    this.title = title;
    console.log(`\n${color('bright', color('magenta', `===== ${title} =====`))}`);
  }

  /**
   * Asserts that two values are strictly equal.
   * @param {unknown} actual - The received value.
   * @param {unknown} expected - The expected value.
   * @param {string} [message] - Optional description.
   * @returns {boolean}
   */
  equal(actual, expected, message = '') {
    return this.ok(
      Object.is(actual, expected),
      message || `Expected ${actual} to equal ${expected}`,
      {
        actual,
        expected,
      },
    );
  }

  /**
   * Asserts that two values are deeply equal (JSON based).
   * @param {unknown} actual - The received value.
   * @param {unknown} expected - The expected value.
   * @param {string} [message] - Optional description.
   * @returns {boolean}
   */
  deepEqual(actual, expected, message = '') {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    return this.ok(a === b, message || `Expected ${a} to deeply equal ${b}`, { actual, expected });
  }

  /**
   * Asserts that a condition is truthy.
   * @param {unknown} condition - The condition to test.
   * @param {string} [message] - Optional description.
   * @param {unknown} [details] - Extra data printed on failure.
   * @returns {boolean}
   */
  ok(condition, message = 'Assertion failed', details) {
    if (condition) {
      this.#passed++;
      console.log(`  ${color('green', '✔')} ${message}`);
      return true;
    }
    this.#failed++;
    console.error(`  ${color('red', '✘')} ${message}`);
    if (details !== undefined) console.error(`      ${color('gray', JSON.stringify(details))}`);
    return false;
  }

  /**
   * Asserts that a function throws.
   * @param {() => unknown} fn - The function expected to throw.
   * @param {string} [message] - Optional description.
   * @returns {boolean}
   */
  throws(fn, message = 'Expected function to throw') {
    try {
      fn();
      return this.ok(false, message);
    } catch {
      return this.ok(true, message);
    }
  }

  /**
   * Prints a summary and returns the amount of failures.
   * @returns {number}
   */
  summary() {
    const total = this.#passed + this.#failed;
    const status = this.#failed === 0 ? color('green', 'PASSED') : color('red', 'FAILED');
    console.log(
      `\n${color('bright', `${this.title}: ${status}`)} ${color('gray', `(${this.#passed}/${total} checks)`)}`,
    );
    return this.#failed;
  }
}

/**
 * Small promise based sleep.
 * @param {number} ms - Milliseconds to wait.
 * @returns {Promise<void>}
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default { colors, color, section, success, info, fail, TestRunner, sleep };
