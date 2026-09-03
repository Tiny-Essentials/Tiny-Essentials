import { TinyAfterScrollWatcher } from '/src/v1/libs/html/scroll/TinyAfterScrollWatcher.mjs';
window.TinyAfterScrollWatcher = TinyAfterScrollWatcher;

// Watcher for the whole window
const windowWatcher = new TinyAfterScrollWatcher(window);
window.windowWatcher = windowWatcher;
windowWatcher.onStop(() => console.log('[window] Scroll stopped!'));

// Watcher for the scrollable div
const customBox = document.getElementById('customBox');
const boxWatcher = new TinyAfterScrollWatcher(customBox);
window.boxWatcher = boxWatcher;

boxWatcher.onScroll(() =>
  boxWatcher.doAfterScroll(() => {
    console.log('[customBox] Scroll stopped!');
  }),
);
