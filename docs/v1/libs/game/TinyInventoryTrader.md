# 📦 TinyInventoryTrader

`TinyInventoryTrader` is a helper class designed to manage item transfers between two [`TinyInventory`](./TinyInventory.mjs) instances.
It ensures safe and configurable trading with support for strict validation, slot targeting, and batch operations.

---

## 🔖 Typedefs

### `TransferItemCfg`

Configuration object for a single transfer.

| Property            | Type      | Default | Description                                                                  |
| ------------------- | --------- | ------- | ---------------------------------------------------------------------------- |
| `slotIndex`         | `number`  | —       | Sender slot index.                                                           |
| `receiverSlotIndex` | `number`  | —       | Receiver slot index (optional).                                              |
| `specialSlot`       | `string`  | —       | Sender special slot ID.                                                      |
| `quantity`          | `number`  | `1`     | Quantity to transfer.                                                        |
| `forceSpace`        | `boolean` | `false` | Whether to force addition even if space is limited.                          |
| `strict`            | `boolean` | `false` | If `true`, transfer will throw if the receiver cannot fully fit the item(s). |

---

## 🏗️ Class: `TinyInventoryTrader`

Manages item transfers between two `TinyInventory` instances.

### 🔑 Private Fields

* `#sender` → `TinyInventory|null`
* `#receiver` → `TinyInventory|null`

---

### 📥 Constructor

```js
new TinyInventoryTrader(sender?, receiver?)
```

* **Parameters:**

  * `sender` (`TinyInventory`) → Inventory to remove items from.
  * `receiver` (`TinyInventory`) → Inventory to add items to.
* **Throws:** If either argument is not a valid `TinyInventory`.

---

### 📌 Properties

* `sender` → `TinyInventory|null`
  Current sender inventory. Setting it requires the receiver to also be a valid `TinyInventory`.

* `receiver` → `TinyInventory|null`
  Current receiver inventory. Setting it requires the sender to also be a valid `TinyInventory`.

---

### 🔧 Methods

#### `connect(sender, receiver)`

Connects the sender and receiver inventories.

* **Parameters:**

  * `sender` (`TinyInventory`) → Inventory to remove items from.
  * `receiver` (`TinyInventory`) → Inventory to add items to.
* **Throws:** If arguments are not `TinyInventory`.

---

#### `disconnect()`

Disconnects both sender and receiver, preventing transfers.

---

#### `invert()`

Swaps sender and receiver roles.
Useful for bidirectional trading.

---

#### `transferItem(options)`

Transfers an item from sender to receiver.

* **Parameters:**

  * `options` (`TransferItemCfg`) → Transfer configuration.
* **Returns:** `Partial<AddItemResult>` → Remaining quantity that could not be transferred.
* **Throws:**

  * If sender or receiver is not connected.
  * If item does not exist in sender.
  * If `strict` is `true` and the receiver cannot fully fit the item.

---

#### `transferMultiple(items)`

Transfers multiple items at once.

* **Parameters:**

  * `items` (`TransferItemCfg[]`) → Array of transfer configurations.
* **Returns:** `Partial<AddItemResult>[]` → Array of remaining quantities per transfer.

---

✨ With this class, you can safely move items between inventories with flexible rules, slot targeting, strict enforcement, and even batch transfers.
