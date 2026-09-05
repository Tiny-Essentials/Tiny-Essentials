// Credits: https://code-boxx.com/detect-browser-with-javascript/

/**
 * @typedef {'chrome'|'firefox'|'ie'|'edge'|'safari'|'opera'|'yandex'|'other'} BrowserDetected
 */

/**
 * This is determined by checking if the `window` and `document` objects are defined.
 * @returns {boolean} Indicates if the current execution environment is a web browser.
 */
export const isBrowser = () =>
  typeof window !== 'undefined' && typeof window.document !== 'undefined';

const win =
  typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : null;
const doc = typeof document !== 'undefined' ? document : null;

/**
 * @typedef {Object} DuckTypingResult
 * @property {boolean} isOpera - True if Opera is detected.
 * @property {boolean} isFirefox - True if Firefox is detected.
 * @property {boolean} isSafari - True if Safari is detected.
 * @property {boolean} isIE - True if Internet Explorer is detected.
 * @property {boolean} isEdge - True if Edge is detected.
 * @property {boolean} isChrome - True if Chrome is detected.
 * @property {boolean} isBlink - True if the Blink engine is detected.
 */

const VALID_BROWSERS = ['chrome', 'firefox', 'ie', 'edge', 'safari', 'opera', 'yandex', 'other'];

/**
 * Detects the browser name by parsing the `navigator.userAgent` string.
 *
 * @returns {BrowserDetected} The detected browser name.
 */
export function isBrowserAgent() {
  if (typeof navigator === 'undefined') {
    return 'other';
  }

  const ua = navigator.userAgent;

  // CHROME
  if (ua.indexOf('Chrome') !== -1) {
    return 'chrome';
  }
  // FIREFOX
  else if (ua.indexOf('Firefox') !== -1) {
    return 'firefox';
  }
  // INTERNET EXPLORER
  else if (ua.indexOf('MSIE') !== -1) {
    return 'ie';
  }
  // EDGE
  else if (ua.indexOf('Edge') !== -1) {
    return 'edge';
  }
  // SAFARI
  else if (ua.indexOf('Safari') !== -1) {
    return 'safari';
  }
  // OPERA
  else if (ua.indexOf('Opera') !== -1) {
    return 'opera';
  }
  // YANDEX BROWSER
  else if (ua.indexOf('YaBrowser') !== -1) {
    return 'yandex';
  }
  // OTHERS
  return 'other';
}

/**
 * Determines the browser's CSS rendering engine prefix by inspecting computed styles.
 *
 * @returns {'gecko'|'webkit'|'trident'|'other'} The detected CSS engine prefix.
 */
export function getBrowserCssPrefix() {
  const prefix = !!win?.getComputedStyle
    ? (Array.prototype.slice
        .call(win.getComputedStyle(document.documentElement, ''))
        .join('')
        .match(/-(moz|webkit|ms)-/) ?? ['', ''])[1]
    : '';

  // Firefox (Gecko engine)
  if (prefix === 'moz') {
    return 'gecko';
  }

  // Webkit engines (Chrome, Safari, Opera, Edge)
  if (prefix === 'webkit') {
    return 'webkit';
  }

  // Internet Explorer & Legacy Edge (Trident engine)
  if (prefix === 'ms') {
    return 'trident';
  }

  return 'other';
}

/**
 * Performs feature detection (duck typing) to identify the browser based on specific API availability.
 *
 * @returns {DuckTypingResult} An object containing boolean flags for various browser features.
 */
export function getDuckTyping() {
  // OPERA 8.0+
  const isOpera =
    // @ts-ignore
    (!!win?.opr && !!opr.addons) || !!win?.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

  // FIREFOX 1.0+
  // @ts-ignore
  const isFirefox = typeof InstallTrigger !== 'undefined';

  // SAFARI 3.0+
  const isSafari =
    (!!win?.HTMLElement &&
      // @ts-ignore
      /constructor/i.test(win.HTMLElement)) ||
    (function (p) {
      return p.toString() === '[object SafariRemoteNotification]';
      // @ts-ignore
    })(!win['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));

  // INTERNET EXPLORER 6-11
  // @ts-ignore
  const isIE = /*@cc_on!@*/ false || !!doc?.documentMode;

  // EDGE 20+
  // @ts-ignore
  const isEdge = !isIE && !!win?.StyleMedia;

  // CHROME 1+
  // @ts-ignore
  const isChrome = !!win?.chrome;

  // BLINK ENGINE DETECTION
  const isBlink = (isChrome || isOpera) && !!win?.CSS;

  return { isOpera, isFirefox, isSafari, isIE, isEdge, isChrome, isBlink };
}

/**
 * Aggregates detection results from multiple methods to provide a count of "pings" per browser.
 *
 * @param {BrowserDetected[]} [disable=[]] An array of browser names to exclude from the count.
 * @returns {Object<BrowserDetected, number>} An object where keys are browser names and values are their detection counts.
 * @throws {TypeError} If the `disable` argument is not an array or contains invalid browser names.
 */
export function getBrowserPings(disable = []) {
  // Argument Validation
  if (!Array.isArray(disable)) {
    throw new TypeError('The "disable" argument must be an array.');
  }

  for (const browser of disable) {
    if (!VALID_BROWSERS.includes(browser)) {
      throw new TypeError(`Invalid browser name provided in disable array: ${browser}`);
    }
  }

  const browsers = {
    chrome: 0,
    firefox: 0,
    ie: 0,
    edge: 0,
    safari: 0,
    opera: 0,
    yandex: 0,
    other: 0,
  };

  // 1. Count by User Agent
  browsers[isBrowserAgent()]++;

  // 2. Count by CSS Prefix
  const browserCssPrefix = getBrowserCssPrefix();
  if (browserCssPrefix === 'gecko') {
    if (disable.indexOf('firefox') < 0) browsers.firefox++;
  } else if (browserCssPrefix === 'webkit') {
    if (disable.indexOf('chrome') < 0) browsers.chrome++;
    if (disable.indexOf('safari') < 0) browsers.safari++;
    if (disable.indexOf('opera') < 0) browsers.opera++;
    if (disable.indexOf('edge') < 0) browsers.edge++;
  } else if (browserCssPrefix === 'trident') {
    if (disable.indexOf('ie') < 0) browsers.ie++;
  } else {
    if (disable.indexOf('other') < 0) browsers.other++;
  }

  // 3. Count by Duck Typing
  const duckTyping = getDuckTyping();

  if (duckTyping.isOpera) {
    if (disable.indexOf('opera') < 0) browsers.opera++;
  }
  if (duckTyping.isFirefox) {
    if (disable.indexOf('firefox') < 0) browsers.firefox++;
  }
  if (duckTyping.isSafari) {
    if (disable.indexOf('safari') < 0) browsers.safari++;
  }
  if (duckTyping.isIE) {
    if (disable.indexOf('ie') < 0) browsers.ie++;
  }
  if (duckTyping.isEdge) {
    if (disable.indexOf('edge') < 0) browsers.edge++;
  }
  if (duckTyping.isChrome) {
    if (disable.indexOf('chrome') < 0) browsers.chrome++;
  }

  return browsers;
}

/**
 * Determines the most likely browser by identifying the one with the highest number of detection "pings".
 *
 * @param {BrowserDetected[]} [disable=[]] An array of browser names to exclude from the count.
 * @returns {BrowserDetected} The name of the browser with the maximum count.
 * @throws {TypeError} If the `disable` argument is not an array or contains invalid browser names.
 */
export function browserIs(disable = []) {
  const pings = getBrowserPings(disable);

  // Returns the key with the maximum value in the pings object
  // @ts-ignore
  return Object.keys(pings).reduce((highest, current) =>
    // @ts-ignore
    pings[current] > pings[highest] ? current : highest,
  );
}
