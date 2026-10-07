/**
 * Node.js port of the browser based TinyCookieConsent test environment
 * (`test/html/html/templates/TinyCookieConsent`).
 *
 * A minimal DOM + localStorage polyfill is installed before the module is
 * imported so the consent manager can be exercised outside of a real browser.
 *
 * @returns {Promise<number>}
 */

import { TestRunner, section, color } from './_helpers.mjs';
import { installDOM } from './_dom.mjs';

let document = installDOM().document;

// ---------------------------------------------------------------------------
// Minimal localStorage polyfill
// ---------------------------------------------------------------------------
class Storage {
  #data = new Map();
  getItem(key) {
    return this.#data.has(String(key)) ? this.#data.get(String(key)) : null;
  }
  setItem(key, value) {
    this.#data.set(String(key), String(value));
  }
  removeItem(key) {
    this.#data.delete(String(key));
  }
  clear() {
    this.#data.clear();
  }
}

globalThis.localStorage = new Storage();

const { default: TinyCookieConsent } =
  await import('../../dist/v1/libs/html/templates/TinyCookieConsent.mjs');

/**
 * Node.js port of the browser TinyCookieConsent test environment.
 * @returns {Promise<number>}
 */
const testCookieConsent = async () => {
  // Re-install the DOM: sibling test modules may have replaced the globals.
  document = installDOM().document;

  const t = new TestRunner('TinyCookieConsent');

  // -------------------------------------------------------------------
  // Construction & validation
  // -------------------------------------------------------------------
  section('TinyCookieConsent - construction', '🍪');
  t.throws(() => new TinyCookieConsent(), 'Rejects a missing config');
  t.throws(() => new TinyCookieConsent('nope'), 'Rejects a non-object config');

  const consent = new TinyCookieConsent({
    message: 'We use cookies.',
    categories: [
      { label: 'necessary', required: true, default: true },
      { label: 'analytics', required: false, default: false },
    ],
  });
  t.ok(consent instanceof TinyCookieConsent, 'Creates an instance');
  t.equal(consent.config.message, 'We use cookies.', 'Stores the config message');
  t.equal(consent.config.categories.length, 2, 'Stores the categories');
  t.equal(
    document.body.querySelectorAll('.cookie-consent-bar').length,
    1,
    'Renders the consent bar',
  );

  // -------------------------------------------------------------------
  // Config validation
  // -------------------------------------------------------------------
  section('TinyCookieConsent - validation', '🛡️');
  t.throws(() => (consent.config = { message: 5 }), 'Rejects a non-string message');
  t.throws(() => (consent.config = { categories: 'nope' }), 'Rejects non-array categories');
  t.throws(
    () => (consent.config = { categories: [{ label: 1, required: true, default: true }] }),
    'Rejects an invalid category',
  );
  t.throws(() => (consent.config = { onSave: 'nope' }), 'Rejects a non-function onSave');
  t.throws(() => (consent.config = { animationDuration: -1 }), 'Rejects a negative duration');
  t.throws(() => (consent.config = { renderBar: 5 }), 'Rejects an invalid renderBar');
  t.throws(() => (consent.config = { renderModal: 5 }), 'Rejects an invalid renderModal');

  // -------------------------------------------------------------------
  // Saving preferences
  // -------------------------------------------------------------------
  section('TinyCookieConsent - preferences', '💾');
  let saved = null;
  consent.config = { onSave: (prefs) => (saved = prefs) };
  consent.savePreferences({ analytics: true });
  t.deepEqual(saved, { analytics: true }, 'Calls onSave with the preferences');
  t.deepEqual(consent.preferences, { analytics: true }, 'Persists the preferences');
  t.throws(() => consent.isAllowed(5), 'isAllowed validates the category type');
  t.throws(() => consent.savePreferences('nope'), 'savePreferences validates the input');

  const restored = new TinyCookieConsent({
    storageKey: 'cookie-consent-preferences',
    categories: [{ label: 'analytics', required: false, default: false }],
  });
  t.equal(restored.isAllowed('analytics'), true, 'isAllowed reads the persisted value');
  t.equal(restored.isAllowed('missing'), false, 'isAllowed defaults to false');

  console.log(`\n${color('gray', 'TinyCookieConsent test-suite finished.')}`);

  return t.summary();
};

export default testCookieConsent;
