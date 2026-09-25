import { PUSH_TYPE } from '../utils.mjs';
import { requestNotificationPermission } from './utils.mjs';

/**
 * @file Owns the lifecycle of a `PushSubscription` in the page context.
 *
 * The manager never talks to the push service directly: it delegates to
 * `PushManager` and to two HTTP endpoints that your backend exposes.
 */

/**
 * @typedef {Object} TinyPushEndpoints
 * @property {string} [subscribe] - `POST` route that persists a subscription.
 * @property {string} [unsubscribe] - `DELETE` route that removes a subscription.
 */

/**
 * @typedef {Object} TinyPushManagerOptions
 * @property {ServiceWorkerRegistration} registration - The active registration.
 * @property {string} vapidPublicKey - Base64 URL-safe VAPID public key.
 * @property {TinyPushEndpoints} [endpoints] - Backend routes.
 * @property {typeof fetch} [fetch] - Fetch implementation, injectable for tests.
 * @property {(state: TinyPushState) => void} [onChange] - State observer.
 */

/**
 * @typedef {Object} TinyPushState
 * @property {'unsupported'|'unsubscribed'|'subscribed'|'denied'|'pending'} status - Current status.
 * @property {PushSubscription|null} subscription - The active subscription, when any.
 * @property {string|null} error - The last error message, when any.
 */

class TinyPushManager {
  static #PUSH_TYPE = PUSH_TYPE;
  static get PUSH_TYPE() {
    return TinyPushManager.#PUSH_TYPE;
  }

  /** @type {BufferSource|null} */
  static #cachedKey = null;

  /** @type {string|null} */
  static #cachedKeySource = null;

  /**
   * Reports whether the browser exposes the Push API.
   * @returns {boolean} `true` when the Push API is available.
   */
  static isSupported() {
    return (
      typeof globalThis !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in globalThis &&
      'Notification' in globalThis
    );
  }

  /** @returns {NotificationPermission} The current permission. */
  static get permission() {
    return TinyPushManager.isSupported() ? Notification.permission : 'denied';
  }

  /**
   * Asks the user for the notification permission.
   *
   * @returns {Promise<NotificationPermission>} The resulting permission.
   * @throws {Error} If the Push API is not supported.
   */
  static async requestPermission() {
    if (!TinyPushManager.isSupported()) {
      throw new Error('[TinyPushManager] Push API is not supported in this browser.');
    }
    return await requestNotificationPermission();
  }

  /**
   * Decodes a base64 URL-safe VAPID key. The result is memoized per key.
   *
   * @param {string} base64 - The VAPID public key.
   * @returns {BufferSource} The decoded key.
   * @throws {TypeError} If `base64` is not a non-empty string.
   */
  static decodeVapidKey(base64) {
    if (typeof base64 !== 'string' || base64 === '') {
      throw new TypeError('[TinyPushManager] decodeVapidKey: base64 must be a non-empty string.');
    }
    if (TinyPushManager.#cachedKeySource === base64 && TinyPushManager.#cachedKey) {
      return TinyPushManager.#cachedKey;
    }

    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(normalized);
    const bytes = Uint8Array.from(raw, (char) => char.charCodeAt(0));

    TinyPushManager.#cachedKey = bytes;
    TinyPushManager.#cachedKeySource = base64;

    return bytes;
  }

  /** @type {ServiceWorkerRegistration} */
  #registration;

  /** @type {string} */
  #vapidPublicKey;

  /** @type {TinyPushEndpoints} */
  #endpoints;

  /** @type {typeof fetch} */
  #fetch;

  /** @type {((state: TinyPushState) => void)|null} */
  #onChange;

  /** @type {TinyPushState} */
  #state = { status: 'unsubscribed', subscription: null, error: null };

  /**
   * @param {TinyPushManagerOptions} options - The manager options.
   * @throws {TypeError} If `options` is invalid.
   */
  constructor(options) {
    if (typeof options !== 'object' || options === null || Array.isArray(options)) {
      throw new TypeError('[TinyPushManager] constructor: options must be a non-null object.');
    }

    const { registration, vapidPublicKey, endpoints = {}, fetch: fetchImpl, onChange } = options;

    if (typeof registration !== 'object' || registration === null) {
      throw new TypeError('[TinyPushManager] constructor: options.registration is required.');
    }
    if (typeof vapidPublicKey !== 'string' || vapidPublicKey === '') {
      throw new TypeError('[TinyPushManager] constructor: options.vapidPublicKey is required.');
    }
    if (endpoints.subscribe !== undefined && typeof endpoints.subscribe !== 'string') {
      throw new TypeError('[TinyPushManager] constructor: endpoints.subscribe must be a string.');
    }
    if (endpoints.unsubscribe !== undefined && typeof endpoints.unsubscribe !== 'string') {
      throw new TypeError('[TinyPushManager] constructor: endpoints.unsubscribe must be a string.');
    }
    if (onChange !== undefined && typeof onChange !== 'function') {
      throw new TypeError('[TinyPushManager] constructor: onChange must be a function.');
    }

    this.#registration = registration;
    this.#vapidPublicKey = vapidPublicKey;
    this.#endpoints = endpoints;
    this.#fetch = fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.#onChange = onChange ?? null;
  }

  /** @returns {TinyPushState} A frozen snapshot of the current state. */
  get state() {
    return Object.freeze({ ...this.#state });
  }

  /**
   * Returns the current subscription, if any.
   *
   * @returns {Promise<PushSubscription|null>} The subscription or `null`.
   */
  async getSubscription() {
    if (!TinyPushManager.isSupported()) return null;
    return this.#registration.pushManager.getSubscription();
  }

  /**
   * Subscribes the user and uploads the subscription to the backend.
   *
   * @param {PushSubscriptionOptionsInit} [options] - Extra options merged into `subscribe`.
   * @returns {Promise<PushSubscription>} The active subscription.
   * @throws {Error} If the permission is denied or the browser rejects the subscription.
   */
  async subscribe(options = {}) {
    if (!TinyPushManager.isSupported()) {
      throw new Error('[TinyPushManager] Push API is not supported in this browser.');
    }

    this.#setState({ status: 'pending', error: null });

    const permission = await TinyPushManager.requestPermission();

    if (permission !== 'granted') {
      this.#setState({ status: 'denied', subscription: null });
      throw new Error(`[TinyPushManager] Notification permission was not granted: ${permission}.`);
    }

    const existing = await this.getSubscription();
    const subscription =
      existing ??
      (await this.#registration.pushManager.subscribe({
        ...options,
        userVisibleOnly: true,
        applicationServerKey: TinyPushManager.decodeVapidKey(this.#vapidPublicKey),
      }));

    await this.#upload(subscription);
    this.#setState({ status: 'subscribed', subscription, error: null });

    return subscription;
  }

  /**
   * Removes the subscription locally and on the backend.
   *
   * @returns {Promise<boolean>} `true` when a subscription was removed.
   */
  async unsubscribe() {
    const subscription = await this.getSubscription();

    if (!subscription) {
      this.#setState({ status: 'unsubscribed', subscription: null });
      return false;
    }

    if (this.#endpoints.unsubscribe) {
      await this.#fetch(this.#endpoints.unsubscribe, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      }).catch(() => undefined);
    }

    await subscription.unsubscribe();
    this.#setState({ status: 'unsubscribed', subscription: null, error: null });

    return true;
  }

  /**
   * Re-uploads the current subscription. Call it after a `pushsubscriptionchange`.
   *
   * @returns {Promise<PushSubscription|null>} The refreshed subscription.
   */
  async syncWithServer() {
    const subscription = await this.getSubscription();
    if (!subscription) return null;
    await this.#upload(subscription);
    this.#setState({ status: 'subscribed', subscription, error: null });
    return subscription;
  }

  /**
   * Pushes the subscription to the backend.
   *
   * @param {PushSubscription} subscription - The subscription to upload.
   * @returns {Promise<void>}
   * @throws {Error} If the backend responds with a non-2xx status.
   */
  async #upload(subscription) {
    if (!this.#endpoints.subscribe) return;

    const response = await this.#fetch(this.#endpoints.subscribe, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON()),
    });

    if (!response.ok) {
      throw new Error(`[TinyPushManager] Failed to upload subscription: ${response.status}.`);
    }
  }

  /**
   * Updates the internal state and notifies the observer.
   *
   * @param {Partial<TinyPushState>} patch - The fields to merge.
   * @returns {void}
   */
  #setState(patch) {
    this.#state = { ...this.#state, ...patch };
    this.#onChange?.(this.state);
  }
}

export default TinyPushManager;
