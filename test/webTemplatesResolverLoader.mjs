/**
 * @fileoverview Asynchronous loader used by `module.register()`.
 *
 * `module.register()` (Node.js >= 20.6) runs the hooks on a separate loader
 * thread, where `nextResolve()` returns a promise. That is why the synchronous
 * `resolve` hook cannot be reused here: this module re-exports the async
 * flavour instead.
 *
 * It is only loaded on Node.js releases that do not provide
 * `module.registerHooks()` yet.
 *
 * @see ./registerWebTemplatesResolver.mjs
 * @see ./webTemplatesResolver.mjs
 */
export { resolveAsync as resolve } from './webTemplatesResolver.mjs';
