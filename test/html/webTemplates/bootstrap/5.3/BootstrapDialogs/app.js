import { BootstrapDialogs } from '/src/v1/webTemplates/bootstrap/5.3/html/BootstrapDialogs.mjs';

/**
 * @typedef {Object} LogEntry
 * @property {string} label - Short description of the action that produced the value.
 * @property {unknown} value - Value resolved by the dialog.
 */

/**
 * Wires the Bootstrap `Modal` implementation into the dialog helper.
 * Must run before any dialog is opened.
 */
function installModal() {
  if (!window.bootstrap?.Modal) {
    throw new Error('Bootstrap bundle was not loaded before app.js.');
  }

  try {
    BootstrapDialogs.Modal = window.bootstrap.Modal;
  } catch {
    // Already installed by a previous evaluation (HMR / double import).
  }
}

/**
 * Test harness for the BootstrapDialogs helper.
 */
class DialogPlayground {
  /** @type {HTMLElement} */
  #log;

  /** @type {HTMLElement} */
  #logCount;

  /** @type {number} */
  #entries = 0;

  /** @type {string} */
  #initialConfig = JSON.stringify(BootstrapDialogs.defaultConfig, null, 2);

  constructor() {
    this.#log = /** @type {HTMLElement} */ (document.getElementById('log'));
    this.#logCount = /** @type {HTMLElement} */ (document.getElementById('log-count'));

    this.#bindAlert();
    this.#bindConfirm();
    this.#bindPrompt();
    this.#bindLoading();
    this.#bindEdgeCases();
    this.#bindConfig();

    document.getElementById('btn-clear-log')?.addEventListener('click', () => this.#clearLog());
    document.getElementById('btn-reset')?.addEventListener('click', () => this.#resetConfig());

    this.#renderConfig();
  }

  // --------------------------------------------------------------- logging

  /**
   * Appends a value to the result log.
   * @param {string} label - Description of the action.
   * @param {unknown} value - Resolved value.
   * @returns {void}
   */
  #logValue(label, value) {
    if (this.#entries === 0) this.#log.replaceChildren();
    this.#entries += 1;

    const entry = document.createElement('div');
    entry.className = 'log-entry';

    const time = document.createElement('time');
    time.textContent = new Date().toLocaleTimeString();

    const content = document.createElement('pre');

    const name = document.createElement('span');
    name.className = 'log-label';
    name.textContent = `${label} → `;

    const output = document.createElement('span');
    output.className = this.#valueClass(value);
    output.textContent = this.#format(value);

    content.append(name, output);
    entry.append(time, content);
    this.#log.prepend(entry);

    this.#logCount.textContent = String(this.#entries);
  }

  /**
   * @param {unknown} value
   * @returns {string}
   */
  #valueClass(value) {
    if (value === null) return 'log-value-null';
    if (value === true) return 'log-value-true';
    if (value === false) return 'log-value-false';
    return '';
  }

  /**
   * @param {unknown} value
   * @returns {string}
   */
  #format(value) {
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return JSON.stringify(value);
    return String(value);
  }

  #clearLog() {
    this.#entries = 0;
    this.#logCount.textContent = '0';

    const empty = document.createElement('p');
    empty.className = 'text-body-secondary small m-3 mb-3';
    empty.textContent = 'Interact with the buttons above to see the resolved values.';
    this.#log.replaceChildren(empty);
  }

  // ----------------------------------------------------------------- alert

  #bindAlert() {
    document.getElementById('alert-default')?.addEventListener('click', async () => {
      await BootstrapDialogs.alert('Operation completed successfully.');
      this.#logValue('alert()', 'resolved');
    });

    document.getElementById('alert-custom')?.addEventListener('click', async () => {
      await BootstrapDialogs.alert('This dialog uses custom labels.', {
        title: 'Heads up',
        confirmText: 'Got it',
      });
      this.#logValue('alert(custom labels)', 'resolved');
    });

    document.getElementById('alert-styled')?.addEventListener('click', async () => {
      await BootstrapDialogs.alert('The confirm button is green and the title is italic.', {
        title: 'Styled',
        confirmText: 'Nice',
        titleConfig: { className: ['fst-italic'] },
        confirmBtnConfig: { className: ['btn', 'btn-success', 'w-100'] },
        contentConfig: { styles: { 'border-left': '4px solid var(--bs-success)' } },
      });
      this.#logValue('alert(styled)', 'resolved');
    });

    document.getElementById('alert-long')?.addEventListener('click', async () => {
      const message = Array.from(
        { length: 12 },
        (_, index) => `Line ${index + 1}: the body should scroll instead of overflowing the viewport.`,
      ).join('\n');

      await BootstrapDialogs.alert(message, { title: 'Long content' });
      this.#logValue('alert(long)', 'resolved');
    });
  }

  // --------------------------------------------------------------- confirm

  #bindConfirm() {
    document.getElementById('confirm-default')?.addEventListener('click', async () => {
      const result = await BootstrapDialogs.confirm('Do you want to continue?');
      this.#logValue('confirm()', result);
    });

    document.getElementById('confirm-danger')?.addEventListener('click', async () => {
      const result = await BootstrapDialogs.confirm('This action cannot be undone. Delete it?', {
        title: 'Delete project',
        confirmText: 'Delete',
        cancelText: 'Keep',
        confirmBtnConfig: { className: ['btn', 'btn-danger'] },
      });
      this.#logValue('confirm(danger)', result);
    });

    document.getElementById('confirm-escape')?.addEventListener('click', async () => {
      const result = await BootstrapDialogs.confirm('Escape is disabled. Use the buttons.', {
        title: 'Escape disabled',
        closeOnEscape: false,
      });
      this.#logValue('confirm(no escape)', result);
    });
  }

  // ---------------------------------------------------------------- prompt

  #bindPrompt() {
    document.getElementById('prompt-default')?.addEventListener('click', async () => {
      const result = await BootstrapDialogs.prompt('What is your name?');
      this.#logValue('prompt()', result);
    });

    document.getElementById('prompt-filled')?.addEventListener('click', async () => {
      const result = await BootstrapDialogs.prompt('Rename the file', 'untitled.txt', {
        title: 'Rename',
        confirmText: 'Save',
      });
      this.#logValue('prompt(default value)', result);
    });

    document.getElementById('prompt-enter')?.addEventListener('click', async () => {
      const result = await BootstrapDialogs.prompt('Enter is disabled here.', '', {
        title: 'Enter disabled',
        closeOnEnter: false,
      });
      this.#logValue('prompt(no enter)', result);
    });
  }

  // --------------------------------------------------------------- loading

  #bindLoading() {
    const wait = (/** @type {number} */ ms) => new Promise((resolve) => setTimeout(resolve, ms));

    document.getElementById('loading-sequence')?.addEventListener('click', async () => {
      BootstrapDialogs.showLoading('Connecting...');
      await wait(900);
      BootstrapDialogs.showLoading('Downloading data...');
      await wait(900);
      BootstrapDialogs.showLoading('Almost there...');
      await wait(900);
      BootstrapDialogs.hideLoading();
      this.#logValue('showLoading(sequence)', 'finished');
    });

    document.getElementById('loading-styled')?.addEventListener('click', async () => {
      BootstrapDialogs.showLoading('Custom styled overlay', {
        className: ['text-warning', 'fs-4', 'text-uppercase'],
      });
      await wait(1500);
      BootstrapDialogs.hideLoading();
      this.#logValue('showLoading(styled)', 'finished');
    });

    document.getElementById('loading-hide')?.addEventListener('click', () => {
      BootstrapDialogs.hideLoading();
      this.#logValue('hideLoading()', 'called');
    });
  }

  // ------------------------------------------------------------ edge cases

  #bindEdgeCases() {
    document.getElementById('edge-html')?.addEventListener('click', async () => {
      await BootstrapDialogs.alert('<img src=x onerror="alert(1)"> <b>not bold</b>');
      this.#logValue('alert(escaped html)', 'resolved');
    });

    document.getElementById('edge-race')?.addEventListener('click', async () => {
      const first = BootstrapDialogs.confirm('First dialog — this one is replaced.');
      const second = BootstrapDialogs.confirm('Second dialog — this one wins.');
      const [a, b] = await Promise.all([first, second]);
      this.#logValue('overlapping dialogs', `first=${a} second=${b}`);
    });

    document.getElementById('edge-chain')?.addEventListener('click', async () => {
      const name = await BootstrapDialogs.prompt('Project name?', 'tiny');
      if (name === null) {
        this.#logValue('chained flow', 'cancelled');
        return;
      }

      const confirmed = await BootstrapDialogs.confirm(`Create the project "${name}"?`);
      if (!confirmed) {
        this.#logValue('chained flow', 'aborted');
        return;
      }

      await BootstrapDialogs.alert(`Project "${name}" created.`);
      this.#logValue('chained flow', `created:${name}`);
    });
  }

  // ----------------------------------------------------------------- config

  #bindConfig() {
    document.getElementById('config-rounded')?.addEventListener('click', () => {
      BootstrapDialogs.contentConfig = {
        className: ['border', 'border-warning', 'border-3', 'rounded-4'],
      };
      BootstrapDialogs.headerConfig = { className: ['bg-warning-subtle'] };
      this.#renderConfig();
      this.#logValue('defaultConfig', 'warning theme applied');
    });

    document.getElementById('config-reset')?.addEventListener('click', () => this.#resetConfig());
  }

  #resetConfig() {
    BootstrapDialogs.defaultConfig = JSON.parse(this.#initialConfig);
    this.#renderConfig();
    this.#logValue('defaultConfig', 'restored');
  }

  #renderConfig() {
    const preview = document.getElementById('config-preview');
    if (!preview) return;
    preview.textContent = JSON.stringify(BootstrapDialogs.defaultConfig, null, 2);
  }
}

installModal();
new DialogPlayground();
