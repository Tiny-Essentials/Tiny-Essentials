import stringify from 'safe-stable-stringify';
import ColorSafeStringify from '../../dist/v1/libs/color/ColorSafeStringify.mjs';

const testColorSafeStringify = () => {
  const colorizer = new ColorSafeStringify();

  // 🌟 Test object containing various data types
  const testObject = {
    name: 'Yasmin',
    website: 'https://equestria.social/@jasmindreasond',
    func: () => 'pudding',
    regex: /yay/g,
    age: 27,
    bigNumber: BigInt('4398723038759973073043'),
    isBrony: true,
    language: null,
    unicodeText: 'Olá, mundo! \\u263A',
    nested: {
      boolean: false,
      nullValue: null,
      url: 'https://derpibooru.org/',
      number: 3.14,
      func: function hello() {
        return 'hi';
      },
      emoji: '🌈',
    },
  };

  // 🌀 Add artificial circular and undefined-like markers
  testObject.circular = '[Circular]';
  testObject.undefinedValue = '[undefined]';
  testObject.nested.funcString = 'function test() {}';

  // 🧪 Utility function to print with a title
  function printTest(title, json, colorizerInstance) {
    console.log(`\n🎨 === ${title} ===`);
    const result = colorizerInstance.colorize(json);
    console.log(result);
  }

  const jsonString = stringify(testObject, null, 2);

  // 🔹 Test with default preset
  printTest('Preset: default', jsonString, colorizer);

  // 🌞 Test with solarized preset
  colorizer.loadColorPreset('solarized');
  printTest('Preset: solarized', jsonString, colorizer);

  // 🌑 Test with monokai preset
  colorizer.loadColorPreset('monokai');
  printTest('Preset: monokai', jsonString, colorizer);

  // 🍬 Create a custom "candy" preset (pink & red tones)
  colorizer.saveColorPreset('candy', {
    reset: '\x1b[0m',
    key: '\x1b[95m',
    string: '\x1b[91m',
    string_url: '\x1b[35m',
    string_bool: '\x1b[95m',
    string_number: '\x1b[91m',
    number: '\x1b[91m',
    boolean: '\x1b[95m',
    null: '\x1b[90m',
    special: '\x1b[31m',
    func: '\x1b[35m',
  });

  colorizer.loadColorPreset('candy');
  printTest('Preset: candy (custom)', jsonString, colorizer);

  // 📜 Show available presets
  console.log('\n🧰 Available presets:', colorizer.getAvailablePresets());

  // 🛠️ Test partial color update
  colorizer.updateColors({ key: '\x1b[94m' }); // Only update key color
  printTest('Preset: candy + blue keys', jsonString, colorizer);

  // 🔄 Reset to default preset
  colorizer.resetColors();
  printTest('Reset to default', jsonString, colorizer);
};

export default testColorSafeStringify;
