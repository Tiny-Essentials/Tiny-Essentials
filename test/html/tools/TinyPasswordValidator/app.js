import { TinyPasswordValidator } from '/src/v1/libs/tools/TinyPasswordValidator.mjs';
import { hashText } from '/src/v1/basics/crypto.mjs';

TinyPasswordValidator.hashText = hashText;

/**
 * @typedef {Object} TestResult
 * @property {boolean} passed - Whether the specific assertion passed.
 * @property {string} message - Description of the test case.
 */

/**
 * @typedef {Object} UIState
 * @property {string} password - Current password value.
 * @property {Object} rules - Current rule configuration.
 */

/**
 * Manages the testing interface and automated test execution.
 */
class TestEnvironment {
  /** @type {TinyPasswordValidator} */
  #validator;
  /** @type {HTMLElement} */
  #passwordInput;
  /** @type {HTMLElement} */
  #resultsDisplay;
  /** @type {HTMLElement} */
  #consoleOutput;
  /** @type {HTMLFormElement} */
  #rulesForm;

  constructor() {
    this.#validator = new TinyPasswordValidator();
    this.#cacheDOM();
    this.#bindEvents();
    this.updateUI();
  }

  /**
   * Caches DOM elements for performance.
   * @private
   */
  #cacheDOM() {
    this.#passwordInput = document.getElementById('password-input');
    this.#resultsDisplay = document.getElementById('realtime-results');
    this.#consoleOutput = document.getElementById('console-output');
    this.#rulesForm = document.getElementById('rules-form');
  }

  /**
   * Binds user interaction events.
   * @private
   */
  #bindEvents() {
    this.#passwordInput.addEventListener('input', () => this.updateUI());
    this.#rulesForm.addEventListener('change', () => this.updateUI());
    document.getElementById('run-tests-btn').addEventListener('click', () => this.runTestSuite());
  }

  /**
   * Synchronizes the validator rules with the form state.
   * @private
   */
  #syncRules() {
    const formData = new FormData(this.#rulesForm);
    const rules = {
      requireLowercase: formData.get('requireLowercase') === 'on',
      requireUppercase: formData.get('requireUppercase') === 'on',
      requireNumbers: formData.get('requireNumbers') === 'on',
      requireSpecial: formData.get('requireSpecial') === 'on',
      minLength: parseInt(document.getElementById('min-len').value, 10),
      maxLength: parseInt(document.getElementById('max-len').value, 10),
    };

    // Runtime validation of the UI-derived rules before applying
    if (isNaN(rules.minLength) || isNaN(rules.maxLength)) {
      throw new TypeError('Rule dimensions must be valid numbers.');
    }

    this.#validator.setRules(rules);
  }

  /**
   * Updates the real-time display based on current input and rules.
   */
  updateUI() {
    try {
      this.#syncRules();
      const password = this.#passwordInput.value;
      const result = this.#validator.validate(password);
      this.#renderResults(result);
    } catch (err) {
      console.error('UI Update Error:', err);
    }
  }

  /**
   * Renders the validation result to the DOM.
   * @param {import('./src/v1/libs/tools/TinyPasswordValidator.mjs').ValidationResult} result
   * @private
   */
  #renderResults(result) {
    let html = `
      <div>
        <span class="strength-badge strength-${result.strength}">${result.strength}</span>
        <strong>Score: ${result.score} / ${result.totalPossiblePoints}</strong>
      </div>
    `;

    if (!result.isValid) {
      html += '<ul class="error-list">';
      result.errors.forEach((err) => {
        html += `<li>${err}</li>`;
      });
      html += '</ul>';
    } else {
      html +=
        '<p style="color: var(--color-success); margin-top: 0.5rem;">✓ Password meets all requirements</p>';
    }

    this.#resultsDisplay.innerHTML = html;
  }

  /**
   * Logs a message to the on-screen console.
   * @param {string} message
   * @param {'info' | 'success' | 'error'} type
   * @private
   */
  #logToConsole(message, type = 'info') {
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    this.#consoleOutput.appendChild(line);
    this.#consoleOutput.scrollTop = this.#consoleOutput.scrollHeight;
  }

  /**
   * Executes a suite of automated tests.
   * @async
   */
  async runTestSuite() {
    this.#consoleOutput.innerHTML = '';
    this.#logToConsole('Starting Automated Test Suite...', 'info');

    const tests = [
      {
        name: 'Valid Password Test',
        fn: async () => {
          const v = new TinyPasswordValidator({ minLength: 8, requireSpecial: true });
          const res = v.validate('Abc!1234');
          if (!res.isValid) throw new Error('Should be valid');
          return res.strength === 'strong';
        },
      },
      {
        name: 'Short Password Test',
        fn: async () => {
          const v = new TinyPasswordValidator({ minLength: 10 });
          const res = v.validate('Ab1!');
          return !res.isValid && res.errorCodes.includes(1);
        },
      },
      {
        name: 'Missing Special Char Test',
        fn: async () => {
          const v = new TinyPasswordValidator({ requireSpecial: true });
          const res = v.validate('Password123');
          return !res.isValid && res.errorCodes.includes(6);
        },
      },
      {
        name: 'Invalid Rule Configuration (Negative Length)',
        fn: async () => {
          try {
            new TinyPasswordValidator({ minLength: -5 });
            return false; // Should have thrown
          } catch (e) {
            return e instanceof RangeError;
          }
        },
      },
    ];

    let passedCount = 0;

    for (const test of tests) {
      try {
        const passed = await test.fn();
        if (passed) {
          this.#logToConsole(`PASS: ${test.name}`, 'success');
          passedCount++;
        } else {
          this.#logToConsole(`FAIL: ${test.name}`, 'error');
        }
      } catch (err) {
        this.#logToConsole(`ERROR: ${test.name} -> ${err.message}`, 'error');
      }
    }

    try {
      this.#logToConsole(
        `Password Encrypted: ${await TinyPasswordValidator.hashText('Abc!1234', 'SHA-256')}`,
        'success',
      );
    } catch (err) {
      this.#logToConsole(`ERROR: Password Encrypted -> ${err.message}`, 'error');
    }

    this.#logToConsole(`Suite Complete: ${passedCount}/${tests.length} passed.`, 'info');
  }
}

// Initialize the environment
new TestEnvironment();
