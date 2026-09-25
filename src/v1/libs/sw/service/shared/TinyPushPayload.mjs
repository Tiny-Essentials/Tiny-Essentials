import { PUSH_TYPE } from '../../utils.mjs';

/**
 * @file Shared contract for every message that travels through the Web Push channel.
 *
 * The module is isomorphic on purpose: the Service Worker imports it to parse the
 * incoming payload, and the page imports it to build and validate the payload
 * before it reaches the backend.
 */

/** @typedef {import('../../utils.mjs').TinyPushNotification} TinyPushNotification */
/** @typedef {import('../../utils.mjs').TinyPushMessage} TinyPushMessage */

/**
 * @typedef {Object} TinyPushNotificationDefaults
 * @property {string} [defaultIcon] - Fallback icon.
 * @property {string} [defaultBadge] - Fallback badge.
 * @property {string} [defaultUrl] - Fallback click URL.
 */

const MAX_TTL_SECONDS = 2419200;

/**
 * Normalizes, validates and converts Web Push payloads.
 *
 * Every method is static and side effect free, so the class is safe to import
 * from both the page and the Service Worker.
 */
class TinyPushPayload {
  static #PUSH_TYPE = PUSH_TYPE;
  static get PUSH_TYPE() {
    return TinyPushPayload.#PUSH_TYPE;
  }

  /** @type {number} */
  static VERSION = 1;

  /** @type {number} */
  static MAX_TTL = MAX_TTL_SECONDS;

  /**
   * Builds a normalized message from an untrusted value.
   *
   * @param {unknown} raw - The value received from the network.
   * @returns {TinyPushMessage} A frozen, normalized message.
   * @throws {TypeError} If `raw` is not a non-null object.
   */
  static from(raw) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      throw new TypeError('[TinyPushPayload] from: raw must be a non-null object.');
    }

    const source = /** @type {Record<string, unknown>} */ (raw);
    const type =
      typeof source.type === 'string' && source.type !== '' ? source.type : PUSH_TYPE.UNKNOWN;

    /** @type {TinyPushMessage} */
    const message = {
      v: typeof source.v === 'number' ? source.v : TinyPushPayload.VERSION,
      type,
    };

    if (typeof source.id === 'string') message.id = source.id;
    if (typeof source.topic === 'string') message.topic = source.topic;
    if (typeof source.expiresAt === 'number') message.expiresAt = source.expiresAt;
    if (typeof source.ttl === 'number' && Number.isFinite(source.ttl)) {
      message.ttl = Math.min(Math.max(0, Math.trunc(source.ttl)), MAX_TTL_SECONDS);
    }
    if (typeof source.data === 'object' && source.data !== null && !Array.isArray(source.data)) {
      message.data = /** @type {Record<string, unknown>} */ (source.data);
    }
    if (typeof source.notification === 'object' && source.notification !== null) {
      message.notification = TinyPushPayload.#normalizeNotification(source.notification);
    }

    return Object.freeze(message);
  }

  /**
   * Reads the payload of a `push` event exactly once.
   *
   * `PushMessageData` is a one-shot stream: calling `json()` and then `text()`
   * throws `TypeError`. This method reads the body once and parses it manually.
   *
   * @param {PushEvent} event - The native push event.
   * @returns {Promise<TinyPushMessage>} The normalized message, never `null`.
   */
  static async fromEvent(event) {
    if (typeof event !== 'object' || event === null || !('data' in event)) {
      throw new TypeError('[TinyPushPayload] fromEvent: event must be a PushEvent.');
    }

    if (!event.data) {
      return Object.freeze({ v: TinyPushPayload.VERSION, type: PUSH_TYPE.UNKNOWN });
    }

    let text;

    try {
      text = await event.data.text();
    } catch {
      return Object.freeze({ v: TinyPushPayload.VERSION, type: PUSH_TYPE.UNKNOWN });
    }

    if (text === '') {
      return Object.freeze({ v: TinyPushPayload.VERSION, type: PUSH_TYPE.UNKNOWN });
    }

    try {
      return TinyPushPayload.from(JSON.parse(text));
    } catch {
      return Object.freeze({
        v: TinyPushPayload.VERSION,
        type: PUSH_TYPE.UNKNOWN,
        notification: { title: 'Notification', body: text },
      });
    }
  }

  /**
   * Checks whether a message is past its expiration time.
   *
   * @param {TinyPushMessage} message - The message to inspect.
   * @param {number} [now=Date.now()] - Reference time in milliseconds.
   * @returns {boolean} `true` when the message must be discarded.
   * @throws {TypeError} If `message` is not a non-null object or `now` is not a finite number.
   */
  static isExpired(message, now = Date.now()) {
    if (typeof message !== 'object' || message === null) {
      throw new TypeError('[TinyPushPayload] isExpired: message must be a non-null object.');
    }
    if (typeof now !== 'number' || !Number.isFinite(now)) {
      throw new TypeError('[TinyPushPayload] isExpired: now must be a finite number.');
    }

    return typeof message.expiresAt === 'number' && message.expiresAt <= now;
  }

  /**
   * Converts a message into the `[title, options]` pair expected by `showNotification`.
   *
   * @param {TinyPushMessage} message - The normalized message.
   * @param {TinyPushNotificationDefaults} [defaults] - Fallback values.
   * @returns {{ title: string, options: NotificationOptions & { data: Record<string, unknown> } }} The arguments.
   * @throws {TypeError} If `message` is not a non-null object.
   */
  static toNotification(message, defaults = {}) {
    if (typeof message !== 'object' || message === null) {
      throw new TypeError('[TinyPushPayload] toNotification: message must be a non-null object.');
    }

    const n = message.notification ?? { title: 'Notification' };
    const { title, body, url, actions, data, ...rest } = n;

    return {
      title: title ?? 'Notification',
      options: {
        ...rest,
        body: body ?? '',
        icon: n.icon ?? defaults.defaultIcon,
        badge: n.badge ?? defaults.defaultBadge,
        // @ts-ignore
        actions,
        data: {
          ...data,
          url: url ?? defaults.defaultUrl ?? '/',
          actions: Object.fromEntries((actions ?? []).map((a) => [a.action, a.url ?? url ?? '/'])),
          pushId: message.id,
          pushType: message.type,
        },
      },
    };
  }

  /**
   * Validates and normalizes a notification descriptor.
   *
   * @param {object} raw - The value to normalize.
   * @returns {TinyPushNotification} The normalized descriptor.
   * @throws {TypeError} If `title` is missing or not a string.
   */
  static #normalizeNotification(raw) {
    const source = /** @type {Record<string, unknown>} */ (raw);

    if (typeof source.title !== 'string' || source.title.trim() === '') {
      throw new TypeError('[TinyPushPayload] notification.title must be a non-empty string.');
    }

    return /** @type {TinyPushNotification} */ ({ ...source });
  }
}

export default TinyPushPayload;
