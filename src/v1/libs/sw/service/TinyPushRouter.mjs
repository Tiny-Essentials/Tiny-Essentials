import { PUSH_TYPE } from '../utils.mjs';

/**
 * @file Routes a normalized push message to a handler, based on `message.type`.
 *
 * The router is transport agnostic: it never touches the Notification API. That
 * responsibility belongs to the handler, which keeps the class testable in Node.
 */

/**
 * @typedef {Object} TinyPushContext
 * @property {PushEvent} event - The native push event.
 * @property {import('./shared/TinyPushPayload.mjs').TinyPushMessage} message - The normalized message.
 * @property {import('./TinyServiceWorkerEngine.mjs').default} engine - The engine that received the push.
 * @property {boolean} handled - Set to `true` to stop the chain.
 */

/**
 * @callback TinyPushHandler
 * @param {import('./shared/TinyPushPayload.mjs').TinyPushMessage} message - The normalized message.
 * @param {TinyPushContext} context - The dispatch context.
 * @returns {Promise<boolean|void>|boolean|void} Return `false` to fall through to the next handler.
 */

/**
 * @callback TinyPushGuard
 * @param {import('./shared/TinyPushPayload.mjs').TinyPushMessage} message - The normalized message.
 * @param {TinyPushContext} context - The dispatch context.
 * @returns {Promise<boolean>|boolean} Return `false` to drop the message.
 */

class TinyPushRouter {
  static #PUSH_TYPE = PUSH_TYPE;
  static get PUSH_TYPE() {
    return TinyPushRouter.#PUSH_TYPE;
  }

  /** @type {Map<string, TinyPushHandler>} */
  #exact = new Map();

  /** @type {Array<{ source: string, regex: RegExp, handler: TinyPushHandler }>} */
  #patterns = [];

  /** @type {TinyPushGuard[]} */
  #guards = [];

  /** @type {TinyPushHandler|null} */
  #fallback = null;

  /** @type {((error: unknown, message: unknown) => void)|null} */
  #onError = null;

  /**
   * Registers a guard. Every guard runs before the handler.
   *
   * A guard that returns `false` drops the message: no handler runs and the
   * `push` promise resolves with `true`, so the browser does not show a
   * generic "This site has been updated in the background" notification.
   *
   * @param {TinyPushGuard} guard - The guard to register.
   * @returns {this} The router, for chaining.
   * @throws {TypeError} If `guard` is not a function.
   */
  use(guard) {
    if (typeof guard !== 'function') {
      throw new TypeError('[TinyPushRouter] use: guard must be a function.');
    }
    this.#guards.push(guard);
    return this;
  }

  /**
   * Registers a handler for an exact `message.type`.
   *
   * @param {string} type - The type to match.
   * @param {TinyPushHandler} handler - The handler.
   * @returns {this} The router, for chaining.
   * @throws {TypeError} If `type` is not a non-empty string or `handler` is not a function.
   */
  on(type, handler) {
    if (typeof type !== 'string' || type.trim() === '') {
      throw new TypeError('[TinyPushRouter] on: type must be a non-empty string.');
    }
    if (typeof handler !== 'function') {
      throw new TypeError('[TinyPushRouter] on: handler must be a function.');
    }
    this.#exact.set(type, handler);
    return this;
  }

  /**
   * Registers a handler for every `message.type` that matches a regular expression.
   *
   * @param {RegExp} pattern - The pattern applied to `message.type`.
   * @param {TinyPushHandler} handler - The handler.
   * @returns {this} The router, for chaining.
   * @throws {TypeError} If `pattern` is not a RegExp or `handler` is not a function.
   */
  onMatch(pattern, handler) {
    if (!(pattern instanceof RegExp)) {
      throw new TypeError('[TinyPushRouter] onMatch: pattern must be a RegExp.');
    }
    if (typeof handler !== 'function') {
      throw new TypeError('[TinyPushRouter] onMatch: handler must be a function.');
    }
    this.#patterns.push({ source: pattern.source, regex: pattern, handler });
    return this;
  }

  /**
   * Registers the handler used when no other handler matches.
   *
   * @param {TinyPushHandler} handler - The fallback handler.
   * @returns {this} The router, for chaining.
   * @throws {TypeError} If `handler` is not a function.
   */
  otherwise(handler) {
    if (typeof handler !== 'function') {
      throw new TypeError('[TinyPushRouter] otherwise: handler must be a function.');
    }
    this.#fallback = handler;
    return this;
  }

  /**
   * Registers an error handler.
   *
   * @param {(error: unknown, message: unknown) => void} handler - The error handler.
   * @returns {this} The router, for chaining.
   * @throws {TypeError} If `handler` is not a function.
   */
  catch(handler) {
    if (typeof handler !== 'function') {
      throw new TypeError('[TinyPushRouter] catch: handler must be a function.');
    }
    this.#onError = handler;
    return this;
  }

  /**
   * Reports whether a handler is registered for the given type.
   *
   * @param {string} type - The type to look up.
   * @returns {boolean} `true` when a handler is registered.
   */
  has(type) {
    if (this.#exact.has(type)) return true;
    return this.#patterns.some(({ regex }) => regex.test(type));
  }

  /** @returns {number} The number of registered handlers. */
  get size() {
    return this.#exact.size + this.#patterns.length;
  }

  /**
   * Dispatches a message to the first matching handler.
   *
   * @param {import('./shared/TinyPushPayload.mjs').TinyPushMessage} message - The normalized message.
   * @param {TinyPushContext} context - The dispatch context.
   * @returns {Promise<boolean>} `true` when a handler claimed the message.
   * @throws {TypeError} If `message` or `context` are invalid.
   */
  async dispatch(message, context) {
    if (typeof message !== 'object' || message === null) {
      throw new TypeError('[TinyPushRouter] dispatch: message must be a non-null object.');
    }
    if (typeof context !== 'object' || context === null) {
      throw new TypeError('[TinyPushRouter] dispatch: context must be a non-null object.');
    }

    try {
      for (const guard of this.#guards) {
        const allowed = await guard(message, context);
        if (allowed === false) return true;
      }

      const handler = this.#exact.get(message.type);

      if (handler) {
        const result = await handler(message, context);
        if (result !== false) return true;
      }

      for (const { regex, handler: patternHandler } of this.#patterns) {
        if (!regex.test(message.type)) continue;
        const result = await patternHandler(message, context);
        if (result !== false) return true;
      }

      if (this.#fallback) {
        await this.#fallback(message, context);
        return true;
      }

      return false;
    } catch (error) {
      if (this.#onError) {
        this.#onError(error, message);
        return true;
      }
      throw error;
    }
  }
}

export default TinyPushRouter;
