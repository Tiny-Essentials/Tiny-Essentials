import TinyClassManager from '../TinyClassManager.mjs';

// ============================================================================
// Example & Usage Context
// ============================================================================

// 1. The Core Class (The foundation)
class EntityCore {
  /** @param {string} id */
  constructor(id) {
    this.id = id;
  }
}

// 2. Creating Dependent DLCs
/** @param {typeof EntityCore} Base */
const applyHealth = (Base) =>
  class HealthModule extends Base {
    static _tinyDepName = 'Health';
    /** @type {string[]} */
    static _tinyDeps = []; // No dependencies, works just with the Core

    /** @param {string} id */
    constructor(id) {
      super(id);
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

// 3. Creating Independent DLCs
/** @param {ReturnType<typeof applyHealth>} Base */
const applyArmor = (Base) =>
  class ArmorModule extends Base {
    static _tinyDepName = 'Armor';
    static _tinyDeps = ['Health']; // Strictly requires the Health module to be installed first

    /** @param {string} id */
    constructor(id) {
      super(id);
      this.armor = 50;
    }

    /**
     * Deducts health, factoring in damage mitigation provided by armor.
     * @param {number} amount - The initial damage before armor reduction.
     */
    takeDamage(amount) {
      /**
       * Calculated damage after armor mitigation is applied, ensuring it never drops below 0.
       */
      const reducedDamage = Math.max(0, amount - this.armor * 0.1);
      super.takeDamage(reducedDamage);
    }
  };

// 4. Building the final class
try {
  const CoreTest = new TinyClassManager(EntityCore);
  const FullyArmoredEntity = CoreTest.insert(applyHealth).insert(applyArmor).build();

  const myEntity = new FullyArmoredEntity('Player_1');
  myEntity.takeDamage(30);
  console.log(`Armor value: ${myEntity.armor}`);
  console.log(`Current HP: ${myEntity.hp}`);
} catch (error) {
  if (error instanceof Error) console.error(error.message);
}
