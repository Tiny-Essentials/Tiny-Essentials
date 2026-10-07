import TinyColorConverter from '../../dist/v1/libs/color/TinyColorConverter.mjs';
import TinyColorValidator from '../../dist/v1/libs/color/TinyColorValidator.mjs';
import { TestRunner, section, color } from './_helpers.mjs';

/**
 * Node.js port of the browser based color test environments
 * (`test/html/color/*`).
 *
 * Covers:
 * - TinyColorConverter (conversion + static helpers)
 * - TinyColorValidator (validation, parsing and registries)
 *
 * @returns {Promise<void>}
 */
const testColor = async () => {
  const t = new TestRunner('TinyColorConverter');

  // ---------------------------------------------------------------------
  // Instance conversions
  // ---------------------------------------------------------------------
  section('TinyColorConverter - instance conversions', '🎨');
  const conv = new TinyColorConverter('#ff8800');
  t.equal(conv.toHex(), '#ff8800', 'toHex keeps the original hex');
  t.equal(conv.toInt(), 0xff8800, 'toInt converts to a 24-bit integer');
  t.deepEqual(conv.toRgbaArray(), [255, 136, 0, 1], 'toRgbaArray returns the rgba tuple');
  t.equal(conv.toRgbString(), 'rgb(255, 136, 0)', 'toRgbString formats rgb()');
  t.equal(conv.toRgbaString(), 'rgba(255, 136, 0, 1)', 'toRgbaString formats rgba()');
  t.equal(conv.toHslString(), 'hsl(32, 100%, 50%)', 'toHslString converts to hsl()');
  t.equal(conv.getOriginal(), '#ff8800', 'getOriginal returns the raw input');

  // ---------------------------------------------------------------------
  // Static conversions
  // ---------------------------------------------------------------------
  section('TinyColorConverter - static helpers', '🧮');
  t.deepEqual(TinyColorConverter.hexToRgb('#ff8800'), [255, 136, 0], 'hexToRgb');
  t.equal(TinyColorConverter.intToHex(0xff8800), '#ff8800', 'intToHex');
  t.equal(TinyColorConverter.hexToInt('#ff8800'), 0xff8800, 'hexToInt');
  t.deepEqual(TinyColorConverter.hslToRgb(0, 100, 50), [255, 0, 0], 'hslToRgb');
  t.equal(TinyColorConverter.rgbToHex(255, 136, 0), '#ff8800', 'rgbToHex');
  t.equal(TinyColorConverter.rgbToInt(255, 136, 0), 0xff8800, 'rgbToInt');
  t.equal(typeof TinyColorConverter.randomColor(), 'string', 'randomColor returns a string');

  const gradient = TinyColorConverter._rca(5, 'hex', false);
  t.equal(gradient.length, 5, 'Gradient helper returns the requested amount of colors');

  // ---------------------------------------------------------------------
  // Validator - validators
  // ---------------------------------------------------------------------
  const v = new TestRunner('TinyColorValidator');
  section('TinyColorValidator - validators', '✅');
  v.equal(TinyColorValidator.isHex('#fff'), true, 'isHex accepts short hex');
  v.equal(TinyColorValidator.isHex('#ffffff'), true, 'isHex accepts long hex');
  v.equal(TinyColorValidator.isHex('#ffffffff'), false, 'isHex rejects 8-digit hex');
  v.equal(TinyColorValidator.isHexa('#ffffffff'), true, 'isHexa accepts 8-digit hex');
  v.equal(TinyColorValidator.isRgb('rgb(255, 0, 0)'), true, 'isRgb');
  v.equal(TinyColorValidator.isRgba('rgba(0,255,0,0.5)'), true, 'isRgba');
  v.equal(TinyColorValidator.isHsl('hsl(120, 100%, 50%)'), true, 'isHsl');
  v.equal(TinyColorValidator.isHsla('hsla(240,100%,50%,0.3)'), true, 'isHsla');
  v.equal(TinyColorValidator.isHwb('hwb(200 20% 30%)'), true, 'isHwb');
  v.equal(TinyColorValidator.isName('rebeccapurple'), true, 'isName');
  v.equal(TinyColorValidator.isSpecialName('transparent'), true, 'isSpecialName');
  v.equal(TinyColorValidator.isColor('rebeccapurple'), 'name', 'isColor returns the type');
  v.equal(TinyColorValidator.isColor('not-a-color'), null, 'isColor returns null when invalid');

  // ---------------------------------------------------------------------
  // Validator - parsers
  // ---------------------------------------------------------------------
  section('TinyColorValidator - parsers', '🔬');
  v.equal(TinyColorValidator.parseHex('#ff8800'), 'ff8800', 'parseHex');
  v.deepEqual(TinyColorValidator.parseRgb('rgb(255, 0, 0)'), [255, 0, 0], 'parseRgb');
  v.deepEqual(TinyColorValidator.parseRgba('rgba(0, 255, 0, 0.5)'), [0, 255, 0, 0.5], 'parseRgba');
  v.deepEqual(TinyColorValidator.parseHsl('hsl(120, 100%, 50%)'), [120, 100, 50], 'parseHsl');
  v.equal(TinyColorValidator.parseRgb('nope'), null, 'parseRgb returns null when invalid');

  // ---------------------------------------------------------------------
  // Validator - instance API + registries
  // ---------------------------------------------------------------------
  section('TinyColorValidator - instance & registries', '🗂️');
  const instance = new TinyColorValidator('rgb(255, 0, 0)');
  v.equal(instance.isRgb(), true, 'Instance isRgb');
  v.deepEqual(instance.parseRgb(), [255, 0, 0], 'Instance parseRgb');

  const before = TinyColorValidator.getNames().length;
  TinyColorValidator.addName('puddingpink');
  v.equal(TinyColorValidator.hasName('puddingpink'), true, 'addName registers a color');
  TinyColorValidator.removeName('puddingpink');
  v.equal(TinyColorValidator.hasName('puddingpink'), false, 'removeName unregisters a color');
  v.equal(TinyColorValidator.getNames().length, before, 'Registry size is restored');

  console.log(`\n${color('gray', 'Color test-suite finished.')}`);

  return t.summary() + v.summary();
};

export default testColor;
