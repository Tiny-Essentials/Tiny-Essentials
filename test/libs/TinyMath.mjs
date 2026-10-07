import TinySimpleDice from '../../dist/v1/libs/math/TinySimpleDice.mjs';
import TinyAdvancedRaffle from '../../dist/v1/libs/math/TinyAdvancedRaffle.mjs';
import TinyTimeout from '../../dist/v1/libs/math/TinyTimeout.mjs';
import {
  FuzzySet,
  MamdaniInferenceSystem,
  defuzzifyCentroid,
} from '../../dist/v1/libs/math/TinyMamdaniInferenceSystem.mjs';
import { TestRunner, section, color, sleep } from './_helpers.mjs';

/**
 * Node.js port of the browser based math test environments
 * (`test/html/math/*`).
 *
 * Covers:
 * - TinySimpleDice
 * - TinyAdvancedRaffle
 * - TinyMamdaniInferenceSystem
 * - TinyTimeout
 *
 * @returns {Promise<void>}
 */
const testMath = async () => {
  const t = new TestRunner('TinySimpleDice');

  // ---------------------------------------------------------------------
  // TinySimpleDice
  // ---------------------------------------------------------------------
  section('TinySimpleDice - static helpers', '🎲');
  t.equal(TinySimpleDice.replaceValues('Roll 3d6', [1, 2, 3]), 'Roll 6', 'replaceValues sums dice');
  t.equal(TinySimpleDice.replaceValues('d6', [4]), '4', 'replaceValues handles a single die');
  const idx = TinySimpleDice.rollArrayIndex([1, 2, 3, 4, 5]);
  t.ok(Number.isInteger(idx) && idx >= 0 && idx < 5, 'rollArrayIndex stays in range');
  t.throws(() => TinySimpleDice.rollArrayIndex('nope'), 'rollArrayIndex rejects non arrays');

  section('TinySimpleDice - rolling', '🎯');
  const dice = new TinySimpleDice({ maxValue: 6, allowZero: false });
  const rolls = new Set();
  for (let i = 0; i < 500; i++) rolls.add(dice.roll());
  t.ok(Math.min(...rolls) >= 1, 'roll() respects the minimum');
  t.ok(Math.max(...rolls) <= 6, 'roll() respects the maximum');
  t.throws(() => new TinySimpleDice({ maxValue: -1 }), 'Rejects negative maxValue');

  // ---------------------------------------------------------------------
  // TinyAdvancedRaffle
  // ---------------------------------------------------------------------
  const r = new TestRunner('TinyAdvancedRaffle');
  section('TinyAdvancedRaffle - items', '🎰');
  const raffle = new TinyAdvancedRaffle({ seed: 42 });
  raffle.addItem('common', { weight: 10 });
  raffle.addItem('rare', { weight: 1 });
  r.equal(raffle.size, 2, 'Tracks the amount of items');
  r.equal(raffle.hasItem('common'), true, 'hasItem finds registered items');
  r.equal(raffle.getItem('rare').baseWeight, 1, 'getItem returns the item definition');
  r.equal(raffle.listItems().length, 2, 'listItems returns every item');

  section('TinyAdvancedRaffle - drawing', '🎟️');
  const draw = raffle.drawOne();
  r.ok(draw && typeof draw.id === 'string', 'drawOne returns an item');
  r.ok(draw.prob > 0 && draw.prob <= 1, 'drawOne returns a probability');

  const many = raffle.drawMany(5);
  r.equal(many.length, 5, 'drawMany returns the requested amount');

  raffle.setBaseWeight('rare', 100);
  r.equal(raffle.getItem('rare').baseWeight, 100, 'setBaseWeight updates the weight');
  raffle.removeItem('rare');
  r.equal(raffle.hasItem('rare'), false, 'removeItem deletes the item');

  section('TinyAdvancedRaffle - serialization', '💾');
  const json = raffle.exportToJson();
  r.ok(json && typeof json === 'object', 'exportToJson returns an object');
  const clone = raffle.clone();
  r.equal(clone.size, raffle.size, 'clone keeps the same amount of items');
  raffle.destroy();
  r.equal(raffle.isDestroyed, true, 'destroy marks the instance as destroyed');

  // ---------------------------------------------------------------------
  // TinyMamdaniInferenceSystem
  // ---------------------------------------------------------------------
  const f = new TestRunner('TinyMamdaniInferenceSystem');
  section('TinyMamdaniInferenceSystem', '🌡️');
  const engine = new MamdaniInferenceSystem();
  const cold = new FuzzySet('Cold', 0, 0, 10, 20);
  const hot = new FuzzySet('Hot', 20, 30, 40, 40);
  engine.addVariable('temperature', [cold, hot]);

  f.equal(engine.hasVariable('temperature'), true, 'addVariable/hasVariable');
  f.equal(engine.getVariable('temperature').length, 2, 'getVariable returns the sets');
  f.deepEqual(engine.fuzzify('temperature', 5), { Cold: 1, Hot: 0 }, 'fuzzify returns memberships');
  engine.removeVariable('temperature');
  f.equal(engine.hasVariable('temperature'), false, 'removeVariable removes the variable');
  f.throws(() => engine.getVariable('ghost'), 'getVariable throws for unknown variables');

  const fs = new FuzzySet('Test', 0, 1, 2, 3);
  f.equal(fs.name, 'Test', 'FuzzySet exposes its name');
  fs.name = 'Renamed';
  f.equal(fs.name, 'Renamed', 'FuzzySet name is writable');
  f.throws(() => {
    fs.b = 'invalid';
  }, 'FuzzySet validates numeric properties');

  const centroid = defuzzifyCentroid({ X: 0.5 }, [new FuzzySet('X', 0, 0, 10, 10)]);
  f.ok(
    typeof centroid === 'number' && !Number.isNaN(centroid),
    'defuzzifyCentroid returns a number',
  );

  // ---------------------------------------------------------------------
  // TinyTimeout
  // --------------------------------------------------------------------
  const to = new TestRunner('TinyTimeout');
  section('TinyTimeout', '⏱️');
  const timeout = new TinyTimeout({ cooldownWatcherTime: 20, allowAutoConfigChange: true });
  to.equal(timeout.getCooldownWatcherTime(), 20, 'Stores the cooldown watcher time');
  to.equal(timeout.getAllowAutoConfigChange(), true, 'Stores the auto config flag');

  await new Promise((resolve) => {
    timeout.set('job', resolve, 1);
  });
  to.ok(true, 'set() schedules the callback');

  const start = Date.now();
  await timeout.waitForTrue(() => Date.now() - start > 30, 10);
  to.ok(true, 'waitForTrue resolves when the condition is met');

  timeout.destroy();
  to.equal(timeout.isDestroyed(), true, 'destroy marks the instance as destroyed');

  console.log(`\n${color('gray', 'Math test-suite finished.')}`);

  return t.summary() + r.summary() + f.summary() + to.summary();
};

export default testMath;
