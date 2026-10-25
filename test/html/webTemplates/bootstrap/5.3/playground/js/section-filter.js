/**
 * @file Section filter for the Bootstrap 5.3 playground.
 *
 * Every `<section id>` inside the container becomes one checkbox. The filter
 * toggles the `hidden` attribute, so a section keeps its state (pickers, scroll
 * position, localStorage) when it comes back.
 */

import { button, el } from './color-matrix.js';

/* -------------------------------------------------------------------- types */

/**
 * @typedef {Object} SectionEntry
 * @property {string} id Section id, also used as the checkbox id suffix.
 * @property {string} label Visible label, taken from the first heading.
 * @property {HTMLElement} element Section element.
 */

/**
 * @typedef {Object} SectionFilterElements
 * @property {HTMLElement} mount Element that receives the dropdown.
 * @property {HTMLElement} container Element that owns the sections.
 */

/**
 * @typedef {Object} SectionFilterOptions
 * @property {string} [storageKey] localStorage key used to persist the selection.
 * @property {string} [label] Accessible label of the dropdown.
 * @property {string} [emptyMessage] Message rendered when nothing is selected.
 */

/**
 * @typedef {Object} ApplyOptions
 * @property {boolean} [persist] When true, writes the selection to localStorage.
 */

/* ---------------------------------------------------------------- constants */

/** @type {string} */
const CHANGE_EVENT = 'pg:sectionchange';

/* -------------------------------------------------------------------- class */

/**
 * Multi-select filter over the sections of a container.
 */
class SectionFilter {
  /** @type {HTMLElement} */
  #mount;

  /** @type {HTMLElement} */
  #container;

  /** @type {string} */
  #storageKey;

  /** @type {string} */
  #label;

  /** @type {string} */
  #emptyMessage;

  /** @type {SectionEntry[]} */
  #sections = [];

  /** @type {Set<string>} */
  #selected = new Set();

  /** @type {Map<string, HTMLInputElement>} */
  #inputs = new Map();

  /** @type {HTMLButtonElement | null} */
  #toggle = null;

  /** @type {HTMLElement | null} */
  #empty = null;

  /**
   * @param {SectionFilterElements} elements
   * @param {SectionFilterOptions} [options]
   * @throws {TypeError} When an element or an option has an unexpected type.
   */
  constructor({ mount, container }, options = {}) {
    if (!(mount instanceof HTMLElement)) {
      throw new TypeError('mount must be an HTMLElement');
    }

    if (!(container instanceof HTMLElement)) {
      throw new TypeError('container must be an HTMLElement');
    }

    const {
      storageKey = 'pg-section',
      label = 'Sections',
      emptyMessage = 'Select at least one section to render the page.',
    } = options;

    if (typeof storageKey !== 'string' || storageKey.trim() === '') {
      throw new TypeError('storageKey must be a non-empty string');
    }

    if (typeof label !== 'string' || label.trim() === '') {
      throw new TypeError('label must be a non-empty string');
    }

    if (typeof emptyMessage !== 'string' || emptyMessage.trim() === '') {
      throw new TypeError('emptyMessage must be a non-empty string');
    }

    this.#mount = mount;
    this.#container = container;
    this.#storageKey = storageKey;
    this.#label = label;
    this.#emptyMessage = emptyMessage;
  }

  /**
   * Every section found in the container, in document order.
   * @returns {readonly SectionEntry[]}
   */
  get sections() {
    return this.#sections;
  }

  /**
   * Ids of the sections that are currently visible.
   * @returns {string[]}
   */
  get selected() {
    return this.#sections.filter((section) => this.#selected.has(section.id)).map((item) => item.id);
  }

  /**
   * Builds the dropdown and applies the persisted selection.
   * @returns {void}
   */
  mount() {
    this.#sections = this.#collect();
    this.#selected = this.#read();
    this.#render();
    this.#apply({ persist: false });

    window.addEventListener('hashchange', () => this.#syncFromHash());
  }

  /**
   * Reads every `<section id>` of the container, ignoring duplicates.
   * @returns {SectionEntry[]}
   */
  #collect() {
    /** @type {SectionEntry[]} */
    const entries = [];
    /** @type {Set<string>} */
    const seen = new Set();

    this.#container.querySelectorAll('section[id]').forEach((element) => {
      if (!(element instanceof HTMLElement)) {
        return;
      }

      if (seen.has(element.id)) {
        console.warn(`[section-filter] Duplicated section id: #${element.id}`);

        return;
      }

      seen.add(element.id);
      entries.push({ id: element.id, label: this.#labelOf(element), element });
    });

    return entries;
  }

  /**
   * Resolves the visible label of a section.
   * @param {HTMLElement} element
   * @returns {string}
   */
  #labelOf(element) {
    const heading = element.querySelector('h1, h2');
    const text = (heading?.textContent ?? '').replace(/\s+/g, ' ').trim();

    return text === '' ? element.id : text;
  }

  /**
   * Builds the dropdown markup.
   * @returns {void}
   */
  #render() {
    const toggle = button('', 'btn btn-sm btn-outline-secondary dropdown-toggle');
    toggle.dataset.bsToggle = 'dropdown';
    toggle.dataset.bsAutoClose = 'outside';
    toggle.setAttribute('aria-expanded', 'false');

    const all = button('Select all', 'btn btn-sm btn-outline-secondary flex-fill');
    all.addEventListener('click', () => this.#setAll(true));

    const none = button('Clear', 'btn btn-sm btn-outline-secondary flex-fill');
    none.addEventListener('click', () => this.#setAll(false));

    const menu = el('div', 'dropdown-menu p-2');
    menu.style.minWidth = '18rem';
    menu.style.maxHeight = '22rem';
    menu.style.overflowY = 'auto';
    menu.append(el('div', 'd-flex gap-1 mb-2', all, none), ...this.#createItems());

    this.#toggle = toggle;
    this.#mount.replaceChildren(el('div', 'dropdown', toggle, menu));

    this.#empty = el('p', 'alert alert-warning', this.#emptyMessage);
    this.#empty.hidden = true;
    this.#container.prepend(this.#empty);
  }

  /**
   * Builds one checkbox per section.
   * @returns {HTMLDivElement[]}
   */
  #createItems() {
    return this.#sections.map((section) => {
      const input = el('input', 'form-check-input');
      input.type = 'checkbox';
      input.id = `pg-section-${section.id}`;
      input.checked = this.#selected.has(section.id);
      input.addEventListener('change', () => {
        if (input.checked) {
          this.#selected.add(section.id);
        } else {
          this.#selected.delete(section.id);
        }

        this.#apply({ persist: true });
      });
      this.#inputs.set(section.id, input);

      const label = el('label', 'form-check-label small', section.label);
      label.htmlFor = input.id;

      return el('div', 'form-check', input, label);
    });
  }

  /**
   * Selects or clears every section.
   * @param {boolean} checked
   * @returns {void}
   */
  #setAll(checked) {
    this.#sections.forEach((section) => {
      if (checked) {
        this.#selected.add(section.id);
      } else {
        this.#selected.delete(section.id);
      }
    });

    this.#inputs.forEach((input, id) => {
      input.checked = this.#selected.has(id);
    });

    this.#apply({ persist: true });
  }

  /**
   * Reads the persisted selection, falling back to every section.
   * @returns {Set<string>}
   */
  #read() {
    const fallback = new Set(this.#sections.map((section) => section.id));

    try {
      const raw = localStorage.getItem(this.#storageKey);

      if (raw === null) {
        return fallback;
      }

      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        return fallback;
      }

      return new Set(
        this.#sections.filter((section) => parsed.includes(section.id)).map((item) => item.id),
      );
    } catch {
      return fallback;
    }
  }

  /**
   * Persists the current selection.
   * @returns {void}
   */
  #write() {
    try {
      localStorage.setItem(this.#storageKey, JSON.stringify(this.selected));
    } catch {
      /* Storage can be disabled; the filter still works for this session. */
    }
  }

  /**
   * Applies the current selection to the DOM.
   * @param {ApplyOptions} [options]
   * @returns {void}
   */
  #apply({ persist = false } = {}) {
    const total = this.#sections.length;
    const selected = this.selected.length;

    this.#sections.forEach((section) => {
      section.element.hidden = !this.#selected.has(section.id);
    });

    if (this.#empty) {
      this.#empty.hidden = selected > 0;
    }

    if (this.#toggle) {
      this.#toggle.textContent = `${this.#label} (${selected}/${total})`;
      this.#toggle.classList.toggle('text-warning', selected !== total);
    }

    if (persist) {
      this.#write();
    }

    document.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { sections: this.selected } }));
  }

  /**
   * Reveals the section referenced by the hash when it is currently hidden.
   * @returns {void}
   */
  #syncFromHash() {
    const id = window.location.hash.replace('#', '');

    if (id === '' || this.#selected.has(id)) {
      return;
    }

    if (!this.#sections.some((section) => section.id === id)) {
      return;
    }

    this.#selected.add(id);

    const input = this.#inputs.get(id);

    if (input) {
      input.checked = true;
    }

    this.#apply({ persist: true });
  }
}

/* ------------------------------------------------------------------ factory */

/**
 * Mounts the section filter.
 *
 * Returns `null` (instead of throwing) when the markup is missing, so the page
 * keeps working if the toolbar is removed.
 *
 * @param {string} [mountId] Id of the element that receives the dropdown.
 * @param {string} [containerSelector] Selector of the element that owns the sections.
 * @returns {SectionFilter | null} The mounted filter, or `null`.
 * @throws {TypeError} When an argument is not a non-empty string.
 */
export const mountSectionFilter = (mountId = 'pg-section-filter', containerSelector = 'main') => {
  if (typeof mountId !== 'string' || mountId.trim() === '') {
    throw new TypeError('mountId must be a non-empty string');
  }

  if (typeof containerSelector !== 'string' || containerSelector.trim() === '') {
    throw new TypeError('containerSelector must be a non-empty string');
  }

  const mount = document.getElementById(mountId);
  const container = document.querySelector(containerSelector);

  if (!(mount instanceof HTMLElement) || !(container instanceof HTMLElement)) {
    return null;
  }

  const filter = new SectionFilter({ mount, container });
  filter.mount();

  return filter;
};

mountSectionFilter();
