/**
 * @fileoverview Registers the `webTemplates` resolve hooks for the Node.js test-suite.
 *
 * Usage:
 *   node --import ./test/registerWebTemplatesResolver.mjs test/index.mjs
 *
 * Uses `module.registerHooks()` (synchronous, in-thread) instead of the
 * deprecated `module.register()`.
 *
 * @see ./webTemplatesResolver.mjs
 */
import { registerHooks } from 'node:module';

import { resolve } from './webTemplatesResolver.mjs';

registerHooks({ resolve });
