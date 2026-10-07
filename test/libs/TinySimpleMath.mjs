/**
 * Node.js port of the browser based simple math test environments
 * (`test/html/math/fibonacci-canvas` and `test/html/math/marketcap-tools`).
 *
 * Covers the `src/v1/basics/simpleMath.mjs` helpers that power those demos:
 *
 * - ruleOfThree
 * - getSimplePerc / getPercentage
 * - getAge
 * - formatBytes
 * - genFibonacciSeq (fibonacci-canvas)
 * - calculateMarketcap / compareMarketcap (marketcap-tools)
 *
 * @returns {Promise<number>}
 */

import {
  ruleOfThree,
  getSimplePerc,
  getPercentage,
  getAge,
  formatBytes,
  genFibonacciSeq,
  calculateMarketcap,
  compareMarketcap,
} from '../../dist/v1/basics/simpleMath.mjs';

import { TestRunner, section, color } from './_helpers.mjs';

/**
 * Node.js port of the browser simple math test environments.
 * @returns {Promise<number>}
 */
const testSimpleMath = async () => {
  const t = new TestRunner('simpleMath');

  // -------------------------------------------------------------------
  // ruleOfThree
  // -------------------------------------------------------------------
  section('simpleMath - ruleOfThree', '➗');
  t.equal(ruleOfThree(2, 6, 3, false), 9, 'Direct proportion');
  t.equal(ruleOfThree(2, 6, 3, true), 4, 'Inverse proportion');
  t.throws(() => ruleOfThree('a', 1, 1), 'Rejects a non-number val1');
  t.throws(() => ruleOfThree(1, 1, 1, 'nope'), 'Rejects a non-boolean inverse');

  // -------------------------------------------------------------------
  // Percentages
  // -------------------------------------------------------------------
  section('simpleMath - percentages', '💯');
  t.equal(getSimplePerc(200, 15), 30, 'getSimplePerc returns the percentage value');
  t.equal(getPercentage(5, 100), 5, 'getPercentage returns the ratio as a percent');
  t.equal(getPercentage(1, 0), 0, 'getPercentage guards against division by zero');
  t.throws(() => getSimplePerc('a', 1), 'getSimplePerc validates its input');
  t.throws(() => getPercentage(1, 'a'), 'getPercentage validates its input');

  // -------------------------------------------------------------------
  // getAge
  // -------------------------------------------------------------------
  section('simpleMath - getAge', '🎂');
  t.equal(getAge('2000-01-01', new Date('2020-06-01')), 20, 'Computes the age after the birthday');
  t.equal(getAge('2000-12-31', new Date('2020-06-01')), 19, 'Computes the age before the birthday');
  t.equal(getAge('not-a-date'), null, 'Returns null for an invalid date');
  t.throws(() => getAge(null), 'Rejects a non date-like value');

  // -------------------------------------------------------------------
  // formatBytes
  // -------------------------------------------------------------------
  section('simpleMath - formatBytes', '💾');
  t.deepEqual(formatBytes(0), { unit: 'Bytes', value: 0 }, 'Formats zero');
  t.deepEqual(formatBytes(1024), { unit: 'KB', value: 1 }, 'Converts to KB');
  t.deepEqual(formatBytes(1048576, 2), { unit: 'MB', value: 1 }, 'Converts to MB');
  t.deepEqual(formatBytes(1073741824, 2, 'MB'), { unit: 'MB', value: 1024 }, 'Respects maxUnit');
  t.throws(() => formatBytes(-1), 'Rejects negative byte counts');
  t.throws(() => formatBytes(1, 2, 'Nope'), 'Rejects an invalid maxUnit');

  // -------------------------------------------------------------------
  // genFibonacciSeq (fibonacci-canvas)
  // -------------------------------------------------------------------
  section('simpleMath - genFibonacciSeq', '🌀');
  t.deepEqual(
    genFibonacciSeq({ length: 7 }),
    [0, 1, 1, 2, 3, 5, 8],
    'Generates the default Fibonacci sequence',
  );
  t.deepEqual(
    genFibonacciSeq({ baseValues: [1, 1], length: 5 }),
    [1, 1, 2, 3, 5],
    'Honours custom base values',
  );
  t.deepEqual(
    genFibonacciSeq({ baseValues: [1, 2], length: 4, combiner: (a, b) => a * b }),
    [1, 2, 2, 4],
    'Supports a custom combiner',
  );
  t.throws(() => genFibonacciSeq({ baseValues: [1] }), 'Rejects an invalid baseValues array');
  t.throws(() => genFibonacciSeq({ length: 1.5 }), 'Rejects a non-integer length');

  // -------------------------------------------------------------------
  // calculateMarketcap / compareMarketcap (marketcap-tools)
  // -------------------------------------------------------------------
  section('simpleMath - marketcap', '📈');
  t.equal(calculateMarketcap(1_000_000, 1_000_000), 1, 'Calculates the unit price');
  t.throws(() => calculateMarketcap(1, 0), 'Rejects a zero supply');
  t.throws(() => calculateMarketcap('a', 1), 'Rejects a non-number market cap');

  const comparison = compareMarketcap(1_000_000, 1_000_000, 2_000_000);
  t.equal(comparison.originalPrice, 1, 'compareMarketcap returns the original price');
  t.equal(comparison.newPrice, 2, 'compareMarketcap returns the new price');
  t.equal(comparison.priceChangePercent, 100, 'compareMarketcap returns the change percent');
  t.throws(() => compareMarketcap(1, 1, 'a'), 'compareMarketcap validates the new market cap');

  console.log(`\n${color('gray', 'simpleMath test-suite finished.')}`);

  return t.summary();
};

export default testSimpleMath;
