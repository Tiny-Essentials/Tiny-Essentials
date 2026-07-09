# 🛠️ TinyClassManager

Welcome to **TinyClassManager**! This is a lightweight, linear mixin manager designed to compose base classes with optional modules (like features or "DLCs") in a safe, predictable, and sequential way. It handles dependencies and prevents multiple class reuses automatically.

---

## 🚀 Key Features

* **🔒 Immutable Chain State:** Each `.insert()` call consumes the previous manager, preventing unwanted side effects or weird mutations.
* **🧩 Dependency Verification:** Automatically ensures that a required plugin is loaded before the dependent plugin is applied.
* **🛑 Conflict Protection:** Prevents you from installing the exact same plugin twice on the same class chain.
* **⚡ Clean Architecture:** Uses static class properties to manage metadata, keeping your plugin functions pure and direct.

---

## 📐 API Overview

### `TinyClassManager<T>`

#### Properties

* **`appliedPlugins`** (`string[]`): Returns an array of the names of all successfully installed plugins so far.
* **`size`** (`number`): The total count of applied plugins plus the core base class.
* **`currentClass`** (`T`): Accesses the current state of the class chain inside the manager.
* **`used`** (`boolean`): Indicates whether this specific manager instance has already been transitioned or finalized.

#### Methods

* **`constructor(coreClass)`**: Initializes the manager with your foundational core class.
* **`insert(applyFn)`**: Applies a new plugin to the chain by passing a function that returns the extended class. The returned class **must** define a `static _tinyDepName` string, and can optionally define a `static _tinyDeps` array of strings. Returns a *new* `TinyClassManager` instance.
* **`use(plugin)`**: *[Deprecated]* Legacy method for applying plugins using a definition object. Use `insert` instead.
* **`build()`**: Finalizes the composition chain, marks the instance as consumed, and returns the fully compiled class ready for instantiation.

---

## 📖 Detailed Usage Guide & Step-by-Step Example

Let's break down exactly how to design, extend, and instantiate a class structure using `TinyClassManager`. You can mirror this step-by-step blueprint for your own features!

### Step 1: Establish the Core Base 🧱

Every structure needs a solid foundation. The core class is the absolute minimum requirement and contains properties that every subsequent plugin might rely on.

```javascript
import TinyClassManager from 'tiny-essentials/libs/TinyClassManager';

// The foundational class
class EntityCore {
  /**
   * @param {string} id
   */
  constructor(id) {
    /** @type {string} */
    this.id = id;
  }
}

```

### Step 2: Create an Independent Module 🏷️

Now, let's create our first module. A plugin is a function that receives the base class and returns an extended version of it. We use static properties (`_tinyDepName` and `_tinyDeps`) to tell the manager what this plugin is and what it needs. This module doesn't depend on anything else, so its dependencies array is empty.

```javascript
/**
 * @param {typeof EntityCore} Base - The incoming base class to extend.
 */
const applyHealth = (Base) =>
  class HealthModule extends Base {
    static _tinyDepName = 'Health';
    /** @type {string[]} */
    static _tinyDeps = []; // Works fine straight out of the box with the Core

    /**
     * @param {string} id
     */
    constructor(id) {
      super(id); // Always remember to pass arguments down!
      
      /** @type {number} */
      this.hp = 100;
    }

    /**
     * Deducts health from the entity.
     * @param {number} amount - The amount of raw damage to deal.
     */
    takeDamage(amount) {
      this.hp -= amount;
      console.log(`Took ${amount} damage. HP left: ${this.hp}`);
    }
  };

```

### Step 3: Create a Dependent Module 🛡️

Here is where the magic happens! The `Armor` module strictly requires the `Health` module to be loaded first because it relies on overriding the `takeDamage` logic. We enforce this relationship inside the `static _tinyDeps` array.

```javascript
/**
 * @param {ReturnType<typeof applyHealth>} Base - The class containing Health features.
 */
const applyArmor = (Base) =>
  class ArmorModule extends Base {
    static _tinyDepName = 'Armor';
    static _tinyDeps = ['Health']; // Strictly requires the "Health" module!

    /**
     * @param {string} id
     */
    constructor(id) {
      super(id);
      
      /** @type {number} */
      this.armor = 50;
    }

    /**
     * Deducts health, factoring in damage mitigation provided by armor.
     * @param {number} amount - The initial damage before armor reduction.
     */
    takeDamage(amount) {
      // Mitigates damage using the armor stat
      const reducedDamage = Math.max(0, amount - this.armor * 0.1);
      
      // Pass the mitigated damage up to the Health layer
      super.takeDamage(reducedDamage);
    }
  };

```

### Step 4: Chain and Build Your Custom Class 🏗️

Finally, use the manager to safely piece your modules together. Remember that `TinyClassManager` uses an explosive state pattern: once you run `.insert()` or `.build()`, that specific instance is closed, forcing you to use the new returned chain instance.

```javascript
try {
  // 1. Wrap your core class
  const CoreTest = new TinyClassManager(EntityCore);
  
  // 2. Chain your modules and compile!
  // If you try to swap the order (.insert(applyArmor).insert(applyHealth)), it will throw an explicit dependency error.
  const FullyArmoredEntity = CoreTest.insert(applyHealth).insert(applyArmor).build();

  // 3. Create your custom instance!
  const myEntity = new FullyArmoredEntity('Player_1');
  
  // 4. Test out the behaviors
  myEntity.takeDamage(30); 
  // Output: "Took 25 damage. HP left: 75" (30 damage - 5 armor reduction = 25 damage)
  
  console.log(`Armor value: ${myEntity.armor}`); // Output: Armor value: 50
  console.log(`Current HP: ${myEntity.hp}`);     // Output: Current HP: 75
  
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  }
}

```

---

## 💡 How to Mimic This Pattern

When you want to build a new set of mechanics for your game or application using this architecture, always remember to follow this loop:

1. **Define your Base State**: Keep it clean and focused on global data configurations.
2. **Declare Plugins as Functions**: Create a function that accepts a `Base` class and returns an extended class. Equip it with `static _tinyDepName` (string) and `static _tinyDeps` (array of strings).
3. **Use `super` Inheritances**: Inside your plugin classes, always call `super(...)` in constructors and use `super.methodName(...)` if you are overriding an existing skill or function to allow all mixed behaviors to fire smoothly down the pipeline!
