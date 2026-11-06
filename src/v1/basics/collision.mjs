/**
 * A direction relative to a rectangle.
 *
 * Represents one of the four cardinal directions from the perspective of the element.
 *
 * @typedef {'top' | 'bottom' | 'left' | 'right'} Dirs
 */

/**
 * Represents all directional aspects of a collision.
 *
 * @typedef {Object} CollDirs
 * @property {Dirs | 'center' | null} in - The dominant direction of entry. `'center'` if all sides are equally overlapped. `null` if no collision.
 * @property {Dirs | null} x - The horizontal direction (`'left'` or `'right'`) the collision is biased toward, or `null`.
 * @property {Dirs | null} y - The vertical direction (`'top'` or `'bottom'`) the collision is biased toward, or `null`.
 */

/**
 * Indicates if a collision is in the negative direction (rect2 is outside rect1).
 *
 * @typedef {Object} NegCollDirs
 * @property {Dirs | null} x - Horizontal direction of negative overlap, if any.
 * @property {Dirs | null} y - Vertical direction of negative overlap, if any.
 */

/**
 * Collision depth values from each side of rect2 inside rect1.
 *
 * Positive values indicate penetration; negative values indicate gaps.
 *
 * @typedef {Object} CollData
 * @property {number} top - Depth from rect2's top into rect1.
 * @property {number} bottom - Depth from rect2's bottom into rect1.
 * @property {number} left - Depth from rect2's left into rect1.
 * @property {number} right - Depth from rect2's right into rect1.
 */

/**
 * X and Y offset representing center difference between two rectangles.
 *
 * Useful to measure how far one element's center is from another.
 *
 * @typedef {Object} CollCenter
 * @property {number} x - Horizontal distance in pixels from rect1's center to rect2's center.
 * @property {number} y - Vertical distance in pixels from rect1's center to rect2's center.
 */

/**
 * Represents a rectangular area in absolute pixel values.
 *
 * Similar to `DOMRect`, this object describes the dimensions and position of a box
 * in the 2D plane, typically representing an element's bounding box.
 *
 * @typedef {Object} ObjRect
 * @property {number} height - The total height of the rectangle in pixels.
 * @property {number} width - The total width of the rectangle in pixels.
 * @property {number} top - The Y-coordinate of the top edge of the rectangle.
 * @property {number} bottom - The Y-coordinate of the bottom edge of the rectangle.
 * @property {number} left - The X-coordinate of the left edge of the rectangle.
 * @property {number} right - The X-coordinate of the right edge of the rectangle.
 */

// Normal collision checks (loose overlap detection)

/**
 * Checks if rect1 is completely above rect2 (no vertical overlap).
 *
 * @param {ObjRect} rect1 - The bounding rectangle of the first element.
 * @param {ObjRect} rect2 - The bounding rectangle of the second element.
 * @returns {boolean} True if rect1 is entirely above rect2.
 */
export const areElsCollTop = (rect1, rect2) => rect1.bottom < rect2.top;

/**
 * Checks if rect1 is completely below rect2 (no vertical overlap).
 *
 * @param {ObjRect} rect1
 * @param {ObjRect} rect2
 * @returns {boolean} True if rect1 is entirely below rect2.
 */
export const areElsCollBottom = (rect1, rect2) => rect1.top > rect2.bottom;

/**
 * Checks if rect1 is completely to the left of rect2 (no horizontal overlap).
 *
 * @param {ObjRect} rect1
 * @param {ObjRect} rect2
 * @returns {boolean} True if rect1 is entirely to the left of rect2.
 */
export const areElsCollLeft = (rect1, rect2) => rect1.right < rect2.left;

/**
 * Checks if rect1 is completely to the right of rect2 (no horizontal overlap).
 *
 * @param {ObjRect} rect1
 * @param {ObjRect} rect2
 * @returns {boolean} True if rect1 is entirely to the right of rect2.
 */
export const areElsCollRight = (rect1, rect2) => rect1.left > rect2.right;

// Perfect collision checks (touch included)

/**
 * Checks if rect1 is perfectly above rect2 (no vertical touch or overlap).
 *
 * @param {ObjRect} rect1
 * @param {ObjRect} rect2
 * @returns {boolean} True if rect1 is fully above or touching rect2's top.
 */
export const areElsCollPerfTop = (rect1, rect2) => rect1.bottom <= rect2.top;

/**
 * Checks if rect1 is perfectly below rect2 (no vertical touch or overlap).
 *
 * @param {ObjRect} rect1
 * @param {ObjRect} rect2
 * @returns {boolean} True if rect1 is fully below or touching rect2's bottom.
 */
export const areElsCollPerfBottom = (rect1, rect2) => rect1.top >= rect2.bottom;

/**
 * Checks if rect1 is perfectly to the left of rect2 (no horizontal touch or overlap).
 *
 * @param {ObjRect} rect1
 * @param {ObjRect} rect2
 * @returns {boolean} True if rect1 is fully left or touching rect2's left.
 */
export const areElsCollPerfLeft = (rect1, rect2) => rect1.right <= rect2.left;

/**
 * Checks if rect1 is perfectly to the right of rect2 (no horizontal touch or overlap).
 *
 * @param {ObjRect} rect1
 * @param {ObjRect} rect2
 * @returns {boolean} True if rect1 is fully right or touching rect2's right.
 */
export const areElsCollPerfRight = (rect1, rect2) => rect1.left >= rect2.right;

// Main collision check

/**
 * Returns true if rect1 and rect2 are colliding (partially or fully overlapping).
 *
 * @param {ObjRect} rect1
 * @param {ObjRect} rect2
 * @returns {boolean} True if there's any collision between rect1 and rect2.
 */
export const areElsColliding = (rect1, rect2) =>
  !(
    areElsCollLeft(rect1, rect2) ||
    areElsCollRight(rect1, rect2) ||
    areElsCollTop(rect1, rect2) ||
    areElsCollBottom(rect1, rect2)
  );

/**
 * Returns true if rect1 and rect2 are colliding or perfectly touching.
 *
 * @param {ObjRect} rect1
 * @param {ObjRect} rect2
 * @returns {boolean} True if there's any contact or overlap.
 */
export const areElsPerfColliding = (rect1, rect2) =>
  !(
    areElsCollPerfLeft(rect1, rect2) ||
    areElsCollPerfRight(rect1, rect2) ||
    areElsCollPerfTop(rect1, rect2) ||
    areElsCollPerfBottom(rect1, rect2)
  );

// Collision direction guess (loose and perfect)

/**
 * Attempts to determine the direction rect1 entered rect2 based on loose overlap rules.
 *
 * @param {ObjRect} rect1
 * @param {ObjRect} rect2
 * @returns {string|null} 'top' | 'bottom' | 'left' | 'right' | null
 */
export const getElsColliding = (rect1, rect2) => {
  if (areElsCollLeft(rect1, rect2)) return 'left';
  else if (areElsCollRight(rect1, rect2)) return 'right';
  else if (areElsCollTop(rect1, rect2)) return 'top';
  else if (areElsCollBottom(rect1, rect2)) return 'bottom';
  return null;
};

/**
 * Attempts to determine the direction rect1 touched or entered rect2 using perfect mode.
 *
 * @param {ObjRect} rect1
 * @param {ObjRect} rect2
 * @returns {'top' | 'bottom' | 'left' | 'right' | null}
 */
export const getElsPerfColliding = (rect1, rect2) => {
  if (areElsCollPerfLeft(rect1, rect2)) return 'left';
  else if (areElsCollPerfRight(rect1, rect2)) return 'right';
  else if (areElsCollPerfTop(rect1, rect2)) return 'top';
  else if (areElsCollPerfBottom(rect1, rect2)) return 'bottom';
  return null;
};

// Overlap Calculation

/**
 * Calculates overlap values between rect1 and rect2 in all directions.
 *
 * @param {ObjRect} rect1
 * @param {ObjRect} rect2
 * @returns {{
 *   overlapLeft: number,
 *   overlapRight: number,
 *   overlapTop: number,
 *   overlapBottom: number
 * }} Distance of overlap from each direction (can be negative).
 */
export const getElsCollOverlap = (rect1, rect2) => ({
  overlapLeft: rect2.right - rect1.left,
  overlapRight: rect1.right - rect2.left,
  overlapTop: rect2.bottom - rect1.top,
  overlapBottom: rect1.bottom - rect2.top,
});

/**
 * Determines directional collision based on overlap depth.
 *
 * @param {Object} [settings={}]
 * @param {number} [settings.overlapLeft]
 * @param {number} [settings.overlapRight]
 * @param {number} [settings.overlapTop]
 * @param {number} [settings.overlapBottom]
 * @returns {{ dirX: Dirs, dirY: Dirs }} Direction of strongest X/Y overlap.
 */
export const getElsCollOverlapPos = ({
  overlapLeft = -1,
  overlapRight = -1,
  overlapTop = -1,
  overlapBottom = -1,
} = {}) => ({
  dirX: overlapLeft < overlapRight ? 'right' : 'left',
  dirY: overlapTop < overlapBottom ? 'bottom' : 'top',
});

// Center utils

/**
 * Calculates the center point (X and Y) of a given Rect.
 *
 * @param {ObjRect} rect - The bounding rectangle of the element.
 * @returns {{ x: number, y: number }} An object with the `x` and `y` coordinates of the center.
 */
export const getRectCenter = (rect) => ({
  x: rect.left + rect.width / 2,
  y: rect.top + rect.height / 2,
});

/**
 * Calculates the offset between the center of rect2 and the center of rect1.
 *
 * The values will be 0 when rect1 is perfectly centered over rect2.
 *
 * @param {ObjRect} rect1 - The bounding rectangle of the reference element.
 * @param {ObjRect} rect2 - The bounding rectangle of the element being compared.
 * @returns {{
 *   x: number,
 *   y: number
 * }} An object with the X and Y offset in pixels from rect1's center to rect2's center.
 */
export function getElsRelativeCenterOffset(rect1, rect2) {
  const center1X = rect1.left + rect1.width / 2;
  const center1Y = rect1.top + rect1.height / 2;

  const center2X = rect2.left + rect2.width / 2;
  const center2Y = rect2.top + rect2.height / 2;

  return {
    x: center2X - center1X,
    y: center2Y - center1Y,
  };
}

// Direction & Depth detection

/**
 * Detects the direction of the dominant collision between two elements
 * and calculates how deep the overlap is in both x and y axes.
 *
 * @param {ObjRect} rect1 - The bounding rectangle of the first element.
 * @param {ObjRect} rect2 - The bounding rectangle of the second element.
 * @returns {{
 *   inDir: Dirs | null;
 *   dirX: Dirs | null;
 *   dirY: Dirs | null;
 *   depthX: number;
 *   depthY: number;
 * }} An object containing the collision direction and how deep the overlap is.
 */
export function getElsCollDirDepth(rect1, rect2) {
  if (!areElsPerfColliding(rect1, rect2))
    return {
      inDir: null,
      dirX: null,
      dirY: null,
      depthX: 0,
      depthY: 0,
    };

  const { overlapLeft, overlapRight, overlapTop, overlapBottom } = getElsCollOverlap(rect1, rect2);
  const { dirX, dirY } = getElsCollOverlapPos({
    overlapLeft,
    overlapRight,
    overlapTop,
    overlapBottom,
  });
  const depthX = Math.min(overlapLeft, overlapRight);
  const depthY = Math.min(overlapTop, overlapBottom);

  /** @type {Dirs} */
  let inDir;

  if (depthX < depthY) inDir = dirX;
  else inDir = dirY;
  return { inDir, dirX, dirY, depthX, depthY };
}

// Full detail report

/**
 * Detects the collision direction and depth between two DOMRects.
 *
 * @param {ObjRect} rect1 - The bounding rectangle of the first element.
 * @param {ObjRect} rect2 - The bounding rectangle of the second element.
 * @returns {{ depth: CollData; dirs: CollDirs; isNeg: NegCollDirs; }} Collision info or null if no collision is detected.
 */
export function getElsCollDetails(rect1, rect2) {
  const isColliding = areElsPerfColliding(rect1, rect2);

  /** @type {CollDirs} */
  const dirs = { in: null, x: null, y: null };

  /** @type {NegCollDirs} */
  const isNeg = { y: null, x: null };

  /** @type {Record<Dirs, number>} */
  const depth = { top: 0, bottom: 0, left: 0, right: 0 };

  // Depth
  // Yes, it's actually reversed the values orders
  const { overlapLeft, overlapRight, overlapTop, overlapBottom } = getElsCollOverlap(rect2, rect1);
  depth.top = overlapTop;
  depth.bottom = overlapBottom;
  depth.left = overlapLeft;
  depth.right = overlapRight;

  // Dirs

  /**
   * @param {Record<Dirs, number>} record - The direction-keyed record to convert.
   * @returns {[Dirs, number][]} The record entries with keys narrowed to `Dirs`.
   */
  const getDirEntries = (record) => /** @type {[Dirs, number][]} */ (Object.entries(record));

  /**
   * Detect the direction with the smallest positive overlap (entry point)
   * @type {[Dirs, number][]}
   */
  const entries = getDirEntries(depth)
    .filter(([, val]) => val > 0)
    .sort((a, b) => a[1] - b[1]);

  // Yes, it's actually reversed the values orders here too
  const { dirX, dirY } = getElsCollOverlapPos({
    overlapLeft: overlapRight,
    overlapRight: overlapLeft,
    overlapTop: overlapBottom,
    overlapBottom: overlapTop,
  });
  dirs.y = dirY;
  dirs.x = dirX;

  // isNeg
  if (depth.bottom < 0) isNeg.y = 'bottom';
  else if (depth.top < 0) isNeg.y = 'top';
  if (depth.left < 0) isNeg.x = 'left';
  else if (depth.right < 0) isNeg.x = 'right';

  // Inside Dir
  dirs.in = isColliding
    ? depth.top === depth.bottom && depth.bottom === depth.left && depth.left === depth.right
      ? 'center'
      : entries.length
        ? entries[0][0]
        : 'top'
    : null; // fallback in case of exact match

  // Complete
  return { dirs, depth, isNeg };
}
