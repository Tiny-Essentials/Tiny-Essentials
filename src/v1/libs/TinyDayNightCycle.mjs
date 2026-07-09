import { createCheckDestroyed } from './utils.mjs';

const checkDestroy = createCheckDestroyed('TinyDayNightCycle');

/**
 * Represents a mapping of weather type names to their selected values.
 * Each key is the name of a weather type, and the value is either:
 * - a string containing the selected weather configuration name, or
 * - `null` if no selection has been made.
 *
 * @typedef {Record<string, string|null>} SelectedWeather
 */

/**
 * Callback used to dynamically calculate weather probabilities.
 *
 * @callback WeatherCallback
 * @param {Object} configs - Contextual information about the current time and weather state.
 * @param {number} configs.hour - Current in-game hour (0–23).
 * @param {number} configs.minute - Current in-game minute (0–59).
 * @param {number} configs.currentMinutes - Minutes since midnight (0–1439).
 * @param {boolean} configs.isDay - Whether it's currently daytime.
 * @param {string} configs.season - Current season.
 * @param {SelectedWeather} configs.weather - Current active weather types or nulls if none.
 * @returns {number} Probability weight for the weather type.
 */

/**
 * Represents the complete set of weather configurations.
 *
 * @typedef {Object} WeatherCfgs
 * @property {WeatherCfg} default - Default weather configuration applied when no specific condition matches.
 * @property {WeatherCfg} day - Weather configuration used during daytime hours.
 * @property {WeatherCfg} night - Weather configuration used during nighttime hours.
 * @property {Record<string, WeatherCfg>} hours - Specific weather configurations mapped by hour (e.g., `"06": WeatherCfg`).
 * @property {Record<string, WeatherCfg>} seasons - Specific weather configurations mapped by season name.
 */

/**
 * A weather configuration object mapping weather types to probability weights
 * or dynamic WeatherCallback functions.
 *
 * @typedef {Record<string, number | WeatherCallback>} WeatherCfg
 */

/**
 * Weather data with resolved numeric probability values.
 *
 * @typedef {Record<string, number>} WeatherData
 */

/**
 * Represents the data for a moon's current phase.
 *
 * @typedef {Object} MoonData
 * @property {string} name - The name of the moon.
 * @property {number} phaseIndex - The current phase index (zero-based) within the moon's cycle.
 * @property {string} phaseName - The descriptive name of the current phase.
 * @property {number} cycleLength - The total number of phases/days in the moon's full cycle.
 */

/**
 * Represents the raw data structure for a moon's cycle.
 *
 * @typedef {Object} MoonRaw
 * @property {string} name - The name of the moon.
 * @property {number} cycleLength - Total number of phases in the moon's cycle.
 * @property {number} currentPhase - The current phase index (0-based).
 * @property {string[]} [phaseNames] - Optional list of names for each phase in the cycle.
 */

/**
 * TinyDayNightCycle is a lightweight and flexible JavaScript library designed to simulate day and
 * night cycles along with seasonal changes, moons, weather patterns, and in-game time tracking.
 * It allows you to manage and customize time progression, including hours,
 * minutes, and seconds, as well as date transitions with support for variable month lengths and years.
 *
 * This system also supports dynamic weather changes, moon phases,
 * and seasonal adjustments, making it ideal for game development, simulations,
 * or any interactive experience that requires realistic or custom time and environmental cycles.
 *
 * With easy-to-use methods and configurable settings, TinyDayNightCycle provides
 * you with precise control over the flow of time and weather in your application.
 *
 * This class provides:
 * - Customizable day/night cycle with variable sunrise/sunset.
 * - Calendar system with adjustable month lengths.
 * - Dynamic weather with multiple configurable probability layers.
 * - Multi-moon phase tracking.
 *
 * Time and date calculations are independent from the real world and can run at any speed.
 */
class TinyDayNightCycle {
  /**
   * Whether to automatically adjust `daySize`, `hourSize`, and `minuteSize` when one of them changes.
   * @type {boolean}
   */
  #autoSizeAdjuste = true;

  /**
   * Number of in-game seconds representing a full day.
   * @type {number}
   */
  #daySize = 86400;

  /**
   * Number of in-game seconds representing a full hour.
   * @type {number}
   */
  #hourSize = 3600;

  /**
   * Number of in-game seconds representing a full minute.
   * @type {number}
   */
  #minuteSize = 60;

  /**
   * Stores season configurations, where each season name maps to an array of numbers.
   * The number array represent month list.
   *
   * @type {Map<string, number[]>}
   */
  #seasons = new Map();

  /**
   * Array of tracked moons with independent phases.
   * @type {MoonRaw[]}
   */
  #moons = [];

  /**
   * @type {number} Hour of the day start (0–23).
   */
  #dayStart;
  /**
   * @type {number} Hour of the night start (0–23).
   */
  #nightStart;

  /**
   * @type {SelectedWeather} Currently active weather type.
   */
  #weather = { main: null };

  /**
   * @type {number} Current time in seconds since midnight (0–86399).
   */
  #currentSeconds = 0;

  /**
   * @type {number} Current time in minutes since midnight (0–1439).
   */
  #currentMinutes = 0;

  /**
   * @type {number} Current time in hours since midnight (0–24).
   */
  #currentHours = 0;

  /**
   * @type {string} Current season.
   */
  #currentSeason = '';

  /**
   * Current day of the month.
   * @type {number}
   */
  #currentDay = 1;

  /**
   * Current month number.
   * @type {number}
   */
  #currentMonth = 1;

  /**
   * Current year count.
   * @type {number}
   */
  #currentYear = 1;

  /**
   * Whether this instance has been destroyed.
   * @type {boolean}
   */
  #isDestroyed = false;

  /**
   * Number of days in each month. Keys are month numbers.
   * Can be customized to any structure.
   * @type {number[]}
   */
  #monthDays = [31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31];

  /**
   * Weather configuration layers:
   * - `default`: Global fallback probabilities.
   * - `day` / `night`: Applied depending on time of day.
   * - `hours`: Specific time ranges (e.g. "06:00-09:00").
   * - `seasons`: Seasonal weather overrides.
   */
  #weatherConfig = {
    /**
     * General fallback probabilities
     * @type {WeatherCfg}
     */
    default: {},
    /**
     * Daytime probabilities
     * @type {WeatherCfg}
     */
    day: {},
    /**
     * Nighttime probabilities
     * @type {WeatherCfg}
     */
    night: {},
    /**
     * Specific hours { "06:00-09:00": {...} }
     * @type {Record<string, WeatherCfg>}
     */
    hours: {},
    /**
     * Seasonal configs { summer: {...}, winter: {...} }
     * @type {Record<string, WeatherCfg>}
     */
    seasons: {},
  };

  /**
   * Duration range for each weather type in minutes.
   * @type {{min: number, max: number}}
   */
  #weatherDuration = { min: 60, max: 180 }; // in minutes

  /**
   * Minutes remaining until the current weather changes.
   * @type {number}
   */
  #weatherTimeLeft = 0;

  /**
   * Gets the number of in-game seconds representing a full day.
   * @returns {number}
   */
  get daySize() {
    checkDestroy(this.#isDestroyed);
    return this.#daySize;
  }

  /**
   * Gets whether automatic size adjustment is enabled.
   * @returns {boolean}
   */
  get autoSizeAdjuste() {
    checkDestroy(this.#isDestroyed);
    return this.#autoSizeAdjuste;
  }

  /**
   * Sets whether automatic size adjustment is enabled.
   * @param {boolean} value - `true` to keep the proportional relation between day, hour, and minute sizes; `false` to disable auto-adjustment.
   * @throws {TypeError} If `value` is not a boolean.
   */
  set autoSizeAdjuste(value) {
    checkDestroy(this.#isDestroyed);
    if (typeof value !== 'boolean') throw new TypeError('autoSizeAdjuste must be a boolean.');
    this.#autoSizeAdjuste = value;
  }

  /**
   * Sets the number of in-game seconds representing a full day.
   * Keeps the proportion based on the current `hourSize` and `minuteSize` if `autoSizeAdjuste` is enabled.
   * @param {number} value - Positive finite number representing seconds in a full day.
   * @throws {Error} If `value` is not a positive finite number.
   */
  set daySize(value) {
    checkDestroy(this.#isDestroyed);
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0)
      throw new Error('daySize must be a positive finite number.');

    const hourRatio = this.#hourSize / this.#daySize;
    const minuteRatio = this.#minuteSize / this.#daySize;

    this.#daySize = value;
    if (this.#autoSizeAdjuste) {
      this.#hourSize = value * hourRatio;
      this.#minuteSize = value * minuteRatio;
    }
  }

  /**
   * Gets the number of in-game seconds representing a full hour.
   * @returns {number}
   */
  get hourSize() {
    checkDestroy(this.#isDestroyed);
    return this.#hourSize;
  }

  /**
   * Sets the number of in-game seconds representing a full hour.
   * Keeps the proportion based on the current `daySize` and `minuteSize` if `autoSizeAdjuste` is enabled.
   * @param {number} value - Positive finite number representing seconds in a full hour.
   * @throws {Error} If `value` is not a positive finite number.
   */
  set hourSize(value) {
    checkDestroy(this.#isDestroyed);
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0)
      throw new Error('hourSize must be a positive finite number.');

    const dayRatio = this.#daySize / this.#hourSize;
    const minuteRatio = this.#minuteSize / this.#hourSize;

    this.#hourSize = value;
    if (this.#autoSizeAdjuste) {
      this.#daySize = value * dayRatio;
      this.#minuteSize = value * minuteRatio;
    }
  }

  /**
   * Gets the number of in-game seconds representing a full minute.
   * @returns {number}
   */
  get minuteSize() {
    checkDestroy(this.#isDestroyed);
    return this.#minuteSize;
  }

  /**
   * Sets the number of in-game seconds representing a full minute.
   * Keeps the proportion based on the current `daySize` and `hourSize` if `autoSizeAdjuste` is enabled.
   * @param {number} value - Positive finite number representing seconds in a full minute.
   * @throws {Error} If `value` is not a positive finite number.
   */
  set minuteSize(value) {
    checkDestroy(this.#isDestroyed);
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0)
      throw new Error('minuteSize must be a positive finite number.');

    const hourRatio = this.#hourSize / this.#minuteSize;
    const dayRatio = this.#daySize / this.#minuteSize;

    this.#minuteSize = value;
    if (this.#autoSizeAdjuste) {
      this.#hourSize = value * hourRatio;
      this.#daySize = value * dayRatio;
    }
  }

  /**
   * Indicates whether this instance has been destroyed.
   * @type {boolean}
   */
  get isDestroyed() {
    return this.#isDestroyed;
  }

  /**
   * Gets the current time in seconds since midnight.
   * @returns {number} Current seconds (0 to 86399).
   */
  get currentSeconds() {
    checkDestroy(this.#isDestroyed);
    return this.#currentSeconds;
  }

  /**
   * Sets the current time in seconds since midnight.
   * Also updates the currentMinutes property accordingly.
   * @param {number} value - Current seconds since midnight (0 to 86399).
   * @throws {TypeError} If the value is not a number.
   * @throws {RangeError} If the value is outside the valid range.
   */
  set currentSeconds(value) {
    checkDestroy(this.#isDestroyed);
    if (typeof value !== 'number' || !Number.isFinite(value))
      throw new TypeError(`currentSeconds must be a finite number, received ${typeof value}`);
    if (value < 0 || value >= this.#daySize)
      throw new RangeError(`currentSeconds must be between 0 and 86399, received ${value}`);
    this.#currentSeconds = Math.floor(value);
    this.#currentMinutes = Math.floor(value / this.#minuteSize);
    this.#currentHours = Math.floor(value / this.#hourSize);
  }

  /**
   * Gets the current time in minutes since midnight.
   * @returns {number} Current minutes (0 to 1439).
   */
  get currentMinutes() {
    checkDestroy(this.#isDestroyed);
    return this.#currentMinutes;
  }

  /**
   * Sets the current time in minutes since midnight.
   * Also updates the currentSeconds property accordingly (seconds set to zero).
   * @param {number} value - Current minutes since midnight (0 to 1439).
   * @throws {TypeError} If the value is not a number.
   * @throws {RangeError} If the value is outside the valid range.
   */
  set currentMinutes(value) {
    checkDestroy(this.#isDestroyed);
    if (typeof value !== 'number' || !Number.isFinite(value))
      throw new TypeError(`currentMinutes must be a finite number, received ${typeof value}`);
    if (value < 0 || value >= 1440)
      throw new RangeError(`currentMinutes must be between 0 and 1439, received ${value}`);
    this.#currentMinutes = Math.floor(value);
    this.#currentHours = Math.floor(value / this.#minuteSize);
    this.#currentSeconds = Math.floor(value * this.#minuteSize);
  }

  /**
   * Gets the current time in hours since midnight.
   * May be a decimal value (e.g., 14.5 = 14:30).
   * @returns {number} Current hours (0 to less than 24).
   */
  get currentHours() {
    checkDestroy(this.#isDestroyed);
    return this.#currentHours;
  }

  /**
   * Sets the current time in hours since midnight.
   * Accepts decimal numbers to specify partial hours.
   * Also updates currentMinutes and currentSeconds accordingly.
   * @param {number} value - Current hours since midnight (0 to less than 24).
   * @throws {TypeError} If the value is not a finite number.
   * @throws {RangeError} If the value is outside the valid range.
   */
  set currentHours(value) {
    checkDestroy(this.#isDestroyed);
    if (typeof value !== 'number' || !Number.isFinite(value))
      throw new TypeError(`currentHours must be a finite number, received ${typeof value}`);
    if (value < 0 || value >= 24)
      throw new RangeError(`currentHours must be between 0 and less than 24, received ${value}`);
    this.#currentHours = Math.floor(value);
    this.#currentMinutes = Math.floor(value * this.#minuteSize);
    this.#currentSeconds = Math.floor(value * this.#hourSize);
  }

  /**
   * Returns all moons with their current phase details.
   * @returns {MoonData[]} Array of moons including their name, current phase index, phase name, and cycle length.
   */
  get moons() {
    checkDestroy(this.#isDestroyed);
    return this.#moons.map((moon) => this.getMoon(moon));
  }

  /**
   * Returns a list of all season names currently configured.
   * @returns {string[]} Array of season names.
   */
  get seasons() {
    checkDestroy(this.#isDestroyed);
    return Array.from(this.#seasons.keys());
  }

  /** @returns {number} Hour at which day starts (0-23). */
  get dayStart() {
    checkDestroy(this.#isDestroyed);
    return this.#dayStart;
  }

  /** @returns {number} Hour at which night starts (0-23). */
  get nightStart() {
    checkDestroy(this.#isDestroyed);
    return this.#nightStart;
  }

  /** @returns {SelectedWeather} Currently active weather types or nulls if none. */
  get weather() {
    checkDestroy(this.#isDestroyed);
    return { ...this.#weather };
  }

  /** @returns {string} Currently active season name. */
  get currentSeason() {
    checkDestroy(this.#isDestroyed);
    return this.#currentSeason;
  }

  /** @returns {number} Current day of the month. */
  get currentDay() {
    checkDestroy(this.#isDestroyed);
    return this.#currentDay;
  }

  /** @returns {number} Current month number. */
  get currentMonth() {
    checkDestroy(this.#isDestroyed);
    return this.#currentMonth;
  }

  /** @returns {number} Current year count. */
  get currentYear() {
    checkDestroy(this.#isDestroyed);
    return this.#currentYear;
  }

  /**
   * Returns a shallow copy of the mapping of month numbers to days.
   * Can be customized for non-standard calendar systems.
   * @returns {number[]} Object mapping month number to days.
   */
  get monthDays() {
    checkDestroy(this.#isDestroyed);
    return [...this.#monthDays];
  }

  /**
   * Returns the configured range of weather durations in minutes.
   * @returns {{min: number, max: number}} Object with min and max weather duration.
   */
  get weatherDuration() {
    checkDestroy(this.#isDestroyed);
    return { ...this.#weatherDuration };
  }

  /** @returns {number} Minutes left until current weather expires. */
  get weatherTimeLeft() {
    checkDestroy(this.#isDestroyed);
    return this.#weatherTimeLeft;
  }

  /**
   * Sets the hour at which day starts.
   * @param {number} value Hour (0-23).
   * @throws {TypeError} If value is not a number.
   */
  set dayStart(value) {
    checkDestroy(this.#isDestroyed);
    if (typeof value !== 'number' || value < 1)
      throw new TypeError(`dayStart must be a positive non-zero number, received ${typeof value}`);
    this.#dayStart = value;
  }

  /**
   * Sets the hour at which night starts.
   * @param {number} value Hour (0-23).
   * @throws {TypeError} If value is not a number.
   */
  set nightStart(value) {
    checkDestroy(this.#isDestroyed);
    if (typeof value !== 'number' || value < 1)
      throw new TypeError(
        `nightStart must be a positive non-zero number, received ${typeof value}`,
      );
    this.#nightStart = value;
  }

  /**
   * Sets the current weather type.
   * @param {SelectedWeather} value Weather type strings or nulls for no weather.
   * @throws {TypeError} If value is not a string or null.
   */
  set weather(value) {
    checkDestroy(this.#isDestroyed);
    if (
      typeof value !== 'object' ||
      value === null ||
      Array.isArray(value) ||
      !Object.values(value).every((name) => typeof name === 'string')
    )
      throw new TypeError(`weather must be a object with strings, received ${typeof value}`);
    this.#weather = value;
  }

  /**
   * Sets the current season.
   * Must be one of the configured seasons.
   * @param {string} value Season name.
   * @throws {TypeError} If value is not a string or not a configured season.
   */
  set currentSeason(value) {
    checkDestroy(this.#isDestroyed);
    if (typeof value !== 'string' || !this.#seasons.has(value)) {
      throw new TypeError(
        `currentSeason must be one of ${Array.from(this.#seasons)
          .map((v) => v[0])
          .join(', ')}, received ${value}`,
      );
    }
    this.#currentSeason = value;
  }

  /**
   * Sets the current day of the month.
   * @param {number} value Day number.
   * @throws {TypeError} If value is not a number.
   */
  set currentDay(value) {
    checkDestroy(this.#isDestroyed);
    if (typeof value !== 'number' || value < 1 || value > this.#monthDays[this.#currentMonth - 1])
      throw new TypeError(`currentDay must be a valid day number, received ${typeof value}`);
    this.#currentDay = value;
  }

  /**
   * Sets the current month.
   * @param {number} value Month number.
   * @throws {TypeError} If value is not a number.
   */
  set currentMonth(value) {
    checkDestroy(this.#isDestroyed);
    if (typeof value !== 'number' || typeof this.#monthDays[value - 1] !== 'number')
      throw new TypeError(`currentMonth must be a valid month number, received ${typeof value}`);
    this.#currentMonth = value;
  }

  /**
   * Sets the current year.
   * @param {number} value Year count.
   * @throws {TypeError} If value is not a number.
   */
  set currentYear(value) {
    checkDestroy(this.#isDestroyed);
    if (typeof value !== 'number' || value < 1)
      throw new TypeError(
        `currentYear must be a positive number non-zero, received ${typeof value}`,
      );
    this.#currentYear = value;
  }

  /**
   * Sets a custom configuration for the number of days in each month.
   * This allows for non-standard calendar systems.
   * @param {number[]} value - An object where keys are month numbers and values are the number of days.
   */
  set monthDays(value) {
    checkDestroy(this.#isDestroyed);
    if (!Array.isArray(value)) throw new TypeError(`monthDays must be a array`);
    if (!value.every((n) => typeof n === 'number'))
      throw new TypeError(`monthDays must have number values`);
    this.#monthDays = [...value];
  }

  /**
   * Sets the weather duration range in minutes.
   * @param {{min: number, max: number}} value Object with min and max durations.
   * @throws {TypeError} If value or its min/max are invalid.
   */
  set weatherDuration(value) {
    checkDestroy(this.#isDestroyed);
    if (typeof value !== 'object' || value === null)
      throw new TypeError(`weatherDuration must be a non-null object`);
    if (typeof value.min !== 'number' || typeof value.max !== 'number')
      throw new TypeError(`weatherDuration.min and weatherDuration.max must be numbers`);
    this.#weatherDuration = { ...value };
  }

  /**
   * Sets the remaining time for current weather in minutes.
   * @param {number} value Minutes remaining.
   * @throws {TypeError} If value is not a number.
   */
  set weatherTimeLeft(value) {
    checkDestroy(this.#isDestroyed);
    if (typeof value !== 'number')
      throw new TypeError(`weatherTimeLeft must be a number, received ${typeof value}`);
    this.#weatherTimeLeft = value;
  }

  /**
   * Returns the entire weather configuration object.
   * Includes default, day, night, hours, and seasons settings.
   * @returns {WeatherCfgs} Deep copy of the weather configuration.
   */
  get weatherConfig() {
    checkDestroy(this.#isDestroyed);
    /** @type {Record<string, WeatherCfg>} */
    const hours = {};
    /** @type {Record<string, WeatherCfg>} */
    const seasons = {};

    for (const name in this.#weatherConfig.hours)
      hours[name] = { ...this.#weatherConfig.hours[name] };
    for (const name in this.#weatherConfig.seasons)
      seasons[name] = { ...this.#weatherConfig.seasons[name] };

    return {
      default: { ...this.#weatherConfig.default },
      day: { ...this.#weatherConfig.day },
      night: { ...this.#weatherConfig.night },
      hours,
      seasons,
    };
  }

  /**
   * Sets the entire weather configuration object.
   * Accepts default, day, night, hours, and seasons settings.
   * @param {WeatherCfgs} config - The new weather configuration.
   * @throws {TypeError} If the provided value is not a valid object or contains invalid data types.
   */
  set weatherConfig(config) {
    checkDestroy(this.#isDestroyed);
    if (typeof config !== 'object' || config === null)
      throw new TypeError(`weatherConfig must be a non-null object, received ${config}`);

    const requiredKeys = ['default', 'day', 'night', 'hours', 'seasons'];
    for (const key of requiredKeys) {
      if (!(key in config))
        throw new TypeError(`weatherConfig is missing required property "${key}".`);
    }

    /** @type {Record<string, WeatherCfg>} */
    const hours = {};
    /** @type {Record<string, WeatherCfg>} */
    const seasons = {};

    /**
     * @param {WeatherCfg} cfg
     * @param {string} label
     */
    const validateWeatherCfg = (cfg, label) => {
      if (typeof cfg !== 'object' || cfg === null)
        throw new TypeError(`${label} must be an object, received ${cfg}`);

      for (const prop in cfg) {
        const value = cfg[prop];
        const type = typeof value;
        if (!(type === 'number' || type === 'function'))
          throw new TypeError(`${label}["${prop}"] must be a number or function, received ${type}`);
      }
    };

    for (const name in config.hours) {
      validateWeatherCfg(config.hours[name], `hours["${name}"]`);
      hours[name] = { ...config.hours[name] };
    }

    for (const name in config.seasons) {
      validateWeatherCfg(config.seasons[name], `seasons["${name}"]`);
      seasons[name] = { ...config.seasons[name] };
    }

    /**
     * @param {WeatherCfg} src
     * @param {string} label
     */
    const copyCfg = (src, label) => {
      validateWeatherCfg(src, label);
      return { ...src };
    };

    this.#weatherConfig = {
      default: copyCfg(config.default, 'default'),
      day: copyCfg(config.day, 'day'),
      night: copyCfg(config.night, 'night'),
      hours,
      seasons,
    };
  }

  /**
   * @param {number} dayStart - Hour of the day start (0-23)
   * @param {number} nightStart - Hour of the night start (0-23)
   */
  constructor(dayStart = 6, nightStart = 18) {
    this.#dayStart = dayStart;
    this.#nightStart = nightStart;
  }

  /** --------------------- SEASON SYSTEM --------------------- */

  /**
   * Adds or updates a season with the provided numeric values.
   *
   * @param {string} name - The name of the season to add or update.
   * @param {number[]} values - An array of month values associated with the season.
   * @throws {TypeError} If `name` is not a string or `values` is not an array of numbers.
   */
  addSeason(name, values) {
    checkDestroy(this.#isDestroyed);
    if (typeof name !== 'string')
      throw new TypeError(`Season name must be a string, received ${typeof name}`);
    if (!Array.isArray(values) || !values.every((v) => typeof v === 'number'))
      throw new TypeError(`Season values must be an array of numbers`);
    this.#seasons.set(name, values);
  }

  /**
   * Removes a season from the collection.
   *
   * @param {string} name - The name of the season to remove.
   * @throws {TypeError} If `name` is not a string.
   */
  removeSeason(name) {
    checkDestroy(this.#isDestroyed);
    if (typeof name !== 'string')
      throw new TypeError(`Season name must be a string, received ${typeof name}`);
    this.#seasons.delete(name);
    if (this.#currentSeason === name) this.#currentSeason = '';
  }

  /**
   * Checks whether a season exists in the collection.
   *
   * @param {string} name - The name of the season to check.
   * @returns {boolean} `true` if the season exists, otherwise `false`.
   * @throws {TypeError} If `name` is not a string.
   */
  hasSeason(name) {
    checkDestroy(this.#isDestroyed);
    if (typeof name !== 'string')
      throw new TypeError(`Season name must be a string, received ${typeof name}`);
    return this.#seasons.has(name);
  }

  /**
   * Retrieves the mouth values associated with a season.
   *
   * @param {string} name - The name of the season to retrieve.
   * @returns {number[]} A copy of the month values for the specified season.
   * @throws {TypeError} If `name` is not a string.
   * @throws {Error} If the season does not exist.
   */
  getSeason(name) {
    checkDestroy(this.#isDestroyed);
    if (typeof name !== 'string')
      throw new TypeError(`Season name must be a string, received ${typeof name}`);
    const result = this.#seasons.get(name);
    if (!result) throw new Error(`Season "${name}" not found`);
    return [...result];
  }

  /** --------------------- TIME SYSTEM --------------------- */

  /**
   * Sets the internal time directly.
   * @param {Object} settings
   * @param {number} [settings.hour=0] - 0 to 23
   * @param {number} [settings.minute=0] - 0 to 59
   * @param {number} [settings.second=0] - 0 to 59
   */
  setTime({ hour = 0, minute = 0, second = 0 }) {
    checkDestroy(this.#isDestroyed);
    this.currentSeconds =
      (hour * this.#hourSize + minute * this.#minuteSize + second) % this.#daySize;
  }

  /**
   * Adds time to the current clock.
   * @param {Object} settings
   * @param {number} [settings.hours=0]
   * @param {number} [settings.minutes=0]
   * @param {number} [settings.seconds=0]
   */
  addTime({ hours = 0, minutes = 0, seconds = 0 }) {
    checkDestroy(this.#isDestroyed);
    let total = this.currentSeconds + hours * this.#hourSize + minutes * this.#minuteSize + seconds;

    while (total >= this.#daySize) {
      total -= this.#daySize;
      this.nextDay();
    }
    while (total < 0) {
      total += this.#daySize;
      this.prevDay();
    }

    this.currentSeconds = total;
    this.updateWeatherTimer(
      (hours * this.#hourSize + minutes * this.#minuteSize + seconds) / this.#minuteSize,
    ); // in minutes for compatibility
  }

  /**
   * Returns the current time as both an object and a formatted string,
   * using the in-game time scale.
   *
   * @param {Object} [settings={}] - Optional configuration for time calculation.
   * @param {number} [settings.hourSize=this.#hourSize] - Number of in-game seconds representing an hour.
   * @param {number} [settings.minuteSize=this.#minuteSize] - Number of in-game seconds representing a minute.
   * @param {boolean} [settings.withSeconds=false] - Whether to include seconds in the formatted string.
   * @returns {{
   *   hour: number,
   *   minute: number,
   *   second: number,
   *   formatted: string
   * }} An object containing the hour, minute, second, and the formatted time string.
   */
  getTime({ withSeconds = false, hourSize = this.#hourSize, minuteSize = this.#minuteSize } = {}) {
    checkDestroy(this.#isDestroyed);
    const hour = Math.floor(this.currentSeconds / hourSize);
    const minute = Math.floor((this.currentSeconds % hourSize) / minuteSize);
    const second = this.currentSeconds % minuteSize;

    return {
      hour,
      minute,
      second,
      formatted:
        `${hour.toString().padStart(2, '0')}:` +
        `${minute.toString().padStart(2, '0')}` +
        `${withSeconds ? `:${second.toString().padStart(2, '0')}` : ''}`,
    };
  }

  /**
   * Determines whether the current time is considered day.
   * Day is defined as the period between `dayStart` and `nightStart`.
   * @returns {boolean} True if current time is day, false otherwise.
   */
  isDay() {
    checkDestroy(this.#isDestroyed);
    if (this.#dayStart < this.#nightStart) {
      return (
        this.#currentMinutes >= this.#dayStart * this.#minuteSize &&
        this.#currentMinutes < this.#nightStart * this.#minuteSize
      );
    } else {
      return (
        this.#currentMinutes >= this.#dayStart * this.#minuteSize ||
        this.#currentMinutes < this.#nightStart * this.#minuteSize
      );
    }
  }

  /**
   * Calculates the number of minutes until the next day period starts.
   * @returns {number} Minutes until day start.
   */
  minutesUntilDay() {
    return this.timeUntil(this.#dayStart, 'minutes');
  }

  /**
   * Calculates the number of seconds until the next day period starts.
   * @returns {number} Seconds until day start.
   */
  secondsUntilDay() {
    return this.timeUntil(this.#dayStart, 'seconds');
  }

  /**
   * Calculates the number of hours until the next day period starts.
   * @returns {number} Hours until day start.
   */
  hoursUntilDay() {
    return this.timeUntil(this.#dayStart, 'hours');
  }

  /**
   * Calculates the number of minutes until the next night period starts.
   * @returns {number} Minutes until night start.
   */
  minutesUntilNight() {
    return this.timeUntil(this.#nightStart, 'minutes');
  }

  /**
   * Calculates the number of seconds until the next night period starts.
   * @returns {number} Seconds until night start.
   */
  secondsUntilNight() {
    return this.timeUntil(this.#nightStart, 'seconds');
  }

  /**
   * Calculates the number of hours until the next night period starts.
   * @returns {number} Hours until night start.
   */
  hoursUntilNight() {
    return this.timeUntil(this.#nightStart, 'hours');
  }

  /**
   * Helper method to calculate time until a specified hour.
   * Works in seconds internally for higher precision.
   * Wraps around if target hour is earlier than current time.
   * Supports returning time in minutes, seconds, or hours.
   *
   * @param {number} targetHour - The target hour (0–23).
   * @param {'minutes'|'seconds'|'hours'} unit - The unit to return.
   * @returns {number} Time until target hour, in the specified unit.
   */
  timeUntil(targetHour, unit) {
    checkDestroy(this.#isDestroyed);
    const targetSeconds = targetHour * this.#hourSize; // 1 hour = 3600 seconds
    let diffSeconds = targetSeconds - this.#currentSeconds;
    if (diffSeconds <= 0) diffSeconds += this.#daySize; // 24h = 86400 seconds (wrap to next day)

    switch (unit) {
      case 'minutes':
        return diffSeconds / this.#minuteSize;
      case 'hours':
        return diffSeconds / this.#hourSize;
      case 'seconds':
      default:
        return diffSeconds;
    }
  }

  /**
   * Instantly sets the current time to the start of the specified phase.
   * @param {"day"|"night"} phase - The phase to set the time to.
   */
  setTo(phase) {
    checkDestroy(this.#isDestroyed);
    if (phase === 'day') this.setTime({ hour: this.#dayStart });
    else if (phase === 'night') this.setTime({ hour: this.#nightStart });
  }

  /** --------------------- DAY/MONTH/YEAR SYSTEM --------------------- */

  /**
   * Advances the current date by one day.
   * Automatically wraps months and years based on the configured month days.
   * Also updates the season and advances moon phases by 1.
   * @param {number} [amount=1] - Number of days to move forward.
   */
  nextDay(amount = 1) {
    checkDestroy(this.#isDestroyed);
    for (let i = 0; i < amount; i++) {
      this.#currentDay++;
      const monthDays = this.#monthDays[this.#currentMonth - 1];
      if (Number.isNaN(monthDays) || !Number.isFinite(monthDays))
        throw new Error('Invalid month day count: monthDays must be a finite number.');
      if (this.#currentDay > monthDays) {
        this.#currentDay = 1;
        this.#currentMonth++;
        if (this.#currentMonth > this.#monthDays.length) {
          this.#currentMonth = 1;
          this.#currentYear++;
        }
      }
      this.updateSeason();
      this.advanceMoons(1);
    }
  }

  /**
   * Moves the current date backward by one day.
   * Automatically wraps months and years based on the configured month days.
   * Also updates the season and rewinds moon phases by 1.
   * @param {number} [amount=1] - Number of days to move backward.
   */
  prevDay(amount = 1) {
    checkDestroy(this.#isDestroyed);
    for (let i = 0; i < amount; i++) {
      this.#currentDay--;
      if (this.#currentDay < 1) {
        this.#currentMonth--;
        if (this.#currentMonth < 1) {
          this.#currentMonth = this.#monthDays.length;
          this.#currentYear--;
        }
        this.#currentDay = this.#monthDays[this.#currentMonth - 1] || 30;
      }
      this.updateSeason();
      this.rewindMoons(1);
    }
  }

  /**
   * Updates the current season based on the month.
   */
  updateSeason() {
    checkDestroy(this.#isDestroyed);
    this.#seasons.forEach((seasonMonths, name) => {
      if (seasonMonths.includes(this.#currentMonth)) this.#currentSeason = name;
    });
  }

  /** --------------------- WEATHER SYSTEM --------------------- */

  /**
   * Sets the weather configuration.
   * @param {WeatherCfgs} config
   * An object defining default probabilities, time-based probabilities, day/night differences, and seasonal probabilities.
   */
  setWeatherConfig(config) {
    checkDestroy(this.#isDestroyed);
    this.#weatherConfig = { ...this.#weatherConfig, ...config };
  }

  /**
   * Sets the minimum and maximum duration for any weather type.
   * @param {number} minMinutes - Minimum duration in minutes.
   * @param {number} maxMinutes - Maximum duration in minutes.
   */
  setWeatherDuration(minMinutes, maxMinutes) {
    checkDestroy(this.#isDestroyed);
    this.#weatherDuration.min = minMinutes;
    this.#weatherDuration.max = maxMinutes;
  }

  /**
   * Updates the remaining time for the current weather.
   * Automatically selects a new weather type if time runs out.
   * @param {number} minutesPassed - Number of in-game minutes passed since last update.
   */
  updateWeatherTimer(minutesPassed) {
    checkDestroy(this.#isDestroyed);
    this.#weatherTimeLeft -= minutesPassed;
    if (this.#weatherTimeLeft <= 0) {
      this.chooseNewWeather();
    }
  }

  /**
   * Forces the weather to a specific type, optionally for a given duration.
   * @param {Object} settings - Configuration object.
   * @param {string} [settings.where='main'] - The target weather zone or location key.
   * @param {string|null} settings.type - The weather type (e.g., "sunny", "rain", "storm").
   * @param {number|null} [settings.duration=null] - Duration in minutes. If null, a random duration is used.
   */
  forceWeather({ where = 'main', type, duration = null }) {
    checkDestroy(this.#isDestroyed);
    const weather = this.#weather;
    weather[where] = type;
    this.weather = weather;
    this.#weatherTimeLeft =
      duration ?? this._randomInRange(this.#weatherDuration.min, this.#weatherDuration.max);
  }

  /**
   * Chooses a new weather type based on configured probabilities.
   * Probabilities can come from:
   * - Default settings
   * - Hour-based ranges
   * - Day/night differences
   * - Seasonal settings
   * - Custom overrides passed as parameter
   * If a value is a function, it will be executed with contextual data and must return a number.
   * @param {Object} [settings={}] - Configuration object.
   * @param {string} [settings.where='main'] - The target weather zone or location key.
   * @param {WeatherCfg} [settings.customWeather] - Optional weather probability overrides.
   * @returns {string|null} - The selected weather type, or null if none selected.
   */
  chooseNewWeather({ customWeather, where = 'main' } = {}) {
    checkDestroy(this.#isDestroyed);
    /** @type {WeatherData} */
    let probabilities = {};

    /**
     * Helper: Add probability or initialize
     * @param {WeatherCfg} source
     */
    const addProbabilities = (source) => {
      for (const [key, value] of Object.entries(source)) {
        let resolvedValue = value;

        // If it's a function, call it
        if (typeof resolvedValue === 'function') {
          resolvedValue = resolvedValue({
            hour: Math.floor(this.#currentMinutes / this.#minuteSize),
            minute: this.#currentMinutes % this.#minuteSize,
            currentMinutes: this.#currentMinutes,
            isDay: this.isDay(),
            season: this.#currentSeason,
            weather: this.#weather,
          });
        }

        // Only add if it's a number
        if (typeof resolvedValue === 'number' && !Number.isNaN(resolvedValue)) {
          probabilities[key] = (probabilities[key] || 0) + resolvedValue;
        }
      }
    };

    // 1. Default fallback
    addProbabilities(this.#weatherConfig.default || {});

    // 2. Specific hours
    for (const range in this.#weatherConfig.hours) {
      const [start, end] = range.split('-').map((t) => {
        const [h, m] = t.split(':').map(Number);
        return h * this.#minuteSize + (m || 0);
      });
      const current = this.#currentMinutes;
      const inRange =
        start <= end ? current >= start && current <= end : current >= start || current <= end;

      if (inRange) {
        addProbabilities(this.#weatherConfig.hours[range]);
      }
    }

    // 3. Day/Night
    if (this.isDay() && this.#weatherConfig.day) {
      addProbabilities(this.#weatherConfig.day);
    } else if (!this.isDay() && this.#weatherConfig.night) {
      addProbabilities(this.#weatherConfig.night);
    }

    // 4. Seasonal
    if (this.#weatherConfig.seasons?.[this.#currentSeason]) {
      addProbabilities(this.#weatherConfig.seasons[this.#currentSeason]);
    }

    // 5. Custom weather passed directly
    if (customWeather && typeof customWeather === 'object') {
      addProbabilities(customWeather);
    }

    // Pick random based on final probabilities
    const entries = Object.entries(probabilities).filter(([, prob]) => prob > 0);
    if (!entries.length) {
      this.#weather[where] = null;
      return null;
    }

    const total = entries.reduce((sum, [, prob]) => sum + prob, 0);
    let rand = Math.random() * total;

    for (const [type, prob] of entries) {
      if (rand < prob) {
        this.#weather[where] = type;
        this.#weatherTimeLeft = this._randomInRange(
          this.#weatherDuration.min,
          this.#weatherDuration.max,
        );
        return type;
      }
      rand -= prob;
    }

    this.#weather[where] = null;
    return null;
  }

  /**
   * Returns a random integer between min and max, inclusive.
   * @param {number} min - Minimum value.
   * @param {number} max - Maximum value.
   * @returns {number} - A random integer between min and max.
   * @private
   */
  _randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /** --------------------- MOON SYSTEM --------------------- */

  /**
   * Add a new moon to the system.
   * @param {string} name - Name of the moon.
   * @param {number} cycleLength - Number of days in cycle.
   * @param {string[]} phaseNames - Optional list of phase names.
   * @param {number} [startingPhase=0] - Initial phase.
   * @returns {number} - The moon index.
   */
  addMoon(name, cycleLength, phaseNames, startingPhase = 0) {
    checkDestroy(this.#isDestroyed);
    const length = Math.max(1, cycleLength);
    this.#moons.push({
      name,
      cycleLength: length,
      currentPhase: ((startingPhase % length) + length) % length,
      phaseNames,
    });
    return this.#moons.length - 1;
  }

  /**
   * Remove a moon by name.
   * @param {string} name
   */
  removeMoon(name) {
    checkDestroy(this.#isDestroyed);
    this.#moons = this.#moons.filter((m) => m.name !== name);
  }

  /**
   * Advance all moons in a number of days.
   * @param {number} days
   */
  advanceMoons(days = 1) {
    for (const index in this.#moons) this.advanceMoon(parseInt(index), days);
  }

  /**
   * Retrocede all moons in a number of days.
   * @param {number} days
   */
  rewindMoons(days = 1) {
    for (const index in this.#moons) this.rewindMoon(parseInt(index), days);
  }

  /**
   * Advances the phase of a single moon by a number of days.
   * @param {number} moonIndex - The index of the moon to advance.
   * @param {number} days - Number of days to advance. Defaults to 1.
   * @throws {RangeError} If the moonIndex is invalid.
   */
  advanceMoon(moonIndex, days = 1) {
    checkDestroy(this.#isDestroyed);
    const moon = this.#moons[moonIndex];
    if (!moon) throw new RangeError(`No moon found at index ${moonIndex}`);
    moon.currentPhase = (moon.currentPhase + days) % moon.cycleLength;
  }

  /**
   * Rewinds the phase of a single moon by a number of days.
   * @param {number} moonIndex - The index of the moon to rewind.
   * @param {number} days - Number of days to rewind. Defaults to 1.
   * @throws {RangeError} If the moonIndex is invalid.
   */
  rewindMoon(moonIndex, days = 1) {
    checkDestroy(this.#isDestroyed);
    const moon = this.#moons[moonIndex];
    if (!moon) throw new RangeError(`No moon found at index ${moonIndex}`);
    moon.currentPhase = (moon.currentPhase - days + moon.cycleLength) % moon.cycleLength;
  }

  /**
   * Checks if a moon exists at the specified index.
   *
   * @param {number} index - The index of the moon to check.
   * @returns {boolean} `true` if a moon exists at the given index, otherwise `false`.
   */
  moonExists(index) {
    checkDestroy(this.#isDestroyed);
    if (!this.#moons[index]) return false;
    return true;
  }

  /**
   * Retrieves the moon with its current phase details.
   *
   * @param {number|MoonRaw} index - The moon index in the internal collection or a `MoonRaw` object.
   * @returns {MoonData} The moon including its name, current phase index, phase name, and cycle length.
   * @throws {TypeError} If `index` is neither a number nor a valid `MoonRaw` object.
   * @throws {RangeError} If `index` is a number but no moon exists at that position.
   * @throws {Error} If `index` is a `MoonRaw` object but required properties are missing or invalid.
   */
  getMoon(index) {
    checkDestroy(this.#isDestroyed);
    let moon;

    if (typeof index === 'number') {
      moon = this.#moons[index];
      if (!moon) throw new RangeError(`No moon found at index ${index}`);
    } else if (
      index &&
      typeof index === 'object' &&
      typeof index.name === 'string' &&
      typeof index.cycleLength === 'number' &&
      typeof index.currentPhase === 'number'
    )
      moon = index;
    else
      throw new TypeError(
        `Invalid moon reference. Expected a number index or a MoonRaw object, received ${typeof index}`,
      );

    return {
      name: moon.name,
      phaseIndex: moon.currentPhase,
      phaseName: moon.phaseNames
        ? (moon.phaseNames[moon.currentPhase] ?? String(moon.currentPhase))
        : String(moon.currentPhase),
      cycleLength: moon.cycleLength,
    };
  }

  /**
   * Destroys all stored data and marks the instance as unusable.
   * Clears all internal maps, arrays, and resets primitive values to defaults.
   * Once destroyed, any further method calls should throw an error or be ignored.
   */
  destroy() {
    if (this.#isDestroyed) return;

    // Clear collections
    this.#seasons.clear();
    this.#moons.length = 0;

    // Reset numbers
    this.#dayStart = 0;
    this.#nightStart = 0;
    this.#currentSeconds = 0;
    this.#currentMinutes = 0;
    this.#currentHours = 0;
    this.#currentDay = 1;
    this.#currentMonth = 1;
    this.#currentYear = 1;
    this.#weatherTimeLeft = 0;

    // Reset strings
    this.#currentSeason = '';

    // Reset weather
    this.#weather = { main: null };

    // Reset month days
    this.#monthDays = [];

    // Reset weather configuration
    this.#weatherConfig.default = {};
    this.#weatherConfig.day = {};
    this.#weatherConfig.night = {};
    this.#weatherConfig.hours = {};
    this.#weatherConfig.seasons = {};

    // Reset duration range
    this.#weatherDuration = { min: 0, max: 0 };

    // Mark as destroyed
    this.#isDestroyed = true;
  }
}

export default TinyDayNightCycle;
