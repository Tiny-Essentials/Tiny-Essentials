import TinyNeedBar from '../../dist/v1/libs/game/TinyNeedBar.mjs';
import TinyDayNightCycle from '../../dist/v1/libs/game/TinyDayNightCycle.mjs';
import { TestRunner, section, color } from './_helpers.mjs';

/**
 * Node.js port of the browser based game test environments
 * (`test/html/game/*`).
 *
 * Covers:
 * - TinyNeedBar
 * - TinyDayNightCycle
 *
 * @returns {Promise<void>}
 */
const testGame = async () => {
  const t = new TestRunner('TinyNeedBar');

  // ---------------------------------------------------------------------
  // TinyNeedBar
  // ---------------------------------------------------------------------
  section('TinyNeedBar - construction', '🍖');
  const bar = new TinyNeedBar(100, 5, 1);
  t.equal(bar.maxValue, 100, 'Stores the max value');
  t.equal(bar.currentValue, 100, 'Starts full');
  t.equal(bar.currentPercent, 100, 'Starts at 100%');
  t.equal(bar.hasFactor('main'), true, 'Creates the main factor');
  t.throws(() => new TinyNeedBar(0), 'Rejects a non-positive max value');

  section('TinyNeedBar - factors', '🧂');
  bar.setFactor('hunger', 2, 1);
  t.equal(bar.hasFactor('hunger'), true, 'setFactor registers a factor');
  t.deepEqual(bar.getFactor('hunger'), { amount: 2, multiplier: 1 }, 'getFactor returns a copy');
  bar.removeFactor('hunger');
  t.equal(bar.hasFactor('hunger'), false, 'removeFactor deletes a factor');
  t.throws(() => bar.getFactor('ghost'), 'getFactor throws for unknown factors');

  section('TinyNeedBar - ticking', '⏳');
  const tick = bar.tick();
  t.equal(tick.removedTotal, 5, 'tick removes the combined decay');
  t.equal(tick.remainingValue, 95, 'tick reports the remaining value');
  t.equal(bar.currentValue, 95, 'tick updates the current value');

  section('TinyNeedBar - serialization', '💾');
  const json = bar.toJSON();
  const restored = TinyNeedBar.fromJSON(json);
  t.equal(restored.currentValue, bar.currentValue, 'fromJSON restores the value');
  t.equal(restored.maxValue, bar.maxValue, 'fromJSON restores the max value');
  const clone = bar.clone();
  t.equal(clone.currentValue, bar.currentValue, 'clone copies the value');
  t.ok(clone !== bar, 'clone returns a new instance');

  // ---------------------------------------------------------------------
  // TinyDayNightCycle
  // ---------------------------------------------------------------------
  const d = new TestRunner('TinyDayNightCycle');
  section('TinyDayNightCycle - time', '🌗');
  const cycle = new TinyDayNightCycle(6, 18);
  cycle.setTime({ hour: 12, minute: 30 });
  d.deepEqual(
    cycle.getTime(),
    { hour: 12, minute: 30, second: 0, formatted: '12:30' },
    'setTime/getTime',
  );
  d.equal(cycle.isDay(), true, 'isDay is true during the day');

  cycle.addTime({ hours: 1 });
  d.equal(cycle.getTime().hour, 13, 'addTime advances the clock');

  cycle.setTime({ hour: 23, minute: 0 });
  d.equal(cycle.isDay(), false, 'isDay is false during the night');

  section('TinyDayNightCycle - seasons', '🍂');
  cycle.addSeason('winter', [12, 1, 2]);
  d.equal(cycle.hasSeason('winter'), true, 'addSeason/hasSeason');
  d.deepEqual(cycle.getSeason('winter'), [12, 1, 2], 'getSeason returns the months');
  cycle.removeSeason('winter');
  d.equal(cycle.hasSeason('winter'), false, 'removeSeason deletes the season');
  d.throws(() => cycle.addSeason(123, []), 'addSeason validates the name');

  console.log(`\n${color('gray', 'Game test-suite finished.')}`);

  return t.summary() + d.summary();
};

export default testGame;
