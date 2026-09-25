/**
 * @typedef {Object} TinyPushAction
 * @property {string} action - Identifier echoed back on `notificationclick`.
 * @property {string} title - Human readable label.
 * @property {string} [icon] - Absolute URL of the action icon.
 * @property {string} [url] - URL opened when the action is clicked.
 * @property {boolean} [dismiss] - When `true`, the action only closes the notification.
 */

/**
 * @typedef {Object} TinyPushNotification
 * @property {string} title - Notification title.
 * @property {string} [body] - Notification body.
 * @property {string} [icon] - Absolute URL of the icon.
 * @property {string} [badge] - Absolute URL of the badge.
 * @property {string} [image] - Absolute URL of the hero image.
 * @property {string} [tag] - Collapse key. Notifications with the same tag replace each other.
 * @property {string} [lang] - BCP 47 language tag.
 * @property {string} [dir] - Text direction: `ltr` or `rtl`.
 * @property {string} [url] - URL opened when the notification body is clicked.
 * @property {boolean} [renotify] - Whether to vibrate on replacement.
 * @property {boolean} [requireInteraction] - Whether the notification stays until dismissed.
 * @property {boolean} [silent] - Whether to suppress vibration and sound.
 * @property {number} [timestamp] - Creation time in milliseconds since the epoch.
 * @property {number[]} [vibrate] - Vibration pattern in milliseconds.
 * @property {TinyPushAction[]} [actions] - Action buttons.
 * @property {Record<string, unknown>} [data] - Opaque data echoed back on click.
 */

/**
 * @typedef {Object} TinyPushMessage
 * @property {number} v - Contract version.
 * @property {string} type - Routing key, see {@link PUSH_TYPE}.
 * @property {string} [id] - Idempotency identifier.
 * @property {number} [ttl] - Time to live in seconds.
 * @property {string} [topic] - Collapse key at the transport level.
 * @property {number} [expiresAt] - Absolute expiration time in milliseconds since the epoch.
 * @property {TinyPushNotification} [notification] - Notification descriptor.
 * @property {Record<string, unknown>} [data] - Arbitrary payload for custom handlers.
 */

/**
 * Discriminator used by the router to pick a handler.
 * @readonly
 * @enum {string}
 */
export const PUSH_TYPE = Object.freeze({
  NOTIFICATION: 'notification',
  DATA: 'data',
  SYNC: 'sync',
  COMMAND: 'command',
  UNKNOWN: 'unknown',
});
