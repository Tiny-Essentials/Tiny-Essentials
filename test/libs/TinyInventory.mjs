/**
 * Node.js port of the browser based game inventory test environments
 * (`test/html/game/TinyInventory`).
 *
 * Covers:
 * - TinyInventory (registry, stacking, weight, special slots, serialization)
 * - TinyInventoryTrader (transferring items between inventories)
 */

import { TestRunner, section, color } from './_helpers.mjs';

const { default: TinyInventory } = await import('../../dist/v1/libs/game/TinyInventory.mjs');
const { default: TinyInventoryTrader } =
  await import('../../dist/v1/libs/game/TinyInventoryTrader.mjs');

/**
 * Node.js port of the browser game inventory test environment.
 * @returns {Promise<number>}
 */
const testInventory = async () => {
  const t = new TestRunner('TinyInventory');

  // -------------------------------------------------------------------
  // Item registry
  // -------------------------------------------------------------------
  section('TinyInventory - item registry', '🎒');
  TinyInventory.defineItem({ id: 'potion', weight: 0.5, maxStack: 10, type: 'consumable' });
  TinyInventory.defineItem({ id: 'sword', weight: 5, maxStack: 1, type: 'weapon' });
  TinyInventory.defineItem({ id: 'arrow', weight: 0.1, maxStack: 99, type: 'ammo' });

  t.equal(TinyInventory.hasItem('potion'), true, 'defineItem registers an item');
  t.equal(TinyInventory.getItem('sword').weight, 5, 'getItem returns the definition');
  t.throws(() => TinyInventory.defineItem({ weight: 1 }), 'defineItem requires an id');
  t.throws(() => TinyInventory.getItem('ghost'), 'getItem throws for unknown items');
  t.equal(TinyInventory.removeItem('ghost'), false, 'removeItem is false for unknown items');

  // -------------------------------------------------------------------
  // Adding / removing items
  // -------------------------------------------------------------------
  section('TinyInventory - add & remove', '📦');
  const inv = new TinyInventory({ maxWeight: 100, maxSlots: 10, maxStack: 5 });
  const added = inv.addItem({ itemId: 'potion', quantity: 3 });
  t.equal(added.remaining, 0, 'addItem reports no remainder');
  t.equal(inv.size, 3, 'Tracks the total item count');
  t.equal(inv.slotsSize, 1, 'Uses a single slot for a stack');
  t.equal(inv.getItemCount('potion'), 3, 'getItemCount counts the quantity');
  t.equal(inv.hasItem('potion', 3), true, 'hasItem respects the quantity');
  t.equal(inv.hasItem('potion', 4), false, 'hasItem is false when short');

  inv.addItem({ itemId: 'sword', quantity: 1 });
  t.equal(inv.weight, 3 * 0.5 + 5, 'Tracks the total weight');

  inv.removeItem({ itemId: 'potion', quantity: 1 });
  t.equal(inv.getItemCount('potion'), 2, 'removeItem removes the requested quantity');

  // -------------------------------------------------------------------
  // Stacking
  // -------------------------------------------------------------------
  section('TinyInventory - stacking', '🥞');
  const stackInv = new TinyInventory({ maxStack: 5 });
  stackInv.addItem({ itemId: 'arrow', quantity: 12 });
  t.equal(stackInv.slotsSize, 3, 'Splits into multiple stacks when needed');
  t.equal(stackInv.getItemCount('arrow'), 12, 'Keeps the full quantity across stacks');

  // -------------------------------------------------------------------
  // Special slots
  // -------------------------------------------------------------------
  section('TinyInventory - special slots', '🗡️');
  const equipInv = new TinyInventory({ specialSlots: { rightHand: { type: 'weapon' } } });
  equipInv.addItem({ itemId: 'sword', quantity: 1 });
  t.equal(equipInv.hasSpecialSlot('rightHand'), true, 'Registers the special slot');
  equipInv.equipItem({ slotId: 'rightHand', slotIndex: 0 });
  t.equal(equipInv.getSpecialItem('rightHand').id, 'sword', 'equipItem moves the item');
  t.equal(equipInv.getSpecialSlotType('rightHand'), 'weapon', 'Exposes the slot type');
  equipInv.unequipItem({ slotId: 'rightHand' });
  t.equal(equipInv.getSpecialItem('rightHand'), null, 'unequipItem clears the slot');

  // -------------------------------------------------------------------
  // Serialization
  // -------------------------------------------------------------------
  section('TinyInventory - serialization', '💾');
  const json = inv.toJSON();
  const restored = TinyInventory.fromJSON(json);
  t.equal(restored.getItemCount('potion'), inv.getItemCount('potion'), 'fromJSON restores items');
  const clone = inv.clone();
  t.equal(clone.size, inv.size, 'clone copies the item count');
  t.ok(clone !== inv, 'clone returns a new instance');

  // -------------------------------------------------------------------
  // Events
  // -------------------------------------------------------------------
  section('TinyInventory - events', '🔔');
  const eventInv = new TinyInventory();
  let addEvent = null;
  eventInv.onAddItem((e) => (addEvent = e));
  eventInv.addItem({ itemId: 'potion', quantity: 1 });
  t.ok(addEvent && addEvent.item.id === 'potion', 'onAddItem fires when an item is added');

  // -------------------------------------------------------------------
  // TinyInventoryTrader
  // -------------------------------------------------------------------
  const tr = new TestRunner('TinyInventoryTrader');
  section('TinyInventoryTrader - transfer', '🔁');
  const sender = new TinyInventory();
  const receiver = new TinyInventory();
  sender.addItem({ itemId: 'potion', quantity: 5 });

  const trader = new TinyInventoryTrader(sender, receiver);
  trader.transferItem({ slotIndex: 0, quantity: 2 });
  tr.equal(sender.getItemCount('potion'), 3, 'Removes the item from the sender');
  tr.equal(receiver.getItemCount('potion'), 2, 'Adds the item to the receiver');

  trader.invert();
  tr.equal(trader.sender, receiver, 'invert swaps the roles');
  trader.disconnect();
  tr.equal(trader.sender, null, 'disconnect clears the sender');
  tr.throws(
    () => trader.transferItem({ slotIndex: 0, quantity: 1 }),
    'transferItem requires a connection',
  );

  console.log(`\n${color('gray', 'Inventory test-suite finished.')}`);

  return t.summary() + tr.summary();
};

export default testInventory;
