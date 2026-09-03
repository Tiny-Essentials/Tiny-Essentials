import { TinyCookieConsent } from '/src/v1/libs/html/templates/TinyCookieConsent.mjs';

const consent = new TinyCookieConsent({
  animationDuration: 2000,
  message: 'This site uses cookies to personalize content and analyze traffic.',
  categories: [
    { label: 'Necessary', required: true, default: true },
    { label: 'Analytics', required: false, default: true },
    { label: 'Ads', required: false, default: false },
    { label: 'Preferences', required: false, default: false },
  ],
  onSave: (prefs) => {
    console.log('Saved preferences:', prefs);
    document.body.insertAdjacentHTML(
      'beforeend',
      `
          <div id="pref_saved" style="position:fixed;top:10px;right:10px;background:#fff;padding:10px;border:1px solid #ccc;z-index:3000;border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,0.15)">
            <strong>Preferences Saved</strong><br>
            ${Object.entries(prefs)
              .map(([k, v]) => `${k}: ${v}`)
              .join('<br>')}
          </div>
        `,
    );
    setTimeout(() => {
      document.querySelectorAll('#pref_saved').forEach((el) => el.remove());
    }, 3000);
  },
});
window.tinyCookies = consent;
