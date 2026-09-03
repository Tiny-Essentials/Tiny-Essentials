import { TinySimpleDice } from '/src/v1/libs/math/TinySimpleDice.mjs';
let dice = null;
window.TinySimpleDice = TinySimpleDice;

// Create dice
document.getElementById('createDice').addEventListener('click', () => {
  const maxValue = parseInt(document.getElementById('maxValue').value, 10);
  const allowZero = document.getElementById('allowZero').checked;
  try {
    window.dice = dice;
    dice = new TinySimpleDice({ maxValue, allowZero });
    document.getElementById('diceStatus').textContent =
      `Dice created with maxValue=${maxValue}, allowZero=${allowZero}`;
  } catch (err) {
    document.getElementById('diceStatus').textContent = `Error: ${err.message}`;
  }
});

// Roll dice
document.getElementById('rollDice').addEventListener('click', () => {
  if (!dice) {
    document.getElementById('rollResult').textContent = 'Please create a dice first.';
    return;
  }
  const result = dice.roll();
  document.getElementById('rollResult').textContent = `Roll result: ${result}`;
});

// Roll array/set index
document.getElementById('rollArray').addEventListener('click', () => {
  const input = document.getElementById('arrayInput').value;
  const useSet = document.getElementById('useSet').checked;
  const items = input
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s);
  let collection = useSet ? new Set(items) : items;

  try {
    const index = TinySimpleDice.rollArrayIndex(collection);
    const value = useSet ? Array.from(collection)[index] : collection[index];
    document.getElementById('arrayResult').textContent = `Index: ${index}, Value: ${value}`;
  } catch (err) {
    document.getElementById('arrayResult').textContent = `Error: ${err.message}`;
  }
});
