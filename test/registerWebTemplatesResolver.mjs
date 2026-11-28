/**
 * @fileoverview Registers the `webTemplates` resolve hooks for the Node.js test-suite.
 *
 * Usage:
 *   node --import ./test/registerWebTemplatesResolver.mjs test/index.mjs
 *
 * The registration is version aware, so the same command works on every Node.js
 * release supported by the project:
 *
 * - `module.registerHooks()` (Node.js >= 22.15 / 23.5) is used when available.
 *   It is synchronous and runs in the same thread.
 * - Otherwise `module.register()` (Node.js >= 20.6) is used as a fallback. It
 *   runs the hooks on a separate loader thread, so the asynchronous flavour of
 *   the hook is required (see `./webTemplatesResolverLoader.mjs`).
 * - When neither API exists the hooks are skipped with a warning instead of
 *   crashing the test-suite with a `SyntaxError`.
 *
 * @see ./webTemplatesResolver.mjs
 */
import * as nodeModule from 'node:module';

import { resolve } from './webTemplatesResolver.mjs';

if (typeof nodeModule.registerHooks === 'function') {
  // Node.js >= 22.15 / 23.5: synchronous, in-thread hooks.
  nodeModule.registerHooks({ resolve });
} else if (typeof nodeModule.register === 'function') {
  // Node.js >= 20.6: asynchronous hooks running on a loader thread.
  await nodeModule.register('./webTemplatesResolverLoader.mjs', import.meta.url);
} else {
  console.warn(
    '[webTemplatesResolver] Node.js %s does not support module hooks. ' +
      'The webTemplates resolve hooks were skipped.',
    process.version,
  );
}
