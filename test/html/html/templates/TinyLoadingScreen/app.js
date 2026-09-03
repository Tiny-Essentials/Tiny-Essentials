import { TinyLoadingScreen } from '/src/v1/libs/html/templates/TinyLoadingScreen.mjs';
// Loader on body
const loader = new TinyLoadingScreen();
loader.defaultMessage = 'Loading...';
window.loader = loader;
loader.onChange = (status) => {
  console.log('[loader] status changed →', status);
};

// Loader inside a specific container
const loader2 = new TinyLoadingScreen(document.getElementById('custom-container'));
loader2.defaultMessage = 'Loading...';
window.loader2 = loader2;
loader2.onChange = (status) => {
  console.log('[loader2] status changed →', status);
};
