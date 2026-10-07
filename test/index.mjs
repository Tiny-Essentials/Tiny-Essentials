import TinyPkgExportValidator from '../src/v1/libs/tools/TinyPkgExportValidator.mjs';

import testFolderManager from './fileManager/index.mjs';
import testColorSafeStringify from './libs/ColorSafeStringify.mjs';
import testLevelUp from './libs/TinyLevelUp.mjs';
import executeTinyPromiseQueue from './libs/TinyPromiseQueue.mjs';
import testRateLimit from './libs/TinyRateLimiter.mjs';
import executeObjType from './libs/objType.mjs';
import testI18 from './libs/TinyI18.mjs';
import testTinySiteMap from './libs/TinySiteMap.mjs';
import testTinyPasswordValidator from './libs/TinyPasswordValidator.mjs';
import executeCrypto from './libs/crypto.mjs';
import testArray from './libs/TinyArray.mjs';
import testColor from './libs/TinyColor.mjs';
import testMath from './libs/TinyMath.mjs';
import testSimpleMath from './libs/TinySimpleMath.mjs';
import testGame from './libs/TinyGame.mjs';
import testTextTools from './libs/TinyTextTools.mjs';
import testStorage from './libs/TinyStorage.mjs';
import testPlugin from './libs/TinyPlugin.mjs';
import testUtils from './libs/TinyUtils.mjs';
import testInventory from './libs/TinyInventory.mjs';
import testMedia from './libs/TinyMedia.mjs';
import testRouter from './libs/TinyRouter.mjs';
import testIPFSHasher from './libs/TinyIPFSHasher.mjs';
import testBrowserMonitor from './libs/TinyBrowserMonitor.mjs';
import testTextRangeEditor from './libs/TinyTextRangeEditor.mjs';
import testClipboard from './libs/TinyClipboard.mjs';
import testGamepad from './libs/TinyGamepad.mjs';
import testProcessSolidFilters from './libs/ProcessSolidFilters.mjs';
import testAfterScrollWatcher from './libs/TinyAfterScrollWatcher.mjs';
import testLoadingScreen from './libs/TinyLoadingScreen.mjs';
import testCookieConsent from './libs/TinyCookieConsent.mjs';
import testAnalogClock from './libs/TinyAnalogClock.mjs';
import testNotify from './libs/TinyNotify.mjs';
import testDragger from './libs/TinyDragger.mjs';
import testSmartScroller from './libs/TinySmartScroller.mjs';
import testEvents from './libs/TinyEvents.mjs';
import testTinyHtml from './libs/TinyHtml.mjs';
import testFs from './libs/fs.mjs';

new TinyPkgExportValidator('../package.json', '../')
  .execCommandTester(
    {
      fileManager: testFolderManager,
      objType: executeObjType,
      promiseQueue: executeTinyPromiseQueue,
      colorStringify: testColorSafeStringify,
      rateLimit: testRateLimit,
      levelUp: testLevelUp,
      sitemap: testTinySiteMap,
      crypto: executeCrypto,
      i18: testI18,
      pwValidator: testTinyPasswordValidator,
      array: testArray,
      color: testColor,
      math: testMath,
      simpleMath: testSimpleMath,
      game: testGame,
      textTools: testTextTools,
      storage: testStorage,
      plugin: testPlugin,
      utils: testUtils,
      inventory: testInventory,
      media: testMedia,
      router: testRouter,
      ipfsHasher: testIPFSHasher,
      browserMonitor: testBrowserMonitor,
      textRangeEditor: testTextRangeEditor,
      clipboard: testClipboard,
      gamepad: testGamepad,
      processSolidFilters: testProcessSolidFilters,
      afterScrollWatcher: testAfterScrollWatcher,
      loadingScreen: testLoadingScreen,
      cookieConsent: testCookieConsent,
      analogClock: testAnalogClock,
      notify: testNotify,
      dragger: testDragger,
      smartScroller: testSmartScroller,
      events: testEvents,
      html: testTinyHtml,
      fs: testFs,
    },
    process.argv,
  )
  .catch((err) => {
    console.error('TEST RUNNER ERROR:', err);
    process.exitCode = 1;
  })
  .finally(() => process.exit(process.exitCode || 0));
