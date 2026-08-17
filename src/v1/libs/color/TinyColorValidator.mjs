/**
 * Represents the allowed angle unit types for CSS color functions.
 *
 * - `deg` → Degrees (0–360).
 * - `grad` → Gradians (0–400).
 * - `rad` → Radians (0–2π).
 * - `turn` → Turns (0–1).
 *
 * @typedef {'deg' | 'grad' | 'rad' | 'turn'} AngleUnit
 */

/**
 * Represents the type of a CSS color.
 *
 * - `'hex'` → HEX color (`#RGB` / `#RRGGBB`)
 * - `'hexa'` → HEX with alpha (`#RRGGBBAA`)
 * - `'rgb'` → RGB color (`rgb(r, g, b)`)
 * - `'rgba'` → RGB with alpha (`rgba(r, g, b, a)`)
 * - `'hsl'` → HSL color (`hsl(h, s%, l%)`)
 * - `'hsla'` → HSL with alpha (`hsla(h, s%, l%, a)`)
 * - `'hwb'` → HWB color (`hwb(hue, whiteness%, blackness%)`)
 * - `'lab'` → CIELAB color (`lab(L a b)`)
 * - `'lch'` → LCH color (`lch(L C H)`)
 * - `'name'` → Standard HTML color name (e.g., `red`, `blue`)
 * - `'specialName'` → CSS special keywords (`transparent`, `currentColor`)
 *
 * @typedef {'hex'|'hexa'|'rgb'|'rgba'|'hsl'|'hsla'|'hwb'|'lab'|'lch'|'name'|'specialName'} ColorTypes
 */

/**
 * Utility class for validating and parsing CSS color values.
 *
 * Supports multiple CSS color syntaxes:
 * - **Hexadecimal**: `#RGB`, `#RRGGBB`, `#RRGGBBAA`
 * - **RGB/RGBA**: `rgb(r, g, b)`, `rgba(r, g, b, a)`
 * - **HSL/HSLA**: `hsl(h, s%, l%)`, `hsla(h, s%, l%, a)`
 * - **HWB**: `hwb(hue whiteness% blackness%)`
 * - **CIELAB**: `lab(L a b)`
 * - **LCH**: `lch(L C H)`
 * - **Named colors**: standard HTML color names (e.g., `red`, `blue`, `rebeccapurple`)
 * - **Special keywords**: `transparent`, `currentColor`
 *
 * Features:
 * - Provides validation (`isHex`, `isRgb`, `isHsl`, etc.) for each format.
 * - Provides parsing methods (`parseRgb`, `parseHsl`, etc.) returning numeric components.
 * - Allows extending and managing HTML color names and special keywords dynamically.
 *
 * Example:
 * ```js
 * const validator = new TinyColorValidator("rgb(255, 0, 0)");
 * console.log(validator.isRgb());   // true
 * console.log(validator.parseRgb()); // [255, 0, 0]
 * ```
 *
 * @class
 * @template {string} TinyColorValidatorT
 */
class TinyColorValidator {
  // Utility regex patterns
  static #HEX_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  static #HEXA_REGEX = /^#([A-Fa-f0-9]{8})$/;

  // Alpha 0-1
  static #ALPHA = `(0|1|0?\\.\\d+)`;

  // Matches integers from 0 to 255
  static #NUM_0_255 = `(0|[1-9]\\d?|1\\d{2}|2[0-4]\\d|25[0-5])`;

  // Numbers 0-360
  static #NUM_0_360 = `(0|[1-9]\\d?|[1-2]\\d{2}|3[0-5]\\d|360)`;
  // Numbers 0-100
  static #NUM_0_100 = `(0|[1-9]?\\d|100)`;

  // RGB
  static #RGB_REGEX = new RegExp(
    `^rgb\\(\\s*${TinyColorValidator.#NUM_0_255}\\s*,\\s*${TinyColorValidator.#NUM_0_255}\\s*,\\s*${TinyColorValidator.#NUM_0_255}\\s*\\)$`,
  );
  static #RGBA_REGEX = new RegExp(
    `^rgba\\(\\s*${TinyColorValidator.#NUM_0_255}\\s*,\\s*${TinyColorValidator.#NUM_0_255}\\s*,\\s*${TinyColorValidator.#NUM_0_255}\\s*,\\s*${TinyColorValidator.#ALPHA}\\s*\\)$`,
  );

  // HSL
  static #HSL_REGEX = new RegExp(
    `^hsl\\(\\s*${TinyColorValidator.#NUM_0_360}\\s*,\\s*${TinyColorValidator.#NUM_0_100}%\\s*,\\s*${TinyColorValidator.#NUM_0_100}%\\s*\\)$`,
  );
  static #HSLA_REGEX = new RegExp(
    `^hsla\\(\\s*${TinyColorValidator.#NUM_0_360}\\s*,\\s*${TinyColorValidator.#NUM_0_100}%\\s*,\\s*${TinyColorValidator.#NUM_0_100}%\\s*,\\s*${TinyColorValidator.#ALPHA}\\s*\\)$`,
  );

  // HWB

  static #HWB_REGEX = new RegExp(
    `^hwb\\(\\s*${TinyColorValidator.#NUM_0_360}(deg|grad|rad|turn)?\\s*${TinyColorValidator.#NUM_0_100}%\\s*${TinyColorValidator.#NUM_0_100}%\\s*\\)$`,
  );

  // LAB

  static #LAB_AB = `(-?\\d+)`;

  static #LAB_REGEX = new RegExp(
    `^lab\\(\\s*${TinyColorValidator.#NUM_0_100}%?\\s*${TinyColorValidator.#LAB_AB}%?\\s*${TinyColorValidator.#LAB_AB}%?\\s*\\)$`,
  );

  // LCH

  static #LCH_REGEX = new RegExp(
    `^lch\\(\\s*${TinyColorValidator.#NUM_0_100}%?\\s*${TinyColorValidator.#NUM_0_100}%?\\s*${TinyColorValidator.#NUM_0_360}(deg|grad|rad|turn)?\\s*\\)$`,
  );

  // CSS Level 4 color names
  static #HTML_COLOR_NAMES = new Set([
    'aliceblue',
    'antiquewhite',
    'aqua',
    'aquamarine',
    'azure',
    'beige',
    'bisque',
    'black',
    'blanchedalmond',
    'blue',
    'blueviolet',
    'brown',
    'burlywood',
    'cadetblue',
    'chartreuse',
    'chocolate',
    'coral',
    'cornflowerblue',
    'cornsilk',
    'crimson',
    'cyan',
    'darkblue',
    'darkcyan',
    'darkgoldenrod',
    'darkgray',
    'darkgreen',
    'darkgrey',
    'darkkhaki',
    'darkmagenta',
    'darkolivegreen',
    'darkorange',
    'darkorchid',
    'darkred',
    'darksalmon',
    'darkseagreen',
    'darkslateblue',
    'darkslategray',
    'darkslategrey',
    'darkturquoise',
    'darkviolet',
    'deeppink',
    'deepskyblue',
    'dimgray',
    'dimgrey',
    'dodgerblue',
    'firebrick',
    'floralwhite',
    'forestgreen',
    'fuchsia',
    'gainsboro',
    'ghostwhite',
    'gold',
    'goldenrod',
    'gray',
    'green',
    'greenyellow',
    'grey',
    'honeydew',
    'hotpink',
    'indianred',
    'indigo',
    'ivory',
    'khaki',
    'lavender',
    'lavenderblush',
    'lawngreen',
    'lemonchiffon',
    'lightblue',
    'lightcoral',
    'lightcyan',
    'lightgoldenrodyellow',
    'lightgray',
    'lightgreen',
    'lightgrey',
    'lightpink',
    'lightsalmon',
    'lightseagreen',
    'lightskyblue',
    'lightslategray',
    'lightslategrey',
    'lightsteelblue',
    'lightyellow',
    'lime',
    'limegreen',
    'linen',
    'magenta',
    'maroon',
    'mediumaquamarine',
    'mediumblue',
    'mediumorchid',
    'mediumpurple',
    'mediumseagreen',
    'mediumslateblue',
    'mediumspringgreen',
    'mediumturquoise',
    'mediumvioletred',
    'midnightblue',
    'mintcream',
    'mistyrose',
    'moccasin',
    'navajowhite',
    'navy',
    'oldlace',
    'olive',
    'olivedrab',
    'orange',
    'orangered',
    'orchid',
    'palegoldenrod',
    'palegreen',
    'paleturquoise',
    'palevioletred',
    'papayawhip',
    'peachpuff',
    'peru',
    'pink',
    'plum',
    'powderblue',
    'purple',
    'rebeccapurple',
    'red',
    'rosybrown',
    'royalblue',
    'saddlebrown',
    'salmon',
    'sandybrown',
    'seagreen',
    'seashell',
    'sienna',
    'silver',
    'skyblue',
    'slateblue',
    'slategray',
    'slategrey',
    'snow',
    'springgreen',
    'steelblue',
    'tan',
    'teal',
    'thistle',
    'tomato',
    'turquoise',
    'violet',
    'wheat',
    'white',
    'whitesmoke',
    'yellow',
    'yellowgreen',
  ]);

  // CSS system special names
  static #SPECIAL_COLOR_NAMES = new Set(['transparent', 'currentColor']);

  // --- HTML Color Names ---
  /**
   * Returns all HTML color names as an array.
   * @returns {string[]}
   */
  static getNames() {
    return Array.from(TinyColorValidator.#HTML_COLOR_NAMES);
  }

  /**
   * Adds a new HTML color name.
   * @param {string} name
   * @returns {boolean} True if added, false if it already existed.
   */
  static addName(name) {
    const before = TinyColorValidator.#HTML_COLOR_NAMES.size;
    TinyColorValidator.#HTML_COLOR_NAMES.add(name.toLowerCase());
    return TinyColorValidator.#HTML_COLOR_NAMES.size > before;
  }

  /**
   * Removes an HTML color name.
   * @param {string} name
   * @returns {boolean} True if removed, false if not found.
   */
  static removeName(name) {
    return TinyColorValidator.#HTML_COLOR_NAMES.delete(name.toLowerCase());
  }

  /**
   * Checks if an HTML color name exists.
   * @param {string} name
   * @returns {boolean}
   */
  static hasName(name) {
    return TinyColorValidator.#HTML_COLOR_NAMES.has(name.toLowerCase());
  }

  // --- Special Color Names ---
  /**
   * Returns all special color names as an array.
   * @returns {string[]}
   */
  static getSpecialNames() {
    return Array.from(TinyColorValidator.#SPECIAL_COLOR_NAMES);
  }

  /**
   * Adds a new special color name.
   * @param {string} name
   * @returns {boolean} True if added, false if it already existed.
   */
  static addSpecialName(name) {
    const before = TinyColorValidator.#SPECIAL_COLOR_NAMES.size;
    TinyColorValidator.#SPECIAL_COLOR_NAMES.add(name);
    return TinyColorValidator.#SPECIAL_COLOR_NAMES.size > before;
  }

  /**
   * Removes a special color name.
   * @param {string} name
   * @returns {boolean} True if removed, false if not found.
   */
  static removeSpecialName(name) {
    return TinyColorValidator.#SPECIAL_COLOR_NAMES.delete(name);
  }

  /**
   * Checks if a special color name exists.
   * @param {string} name
   * @returns {boolean}
   */
  static hasSpecialName(name) {
    return TinyColorValidator.#SPECIAL_COLOR_NAMES.has(name);
  }

  // Validators

  /**
   * Internal storage for the code value.
   * @type {string}
   */
  #code;

  /**
   * Gets the current code.
   * @returns {string} The stored code.
   */
  get code() {
    return this.#code;
  }

  /**
   * Internal storage for the code type.
   * @type {ColorTypes|null}
   */
  #type;

  /**
   * Gets the current code.
   * @returns {ColorTypes|null} The stored code type.
   */
  get type() {
    return this.#type;
  }

  /**
   * Creates a new instance of Example.
   * @param {TinyColorValidatorT} code - The code to be stored.
   */
  constructor(code) {
    this.#code = code;
    this.#type = TinyColorValidator.isColor(this.#code);
  }

  /**
   * Validates if a string is a valid HEX color (#RGB, #RRGGBB).
   * @param {string} input - The input string to validate.
   * @returns {boolean} True if the input is a valid HEX color.
   * @throws {TypeError} If input is not a string.
   */
  static isHex(input) {
    if (typeof input !== 'string') throw new TypeError('isHex: input must be a string.');
    return TinyColorValidator.#HEX_REGEX.test(input.trim());
  }

  /**
   * Validates if a string is a valid HEX color (#RGB, #RRGGBB).
   * @returns {boolean} True if the input is a valid HEX color.
   * @throws {TypeError} If input is not a string.
   */
  isHex() {
    return TinyColorValidator.isHex(this.#code);
  }

  /**
   * Validates if a string is a valid HEX color (#RRGGBBAA).
   * @param {string} input - The input string to validate.
   * @returns {boolean} True if the input is a valid HEXA color.
   * @throws {TypeError} If input is not a string.
   */
  static isHexa(input) {
    if (typeof input !== 'string') throw new TypeError('isHexa: input must be a string.');
    return TinyColorValidator.#HEXA_REGEX.test(input.trim());
  }

  /**
   * Validates if a string is a valid HEX color (#RRGGBBAA).
   * @returns {boolean} True if the input is a valid HEXA color.
   * @throws {TypeError} If input is not a string.
   */
  isHexa() {
    return TinyColorValidator.isHexa(this.#code);
  }

  /**
   * Validates if a string is a valid RGB color.
   * @param {string} input - The input string to validate.
   * @returns {boolean} True if the input is a valid RGB color.
   * @throws {TypeError} If input is not a string.
   */
  static isRgb(input) {
    if (typeof input !== 'string') throw new TypeError('isRgb: input must be a string.');
    return TinyColorValidator.#RGB_REGEX.test(input.trim());
  }

  /**
   * Validates if a string is a valid RGB color.
   * @returns {boolean} True if the input is a valid RGB color.
   * @throws {TypeError} If input is not a string.
   */
  isRgb() {
    return TinyColorValidator.isRgb(this.#code);
  }

  /**
   * Validates if a string is a valid RGBA color.
   * @param {string} input - The input string to validate.
   * @returns {boolean} True if the input is a valid RGBA color.
   * @throws {TypeError} If input is not a string.
   */
  static isRgba(input) {
    if (typeof input !== 'string') throw new TypeError('isRgba: input must be a string.');
    return TinyColorValidator.#RGBA_REGEX.test(input.trim());
  }

  /**
   * Validates if a string is a valid RGBA color.
   * @returns {boolean} True if the input is a valid RGBA color.
   * @throws {TypeError} If input is not a string.
   */
  isRgba() {
    return TinyColorValidator.isRgba(this.#code);
  }

  /**
   * Validates if a string is a valid HSL color.
   * @param {string} input - The input string to validate.
   * @returns {boolean} True if the input is a valid HSL color.
   * @throws {TypeError} If input is not a string.
   */
  static isHsl(input) {
    if (typeof input !== 'string') throw new TypeError('isHsl: input must be a string.');
    return TinyColorValidator.#HSL_REGEX.test(input.trim());
  }

  /**
   * Validates if a string is a valid HSL color.
   * @returns {boolean} True if the input is a valid HSL color.
   * @throws {TypeError} If input is not a string.
   */
  isHsl() {
    return TinyColorValidator.isHsl(this.#code);
  }

  /**
   * Validates if a string is a valid HSLA color.
   * @param {string} input - The input string to validate.
   * @returns {boolean} True if the input is a valid HSLA color.
   * @throws {TypeError} If input is not a string.
   */
  static isHsla(input) {
    if (typeof input !== 'string') throw new TypeError('isHsla: input must be a string.');
    return TinyColorValidator.#HSLA_REGEX.test(input.trim());
  }

  /**
   * Validates if a string is a valid HSLA color.
   * @returns {boolean} True if the input is a valid HSLA color.
   * @throws {TypeError} If input is not a string.
   */
  isHsla() {
    return TinyColorValidator.isHsla(this.#code);
  }

  /**
   * Validates if a string is a valid HWB color.
   * @param {string} input - The input string to validate.
   * @returns {boolean} True if the input is a valid HWB color.
   * @throws {TypeError} If input is not a string.
   */
  static isHwb(input) {
    if (typeof input !== 'string') throw new TypeError('isHwb: input must be a string.');
    return TinyColorValidator.#HWB_REGEX.test(input.trim());
  }

  /**
   * Validates if a string is a valid HWB color.
   * @returns {boolean} True if the input is a valid HWB color.
   * @throws {TypeError} If input is not a string.
   */
  isHwb() {
    return TinyColorValidator.isHwb(this.#code);
  }

  /**
   * Validates if a string is a valid CIELAB color.
   * @param {string} input - The input string to validate.
   * @returns {boolean} True if the input is a valid Lab color.
   * @throws {TypeError} If input is not a string.
   */
  static isLab(input) {
    if (typeof input !== 'string') throw new TypeError('isLab: input must be a string.');
    return TinyColorValidator.#LAB_REGEX.test(input.trim());
  }

  /**
   * Validates if a string is a valid CIELAB color.
   * @returns {boolean} True if the input is a valid Lab color.
   * @throws {TypeError} If input is not a string.
   */
  isLab() {
    return TinyColorValidator.isLab(this.#code);
  }

  /**
   * Validates if a string is a valid LCH color.
   * @param {string} input - The input string to validate.
   * @returns {boolean} True if the input is a valid LCH color.
   * @throws {TypeError} If input is not a string.
   */
  static isLch(input) {
    if (typeof input !== 'string') throw new TypeError('isLch: input must be a string.');
    return TinyColorValidator.#LCH_REGEX.test(input.trim());
  }

  /**
   * Validates if a string is a valid LCH color.
   * @returns {boolean} True if the input is a valid LCH color.
   * @throws {TypeError} If input is not a string.
   */
  isLch() {
    return TinyColorValidator.isLch(this.#code);
  }

  /**
   * Validates if a string matches a standard HTML color name.
   * @param {string} input - The input string to validate.
   * @returns {boolean} True if the input is a valid HTML color name.
   * @throws {TypeError} If input is not a string.
   */
  static isName(input) {
    if (typeof input !== 'string') throw new TypeError('isName: input must be a string.');
    return TinyColorValidator.#HTML_COLOR_NAMES.has(input.trim().toLowerCase());
  }

  /**
   * Validates if a string matches a standard HTML color name.
   * @returns {boolean} True if the input is a valid HTML color name.
   * @throws {TypeError} If input is not a string.
   */
  isName() {
    return TinyColorValidator.isName(this.#code);
  }

  /**
   * Validates if a string matches a special CSS color keyword.
   * @param {string} input - The input string to validate.
   * @returns {boolean} True if the input is a special color keyword.
   * @throws {TypeError} If input is not a string.
   */
  static isSpecialName(input) {
    if (typeof input !== 'string') throw new TypeError('isSpecialName: input must be a string.');
    return TinyColorValidator.#SPECIAL_COLOR_NAMES.has(input.trim());
  }

  /**
   * Validates if a string matches a special CSS color keyword.
   * @returns {boolean} True if the input is a special color keyword.
   * @throws {TypeError} If input is not a string.
   */
  isSpecialName() {
    return TinyColorValidator.isSpecialName(this.#code);
  }

  /**
   * Validates if a string is any valid CSS color (HEX, RGB, HSL, HWB, Lab, LCH, name, or special name).
   * @param {string} input - The input string to validate.
   * @returns {ColorTypes|null} if the input is a valid CSS color.
   * @throws {TypeError} If input is not a string.
   */
  static isColor(input) {
    if (typeof input !== 'string') throw new TypeError('isColor: input must be a string.');
    if (TinyColorValidator.isHex(input)) return 'hex';
    else if (TinyColorValidator.isHexa(input)) return 'hexa';
    else if (TinyColorValidator.isRgb(input)) return 'rgb';
    else if (TinyColorValidator.isRgba(input)) return 'rgba';
    else if (TinyColorValidator.isHsl(input)) return 'hsl';
    else if (TinyColorValidator.isHsla(input)) return 'hsla';
    else if (TinyColorValidator.isHwb(input)) return 'hwb';
    else if (TinyColorValidator.isLab(input)) return 'lab';
    else if (TinyColorValidator.isLch(input)) return 'lch';
    else if (TinyColorValidator.isName(input)) return 'name';
    else if (TinyColorValidator.isSpecialName(input)) return 'specialName';
    return null;
  }

  /**
   * Automatically parses the stored code based on its detected type.
   * @returns {any[]|string|null} Parsed color components according to type, or null if invalid.
   */
  parse() {
    switch (this.#type) {
      case 'hex':
        return TinyColorValidator.parseHex(this.code);
      case 'hexa':
        return TinyColorValidator.parseHexa(this.code);
      case 'rgb':
        return TinyColorValidator.parseRgb(this.code);
      case 'rgba':
        return TinyColorValidator.parseRgba(this.code);
      case 'hsl':
        return TinyColorValidator.parseHsl(this.code);
      case 'hsla':
        return TinyColorValidator.parseHsla(this.code);
      case 'hwb':
        return TinyColorValidator.parseHwb(this.code);
      case 'lab':
        return TinyColorValidator.parseLab(this.code);
      case 'lch':
        return TinyColorValidator.parseLch(this.code);
      case 'name':
      case 'specialName':
        return this.#code.trim().toLowerCase();
      default:
        return null;
    }
  }

  // --- HEX / HEXA ---

  /**
   * Parses a HEX color string (#RGB or #RRGGBB).
   * Returns the regex match array with captured groups or null if invalid.
   * @param {string} input - The input string to parse.
   * @returns {string|null} Regex match result with captured groups, or null if not valid.
   * @throws {TypeError} If input is not a string.
   */
  static parseHex(input) {
    if (typeof input !== 'string') throw new TypeError('parseHex: input must be a string.');
    const result = new RegExp(TinyColorValidator.#HEX_REGEX, 'gm').exec(input.trim());
    if (!result) return null;
    return result[1];
  }

  /**
   * Parses a HEX color string (#RGB or #RRGGBB).
   * Returns the regex match array with captured groups or null if invalid.
   * @returns {string|null} Regex match result with captured groups, or null if not valid.
   * @throws {TypeError} If input is not a string.
   */
  parseHex() {
    return TinyColorValidator.parseHex(this.#code);
  }

  /**
   * Parses a HEXA color string (#RRGGBBAA).
   * Returns the regex match array with captured groups or null if invalid.
   * @param {string} input - The input string to parse.
   * @returns {string|null} Regex match result with captured groups, or null if not valid.
   * @throws {TypeError} If input is not a string.
   */
  static parseHexa(input) {
    if (typeof input !== 'string') throw new TypeError('parseHexa: input must be a string.');
    const result = new RegExp(TinyColorValidator.#HEXA_REGEX, 'gm').exec(input.trim());
    if (!result) return null;
    return result[1];
  }

  /**
   * Parses a HEXA color string (#RRGGBBAA).
   * Returns the regex match array with captured groups or null if invalid.
   * @returns {string|null} Regex match result with captured groups, or null if not valid.
   * @throws {TypeError} If input is not a string.
   */
  parseHexa() {
    return TinyColorValidator.parseHexa(this.#code);
  }

  // --- RGB / RGBA ---

  /**
   * Parses an RGB color string (rgb(r, g, b)).
   * Returns the regex match array with captured groups for r, g, and b or null if invalid.
   * @param {string} input - The input string to parse.
   * @returns {[number, number, number]|null} Regex match result with groups [r, g, b], or null if not valid.
   * @throws {TypeError} If input is not a string.
   */
  static parseRgb(input) {
    if (typeof input !== 'string') throw new TypeError('parseRgb: input must be a string.');
    const result = new RegExp(TinyColorValidator.#RGB_REGEX, 'gm').exec(input.trim());
    if (!result) return null;
    return [parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])];
  }

  /**
   * Parses an RGB color string (rgb(r, g, b)).
   * Returns the regex match array with captured groups for r, g, and b or null if invalid.
   * @returns {[number, number, number]|null} Regex match result with groups [r, g, b], or null if not valid.
   * @throws {TypeError} If input is not a string.
   */
  parseRgb() {
    return TinyColorValidator.parseRgb(this.#code);
  }

  /**
   * Parses an RGBA color string (rgba(r, g, b, a)).
   * Returns the regex match array with captured groups for r, g, b, and a or null if invalid.
   * @param {string} input - The input string to parse.
   * @returns {[number, number, number, number]|null} Regex match result with groups [r, g, b, a], or null if not valid.
   * @throws {TypeError} If input is not a string.
   */
  static parseRgba(input) {
    if (typeof input !== 'string') throw new TypeError('parseRgba: input must be a string.');
    const result = new RegExp(TinyColorValidator.#RGBA_REGEX, 'gm').exec(input.trim());
    if (!result) return null;
    return [
      parseFloat(result[1]),
      parseFloat(result[2]),
      parseFloat(result[3]),
      parseFloat(result[4]),
    ];
  }

  /**
   * Parses an RGBA color string (rgba(r, g, b, a)).
   * Returns the regex match array with captured groups for r, g, b, and a or null if invalid.
   * @returns {[number, number, number, number]|null} Regex match result with groups [r, g, b, a], or null if not valid.
   * @throws {TypeError} If input is not a string.
   */
  parseRgba() {
    return TinyColorValidator.parseRgba(this.#code);
  }

  // --- HSL / HSLA ---

  /**
   * Parses an HSL color string (hsl(h, s%, l%)).
   * Returns the regex match array with captured groups for h, s, and l or null if invalid.
   * @param {string} input - The input string to parse.
   * @returns {[number, number, number]|null} Regex match result with groups [h, s, l], or null if not valid.
   * @throws {TypeError} If input is not a string.
   */
  static parseHsl(input) {
    if (typeof input !== 'string') throw new TypeError('parseHsl: input must be a string.');
    const result = new RegExp(TinyColorValidator.#HSL_REGEX, 'gm').exec(input.trim());
    if (!result) return null;
    return [parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])];
  }

  /**
   * Parses an HSL color string (hsl(h, s%, l%)).
   * Returns the regex match array with captured groups for h, s, and l or null if invalid.
   * @returns {[number, number, number]|null} Regex match result with groups [h, s, l], or null if not valid.
   * @throws {TypeError} If input is not a string.
   */
  parseHsl() {
    return TinyColorValidator.parseHsl(this.#code);
  }

  /**
   * Parses an HSLA color string (hsla(h, s%, l%, a)).
   * Returns the regex match array with captured groups for h, s, l, and a or null if invalid.
   * @param {string} input - The input string to parse.
   * @returns {[number, number, number, number]|null} Regex match result with groups [h, s, l, a], or null if not valid.
   * @throws {TypeError} If input is not a string.
   */
  static parseHsla(input) {
    if (typeof input !== 'string') throw new TypeError('parseHsla: input must be a string.');
    const result = new RegExp(TinyColorValidator.#HSLA_REGEX, 'gm').exec(input.trim());
    if (!result) return null;
    return [
      parseFloat(result[1]),
      parseFloat(result[2]),
      parseFloat(result[3]),
      parseFloat(result[4]),
    ];
  }

  /**
   * Parses an HSLA color string (hsla(h, s%, l%, a)).
   * Returns the regex match array with captured groups for h, s, l, and a or null if invalid.
   * @returns {[number, number, number, number]|null} Regex match result with groups [h, s, l, a], or null if not valid.
   * @throws {TypeError} If input is not a string.
   */
  parseHsla() {
    return TinyColorValidator.parseHsla(this.#code);
  }

  // --- HWB ---

  /**
   * Parses an HWB color string (hwb(hue, whiteness%, blackness%[, alpha])).
   * Returns the regex match array with captured groups or null if invalid.
   * @param {string} input - The input string to parse.
   * @returns {[number, AngleUnit|null, number, number]|null} Regex match result with captured groups, or null if not valid.
   * @throws {TypeError} If input is not a string.
   */
  static parseHwb(input) {
    if (typeof input !== 'string') throw new TypeError('parseHwb: input must be a string.');
    const result = new RegExp(TinyColorValidator.#HWB_REGEX, 'gm').exec(input.trim());
    if (!result) return null;
    return [
      parseFloat(result[1]),
      // @ts-ignore
      result[2] ?? null,
      parseFloat(result[3]),
      parseFloat(result[4]),
    ];
  }

  /**
   * Parses an HWB color string (hwb(hue, whiteness%, blackness%[, alpha])).
   * Returns the regex match array with captured groups or null if invalid.
   * @returns {[number, AngleUnit|null, number, number]|null} Regex match result with captured groups, or null if not valid.
   * @throws {TypeError} If input is not a string.
   */
  parseHwb() {
    return TinyColorValidator.parseHwb(this.#code);
  }

  // --- Lab ---

  /**
   * Parses a CIELAB color string (lab(L a b[/alpha])).
   * Returns the regex match array with captured groups or null if invalid.
   * @param {string} input - The input string to parse.
   * @returns {[number, number, number]|null} Regex match result with captured groups, or null if not valid.
   * @throws {TypeError} If input is not a string.
   */
  static parseLab(input) {
    if (typeof input !== 'string') throw new TypeError('parseLab: input must be a string.');
    const result = new RegExp(TinyColorValidator.#LAB_REGEX, 'gm').exec(input.trim());
    if (!result) return null;
    return [parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])];
  }

  /**
   * Parses a CIELAB color string (lab(L a b[/alpha])).
   * Returns the regex match array with captured groups or null if invalid.
   * @returns {[number, number, number]|null} Regex match result with captured groups, or null if not valid.
   * @throws {TypeError} If input is not a string.
   */
  parseLab() {
    return TinyColorValidator.parseLab(this.#code);
  }

  // --- LCH ---

  /**
   * Parses an LCH color string (lch(L C H[/alpha])).
   * Returns the regex match array with captured groups or null if invalid.
   * @param {string} input - The input string to parse.
   * @returns {[number, number, number, AngleUnit|null]|null} Regex match result with captured groups, or null if not valid.
   * @throws {TypeError} If input is not a string.
   */
  static parseLch(input) {
    if (typeof input !== 'string') throw new TypeError('parseLch: input must be a string.');
    const result = new RegExp(TinyColorValidator.#LCH_REGEX, 'gm').exec(input.trim());
    if (!result) return null;
    return [
      parseFloat(result[1]),
      parseFloat(result[2]),
      parseFloat(result[3]),
      // @ts-ignore
      result[4] ?? null,
    ];
  }

  /**
   * Parses an LCH color string (lch(L C H[/alpha])).
   * Returns the regex match array with captured groups or null if invalid.
   * @returns {[number, number, number, AngleUnit|null]|null} Regex match result with captured groups, or null if not valid.
   * @throws {TypeError} If input is not a string.
   */
  parseLch() {
    return TinyColorValidator.parseLch(this.#code);
  }
}

export default TinyColorValidator;
