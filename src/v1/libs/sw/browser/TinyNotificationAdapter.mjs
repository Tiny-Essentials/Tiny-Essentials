import { PUSH_TYPE } from '../utils.mjs';

/** @typedef {import('../utils.mjs').TinyPushNotification} TinyPushNotification */

/**
 * Options accepted by the page level `Notification` constructor.
 *
 * @typedef {Object} BrowserNotificationOptions
 * @property {string} [body] - The main text of the notification, shown below the title.
 * @property {string} [icon] - URL of the image used as the notification icon.
 * @property {string} [image] - URL of an image shown inside the notification body.
 * @property {string} [tag] - Identifier used to group and replace notifications sharing the same tag.
 * @property {string} [lang] - BCP 47 language tag describing the notification text.
 * @property {'auto'|'ltr'|'rtl'} [dir] - Text direction used to render the notification content.
 * @property {boolean} [renotify] - Whether to notify the user again when a notification with the same `tag` is replaced.
 * @property {boolean} [requireInteraction] - Whether the notification stays visible until the user interacts with it.
 * @property {boolean} [silent] - Whether the notification is shown without sound or vibration feedback.
 * @property {number} [timestamp] - Time the notification was created, in milliseconds since the Unix epoch.
 * @property {number[]} [vibrate] - Vibration pattern, in milliseconds, applied on supported devices.
 * @property {Record<string, unknown>} [data] - Arbitrary payload attached to the notification for later retrieval.
 */

/**
 * A notification already adapted to the page environment.
 *
 * @typedef {Object} BrowserNotification
 * @property {string} title - The headline text displayed at the top of the notification.
 * @property {BrowserNotificationOptions} options - The configuration applied to the notification.
 */

/**
 * Adapts notification descriptors between the Service Worker and the page.
 *
 * The class is a static-only utility and is never instantiated. It normalizes
 * the payload in both directions: a descriptor produced by the Service Worker
 * can be safely handed to the page level `Notification` constructor through
 * {@link TinyNotificationAdapter.toBrowser}, and a page level notification can
 * be converted back into a Service Worker payload through
 * {@link TinyNotificationAdapter.toServiceWorker}.
 *
 * @beta
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
   * @returns {BrowserNotification} The notification adapted for the page environment.
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
   * @returns {{ title: string, body: string, options: BrowserNotificationOptions }} The payload shaped for the Service Worker, with a guaranteed string `body`.
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
