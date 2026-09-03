// =================== PRESETS ===================
/** Default presets with broad coverage. Values are GB per 1B params. */
const DEFAULT_PRESETS = [
  // Floats
  { name: 'FP32', gbPerB: 4.0, note: '32-bit float storage' },
  { name: 'BF16', gbPerB: 2.0, note: '16-bit bfloat storage' },
  { name: 'FP16', gbPerB: 2.0, note: '16-bit float storage' },
  { name: 'FP8', gbPerB: 1.0, note: '8-bit float (approx, storage parity with INT8)' },

  // Plain INT
  { name: 'INT8', gbPerB: 1.0, note: '8-bit integer' },
  { name: 'INT6', gbPerB: 0.75, note: '6-bit integer (approx)' },
  { name: 'INT5', gbPerB: 0.625, note: '5-bit integer (approx)' },
  { name: 'INT4', gbPerB: 0.5, note: '4-bit integer (ideal)' },
  { name: 'INT3', gbPerB: 0.375, note: '3-bit integer (approx)' },
  { name: 'INT2', gbPerB: 0.25, note: '2-bit integer (approx)' },

  // GGUF/GGML families
  { name: 'Q2_K', gbPerB: 0.34, note: 'GGUF block 2-bit (approx overhead)' },
  { name: 'Q3_K_M', gbPerB: 0.39, note: 'GGUF 3-bit medium' },
  { name: 'Q3_K_S', gbPerB: 0.44, note: 'GGUF 3-bit small' },
  { name: 'Q4_0', gbPerB: 0.54, note: 'GGUF 4-bit baseline' },
  { name: 'Q4_1', gbPerB: 0.68, note: 'GGUF 4-bit higher fidelity' },
  { name: 'Q4_K_M', gbPerB: 0.62, note: 'GGUF 4-bit K_M' },
  { name: 'Q4_K_S', gbPerB: 0.67, note: 'GGUF 4-bit K_S' },
  { name: 'Q5_0', gbPerB: 0.8, note: 'GGUF 5-bit baseline' },
  { name: 'Q5_1', gbPerB: 0.83, note: 'GGUF 5-bit higher fidelity' },
  { name: 'Q5_K_M', gbPerB: 0.79, note: 'GGUF 5-bit K_M' },
  { name: 'Q5_K_S', gbPerB: 0.82, note: 'GGUF 5-bit K_S' },
  { name: 'Q6_K', gbPerB: 0.98, note: 'GGUF 6-bit K' },
  { name: 'Q8_0', gbPerB: 1.0, note: 'GGUF 8-bit baseline' },

  // GPTQ / AWQ / BitsAndBytes styles (approximate storage costs)
  { name: 'GPTQ-8bit', gbPerB: 1.0, note: 'GPTQ 8-bit weights' },
  { name: 'GPTQ-6bit', gbPerB: 0.75, note: 'GPTQ 6-bit (approx)' },
  { name: 'GPTQ-5bit', gbPerB: 0.625, note: 'GPTQ 5-bit (approx)' },
  { name: 'GPTQ-4bit-g128', gbPerB: 0.56, note: 'GPTQ 4-bit, group 128 (approx overhead)' },
  { name: 'GPTQ-4bit-g64', gbPerB: 0.6, note: 'GPTQ 4-bit, group 64 (more overhead)' },
  { name: 'GPTQ-3bit', gbPerB: 0.42, note: 'GPTQ 3-bit (approx)' },
  { name: 'AWQ-4bit', gbPerB: 0.58, note: 'AWQ 4-bit (approx)' },
  { name: 'NF4-4bit', gbPerB: 0.56, note: 'BitsAndBytes NF4 (approx)' },
  { name: 'FP4-4bit', gbPerB: 0.56, note: '4-bit float family (approx)' },
];

const MODEL_SIZES = [1, 3, 7, 13, 33, 70, 110];

// State
let presets = [];

// =================== Helpers ===================
const $ = (id) => document.getElementById(id);
const fmt = (n) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
const modelGB = (b, gPerB) => b * gPerB;
const kvGB = (mbPerTok, ctx, batch, scale) => (mbPerTok * ctx * batch * scale) / 1024;
const withOverhead = (gb, pct) => gb * (1 + pct / 100);

const loadPresets = () => {
  const saved = localStorage.getItem('llm-vram-presets');
  presets = saved ? JSON.parse(saved) : DEFAULT_PRESETS.slice();
};
const savePresets = () => localStorage.setItem('llm-vram-presets', JSON.stringify(presets));

const rebuildPresetSelect = () => {
  const sel = $('precision');
  sel.innerHTML = '';
  presets.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.name;
    opt.textContent = `${p.name} — ${fmt(p.gbPerB)} GB/1B`;
    sel.appendChild(opt);
  });
  const idx =
    presets.findIndex((p) => p.name === 'Q4_K_M') !== -1
      ? presets.findIndex((p) => p.name === 'Q4_K_M')
      : presets.findIndex((p) => p.name === 'FP16');
  sel.selectedIndex = idx >= 0 ? idx : 0;
};

const rebuildPresetTable = () => {
  const tbody = document.querySelector('#presetTable tbody');
  tbody.innerHTML = '';
  presets.forEach((p) => {
    const tr = document.createElement('tr');
    const tdN = document.createElement('td');
    tdN.textContent = p.name;
    tdN.style.textAlign = 'left';
    const tdG = document.createElement('td');
    tdG.textContent = fmt(p.gbPerB);
    const tdNote = document.createElement('td');
    tdNote.textContent = p.note || '';
    tr.appendChild(tdN);
    tr.appendChild(tdG);
    tr.appendChild(tdNote);
    tr.addEventListener('click', () => {
      $('qName').value = p.name;
      $('qGBPerB').value = p.gbPerB;
      $('qNote').value = p.note || '';
    });
    tbody.appendChild(tr);
  });
};

const rebuildRefTable = () => {
  const tbody = document.querySelector('#refTable tbody');
  tbody.innerHTML = '';
  presets.forEach((p) => {
    const tr = document.createElement('tr');
    const td0 = document.createElement('td');
    td0.textContent = p.name;
    td0.style.textAlign = 'left';
    tr.appendChild(td0);
    MODEL_SIZES.forEach((B) => {
      const td = document.createElement('td');
      td.textContent = fmt(modelGB(B, p.gbPerB));
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
};

const currentPreset = () => {
  const name = $('precision').value;
  return presets.find((p) => p.name === name);
};

// =================== Calculator ===================
const renderResults = ({ modelOnlyGB, kvOnlyGB, subtotalGB, totalGB }) => {
  const wrap = $('resultBlocks');
  wrap.innerHTML = '';
  const block = (title, gb) => {
    const card = document.createElement('div');
    card.className = 'card';
    const h3 = document.createElement('h3');
    h3.textContent = title;
    const p = document.createElement('p');
    p.style.fontSize = '1.15rem';
    p.style.fontWeight = '800';
    p.textContent = fmt(gb) + ' GB';
    card.appendChild(h3);
    card.appendChild(p);
    wrap.appendChild(card);
  };
  block('Model size', modelOnlyGB);
  block('KV-cache', kvOnlyGB);
  block('Subtotal (model + KV)', subtotalGB);
  block('Total with overhead', totalGB);
};

const renderFit = (total, gpu) => {
  const fit = $('fitStatus');
  fit.className = 'status';
  if (!(gpu > 0)) {
    fit.classList.add('warn');
    fit.textContent = 'Please set a valid GPU VRAM';
    return;
  }
  const r = total / gpu;
  if (r <= 0.9) {
    fit.classList.add('ok');
    fit.textContent = 'Fits comfortably';
  } else if (r <= 1.0) {
    fit.classList.add('warn');
    fit.textContent = 'Fits, but tight — reduce context/overhead';
  } else {
    fit.classList.add('fail');
    fit.textContent = 'Does NOT fit — consider quantization/offloading';
  }
};

const calculate = () => {
  const modelB = parseFloat($('modelB').value);
  const gpuGB = parseFloat($('gpuVram').value);
  const overhead = parseFloat($('overhead').value);
  const ctx = parseInt($('contextLen').value, 10);
  const batch = parseInt($('batchSize').value, 10);
  const kvMB = parseFloat($('kvPerToken').value);
  const kvScale = parseFloat($('kvScaling').value);

  const preset = currentPreset();
  const modelOnlyGB = modelGB(modelB, preset.gbPerB);
  const kvOnlyGB = kvGB(kvMB, ctx, batch, kvScale);
  const subtotalGB = modelOnlyGB + kvOnlyGB;
  const totalGB = withOverhead(subtotalGB, overhead);

  renderResults({ modelOnlyGB, kvOnlyGB, subtotalGB, totalGB });
  renderFit(totalGB, gpuGB);
};

// =================== CRUD Presets ===================
$('addUpdatePreset').addEventListener('click', () => {
  const name = $('qName').value.trim();
  const gbPerB = parseFloat($('qGBPerB').value);
  const note = $('qNote').value.trim();
  if (!name || !(gbPerB > 0)) {
    alert('Please provide a valid name and GB/1B value.');
    return;
  }
  const idx = presets.findIndex((p) => p.name === name);
  if (idx >= 0) presets[idx] = { name, gbPerB, note };
  else presets.push({ name, gbPerB, note });
  savePresets();
  rebuildPresetSelect();
  rebuildPresetTable();
  rebuildRefTable();
  calculate();
  $('qName').value = '';
  $('qGBPerB').value = '';
  $('qNote').value = '';
});

$('deletePreset').addEventListener('click', () => {
  const name = $('qName').value.trim();
  if (!name) {
    alert('Select or type a preset name to delete.');
    return;
  }
  const idx = presets.findIndex((p) => p.name === name);
  if (idx >= 0) {
    presets.splice(idx, 1);
    savePresets();
    rebuildPresetSelect();
    rebuildRefTable();
    rebuildPresetTable();
    calculate();
  }
  $('qName').value = '';
  $('qGBPerB').value = '';
  $('qNote').value = '';
});

// =================== Import/Export ===================
$('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(presets, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'llm_vram_presets.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
});

$('importBtn').addEventListener('click', () => $('importFile').click());
$('importFile').addEventListener('change', async (ev) => {
  const file = ev.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error('Invalid JSON (expected array)');
    data.forEach((x) => {
      if (!x.name || !(x.gbPerB > 0)) throw new Error('Invalid preset entry');
    });
    presets = data;
    savePresets();
    rebuildPresetSelect();
    rebuildPresetTable();
    rebuildRefTable();
    calculate();
  } catch (e) {
    alert('Failed to import: ' + e.message);
  } finally {
    ev.target.value = '';
  }
});

// =================== Presets/Ref/Init ===================
const init = () => {
  const saved = localStorage.getItem('llm-vram-presets');
  presets = saved ? JSON.parse(saved) : DEFAULT_PRESETS.slice();
  rebuildPresetSelect();
  rebuildPresetTable();
  rebuildRefTable();
  calculate();

  document.querySelectorAll('input, select').forEach((el) => {
    el.addEventListener('change', calculate);
    el.addEventListener('input', calculate);
  });

  $('preset3060').addEventListener('click', () => {
    $('gpuVram').value = 12;
    $('modelB').value = 7;
    $('precision').value = 'Q4_K_M';
    $('contextLen').value = 4096;
    $('kvPerToken').value = 0.5;
    $('overhead').value = 15;
    $('batchSize').value = 1;
    $('kvScaling').value = (7 / 7).toFixed(1);
    calculate();
  });
  $('preset4090').addEventListener('click', () => {
    $('gpuVram').value = 24;
    $('modelB').value = 13;
    $('precision').value = 'INT8';
    $('contextLen').value = 8192;
    $('kvPerToken').value = 0.5;
    $('overhead').value = 15;
    $('batchSize').value = 1;
    $('kvScaling').value = (13 / 7).toFixed(1);
    calculate();
  });
  $('preset70B').addEventListener('click', () => {
    $('gpuVram').value = 80;
    $('modelB').value = 70;
    $('precision').value = 'Q4_K_M';
    $('contextLen').value = 4096;
    $('kvPerToken').value = 0.5;
    $('overhead').value = 15;
    $('batchSize').value = 1;
    $('kvScaling').value = (70 / 7).toFixed(1);
    calculate();
  });
};

document.addEventListener('DOMContentLoaded', init);
