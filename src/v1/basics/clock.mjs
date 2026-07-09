/**
 * Calculates the time duration between the current time and a given time offset.
 *
 * @param {Date} timeData - The target time as a Date object.
 * @param {'asMilliseconds'|'asSeconds'|'asMinutes'|'asHours'|'asDays'} [durationType='asSeconds'] - The type of duration to return.
 * @param {Date|null} [now=null] - The current time as a Date object. Defaults to the current date and time if not provided.
 * @returns {number|null} The calculated duration in the specified unit, or `null` if `timeData` is not provided.
 */
export function getTimeDuration(timeData = new Date(), durationType = 'asSeconds', now = null) {
  if (!(timeData instanceof Date)) {
    throw new TypeError("The 'timeData' argument must be an instance of Date.");
  }
  if (typeof durationType !== 'string') {
    throw new TypeError("The 'durationType' argument must be a string.");
  }
  const validDurationTypes = ['asMilliseconds', 'asSeconds', 'asMinutes', 'asHours', 'asDays'];
  if (!validDurationTypes.includes(durationType)) {
    throw new RangeError(`The 'durationType' must be one of: ${validDurationTypes.join(', ')}.`);
  }
  if (now !== null && !(now instanceof Date)) {
    throw new TypeError("The 'now' argument must be an instance of Date or null.");
  }

  const currentTime = now instanceof Date ? now : new Date();
  /** @type {number} */
  const diffMs = timeData.getTime() - currentTime.getTime();

  switch (durationType) {
    case 'asMilliseconds':
      return diffMs;
    case 'asSeconds':
      return diffMs / 1000;
    case 'asMinutes':
      return diffMs / (1000 * 60);
    case 'asHours':
      return diffMs / (1000 * 60 * 60);
    case 'asDays':
      return diffMs / (1000 * 60 * 60 * 24);
    default:
      return diffMs / 1000; // default to seconds
  }
}

/**
 * Formats a custom timer string based on total seconds and a detail level.
 * Includes proper reallocation of lower units into higher ones, ensuring consistent hierarchy.
 *
 * @param {number} totalSeconds - The total amount of seconds to convert.
 * @param {'seconds'|'minutes'|'hours'|'days'|'months'|'years'} [level] - The highest level to calculate and display.
 * @param {string} [format='{time}'] - Output template with placeholders like {years}, {months}, {days}, {hours}, {minutes}, {seconds}, {time}, {total}.
 * @returns {string} The formatted timer string.
 */
export function formatCustomTimer(totalSeconds, level = 'seconds', format = '{time}') {
  if (typeof totalSeconds !== 'number' || Number.isNaN(totalSeconds)) {
    throw new TypeError("The 'totalSeconds' argument must be a valid number.");
  }
  if (typeof level !== 'string') {
    throw new TypeError("The 'level' argument must be a string.");
  }
  const levels = ['seconds', 'minutes', 'hours', 'days', 'months', 'years'];
  if (!levels.includes(level)) {
    throw new RangeError(`The 'level' must be one of: ${levels.join(', ')}.`);
  }
  if (typeof format !== 'string') {
    throw new TypeError("The 'format' argument must be a string.");
  }

  totalSeconds = Math.max(0, Math.floor(totalSeconds));
  const index = levels.indexOf(level);

  const include = {
    years: index >= 5,
    months: index >= 4,
    days: index >= 3,
    hours: index >= 2,
    minutes: index >= 1,
    seconds: index >= 0,
  };

  /**
   * @type {{
   * years: number|NaN,
   * months: number|NaN,
   * days: number|NaN,
   * hours: number|NaN,
   * minutes: number|NaN,
   * seconds: number|NaN,
   * total: number|NaN
   * }}
   */
  const parts = {
    years: include.years ? 0 : NaN,
    months: include.months ? 0 : NaN,
    days: include.days ? 0 : NaN,
    hours: include.hours ? 0 : NaN,
    minutes: include.minutes ? 0 : NaN,
    seconds: include.seconds ? 0 : NaN,
    total: NaN,
  };

  let remaining = totalSeconds;

  if (include.years || include.months || include.days) {
    const baseDate = new Date(1980, 0, 1);
    const targetDate = new Date(baseDate.getTime() + remaining * 1000);
    const workingDate = new Date(baseDate);

    // Years
    if (include.years) {
      while (
        new Date(
          workingDate.getFullYear() + 1,
          workingDate.getMonth(),
          workingDate.getDate(),
        ).getTime() <= targetDate.getTime()
      ) {
        workingDate.setFullYear(workingDate.getFullYear() + 1);
        parts.years++;
      }
    }

    // Months
    if (include.months) {
      while (
        new Date(
          workingDate.getFullYear(),
          workingDate.getMonth() + 1,
          workingDate.getDate(),
        ).getTime() <= targetDate.getTime()
      ) {
        workingDate.setMonth(workingDate.getMonth() + 1);
        parts.months++;
      }
    }

    // Days
    if (include.days) {
      while (
        new Date(
          workingDate.getFullYear(),
          workingDate.getMonth(),
          workingDate.getDate() + 1,
        ).getTime() <= targetDate.getTime()
      ) {
        workingDate.setDate(workingDate.getDate() + 1);
        parts.days++;
      }
    }

    remaining = Math.floor((targetDate.getTime() - workingDate.getTime()) / 1000);
  }

  if (include.hours) {
    parts.hours = Math.floor(remaining / 3600);
    remaining %= 3600;
  }

  if (include.minutes) {
    parts.minutes = Math.floor(remaining / 60);
    remaining %= 60;
  }

  if (include.seconds) {
    parts.seconds = remaining;
  }

  // Calculate total
  /** const totalMap = {
    seconds: include.seconds ? totalSeconds : NaN,
    minutes: include.minutes ? totalSeconds / 60 : NaN,
    hours: include.hours ? totalSeconds / 3600 : NaN,
    days: include.days ? totalSeconds / 86400 : NaN,
    months: include.months ? parts.years * 12 + parts.months + (parts.days || 0) / 30 : NaN,
    years: include.years ? parts.years + (parts.months || 0) / 12 + (parts.days || 0) / 365 : NaN,
  }; */

  parts.total = +totalSeconds.toFixed(2).replace(/\.00$/, '');

  /**
   * Pads a number to ensure it is at least two digits long, using leading zeros if necessary.
   *
   * @param {number|string} n - The number or string to pad.
   * @returns {string} The padded string.
   */
  const pad = (n) => {
    const num = typeof n === 'string' ? parseInt(n) : n;
    return Number.isNaN(num) ? 'NaN' : String(num).padStart(2, '0');
  };

  const timeString = [
    include.hours ? pad(parts.hours) : null,
    include.minutes ? pad(parts.minutes) : null,
    include.seconds ? pad(parts.seconds) : null,
  ]
    .filter((v) => v !== null)
    .join(':');

  return format
    .replace(/\{years\}/g, String(parts.years))
    .replace(/\{months\}/g, String(parts.months))
    .replace(/\{days\}/g, String(parts.days))
    .replace(/\{hours\}/g, pad(parts.hours))
    .replace(/\{minutes\}/g, pad(parts.minutes))
    .replace(/\{seconds\}/g, pad(parts.seconds))
    .replace(/\{time\}/g, timeString)
    .replace(/\{total\}/g, String(parts.total))
    .trim();
}

/**
 * Formats a duration (in seconds) into a timer string showing only hours, minutes, and seconds.
 *
 * Example output: "05:32:10"
 *
 * @param {number} seconds - The total number of seconds to format.
 * @returns {string} The formatted timer string in "HH:MM:SS" format.
 */
export function formatTimer(seconds) {
  if (typeof seconds !== 'number' || Number.isNaN(seconds)) {
    throw new TypeError("The 'seconds' argument must be a valid number.");
  }
  return formatCustomTimer(seconds, 'hours', '{hours}:{minutes}:{seconds}');
}

/**
 * Formats a duration (in seconds) into a timer string including days, hours, minutes, and seconds.
 *
 * Example output: "2d 05:32:10"
 *
 * @param {number} seconds - The total number of seconds to format.
 * @returns {string} The formatted timer string in "Xd HH:MM:SS" format.
 */
export function formatDayTimer(seconds) {
  if (typeof seconds !== 'number' || Number.isNaN(seconds)) {
    throw new TypeError("The 'seconds' argument must be a valid number.");
  }
  return formatCustomTimer(seconds, 'days', '{days}d {hours}:{minutes}:{seconds}');
}

/**
 * Breaks down a duration in milliseconds into its time components.
 *
 * @param {number} totalMs - The total duration in milliseconds.
 * @param {'milliseconds'|'seconds'|'minutes'|'hours'|'days'|'months'|'years'} [level='milliseconds'] - The highest level to calculate and display.
 * @returns {{
 * years: number|NaN,
 * months: number|NaN,
 * days: number|NaN,
 * hours: number|NaN,
 * minutes: number|NaN,
 * seconds: number|NaN,
 * milliseconds: number|NaN,
 * total: number|NaN
 * }}
 */
export function breakdownDuration(totalMs, level = 'milliseconds') {
  if (typeof totalMs !== 'number' || Number.isNaN(totalMs)) {
    throw new TypeError("The 'totalMs' argument must be a valid number.");
  }
  if (typeof level !== 'string') {
    throw new TypeError("The 'level' argument must be a string.");
  }
  const levels = ['milliseconds', 'seconds', 'minutes', 'hours', 'days', 'months', 'years'];
  if (!levels.includes(level)) {
    throw new RangeError(`The 'level' must be one of: ${levels.join(', ')}.`);
  }

  totalMs = Math.max(0, Math.floor(totalMs));
  const index = levels.indexOf(level);

  const include = {
    years: index >= 6,
    months: index >= 5,
    days: index >= 4,
    hours: index >= 3,
    minutes: index >= 2,
    seconds: index >= 1,
    milliseconds: index >= 0,
  };

  const parts = {
    years: include.years ? 0 : NaN,
    months: include.months ? 0 : NaN,
    days: include.days ? 0 : NaN,
    hours: include.hours ? 0 : NaN,
    minutes: include.minutes ? 0 : NaN,
    seconds: include.seconds ? 0 : NaN,
    milliseconds: include.milliseconds ? 0 : NaN,
    total: NaN,
  };

  let remaining = totalMs;

  if (include.years || include.months || include.days) {
    const baseDate = new Date(1980, 0, 1);
    const targetDate = new Date(baseDate.getTime() + remaining);
    const workingDate = new Date(baseDate);

    // Years
    if (include.years) {
      while (
        new Date(
          workingDate.getFullYear() + 1,
          workingDate.getMonth(),
          workingDate.getDate(),
        ).getTime() <= targetDate.getTime()
      ) {
        workingDate.setFullYear(workingDate.getFullYear() + 1);
        parts.years++;
      }
    }

    // Months
    if (include.months) {
      while (
        new Date(
          workingDate.getFullYear(),
          workingDate.getMonth() + 1,
          workingDate.getDate(),
        ).getTime() <= targetDate.getTime()
      ) {
        workingDate.setMonth(workingDate.getMonth() + 1);
        parts.months++;
      }
    }

    // Days
    if (include.days) {
      while (
        new Date(
          workingDate.getFullYear(),
          workingDate.getMonth(),
          workingDate.getDate() + 1,
        ).getTime() <= targetDate.getTime()
      ) {
        workingDate.setDate(workingDate.getDate() + 1);
        parts.days++;
      }
    }

    remaining = targetDate.getTime() - workingDate.getTime();
  }

  if (include.hours) {
    parts.hours = Math.floor(remaining / 3600000);
    remaining %= 3600000;
  }

  if (include.minutes) {
    parts.minutes = Math.floor(remaining / 60000);
    remaining %= 60000;
  }

  if (include.seconds) {
    parts.seconds = Math.floor(remaining / 1000);
    remaining %= 1000;
  }

  if (include.milliseconds) {
    parts.milliseconds = remaining;
  }

  // Totals
  /** const totalMap = {
    milliseconds: include.milliseconds ? totalMs : NaN,
    seconds: include.seconds ? totalMs / 1000 : NaN,
    minutes: include.minutes ? totalMs / 60000 : NaN,
    hours: include.hours ? totalMs / 3600000 : NaN,
    days: include.days ? totalMs / 86400000 : NaN,
    months: include.months ? parts.years * 12 + parts.months + (parts.days || 0) / 30 : NaN,
    years: include.years ? parts.years + (parts.months || 0) / 12 + (parts.days || 0) / 365 : NaN,
  }; */

  parts.total = +totalMs;

  return parts;
}
