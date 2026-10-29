/**
 * @typedef {Object} ThemeEntry
 * @property {string} id    Unique identifier used as the option value.
 * @property {string} label Human readable label shown inside the select.
 * @property {string} href  Stylesheet URL. The server compiles SCSS on request.
 */

/**
 * @typedef {Object} LoaderElements
 * @property {HTMLSelectElement} select
 * @property {HTMLButtonElement} button
 * @property {HTMLElement} status
 */

/**
 * @typedef {Object} ApplyOptions
 * @property {boolean} [bust] When true, appends a cache-busting query parameter.
 */

/**
 * @typedef {'idle' | 'loading' | 'ready' | 'error'} LoaderState
 */

/**
 * Swaps a stylesheet <link> to apply a server-compiled theme.
 */
class ThemeStylesheetLoader {
  /** @type {readonly ThemeEntry[]} */
  static THEMES = Object.freeze([
    {
      id: 'website',
      label: 'Website',
      entry: '/webTemplates/bootstrap/5.3/playground/scss/Background-Grid.scss',
    },
    {
      id: 'DeepStrap',
      label: 'BootDeep',
      entry: '/webTemplates/bootstrap/5.3/playground/scss/Deepstrap.scss',
    },
  ]);

  static STORAGE_KEY = 'pg-theme-entry';

  /** @type {HTMLSelectElement} */
  #select;

  /** @type {HTMLButtonElement} */
  #button;

  /** @type {HTMLElement} */
  #status;

  /** @type {number} */
  #token = 0;

  /**
   * @param {LoaderElements} elements
   * @throws {TypeError} When an element has an unexpected type.
   */
  constructor({ select, button, status }) {
    if (!(select instanceof HTMLSelectElement)) {
      throw new TypeError('select must be an HTMLSelectElement');
    }

    if (!(button instanceof HTMLButtonElement)) {
      throw new TypeError('button must be an HTMLButtonElement');
    }

    if (!(status instanceof HTMLElement)) {
      throw new TypeError('status must be an HTMLElement');
    }

    this.#select = select;
    this.#button = button;
    this.#status = status;
  }

  /**
   * Available themes.
   * @returns {readonly ThemeEntry[]}
   */
  get themes() {
    return ThemeStylesheetLoader.THEMES;
  }

  /**
   * Identifier of the theme currently selected in the dropdown.
   * @returns {string}
   */
  get current() {
    return this.#select.value;
  }

  /**
   * Populates the dropdown and applies the stored theme.
   * @returns {void}
   */
  mount() {
    this.#select.replaceChildren(
      ...ThemeStylesheetLoader.THEMES.map((theme) => new Option(theme.label, theme.id)),
    );

    this.#select.disabled = false;
    this.#button.disabled = false;

    const stored = localStorage.getItem(ThemeStylesheetLoader.STORAGE_KEY);
    const initial = ThemeStylesheetLoader.THEMES.some((theme) => theme.id === stored)
      ? stored
      : ThemeStylesheetLoader.THEMES[0].id;

    this.#select.value = initial;

    this.#select.addEventListener('change', () => {
      void this.#activate(this.#select.value, { bust: false });
    });

    this.#button.addEventListener('click', () => {
      void this.#activate(this.#select.value, { bust: true });
    });

    void this.#activate(initial, { bust: false });
  }

  /**
   * Re-applies the current theme, bypassing the HTTP cache.
   * @returns {Promise<void>}
   */
  async reload() {
    await this.#activate(this.#select.value, { bust: true });
  }

  /**
   * @param {string} themeId
   * @param {ApplyOptions} options
   * @returns {Promise<void>}
   */
  async #activate(themeId, { bust = false } = {}) {
    const theme = ThemeStylesheetLoader.THEMES.find((item) => item.id === themeId);
    if (!theme) {
      this.#setStatus('error', `Unknown theme: ${themeId}`);
      return;
    }

    this.#setBusy(true);

    try {
      await this.#apply(theme, { bust });
      localStorage.setItem(ThemeStylesheetLoader.STORAGE_KEY, theme.id);
    } finally {
      this.#setBusy(false);
    }
  }

  /**
   * Injects the stylesheet and removes the previous one once the new one loads.
   * @param {ThemeEntry} theme
   * @param {ApplyOptions} options
   * @returns {Promise<void>}
   */
  async #apply(theme, { bust = false } = {}) {
    const token = ++this.#token;
    const url = new URL(theme.entry, window.location.href);

    if (bust) {
      url.searchParams.set('t', String(Date.now()));
    }

    this.#setStatus('loading', `Loading ${theme.label}…`);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url.href;
    link.dataset.pgTheme = theme.id;

    try {
      await new Promise((resolve, reject) => {
        link.addEventListener('load', () => resolve(undefined), { once: true });
        link.addEventListener('error', () => reject(new Error(`Cannot load ${url.pathname}`)), {
          once: true,
        });
        document.head.appendChild(link);
      });
    } catch (error) {
      link.remove();

      if (token === this.#token) {
        this.#setStatus('error', error instanceof Error ? error.message : String(error));
      }

      return;
    }

    if (token !== this.#token) {
      link.remove();
      return;
    }

    document.querySelectorAll('link[data-pg-theme]').forEach((node) => {
      if (node !== link) {
        node.remove();
      }
    });

    this.#setStatus('ready', `Loaded ${theme.label}`);
  }

  /**
   * @param {boolean} busy
   * @returns {void}
   */
  #setBusy(busy) {
    this.#select.disabled = busy;
    this.#button.disabled = busy;
  }

  /**
   * @param {LoaderState} state
   * @param {string} message
   * @returns {void}
   */
  #setStatus(state, message) {
    /** @type {Record<LoaderState, string>} */
    const palette = {
      idle: 'text-body-secondary',
      loading: 'text-info-emphasis',
      ready: 'text-success',
      error: 'text-danger',
    };

    this.#status.className = `small ms-auto ${palette[state]}`;
    this.#status.textContent = message;

    const sphere_pulse = document.createElement('span');
    sphere_pulse.className = `sphere-pulse-${palette[state].substring(5)} shadow-pulse me-2`;
    this.#status.prepend(sphere_pulse);
  }
}

const select = document.getElementById('pg-theme-select');
const button = document.getElementById('pg-theme-refresh');
const status = document.getElementById('pg-theme-status');

/**
 * Toggles the opt-in `btn-lighting` class on every button in the page.
 *
 * The class is applied imperatively instead of through a parent selector, so a
 * MutationObserver keeps dynamically created buttons (toasts, dropdowns) in
 * sync with the current state.
 *
 * @returns {void}
 */
const initButtonLighting = () => {
  const toggle = document.getElementById('pg-btn-lighting');

  if (!(toggle instanceof HTMLInputElement)) {
    return;
  }

  const STORAGE_KEY = 'pg-btn-lighting';

  /**
   * @param {ParentNode} root
   * @param {boolean} enabled
   * @returns {void}
   */
  const paint = (root, enabled) => {
    root.querySelectorAll('.btn').forEach((button) => {
      button.classList.toggle('btn-lighting', enabled);
    });
  };

  let enabled = localStorage.getItem(STORAGE_KEY) === 'true';
  toggle.checked = enabled;
  paint(document, enabled);

  new MutationObserver((records) => {
    if (!enabled) {
      return;
    }

    records.forEach((record) => {
      record.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) {
          return;
        }

        if (node.classList.contains('btn')) {
          node.classList.add('btn-lighting');
        }

        paint(node, true);
      });
    });
  }).observe(document.body, { childList: true, subtree: true });

  toggle.addEventListener('change', () => {
    enabled = toggle.checked;
    localStorage.setItem(STORAGE_KEY, String(enabled));
    paint(document, enabled);
  });
};

initButtonLighting();

if (select instanceof HTMLSelectElement && button instanceof HTMLButtonElement && status) {
  new ThemeStylesheetLoader({ select, button, status }).mount();
}
