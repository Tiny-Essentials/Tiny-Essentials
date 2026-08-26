import { resolve } from 'path';
import { existsSync, copyFileSync } from 'fs';

/**
 * Plugin to copy index.html to 404.html for GitHub Pages compatibility.
 * @returns {import('vite').Plugin}
 */
export const copyIndexTo404 = () => {
  /** 
   * Variable to store the output directory captured from Vite
   * @type {string} 
   */
  let outDir;

  return {
    name: 'github-copy-index-to-404',
    // Capture Vite configuration to know the actual output directory
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      if (!outDir) return;
      const indexPath = resolve(outDir, 'index.html');
      const targetPath = resolve(outDir, '404.html');

      if (existsSync(indexPath)) {
        copyFileSync(indexPath, targetPath);
      }
    },
  };
};
