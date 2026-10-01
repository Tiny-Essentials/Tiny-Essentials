import { PUSH_TYPE } from '../utils.mjs';

/** @typedef {import('../utils.mjs').TinyPushNotification} TinyPushNotification */

/**
 * Options accepted by the page level `Notification` constructor.
 * @typedef {Object} BrowserNotificationOptions
 * @property {string} [body]
 * @property {string} [icon]
 * @property {string} [image]
 * @property {string} [tag]
 * @property {string} [lang]
 * @property {'auto'|'ltr'|'rtl'} [dir]
 * @property {boolean} [renotify]
 * @property {boolean} [requireInteraction]
 * @property {boolean} [silent]
 * @property {number} [timestamp]
 * @property {number[]} [vibrate]
 * @property {Record<string, unknown>} [data]
 */

/**
 * A notification already adapted to the page environment.
 * @typedef {Object} BrowserNotification
 * @property {string} title
 * @property {BrowserNotificationOptions} options
 */

class TinyNotificationAdapter {
  static PUSH_TYPE = PUSH_TYPE;
  /** @type {readonly string[]} */
  static #SW_ONLY_KEYS = Object.freeze(['actions', 'badge']);

  /**
   * SW -> Browser. Use before `new Notification(...)`.
   *
   * @param {TinyPushNotification|null} notification - Descriptor sent by the Service Worker.
   * @param {Partial<BrowserNotificationOptions>} [overrides] - Values that win over the descriptor.
   * @returns {BrowserNotification}
   * @throws {TypeError} If `notification` is neither `null` nor a non-null object.
   */
  static toBrowser(notification, overrides = {}) {
    if (
      notification !== null &&
      (typeof notification !== 'object' || Array.isArray(notification))
    ) {
      throw new TypeError(
        '[TinyNotificationAdapter] toBrowser: notification must be a non-null object.',
      );
    }
    if (typeof overrides !== 'object' || overrides === null || Array.isArray(overrides)) {
      throw new TypeError(
        '[TinyNotificationAdapter] toBrowser: overrides must be a non-null object.',
      );
    }
    const { title, ...rest } = notification ?? {};
    /** @type {BrowserNotificationOptions} */
    const options = {};
    for (const [key, value] of Object.entries(rest)) {
      if (TinyNotificationAdapter.#SW_ONLY_KEYS.includes(key)) continue;
      if (typeof value === 'undefined') continue;
      // @ts-ignore - the key comes from a validated descriptor.
      options[key] = value;
    }
    // `dir` is the only field whose DOM type is a closed union, so an arbitrary
    // string coming from the wire must be narrowed before it reaches the
    // `Notification` constructor.
    if (options.dir !== 'auto' && options.dir !== 'ltr' && options.dir !== 'rtl') {
      delete options.dir;
    }
    // `renotify` without `tag` throws on Chromium.
    if (options.renotify === true && typeof options.tag !== 'string') {
      delete options.renotify;
    }
    return {
      title: typeof title === 'string' && title !== '' ? title : 'Notification',
      options: { ...options, ...overrides },
    };
  }

  /**
   * Browser -> SW. Use before sending a click/close back to the Service Worker.
   *
   * @param {BrowserNotification} notification - The value returned by {@link TinyNotificationAdapter.toBrowser}.
   * @param {Partial<BrowserNotificationOptions>} [overrides] - Values that win over the descriptor.
   * @returns {{ title: string, body: string, options: BrowserNotificationOptions }}
   * @throws {TypeError} If `notification` is not a non-null object.
   */
  static toServiceWorker(notification, overrides = {}) {
    if (typeof notification !== 'object' || notification === null || Array.isArray(notification)) {
      throw new TypeError(
        '[TinyNotificationAdapter] toServiceWorker: notification must be a non-null object.',
      );
    }
    if (typeof overrides !== 'object' || overrides === null || Array.isArray(overrides)) {
      throw new TypeError(
        '[TinyNotificationAdapter] toServiceWorker: overrides must be a non-null object.',
      );
    }
    const { title = 'Notification', options = {} } = notification;
    const merged = { ...options, ...overrides };
    return {
      title,
      body: typeof merged.body === 'string' ? merged.body : '',
      options: merged,
    };
  }
}

export default TinyNotificationAdapter;
