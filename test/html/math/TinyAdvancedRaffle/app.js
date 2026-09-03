// -------------------------------------
// Tester wiring for TinyAdvancedRaffle
// - Assumes ./TinyAdvancedRaffle.js exports default class TinyAdvancedRaffle
// - All code in English; safe to edit; extensive comments.
// -------------------------------------
import { TinyAdvancedRaffle } from '/src/v1/libs/math/TinyAdvancedRaffle.mjs';

// create engine
const engine = new TinyAdvancedRaffle({ seed: null, normalization: 'relative' });
window.tinyEngine = engine;

// UI references
const itemsTbody = document.querySelector('#itemsTable tbody');
const btnAddItem = document.getElementById('btnAddItem');
const newItemId = document.getElementById('newItemId');
const newItemLabel = document.getElementById('newItemLabel');
const newItemWeight = document.getElementById('newItemWeight');
const newItemGroups = document.getElementById('newItemGroups');
const btnDraw = document.getElementById('btnDraw');
const btnSimulate = document.getElementById('btnSimulate');
const historyList = document.getElementById('historyList');
const distributionChart = document.getElementById('distributionChart');
const statTotal = document.getElementById('statTotal');
const statUnique = document.getElementById('statUnique');
const statTop = document.getElementById('statTop');
const summary = document.getElementById('summary');
const btnPopulateExample = document.getElementById('btnPopulateExample');
const btnReset = document.getElementById('btnReset');
const btnExportJson = document.getElementById('btnExportJson');
const btnLoadJson = document.getElementById('btnLoadJson');
const jsonConfig = document.getElementById('jsonConfig');
const seedInput = document.getElementById('seedInput');
const drawCount = document.getElementById('drawCount');
const withReplacement = document.getElementById('withReplacement');
const ensureUnique = document.getElementById('ensureUnique');
const btnClearHistory = document.getElementById('btnClearHistory');

const tmpTarget = document.getElementById('tmpTarget');
const tmpDelta = document.getElementById('tmpDelta');
const tmpUses = document.getElementById('tmpUses');
const btnAddTmp = document.getElementById('btnAddTmp');

const globalModifierCode = document.getElementById('globalModifierCode');
const btnAddGlobal = document.getElementById('btnAddGlobal');
const btnClearGlobal = document.getElementById('btnClearGlobal');

// local state for history & frequencies
let history = [];
const freq = new Map();

// helper: render items table from engine.items
function renderItemsTable() {
  itemsTbody.innerHTML = '';
  const items = engine.listItems();
  for (const it of items) {
    const tr = document.createElement('tr');

    const tdId = document.createElement('td');
    tdId.textContent = it.id;
    const tdLabel = document.createElement('td');
    tdLabel.textContent = it.label;
    const tdWeight = document.createElement('td');
    const inputW = document.createElement('input');
    inputW.type = 'number';
    inputW.value = it.baseWeight;
    inputW.min = 0;
    inputW.step = 'any';
    inputW.style.width = '100px';
    inputW.addEventListener('change', () => {
      engine.setBaseWeight(it.id, Number(inputW.value));
      updateDistribution();
    });
    tdWeight.appendChild(inputW);

    const tdGroups = document.createElement('td');
    tdGroups.textContent = Array.from(it.groups || []).join(', ');

    const tdPity = document.createElement('td');
    const pityBtn = document.createElement('button');
    pityBtn.className = 'small btn secondary';
    pityBtn.textContent = 'configure';
    pityBtn.addEventListener('click', () => openPityEditor(it));
    tdPity.appendChild(pityBtn);

    const tdActions = document.createElement('td');
    const delBtn = document.createElement('button');
    delBtn.className = 'small btn secondary';
    delBtn.textContent = 'remove';
    delBtn.addEventListener('click', () => {
      engine.removeItem(it.id);
      renderItemsTable();
      updateDistribution();
    });
    tdActions.appendChild(delBtn);

    tr.append(tdId, tdLabel, tdWeight, tdGroups, tdPity, tdActions);
    itemsTbody.appendChild(tr);
  }
  updateSummary();
}

function updateSummary() {
  summary.textContent = `items: ${engine.size} • normalization: ${engine.normalization}`;
}

// open pity editor (simple prompt-based editor for now)
function openPityEditor(item) {
  const existing = engine.pitySystems.get(item.id);
  const threshold = existing ? existing.threshold : 0;
  const increment = existing ? existing.increment : 0;
  const cap = existing ? existing.cap : Infinity;
  const t = prompt(
    `Configure pity for "${item.id}"\nthreshold (draws without item):`,
    threshold || 0,
  );
  if (t === null) return;
  const inc = prompt('increment (added weight each step):', increment || 0);
  if (inc === null) return;
  const c = prompt('cap (max added weight) (empty = no cap):', isFinite(cap) ? cap : '');
  if (c === null) return;
  const cfg = {
    threshold: Number(t),
    increment: Number(inc),
    cap: c === '' ? Infinity : Number(c),
  };
  if (cfg.threshold > 0 && cfg.increment > 0) {
    engine.configurePity(item.id, cfg);
    alert('Pity configured — acceptable default for testing.');
  } else {
    alert('Invalid pity configuration (threshold and increment must be > 0).');
  }
}

// add item button
btnAddItem.addEventListener('click', () => {
  const id = (newItemId.value || '').trim();
  if (!id) {
    alert('id is required');
    return;
  }
  const label = (newItemLabel.value || id).trim();
  const w = newItemWeight.value !== '' ? Number(newItemWeight.value) : 1;
  const groups = (newItemGroups.value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  engine.addItem(id, { weight: w, label, meta: {}, groups });
  newItemId.value = '';
  newItemLabel.value = '';
  newItemWeight.value = '';
  newItemGroups.value = '';
  renderItemsTable();
  updateDistribution();
});

// add temporary modifier
btnAddTmp.addEventListener('click', () => {
  const target = (tmpTarget.value || '').trim();
  const delta = Number(tmpDelta.value) || 0;
  const uses = Number(tmpUses.value) || 1;
  if (!target || !delta) {
    alert('Provide target (item id or "group:NAME") and non-zero delta');
    return;
  }

  // build modifier function
  const fn = (weights) => {
    const out = new Map();
    if (target.startsWith('group:')) {
      const groupName = target.slice(6);
      for (const [id] of weights) {
        const it = engine.getItem(id);
        if (it && it.groups && it.groups.has(groupName)) out.set(id, delta);
      }
    } else {
      if (weights.has(target)) out.set(target, delta);
    }
    return out;
  };
  engine.addTemporaryModifier(fn, uses);
  tmpTarget.value = '';
  tmpDelta.value = '';
  tmpUses.value = '';
  alert('Temporary modifier added (applies to next draws).');
  updateDistribution();
});

// global modifier editor
btnAddGlobal.addEventListener('click', () => {
  const code = globalModifierCode.value.trim();
  if (!code) {
    alert('Paste a function body or an expression that returns a Map/object');
    return;
  }
  // We'll wrap user code in a function safely (no sandbox — user code executes here).
  // The expected signature: (weightsMap, context) => Map or Object
  let fn;
  try {
    // attempt to create a function from code. We accept either a function expression or body that returns something.
    if (code.startsWith('function') || code.includes('=>')) {
      // user likely pasted full function
      // eslint-disable-next-line no-eval
      fn = eval('(' + code + ')');
    } else {
      // wrap into function body
      // eslint-disable-next-line no-eval
      fn = eval('(function(weightsMap, context){' + code + '})');
    }
    engine.addGlobalModifier(fn);
    alert('Global modifier registered.');
    globalModifierCode.value = '';
    updateDistribution();
  } catch (err) {
    console.error(err);
    alert('Error creating modifier: ' + err.message);
  }
});

btnClearGlobal.addEventListener('click', () => {
  engine.globalModifiers = [];
  alert('Global modifiers cleared.');
  updateDistribution();
});

// draw / simulate
btnDraw.addEventListener('click', async () => {
  const count = Math.max(1, Number(drawCount.value) || 1);
  const seed = seedInput.value !== '' ? Number(seedInput.value) : null;
  if (seed !== null) engine.seed = seed;

  const opts = { previousDraws: [...history], metadata: {} };
  const results = engine.drawMany(count, {
    withReplacement: withReplacement.checked,
    ensureUnique: ensureUnique.checked,
    previousDraws: opts.previousDraws,
  });
  handleResults(results);
  renderItemsTable();
  updateDistribution();
});

btnSimulate.addEventListener('click', () => {
  const n = 1000;
  const seed = seedInput.value !== '' ? Number(seedInput.value) : null;
  if (seed !== null) engine.seed = seed;
  // simulation uses engine.simulate which snapshots state
  const cloneEngine = engine.clone();
  cloneEngine.drawMany(n);
  // show top results in an alert + update a quick chart
  const freqObj = cloneEngine.freq;
  console.log('simulate freq', freqObj);
  // convert to readable
  const items = Object.keys(freqObj)
    .map((k) => ({ id: k, count: freqObj[k] }))
    .sort((a, b) => b.count - a.count);
  if (items.length === 0) {
    alert('No items available for simulation');
    return;
  }
  const top = items
    .slice(0, 6)
    .map((it) => `${it.id}: ${it.count}`)
    .join('\n');
  alert(`Simulation (${n}) results — top items:\n` + top);
  // for convenience, update distribution/chart after simulation too
  updateDistribution();
});

// export/import json
btnExportJson.addEventListener('click', () => {
  try {
    jsonConfig.value = JSON.stringify(engine.exportToJson());
    alert('Config exported to textarea below — copy and save.');
  } catch (err) {
    alert('Error exporting JSON: ' + err.message);
  }
});

btnLoadJson.addEventListener('click', () => {
  const txt = jsonConfig.value.trim();
  if (!txt) {
    alert('Paste JSON first');
    return;
  }
  try {
    engine.loadFromJson(JSON.parse(txt));
    renderItemsTable();
    updateDistribution();
    alert('Configuration loaded.');
  } catch (err) {
    console.error(err);
    alert('Error loading JSON: ' + err.message);
  }
});

// populate example
btnPopulateExample.addEventListener('click', () => {
  // reset
  engine.clearList();
  engine.temporaryModifiers = [];
  // provide 12 example items, 2 groups: rare & legendary
  for (let i = 1; i <= 12; i++) {
    const id = 'item' + i;
    const g = i >= 10 ? (i >= 12 ? ['legendary'] : ['rare']) : [];
    engine.addItem(id, {
      weight: i <= 6 ? 10 : i <= 9 ? 4 : 1,
      label: `Item ${i}`,
      groups: g,
    });
  }
  // configure pity on legendary
  engine.configurePity('item12', { threshold: 20, increment: 2, cap: 40 });
  renderItemsTable();
  updateDistribution();
  alert('Example populated (12 items). Try simulate and temporary modifiers.');
});

btnReset.addEventListener('click', () => {
  location.reload();
});

// history & display
function handleResults(results) {
  if (!Array.isArray(results)) results = results ? [results] : [];
  for (const r of results) {
    if (!r) continue;
    history.push(r);
    // update frequency
    freq.set(r.id, (freq.get(r.id) || 0) + 1);
    const el = document.createElement('div');
    el.className = 'history-item';
    el.innerHTML = `<div><strong>${r.id}</strong> <span class="muted">(${(r.prob * 100).toFixed(2)}%)</span></div><div class="muted">${r.label}</div>`;
    historyList.prepend(el);
  }
  updateStats();
}

btnClearHistory.addEventListener('click', () => {
  history = [];
  freq.clear();
  historyList.innerHTML = '';
  updateStats();
});

function updateStats() {
  statTotal.textContent = String(history.length || 0);
  statUnique.textContent = String(freq.size);
  // top pick
  let topPair = null;
  for (const [k, v] of freq) {
    if (!topPair || v > topPair[1]) topPair = [k, v];
  }
  statTop.textContent = topPair ? `${topPair[0]} (${topPair[1]})` : '—';
}

// distribution chart: simple SVG horizontal bars
function updateDistribution() {
  const weights = engine.computeEffectiveWeights({ previousDraws: history, metadata: {} });
  const dist = engine._weightsToDistribution(weights);
  // clear
  distributionChart.innerHTML = '';
  if (!dist.length) {
    distributionChart.innerHTML = '<div class="muted">No items available</div>';
    updateSummary();
    return;
  }
  // build a simple list with bars
  const container = document.createElement('div');
  const maxP = Math.max(...dist.map((d) => d.p));
  for (const d of dist.sort((a, b) => b.p - a.p)) {
    const row = document.createElement('div');
    const titleRow = document.createElement('div');
    titleRow.style.display = 'flex';
    titleRow.style.justifyContent = 'space-between';
    titleRow.innerHTML = `<div><strong>${d.id}</strong> <span class="muted">${d.weight.toFixed(3)}</span></div><div class="muted">${(d.p * 100).toFixed(3)}%</div>`;
    const barWrap = document.createElement('div');
    barWrap.style.marginTop = '6px';
    const bar = document.createElement('div');
    bar.className = 'bar';
    const widthPercent = (d.p / maxP) * 100;
    bar.style.width = Math.max(6, widthPercent) + '%';
    bar.title = `${(d.p * 100).toFixed(4)}%`;
    barWrap.appendChild(bar);
    row.appendChild(titleRow);
    row.appendChild(barWrap);
    row.style.marginBottom = '12px';
    container.appendChild(row);
  }
  distributionChart.appendChild(container);

  // update summary
  updateSummary();
}

// initial render
renderItemsTable();
updateDistribution();

// small safety: listen to engine 'draw' events if provided
engine.on('draw', (payload) => {
  // optional: if engine emits draw, we mirror it into history
  // but to avoid double counting, only accept if not already in history's last element
  const last = history[history.length - 1];
  if (!last || last.id !== payload.id) {
    // do not auto-add — leave draws triggered by UI only
  }
});

// keyboard shortucts
window.addEventListener('keydown', (ev) => {
  if ((ev.ctrlKey || ev.metaKey) && ev.key === 'd') {
    ev.preventDefault();
    btnDraw.click();
  }
  if ((ev.ctrlKey || ev.metaKey) && ev.key === 's') {
    ev.preventDefault();
    btnSimulate.click();
  }
});

// expose engine for debugging via window
window.__AdvancedRaffleEngine = engine;
window.__RaffleUI = { updateDistribution, renderItemsTable, handleResults };

// developer note: if your TinyAdvancedRaffle API differs in method names, adapt the small glue code above.
