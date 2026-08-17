/**
 * Represents a registered item definition in the global registry.
 *
 * @typedef {Object} ItemDef
 * @property {string} id - Unique identifier for the item.
 * @property {number} weight - Weight of a single unit of the item.
 * @property {InventoryMetadata} metadata - Default metadata for the item type.
 * @property {number} maxStack - Maximum quantity per stack.
 * @property {OnUseEvent|null} onUse - Callback triggered when the item is used.
 * @property {string|null} type - Optional category/type identifier.
 */

/**
 * Represents an individual stored item instance in the inventory.
 *
 * @typedef {Object} InventoryItem
 * @property {string} id - Unique identifier for the item.
 * @property {InventoryMetadata} metadata - Metadata specific to this item instance.
 * @property {number} quantity - Number of units in this stack.
 */

/**
 * A collection of item stacks stored in the inventory.
 *
 * @typedef {(InventoryItem|null)[]} InvSlots
 */

/**
 * Metadata object used to store arbitrary key-value pairs for an item.
 *
 * @typedef {Record<string|number|symbol, any>} InventoryMetadata
 */

/**
 * Represents a special slot (e.g., equipment) in the inventory.
 *
 * @typedef {Object} SpecialSlot
 * @property {string|null} type - Optional slot category/type.
 * @property {InventoryItem|null} item - Item currently equipped in this slot.
 */

/**
 * Generic event callback triggered by inventory actions.
 * @typedef {(payload: EventPayload) => void} OnEvent
 */

/**
 * Event fired when an item is added to the inventory.
 *
 * @typedef {OnEvent} AddItemEvent
 */

/**
 * Event fired when an item is setted to the inventory.
 *
 * @typedef {OnEvent} SetItemEvent
 */

/**
 * Event fired when an item is removed from the inventory.
 *
 * @typedef {OnEvent} RemoveItemEvent
 */

/**
 * Event fired when an item is used.
 *
 * @typedef {OnEvent} UseItemEvent
 */

/**
 * A function executed when an inventory item is used.
 * Can be assigned to handle custom "on use" behavior.
 *
 * @typedef {OnEvent} OnUseEvent
 * @returns {void} - Does not return a value.
 */

/**
 * Represents the supported event types for inventory actions.
 * @typedef {'add'|'remove'|'use'|'set'} EventsType
 */

/**
 * Callback used to filter items by matching metadata.
 *
 * @callback GetItemsByMetadataCallback
 * @param {InventoryMetadata} metadata - The metadata object to match against.
 * @param {InventoryItem} item - The current item being evaluated.
 * @returns {boolean} - `true` if the item matches the metadata, otherwise `false`.
 */

/**
 * Callback used when searching for an item in an inventory collection.
 * Works similarly to `Array.prototype.find()` conditions.
 *
 * @callback FindItemCallback
 * @param {InventoryItem} value - The current inventory item being evaluated.
 * @param {number} index - The index of the current item in the array.
 * @param {InventoryItem[]} items - The array of all inventory items.
 * @returns {boolean} - `true` if the item matches the search criteria, otherwise `false`.
 */

/**
 * Represents the fully serialized structure of a TinyInventory instance.
 * Intended for pure JSON storage and transmission.
 *
 * @typedef {Object} SerializedInventory
 * @property {'TinyInventory'} __schema - Schema identifier for validation.
 * @property {number} version - Serialized format version.
 * @property {number|null} maxWeight - Maximum allowed weight, or null if unlimited.
 * @property {number|null} maxSlots - Maximum allowed slots, or null if unlimited.
 * @property {number|null} maxSize - Maximum allowed size for items, or null if unlimited.
 * @property {number} maxStack - Maximum stack size allowed per item.
 * @property {(InventoryItem|null)[]} items - Flat inventory items.
 * @property {Record<string, SpecialSlot>} specialSlots - Special equipment or reserved slots keyed by ID.
 */

/**
 * Represents an entry from the inventory as a pair containing the item and its index in the collection.
 * @typedef {[InventoryItem, number]} ItemListData
 */

/**
 * Payload data dispatched when an inventory event occurs (e.g., add, remove, equip, unequip).
 * @typedef {Object} EventPayload
 * @property {number|null} index - Index of the item in its collection (null if not applicable).
 * @property {InventoryItem|null} item - The item affected by the event.
 * @property {boolean} isCollection - Whether the item came from a collection (true) or not.
 * @property {string|null} specialSlot - ID of the special slot involved in the event, if any.
 * @property {(forceSpace: boolean) => void} remove - Function to remove the item from its slot, optionally forcing space rules.
 */

/**
 * Result of adding items to an inventory.
 * @typedef {Object} AddItemResult
 * @property {number} remaining - Quantity of the item that could NOT be added due to space/stack limits.
 * @property {{ index: number; quantity: number }[]} placesAdded - Array of slot indexes in the inventory where the item was successfully added.
 */

/**
 * TinyInventory — A flexible inventory management system.
 *
 * This class provides:
 * - Standard inventory slots with configurable limits on weight, size, and stack.
 * - Special slots for equipment, tools, or unique item types.
 * - Full CRUD operations for items (add, remove, move, use, equip, unequip).
 * - Metadata-aware operations to differentiate items with durability, enchantments, etc.
 * - Serialization and deserialization to/from JSON for saving/loading inventory state.
 * - Event triggers for 'add', 'remove', 'use', and 'set' actions.
 *
 * @beta
 */
class TinyInventory {
  /**
   * Registry of all item definitions available in TinyInventory.
   * Keys are item IDs, values are configuration objects created with {@link TinyInventory.defineItem}.
   * @type {Map<string, ItemDef>}
   */
  static #ItemRegistry = new Map();

  /**
   * Returns a deep-cloned snapshot of all registered items.
   * Ensures the caller cannot mutate the internal registry.
   *
   * @returns {Record<string, ItemDef>} A map of item IDs to their definitions.
   */
  static get itemRegistry() {
    /** @type {Record<string, ItemDef>} */
    const results = {};
    const items = Object.fromEntries(TinyInventory.#ItemRegistry);
    for (const itemId in items)
      results[itemId] = { ...items[itemId], metadata: { ...items[itemId].metadata } };
    return results;
  }

  /**
   * Defines or updates an item type in the global item registry.
   * Stores key properties such as weight, stackability rules, and optional behavior callbacks.
   *
   * @param {Object} config - Item configuration object.
   * @param {string} config.id - Unique identifier for the item.
   * @param {number} [config.weight=0] - Weight of a single unit of the item.
   * @param {InventoryMetadata} [config.metadata={}] - Default metadata for the item type.
   * @param {number} [config.maxStack=1] - Maximum quantity allowed in a single stack.
   * @param {OnUseEvent|null} [config.onUse=null] - Optional callback executed when the item is used.
   * @param {string|null} [config.type=null] - Optional type/category identifier for the item.
   * @throws {Error} If `id` is missing or not a string.
   */
  static defineItem(config) {
    if (!config || typeof config !== 'object')
      throw new TypeError('Config must be a valid object.');
    if (!config.id || typeof config.id !== 'string')
      throw new TypeError("Item must have a valid string 'id'.");
    if (config.weight !== undefined && (typeof config.weight !== 'number' || config.weight < 0))
      throw new TypeError(`weight must be a number >= 0. Received: ${config.weight}`);
    if (
      config.maxStack !== undefined &&
      (!Number.isInteger(config.maxStack) || config.maxStack <= 0)
    )
      throw new TypeError(`maxStack must be a positive integer. Received: ${config.maxStack}`);
    if (config.metadata !== undefined && typeof config.metadata !== 'object')
      throw new TypeError('metadata must be an object.');
    if (config.onUse !== undefined && config.onUse !== null && typeof config.onUse !== 'function')
      throw new TypeError('onUse must be a function or null.');
    if (config.type !== undefined && config.type !== null && typeof config.type !== 'string')
      throw new TypeError('type must be a string or null.');

    TinyInventory.#ItemRegistry.set(config.id, {
      id: config.id,
      weight: config.weight || 0,
      maxStack: config.maxStack || 1,
      metadata: config.metadata || {},
      type: config.type ?? null,
      onUse: typeof config.onUse === 'function' ? config.onUse : null,
    });
  }

  /**
   * Removes an item definition from the global registry.
   *
   * @param {string} itemId - Unique identifier of the item to remove.
   * @returns {boolean} True if the item was removed, false if it did not exist.
   */
  static removeItem(itemId) {
    if (typeof itemId !== 'string') throw new TypeError('itemId must be a string.');
    return TinyInventory.#ItemRegistry.delete(itemId);
  }

  /**
   * Checks whether an item is registered.
   *
   * @param {string} itemId - The item ID to check.
   * @returns {boolean} True if the item exists in the registry, false otherwise.
   */
  static hasItem(itemId) {
    if (typeof itemId !== 'string') throw new TypeError('itemId must be a string.');
    return TinyInventory.#ItemRegistry.has(itemId);
  }

  /**
   * Retrieves an item definition from the registry.
   *
   * @param {string} itemId - The ID of the item to retrieve.
   * @returns {ItemDef} The definition of the requested item.
   * @throws {Error} If the item is not registered.
   */
  static getItem(itemId) {
    if (typeof itemId !== 'string') throw new TypeError('itemId must be a string.');
    const def = TinyInventory.#ItemRegistry.get(itemId);
    if (!def) throw new Error(`Item '${itemId}' not defined in registry.`);
    return def;
  }

  /////////////////////////////////////////////////////////////////

  /** @type {Map<string, SpecialSlot>} */
  #specialSlots = new Map();

  /**
   * Event listeners
   */
  #events = {
    /** @type {AddItemEvent[]} */
    add: [],
    /** @type {RemoveItemEvent[]} */
    remove: [],
    /** @type {UseItemEvent[]} */
    use: [],
    /** @type {SetItemEvent[]} */
    set: [],
  };

  /** @type {InvSlots} */
  #items = [];

  /** @type {number} */
  #maxStack;

  /** @type {number|null} */
  #maxSize;

  /** @type {number|null} */
  #maxSlots;

  /** @type {number|null} */
  #maxWeight;

  /////////////////////////////////////////////////////////////////

  /**
   * Gets the maximum stack size allowed per item.
   * @returns {number}
   */
  get maxStack() {
    return this.#maxStack;
  }

  /**
   * Sets the maximum stack size per item.
   * @param {number} value - Must be a positive integer.
   * @throws {Error} If the value is not a valid positive integer.
   */
  set maxStack(value) {
    if (!Number.isInteger(value) || (Number.isFinite(value) && value <= 0)) {
      throw new TypeError(`maxStack must be a positive integer. Received: ${value}`);
    }
    this.#maxStack = value;
  }

  /**
   * Gets the maximum item size allowed.
   * @returns {number|null}
   */
  get maxSize() {
    return this.#maxSize;
  }

  /**
   * Sets the maximum item size.
   * @param {number|null} value - Must be a positive integer or null.
   * @throws {Error} If the value is not null or a positive integer.
   */
  set maxSize(value) {
    if (value !== null && (!Number.isInteger(value) || value <= 0)) {
      throw new TypeError(`maxSize must be null or a positive integer. Received: ${value}`);
    }
    this.#maxSize = value;
  }

  /**
   * Gets the maximum number of slots allowed.
   * @returns {number|null}
   */
  get maxSlots() {
    return this.#maxSlots;
  }

  /**
   * Sets the maximum number of slots.
   * @param {number|null} value - Must be a positive integer or null.
   * @throws {Error} If the value is not null or a positive integer.
   */
  set maxSlots(value) {
    if (value !== null && (!Number.isInteger(value) || value <= 0)) {
      throw new TypeError(`maxSlots must be null or a positive integer. Received: ${value}`);
    }
    this.#maxSlots = value;
  }

  /**
   * Gets the maximum inventory weight allowed.
   * @returns {number|null}
   */
  get maxWeight() {
    return this.#maxWeight;
  }

  /**
   * Sets the maximum inventory weight.
   * @param {number|null} value - Must be a positive number or null.
   * @throws {Error} If the value is not null or a positive number.
   */
  set maxWeight(value) {
    if (value !== null && (typeof value !== 'number' || value <= 0)) {
      throw new TypeError(`maxWeight must be null or a positive number. Received: ${value}`);
    }
    this.#maxWeight = value;
  }

  /////////////////////////////////////////////////////////////////

  /**
   * Gets the registered inventory event listeners.
   * Always returns a clone to prevent external mutation.
   * @returns {{ add: AddItemEvent[], remove: RemoveItemEvent[], use: UseItemEvent[], set: SetItemEvent[] }}
   */
  get events() {
    return {
      add: [...this.#events.add],
      remove: [...this.#events.remove],
      use: [...this.#events.use],
      set: [...this.#events.set],
    };
  }

  /**
   * Gets the current inventory item slots.
   * Always returns a clone to prevent external mutation.
   * @returns {InvSlots}
   */
  get items() {
    return [...this.#items].map((item) => (item ? this.#cloneItemData(item) : null));
  }

  /**
   * Gets the current special slots.
   * Always returns a clone to prevent external mutation.
   * @returns {Map<string, SpecialSlot>}
   */
  get specialSlots() {
    return new Map(
      [...this.#specialSlots.entries()].map(([slotId, slot]) => [
        slotId,
        {
          type: slot.type,
          item: slot.item ? this.#cloneItemData(slot.item) : null,
        },
      ]),
    );
  }

  /////////////////////////////////////////////////////////////////

  /**
   * Gets the total quantity of items in the inventory.
   * Unlike slot count, this sums up the `quantity` of each item.
   *
   * @returns {number} - The total number of item units stored in the inventory.
   */
  get size() {
    const items = this.getAllItems();
    let amount = 0;
    for (const item of items) amount += item.quantity;
    return amount;
  }

  /**
   * Gets the total quantity of used slots in the inventory.
   *
   * @returns {number} - The total number of used slots stored in the inventory.
   */
  get slotsSize() {
    return this.getAllItems().length;
  }

  /**
   * Gets the total weight of all items in the inventory.
   * @returns {number} The total weight.
   */
  get weight() {
    return this.getAllItems().reduce((total, item) => {
      const def = TinyInventory.getItem(item.id);
      return total + (def?.weight || 0) * item.quantity;
    }, 0);
  }

  /////////////////////////////////////////////////////////////////

  /**
   * Cleans up unnecessary trailing nulls in a collection.
   * @private
   */
  _cleanNulls() {
    let lastIndex = this.#items.length - 1;

    // Find last non-null index
    while (lastIndex >= 0 && this.#items[lastIndex] === null) lastIndex--;

    // Slice up to last non-null + 1
    this.#items = this.#items.slice(0, lastIndex + 1);
  }

  /**
   * Creates a new TinyInventory instance.
   *
   * @param {Object} [options={}] - Configuration options for the inventory.
   * @param {number|null} [options.maxWeight=null] - Maximum allowed total weight (null for no limit).
   * @param {number|null} [options.maxSlots=null] - Maximum number of item slots (null for no limit).
   * @param {number|null} [options.maxSize=null] - Maximum number of total item amount (null for no limit).
   * @param {number} [options.maxStack=Infinity] - Global maximum stack size (per slot).
   * @param {Record<string, { type: string | null; }>} [options.specialSlots] - IDs for special slots (e.g., "helmet", "weapon").
   */
  constructor(options = {}) {
    if (typeof options !== 'object' || options === null)
      throw new TypeError('`options` must be an object.');
    if (
      options.maxWeight !== undefined &&
      options.maxWeight !== null &&
      typeof options.maxWeight !== 'number'
    )
      throw new TypeError('`maxWeight` must be a number or null.');
    if (
      options.maxSlots !== undefined &&
      options.maxSlots !== null &&
      typeof options.maxSlots !== 'number'
    )
      throw new TypeError('`maxSlots` must be a number or null.');
    if (
      options.maxSize !== undefined &&
      options.maxSize !== null &&
      typeof options.maxSize !== 'number'
    )
      throw new TypeError('`maxSize` must be a number or null.');
    if (options.maxStack !== undefined && typeof options.maxStack !== 'number')
      throw new TypeError('`maxStack` must be a number.');
    if (options.specialSlots !== undefined && typeof options.specialSlots !== 'object')
      throw new TypeError('`specialSlots` must be an object if defined.');

    this.#maxWeight = options.maxWeight ?? null;
    this.#maxSlots = options.maxSlots ?? null;
    this.#maxSize = options.maxSize ?? null;
    this.#maxStack = options.maxStack ?? Infinity;
    if (options.specialSlots) {
      for (const name in options.specialSlots) {
        const slot = options.specialSlots[name];
        if (typeof slot !== 'object' || slot === null)
          throw new TypeError('Each `specialSlot` entry must be an object.');
        if (slot.type !== undefined && slot.type !== null && typeof slot.type !== 'string')
          throw new TypeError('`specialSlot.type` must be a string or null.');
        this.#specialSlots.set(name, { type: slot.type ?? null, item: null });
      }
    }
  }

  /////////////////////////////////////////////////////////////////

  /**
   * Checks if there is available space based on slot and weight limits.
   * @param {Object} [settings={}] - Optional configuration for the space check.
   * @param {number} [settings.weight=0] - Extra weight to include in the calculation (e.g., previewing an item addition).
   * @param {number} [settings.sizeLength=0] - Extra item count to include in the calculation (e.g., previewing a amount usage).
   * @param {number} [settings.slotsLength=0] - Extra item count to include in the calculation (e.g., previewing a slot usage).
   * @returns {boolean} True if there is space; false otherwise.
   */
  hasSpace({ weight = 0, sizeLength = 0, slotsLength = 0 } = {}) {
    if (typeof weight !== 'number') throw new TypeError('`weight` must be a number.');
    if (typeof sizeLength !== 'number') throw new TypeError('`sizeLength` must be a number.');
    if (typeof slotsLength !== 'number') throw new TypeError('`slotsLength` must be a number.');
    if (this.areFull(sizeLength) || this.areFullSlots(slotsLength) || this.isHeavy(weight))
      return false;
    return true;
  }

  /**
   * Checks if the inventory weight exceeds the maximum allowed limit,
   * optionally considering an additional weight.
   *
   * @param {number} [extraWeight=0] - Additional weight to consider in the calculation.
   * @returns {boolean} - Returns `true` if the total weight (current + extra) exceeds `maxWeight`, otherwise `false`.
   */
  isHeavy(extraWeight = 0) {
    if (typeof extraWeight !== 'number') throw new TypeError('`extraWeight` must be a number.');
    if (this.#maxWeight !== null && this.weight + extraWeight > this.#maxWeight) return true;
    return false;
  }

  /**
   * Checks if the inventory amount has reached its maximum capacity.
   *
   * @param {number} [extraLength=0] - Additional length to consider in the calculation.
   * @returns {boolean} - Returns `true` if the total number of items is greater than or equal to `maxSlots`, otherwise `false`.
   */
  areFull(extraLength = 0) {
    if (typeof extraLength !== 'number') throw new TypeError('`extraLength` must be a number.');
    if (this.#maxSize !== null && this.size + extraLength > this.#maxSize) return true;
    return false;
  }

  /**
   * Checks if the inventory has reached its maximum amount capacity.
   *
   * @param {number} [extraLength=0] - Additional length to consider in the calculation.
   * @returns {boolean} - Returns `true` if the total number of items is greater than or equal to `maxSlots`, otherwise `false`.
   */
  isFull(extraLength = 0) {
    if (typeof extraLength !== 'number') throw new TypeError('`extraLength` must be a number.');
    if (this.#maxSize !== null && this.size + extraLength >= this.#maxSize) return true;
    return false;
  }

  /**
   * Checks if the inventory slots has reached its maximum slot capacity.
   *
   * @param {number} [extraLength=0] - Additional length to consider in the calculation.
   * @returns {boolean} - Returns `true` if the total number of items is greater than or equal to `maxSlots`, otherwise `false`.
   */
  areFullSlots(extraLength = 0) {
    if (typeof extraLength !== 'number') throw new TypeError('`extraLength` must be a number.');
    if (this.#maxSlots !== null && this.slotsSize + extraLength > this.#maxSlots) return true;
    return false;
  }

  /**
   * Checks if the inventory has reached its maximum slot capacity.
   *
   * @param {number} [extraLength=0] - Additional length to consider in the calculation.
   * @returns {boolean} - Returns `true` if the total number of items is greater than or equal to `maxSlots`, otherwise `false`.
   */
  isFullSlots(extraLength = 0) {
    if (typeof extraLength !== 'number') throw new TypeError('`extraLength` must be a number.');
    if (this.#maxSlots !== null && this.slotsSize + extraLength >= this.#maxSlots) return true;
    return false;
  }

  /////////////////////////////////////////////////////////////////

  /**
   * Internal event trigger.
   * @param {EventsType} type - Event type.
   * @param {EventPayload} payload - Event data passed to listeners.
   */
  #triggerEvent(type, payload) {
    if (typeof type !== 'string') throw new TypeError('`type` must be a string.');
    if (typeof payload !== 'object' || payload === null)
      throw new TypeError('`payload` must be an object.');
    if (this.#events[type]) {
      for (const cb of this.#events[type]) cb(payload);
    }
  }

  /**
   * Unregisters a specific callback for the given event type.
   * @param {EventsType} eventType - The event type to remove from.
   * @param {OnEvent} callback - The callback function to remove.
   */
  off(eventType, callback) {
    if (typeof eventType !== 'string') throw new TypeError('`eventType` must be a string.');
    if (typeof callback !== 'function') throw new TypeError('`callback` must be a function.');
    if (!this.#events[eventType]) return;
    const list = this.#events[eventType];
    const index = list.indexOf(callback);
    if (index !== -1) list.splice(index, 1);
  }

  /**
   * Unregisters all callbacks for the given event type.
   * @param {EventsType} eventType - The event type to clear.
   */
  offAll(eventType) {
    if (typeof eventType !== 'string') throw new TypeError('`eventType` must be a string.');
    if (!this.#events[eventType]) return;
    this.#events[eventType] = [];
  }

  /**
   * Returns a shallow copy of the callbacks for a given event type.
   * @param {EventsType} eventType - The event type to clone.
   * @returns {OnEvent[]} A cloned array of callback functions.
   */
  cloneEventCallbacks(eventType) {
    if (typeof eventType !== 'string') throw new TypeError('`eventType` must be a string.');
    if (!this.#events[eventType]) return [];
    return [...this.#events[eventType]];
  }

  /**
   * Registers a callback to be executed when an item is added.
   * @param {AddItemEvent} callback - Function receiving the event payload.
   */
  onAddItem(callback) {
    if (typeof callback !== 'function') throw new TypeError('`callback` must be a function.');
    this.#events.add.push(callback);
  }

  /**
   * Registers a callback to be executed when an item is removed.
   * @param {SetItemEvent} callback - Function receiving the event payload.
   */
  onSetItem(callback) {
    if (typeof callback !== 'function') throw new TypeError('`callback` must be a function.');
    this.#events.set.push(callback);
  }

  /**
   * Registers a callback to be executed when an item is removed.
   * @param {RemoveItemEvent} callback - Function receiving the event payload.
   */
  onRemoveItem(callback) {
    if (typeof callback !== 'function') throw new TypeError('`callback` must be a function.');
    this.#events.remove.push(callback);
  }

  /**
   * Registers a callback to be executed when an item is used.
   * @param {UseItemEvent} callback - Function receiving the event payload.
   */
  onUseItem(callback) {
    if (typeof callback !== 'function') throw new TypeError('`callback` must be a function.');
    this.#events.use.push(callback);
  }

  /////////////////////////////////////////////////////////////////

  /**
   * Removes all unnecessary `null` values from the inventory, compacting the slots.
   * Preserves the relative order of items and does not modify metadata.
   */
  compactInventory() {
    this.#items = this.#items.filter((i, index) => {
      const result = i !== null;
      if (!result)
        this.#triggerEvent('remove', {
          index,
          item: null,
          isCollection: true,
          specialSlot: null,
          remove: () => undefined,
        });
      return result;
    });
  }

  /////////////////////////////////////////////////////////////////

  /**
   * Adds an item to the inventory, respecting stackability rules, stack limits, and metadata matching.
   * If the item cannot be fully added (e.g., due to stack limits), the remaining quantity is returned.
   *
   * @param {Object} options - Item addition configuration.
   * @param {string} options.itemId - ID of the item to add.
   * @param {boolean} [options.forceSpace=false] - Forces the item to be added even if space or stack limits would normally prevent it.
   * @param {number} [options.quantity=1] - Quantity to add.
   * @param {InventoryMetadata} [options.metadata={}] - Instance-specific metadata (must match for stacking).
   * @returns {AddItemResult} Quantity that could not be added (0 if all were added).
   * @throws {Error} If the item is not registered.
   */
  addItem({ itemId, quantity = 1, metadata = {}, forceSpace = false }) {
    if (typeof itemId !== 'string') throw new TypeError('`itemId` must be a string.');
    if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0)
      throw new TypeError('`quantity` must be a positive number.');
    if (typeof metadata !== 'object' || metadata === null)
      throw new TypeError('`metadata` must be an object.');
    if (typeof forceSpace !== 'boolean') throw new TypeError('`forceSpace` must be a boolean.');

    const def = TinyInventory.getItem(itemId);
    let remaining = quantity;
    const maxStack = def.maxStack <= this.#maxStack ? def.maxStack : this.#maxStack;
    /** @type {{ index: number; quantity: number }[]} */
    const placesAdded = [];

    /**
     * @param {InventoryMetadata} a
     * @param {InventoryMetadata} b
     */
    const metadataEquals = (a, b) => JSON.stringify(a) === JSON.stringify(b);

    // Step 1: Fill existing stacks first
    let madeProgress = true;
    while (remaining > 0 && madeProgress) {
      madeProgress = false;

      for (const index in this.#items) {
        const existing = this.#items[index];
        if (
          existing &&
          existing.id === itemId &&
          existing.quantity < maxStack &&
          metadataEquals(existing.metadata, metadata)
        ) {
          const canAdd = Math.min(maxStack - existing.quantity, remaining);
          if (!forceSpace && !this.hasSpace({ weight: def.weight * canAdd, sizeLength: canAdd }))
            continue;

          existing.quantity += canAdd;
          remaining -= canAdd;
          madeProgress = true;

          const indexInt = Number(index);
          const placeId = placesAdded.findIndex((data) => data.index === indexInt);
          if (placeId < 0) placesAdded.push({ index: indexInt, quantity: canAdd });
          else placesAdded[placeId].quantity += canAdd;
          this.#triggerEvent('add', {
            item: this.#cloneItemData(existing),
            index: indexInt,
            isCollection: true,
            specialSlot: null,
            remove: this.#removeItemCallback({
              locationType: 'normal',
              slotIndex: indexInt,
              forceSpace,
              item: existing,
            }),
          });
          if (remaining <= 0) break;
        }
      }
    }

    // Step 2: Place remaining into null slots first
    if (remaining > 0) {
      for (const index in this.#items) {
        if (this.#items[index] === null) {
          const stackQty = Math.min(maxStack, remaining);
          if (
            !forceSpace &&
            !this.hasSpace({ weight: def.weight * stackQty, sizeLength: stackQty })
          )
            continue;

          const item = { id: itemId, quantity: stackQty, metadata };
          this.#items[index] = item;
          remaining -= stackQty;

          const indexInt = Number(index);
          const placeId = placesAdded.findIndex((data) => data.index === indexInt);
          if (placeId < 0) placesAdded.push({ index: indexInt, quantity: stackQty });
          else placesAdded[placeId].quantity += stackQty;
          this.#triggerEvent('add', {
            item: this.#cloneItemData(item),
            index: indexInt,
            isCollection: true,
            specialSlot: null,
            remove: this.#removeItemCallback({
              locationType: 'normal',
              slotIndex: indexInt,
              forceSpace,
              item,
            }),
          });

          if (remaining <= 0) break;
        }
      }
    }

    // Step 3: If still remaining, push new stacks to the end
    while (remaining > 0) {
      const stackQty = Math.min(maxStack, remaining);
      if (
        !forceSpace &&
        !this.hasSpace({ weight: def.weight * stackQty, sizeLength: stackQty, slotsLength: 1 })
      )
        break;

      const item = { id: itemId, quantity: stackQty, metadata };
      this.#items.push(item);
      const index = this.#items.length - 1;

      const placeId = placesAdded.findIndex((data) => data.index === index);
      if (placeId < 0) placesAdded.push({ index: index, quantity: stackQty });
      else placesAdded[placeId].quantity += stackQty;
      this.#triggerEvent('add', {
        item: this.#cloneItemData(item),
        index,
        isCollection: true,
        specialSlot: null,
        remove: this.#removeItemCallback({
          locationType: 'normal',
          slotIndex: index,
          forceSpace,
          item,
        }),
      });
      remaining -= stackQty;
    }

    // Return remaining if some quantity couldn't be added due to maxStack
    return { remaining, placesAdded };
  }

  /**
   * Gets the item stored at a specific slot.
   * @param {number} slotIndex - The slot index.
   * @returns {InventoryItem|null} The item object or null if empty.
   * @throws {Error} If the slot index is out of bounds.
   */
  getItemFrom(slotIndex) {
    if (typeof slotIndex !== 'number' || !Number.isInteger(slotIndex))
      throw new TypeError('`slotIndex` must be an integer.');
    if (slotIndex < 0 || slotIndex >= this.#items.length)
      throw new Error(`Slot index '${slotIndex}' out of bounds .`);
    return this.#items[slotIndex] ? this.#cloneItemData(this.#items[slotIndex]) : null;
  }

  /**
   * Sets an item at a specific slot index, replacing whatever was there.
   * Can also be used to place `null` in the slot to clear it.
   *
   * @param {Object} options - Item addition configuration.
   * @param {number} options.slotIndex - Index of the slot to set.
   * @param {InventoryItem|null} options.item - Item to place in the slot, or null to clear.
   * @param {boolean} [options.forceSpace=false] - Forces the item to be added even if space or stack limits would normally prevent it.
   * @throws {Error} If the index is out of range, or item type is invalid.
   */
  setItem({ slotIndex, item, forceSpace = false }) {
    if (typeof slotIndex !== 'number' || !Number.isInteger(slotIndex))
      throw new TypeError('`slotIndex` must be an integer.');
    if (typeof forceSpace !== 'boolean') throw new TypeError('`forceSpace` must be a boolean.');
    // Validate type: must be null or a proper InventoryItem object
    const isInventoryItem =
      item &&
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.quantity === 'number' &&
      !Number.isNaN(item.quantity) &&
      Number.isFinite(item.quantity) &&
      item.quantity > -1 &&
      typeof item.metadata === 'object';

    if (item !== null && !isInventoryItem)
      throw new Error(`Invalid item type: must be null or a valid InventoryItem.`);

    const def = item ? TinyInventory.#ItemRegistry.get(item.id) : null;
    if (item !== null && !def)
      throw new Error(`Item '${item?.id ?? 'unknown'}' not defined in registry.`);

    if (def && item) {
      const maxStack = def.maxStack <= this.#maxStack ? def.maxStack : this.#maxStack;
      if (item.quantity > maxStack)
        throw new Error(
          `Item '${item.id}' exceeds max stack size. Allowed: ${maxStack}, got: ${item.quantity}.`,
        );
    }

    if (this.#maxSlots !== null && (slotIndex < 0 || slotIndex >= this.#maxSlots))
      throw new Error(`Slot index ${slotIndex} out of range.`);

    // Convert the set to an array for index-based manipulation
    const oldItem = this.#items[slotIndex] ?? null;
    const oldItemData = oldItem ? (TinyInventory.#ItemRegistry.get(oldItem.id) ?? null) : null;

    /**
     * @param {InventoryItem|null} [theItem]
     * @param {ItemDef|null} [itemDef]
     * @returns {number}
     */
    const getTotalWeight = (theItem, itemDef) =>
      itemDef ? itemDef.weight * (theItem ? theItem.quantity : 0) : 0;

    /**
     * @param {InventoryItem|null} [theItem]
     * @returns {number}
     */
    const getTotalLength = (theItem) => (theItem ? theItem.quantity : 0);

    if (
      !forceSpace &&
      !this.hasSpace({
        weight: getTotalWeight(item, def) - getTotalWeight(oldItem, oldItemData),
        sizeLength: getTotalLength(item) - getTotalLength(oldItem),
      })
    )
      throw new Error('Inventory is full or overweight.');

    // Fill empty slots with nulls only up to the desired index
    while (this.#items.length <= slotIndex) this.#items.push(null);

    // Set the slot
    this.#items[slotIndex] = item;

    // Cleanup unnecessary trailing nulls
    this._cleanNulls();

    this.#triggerEvent('set', {
      index: slotIndex,
      isCollection: true,
      item: item ? this.#cloneItemData(item) : null,
      specialSlot: null,
      remove: item
        ? this.#removeItemCallback({
            locationType: 'normal',
            slotIndex,
            forceSpace,
            item,
          })
        : () => undefined,
    });
  }

  /**
   * Deletes an item from a specific slot by setting it to null.
   *
   * @param {number} slotIndex - Index of the slot to delete from.
   * @param {boolean} [forceSpace=false] - Forces the item to be added even if space or stack limits would normally prevent it.
   */
  deleteItem(slotIndex, forceSpace = false) {
    if (typeof slotIndex !== 'number' || !Number.isInteger(slotIndex))
      throw new TypeError('`slotIndex` must be an integer.');
    if (typeof forceSpace !== 'boolean') throw new TypeError('`forceSpace` must be a boolean.');
    this.setItem({ slotIndex, item: null, forceSpace });
  }

  /**
   * Moves an item from one slot to another.
   *
   * @param {number} fromIndex - Source slot index.
   * @param {number} toIndex - Target slot index.
   * @param {boolean} [forceSpace=false] - Forces the item to be added even if space or stack limits would normally prevent it.
   * @throws {Error} If the source slot is empty or the move is invalid.
   */
  moveItem(fromIndex, toIndex, forceSpace = false) {
    if (typeof fromIndex !== 'number' || !Number.isInteger(fromIndex))
      throw new TypeError('`fromIndex` must be an integer.');
    if (typeof toIndex !== 'number' || !Number.isInteger(toIndex))
      throw new TypeError('`toIndex` must be an integer.');
    if (typeof forceSpace !== 'boolean') throw new TypeError('`forceSpace` must be a boolean.');

    const item = this.#items[fromIndex];

    if (!item) throw new Error(`No item found in slot ${fromIndex}.`);

    // Place the item in the new slot
    this.setItem({ slotIndex: toIndex, item, forceSpace });

    // Clear the original slot
    this.setItem({ slotIndex: fromIndex, item: null, forceSpace });
  }

  /**
   * Removes a given quantity of an item from the inventory, including special slots.
   * @param {Object} settings - Removal configuration.
   * @param {string} settings.itemId - ID of the item to remove.
   * @param {InventoryMetadata|null} [settings.metadata={}] - Metadata to match when removing (e.g., durability, enchantments).
   * @param {number} [settings.quantity=1] - Quantity to remove.
   * @returns {boolean} True if fully removed; false if insufficient quantity.
   */
  removeItem({ itemId, metadata = null, quantity = 1 }) {
    if (typeof itemId !== 'string') throw new TypeError('`itemId` must be a string.');
    if (metadata !== null && typeof metadata !== 'object')
      throw new TypeError('`metadata` must be an object or null.');
    if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0)
      throw new TypeError('`quantity` must be a positive number.');
    let remaining = quantity;

    /**
     * @param {InventoryMetadata} a
     * @param {InventoryMetadata} b
     */
    const metadataEquals = (a, b) => JSON.stringify(a) === JSON.stringify(b);

    // Remove from inventory first
    for (let index = 0; index < this.#items.length; index++) {
      const item = this.#items[index];
      if (
        item &&
        item.id === itemId &&
        (metadata === null || metadataEquals(item.metadata, metadata))
      ) {
        const removeQty = Math.min(item.quantity, remaining);
        item.quantity -= removeQty;
        remaining -= removeQty;

        const indexInt = Number(index);
        if (item.quantity <= 0) this.#items[index] = null;
        if (remaining <= 0) {
          this._cleanNulls();
          this.#triggerEvent('remove', {
            index: indexInt,
            item: this.#cloneItemData(item),
            isCollection: true,
            specialSlot: null,
            remove: this.#removeItemCallback({
              locationType: 'normal',
              slotIndex: indexInt,
              item,
            }),
          });
          return true;
        }
      }
    }
    this._cleanNulls();

    // If not enough removed, check special slots
    this.#specialSlots.forEach((slot, key) => {
      if (
        remaining > 0 &&
        slot.item &&
        slot.item.id === itemId &&
        (metadata === null || metadataEquals(slot.item.metadata, metadata))
      ) {
        const removeQty = Math.min(slot.item.quantity, remaining);
        slot.item.quantity -= removeQty;
        if (slot.item.quantity < 0) slot.item.quantity = 0;
        remaining -= removeQty;
        if (slot.item.quantity <= 0) slot.item = null;
        this.#specialSlots.set(key, slot);

        this.#triggerEvent('remove', {
          index: null,
          item: slot.item ? this.#cloneItemData(slot.item) : null,
          isCollection: false,
          specialSlot: key,
          remove: slot.item
            ? this.#removeItemCallback({
                locationType: 'special',
                specialSlot: key,
                item: slot.item,
              })
            : () => undefined,
        });
      }
    });

    return remaining <= 0;
  }

  /////////////////////////////////////////////////////////////////

  /**
   * Creates a callback that removes an item from a normal slot or a special slot.
   * The callback decrements the quantity or clears the slot when empty.
   *
   * @param {Object} config - Removal configuration.
   * @param {'special'|'normal'} config.locationType - Type of slot where the item resides.
   * @param {InventoryItem} config.item - Item to remove.
   * @param {string} [config.specialSlot] - ID of the special slot if locationType is 'special'.
   * @param {number} [config.slotIndex] - Index of the slot if locationType is 'normal'.
   * @param {boolean} [config.forceSpace=false] - Whether to force the slot update even if blocked by space restrictions.
   * @returns {(forceSpace?: boolean) => void} A callback function that executes the removal.
   */
  #removeItemCallback({ locationType, specialSlot, slotIndex, item, forceSpace = false }) {
    if (locationType !== 'normal' && locationType !== 'special')
      throw new TypeError("`locationType` must be 'normal' or 'special'.");
    if (typeof forceSpace !== 'boolean') throw new TypeError('`forceSpace` must be boolean.');
    if (!item || typeof item !== 'object')
      throw new TypeError('`item` must be an InventoryItem object.');

    if (locationType === 'special' && specialSlot && typeof specialSlot !== 'string')
      throw new TypeError("`specialSlot` must be a string when locationType is 'special'.");
    if (locationType === 'normal' && typeof slotIndex !== 'number')
      throw new TypeError("`slotIndex` must be a number when locationType is 'normal'.");

    return (fs = forceSpace) => {
      if (locationType === 'special' && specialSlot) {
        const slot = this.#specialSlots.get(specialSlot);
        if (!slot?.item) throw new Error(`Special slot '${specialSlot}' is empty.`);
        if (slot.item.quantity > 1) {
          slot.item.quantity -= 1;
          this.#specialSlots.set(specialSlot, slot);
        } else this.setSpecialSlot({ slotId: specialSlot, item: null, forceSpace: fs });
      } else if (typeof slotIndex === 'number') {
        if (item.quantity > 1) {
          this.setItem({
            slotIndex,
            item: { ...item, quantity: item.quantity - 1 },
            forceSpace: fs,
          });
        } else this.setItem({ slotIndex, item: null, forceSpace: fs });
      } else
        throw new Error(`Invalid remove operation: no valid slotIndex or specialSlot provided.`);
    };
  }

  /**
   * Uses an item from a specific slot, or special slot,
   * triggering its `onUse` callback if defined.
   * Automatically removes the item if `remove()` is called inside the callback.
   *
   * @param {Object} location - Item location data.
   * @param {number} [location.slotIndex] - Index in inventory.
   * @param {string} [location.specialSlot] - Name of the special slot (if applicable).
   * @param {boolean} [location.forceSpace=false] - Forces the item to be added even if space or stack limits would normally prevent it.
   * @param {...any} args - Additional arguments passed to the `onUse` handler.
   * @returns {any} - The return value of the `onUse` callback, or `null` if no callback exists.
   * @throws {Error} - If the item is not found in the specified location.
   */
  useItem({ slotIndex, specialSlot, forceSpace = false }, ...args) {
    if (slotIndex !== undefined && (typeof slotIndex !== 'number' || !Number.isInteger(slotIndex)))
      throw new TypeError('`slotIndex` must be an integer if provided.');
    if (specialSlot !== undefined && typeof specialSlot !== 'string')
      throw new TypeError('`specialSlot` must be a string if provided.');
    if (typeof forceSpace !== 'boolean') throw new TypeError('`forceSpace` must be boolean.');

    /** @type {InventoryItem|null} */
    let item = null;
    /** @type {'normal'|'special'} */
    let locationType = 'normal'; // "normal"| "special"
    /** @type {InvSlots | null} */
    let collection = null;

    // Get item
    if (specialSlot) {
      if (!this.#specialSlots.has(specialSlot))
        throw new Error(`Special slot '${specialSlot}' not found.`);
      // @ts-ignore
      item = this.#specialSlots.get(specialSlot).item;
      locationType = 'special';
    } else {
      collection = this.#items;
      item = collection[slotIndex ?? -1] ?? null;
      locationType = 'normal';
    }

    // Check item
    if (!item) {
      throw new Error(
        locationType === 'special'
          ? `No item found in special slot '${specialSlot}'.`
          : `No item found in slot ${slotIndex} of inventory.`,
      );
    }

    // Get item info
    const def = TinyInventory.getItem(item.id);

    if (def.onUse) {
      const onUse = {
        inventory: this,
        item: this.#cloneItemData(item),
        index: slotIndex ?? null,
        specialSlot: specialSlot ?? null,
        isCollection: !!collection,
        itemDef: def,
        remove: this.#removeItemCallback({
          locationType,
          specialSlot,
          slotIndex,
          forceSpace,
          item,
        }),
        ...args,
      };

      const result = def.onUse(onUse);
      this.#triggerEvent('use', onUse);
      return result;
    }
    return null;
  }

  /////////////////////////////////////////////////////////////////

  /**
   * Checks if a special slot with the given ID exists in the inventory.
   * @param {string} slotId - ID of the special slot.
   * @returns {boolean} True if the slot exists, otherwise false.
   */
  hasSpecialSlot(slotId) {
    if (typeof slotId !== 'string') throw new TypeError('`slotId` must be a string.');
    return this.#specialSlots.has(slotId);
  }

  /**
   * Gets the item stored in a special slot.
   * @param {string} slotId - The special slot ID.
   * @returns {InventoryItem|null} The item object or null if empty.
   * @throws {Error} If the special slot does not exist.
   */
  getSpecialItem(slotId) {
    if (typeof slotId !== 'string') throw new TypeError('`slotId` must be a string.');
    if (!this.#specialSlots.has(slotId))
      throw new Error(`Special slot '${slotId}' does not exist.`);
    const slot = this.#specialSlots.get(slotId);
    return slot?.item ? this.#cloneItemData(slot.item) : null;
  }

  /**
   * Gets the type of a special slot.
   * @param {string} slotId - The special slot ID.
   * @returns {string|null} The slot type, or null if no type restriction.
   * @throws {Error} If the special slot does not exist.
   */
  getSpecialSlotType(slotId) {
    if (typeof slotId !== 'string') throw new TypeError('`slotId` must be a string.');
    if (!this.#specialSlots.has(slotId))
      throw new Error(`Special slot '${slotId}' does not exist.`);
    const slot = this.#specialSlots.get(slotId);
    return slot?.type ?? null;
  }

  /**
   * Sets or clears an item in a special slot.
   *
   * @param {Object} options - Item addition configuration.
   * @param {string} options.slotId - Name of the special slot.
   * @param {InventoryItem|null} options.item - Item to place, or null to clear.
   * @param {boolean} [options.forceSpace=false] - Forces the item to be added even if space or stack limits would normally prevent it.
   * @throws {Error} If the slot does not exist, or item is invalid.
   */
  setSpecialSlot({ slotId, item, forceSpace = false }) {
    if (typeof slotId !== 'string') throw new TypeError('`slotId` must be a string.');
    if (typeof forceSpace !== 'boolean') throw new TypeError('`forceSpace` must be boolean.');
    if (!this.#specialSlots.has(slotId)) throw new Error(`Special slot '${slotId}' not found.`);

    // Validate type: must be null or a proper InventoryItem object
    const isInventoryItem =
      item &&
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.quantity === 'number' &&
      !Number.isNaN(item.quantity) &&
      Number.isFinite(item.quantity) &&
      item.quantity > -1 &&
      typeof item.metadata === 'object';

    if (item !== null && !isInventoryItem)
      throw new Error(`Invalid item type: must be null or a valid InventoryItem.`);

    const def = item ? TinyInventory.#ItemRegistry.get(item.id) : null;
    if (item !== null && !def)
      throw new Error(`Item '${item?.id ?? 'unknown'}' not defined in registry.`);

    // Slot check
    const slot = this.#specialSlots.get(slotId);
    if (!slot) throw new Error(`Special slot ${slotId} out of range for slot '${slotId}'.`);

    // Weight check
    const oldItemData = slot.item ? TinyInventory.#ItemRegistry.get(slot.item.id) : null;

    /**
     * @param {InventoryItem|null} [theItem]
     * @param {ItemDef|null} [itemDef]
     * @returns {number}
     */
    const getTotalWeight = (theItem, itemDef) => (itemDef ? itemDef.weight * (theItem ? 1 : 0) : 0);

    /**
     * @param {InventoryItem|null} [theItem]
     * @returns {number}
     */
    const getTotalLength = (theItem) => (theItem ? 1 : 0);

    if (
      !forceSpace &&
      !this.hasSpace({
        weight: getTotalWeight(item, def) - getTotalWeight(slot.item, oldItemData),
        sizeLength: getTotalLength(item) - getTotalLength(slot.item),
      })
    )
      throw new Error('Inventory is full or overweight.');

    // Set or clear
    slot.item = item;

    this.#triggerEvent('set', {
      index: null,
      item: item ? this.#cloneItemData(item) : null,
      isCollection: false,
      specialSlot: slotId,
      remove: item
        ? this.#removeItemCallback({
            locationType: 'special',
            specialSlot: slotId,
            forceSpace,
            item,
          })
        : () => undefined,
    });
  }

  /**
   * Deletes an item from a specific special slot by setting it to null.
   *
   * @param {string} slotId - Special slot to delete from.
   * @param {boolean} [forceSpace=false] - Forces the item to be added even if space or stack limits would normally prevent it.
   */
  deleteSpecialItem(slotId, forceSpace = false) {
    if (typeof slotId !== 'string') throw new TypeError('`slotId` must be a string.');
    if (typeof forceSpace !== 'boolean') throw new TypeError('`forceSpace` must be boolean.');
    this.setSpecialSlot({ slotId, item: null, forceSpace });
  }

  /**
   * Equips an item from the inventory into a special slot.
   *
   * Behavior:
   * 1. If the same item is already equipped and stackable, it will merge quantities up to `maxStack`.
   *    Any leftover remains in the original inventory slot.
   * 2. If another item is equipped (different ID or non-stackable), the current one is moved back to inventory
   *    and the new item is equipped (up to its stack limit). Any leftover stays in the inventory.
   *
   * @param {Object} configs - Configuration object for equipping the item.
   * @param {string} configs.slotId - ID of the special slot where the item will be equipped.
   * @param {number} configs.slotIndex - Index of the inventory slot containing the item to equip.
   * @param {number} [configs.quantity=1] - Quantity of the item to equip.
   * @param {boolean} [configs.forceSpace=false] - Forces the item to be added even if space or stack limits would normally prevent it.
   * @returns {number} Amount of the item that could NOT be equipped (leftover remains in inventory).
   * @throws {Error} If the special slot does not exist, if the item type mismatches the slot,
   *                 or if the inventory lacks the required quantity.
   */
  equipItem({ slotId, slotIndex, quantity = 1, forceSpace = false }) {
    if (typeof slotId !== 'string') throw new TypeError('`slotId` must be a string.');
    if (typeof slotIndex !== 'number' || !Number.isInteger(slotIndex))
      throw new TypeError('`slotIndex` must be an integer.');
    if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0)
      throw new TypeError('`quantity` must be a positive number.');
    if (typeof forceSpace !== 'boolean') throw new TypeError('`forceSpace` must be boolean.');

    if (quantity <= 0 || !Number.isFinite(quantity))
      throw new Error(`Invalid quantity '${quantity}'.`);

    if (!this.#specialSlots.has(slotId))
      throw new Error(`Special slot '${slotId}' does not exist.`);

    const invItem = this.getItemFrom(slotIndex);
    if (!invItem) throw new Error(`No item found in inventory slot ${slotIndex}.`);
    if (invItem.quantity < quantity)
      throw new Error(`Not enough quantity of item '${invItem.id}' in inventory slot.`);

    const def = TinyInventory.getItem(invItem.id);
    const current = this.#specialSlots.get(slotId);
    if (!current) throw new Error(`Slot '${slotId}' not defined in registry.`);

    const slotType = current.type ?? null;
    if (slotType !== null && def.type !== slotType)
      throw new Error(`Item '${invItem.id}' cannot be equipped in slot '${slotId}'.`);

    const maxStack = Math.min(def.maxStack, this.#maxStack);

    // CASE 1: Same item already equipped & stackable → merge
    if (current.item && current.item.id === invItem.id) {
      const availableSpace = Math.max(0, maxStack - current.item.quantity);
      if (availableSpace <= 0) return quantity; // nothing fits

      const toEquip = Math.min(quantity, availableSpace);

      // Remove from inventory slot
      this.removeItem({ itemId: invItem.id, quantity: toEquip, metadata: null });

      // Merge into special slot
      current.item.quantity += toEquip;
      this.#specialSlots.set(slotId, current);

      return quantity - toEquip;
    }

    // CASE 2: Different item equipped → swap
    if (current.item) {
      this.unequipItem({ slotId, forceSpace }); // moves old one back to inventory
    }

    // Equip new item into slot
    const toEquip = Math.min(quantity, maxStack);

    this.removeItem({ itemId: invItem.id, quantity: toEquip, metadata: null });
    current.item = {
      id: invItem.id,
      quantity: toEquip,
      metadata: invItem.metadata,
    };
    this.#specialSlots.set(slotId, current);

    return quantity - toEquip;
  }

  /**
   * Unequips a specific quantity of an item from a special slot
   * and returns it to the inventory.
   *
   * If no quantity is specified, removes the entire stack.
   *
   * @param {Object} config - Item location data.
   * @param {string} config.slotId - ID of the special slot.
   * @param {number|null} [config.quantity=null] - Quantity to unequip (default: all).
   * @param {boolean} [config.forceSpace=false] - Forces the item to be added even if space or stack limits would normally prevent it.
   * @returns {boolean} True if any item was unequipped; false if slot empty.
   * @throws {Error} If the slot does not exist or invalid quantity.
   */
  unequipItem({ slotId, quantity = null, forceSpace = false }) {
    if (typeof slotId !== 'string') throw new TypeError('`slotId` must be a string.');
    if (
      quantity !== null &&
      (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0)
    )
      throw new TypeError('`quantity` must be a positive number or null.');
    if (typeof forceSpace !== 'boolean') throw new TypeError('`forceSpace` must be boolean.');

    if (!this.#specialSlots.has(slotId))
      throw new Error(`Special slot '${slotId}' does not exist.`);

    const current = this.#specialSlots.get(slotId);
    if (!current) throw new Error(`Slot '${slotId}' not defined in registry.`);
    if (!current.item) return false; // Empty slot

    const item = current.item;
    const unequipQty = quantity === null ? item.quantity : quantity;

    if (unequipQty <= 0) throw new Error(`Invalid unequip quantity: ${unequipQty}`);
    if (unequipQty > item.quantity)
      throw new Error(`Not enough items in slot '${slotId}' to unequip.`);

    // Return to inventory with requested quantity
    this.addItem({ itemId: item.id, quantity: unequipQty, metadata: item.metadata, forceSpace });

    if (unequipQty === item.quantity) {
      // Fully emptied
      current.item = null;
    } else {
      // Partially reduced
      item.quantity -= unequipQty;
      current.item = item;
    }

    this.#specialSlots.set(slotId, current);
    return true;
  }

  /////////////////////////////////////////////////////////////////

  /**
   * Creates a deep clone of an inventory item, ensuring metadata is copied safely.
   * @param {InventoryItem} item - The item to clone.
   * @returns {InventoryItem} A new inventory item object with identical data.
   */
  #cloneItemData(item) {
    if (!item || typeof item !== 'object')
      throw new TypeError('`item` must be an InventoryItem object.');
    if (typeof item.id !== 'string') throw new TypeError('`item.id` must be a string.');
    if (typeof item.quantity !== 'number' || !Number.isFinite(item.quantity))
      throw new TypeError('`item.quantity` must be a finite number.');
    if (!item.metadata || typeof item.metadata !== 'object')
      throw new TypeError('`item.metadata` must be an object.');
    return { id: item.id, quantity: item.quantity, metadata: { ...item.metadata } };
  }

  /**
   * Returns all items from the inventory with their respective indexes.
   * @returns {ItemListData[]} An array where each entry is `[InventoryItem, index]`.
   */
  getItemList() {
    // @ts-ignore
    return [...this.#items]
      .map((item, index) => [item ? this.#cloneItemData(item) : null, index])
      .filter((item) => item[0] !== null);
  }

  /**
   * Returns all items currently stored in the inventory,
   * excluding null or undefined entries.
   * @returns {InventoryItem[]} Array of item objects.
   */
  getAllItems() {
    const data = [...this.#items].filter((item) => item !== null).map(this.#cloneItemData);
    this.#specialSlots.forEach((value) => {
      const item = value.item;
      if (item) data.push(item);
    });
    return data;
  }

  /**
   * Finds all items matching a given metadata filter function.
   * @param {GetItemsByMetadataCallback} filterFn - Function receiving (itemTypeMetadata, itemInstance).
   * @returns {InventoryItem[]} Array of matching items.
   */
  getItemsByMetadata(filterFn) {
    if (typeof filterFn !== 'function') throw new TypeError('`filterFn` must be a function.');
    return this.getAllItems().filter((item) => {
      const def = TinyInventory.getItem(item.id);
      return filterFn(def.metadata, item);
    });
  }

  /**
   * Finds the first item matching the given predicate.
   * @param {FindItemCallback} predicate - Function receiving the item instance.
   * @returns {InventoryItem|undefined} The first matching item, or undefined if none match.
   */
  findItem(predicate) {
    if (typeof predicate !== 'function') throw new TypeError('`predicate` must be a function.');
    return this.getAllItems().find(predicate);
  }

  /**
   * Finds all items matching the given predicate.
   * @param {FindItemCallback} predicate - Function receiving the item instance.
   * @returns {InventoryItem[]} Array of matching items.
   */
  findItems(predicate) {
    if (typeof predicate !== 'function') throw new TypeError('`predicate` must be a function.');
    return this.getAllItems().filter(predicate);
  }

  /**
   * Counts the total quantity of a given item in the inventory.
   * @param {string} itemId - Item ID to count.
   * @returns {number} Total quantity of that item.
   */
  getItemCount(itemId) {
    if (typeof itemId !== 'string') throw new TypeError('`itemId` must be a string.');
    return this.getAllItems()
      .filter((it) => it.id === itemId)
      .reduce((sum, it) => sum + it.quantity, 0);
  }

  /**
   * Checks whether the inventory contains at least the given quantity of an item.
   * @param {string} itemId - Item ID to check.
   * @param {number} [quantity=1] - Quantity to check.
   * @returns {boolean} True if the inventory has the quantity or more.
   */
  hasItem(itemId, quantity = 1) {
    if (typeof itemId !== 'string') throw new TypeError('`itemId` must be a string.');
    if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity < 0)
      throw new TypeError('`quantity` must be a non-negative number.');
    return this.getItemCount(itemId) >= quantity;
  }

  /**
   * Checks if there is an item stored at the given slot index.
   *
   * @param {number} slotIndex - The inventory slot to check.
   * @returns {boolean} True if the slot contains an item, otherwise false.
   */
  existsItemAt(slotIndex) {
    if (typeof slotIndex !== 'number' || !Number.isInteger(slotIndex))
      throw new TypeError('`slotIndex` must be an integer.');
    return this.#items[slotIndex] ? true : false;
  }

  /////////////////////////////////////////////////////////////////

  /**
   * Clears all items and event listeners from the inventory.
   * Resets the inventory state but preserves max limits and slot definitions.
   *
   * @returns {void}
   */
  clear() {
    this.clearAllItems();
    this.clearAllEvents();
  }

  /**
   * Removes all registered event listeners from the inventory.
   *
   * @returns {void}
   */
  clearAllEvents() {
    this.#events = { add: [], remove: [], use: [], set: [] };
  }

  /**
   * Clears all items in normal and special slots and triggers remove events.
   *
   * @returns {void}
   */
  clearAllItems() {
    this.clearItems();
    this.clearSpecialItems();
  }

  /**
   * Clears all items in the normal inventory slots and triggers remove events.
   *
   * @returns {void}
   */
  clearItems() {
    for (let i = this.#items.length - 1; i >= 0; i--) {
      if (this.#items[i]) this.deleteItem(i, true);
    }
  }

  /**
   * Clears all items in special slots and triggers remove events.
   *
   * @returns {void}
   */
  clearSpecialItems() {
    for (const slotId of this.#specialSlots.keys()) {
      const slot = this.#specialSlots.get(slotId);
      if (slot?.item) this.deleteSpecialItem(slotId, true);
    }
  }

  /**
   * Creates a deep copy of this inventory.
   *
   * The cloned inventory will contain the same items, slots, and metadata,
   * but will be a fully independent instance. Any changes to the clone will
   * not affect the original inventory and vice versa.
   *
   * @returns {TinyInventory} A new TinyInventory instance identical to this one.
   */
  clone() {
    const obj = this.toObject();
    return TinyInventory.fromObject(obj);
  }

  /**
   * Creates a plain JSON-safe object representing the current inventory state.
   * Functions (e.g., onUse) are NOT serialized; only instance state is saved.
   * @returns {SerializedInventory} A plain object safe to JSON.stringify.
   */
  toObject() {
    /** @type {Record<string, { type: string|null, item: InventoryItem|null }>} */
    const special = {};
    for (const [slotId, slotObj] of this.#specialSlots.entries()) {
      special[slotId] = {
        type: slotObj?.type ?? null,
        item: slotObj?.item ? this.#cloneItemData(slotObj.item) : null,
      };
    }

    return {
      __schema: 'TinyInventory',
      version: 1,

      maxWeight: this.#maxWeight,
      maxSlots: this.#maxSlots,
      maxSize: this.#maxSize,
      maxStack: this.#maxStack,

      items: this.#items.map((it) => (it ? this.#cloneItemData(it) : null)),
      specialSlots: special,
    };
  }

  /**
   * Serializes the inventory to a JSON string.
   * @param {number} [space=0] - Pretty-print indentation (e.g., 2).
   * @returns {string} JSON string.
   */
  toJSON(space = 0) {
    if (typeof space !== 'number' || !Number.isFinite(space) || space < 0)
      throw new TypeError('`space` must be a non-negative number.');
    return JSON.stringify(this.toObject(), null, space);
  }

  /////////////////////////////////////////////////////////////////

  /**
   * Rebuilds a TinyInventory from a plain object created by {@link TinyInventory.toObject}.
   * Item definitions (ItemRegistry) must be already defined externally; this method only restores state.
   *
   * @param {SerializedInventory} obj - Parsed JSON object.
   * @returns {TinyInventory} A new TinyInventory instance populated with the saved state.
   * @throws {Error} If validation fails and `validate` is true.
   */
  static fromObject(obj) {
    if (!obj || typeof obj !== 'object') throw new TypeError('Invalid state: expected object.');
    if (obj.__schema !== 'TinyInventory' || typeof obj.version !== 'number')
      throw new TypeError('Invalid or missing schema header.');
    if (obj.version !== 1)
      throw new TypeError(`Unsupported TinyInventory state version: ${obj.version}`);

    // Prepare constructor options
    /** @type {Record<string, {type: string|null}>} */
    const specialDefs = {};
    if (obj.specialSlots && typeof obj.specialSlots === 'object') {
      for (const key of Object.keys(obj.specialSlots)) {
        specialDefs[key] = { type: obj.specialSlots[key]?.type ?? null };
      }
    }

    const inv = new TinyInventory({
      maxWeight: obj.maxWeight ?? null,
      maxSlots: obj.maxSlots ?? null,
      maxSize: obj.maxSize ?? null,
      maxStack: obj.maxStack ?? null,
      specialSlots: specialDefs,
    });

    // Restore items
    if (Array.isArray(obj.items)) {
      for (const index in obj.items) {
        const it = obj.items[index];
        if (it !== null) {
          const safeItem = {
            id: String(it.id),
            quantity: Math.max(1, Number(it.quantity) || 1),
            metadata: it.metadata && typeof it.metadata === 'object' ? it.metadata : {},
          };
          inv.setItem({ slotIndex: Number(index), item: safeItem, forceSpace: true });
        } else inv.setItem({ slotIndex: Number(index), item: null, forceSpace: true });
      }
    }

    // Restore special slots
    if (obj.specialSlots && typeof obj.specialSlots === 'object') {
      for (const [slotId, slotData] of Object.entries(obj.specialSlots)) {
        // Ensure slot exists (constructor already created it)
        if (!inv.hasSpecialSlot(slotId)) continue;

        // Keep the type from constructor; ignore type from payload if mismatched
        // but we still try to restore the item if present.
        const item = slotData?.item;
        if (item && item.id) {
          const safeEquipped = {
            id: String(item.id),
            quantity: Math.max(1, Number(item.quantity) || 1),
            metadata: item.metadata && typeof item.metadata === 'object' ? item.metadata : {},
          };
          inv.setSpecialSlot({ slotId, item: safeEquipped, forceSpace: true });
        }
      }
    }

    return inv;
  }

  /**
   * Rebuilds a TinyInventory from a JSON string produced by {@link TinyInventory.toJSON}.
   * @param {string} json - JSON string.
   * @returns {TinyInventory} A new TinyInventory instance.
   */
  static fromJSON(json) {
    if (typeof json !== 'string') throw new TypeError('`json` must be a string.');
    const obj = JSON.parse(json);
    return TinyInventory.fromObject(obj);
  }
}

export default TinyInventory;
