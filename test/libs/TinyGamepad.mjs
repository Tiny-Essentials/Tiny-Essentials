import { TestRunner, section, color } from './_helpers.mjs';

/**
 * Node.js port of the browser based TinyGamepad test environment
 * (`test/html/game/TinyGamepad`).
 *
 * The DOM globals required by the constructor are polyfilled before the module
 * is imported so the class can be exercised outside of a real browser.
 *
 * @returns {Promise<void>}
 */

// ---------------------------------------------------------------------------
// Minimal DOM polyfill
// ---------------------------------------------------------------------------
class Window {}
class Element {}
class GamepadHapticActuator {}

let elementStub;

/**
 * (Re)installs the DOM polyfill. Sibling test modules (e.g. the shared DOM
 * helper) replace `globalThis.Element`/`globalThis.Window`, so the polyfill is
 * re-applied before every use and the stub is rebuilt from the current globals.
 */
const installDom = () => {
  globalThis.Window = Window;
  globalThis.Element = Element;
  globalThis.GamepadHapticActuator = GamepadHapticActuator;

  const windowStub = new Window();
  windowStub.addEventListener = () => {};
  windowStub.removeEventListener = () => {};

  elementStub = new Element();
  elementStub.addEventListener = () => {};
  elementStub.removeEventListener = () => {};

  // Merge into any existing window stub so sibling test modules keep working.
  if (typeof globalThis.window !== 'object' || globalThis.window === null) {
    globalThis.window = {};
  }
  for (const key of Object.getOwnPropertyNames(windowStub)) {
    globalThis.window[key] = windowStub[key];
  }
  globalThis.document = globalThis.document || {
    addEventListener: () => {},
    removeEventListener: () => {},
  };
};

installDom();

const { default: TinyGamepad } = await import('../../dist/v1/libs/game/TinyGamepad.mjs');

/**
 * Node.js port of the browser TinyGamepad test environment.
 * @returns {Promise<number>}
 */
const testTinyGamepad = async () => {
  // Re-apply the polyfill: sibling test modules may have replaced the globals.
  installDom();

  const t = new TestRunner('TinyGamepad');

  // -------------------------------------------------------------------
  // Static helpers
  // -------------------------------------------------------------------
  section('TinyGamepad - static helpers', '🎮');
  t.deepEqual(
    TinyGamepad.stringToKeys('ab1'),
    ['KeyA', 'KeyB', 'Digit1'],
    'stringToKeys maps text',
  );
  t.deepEqual(TinyGamepad.stringToKeys(' '), ['Space'], 'stringToKeys maps special keys');
  t.throws(() => TinyGamepad.stringToKeys(''), 'stringToKeys rejects empty strings');
  t.throws(() => TinyGamepad.stringToKeys(5), 'stringToKeys rejects non-strings');

  t.equal(TinyGamepad.getSpecialKey(' '), 'Space', 'getSpecialKey resolves a mapping');
  TinyGamepad.addSpecialKey('§', 'Section');
  t.equal(TinyGamepad.getSpecialKey('§'), 'Section', 'addSpecialKey registers a mapping');
  TinyGamepad.removeSpecialKey('§');
  t.equal(TinyGamepad.getSpecialKey('§'), undefined, 'removeSpecialKey deletes a mapping');
  t.ok(Object.keys(TinyGamepad.getAllSpecialKeys()).length > 0, 'getAllSpecialKeys returns a copy');
  t.throws(() => TinyGamepad.addSpecialKey('ab', 'X'), 'addSpecialKey validates the char length');

  // -------------------------------------------------------------------
  // Construction
  // -------------------------------------------------------------------
  section('TinyGamepad - construction', '🕹️');
  const gamepad = new TinyGamepad({ elementBase: elementStub, inputMode: 'keyboard-only' });
  t.ok(gamepad instanceof TinyGamepad, 'Creates an instance');
  t.throws(
    () => new TinyGamepad({ elementBase: elementStub, inputMode: 'nope' }),
    'Rejects an invalid input mode',
  );
  t.throws(
    () => new TinyGamepad({ elementBase: elementStub, deadZone: 5 }),
    'Rejects an invalid dead zone',
  );
  t.throws(
    () => new TinyGamepad({ elementBase: elementStub, allowMouse: 'yes' }),
    'Rejects an invalid allowMouse flag',
  );
  t.throws(() => new TinyGamepad({ elementBase: {} }), 'Rejects an invalid elementBase');

  // -------------------------------------------------------------------
  // Input mapping
  // -------------------------------------------------------------------
  section('TinyGamepad - input mapping', '🗺️');
  t.equal(gamepad.mappedInputSize, 0, 'Starts with no mapped inputs');
  gamepad.mapInput('Jump', 'Space');
  t.equal(gamepad.hasMappedInput('Jump'), true, 'mapInput registers a mapping');
  t.equal(gamepad.getMappedInput('Jump'), 'Space', 'getMappedInput returns the mapping');
  t.throws(() => gamepad.getMappedInput('Ghost'), 'getMappedInput throws for unknown inputs');
  gamepad.unmapInput('Jump');
  t.equal(gamepad.hasMappedInput('Jump'), false, 'unmapInput removes a mapping');
  t.throws(() => gamepad.mapInput('', 'Space'), 'mapInput validates the logical name');
  gamepad.clearMapInputs();
  t.equal(gamepad.mappedInputSize, 0, 'clearMapInputs empties the registry');

  // -------------------------------------------------------------------
  // Sequences
  // -------------------------------------------------------------------
  section('TinyGamepad - sequences', '🎯');
  gamepad.registerInputSequence(['A', 'B'], () => {});
  t.equal(gamepad.hasInputSequence(['A', 'B']), true, 'registerInputSequence registers');
  t.equal(gamepad.inputSequenceSize, 1, 'Tracks the amount of input sequences');
  gamepad.unregisterInputSequence(['A', 'B']);
  t.equal(gamepad.hasInputSequence(['A', 'B']), false, 'unregisterInputSequence removes');
  t.throws(() => gamepad.registerInputSequence([], () => {}), 'Rejects empty sequences');

  gamepad.registerKeySequence(['KeyA', 'KeyB'], () => {});
  t.equal(gamepad.hasKeySequence(['KeyA', 'KeyB']), true, 'registerKeySequence registers');
  t.equal(gamepad.keySequenceSize, 1, 'Tracks the amount of key sequences');
  gamepad.unregisterAllKeySequences();
  t.equal(gamepad.keySequenceSize, 0, 'unregisterAllKeySequences clears the registry');

  // -------------------------------------------------------------------
  // Configuration
  // -------------------------------------------------------------------
  section('TinyGamepad - configuration', '⚙️');
  gamepad.mapInput('Jump', 'Space');
  const config = gamepad.exportConfig();
  t.equal(config.deadZone, 0.1, 'exportConfig includes the dead zone');
  t.ok(Array.isArray(config.inputMap), 'exportConfig serializes the input map');

  const other = new TinyGamepad({ elementBase: elementStub, inputMode: 'keyboard-only' });
  other.importConfig(config);
  t.equal(other.getMappedInput('Jump'), 'Space', 'importConfig restores the input map');
  t.throws(() => other.importConfig(5), 'importConfig validates the input type');

  console.log(`\n${color('gray', 'TinyGamepad test-suite finished.')}`);

  return t.summary();
};

export default testTinyGamepad;
