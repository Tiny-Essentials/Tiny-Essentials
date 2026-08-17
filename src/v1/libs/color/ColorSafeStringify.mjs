/**
 * @typedef {Record<string, string>} ColorsList
 * Represents a mapping of color keys to ANSI escape codes.
 */

class ColorSafeStringify {
  /**
   * Currently active color configuration.
   * @type {ColorsList}
   */
  #colors;

  /**
   * Preset collections (internal and user-defined).
   * @type {Record<string, ColorsList>}
   * @static
   */
  static #PRESETS = {
    default: {
      reset: '\x1b[0m',
      key: '\x1b[36m', // Cyan (object keys)
      string: '\x1b[32m', // Green (regular strings)
      string_url: '\x1b[34m', // Blue (URLs)
      string_bool: '\x1b[35m', // Magenta (boolean/null in string form)
      string_number: '\x1b[33m', // Yellow (numbers in string form)
      number: '\x1b[33m', // Yellow (raw numbers)
      boolean: '\x1b[35m', // Magenta (true/false)
      null: '\x1b[1;30m', // Gray (null)
      special: '\x1b[31m', // Red (e.g., [Circular], [undefined])
      func: '\x1b[90m', // Dim (function string representations)
    },
    solarized: {
      reset: '\x1b[0m',
      key: '\x1b[38;5;37m',
      string: '\x1b[38;5;136m',
      string_url: '\x1b[38;5;33m',
      string_bool: '\x1b[38;5;166m',
      string_number: '\x1b[38;5;136m',
      number: '\x1b[38;5;136m',
      boolean: '\x1b[38;5;166m',
      null: '\x1b[38;5;241m',
      special: '\x1b[38;5;160m',
      func: '\x1b[38;5;244m',
    },
    monokai: {
      reset: '\x1b[0m',
      key: '\x1b[38;5;81m',
      string: '\x1b[38;5;114m',
      string_url: '\x1b[38;5;75m',
      string_bool: '\x1b[38;5;204m',
      string_number: '\x1b[38;5;221m',
      number: '\x1b[38;5;221m',
      boolean: '\x1b[38;5;204m',
      null: '\x1b[38;5;241m',
      special: '\x1b[38;5;160m',
      func: '\x1b[38;5;102m',
    },
  };

  /**
   * Constructs a new instance with an optional base preset or custom override.
   * @param {ColorsList} [defaultColors] - Optional override for the default color scheme.
   */
  constructor(defaultColors = {}) {
    this.#colors = { ...ColorSafeStringify.#PRESETS.default, ...defaultColors };
  }

  /**
   * Internal method to apply ANSI color codes to different parts of a JSON string.
   * @param {string} str - Raw JSON string to be colorized.
   * @param {ColorsList} colors - ANSI color mapping to be applied to each JSON element type.
   * @returns {string} Colorized JSON string.
   */
  #colorizeJSON(str, colors) {
    /** @type {{ marker: string, key: string }[]} */
    const keyMatches = [];

    // Colorize numeric values
    str = str.replace(
      /(?<!")\b(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b(?!")/g,
      `${colors.number}$1${colors.reset}`,
    );

    // Replace keys with temporary markers for later colorization
    str = str.replace(/"([^"]+)":/g, (_, key) => {
      const marker = `___KEY${keyMatches.length}___`;
      keyMatches.push({ marker, key });
      return `${marker}:`; // Keep the colon for valid syntax
    });

    // Replace strings and apply specific colors based on their content
    str = str.replace(/"(?:\\.|[^"\\])*?"/g, (match) => {
      const val = match.slice(1, -1); // Remove surrounding quotes

      if (/^(https?|ftp):\/\/[^\s]+$/i.test(val)) {
        return `${colors.string_url}${match}${colors.reset}`;
      }

      if (/^(true|false|null)$/.test(val)) {
        return `${colors.string_bool}${match}${colors.reset}`;
      }

      if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(val)) {
        return `${colors.string_number}${match}${colors.reset}`;
      }

      return `${colors.string}${match}${colors.reset}`;
    });

    // Replace markers with colorized keys
    for (const { marker, key } of keyMatches) {
      const regex = new RegExp(marker, 'g');
      str = str.replace(regex, `${colors.key}"${key}"${colors.reset}`);
    }

    // Colorize boolean values
    str = str.replace(/(?<!")\b(true|false)\b(?!")/g, `${colors.boolean}$1${colors.reset}`);

    // Colorize null values
    str = str.replace(/(?<!")\bnull\b(?!")/g, `${colors.null}null${colors.reset}`);

    // Highlight special placeholder values
    str = str.replace(/\[Circular\]/g, `${colors.special}[Circular]${colors.reset}`);
    str = str.replace(/\[undefined\]/g, `${colors.special}[undefined]${colors.reset}`);

    // Colorize function string representations
    str = str.replace(/"function.*?[^\\]"/gs, `${colors.func}$&${colors.reset}`);
    return str;
  }

  /**
   * Colorizes a JSON string using the active or optionally overridden color set.
   * @param {string} json - The JSON string to format.
   * @param {ColorsList} [customColors] - Optional temporary color override.
   * @returns {string}
   */
  colorize(json, customColors = {}) {
    const colors = { ...this.#colors, ...customColors };
    return this.#colorizeJSON(json, colors);
  }

  /**
   * Returns the currently active color scheme.
   * @returns {ColorsList}
   */
  getColors() {
    return { ...this.#colors };
  }

  /**
   * Updates the current color scheme with a partial override.
   * @param {Partial<ColorsList>} newColors
   */
  updateColors(newColors) {
    Object.assign(this.#colors, newColors);
  }

  /**
   * Resets the current color scheme to the default preset.
   */
  resetColors() {
    this.#colors = { ...ColorSafeStringify.#PRESETS.default };
  }

  /**
   * Loads a color preset by name.
   * @param {string} presetName - Name of the preset to load.
   * @throws Will throw if the preset doesn't exist.
   */
  loadColorPreset(presetName) {
    const preset = ColorSafeStringify.#PRESETS[presetName];
    if (!preset) throw new Error(`Preset "${presetName}" not found.`);
    this.#colors = { ...preset };
  }

  /**
   * Saves a new custom color preset.
   * @param {string} name - Name of the new preset.
   * @param {ColorsList} colors - ANSI color map to save.
   */
  saveColorPreset(name, colors) {
    ColorSafeStringify.#PRESETS[name] = { ...colors };
  }

  /**
   * Returns a list of all available color preset names.
   * @returns {string[]}
   */
  getAvailablePresets() {
    return Object.keys(ColorSafeStringify.#PRESETS);
  }
}

export default ColorSafeStringify;
