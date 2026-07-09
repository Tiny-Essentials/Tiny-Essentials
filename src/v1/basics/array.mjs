// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array

/**
 * Randomly shuffles the elements of an array in place using the Fisher–Yates algorithm.
 *
 * This implementation ensures a uniform distribution of permutations.
 * Original algorithm source: StackOverflow (link above).
 *
 * @template {any[]} T
 * @param {T} items - The array to shuffle.
 * @returns {T} The same array instance, now shuffled in place.
 */
export function shuffleArray(items) {
  if (!Array.isArray(items)) {
    throw new TypeError("Argument 'items' must be an array.");
  }

  let currentIndex = items.length,
    randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [items[currentIndex], items[randomIndex]] = [items[randomIndex], items[currentIndex]];
  }

  return items;
}

/**
 * Generates an array with repeated phases according to counts.
 *
 * @param {any[]} phases - Array of phase names, e.g., ['Full', 'Half1', 'Half2', 'New'].
 * @param {number[]} counts - Array of integers specifying how many times to repeat each phase, e.g., [4,5,5,4].
 * @returns {any[]} - Flattened array containing phases repeated according to counts, concatenated in order.
 */
export function multiplyArrayBlocks(phases, counts) {
  if (!Array.isArray(phases)) {
    throw new TypeError("Argument 'phases' must be an array.");
  }
  if (!Array.isArray(counts)) {
    throw new TypeError("Argument 'counts' must be an array.");
  }

  if (phases.length !== counts.length) {
    throw new RangeError("The 'phases' and 'counts' arrays must have the same length.");
  }

  const result = [];
  for (let i = 0; i < phases.length; i++) {
    if (typeof counts[i] !== 'number' || Number.isNaN(counts[i])) {
      throw new TypeError(`Element at counts[${i}] must be a valid number.`);
    }

    for (let j = 0; j < counts[i]; j++) {
      result.push(phases[i]);
    }
  }
  return result;
}

/**
 * Diff two class lists.
 * @param {any[]} oldItems
 * @param {any[]} newItems
 */
export function diffArrayList(oldItems, newItems) {
  if (!Array.isArray(oldItems)) {
    throw new TypeError("Argument 'oldItems' must be an array.");
  }
  if (!Array.isArray(newItems)) {
    throw new TypeError("Argument 'newItems' must be an array.");
  }

  const removed = oldItems.filter((c) => !newItems.includes(c));
  const added = newItems.filter((c) => !oldItems.includes(c));
  return { added, removed };
}

/**
 * Generates a comparator function to sort an array of objects by a given key.
 *
 * @param {string} item - The object key to sort by.
 * @param {boolean} [isReverse=false] - If `true`, the sorting will be in descending order.
 * @returns {(a: Object<string|number, *>, b: Object<string|number, *>) => number} Comparator function compatible with Array.prototype.sort().
 *
 * @example
 * const arr = [{ pos: 2 }, { pos: 1 }, { pos: 3 }];
 * arr.sort(arraySortPositions('pos')); // Ascending: [{pos: 1}, {pos: 2}, {pos: 3}]
 *
 * @example
 * const arr = [{ pos: 2 }, { pos: 1 }, { pos: 3 }];
 * arr.sort(arraySortPositions('pos', true)); // Descending: [{pos: 3}, {pos: 2}, {pos: 1}]
 */
export function arraySortPositions(item, isReverse = false) {
  if (typeof item !== 'string') {
    throw new TypeError("Argument 'item' must be a string.");
  }
  if (typeof isReverse !== 'boolean') {
    throw new TypeError("Argument 'isReverse' must be a boolean.");
  }

  if (!isReverse) {
    return function (a, b) {
      return a[item] < b[item] ? -1 : a[item] > b[item] ? 1 : 0;
    };
  } else {
    return function (a, b) {
      return a[item] > b[item] ? -1 : a[item] < b[item] ? 1 : 0;
    };
  }
}
