import { TinyNeedBar } from '/src/v1/libs/game/TinyNeedBar.mjs';

window.TinyNeedBar = TinyNeedBar;
let bar = null;
let autoInterval = null;

const logEl = document.getElementById('log');
const needBarsEl = document.getElementById('needBars');

function log(msg) {
  const time = new Date().toLocaleTimeString();
  logEl.innerHTML += `[${time}] ${msg}<br>`;
  logEl.scrollTop = logEl.scrollHeight;
}

function renderBar() {
  if (!bar) return;
  needBarsEl.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'need-bar';

  const progress = document.createElement('div');
  progress.className = 'progress';

  const inner = document.createElement('div');
  inner.className = 'progress-inner';
  inner.style.width = bar.currentPercent + '%';
  progress.appendChild(inner);

  const details = document.createElement('div');
  details.className = 'bar-details';
  details.innerHTML = `
        <span>Value: ${bar.currentValue.toFixed(2)} / ${bar.maxValue}</span>
        <span>${bar.currentPercent.toFixed(1)}%</span>
      `;

  const factors = document.createElement('div');
  factors.className = 'factors-list';
  factors.innerHTML =
    '<b>Factors:</b><br>' +
    Object.entries(bar.factors)
      .map(([k, f]) => `${k}: amount=${f.amount}, multiplier=${f.multiplier}`)
      .join('<br>');

  wrapper.appendChild(progress);
  wrapper.appendChild(details);
  wrapper.appendChild(factors);

  needBarsEl.appendChild(wrapper);
}

// Controls
document.getElementById('createBar').onclick = () => {
  const maxValue = +document.getElementById('maxValue').value;
  const baseDecay = +document.getElementById('baseDecay').value;
  const baseMulti = +document.getElementById('baseMulti').value;

  bar = new TinyNeedBar(maxValue, baseDecay, baseMulti);
  window.barStatus = bar;
  log('Created new bar');
  renderBar();
};

document.getElementById('addFactor').onclick = () => {
  if (!bar) return;
  const key = document.getElementById('factorKey').value;
  const amount = +document.getElementById('factorAmount').value;
  const multi = +document.getElementById('factorMulti').value;
  bar.setFactor(key, amount, multi);
  log(`Set factor "${key}" (amount=${amount}, multiplier=${multi})`);
  renderBar();
};

document.getElementById('removeFactor').onclick = () => {
  if (!bar) return;
  const key = document.getElementById('factorKey').value;
  bar.removeFactor(key);
  log(`Removed factor "${key}"`);
  renderBar();
};

document.getElementById('tickOnce').onclick = () => {
  if (!bar) return;
  const result = bar.tick();
  console.log(result);
  log(`Tick: -${result.removedTotal} (→ ${result.remainingValue})`);
  renderBar();
};

document.getElementById('startAuto').onclick = () => {
  if (!bar || autoInterval) return;
  autoInterval = setInterval(() => {
    const result = bar.tick();
    log(`Auto tick: -${result.removedTotal} (→ ${result.remainingValue})`);
    renderBar();
  }, 1000);
  log('Started auto tick');
};

document.getElementById('stopAuto').onclick = () => {
  clearInterval(autoInterval);
  autoInterval = null;
  log('Stopped auto tick');
};

document.getElementById('resetBar').onclick = () => {
  if (!bar) return;
  bar.infiniteValue = bar.maxValue;
  log('Bar reset to max');
  renderBar();
};

document.getElementById('exportJson').onclick = () => {
  if (!bar) return;
  document.getElementById('jsonArea').value = JSON.stringify(bar.toJSON(), null, 2);
  log('Exported JSON');
};

document.getElementById('importJson').onclick = () => {
  const raw = document.getElementById('jsonArea').value;
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    bar = TinyNeedBar.fromJSON(data);
    log('Imported JSON');
    renderBar();
  } catch (e) {
    log('Error importing JSON: ' + e.message);
  }
};
