/**
 * @file Section filter for the Bootstrap 5.3 playground.
 *
 * Wraps every `<section id>` of the page in a single-select filter, so one test
 * environment can be isolated without losing the "show everything" default.
 *
 * The filter never rebuilds the DOM: it only toggles the `hidden` attribute, so
 * every matrix keeps its state (picker, scroll position, localStorage) when it
 * comes back.
 */

/* -------------------------------------------------------------------- types */

/**
 * @typedef {Object} SectionEntry
 * @property {string} id Section id, also used as the `<option>` value.
 * @property {string} label Visible label, taken from the first heading.
 * @property {HTMLElement} element Section element.
 */

/**
 * @typedef {Object} SectionFilterElements
 * @property {HTMLSelectElement} select Select that drives the filter.
 * @property {HTMLElement} container Element that owns every section.
 */

/**
 * @typedef {Object} SectionFilterOptions
 * @property {string} [storageKey] localStorage key used to persist the selection.
 * @property {string} [allLabel] Label of the "show everything" option.
 */

/**
 * @typedef {Object} ApplyOptions
 * @property {boolean} [persist] When true, writes the selection to localStorage.
 */

/* ---------------------------------------------------------------- constants */

/** @type {string} */
const ALL_VALUE = 'all';

/** @type {string} */
const CHANGE_EVENT = 'pg:sectionchange';

/* -------------------------------------------------------------------- class */

/**
 * Single-select filter over the sections of a container.
 */
class SectionFilter {
  /** @type {HTMLSelectElement} */
  #select;

  /** @type {HTMLElement} */
  #container;

  /** @type {string} */
  #storageKey;

  /** @type {string} */
  #allLabel;

  /** @type {SectionEntry[]} */
  #sections = [];

  /**
   * @param {SectionFilterElements} elements
   * @param {SectionFilterOptions} [options]
   * @throws {TypeError} When an element or an option has an unexpected type.
   */
  constructor({ select, container }, options = {}) {
    if (!(select instanceof HTMLSelectElement)) {
      throw new TypeError('select must be an HTMLSelectElement');
    }

    if (!(container instanceof HTMLElement)) {
      throw new TypeError('container must be an HTMLElement');
    }

    const { storageKey = 'pg-section', allLabel = 'All sections' } = options;

    if (typeof storageKey !== 'string' || storageKey.trim() === '') {
      throw new TypeError('storageKey must be a non-empty string');
    }

    if (typeof allLabel !== 'string' || allLabel.trim() === '') {
      throw new TypeError('allLabel must be a non-empty string');
    }

    this.#select = select;
    this.#container = container;
    this.#storageKey = storageKey;
    this.#allLabel = allLabel;
  }

  /**
   * Every section found in the container, in document order.
   * @returns {readonly SectionEntry[]}
   */
  get sections() {
    return this.#sections;
  }

  /**
   * Currently selected section id, or `all`.
   * @returns {string}
   */
  get current() {
    return this.#select.value;
  }

  /**
   * Fills the select and applies the persisted selection.
   * @returns {void}
   */
  mount() {
    this.#sections = this.#collect();

    this.#select.replaceChildren(
      new Option(this.#allLabel, ALL_VALUE),
      ...this.#sections.map((section) => new Option(section.label, section.id)),
    );

    this.#select.disabled = false;
    this.#select.addEventListener('change', () => {
      this.#apply(this.#select.value, { persist: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('hashchange', () => this.#syncFromHash());

    this.#apply(this.#read(), { persist: false });
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
      entries.push({ id: element.id, label: this.#label(element), element });
    });

    return entries;
  }

  /**
   * Resolves the visible label of a section.
   * @param {HTMLElement} element
   * @returns {string}
   */
  #label(element) {
    const heading = element.querySelector('h1, h2');
    const text = (heading?.textContent ?? '').replace(/\s+/g, ' ').trim();

    return text === '' ? element.id : text;
  }

  /**
   * Reads the persisted selection.
   * @returns {string}
   */
  #read() {
    try {
      return localStorage.getItem(this.#storageKey) ?? ALL_VALUE;
    } catch {
      return ALL_VALUE;
    }
  }

  /**
   * Shows the requested section and hides the others.
   * @param {string} value Section id, or `all`.
   * @param {ApplyOptions} [options]
   * @returns {void}
   */
  #apply(value, { persist = false } = {}) {
    const target = this.#sections.some((section) => section.id === value) ? value : ALL_VALUE;

    this.#sections.forEach((section) => {
      section.element.hidden = target !== ALL_VALUE && section.id !== target;
    });

    this.#select.value = target;

    if (persist) {
      try {
        localStorage.setItem(this.#storageKey, target);
      } catch {
        /* Storage can be disabled; the filter still works for this session. */
      }
    }

    document.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { section: target } }));
  }

  /**
   * Keeps the filter in sync with the table of contents.
   *
   * Clicking a TOC link while a single section is isolated switches the filter
   * to the requested section instead of scrolling to a hidden element.
   *
   * @returns {void}
   */
  #syncFromHash() {
    const id = window.location.hash.replace('#', '');

    if (id === '' || this.#select.value === ALL_VALUE) {
      return;
    }

    if (this.#sections.some((section) => section.id === id)) {
      this.#apply(id, { persist: true });
    }
  }
}

/* ------------------------------------------------------------------ factory */

/**
 * Mounts the section filter.
 *
 * Returns `null` (instead of throwing) when the markup is missing, so the page
 * keeps working if the toolbar is removed.
 *
 * @param {string} [selectId] Id of the `<select>`.
 * @param {string} [containerSelector] Selector of the element that owns the sections.
 * @returns {SectionFilter | null} The mounted filter, or `null`.
 * @throws {TypeError} When an argument is not a non-empty string.
 */
export const mountSectionFilter = (selectId = 'pg-section-select', containerSelector = 'main') => {
  if (typeof selectId !== 'string' || selectId.trim() === '') {
    throw new TypeError('selectId must be a non-empty string');
  }

  if (typeof containerSelector !== 'string' || containerSelector.trim() === '') {
    throw new TypeError('containerSelector must be a non-empty string');
  }

  const select = document.getElementById(selectId);
  const container = document.querySelector(containerSelector);

  if (!(select instanceof HTMLSelectElement) || !(container instanceof HTMLElement)) {
    return null;
  }

  const filter = new SectionFilter({ select, container });
  filter.mount();

  return filter;
};

mountSectionFilter();
