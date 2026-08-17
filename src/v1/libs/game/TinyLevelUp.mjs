/**
 * Represents a user object used.
 *
 * @typedef {Object} UserEditor
 * @property {number} exp - Current experience points of the user.
 * @property {number} level - Current level of the user.
 * @property {number} totalExp - Total accumulated experience.
 */

/**
 * Class to manage user level-up logic based on experience points.
 */
class TinyLevelUp {
  /**
   * Constructor
   * @param {number} giveExp - Base experience value for random experience generation.
   * @param {number} expLevel - Base experience needed to level up (per level).
   */
  constructor(giveExp, expLevel) {
    if (typeof giveExp !== 'number' || Number.isNaN(giveExp))
      throw new Error('giveExp must be a valid number');
    if (typeof expLevel !== 'number' || Number.isNaN(expLevel))
      throw new Error('expLevel must be a valid number');
    this.giveExp = giveExp;
    this.expLevel = expLevel;
  }

  /**
   * Creates a new user object starting at level 0 with 0 experience.
   * @returns {UserEditor} A fresh user object.
   */
  createUser() {
    return {
      exp: 0,
      level: 1,
      totalExp: 0,
    };
  }

  /**
   * Validates if the given user object has valid numeric properties.
   * Throws an error if any property is invalid.
   *
   * @param {UserEditor} user - The user object to validate.
   * @throws {Error} If any property (exp, level, totalExp) is not a valid number.
   */
  validateUser(user) {
    if (typeof user.exp !== 'number' || Number.isNaN(user.exp))
      throw new Error('exp must be a valid number');
    if (typeof user.level !== 'number' || Number.isNaN(user.level))
      throw new Error('level must be a valid number');
    if (user.level < 1) throw new Error('level must be at least 1');
    if (typeof user.totalExp !== 'number' || Number.isNaN(user.totalExp))
      throw new Error('totalExp must be a valid number');
  }

  /**
   * Checks if the given user object is valid by verifying its numeric properties.
   *
   * @param {UserEditor} user - The user object to check.
   * @returns {boolean} `true` if all properties (exp, level, totalExp) are valid numbers; otherwise `false`.
   */
  isValidUser(user) {
    if (typeof user.exp !== 'number' || Number.isNaN(user.exp)) return false;
    if (typeof user.level !== 'number' || Number.isNaN(user.level)) return false;
    if (user.level < 1) return false;
    if (typeof user.totalExp !== 'number' || Number.isNaN(user.totalExp)) return false;
    return true;
  }

  /**
   * Returns the base experience value used for random experience generation.
   * Throws an error if the internal giveExp value is not a valid number.
   *
   * @returns {number} The base experience value.
   * @throws {Error} If giveExp is not a valid number.
   */
  getGiveExpBase() {
    if (typeof this.giveExp !== 'number' || Number.isNaN(this.giveExp))
      throw new Error('giveExp must be a valid number');
    return this.giveExp;
  }

  /**
   * Returns the base experience required to level up.
   * Throws an error if the internal expLevel value is not a valid number.
   *
   * @returns {number} The base experience needed per level.
   * @throws {Error} If expLevel is not a valid number.
   */
  getExpLevelBase() {
    if (typeof this.expLevel !== 'number' || Number.isNaN(this.expLevel))
      throw new Error('expLevel must be a valid number');
    return this.expLevel;
  }

  /**
   * Validates and adjusts the user's level based on their current experience.
   * @param {UserEditor} user - The user object containing experience and level properties.
   * @returns {UserEditor} The updated user object.
   * @throws {Error} If any property (exp, level, totalExp) is not a valid number.
   */
  expValidator(user) {
    const expLevel = this.getExpLevelBase();
    this.validateUser(user);

    let extraValue = 0;
    const nextLevelExp = expLevel * user.level;

    // Level Up
    if (user.exp >= nextLevelExp) {
      user.level++;
      extraValue = user.exp - nextLevelExp;
      user.exp = 0;

      if (extraValue > 0) return this.give(user, extraValue, 'extra');
    }

    // Level Down
    if (user.exp < 1 && user.level > 1) {
      user.level--;
      extraValue = Math.abs(user.exp);
      user.exp = expLevel * user.level;

      if (extraValue > 0) return this.remove(user, extraValue, 'extra');
    }

    return user;
  }

  /**
   * Calculates the total experience based on the user's level.
   * @param {UserEditor} user - The user object containing experience and level properties.
   * @returns {number} The total experience of the user.
   * @throws {Error} If any property (exp, level, totalExp) is not a valid number.
   */
  getTotalExp(user) {
    this.validateUser(user);
    let totalExp = 0;
    for (let p = 1; p <= user.level; p++) totalExp += this.getExpLevelBase() * p;
    totalExp += user.exp;
    return totalExp;
  }

  /**
   * Generates random experience points based on the configured multiplier.
   * @param {number} [multi] - A multiplier for the generated experience.
   * @returns {number} The generated experience points.
   */
  expGenerator(multi = 1) {
    if (typeof multi !== 'number' || Number.isNaN(multi))
      throw new Error('multi must be a valid number');
    return Math.floor(Math.random() * this.getGiveExpBase()) * multi;
  }

  /**
   * Calculates how much experience is missing to next level.
   * @param {UserEditor} user
   * @returns {number}
   * @throws {Error} If any property (exp, level, totalExp) is not a valid number.
   */
  getMissingExp(user) {
    return this.getProgress(user) - user.exp;
  }

  /**
   * Gets the experience points required to reach the next level.
   * @param {UserEditor} user - The user object containing the level.
   * @returns {number} The experience required for the next level.
   * @throws {Error} If any property (exp, level, totalExp) is not a valid number.
   */
  progress(user) {
    return this.getProgress(user);
  }

  /**
   * Gets the experience points required to reach the next level.
   * @param {UserEditor} user - The user object containing the level.
   * @returns {number} The experience required for the next level.
   * @throws {Error} If any property (exp, level, totalExp) is not a valid number.
   */
  getProgress(user) {
    this.validateUser(user);
    return this.getExpLevelBase() * user.level;
  }

  /**
   * Sets the experience value for the user, adjusting their level if necessary.
   * @param {UserEditor} user - The user object.
   * @param {number} value - The new experience value to set.
   * @returns {UserEditor} The updated user object.
   */
  set(user, value) {
    if (typeof value !== 'number' || Number.isNaN(value))
      throw new Error('value must be a valid number');

    user.exp = value;
    this.expValidator(user);
    user.totalExp = this.getTotalExp(user);
    return user;
  }

  /**
   * Adds experience to the user, adjusting their level if necessary.
   * @param {UserEditor} user - The user object.
   * @param {number} [extraExp] - Additional experience to be added.
   * @param {'add' | 'extra'} [type] - Type of addition ('add' or 'extra').
   * @param {number} [multi] - Multiplier for experience generation.
   * @returns {UserEditor} The updated user object.
   */
  give(user, extraExp = 0, type = 'add', multi = 1) {
    if (typeof multi !== 'number' || Number.isNaN(multi))
      throw new Error('multi must be a valid number');
    if (typeof extraExp !== 'number' || Number.isNaN(extraExp))
      throw new Error('extraExp must be a valid number');
    if (typeof type !== 'string') throw new Error('type must be a valid string');

    if (type === 'add') user.exp += this.expGenerator(multi) + extraExp;
    else if (type === 'extra') user.exp += extraExp;

    this.expValidator(user);
    user.totalExp = this.getTotalExp(user);
    return user;
  }

  /**
   * Removes experience from the user, adjusting their level if necessary.
   * @param {UserEditor} user - The user object.
   * @param {number} [extraExp] - Additional experience to remove.
   * @param {'add' | 'extra'} [type] - Type of removal ('add' or 'extra').
   * @param {number} [multi] - Multiplier for experience generation.
   * @returns {UserEditor} The updated user object.
   */
  remove(user, extraExp = 0, type = 'add', multi = 1) {
    if (typeof multi !== 'number' || Number.isNaN(multi))
      throw new Error('multi must be a valid number');
    if (typeof extraExp !== 'number' || Number.isNaN(extraExp))
      throw new Error('extraExp must be a valid number');
    if (typeof type !== 'string') throw new Error('type must be a valid string');

    if (type === 'add') user.exp -= this.expGenerator(multi) + extraExp;
    else if (type === 'extra') user.exp -= extraExp;

    this.expValidator(user);
    user.totalExp = this.getTotalExp(user);
    return user;
  }
}

export default TinyLevelUp;
