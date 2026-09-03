import { TinyLocalStorage } from '/src/v1/libs/storage/TinyLocalStorage.mjs';

const storage = new TinyLocalStorage('TinyTest');
window.tinyLocalStorage = storage;
window.TinyLocalStorage = TinyLocalStorage;

function log(...args) {
  const logEl = document.getElementById('log');
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.textContent = `[${new Date().toLocaleTimeString()}] ` + args.join(' ');
  logEl.prepend(entry);
}

window.runSetTests = function () {
  storage.setString('str', 'Hello World');
  storage.setNumber('num', 123.456);
  storage.setBool('bool', true);
  storage.setItem('raw', 'rawValue');
  storage.setJson('obj', { a: 1, b: 'two', c: [1, 2, Infinity] });
  storage.setJson('array', ['1', 2, 3, 4]);

  storage.setJson('obj2', {
    a: 1,
    b: new Set(['pudding']),
    c: [
      1,
      new Set([1, 2, 3]),
      new Map([
        ['pudding', 'yay'],
        ['cookie', 'yay'],
      ]),
    ],
  });

  storage.setJson('array2', [
    1,
    new Set([1, 2, new Set([1, 2, 3])]),
    new Map([
      ['pudding', 'yay'],
      ['cookie', 'yay'],
    ]),
  ]);

  storage.setJson(
    'map',
    new Map([
      ['key1', 1],
      ['key2', 2],
    ]),
  );

  storage.setJson('set', new Set(['a', 'b', 'c']));
  storage.setDate('date', new Date('2023-07-01T12:34:56Z'));
  storage.setRegExp('regex', /pudding\d+/gi);
  storage.setBigInt('big', BigInt('12345678901234567890'));
  storage.setSymbol('sym', Symbol.for('pudding'));

  log('Sample data (including extended types) stored');
};

window.runGetTests = function () {
  const str = storage.getString('str');
  const num = storage.getNumber('num');
  const bool = storage.getBool('bool');
  const raw = storage.getItem('raw');
  const obj = storage.getJson('obj', 'obj');
  const array = storage.getJson('array', 'array');
  const obj2 = storage.getJson('obj2');
  const array2 = storage.getJson('array2', 'null');
  const map = storage.getJson('map', 'map');
  const set = storage.getJson('set', 'set');

  const date = storage.getDate('date');
  const regex = storage.getRegExp('regex');
  const big = storage.getBigInt('big');
  const sym = storage.getSymbol('sym');

  log('String:', str);
  log('Number:', num);
  log('Boolean:', bool);
  log('Raw:', raw);
  log('Object:', JSON.stringify(obj));
  log('Array:', JSON.stringify(array));
  log('Map:', JSON.stringify(Array.from(map)));
  log('Set:', JSON.stringify(Array.from(set)));
  log('Date:', date?.toISOString?.() ?? String(date));
  log('RegExp:', regex?.toString?.() ?? String(regex));
  log('BigInt:', big?.toString?.() ?? String(big));
  log('Symbol:', sym?.toString?.() ?? String(sym));

  console.log('[runGetTests] String:', str);
  console.log('[runGetTests] Number:', num);
  console.log('[runGetTests] Boolean:', bool);
  console.log('[runGetTests] Raw:', raw);
  console.log('[runGetTests] Object:', obj);
  console.log('[runGetTests] Array:', array);
  console.log('[runGetTests] Object2:', obj2);
  console.log('[runGetTests] Array2:', array2);
  console.log('[runGetTests] Map:', map);
  console.log('[runGetTests] Set:', set);

  console.log('[runGetTests] Date:', date);
  console.log('[runGetTests] Regex:', regex);
  console.log('[runGetTests] Big:', big);
  console.log('[runGetTests] Symbol:', sym);
};

window.runRemoveTests = function () {
  [
    'str',
    'num',
    'bool',
    'raw',
    'obj',
    'array',
    'map',
    'set',
    'obj2',
    'array2',
    'date',
    'regex',
    'big',
    'sym',
  ].forEach((k) => storage.removeItem(k));
  log('Removed all test keys from localStorage');
};

window.manualSet = function () {
  const key = document.getElementById('manualKey').value;
  const val = document.getElementById('manualValue').value;
  storage.setItem(key, val);
  log(`Manually set ${key} = ${val}`);
};

window.manualGet = function () {
  const key = document.getElementById('manualKey').value;
  const val = storage.getItem(key);
  log(`Manually got ${key} = ${val}`);
};

window.clearLog = function () {
  document.getElementById('log').innerHTML = '';
};

// Event listeners
storage.on('setJson', (k, v) => log(`Event: setJson → ${k}`));
storage.on('setItem', (k, v) => log(`Event: setItem → ${k}`));
storage.on('setString', (k, v) => log(`Event: setString → ${k}`));
storage.on('setNumber', (k, v) => log(`Event: setNumber → ${k}`));
storage.on('setBool', (k, v) => log(`Event: setBool → ${k}`));
storage.on('setDate', (k, v) => log(`Event: setDate → ${k}`));
storage.on('setRegExp', (k, v) => log(`Event: setRegExp → ${k}`));
storage.on('setBigInt', (k, v) => log(`Event: setBigInt → ${k}`));
storage.on('setSymbol', (k, v) => log(`Event: setSymbol → ${k}`));
storage.on('removeItem', (k) => log(`Event: removeItem → ${k}`));
storage.on('storage', (e) => log(`Storage event from another tab:`, e.key));
