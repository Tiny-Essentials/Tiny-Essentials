import { TinyClassManager } from '/src/v1/libs/tools/TinyClassManager.mjs';

// ============================================================================
// Mock Data & Plugins
// ============================================================================

/**
 * The foundational core class for our tests.
 */
class EntityCore {
  /**
   * @param {string} id - The unique identifier.
   */
  constructor(id) {
    this.id = id;
  }
}

/**
 * @param {typeof EntityCore} Base
 */
const applyHealth = (Base) =>
  class HealthPlugin extends Base {
    static _tinyDepName = 'Health';
    /** @type {string[]} */
    static _tinyDeps = [];

    /**
     * @param {string} id
     */
    constructor(id) {
      super(id);
      this.hp = 100;
    }
    /**
     * @param {number} amount
     */
    takeDamage(amount) {
      this.hp -= amount;
    }
  };

/**
 * @param {ReturnType<typeof applyHealth>} Base
 */
const applyArmor = (Base) =>
  class ArmorPlugin extends Base {
    static _tinyDepName = 'Armor';
    static _tinyDeps = ['Health'];

    /**
     * @param {string} id
     */
    constructor(id) {
      super(id);
      this.armor = 50;
    }
    /**
     * @param {number} amount
     */
    takeDamage(amount) {
      /**
       * Reduced damage calculated prior to sending it up the super chain.
       */
      const reducedDamage = Math.max(0, amount - this.armor * 0.1);
      super.takeDamage(reducedDamage);
    }
  };

// ============================================================================
// Test Engine
// ============================================================================

/**
 * Creates and appends a test result interface to the DOM.
 * @param {string} title - The description of the test.
 * @param {boolean} passed - Whether the test succeeded.
 * @param {string} logs - The captured log output or error messages.
 * @returns {void}
 */
const renderResult = (title, passed, logs) => {
  /** @type {HTMLElement} */
  const container = document.getElementById('test-results');
  /** @type {HTMLDivElement} */
  const box = document.createElement('div');
  box.className = 'test-box';

  /** @type {string} */
  const statusText = passed ? '✔ PASSED' : '✖ FAILED';
  /** @type {string} */
  const statusClass = passed ? 'status-pass' : 'status-fail';

  box.innerHTML = `
        <div class="test-header">
          <span>${title}</span>
          <span class="${statusClass}">${statusText}</span>
        </div>
        <div class="log-output">${logs}</div>
      `;
  container.appendChild(box);
};

/**
 * Executes a single test case safely and captures assertions.
 * @param {string} title - The name of the test.
 * @param {function(function(boolean, string): void, function(string): void): void} testFn - The function containing the test logic.
 * @returns {void}
 */
const runTest = (title, testFn) => {
  /** @type {string[]} */
  const logs = [];
  let passed = true;

  /**
   * Sub-function to handle custom assertions inside the test.
   * @param {boolean} condition - The condition that must be true.
   * @param {string} message - The message to log if assertion fails.
   * @throws {Error} Throws if the condition is false.
   */
  const assert = (condition, message) => {
    if (!condition) throw new Error(`Assertion Failed: ${message}`);
  };

  try {
    testFn(assert, (/** @type {string} */ msg) => logs.push(`INFO: ${msg}`));
  } catch (/** @type {any} */ error) {
    passed = false;
    logs.push(`ERROR: ${error.message}`);
  }

  renderResult(title, passed, logs.join('\n') || 'No logs generated.');
};

// ============================================================================
// Test Cases
// ============================================================================

runTest('1. Should successfully apply Health and Armor plugins using insert()', (assert, log) => {
  const CoreManager = new TinyClassManager(EntityCore);
  const FinalClass = CoreManager.insert(applyHealth).insert(applyArmor).build();

  const entity = new FinalClass('Hero_1');
  entity.takeDamage(30);

  assert(entity.hp === 75, 'HP should be reduced by 25 (30 - 5 armor mitigation)');
  assert(entity.armor === 50, 'Armor should remain 50');
  log(`Success! Final HP: ${entity.hp}, Final Armor: ${entity.armor}`);
});

runTest('2. Should throw error when missing a dependency', (assert, log) => {
  const CoreManager = new TinyClassManager(EntityCore);

  let caughtError = false;
  try {
    CoreManager.insert(applyArmor); // Fails because Health is not applied
  } catch (err) {
    caughtError = true;
    log(err.message);
  }

  assert(caughtError, 'Manager should have thrown a missing dependency error.');
});

runTest('3. Should throw error when applying duplicate plugins', (assert, log) => {
  const CoreManager = new TinyClassManager(EntityCore);
  const Step1 = CoreManager.insert(applyHealth);

  let caughtError = false;
  try {
    Step1.insert(applyHealth); // Fails because Health is already applied
  } catch (err) {
    caughtError = true;
    log(err.message);
  }

  assert(caughtError, 'Manager should have thrown a duplicate plugin error.');
});

runTest('4. Should block reuse of consumed manager instances', (assert, log) => {
  const CoreManager = new TinyClassManager(EntityCore);
  CoreManager.insert(applyHealth); // Consumes CoreManager

  let caughtError = false;
  try {
    CoreManager.insert(applyHealth); // Try to reuse the old instance
  } catch (err) {
    caughtError = true;
    log(err.message);
  }

  assert(caughtError, 'Manager should prevent reusing a consumed instance.');
});
