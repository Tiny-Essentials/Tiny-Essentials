import path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add modules
const modules = [];
const addModule = (version, entry, library, isClass = false) => {
  const baseConfig = {
    entry,
    output: {
      path: path.resolve(__dirname, `dist/v${version}`),
      library,
      libraryTarget: 'window',
      libraryExport: isClass ? library : undefined,
    },
    optimization: {
      runtimeChunk: false,
      splitChunks: false,
    },
    plugins: [
      new NodePolyfillPlugin(),
      new webpack.ProvidePlugin({
        process: 'process/browser',
      }),
    ],
  };
  modules.push(
    // Non-minified version
    /** {
      ...baseConfig,
      mode: 'development',
      output: {
        ...baseConfig.output,
        filename: `${library}.js`,
      },
      optimization: {
        ...baseConfig.optimization,
        minimize: false,
      },
    }, */
    // Minified version
    {
      ...baseConfig,
      mode: 'production',
      output: {
        ...baseConfig.output,
        filename: `${library}.min.js`,
      },
      optimization: {
        ...baseConfig.optimization,
        minimize: true,
      },
    },
  );
};

// Main
addModule(1, './src/v1/index.mjs', 'TinyEssentials');
addModule(1, './src/v1/basics/index.mjs', 'TinyBasicsEs');
addModule(1, './src/v1/libs/TinyMamdaniInferenceSystem.mjs', 'TinyMaInSys');
addModule(1, './src/v1/build/TinyLevelUp.mjs', 'TinyLevelUp', true);
addModule(1, './src/v1/build/TinyPromiseQueue.mjs', 'TinyPromiseQueue', true);
addModule(1, './src/v1/build/ColorSafeStringify.mjs', 'ColorSafeStringify', true);
addModule(1, './src/v1/build/TinyRateLimiter.mjs', 'TinyRateLimiter', true);
addModule(1, './src/v1/build/TinyNotifyCenter.mjs', 'TinyNotifyCenter', true);
addModule(1, './src/v1/build/TinyToastNotify.mjs', 'TinyToastNotify', true);
addModule(1, './src/v1/build/TinyDragDropDetector.mjs', 'TinyDragDropDetector', true);
addModule(1, './src/v1/build/TinyUploadClicker.mjs', 'TinyUploadClicker', true);
addModule(1, './src/v1/build/TinyDomReadyManager.mjs', 'TinyDomReadyManager', true);
addModule(1, './src/v1/build/TinyDragger.mjs', 'TinyDragger', true);
addModule(1, './src/v1/build/TinyNotifications.mjs', 'TinyNotifications', true);
addModule(1, './src/v1/build/TinyHtml.mjs', 'TinyHtml', true);
addModule(1, './src/v1/build/TinyAfterScrollWatcher.mjs', 'TinyAfterScrollWatcher', true);
addModule(1, './src/v1/build/UltraRandomMsgGen.mjs', 'UltraRandomMsgGen', true);
addModule(1, './src/v1/build/TinySmartScroller.mjs', 'TinySmartScroller', true);
addModule(1, './src/v1/build/TinyTextRangeEditor.mjs', 'TinyTextRangeEditor', true);
addModule(1, './src/v1/build/TinyClipboard.mjs', 'TinyClipboard', true);
addModule(1, './src/v1/build/TinyColorConverter.mjs', 'TinyColorConverter', true);
addModule(1, './src/v1/build/TinyTimeout.mjs', 'TinyTimeout', true);
addModule(1, './src/v1/build/TinyEvents.mjs', 'TinyEvents', true);
addModule(1, './src/v1/build/TinyLocalStorage.mjs', 'TinyLocalStorage', true);
addModule(1, './src/v1/build/TinyIframeEvents.mjs', 'TinyIframeEvents', true);
addModule(1, './src/v1/build/TinyNewWinEvents.mjs', 'TinyNewWinEvents', true);
addModule(1, './src/v1/build/TinyTextarea.mjs', 'TinyTextarea', true);
addModule(1, './src/v1/build/TinyGamepad.mjs', 'TinyGamepad', true);
addModule(1, './src/v1/build/TinyDayNightCycle.mjs', 'TinyDayNightCycle', true);
addModule(1, './src/v1/build/TinyAdvancedRaffle.mjs', 'TinyAdvancedRaffle', true);
addModule(1, './src/v1/build/TinyArrayPaginator.mjs', 'TinyArrayPaginator', true);
addModule(1, './src/v1/build/TinyInventory.mjs', 'TinyInventory', true);
addModule(1, './src/v1/build/TinyInventoryTrader.mjs', 'TinyInventoryTrader', true);
addModule(1, './src/v1/build/TinyCookieConsent.mjs', 'TinyCookieConsent', true);
addModule(1, './src/v1/build/TinyI18.mjs', 'TinyI18', true);
addModule(1, './src/v1/build/TinyNeedBar.mjs', 'TinyNeedBar', true);
addModule(1, './src/v1/build/TinySimpleDice.mjs', 'TinySimpleDice', true);
addModule(1, './src/v1/build/TinyElementObserver.mjs', 'TinyElementObserver', true);
addModule(1, './src/v1/build/TinyLoadingScreen.mjs', 'TinyLoadingScreen', true);
addModule(1, './src/v1/build/TinyColorValidator.mjs', 'TinyColorValidator', true);
addModule(1, './src/v1/build/TinyAnalogClock.mjs', 'TinyAnalogClock', true);
addModule(1, './src/v1/build/TinyTextDiffer.mjs', 'TinyTextDiffer', true);
addModule(1, './src/v1/build/TinyArrayComparator.mjs', 'TinyArrayComparator', true);

export default modules;
