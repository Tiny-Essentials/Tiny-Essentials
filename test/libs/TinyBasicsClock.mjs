import {
  getUserTimeFormat,
  getTimeDuration,
  formatCustomTimer,
  formatTimer,
  formatDayTimer,
  breakdownDuration,
} from '../../dist/v1/basics/clock.mjs';
import { TestRunner, section, color } from './_helpers.mjs';

/**
 * Node.js port of the browser based clock test environment
 * (`test/html/basics/clock`).
 *
 * Covers `src/v1/basics/clock.mjs`:
 *
 * - getUserTimeFormat
 * - getTimeDuration
 * - formatCustomTimer / formatTimer / formatDayTimer
 * - breakdownDuration
 *
 * @returns {Promise<number>}
 */
const testBasicsClock = async () => {
  const t = new TestRunner('basics/clock');

  // -------------------------------------------------------------------
  // getUserTimeFormat
  // -------------------------------------------------------------------
  section('clock - getUserTimeFormat', '🕰️');
  const format = getUserTimeFormat();
  t.equal(format === 12 || format === 24, true, 'Returns 12 or 24');

  // -------------------------------------------------------------------
  // getTimeDuration
  // -------------------------------------------------------------------
  section('clock - getTimeDuration', '⏱️');
  const now = new Date('2024-01-01T00:00:00.000Z');
  const inOneHour = new Date('2024-01-01T01:00:00.000Z');

  t.equal(getTimeDuration(inOneHour, 'asMilliseconds', now), 3600000, 'Converts to milliseconds');
  t.equal(getTimeDuration(inOneHour, 'asSeconds', now), 3600, 'Converts to seconds');
  t.equal(getTimeDuration(inOneHour, 'asMinutes', now), 60, 'Converts to minutes');
  t.equal(getTimeDuration(inOneHour, 'asHours', now), 1, 'Converts to hours');
  t.equal(getTimeDuration(inOneHour, 'asDays', now), 1 / 24, 'Converts to days');
  t.throws(() => getTimeDuration('nope'), 'Rejects a non-Date timeData');
  t.throws(() => getTimeDuration(inOneHour, 5), 'Rejects a non-string durationType');
  t.throws(() => getTimeDuration(inOneHour, 'nope'), 'Rejects an unknown durationType');
  t.throws(() => getTimeDuration(inOneHour, 'asSeconds', 'nope'), 'Rejects a non-Date now');

  // -------------------------------------------------------------------
  // formatTimer / formatDayTimer
  // -------------------------------------------------------------------
  section('clock - formatTimer', '⏲️');
  t.equal(formatTimer(0), '00:00:00', 'Formats zero');
  t.equal(formatTimer(3661), '01:01:01', 'Formats hours, minutes and seconds');
  t.equal(formatDayTimer(90061), '1d 01:01:01', 'formatDayTimer includes the days');
  t.throws(() => formatTimer('nope'), 'formatTimer validates the input');
  t.throws(() => formatDayTimer('nope'), 'formatDayTimer validates the input');

  // -------------------------------------------------------------------
  // formatCustomTimer
  // -------------------------------------------------------------------
  section('clock - formatCustomTimer', '🧮');
  t.equal(formatCustomTimer(65), '65', 'Defaults to the seconds level');
  t.equal(formatCustomTimer(65, 'minutes'), '01:05', 'Formats minutes and seconds');
  t.equal(formatCustomTimer(3661, 'hours'), '01:01:01', 'Formats hours');
  t.equal(
    formatCustomTimer(3661, 'hours', '{hours}h {minutes}m {seconds}s'),
    '01h 01m 01s',
    'Honours the format template',
  );
  t.equal(
    formatCustomTimer(90000, 'days', '{days}d {hours}:{minutes}:{seconds}'),
    '1d 01:00:00',
    'Formats days',
  );
  t.equal(formatCustomTimer(-10, 'seconds'), '00', 'Clamps negative values');
  t.throws(() => formatCustomTimer('nope'), 'Rejects a non-numeric total');
  t.throws(() => formatCustomTimer(1, 5), 'Rejects a non-string level');
  t.throws(() => formatCustomTimer(1, 'nope'), 'Rejects an unknown level');
  t.throws(() => formatCustomTimer(1, 'seconds', 5), 'Rejects a non-string format');

  // -------------------------------------------------------------------
  // breakdownDuration
  // -------------------------------------------------------------------
  section('clock - breakdownDuration', '🧩');
  const ms = 90061001; // 1d 01:01:01.001
  const parts = breakdownDuration(ms, 'years');
  t.equal(parts.days, 1, 'Extracts the days');
  t.equal(parts.hours, 1, 'Extracts the hours');
  t.equal(parts.minutes, 1, 'Extracts the minutes');
  t.equal(parts.seconds, 1, 'Extracts the seconds');
  t.equal(parts.milliseconds, 1, 'Extracts the milliseconds');
  t.equal(parts.total, ms, 'Keeps the total');

  const secondsOnly = breakdownDuration(5000, 'seconds');
  t.equal(secondsOnly.seconds, 5, 'Breaks down seconds');
  t.equal(Number.isNaN(secondsOnly.minutes), true, 'Leaves the higher units as NaN');

  t.throws(() => breakdownDuration('nope'), 'Rejects a non-numeric total');
  t.throws(() => breakdownDuration(1, 5), 'Rejects a non-string level');
  t.throws(() => breakdownDuration(1, 'nope'), 'Rejects an unknown level');

  console.log(`\n${color('gray', 'basics/clock test-suite finished.')}`);

  return t.summary();
};

export default testBasicsClock;
