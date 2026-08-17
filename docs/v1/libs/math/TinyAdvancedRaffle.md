# 🎯 TinyAdvancedRaffle

**TinyAdvancedRaffle** is an advanced, event-driven raffle system designed for complex probability-based selections.
It goes beyond simple random draws by offering **weighted probabilities**, **normalization modes**, **pity mechanics**, **temporary modifiers**, and **seedable randomness** for reproducible outcomes.

With **import/export in JSON format**, **group-based filtering**, and **exclusion lists**, it’s ideal for games, loot systems, prize distributions, and any scenario requiring **balanced yet configurable randomness**.

✨ **Key Features**

* 📊 **Weighted items** — Assign different probabilities to each item.
* 🧮 **Normalization modes** — Choose between *relative* and *softmax*.
* 🎯 **Pity system** — Guarantee fairness over multiple draws.
* 🔄 **Temporary modifiers** — Adjust weights dynamically for limited draws.
* 🗂️ **Group filtering** — Include or exclude items by groups.
* 🔐 **Item exclusions** — Prevent specific items from being drawn.
* 📦 **Import/export in JSON** — Save and restore raffle states easily.
* ⏳ **Seedable RNG** — Ensure deterministic and repeatable results.
* 📡 **Event-driven** — Hook into lifecycle events for customization.

---

## 🎯 Type Definitions & Core Concepts

This section defines the **core data structures**, **callbacks**, and **types** used by the `TinyAdvancedRaffle` system.

---

### 📊 Normalization Modes

```ts
type Normalization = 'relative' | 'softmax';
```

Defines the available normalization strategies for **probability weight calculations**:

* **`relative`** – Direct proportion based on item weights.
* **`softmax`** – Applies a softmax transformation for a probability distribution with exponential scaling.

---

### 🎲 RNG Generator

```ts
type RngGenerator = () => number;
```

A callback that generates a pseudo-random number between `0` (inclusive) and `1` (exclusive).

---

### ⏳ Temporary Weight Modifier

```ts
type TempModifier = {
  fn: WeightsCallback;
  uses: number;
};
```

Represents a **temporary weight modifier** that is applied for a **limited number of draws**.

* **`fn`** – Function that modifies the item weights.
* **`uses`** – Number of draws before the modifier is removed.

---

### 📦 Item Data Template

```ts
type ItemDataTemplate<TGroups extends Set<string> | string[]> = {
  id: string;
  label: string;
  baseWeight: number;
  groups: TGroups;
  locked: boolean;
  meta: ItemMetadata;
};
```

Represents the **core data structure** for an item in the raffle system.

| Property     | Type                        | Description                               |
| ------------ | --------------------------- | ----------------------------------------- |
| `id`         | `string`                    | Unique identifier for the item.           |
| `label`      | `string`                    | Human-readable name for the item.         |
| `baseWeight` | `number`                    | Base probability weight before modifiers. |
| `groups`     | `Set<string>` or `string[]` | Groups the item belongs to.               |
| `locked`     | `boolean`                   | Whether the item is excluded from draws.  |
| `meta`       | `ItemMetadata`              | Arbitrary metadata.                       |

---

### 💾 Exported Raffle State

```ts
type ExportedJson = {
  items: ItemDataGetter[];
  pity: [string, Pity][];
  exclusions: string[];
  normalization: Normalization;
  seed: number | null;
};
```

Represents the **serialized state** of the raffle system for export or persistence.

---

### 🏷 Specialized Item Types

* **`ItemData`** – Item where `groups` is a `Set<string>`.
* **`ItemDataGetter`** – Item where `groups` is a `string[]`.

---

### 🗃 Metadata Container

```ts
type ItemMetadata = Record<string | number | symbol, any>;
```

Arbitrary key-value container for **extra item information**.

---

### 🛠 Weight Calculation Context

```ts
type ComputeEffectiveWeightsContext = {
  metadata?: ItemMetadata;
  previousDraws?: DrawOne[];
};
```

Provides **context** to weight modification functions during a draw.

---

### ⚖ Weight Map

```ts
type Weights = Map<string, number>;
```

Maps **item IDs** to their computed **effective weight**.

---

### 🎯 Pity System

```ts
type Pity = {
  threshold: number;
  increment: number;
  cap: number;
  counter: number;
  currentAdd: number;
};
```

Defines **pity mechanics** for guaranteeing item selection after repeated failures.

---

### 🧮 Weight Modifier Callback

```ts
type WeightsCallback = (
  weights: Weights,
  context: ComputeEffectiveWeightsContext
) => Weights | null;
```

A function that modifies or overrides computed weights **before** a draw.

---

### 🎟 Draw Result

```ts
type DrawOne = {
  id: string;
  label: string;
  meta: ItemMetadata;
  prob: number;
};
```

Represents the **result** of a single draw.

---

### 📡 Event Handler

```ts
type handler = (payload: any, event: any) => void;
```

Generic event handler for message or signal reception.

---

## 🎰 Core Properties, Getters & Setters

This section covers the **private fields**, **public getters/setters**, and **constructor** of the `TinyAdvancedRaffle` class.

---

### 🔒 Private Fields

* **`#normalization`**: *(Normalization)* — Defines the strategy for scaling probabilities before a draw.

  * Options: `'relative'` or `'softmax'`.

* **`#seed`**: *(number | null)* — RNG seed for deterministic results. If `null`, draws are fully random.

* **`#globalModifiers`**: *(WeightsCallback\[])* — Persistent weight-modifying functions applied to **every** draw.

* **`#temporaryModifiers`**: *(TempModifier\[])* — Temporary weight modifiers that expire after a set number of draws.

* **`#conditionalRules`**: *(WeightsCallback\[])* — Dynamic rules adjusting weights based on the raffle state.

* **`#pitySystems`**: *(Map\<string, Pity>)* — "Pity" mechanisms to increase chances after repeated failures.

* **`#exclusions`**: *(Set\<string>)* — Item IDs that cannot be drawn.

* **`#groups`**: *(Map\<string, Set\<string>>)* — Named groups containing sets of item IDs.

* **`#rng`**: *(RngGenerator)* — The random number generator used in draws.

* **`#items`**: *(Map\<string, ItemData>)* — All raffle items and their associated data.

* **`#freq`**: *(Map\<string, number>)* — Tracks how many times each item has been drawn.

---

### 📤 Public Getters

| Getter               | Returns                          | Description                                      |
| -------------------- | -------------------------------- | ------------------------------------------------ |
| `freq`               | `Record<string, number>`         | Draw frequency as a plain object.                |
| `size`               | `number`                         | Total number of registered items.                |
| `normalization`      | `Normalization`                  | Current probability scaling method.              |
| `seed`               | `number \| null`                 | RNG seed (if any).                               |
| `globalModifiers`    | `WeightsCallback[]`              | Copy of persistent modifiers.                    |
| `temporaryModifiers` | `TempModifier[]`                 | Copy of temporary modifiers with usage counts.   |
| `conditionalRules`   | `WeightsCallback[]`              | Copy of conditional rules.                       |
| `pitySystems`        | `Record<string, Pity>`           | Copy of all pity configurations.                 |
| `exclusions`         | `string[]`                       | List of excluded item IDs.                       |
| `groups`             | `Record<string, string[]>`       | Copy of group definitions.                       |
| `rng`                | `RngGenerator`                   | RNG function used for draws.                     |
| `items`              | `Record<string, ItemDataGetter>` | Copy of all item definitions (groups as arrays). |

---

### 📝 Public Setters

Each setter **validates input types** and throws `TypeError` for invalid data.

* **`normalization`** — Must be a non-empty string: `'relative'` or `'softmax'`.
* **`seed`** — Must be a finite number or `null`; reseeds RNG when changed.
* **`globalModifiers`** — Must be an array of functions.
* **`temporaryModifiers`** — Must be an array of `{ fn: function, uses: positive integer }`.
* **`conditionalRules`** — Must be an array of functions.
* **`pitySystems`** — Must be a `Map<string, Pity>` with all numeric fields.
* **`exclusions`** — Must be a `Set<string>`.
* **`groups`** — Must be a `Map<string, Set<string>>` where all values are strings.
* **`rng`** — Must be a function returning a number in `[0, 1)`.
* **`items`** — Must be a `Map<string, ItemData>`; **clears old list before setting**.

---

### 🏗 Constructor

This section sets up all **core data structures** and provides strict **input validation** to keep the raffle system’s state consistent. 🎯

**Parameters**:

* `opts.rng` *(RngGenerator | null)* — Custom RNG function. Defaults to `Math.random` if no seed is provided.
* `opts.seed` *(number | null)* — RNG seed for reproducible results.
* `opts.normalization` *(Normalization)* — Probability scaling mode (`'relative'` by default).

---

## 🎯 Item Management & Rules

### 📦 Item Management

#### `hasItem(itemId)`

Check if an item exists in the system.

* **Parameters:**

  * `itemId` *(string)* — The ID of the item to check.
* **Returns:** `boolean` — `true` if the item exists, otherwise `false`.
* **Throws:** `TypeError` if `itemId` is not a string.

---

#### `addItem(id, opts = {})`

Add or update an item in the raffle.

* **Parameters:**

  * `id` *(string)* — Unique item identifier.
  * `opts` *(object, optional)* — Item configuration:

    * `weight` *(number, default=1)* — Base relative weight (≥ 0).
    * `label` *(string)* — Human-readable label.
    * `meta` *(object)* — Arbitrary metadata.
    * `groups` *(string\[] | Set<string>)* — Groups this item belongs to.
* **Returns:** `ItemData` — The created or updated item.
* **Throws:** `TypeError` for invalid types.

---

#### `removeItem(id)`

Remove an item from the system.

* **Parameters:**

  * `id` *(string)* — Item ID to remove.
* **Returns:** `boolean` — `true` if removed, `false` if it didn’t exist.
* **Throws:** `TypeError` if `id` is not a string.

---

#### `setBaseWeight(id, weight)`

Update the base weight of an existing item.

* **Parameters:**

  * `id` *(string)* — Item ID.
  * `weight` *(number)* — New base weight (≥ 0).
* **Throws:**

  * `Error` if the item is not found.
  * `TypeError` for invalid parameters.

---

#### `getItem(id)`

Retrieve an item by ID.

* **Parameters:**

  * `id` *(string)* — Item ID.
* **Returns:** `ItemData | null` — Item data or `null` if not found.
* **Throws:** `TypeError` if `id` is not a string.

---

#### `listItems()`

List all items in the system.

* **Returns:** `ItemData[]` — Array of cloned item objects.

---

#### `clearList()`

Remove all items, frequencies, and pity systems.

---

### 🛠 Modifiers & Rules

#### Global Modifiers

Modifiers applied **persistently** to all draws.

* **`hasGlobalModifier(fn)`** — Check if a global modifier exists.
* **`addGlobalModifier(fn)`** — Add a persistent modifier.
* **`removeGlobalModifier(fn)`** — Remove a specific global modifier.

---

#### Temporary Modifiers

Modifiers applied only for a **limited number of draws**.

* **`hasTemporaryModifier(fn)`** — Check if it exists.
* **`addTemporaryModifier(fn, uses = 1)`** — Add a modifier for `uses` draws.
* **`removeTemporaryModifier(fn)`** — Remove it.

---

#### Conditional Rules

Rules applied dynamically during each draw.

* **`hasConditionalRule(ruleFn)`** — Check if it exists.
* **`addConditionalRule(ruleFn)`** — Add a conditional rule.
* **`removeConditionalRule(ruleFn)`** — Remove a conditional rule.

---

### 🍀 Pity System

The **pity system** increases the chance of an item appearing if it hasn’t been drawn after a certain number of tries.

* **`hasPity(itemId)`** — Check if pity exists for an item.
* **`configurePity(itemId, cfg)`** — Configure pity with:

  * `threshold` *(number)* — Number of failed draws before increasing weight.
  * `increment` *(number)* — Weight added each draw after threshold.
  * `cap` *(number, default=Infinity)* — Max extra weight.
* **`resetPity(itemId)`** — Reset pity counters.
* **`clearPities()`** — Remove all pity configurations.

---

### 🚫 Exclusions & Groups

#### Exclusions

* **`hasExclusion(itemId)`** — Check if excluded.
* **`excludeItem(itemId)`** — Exclude from raffle.
* **`includeItem(itemId)`** — Re-include in raffle.

#### Groups

* **`_ensureGroup(name)`** *(private)* — Create or get a group.
* **`hasInGroup(itemId, groupName)`** — Check group membership.
* **`addToGroup(itemId, groupName)`** — Add item to a group.
* **`removeFromGroup(itemId, groupName)`** — Remove item from a group.

---

## 🎲 Draw Core

### 🔄 Frequency Management

#### `clearFreqs()`

Clear the draw frequency count for **all** items.
Effectively resets the internal frequency tracking map to an empty state.

---

#### `resetFreq(itemId)`

Reset the draw frequency for a **specific item**.

* **Parameters:**

  * `itemId` *(string)* — Unique identifier of the item.
* **Throws:**

  * `TypeError` if `itemId` is not a string.

---

### ⚖️ Weight Computation

#### `computeEffectiveWeights(context = {})`

Compute the **effective weights** of all items after applying:

1. Base weights
2. Global modifiers
3. Temporary modifiers
4. Conditional rules
5. Pity system adjustments
6. Exclusions
7. Removal of zero or negative weights

* **Parameters:**

  * `context` *(object, optional)* — Includes:

    * `previousDraws` *(array)* — List of past draws.
    * `metadata` *(object)* — Arbitrary metadata for rules.
* **Returns:** `Map<string, number>` — Map of item ID → effective weight.
* **Throws:**

  * `TypeError` for invalid `context` format or property types.

---

#### `_weightsToDistribution(weights)`

Convert a **weights map** into a normalized **probability distribution array**.

* **Parameters:**

  * `weights` *(Map\<string, number>)* — Item IDs and their weights.
* **Returns:**
  An array of objects:

  ```ts
  {
    id: string,          // item ID
    weight: number,      // weight value
    p: number,           // normalized probability
    cumulative: number   // cumulative probability for sampling
  }
  ```
* **Throws:**

  * `TypeError` if `weights` is not a Map.
  * `TypeError` for invalid key or value types.
* **Notes:**

  * Supports **`softmax`** or **relative normalization**.

---

### 🎯 Drawing Items

#### `drawOne(opts = {})`

Draw **one item** from the raffle considering all configurations, rules, and pity effects.

* **Parameters:**

  * `opts` *(object, optional)*:

    * `previousDraws` *(array)* — Draw history for context.
    * `metadata` *(object)* — Metadata for conditional rules.
* **Returns:**
  An object:

  ```ts
  {
    id: string,         // item ID
    label: string,      // display label
    meta: object,       // cloned metadata
    prob: number        // probability at time of draw
  }
  ```

  Or `null` if no items are available.
* **Throws:** `TypeError` for invalid option types.
* **Effects:**

  * Updates **pity counters**.
  * Consumes **temporary modifiers**.
  * Increments **frequency counts**.
  * Emits a **`draw`** event.

---

#### `_consumeTemporaryModifiers()` *(private)*

Decrements usage counts of **temporary modifiers** and removes them when their uses reach zero.

---

#### `drawMany(count = 1, opts = {})`

Draw multiple items in one operation.

* **Parameters:**

  * `count` *(integer > 0)* — Number of items to draw.
  * `opts` *(object, optional)*:

    * `metadata` *(object)* — Metadata for rules.
    * `withReplacement` *(boolean, default = true)* — Allow duplicates.
    * `ensureUnique` *(boolean, default = false)* — Attempt to ensure unique results.
    * `previousDraws` *(array)* — History for context.
* **Returns:** `DrawOne[]` — List of drawn items.
* **Throws:**

  * `TypeError` for invalid `count` or option types.
* **Behavior Notes:**

  * **`withReplacement = false` & `ensureUnique = true`** → Items are temporarily excluded during the draw session.
  * **`withReplacement = false`** (without `ensureUnique`) → Items are excluded only for the session, then re-included.

---

### 📦 Save & Load (JSON)

#### 📤 `exportToJson()`

Exports the current configuration into a **JSON-serializable object**, capturing:

* **Items** (ID, label, base weight, metadata, groups)
* **Pity systems**
* **Exclusions**
* **Normalization mode**
* **Seed value**

This method is ideal for saving and restoring the raffle configuration between sessions.

**Returns**

* `ExportedJson` — An object containing the complete configuration.

---

#### 📥 `loadFromJson(data)`

Loads configuration data previously generated by [`exportToJson()`](#-exporttojson).

**Behavior**

* Clears all existing items and state.
* Validates all input fields for type safety and constraints.
* Reconstructs items, pity systems, exclusions, and normalization settings.
* Restores the seed value if provided.

**Parameters**

* `data` (`ExportedJson`) — The configuration to load.

**Throws**

* `TypeError` if `data` is missing required properties or contains invalid values.

---

### 🪞 `clone()`

Creates a **deep clone** of the current raffle instance.

**Features**

* Fully duplicates all internal **Maps**, **Sets**, and **Arrays** to prevent shared references.
* Functions (e.g., callbacks) are **copied by reference** since they are immutable.
* The clone is entirely **independent** from the original instance.

**Returns**

* `TinyAdvancedRaffle` — A new cloned instance with identical state.

---

### 🎲 RNG: Seedable (mulberry32)

#### 🔢 `_makeSeededRng(seed)`

Creates a **deterministic pseudo-random number generator (PRNG)** using the **mulberry32** algorithm.

**Parameters**

* `seed` (`number`) — An integer used to seed the PRNG.

**Returns**

* `RngGenerator` — A function that returns a pseudo-random number in the range `[0, 1)`.

**Throws**

* `TypeError` if `seed` is not a finite number.

---

## 🗑️ `destroy()`

Completely **wipes** all internal data, breaks all references, and renders the raffle instance permanently unusable.
After calling this method, **any further calls** to its functions will throw an error.

**Use Cases**

* Freeing memory in long-running applications.
* Preventing accidental reuse after the raffle is no longer needed.
* Security-sensitive scenarios where sensitive item data must be fully erased.

**Example**

```js
const raffle = new TinyAdvancedRaffle();
raffle.destroy();
raffle.clone(); // ❌ Throws an error: instance has been destroyed
```
