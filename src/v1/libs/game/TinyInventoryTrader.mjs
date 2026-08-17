import TinyInventory from './TinyInventory.mjs';

/** @typedef {import('./TinyInventory.mjs').InventoryMetadata} InventoryMetadata */
/** @typedef {import('./TinyInventory.mjs').AddItemResult} AddItemResult */

/**
 * @typedef {Object} TransferItemCfg - Transfer configuration.
 * @property {number} [slotIndex] - Sender slot index.
 * @property {number} [receiverSlotIndex] - Receiver slot index (optional).
 * @property {string} [specialSlot] - Sender special slot ID.
 * @property {number} [quantity=1] - Quantity to transfer.
 * @property {boolean} [forceSpace=false] - Whether to force addition even if space is limited.
   @property {boolean} [strict=false] - If true, transfer will throw if not all items can fit.
 */

/**
 * Class responsible for managing item transfers between two TinyInventory instances.
 */
class TinyInventoryTrader {
  /** @type {TinyInventory|null} */
  #sender = null;

  /** @type {TinyInventory|null} */
  #receiver = null;

  ///////////////////////////////////////////////

  /** @returns {TinyInventory|null} The currently connected sender inventory. */
  get sender() {
    return this.#sender;
  }

  /** @returns {TinyInventory|null} The currently connected receiver inventory. */
  get receiver() {
    return this.#receiver;
  }

  /** @param {TinyInventory} value Sets the sender inventory. */
  set sender(value) {
    if (!(value instanceof TinyInventory) || !(this.receiver instanceof TinyInventory))
      throw new Error('Both sender and receiver must be TinyInventory instances.');
    this.#sender = value;
  }

  /** @param {TinyInventory} value Sets the receiver inventory. */
  set receiver(value) {
    if (!(this.sender instanceof TinyInventory) || !(value instanceof TinyInventory))
      throw new Error('Both sender and receiver must be TinyInventory instances.');
    this.#receiver = value;
  }

  ///////////////////////////////////////////////

  /**
   * Manages item transfers between two TinyInventory instances.
   * @param {TinyInventory} [sender] - Inventory to remove items from.
   * @param {TinyInventory} [receiver] - Inventory to add items to.
   */
  constructor(sender, receiver) {
    if (sender || receiver) {
      if (!(sender instanceof TinyInventory) || !(receiver instanceof TinyInventory))
        throw new Error('Both sender and receiver must be TinyInventory instances.');
      this.connect(sender, receiver);
    }
  }

  /**
   * Connects the sender and receiver inventories for trading.
   * @param {TinyInventory} sender - Inventory to remove items from.
   * @param {TinyInventory} receiver - Inventory to add items to.
   */
  connect(sender, receiver) {
    if (!(sender instanceof TinyInventory) || !(receiver instanceof TinyInventory))
      throw new Error('Both sender and receiver must be TinyInventory instances.');
    this.#sender = sender;
    this.#receiver = receiver;
  }

  /**
   * Disconnects the sender and receiver inventories, preventing further transfers.
   */
  disconnect() {
    this.#sender = null;
    this.#receiver = null;
  }

  /**
   * Inverts the sender and receiver roles.
   * Useful when performing bidirectional transfers.
   */
  invert() {
    const sender = this.#sender;
    const receiver = this.#receiver;
    this.#sender = receiver;
    this.#receiver = sender;
  }

  /**
   * Transfers an item from sender to receiver.
   *
   * @param {TransferItemCfg} options - Transfer configuration.
   * @returns {Partial<AddItemResult>} Remaining quantity that could NOT be transferred.
   * @throws {Error} If sender or receiver is not connected, item does not exist in sender,
   * or if strict mode is enabled and receiver has no space for full transfer.
   */
  transferItem({
    slotIndex,
    specialSlot,
    quantity = 1,
    receiverSlotIndex,
    forceSpace = false,
    strict = false,
  }) {
    if (!this.#sender || !this.#receiver)
      throw new Error('Sender and receiver inventories must be connected.');

    // Get the item from sender
    let item;
    if (specialSlot) {
      item = this.#sender.getSpecialItem(specialSlot);
      if (!item) throw new Error(`No item found in sender special slot '${specialSlot}'.`);
    } else if (typeof slotIndex === 'number') {
      item = this.#sender.getItemFrom(slotIndex);
      if (!item) throw new Error(`No item found in sender slot ${slotIndex}.`);
    } else throw new Error('Must provide either slotIndex or specialSlot.');

    // Match quantity
    if (item.quantity < quantity)
      throw new Error(`Sender does not have enough quantity of '${item.id}' to transfer.`);

    // Clone item for transfer
    const transferItem = {
      id: item.id,
      quantity,
      metadata: item.metadata,
    };

    let result;

    // ---------- STRICT MODE PRE-CHECK ----------
    if (strict) {
      if (typeof receiverSlotIndex === 'number') {
        const existing = this.#receiver.existsItemAt(receiverSlotIndex)
          ? this.#receiver.getItemFrom(receiverSlotIndex)
          : null;
        if (existing) {
          if (existing.id !== transferItem.id)
            throw new Error(`Receiver slot ${receiverSlotIndex} contains a different item.`);
          const def = TinyInventory.getItem(existing.id);

          const spaceLeft = def.maxStack - existing.quantity;
          if (transferItem.quantity > spaceLeft)
            throw new Error(`Strict mode: not enough space in receiver slot ${receiverSlotIndex}.`);
        }
      } else {
        // Simulate addItem result
        const simulated = this.#receiver.clone().addItem({
          itemId: transferItem.id,
          quantity: transferItem.quantity,
          metadata: transferItem.metadata,
          forceSpace,
        });
        if (simulated.remaining > 0)
          throw new Error(`Strict mode: not enough space in receiver inventory.`);
      }
    }
    // ---------- END STRICT CHECK ----------

    // If receiverSlotIndex is informed → use setItem on receiver
    if (typeof receiverSlotIndex === 'number') {
      const existing = this.#receiver.existsItemAt(receiverSlotIndex)
        ? this.#receiver.getItemFrom(receiverSlotIndex)
        : null;
      let movedQty = transferItem.quantity;

      // If there is already item in this slot
      if (existing) {
        if (existing.id !== transferItem.id)
          throw new Error(`Receiver slot ${receiverSlotIndex} contains a different item.`);
        const def = TinyInventory.getItem(existing.id);

        const spaceLeft = def.maxStack - existing.quantity;
        movedQty = Math.min(spaceLeft, transferItem.quantity);

        if (movedQty > 0) {
          this.#receiver.setItem({
            slotIndex: receiverSlotIndex,
            item: { ...existing, quantity: existing.quantity + movedQty },
            forceSpace,
          });
        }
      } else {
        // Empty Slot → just seal the whole item
        this.#receiver.setItem({
          slotIndex: receiverSlotIndex,
          item: transferItem,
          forceSpace,
        });
      }

      // Now we calculate what's left
      result = { remaining: transferItem.quantity - movedQty };
    } else {
      result = this.#receiver.addItem({
        itemId: transferItem.id,
        quantity: transferItem.quantity,
        metadata: transferItem.metadata,
        forceSpace,
      });
    }

    // Remove successfully transferred quantity from sender
    const removedQty = transferItem.quantity - result.remaining;
    if (removedQty > 0) {
      if (specialSlot) {
        this.#sender.unequipItem({ slotId: specialSlot, quantity: removedQty, forceSpace });
      } else if (typeof slotIndex === 'number') {
        const remainingQty = item.quantity - removedQty;
        this.#sender.setItem({
          slotIndex,
          item: remainingQty > 0 ? { ...item, quantity: remainingQty } : null,
          forceSpace,
        });
      }
    }

    return result;
  }

  /**
   * Transfers multiple items at once.
   * @param {TransferItemCfg[]} items - Array of transfer configs (see transferItem options).
   * @returns {Partial<AddItemResult>[]} Array of remaining quantities for each item.
   */
  transferMultiple(items) {
    return items.map((cfg) => this.transferItem(cfg));
  }
}

export default TinyInventoryTrader;
