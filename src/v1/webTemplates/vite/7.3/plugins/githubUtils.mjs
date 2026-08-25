import { resolve } from 'path';
import { existsSync, copyFileSync } from 'fs';

/**
 * Plugin to copy index.html to 404.html for GitHub Pages compatibility.
 * @returns {import('vite').Plugin}
 */
export const copyIndexTo404 = () => {
  return {
    name: 'github-copy-index-to-404',
    closeBundle: () => {
      const distPath = resolve(__dirname, 'dist');
      const indexPath = resolve(distPath, 'index.html');
      const targetPath = resolve(distPath, '404.html');

      if (existsSync(indexPath)) {
        copyFileSync(indexPath, targetPath);
      }
    },
  };
};
