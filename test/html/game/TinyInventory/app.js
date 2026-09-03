import { TinyInventory } from '/src/v1/libs/game/TinyInventory.mjs';
import { TinyInventoryTrader } from '/src/v1/libs/game/TinyInventoryTrader.mjs';
import { TinyToastNotify } from '/src/v1/libs/html/notification/TinyToastNotify.mjs';

const tinyToast = new TinyToastNotify('bottom', 'right', 3000, 60);
window.TinyInventory = TinyInventory;
window.TinyInventoryTrader = TinyInventoryTrader;
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const byId = (id) => document.getElementById(id);

window.invTrader = new TinyInventoryTrader();
window.inventory2 = new TinyInventory();

/** @type {TinyInventory|null} */
let inv = null;

// ---------- Helpers ----------
function parseJSON(input, fallback = {}) {
  if (!input || !String(input).trim()) return fallback;
  try {
    return JSON.parse(input);
  } catch (e) {
    console.error(e);
    toast('Invalid JSON: ' + e.message, 'bad');
    return fallback;
  }
}
function toast(msg, type = '') {
  tinyToast.show(msg);
  console.log('[UI]', msg, type);
}

function numberOrNull(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function numberOrInfinity(v) {
  if (v === '' || v === null || v === undefined) return Infinity;
  const n = Number(v);
  return Number.isFinite(n) ? n : Infinity;
}

function renderRegistry() {
  const tbody = byId('registryTable').querySelector('tbody');
  tbody.innerHTML = '';
  const items = TinyInventory.itemRegistry;
  for (const id in items) {
    const def = items[id];
    const tr = document.createElement('tr');
    const onUse = def.onUse ? 'fn' : '-';
    tr.innerHTML = `
          <td>${id}</td>
          <td>${def.weight ?? 0}</td>
          <td>${def.maxStack}</td>
          <td>${def.type ?? '-'}</td>
          <td class="small mono">${escapeHTML(JSON.stringify(def.metadata ?? {}))}</td>
          <td>${onUse}</td>
        `;
    tbody.appendChild(tr);
  }
}

function escapeHTML(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}

function refreshKPI() {
  byId('kpiStacks').textContent = String(inv ? inv.slotsSize : 0);
  byId('kpiTotal').textContent = String(inv.size);
  byId('kpiWeight').textContent = inv ? String(inv.weight) : '0';

  byId('inv_hasSpace_result').textContent = inv && inv.hasSpace() ? 'Yes' : 'No';
  byId('inv_isHeavy_result').textContent = inv && inv.isHeavy() ? 'Yes' : 'No';
  byId('inv_areFull_result').textContent = inv && inv.areFull() ? 'Yes' : 'No';
  byId('inv_isFull_result').textContent = inv && inv.isFull() ? 'Yes' : 'No';
  byId('inv_areFullSlots_result').textContent = inv && inv.areFullSlots() ? 'Yes' : 'No';
  byId('inv_isFullSlots_result').textContent = inv && inv.isFullSlots() ? 'Yes' : 'No';

  renderDiag();
}

function renderInv() {
  const container = byId('inv_view');
  container.innerHTML = '';
  if (!inv) {
    container.innerHTML = '<div class="muted">No inventory created yet.</div>';
    return;
  }

  const chip = (text) => {
    const div = document.createElement('div');
    div.classList.add('chip');
    div.textContent = text;
    return div;
  };

  // Summary chips
  const sum = byId('inv_summary');
  sum.innerHTML = '';
  sum.append(chip(`maxWeight: ${inv.maxWeight ?? '∞'}`));
  sum.append(chip(`maxSlots: ${inv.maxSlots ?? '∞'}`));

  // Special slots
  const sp = document.createElement('div');
  sp.className = 'card';
  sp.innerHTML = `<h3>Special Slots</h3>`;
  const table = document.createElement('table');
  table.className = 'table mono small';
  table.innerHTML = `<thead><tr><th>slot</th><th>type</th><th>item</th><th>actions</th></tr></thead><tbody></tbody>`;
  const tb = table.querySelector('tbody');
  for (const [slotId, slot] of inv.specialSlots.entries()) {
    const tr = document.createElement('tr');
    const itemLabel = slot.item ? `${slot.item.id} x${slot.item.quantity}` : '-';
    tr.innerHTML = `
          <td>${slotId}</td>
          <td>${slot.type ?? '-'}</td>
          <td>${itemLabel}</td>
          <td>
            <div class="inline">
              <input data-slot="${slotId}" class="mono small" placeholder="slotIndex to equip" style="width:160px">
              <button class="btn" data-eq="${slotId}">Equip</button>
              <button class="btn" data-uneq="${slotId}">Unequip</button>
              <button class="btn" data-equse="${slotId}">Use</button>
            </div>
          </td>
        `;
    tb.appendChild(tr);
  }
  sp.appendChild(table);
  container.appendChild(sp);

  // Items
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `<h3>Items</h3>`;
  card.appendChild(renderItemsTable(inv.items));
  container.appendChild(card);

  refreshKPI();

  // Bind dynamic equip/unequip
  container.querySelectorAll('[data-eq]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const slotId = btn.getAttribute('data-eq');
      const input = container.querySelector(`input[data-slot="${slotId}"]`);
      const slotIndex = parseFloat(input.value.trim());
      if (Number.isNaN(slotIndex)) return toast('slotIndex required', 'warn');
      try {
        inv.equipItem({ slotId, slotIndex });
        logEvent('equip', { slotId, slotIndex });
        renderInv();
      } catch (e) {
        console.error(e);
        toast(e.message, 'bad');
      }
      refreshKPI();
    });
  });
  container.querySelectorAll('[data-uneq]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const slotId = btn.getAttribute('data-uneq');
      try {
        inv.unequipItem({ slotId });
        logEvent('unequip', { slotId });
        renderInv();
      } catch (e) {
        console.error(e);
        toast(e.message, 'bad');
      }
      refreshKPI();
    });
  });
  container.querySelectorAll('[data-equse]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const slotId = btn.getAttribute('data-equse');
      if (!slotId) return toast('slotIndex required', 'warn');
      try {
        inv.useItem({ specialSlot: slotId });
        logEvent('use-click', { id: slotId });
        renderInv();
      } catch (e) {
        console.error(e);
        toast(e.message, 'bad');
      }
      refreshKPI();
    });
  });
}

function renderItemsTable(set) {
  const table = document.createElement('table');
  table.className = 'table mono small';
  table.innerHTML = `<thead><tr><th>index</th><th>id</th><th>qty</th><th>metadata</th><th>actions</th></tr></thead><tbody></tbody>`;
  const tb = table.querySelector('tbody');
  const setArray = Array.from(set);
  for (const index in setArray) {
    const it = setArray[index];
    if (!it) continue;
    const medadataString = escapeHTML(JSON.stringify(it.metadata ?? {}));
    const tr = document.createElement('tr');
    const data = `data-id="${it.id}" data-index="${index}" data-metadata="${medadataString}"`;
    tr.innerHTML = `
          <td>${index}</td>
          <td>${it.id}</td>
          <td>${it.quantity}</td>
          <td class="small">${medadataString}</td>
          <td>
            <div class="inline">
              <button class="btn" data-act="use" ${data}>Use</button>
              <button class="btn" data-act="rm1" ${data}>-1</button>
              <button class="btn bad" data-act="rmAll" ${data}>Remove all</button>
            </div>
          </td>
        `;
    tb.appendChild(tr);
  }
  // Bind
  tb.querySelectorAll('button[data-act]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const index = parseInt(btn.getAttribute('data-index'));
      const act = btn.getAttribute('data-act');
      let metadata = {};
      try {
        metadata = JSON.parse(btn.getAttribute('data-metadata'));
      } catch {
        metadata = {};
      }

      try {
        if (act === 'use') {
          inv.useItem({ slotIndex: index });
          logEvent('use-click', { id });
        }
        if (act === 'rm1') {
          inv.removeItem({ itemId: id, quantity: 1, metadata });
          logEvent('remove-1', { id });
        }
        if (act === 'rmAll') {
          const qty = inv.getItemCount(id);
          inv.removeItem({ itemId: id, quantity: qty, metadata });
          logEvent('remove-all', { id, qty });
        }
        renderInv();
      } catch (e) {
        console.error(e);
        toast(e.message, 'bad');
      }

      refreshKPI();
    });
  });
  return table;
}

function logEvent(type, payload) {
  const box = byId('ev_logs');
  const line = document.createElement('div');
  line.textContent = `[${new Date().toLocaleTimeString()}] ${type} :: ${safeStr(payload)}`;
  box.prepend(line);
}
function safeStr(v) {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function renderDiag() {
  if (!inv) {
    byId('diag').textContent = 'No inventory.';
    return;
  }
  const obj = {
    maxWeight: inv.maxWeight,
    maxSlots: inv.maxSlots,
    maxStack: inv.maxStack.toString(),
    totalStacks: inv.getAllItems().length,
    totalItems: inv.getAllItems().reduce((n, i) => n + i.quantity, 0),
    weight: inv.weight,
    specialSlots: Array.from(inv.specialSlots.entries()).map(([k, v]) => ({
      slotId: k,
      type: v.type,
      item: v.item,
    })),
    items: [...(inv.items ?? [])],
  };
  byId('diag').textContent = JSON.stringify(obj, null, 2);
}

// ---------- Item Registry UI ----------
byId('ir_define').addEventListener('click', () => {
  const id = byId('ir_id').value.trim();
  const weight = Number(byId('ir_weight').value || 0);
  const maxStack = Number(byId('ir_maxStack').value || 1);
  const type = byId('ir_type').value.trim() || null;
  const metadata = parseJSON(byId('ir_metadata').value, {});
  let onUse = null;
  const preset = byId('ir_onUsePreset').value;
  const code = byId('ir_onUseCode').value.trim();

  if (preset === 'consume1') {
    onUse = ({ remove, item }) => {
      remove();
      console.log('[onUse] consumed', item.id);
    };
  } else if (preset === 'heal25') {
    onUse = ({ remove, item }) => {
      remove();
      console.log('[onUse] heal +25 from', item.id);
    };
  } else if (preset === 'custom' && code) {
    try {
      // eslint-disable-next-line no-new-func
      onUse = new Function(
        'ctx',
        `
            "use strict";
            const {inventory, item, metadata, remove} = ctx;
            ${code.startsWith('function') ? `return (${code})(ctx);` : code}
          `,
      );
      const fwrap = onUse;
      onUse = (ctx) => fwrap(ctx);
    } catch (e) {
      console.error(e);
      toast('Invalid onUse function: ' + e.message, 'bad');
      onUse = null;
    }
  }

  try {
    TinyInventory.defineItem({ id, weight, metadata, maxStack, type, onUse });
    renderRegistry();
    toast(`Item '${id}' defined`, 'ok');
  } catch (e) {
    console.error(e);
    toast(e.message, 'bad');
  }
  refreshKPI();
});

byId('ir_clear').addEventListener('click', () => {
  ['ir_id', 'ir_weight', 'ir_maxStack', 'ir_type', 'ir_metadata', 'ir_onUseCode'].forEach(
    (id) => (byId(id).value = ''),
  );
  byId('ir_onUsePreset').value = 'none';
  refreshKPI();
});

renderRegistry();

// ---------- Create Inventory ----------
function addSlotRow(id = '', type = '') {
  const div = document.createElement('div');
  div.className = 'row';
  div.innerHTML = `
        <input class="slot_id" placeholder="slot id" value="${id}">
        <input class="slot_type" placeholder="type (optional)" value="${type}">
        <button class="btn bad">Remove</button>
      `;
  div.querySelector('button').addEventListener('click', () => div.remove());
  byId('ci_slotsList').appendChild(div);
}

byId('ci_addSlot').addEventListener('click', () => addSlotRow());

byId('ci_create').addEventListener('click', () => {
  const maxWeight = numberOrNull(byId('ci_maxWeight').value);
  const maxSlots = numberOrNull(byId('ci_maxSlots').value);
  const maxSize = numberOrNull(byId('ci_maxSize').value);
  const maxStack = numberOrInfinity(byId('ci_maxStack').value);
  /** @type {Record<string, {type:string|null}>} */
  const specialSlots = {};
  $$('#ci_slotsList .row').forEach((r) => {
    const id = r.querySelector('.slot_id').value.trim();
    const type = r.querySelector('.slot_type').value.trim() || null;
    if (id) specialSlots[id] = { type };
  });

  try {
    inv = new TinyInventory({
      maxWeight,
      maxSlots,
      specialSlots,
      maxStack,
      maxSize,
    });
    window.inventory = inv;
    // attach event logs
    inv.onAddItem((e) => logEvent('onAdd', e));
    inv.onSetItem((e) => logEvent('onSet', e));
    inv.onRemoveItem((e) => logEvent('onRemove', e));
    inv.onUseItem((e) => logEvent('onUse', e));
    byId('ci_status').textContent = 'Inventory created.';
    renderInv();
  } catch (e) {
    console.error(e);
    toast(e.message, 'bad');
  }
  refreshKPI();
});

// ---------- Actions ----------
byId('ac_add').addEventListener('click', () => {
  if (!inv) return toast('Create an inventory first', 'warn');
  const id = byId('ac_itemId').value.trim();
  const qty = Number(byId('ac_qty').value || 1);
  const metadata = parseJSON(byId('ac_metadata').value, {});
  try {
    const rem = inv.addItem({ itemId: id, quantity: qty, metadata });
    if (rem > 0) toast(`Could not add ${rem} units due to maxStack`, 'warn');
    else toast('Added', 'ok');
    renderInv();
  } catch (e) {
    console.error(e);
    toast(e.message, 'bad');
  }
  refreshKPI();
});

byId('ac_remove').addEventListener('click', () => {
  if (!inv) return toast('Create an inventory first', 'warn');
  const id = byId('ac_itemId').value.trim();
  const qty = Number(byId('ac_qty').value || 1);
  metadata = {};
  try {
    metadata = JSON.parse(byId('ac_metadata').value || '{}');
  } catch {
    metadata = {};
  }
  try {
    const ok = inv.removeItem({ itemId: id, quantity: qty, metadata });
    toast(ok ? 'Removed' : 'Not enough items', ok ? 'ok' : 'warn');
    renderInv();
  } catch (e) {
    console.error(e);
    toast(e.message, 'bad');
  }
  refreshKPI();
});

byId('ac_has').addEventListener('click', () => {
  if (!inv) return toast('Create an inventory first', 'warn');
  const id = byId('ac_itemId').value.trim();
  const qty = Number(byId('ac_qty').value || 1);
  toast(`hasItem(${id}, ${qty}) => ${inv.hasItem(id, qty)}`);
  refreshKPI();
});

byId('ac_find').addEventListener('click', () => {
  if (!inv) return toast('Create an inventory first', 'warn');
  const src = byId('ac_findPredicate').value.trim();
  let fn;
  try {
    // eslint-disable-next-line no-new-func
    fn = new Function('item', `return (${src});`);
  } catch (e) {
    console.error(e);
    return toast('Invalid predicate: ' + e.message, 'bad');
  }
  try {
    const one = inv.findItem(fn);
    const many = inv.findItems(fn);
    console.log('[findItem]', one);
    console.log('[findItems]', many);
    toast(`findItem => ${one ? one.id + ' x' + one.quantity : 'undefined'}`);
  } catch (e) {
    console.error(e);
    toast(e.message, 'bad');
  }
  refreshKPI();
});

// ---------- Inventory Management ----------
byId('inv_compact').addEventListener('click', () => {
  if (!inv) {
    toast('Create an inventory first.', 'warn');
    return;
  }
  try {
    inv.compactInventory();
    toast('Inventory compacted!', 'ok');
    renderInv();
    refreshKPI();
  } catch (e) {
    toast('Error compacting inventory: ' + e.message, 'bad');
  }
});

byId('clear_compact').addEventListener('click', () => {
  if (!inv) {
    toast('Create an inventory first.', 'warn');
    return;
  }
  try {
    inv.clearAllItems();
    toast('Inventory cleared!', 'ok');
    renderInv();
    refreshKPI();
  } catch (e) {
    toast('Error compacting inventory: ' + e.message, 'bad');
  }
});

// ---------- Inventory Status ----------
byId('inv_hasSpace').addEventListener('click', () => {
  if (!inv) {
    toast('Create an inventory first.', 'warn');
    return;
  }
  const result = inv.hasSpace();
  byId('inv_hasSpace_result').textContent = result ? 'Yes' : 'No';
  toast(`hasSpace(): ${result ? 'Yes' : 'No'}`, result ? 'ok' : 'warn');
});

byId('inv_isHeavy').addEventListener('click', () => {
  if (!inv) {
    toast('Create an inventory first.', 'warn');
    return;
  }
  const result = inv.isHeavy();
  byId('inv_isHeavy_result').textContent = result ? 'Yes' : 'No';
  toast(`isHeavy(): ${result ? 'Yes' : 'No'}`, result ? 'warn' : 'ok');
});

byId('inv_areFull').addEventListener('click', () => {
  if (!inv) {
    toast('Create an inventory first.', 'warn');
    return;
  }
  const result = inv.areFull();
  byId('inv_areFull_result').textContent = result ? 'Yes' : 'No';
  toast(`areFull(): ${result ? 'Yes' : 'No'}`, result ? 'warn' : 'ok');
});

byId('inv_isFull').addEventListener('click', () => {
  if (!inv) {
    toast('Create an inventory first.', 'warn');
    return;
  }
  const result = inv.isFull();
  byId('inv_isFull_result').textContent = result ? 'Yes' : 'No';
  toast(`isFull(): ${result ? 'Yes' : 'No'}`, result ? 'warn' : 'ok');
});

byId('inv_areFullSlots').addEventListener('click', () => {
  if (!inv) {
    toast('Create an inventory first.', 'warn');
    return;
  }
  const result = inv.areFullSlots();
  byId('inv_areFullSlots_result').textContent = result ? 'Yes' : 'No';
  toast(`areFullSlots(): ${result ? 'Yes' : 'No'}`, result ? 'warn' : 'ok');
});

byId('inv_isFullSlots').addEventListener('click', () => {
  if (!inv) {
    toast('Create an inventory first.', 'warn');
    return;
  }
  const result = inv.isFullSlots();
  byId('inv_isFullSlots_result').textContent = result ? 'Yes' : 'No';
  toast(`isFullSlots(): ${result ? 'Yes' : 'No'}`, result ? 'warn' : 'ok');
});

// ---------- Item Retrieval ----------
byId('ac_find_retrieval').addEventListener('click', () => {
  if (!inv) {
    toast('Create an inventory first.', 'warn');
    return;
  }
  const predicateCode = byId('ac_findPredicate_retrieval').value;
  let predicate;
  try {
    // eslint-disable-next-line no-eval
    predicate = eval(`(${predicateCode})`);
    if (typeof predicate !== 'function') {
      throw new Error('Predicate must be a function.');
    }
  } catch (e) {
    toast('Invalid predicate code: ' + e.message, 'bad');
    return;
  }

  try {
    const foundItem = inv.findItem(predicate);
    const foundItems = inv.findItems(predicate);
    byId('retrieval_results').textContent =
      `find() result: ${foundItem ? JSON.stringify(foundItem, null, 2) : 'None'}\n\nfindItems() results (${foundItems.length}):\n${JSON.stringify(foundItems, null, 2)}`;
    toast(
      `find() result: ${foundItem ? foundItem.id : 'None'}. findItems() count: ${foundItems.length}.`,
      'ok',
    );
  } catch (e) {
    toast('Error finding item: ' + e.message, 'bad');
  }
});

// ---------- Transfer Item ----------
byId('tr_transfer').addEventListener('click', () => {
  if (!inv) {
    toast('Create an inventory first.', 'warn');
    return;
  }
  const fromIndex = numberOrNull(byId('tr_fromIndex').value) || 0;
  const toIndex = numberOrNull(byId('tr_toIndex').value) || 0;

  try {
    const transferred = inv.moveItem(fromIndex, toIndex);
    toast(`Transferred ${transferred} x ${itemId}.`, 'ok');
    renderInv();
    refreshKPI();
  } catch (e) {
    toast('Error transferring item: ' + e.message, 'bad');
  }
});

// ---------- Serialization ----------
byId('ser_toJSON').addEventListener('click', () => {
  if (!inv) return toast('Create an inventory first', 'warn');
  try {
    const json = inv.toJSON ? inv.toJSON(2) : JSON.stringify(inv.toObject(), null, 2);
    byId('ser_text').value = json;
    toast('Exported JSON', 'ok');
  } catch (e) {
    console.error(e);
    toast(e.message, 'bad');
  }
  refreshKPI();
});

byId('ser_fromJSON').addEventListener('click', () => {
  if (!TinyInventory || !TinyInventory.fromJSON)
    return toast('Your TinyInventory is missing fromJSON()', 'bad');
  const txt = byId('ser_text').value;
  try {
    inv = TinyInventory.fromJSON(txt, { validate: true, enforceLimits: false });
    // re-bind events
    inv.onAddItem((e) => logEvent('onAdd', e));
    inv.onRemoveItem((e) => logEvent('onRemove', e));
    inv.onUseItem((e) => logEvent('onUse', e));
    renderInv();
    toast('Inventory imported from JSON', 'ok');
  } catch (e) {
    console.error(e);
    toast(e.message, 'bad');
  }
  refreshKPI();
});

byId('ser_diff').addEventListener('click', () => {
  if (!inv) return toast('Create an inventory first', 'warn');
  const target = parseJSON(byId('ser_text').value, null);
  if (!target) return toast('Provide JSON to diff against.', 'warn');
  const current = inv.toObject ? inv.toObject() : null;
  if (!current) return toast('Your TinyInventory is missing toObject()', 'bad');
  const diff = jsonDiff(current, target);
  const out = byId('ser_diffOut');
  out.style.display = 'block';
  out.textContent = JSON.stringify(diff, null, 2);
  refreshKPI();
});

byId('ev_clear').addEventListener('click', () => (byId('ev_logs').innerHTML = ''));

// ---------- Stress / Random ----------
byId('st_addRandom').addEventListener('click', () => {
  if (!inv) return toast('Create an inventory first', 'warn');
  const runs = Number(byId('st_runs').value || 10);
  const keys = [...Object.keys(TinyInventory.itemRegistry)];
  if (!keys.length) return toast('Define items first', 'warn');
  let added = 0;
  for (let i = 0; i < runs; i++) {
    const id = keys[Math.floor(Math.random() * keys.length)];
    const qty = 1 + Math.floor(Math.random() * 3);
    const meta = Math.random() < 0.4 ? { seed: Math.floor(Math.random() * 10) } : {};
    try {
      inv.addItem({ itemId: id, quantity: qty, metadata: meta });
      added++;
    } catch (e) {
      console.error(e);
      /* ignore */
    }
  }
  toast(`Random add runs=${runs}, succeeded=${added}`, 'ok');
  renderInv();
  refreshKPI();
});

byId('st_resetInv').addEventListener('click', () => {
  if (!inv) return toast('Create an inventory first', 'warn');
  // Recreate inventory with same options, empty items
  const opts = {
    maxWeight: inv.maxWeight,
    maxSlots: inv.maxSlots,
    specialSlots: Object.fromEntries(
      Array.from(inv.specialSlots.entries()).map(([k, v]) => [k, { type: v.type }]),
    ),
  };
  inv = new TinyInventory(opts);
  inv.onAddItem((e) => logEvent('onAdd', e));
  inv.onRemoveItem((e) => logEvent('onRemove', e));
  inv.onUseItem((e) => logEvent('onUse', e));
  renderInv();
  toast('Inventory reset executed', 'warn');
  refreshKPI();
});

// ---------- JSON diff (simple, readable) ----------
function jsonDiff(a, b, path = '$') {
  const out = [];
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    if (safeStr(a) !== safeStr(b)) out.push({ path, from: a, to: b });
    return out;
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const pa = a[k],
      pb = b[k],
      p = path + '.' + k;
    if (typeof pa === 'object' && pa && typeof pb === 'object' && pb) {
      out.push(...jsonDiff(pa, pb, p));
    } else if (safeStr(pa) !== safeStr(pb)) {
      out.push({ path: p, from: pa, to: pb });
    }
  }
  return out;
}

// Initial seed: a few items to play quickly
(function seed() {
  try {
    TinyInventory.defineItem({
      id: 'apple',
      weight: 0.2,
      maxStack: 10,
      metadata: { rarity: 'common' },
      onUse: ({ remove }) => remove(),
      type: null,
    });
    TinyInventory.defineItem({
      id: 'potion',
      weight: 0.5,
      maxStack: 5,
      metadata: { heal: 25 },
      onUse: ({ remove }) => {
        console.log('Heal +25');
        remove();
      },
      type: null,
    });
    TinyInventory.defineItem({
      id: 'helmet_iron',
      weight: 2,
      maxStack: 1,
      metadata: { def: 2 },
      type: 'helmet',
    });
    TinyInventory.defineItem({
      id: 'sword_wood',
      weight: 1.2,
      maxStack: 1,
      metadata: { atk: 1 },
      type: 'weapon',
    });
    renderRegistry();
  } catch (e) {
    console.error(e);
    /* ignore if already defined */
  }
})();
