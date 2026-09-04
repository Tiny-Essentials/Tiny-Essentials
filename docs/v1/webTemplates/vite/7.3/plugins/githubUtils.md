# 🚀 GitHub Pages SPA Support Plugin

This project provides a lightweight **Vite plugin** designed specifically for developers deploying **Single Page Applications (SPAs)** to **GitHub Pages**.

## 📋 Overview

When using client-side routing (like `react-router` or `vue-router`) on GitHub Pages, a common issue occurs: if a user refreshes the page on a sub-route (e.g., `your-site.com/about`), GitHub Pages will look for a file at `/about/index.html`. Since that file doesn't exist in a standard SPA build, the user sees a **404 Error**.

This plugin solves that by automatically creating a `404.html` file that is an exact copy of your `index.html`. When GitHub encounters a 404, it serves this file instead, allowing your JavaScript router to take over and load the correct page. ✨

---

## 🛠️ Installation & Setup

Follow these steps to integrate the plugin into your Vite project.

### 1. Register the Plugin in Vite ⚙️
Open your `vite.config.js` file and import the function you just created. Add it to the `plugins` array.

```javascript
import { defineConfig } from 'vite';
import { copyIndexToGithub404 } from 'tiny-essentials/webTemplates/vite/7.3/plugins/githubUtils';

export default defineConfig({
  plugins: [
    // ... your other plugins (e.g., react(), vue())
    copyIndexToGithub404()
  ],
  // Your other Vite configurations
});
```

---

## 🚀 Daily Workflow

Once this is set up, your workflow remains exactly the same:

1.  **Develop:** Work on your application as usual.
2.  **Build:** Run your build command (usually `npm run build`).
3.  **Deploy:** Push your code to GitHub. 
    *   The plugin will have automatically generated the `404.html` inside your `dist` (or configured output) folder.
    *   GitHub Pages will now handle your routes correctly! ✅

---

## ⚠️ Troubleshooting

*   **Check your `outDir`:** If you have customized your build output directory in `vite.config.js`, the plugin will automatically detect it, but ensure you haven't disabled the build process.
*   **Manual Check:** After running `npm run build`, check your `dist` folder. You should see both `index.html` and `404.html` side-by-side.
