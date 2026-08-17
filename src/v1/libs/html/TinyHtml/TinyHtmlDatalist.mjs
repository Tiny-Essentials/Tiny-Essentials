import TinyHtmlTemplate from './TinyHtmlTemplate.mjs';

/**
 * @typedef {{value: string, label?: string}} DatalistOption
 */

/**
 * TinyHtmlDatalist is a helper class for creating and managing <datalist> elements.
 * A <datalist> provides predefined options for <input> elements via the `list` attribute.
 *
 * Only <option> children are valid inside <datalist>.
 *
 * @example
 * const datalist = new TinyHtmlDatalist({ id: 'browsers' });
 * datalist.addOption({ value: 'Firefox' });
 * datalist.addOption({ value: 'Chrome' });
 * document.body.appendChild(datalist.el);
 *
 * <input list="browsers">
 *
 * @extends TinyHtmlTemplate<HTMLDataListElement>
 */
class TinyHtmlDatalist extends TinyHtmlTemplate {
  /**
   * Creates a new TinyHtmlDatalist instance.
   * @param {Object} config - Configuration object.
   * @param {string} [config.id] - The unique identifier for the datalist (to be linked with <input list="...">).
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=""] - Main CSS class.
   * @param {Array<DatalistOption>} [config.options=[]] - Initial <option> elements.
   */
  constructor({ id, tags = [], mainClass = '', options = [] } = {}) {
    super(document.createElement('datalist'), tags, mainClass);

    if (id !== undefined) this.id = id;
    if (options !== undefined) this.options = options;
  }

  /** @param {Array<DatalistOption>} options */
  set options(options) {
    if (!Array.isArray(options)) {
      throw new TypeError('TinyHtmlDatalist: "options" must be an array.');
    }
    // limpa opções anteriores
    this.el.innerHTML = '';
    for (const opt of options) {
      this.addOption(opt);
    }
  }

  /** @returns {Array<DatalistOption>} */
  get options() {
    return Array.from(this.el.children)
      .filter((child) => child instanceof HTMLOptionElement)
      .map((opt) => ({
        value: opt.value,
        label: opt.label,
      }));
  }

  /**
   * Adds a new <option> to the datalist.
   * @param {Object} config - Option configuration.
   * @param {string} config.value - The value of the option (required).
   * @param {string} [config.label] - Optional label for accessibility or display.
   * @returns {HTMLOptionElement} The created <option> element.
   */
  addOption({ value, label }) {
    if (typeof value !== 'string') {
      throw new TypeError('TinyHtmlDatalist.addOption: "value" must be a string.');
    }
    if (label !== undefined && typeof label !== 'string') {
      throw new TypeError('TinyHtmlDatalist.addOption: "label" must be a string if provided.');
    }

    const option = document.createElement('option');
    option.value = value;
    if (label) option.label = label;
    this.el.appendChild(option);
    return option;
  }

  /**
   * Removes an option by its value.
   * @param {string} value - The value of the option to remove.
   * @returns {boolean} True if an option was removed, false otherwise.
   */
  removeOption(value) {
    if (typeof value !== 'string')
      throw new TypeError('TinyHtmlDatalist.removeOption: "value" must be a string.');

    const option = Array.from(this.el.children).find(
      (child) => child instanceof HTMLOptionElement && child.value === value,
    );

    if (option) {
      option.remove();
      return true;
    }
    return false;
  }
}

export default TinyHtmlDatalist;
