# 📦 TinyInventory

**TinyInventory** is a lightweight yet powerful inventory management system designed for games, simulations, and applications that require structured item handling. It provides:

* **Stack management** (items merge up to configurable stack limits).
* **Slot management** (fixed, dynamic, and special equipment slots).
* **Weight and size constraints** for advanced gameplay mechanics.
* **Serialization & cloning** (save, load, and duplicate inventories safely).
* **Flexible item registry support** to integrate with custom game logic.

With a clean API and robust safeguards, TinyInventory ensures that every item transaction — whether adding, removing, moving, or trading — follows consistent rules and prevents invalid states.

It is designed to work standalone or as a foundation for higher-level systems, such as crafting, trading, or player equipment managers.

---

## 📑 Table of Contents

- [📦 Core Types & Properties](#-core-types--properties)
  - [🧩 ItemDef](#-itemdef)
  - [🎒 InventoryItem](#-inventoryitem)
  - [📑 InvSlots](#-invslots)
  - [🗂️ InventoryMetadata](#️-inventorymetadata)
  - [🛡️ SpecialSlot](#️-specialslot)
  - [🔔 Event System](#-event-system)
  - [🏷️ OnUseEvent](#️-onuseevent)
  - [🎯 EventsType](#-eventstype)
  - [🔍 Callbacks](#-callbacks)
  - [📄 SerializedInventory](#-serializedinventory)
  - [🗃️ ItemListData](#️-itemlistdata)
  - [📬 EventPayload](#-eventpayload)
  - [➕ AddItemResult](#-additemresult)
- [🏗️ TinyInventory Class](#️-tinyinventory-class)
  - [🏷️ Static: `#ItemRegistry`](#️-static-itemregistry)
  - [⚙️ Constructor](#️-constructor)
  - [📊 Properties (Getters & Setters)](#-properties-getters--setters)
  - [📏 Calculated Properties](#-calculated-properties)
- [⚖️ Space & Capacity Checks](#️-space--capacity-checks)
  - [🔍 `hasSpace(settings?)`](#-hasspacesettings)
  - [🏋️ `isHeavy(extraWeight = 0)`](#️-isheavyextraweight--0)
  - [📦 `areFull(extraLength = 0)`](#-arefullextralength--0)
  - [📦 `isFull(extraLength = 0)`](#-isfullextralength--0)
  - [🎯 `areFullSlots(extraLength = 0)`](#-arefullslotsextralength--0)
  - [🎯 `isFullSlots(extraLength = 0)`](#-isfullslotsextralength--0)
- [🔔 Event System](#-event-system)
  - [⚡ `#triggerEvent(type, payload)`](#-triggereventtype-payload)
  - [❌ `off(eventType, callback)`](#-offeventtype-callback)
  - [🧹 `offAll(eventType)`](#-offalleventtype)
  - [🪞 `cloneEventCallbacks(eventType)`](#-cloneeventcallbackseventtype)
  - [🎉 Event Registration Helpers](#-event-registration-helpers)
- [🧹 Slot Management](#-slot-management)
  - [🧽 `compactInventory()`](#-compactinventory)
- [🧹 Inventory Clearing](#-inventory-clearing)
  - [🧽 `clear()`](#-clear)
  - [🧹 `clearAllEvents()`](#-clearallevents)
  - [🗃️ `clearAllItems()`](#️-clearallitems)
  - [📦 `clearItems()`](#-clearitems)
  - [🎯 `clearSpecialItems()`](#-clearspecialitems)
- [➕ Item Management](#-item-management)
  - [📥 `addItem(options)`](#-additemoptions)
  - [📤 `getItemFrom(slotIndex)`](#-getitemfromslotindex)
  - [✏️ `setItem(options)`](#️-setitemoptions)
  - [❌ `deleteItem(slotIndex, forceSpace?)`](#-deleteitemslotindex-forcespace)
  - [🔄 `moveItem(fromIndex, toIndex, forceSpace?)`](#-moveitemfromindex-toindex-forcespace)
  - [🗑️ `removeItem(options)`](#️-removeitemoptions)
- [🎮 Item Usage & Special Slots](#-item-usage--special-slots)
  - [🧩 `#removeItemCallback(config)`](#-removeitemcallbackconfig)
  - [🎯 `useItem({ slotIndex, specialSlot, forceSpace }, ...args)`](#-useitem-slotindex-specialslot-forcespace--args)
- [🛡️ Special Slot Management](#️-special-slot-management)
  - [🔍 `hasSpecialSlot(slotId)`](#-hasspecialslotslotid)
  - [📦 `getSpecialItem(slotId)`](#-getspecialitemslotid)
  - [🏷️ `getSpecialSlotType(slotId)`](#️-getspecialslottypeslotid)
  - [✏️ `setSpecialSlot({ slotId, item, forceSpace })`](#️-setspecialslot-slotid-item-forcespace-)
  - [❌ `deleteSpecialItem(slotId, forceSpace?)`](#-deletespecialitemslotid-forcespace)
  - [⚔️ `equipItem({ slotId, slotIndex, quantity, forceSpace })`](#️-equipitem-slotid-slotindex-quantity-forcespace-)
  - [🛡️ `unequipItem({ slotId, quantity, forceSpace })`](#️-unequipitem-slotid-quantity-forcespace-)
- [🛠️ Utility Methods](#️-utility-methods)
  - [🧬 `#cloneItemData(item)`](#-cloneitemdataitem)
  - [📋 `getItemList()`](#-getitemlist)
  - [📦 `getAllItems()`](#-getallitems)
  - [🔍 `getItemsByMetadata(filterFn)`](#-getitemsbymetadatafilterfn)
  - [🔍 `findItem(predicate)`](#-finditempredicate)
  - [🔍 `findItems(predicate)`](#-finditemspredicate)
  - [🔢 `getItemCount(itemId)`](#-getitemcountitemid)
  - [✅ `hasItem(itemId, quantity = 1)`](#-hasitemitemid-quantity--1)
  - [📍 `existsItemAt(slotIndex)`](#-existsitematslotindex)
- [📝 Serialization & Cloning](#-serialization--cloning)
  - [🧬 `clone()`](#-clone)
  - [📦 `toObject()`](#-toobject)
  - [📜 `toJSON(space = 0)`](#-tojsonspace--0)
- [📥 Deserialization](#-deserialization)
  - [🛠️ `static fromObject(obj)`](#️-static-fromobjectobj)
  - [🔄 `static fromJSON(json)`](#-static-fromjsonjson)

---

## 📦 Core Types & Properties

### 🧩 ItemDef

Represents a registered **item definition** in the global registry.

| Property   | Type                 | Description                          |
| ---------- | -------------------- | ------------------------------------ |
| `id`       | `string`             | Unique identifier for the item.      |
| `weight`   | `number`             | Weight of a single unit.             |
| `metadata` | `InventoryMetadata`  | Default metadata for this item type. |
| `maxStack` | `number`             | Maximum stack size per slot.         |
| `onUse`    | `OnUseEvent \| null` | Callback triggered when used.        |
| `type`     | `string \| null`     | Optional category/type.              |

---

### 🎒 InventoryItem

Represents a **stored item instance** inside the inventory.

| Property   | Type                | Description                 |
| ---------- | ------------------- | --------------------------- |
| `id`       | `string`            | Item identifier.            |
| `metadata` | `InventoryMetadata` | Metadata for this instance. |
| `quantity` | `number`            | Units in this stack.        |

---

### 📑 InvSlots

An array of item stacks in the inventory.

```ts
(InventoryItem | null)[]
```

---

### 🗂️ InventoryMetadata

Metadata object for **arbitrary key-value pairs**.

```ts
Record<string | number | symbol, any>
```

---

### 🛡️ SpecialSlot

Represents a **special slot** (e.g., equipment).

| Property | Type                    | Description                |
| -------- | ----------------------- | -------------------------- |
| `type`   | `string \| null`        | Optional slot category.    |
| `item`   | `InventoryItem \| null` | Item equipped in the slot. |

---

### 🔔 Event System

* `OnEvent` → `(payload: EventPayload) => void`
* **AddItemEvent** → triggered when an item is added
* **SetItemEvent** → triggered when an item is set/overwritten
* **RemoveItemEvent** → triggered when an item is removed
* **UseItemEvent** → triggered when an item is used

---

### 🏷️ OnUseEvent

Special callback executed when using an item.

```ts
(payload: EventPayload) => void
```

---

### 🎯 EventsType

Supported event strings:
`"add" | "remove" | "use" | "set"`

---

### 🔍 Callbacks

* **GetItemsByMetadataCallback** → Filters items by metadata.
* **FindItemCallback** → Works like `Array.prototype.find()` to locate items.

---

### 📄 SerializedInventory

Full JSON structure for saving/loading inventories.

| Property       | Type                          | Description                      |               |
| -------------- | ----------------------------- | -------------------------------- | ------------- |
| `__schema`     | `"TinyInventory"`             | Schema identifier.               |               |
| `version`      | `number`                      | Format version.                  |               |
| `maxWeight`    | `number \| null`              | Max weight allowed.              |               |
| `maxSlots`     | `number \| null`              | Max slots allowed.               |               |
| `maxSize`      | `number \| null`              | Max item amount.                 |               |
| `maxStack`     | `number`                      | Global stack limit.              |               |
| `items`        | \`(InventoryItem              | null)\[]\`                       | Stored items. |
| `specialSlots` | `Record<string, SpecialSlot>` | Reserved slots (e.g., "helmet"). |               |

---

### 🗃️ ItemListData

Tuple representing an inventory entry:

```ts
[InventoryItem, number] // [item, index]
```

---

### 📬 EventPayload

Payload object dispatched when an inventory action occurs.

| Property       | Type                            | Description              |                              |
| -------------- | ------------------------------- | ------------------------ | ---------------------------- |
| `index`        | \`number                        | null\`                   | Item index in slots.         |
| `item`         | \`InventoryItem                 | null\`                   | Item affected.               |
| `isCollection` | `boolean`                       | True if from collection. |                              |
| `specialSlot`  | \`string                        | null\`                   | Special slot ID if relevant. |
| `remove`       | `(forceSpace: boolean) => void` | Function to remove item. |                              |

---

### ➕ AddItemResult

Result object returned after adding an item.

| Property      | Type                                    | Description                                   |
| ------------- | --------------------------------------- | --------------------------------------------- |
| `remaining`   | `number`                                | Quantity not added due to space/stack limits. |
| `placesAdded` | `{ index: number; quantity: number }[]` | Slots where items were placed.                |

---

## 🏗️ TinyInventory Class

A **flexible inventory management system** providing:

* 📦 Standard slots with configurable **limits** (weight, size, stack).
* 🛡️ Special slots for **equipment & unique items**.
* ✏️ Full **CRUD** operations (add, remove, move, use, equip, unequip).
* 🧠 **Metadata-aware** handling (durability, enchantments, etc.).
* 💾 **Serialization/Deserialization** to JSON.
* 🔔 **Event triggers** for `"add"`, `"remove"`, `"use"`, `"set"`.

---

### 🏷️ Static: `#ItemRegistry`

TinyInventory comes with a **global item registry** that defines all possible item types before they are used in any inventory.
This ensures consistency in rules such as stack limits, metadata defaults, weight, and usage behavior (`id → ItemDef`).

#### 🔍 `TinyInventory.itemRegistry` (getter)

Returns a deep-cloned snapshot of the registered item definitions.

* ✅ Prevents accidental mutations of the internal registry.
* 📑 Each entry includes `id`, `weight`, `maxStack`, `metadata`, `type`, and `onUse`.

**Returns:**

```ts
Record<string, ItemDef>
```

---

#### ❌ `TinyInventory.removeItem(itemId)`

Removes an item type from the registry.

**Parameters:**

* `itemId` *(string)* → The unique identifier.

**Returns:**

* `true` if the item existed and was removed.
* `false` if the item was not found.

---

#### ✅ `TinyInventory.hasItem(itemId)`

Checks if an item type exists in the registry.

**Parameters:**

* `itemId` *(string)* → The unique identifier.

**Returns:**

* `true` if the item exists.
* `false` otherwise.

---

#### 📥 `TinyInventory.getItem(itemId)`

Retrieves the definition of a registered item.

**Parameters:**

* `itemId` *(string)* → The unique identifier.

**Returns:**

* `ItemDef` → The item definition.

⚠️ Throws `Error` if the item is not defined.

---

#### 🛠️ Static: `defineItem(config)`

Registers or updates an item in the global registry.

```ts
TinyInventory.defineItem({
  id: "apple",
  weight: 0.2,
  maxStack: 10,
  metadata: { edible: true },
  type: "food",
  onUse: (payload) => console.log("Apple eaten!", payload),
});
```

⚠️ Throws if `id` is missing or invalid.

---

### ⚙️ Constructor

Creates a new inventory instance with customizable constraints:

```ts
new TinyInventory({
  maxWeight: 100,
  maxSlots: 20,
  maxSize: 200,
  maxStack: 99,
  specialSlots: { helmet: { type: "armor" }, weapon: { type: "sword" } }
});
```

---

### 📊 Properties (Getters & Setters)

* `maxStack` → Maximum stack size per slot.
* `maxSize` → Maximum total quantity of items.
* `maxSlots` → Maximum number of slots.
* `maxWeight` → Maximum total weight allowed.
* `events` → Returns registered event listeners.
* `items` → Returns cloned item list.
* `specialSlots` → Returns cloned special slots.

---

### 📏 Calculated Properties

* `size` → Total quantity of items.
* `slotsSize` → Number of occupied slots.
* `weight` → Total carried weight.

---

## ⚖️ Space & Capacity Checks

### 🔍 `hasSpace(settings?)`

Checks if there is **available space** based on slot, size, and weight limits.

```ts
hasSpace({
  weight?: number,
  sizeLength?: number,
  slotsLength?: number
}): boolean
```

| Parameter     | Type   | Default | Description                                            |
| ------------- | ------ | ------- | ------------------------------------------------------ |
| `weight`      | number | `0`     | Extra weight to preview (e.g., before adding an item). |
| `sizeLength`  | number | `0`     | Extra item count to preview.                           |
| `slotsLength` | number | `0`     | Extra slot count to preview.                           |

✅ Returns `true` if the inventory can handle the addition.

---

### 🏋️ `isHeavy(extraWeight = 0)`

Checks if the **total weight** exceeds the max allowed.

* `true` → Overweight
* `false` → Within limits

---

### 📦 `areFull(extraLength = 0)`

Checks if the **item count** exceeds `maxSize`.

* Uses `>` check (strictly over the limit).

---

### 📦 `isFull(extraLength = 0)`

Checks if the **item count** has **reached** `maxSize`.

* Uses `>=` check (at limit or over).

---

### 🎯 `areFullSlots(extraLength = 0)`

Checks if the **slot count** exceeds `maxSlots`.

* Uses `>` check.

---

### 🎯 `isFullSlots(extraLength = 0)`

Checks if the **slot count** has **reached** `maxSlots`.

* Uses `>=` check.

---

## 🔔 Event System

### ⚡ `#triggerEvent(type, payload)`

Internal method to dispatch inventory events.

* `type` → `"add" | "remove" | "use" | "set"`
* `payload` → `EventPayload`

---

### ❌ `off(eventType, callback)`

Unregisters a specific event listener.

---

### 🧹 `offAll(eventType)`

Removes **all callbacks** for a given event type.

---

### 🪞 `cloneEventCallbacks(eventType)`

Returns a **shallow copy** of all listeners for an event type.

---

### 🎉 Event Registration Helpers

* `onAddItem(callback)` → Listen to item additions.
* `onSetItem(callback)` → Listen to item sets/replacements.
* `onRemoveItem(callback)` → Listen to removals.
* `onUseItem(callback)` → Listen to item usage.

---

## 🧹 Slot Management

### 🧽 `compactInventory()`

Removes unnecessary `null` values, **compacting slots**.

* Preserves item order.
* Triggers `"remove"` event for cleared slots.

---

## 🧹 Inventory Clearing

### 🧽 `clear()`

Clears **all items** and **event listeners** from the inventory.

* Resets normal and special slots.
* Clears all registered event listeners (`add`, `remove`, `use`, `set`).
* Preserves max limits and slot definitions.

---

### 🧹 `clearAllEvents()`

Removes **all registered event listeners** from the inventory.

* Event types affected: `"add"`, `"remove"`, `"use"`, `"set"`.
* Does not affect any items in inventory.

---

### 🗃️ `clearAllItems()`

Removes **all items** from the inventory, including normal and special slots.

* Calls `clearItems()` and `clearSpecialItems()` internally.
* Does not remove slots or event listeners.

---

### 📦 `clearItems()`

Clears all items in **normal inventory slots**.

* Resets the `#items` array to empty.
* Does not affect special slots or event listeners.

---

### 🎯 `clearSpecialItems()`

Clears all items in **special slots**, without removing the slots themselves.

* Each slot remains defined, but its `item` property is set to `null`.
* Does not affect normal slots or event listeners.

---

## ➕ Item Management

### 📥 `addItem(options)`

Adds an item to the inventory, respecting:

* ✅ Stack limits
* ✅ Metadata equality
* ✅ Capacity (size, slots, weight)

```ts
addItem({
  itemId: string,
  quantity?: number,
  metadata?: InventoryMetadata,
  forceSpace?: boolean
}): AddItemResult
```

#### Behavior:

1. 🔄 **Fills existing stacks** first.
2. 📤 **Uses empty slots** if possible.
3. 🆕 **Pushes new stacks** at the end if needed.

📦 Returns `{ remaining, placesAdded }`.
⚠️ Throws if the item is not registered.

---

### 📤 `getItemFrom(slotIndex)`

Retrieves item from a slot.

* Returns a **clone** (safe copy).
* Throws if index is out of bounds.

---

### ✏️ `setItem(options)`

Directly sets or clears an item at a specific slot.

* Validates stack size & registry.
* Supports `null` for deletion.
* Triggers `"set"` event.
* Throws if invalid index or type.

---

### ❌ `deleteItem(slotIndex, forceSpace?)`

Shortcut for clearing a slot (`setItem({ item: null })`).

---

### 🔄 `moveItem(fromIndex, toIndex, forceSpace?)`

Moves an item from one slot to another.

* Throws if source is empty.
* Replaces destination if valid.

---

### 🗑️ `removeItem(options)`

Removes a quantity of a given item (normal slots + special slots).

```ts
removeItem({
  itemId: string,
  metadata?: InventoryMetadata | null,
  quantity?: number
}): boolean
```

* ✅ Matches by `id` and optional `metadata`.
* ✅ Works across both normal slots and special slots.
* ✅ Triggers `"remove"` events.
* Returns `true` if fully removed, `false` if not enough items.

---

## 🎮 Item Usage & Special Slots

### 🧩 `#removeItemCallback(config)`

Creates a **removal callback** for normal or special slots.

```ts
#removeItemCallback({
  locationType: "special" | "normal",
  item: InventoryItem,
  specialSlot?: string,
  slotIndex?: number,
  forceSpace?: boolean
}): (forceSpace?: boolean) => void
```

* Decrements item quantity.
* Clears slot if quantity reaches `0`.
* Returns a function that executes the removal.

---

### 🎯 `useItem({ slotIndex, specialSlot, forceSpace }, ...args)`

Uses an item from either a **normal slot** or a **special slot**.

✨ Behavior:

* Calls the item’s `onUse` callback if defined.
* Provides a `remove()` function inside the `onUse` context.
* Triggers the `"use"` event.

⚠️ Throws if the item doesn’t exist.

---

## 🛡️ Special Slot Management

### 🔍 `hasSpecialSlot(slotId)`

Checks if a special slot exists.

---

### 📦 `getSpecialItem(slotId)`

Gets the item from a special slot.

* Returns `null` if empty.
* Throws if slot doesn’t exist.

---

### 🏷️ `getSpecialSlotType(slotId)`

Gets the type/category of a special slot.

* Returns `null` if unrestricted.

---

### ✏️ `setSpecialSlot({ slotId, item, forceSpace })`

Sets or clears an item in a special slot.

* Validates item structure.
* Ensures registry + weight/space limits.
* Triggers `"set"` event.

---

### ❌ `deleteSpecialItem(slotId, forceSpace?)`

Clears a special slot (sets item to `null`).

---

### ⚔️ `equipItem({ slotId, slotIndex, quantity, forceSpace })`

Equips an item from the inventory into a special slot.

✨ Behavior:

1. **Same item equipped + stackable** → merge up to `maxStack`.
2. **Different item equipped** → unequips old item and equips the new one.
3. Returns leftover quantity (not equipped).

⚠️ Throws if slot does not exist, types mismatch, or insufficient quantity.

---

### 🛡️ `unequipItem({ slotId, quantity, forceSpace })`

Unequips an item from a special slot back to the inventory.

* If `quantity` is omitted → unequips the whole stack.
* Returns `true` if successful, `false` if empty.
* Throws if invalid quantity.

---

## 🛠️ Utility Methods

### 🧬 `#cloneItemData(item)`

Creates a **deep clone** of an item (copies metadata).

---

### 📋 `getItemList()`

Returns an array of all items with their slot indexes:

```ts
[ InventoryItem, index ][]
```

---

### 📦 `getAllItems()`

Returns all items in the inventory,
including **special slots**, excluding `null`s.

---

### 🔍 `getItemsByMetadata(filterFn)`

Finds items by metadata.

* `filterFn(itemTypeMetadata, itemInstance)` must return `true` to include item.

---

### 🔍 `findItem(predicate)`

Finds the **first item** matching the predicate.

---

### 🔍 `findItems(predicate)`

Finds **all items** matching the predicate.

---

### 🔢 `getItemCount(itemId)`

Counts the **total quantity** of a given item across the whole inventory.

---

### ✅ `hasItem(itemId, quantity = 1)`

Checks if the inventory has at least `quantity` of a given item.

---

### 📍 `existsItemAt(slotIndex)`

Checks if there is an item at a given **normal slot index**.

---

## 📝 Serialization & Cloning

### 🧬 `clone()`

Creates a **deep copy** of the entire inventory.

✨ Behavior:

* Copies all items, slots, and metadata.
* The clone is fully independent (changes won’t affect the original).

🔄 Returns:

* A new `TinyInventory` instance.

---

### 📦 `toObject()`

Creates a **plain JSON-safe object** representing the current inventory state.

✨ Behavior:

* Functions (like `onUse`) are **not serialized**.
* Only item data, slots, and metadata are saved.

🔄 Returns:

* A `SerializedInventory` object (safe to `JSON.stringify`).

---

### 📜 `toJSON(space = 0)`

Serializes the inventory into a **JSON string**.

* `space` controls pretty-print indentation (e.g., `2`).

🔄 Returns:

* A JSON string representing the inventory.

---

## 📥 Deserialization

### 🛠️ `static fromObject(obj)`

Rebuilds a `TinyInventory` instance from a plain object produced by `toObject()`.

✨ Behavior:

* Requires **item definitions** to already exist in the external registry.
* Validates schema (`__schema: "TinyInventory"`, `version: 1`).
* Restores normal slots and special slots.

⚠️ Throws if validation fails or schema is invalid.

🔄 Returns:

* A populated `TinyInventory` instance.

---

### 🔄 `static fromJSON(json)`

Rebuilds a `TinyInventory` from a JSON string produced by `toJSON()`.

🔄 Returns:

* A populated `TinyInventory` instance.
