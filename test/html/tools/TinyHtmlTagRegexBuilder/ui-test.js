import { TinyHtmlTagRegexBuilder } from '/src/v1/libs/tools/TinyHtmlTagRegexBuilder.mjs';

/**
 * UI Controller for the TinyHtmlTagRegexBuilder Test Environment.
 */
class TestEnvironment {
  #elements = {};
  #currentBuilder = null;

  constructor() {
    this.#cacheElements();
    this.#attachEventListeners();
  }

  /**
   * Caches DOM elements to avoid repeated lookups.
   */
  #cacheElements() {
    this.#elements = {
      tagName: document.getElementById('tagName'),
      attributes: document.getElementById('attributes'),
      captureAllAttributes: document.getElementById('captureAllAttributes'),
      freeMode: document.getElementById('freeMode'),
      contentPattern: document.getElementById('contentPattern'),
      buildBtn: document.getElementById('buildBtn'),
      runTestBtn: document.getElementById('runTestBtn'),
      regexDisplay: document.getElementById('regexStringDisplay'),
      htmlInput: document.getElementById('htmlInput'),
      console: document.getElementById('consoleOutput'),
      clearConsole: document.getElementById('clearConsole'),
    };
  }

  /**
   * Attaches event listeners to UI components.
   */
  #attachEventListeners() {
    this.#elements.buildBtn.addEventListener('click', () => this.#handleBuild());
    this.#elements.runTestBtn.addEventListener('click', () => this.#handleRunTest());
    this.#elements.clearConsole.addEventListener('click', () => this.#clearConsole());
  }

  /**
   * Logs messages to the custom visual console.
   * @param {string} message - The text to display.
   * @param {string} type - The semantic type: 'info', 'error', 'success', 'system'.
   */
  #log(message, type = 'info') {
    const span = document.createElement('span');
    span.className = `console-msg ${type}`;

    if (type === 'error') {
      span.textContent = `[Error] ${message}`;
    } else if (type === 'success') {
      span.textContent = `[Success] ${message}`;
    } else if (type === 'system') {
      span.textContent = `> ${message}`;
    } else {
      span.textContent = message;
    }

    this.#elements.console.appendChild(span);
    this.#elements.console.scrollTop = this.#elements.console.scrollHeight;
  }

  #clearConsole() {
    this.#elements.console.innerHTML = '';
    this.#log('Console cleared', 'system');
  }

  /**
   * Collects inputs and attempts to instantiate the Builder.
   */
  #handleBuild() {
    try {
      // Parse attributes string into an array
      const attrInput = this.#elements.attributes.value.trim();
      const attributes = attrInput ? attrInput.split(',').map((a) => a.trim()) : [];

      // Construct the config object
      const config = {
        tagName: this.#elements.tagName.value,
        attributes: attributes,
        captureAllAttributes: this.#elements.captureAllAttributes.checked,
        freeMode: this.#elements.freeMode.checked,
        contentPattern: this.#elements.contentPattern.value,
      };

      // Instantiate the user's class
      this.#currentBuilder = new TinyHtmlTagRegexBuilder(config);

      // Update UI
      this.#elements.regexDisplay.textContent = this.#currentBuilder.toString();
      this.#elements.runTestBtn.disabled = false;

      this.#log('Regex built successfully.', 'success');
      this.#log(`Pattern: ${this.#currentBuilder.toString()}`, 'info');
    } catch (error) {
      this.#currentBuilder = null;
      this.#elements.runTestBtn.disabled = true;
      this.#log(error.message, 'error');
      console.error(error);
    }
  }

  /**
   * Executes the built regex against the provided HTML string.
   */
  #handleRunTest() {
    if (!this.#currentBuilder) return;

    const htmlString = this.#elements.htmlInput.value;

    this.#log(`Running test on: "${htmlString}"`, 'system');

    try {
      const matches = this.#currentBuilder.parse(htmlString);

      if (matches.length === 0) {
        this.#log('No matches found.', 'error');
        return;
      }

      this.#log(`${matches.length} match(es) found:`, 'success');

      matches.forEach((match, index) => {
        const matchInfo = document.createElement('pre');
        matchInfo.className = 'console-msg success';

        // Create a detailed view of the match and its capture groups
        let details = `Match ${index + 1}:\n`;
        details += `Groups: ${JSON.stringify(match, null, 2)}`;

        matchInfo.textContent = details;
        this.#elements.console.appendChild(matchInfo);
      });
    } catch (error) {
      console.error(error);
      this.#log(error.message, 'error');
    }
  }
}

// Initialize the environment
new TestEnvironment();
