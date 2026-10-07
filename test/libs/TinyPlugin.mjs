/**
 * Node.js port of the browser based plugin test environments
 * (`test/html/plugin/*`).
 *
 * Covers:
 * - TinyVersion (semver parsing + comparison)
 * - createPluginIdChecker (deterministic identity string)
 * - TinyPluginCore / TinyPluginLayer (installation + access control)
 * - TinyHttpResponseRegistry (Node build)
 */

import { TestRunner, section, color } from './_helpers.mjs';

/**
 * TinyPluginCore -> TinyDebugger -> browserDetector reads `navigator.userAgent`.
 * Sibling test modules may have replaced `navigator` with a partial stub, so make
 * sure a `userAgent` string is always available before the plugin engine boots.
 */
const ensureNavigator = () => {
  if (typeof globalThis.navigator !== 'object' || globalThis.navigator === null) {
    globalThis.navigator = {};
  }
  if (typeof globalThis.navigator.userAgent !== 'string') {
    globalThis.navigator.userAgent = 'node';
  }
};

ensureNavigator();

const { default: TinyVersion } = await import('../../dist/v1/libs/plugin/TinyVersion.mjs');
const { createPluginIdChecker, TinyPluginCore, TinyPluginLayer } =
  await import('../../dist/v1/libs/plugin/TinyPlugin.mjs');
const { default: TinyHttpResponseRegistry } =
  await import('../../dist/v1/libs/tools/TinyHttpResponseRegistry/Node.mjs');

/**
 * Node.js port of the browser plugin test environments.
 * @returns {Promise<number>}
 */
const testPlugin = async () => {
  // Re-apply the polyfill: sibling test modules may have replaced `navigator`.
  ensureNavigator();

  const t = new TestRunner('TinyVersion');

  // -------------------------------------------------------------------
  // TinyVersion
  // -------------------------------------------------------------------
  section('TinyVersion - parsing', '🏷️');
  const v = new TinyVersion('1.25.3');
  t.equal(v.major, 1, 'Parses the major version');
  t.equal(v.minor, 25, 'Parses the minor version');
  t.equal(v.patch, 3, 'Parses the patch version');
  t.equal(v.tag, null, 'Has no tag by default');
  t.equal(v.toString(), '1.25.3', 'toString rebuilds the version');

  const tagged = new TinyVersion('2.0.1-beta');
  t.equal(tagged.tag, 'beta', 'Parses the pre-release tag');
  t.equal(tagged.toString(), '2.0.1-beta', 'toString keeps the tag');

  section('TinyVersion - comparison', '⚖️');
  t.equal(new TinyVersion('2.0.0').isGreaterThan(new TinyVersion('1.9.9')), true, 'isGreaterThan');
  t.equal(new TinyVersion('1.0.0').isLessThan(new TinyVersion('1.0.1')), true, 'isLessThan');
  t.equal(new TinyVersion('1.0.0').isEqualTo(new TinyVersion('1.0.0')), true, 'isEqualTo');
  t.equal(
    new TinyVersion('1.0.0').isGreaterThan(new TinyVersion('1.0.0-beta')),
    true,
    'Release outranks a pre-release',
  );
  t.throws(() => new TinyVersion(5), 'Rejects non-strings');
  t.throws(() => new TinyVersion('not-a-version'), 'Rejects malformed versions');
  t.throws(() => v.isGreaterThan('1.0.0'), 'Comparison requires a TinyVersion instance');

  // -------------------------------------------------------------------
  // createPluginIdChecker
  // -------------------------------------------------------------------
  section('createPluginIdChecker', '🪪');
  const a = createPluginIdChecker('my.plugin', ['Bob', 'Alice'], ['Util'], ['Tool']);
  const b = createPluginIdChecker('my.plugin', ['Alice', 'Bob'], ['Util'], ['Tool']);
  t.equal(a, b, 'Identity string is order independent');
  t.equal(JSON.parse(a).id, 'my.plugin', 'Identity string keeps the plugin id');
  t.throws(() => createPluginIdChecker(5, [], [], []), 'Rejects a non-string id');
  t.throws(() => createPluginIdChecker('x', 'nope', [], []), 'Rejects a non-array authors');

  // -------------------------------------------------------------------
  // TinyPluginCore / TinyPluginLayer
  // -------------------------------------------------------------------
  const p = new TestRunner('TinyPluginCore');
  section('TinyPluginCore - installation', '🔌');

  class TestEngine extends TinyPluginCore {
    constructor(config = {}) {
      super({
        logCfg: { id: '[test]', logger: console, debugMode: false },
        sandboxBlacklist: config.sandboxBlacklist,
        accessControl: config.accessControl || { mode: 'none' },
      });
    }
  }

  const identity = {
    id: 'valid.plugin',
    version: '1.0.0',
    description: 'Valid Plugin',
    authors: ['Tester'],
    contributors: ['Tester'],
    categories: ['Test'],
    tags: ['Test'],
  };

  const createInstaller = (data) => (sandbox) => {
    sandbox.id = data.id;
    sandbox.version = data.version;
    sandbox.description = data.description;
    sandbox.authors = data.authors;
    sandbox.contributors = data.contributors;
    sandbox.categories = data.categories;
    sandbox.tags = data.tags;
    return new TinyPluginLayer();
  };

  const core = new TestEngine();
  const plugin = core.installPlugin(createInstaller(identity), {});
  p.equal(plugin.isReady, true, 'Plugin is ready after installation');
  p.equal(core.getPlugin('valid.plugin'), plugin, 'getPlugin finds the installed plugin');
  p.equal(core.hasPlugin('valid.plugin'), true, 'hasPlugin finds the installed plugin');
  p.equal(core.hasPlugin('ghost'), false, 'hasPlugin is false for unknown plugins');

  p.throws(
    () =>
      core.installPlugin((sandbox) => {
        sandbox.id = 'bad.plugin';
        sandbox.version = '1.0.0';
        // description intentionally missing
        sandbox.authors = ['Tester'];
        sandbox.contributors = ['Tester'];
        sandbox.categories = ['Test'];
        sandbox.tags = ['Test'];
        return new TinyPluginLayer();
      }, {}),
    'Rejects a plugin with an incomplete identity',
  );

  section('TinyPluginCore - access control', '🔒');
  const whitelistCore = new TestEngine({
    accessControl: {
      mode: 'whitelist',
      whitelist: { ids: ['allowed.id'], authors: [], categories: [], tags: [] },
      blacklist: { ids: [], authors: [], categories: [], tags: [] },
    },
  });
  const allowed = whitelistCore.installPlugin(
    createInstaller({ ...identity, id: 'allowed.id' }),
    {},
  );
  p.equal(allowed.isReady, true, 'Whitelisted plugin installs');
  p.throws(
    () => whitelistCore.installPlugin(createInstaller({ ...identity, id: 'denied.id' }), {}),
    'Non-whitelisted plugin is rejected',
  );

  // -------------------------------------------------------------------
  // TinyHttpResponseRegistry (Node)
  // -------------------------------------------------------------------
  const r = new TestRunner('TinyHttpResponseRegistry');
  section('TinyHttpResponseRegistry', '🌐');
  const registry = new TinyHttpResponseRegistry();
  const notFound = registry.get(404);
  r.equal(notFound.name, 'Not Found', 'Ships with the default HTTP codes');
  r.equal(registry.get(200).name, 'OK', 'get() resolves a default code');
  r.equal(registry.get(999), null, 'get() returns null for unknown codes');

  registry.addResponse(999, { name: 'Custom', summary: 's', description: 'd' });
  r.equal(registry.get(999).name, 'Custom', 'addResponse registers a new code');
  r.equal(Object.keys(registry.getAll()).length > 0, true, 'getAll returns the registry');
  r.throws(() => registry.addResponse(1000, { name: 1 }), 'Validates the response shape');

  console.log(`\n${color('gray', 'Plugin test-suite finished.')}`);

  return t.summary() + p.summary() + r.summary();
};

export default testPlugin;
