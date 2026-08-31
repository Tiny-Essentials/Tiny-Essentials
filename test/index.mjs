import testFolderManager from './fileManager/index.mjs';
import testColorSafeStringify from './libs/ColorSafeStringify.mjs';
import testLevelUp from './libs/TinyLevelUp.mjs';
import executeTinyPromiseQueue from './libs/TinyPromiseQueue.mjs';
import testRateLimit from './libs/TinyRateLimiter.mjs';
import executeObjType from './libs/objType.mjs';
import testI18 from './libs/TinyI18.mjs';
import testTinySiteMap from './libs/TinySiteMap.mjs';
import TinyPkgExportValidator from '../src/v1/libs/tools/TinyPkgExportValidator.mjs';

new TinyPkgExportValidator('../package.json', '../')
  .execCommandTester({
    fileManager: testFolderManager,
    objType: executeObjType,
    promiseQueue: executeTinyPromiseQueue,
    colorStringify: testColorSafeStringify,
    rateLimit: testRateLimit,
    levelUp: testLevelUp,
    sitemap: testTinySiteMap,
    i18: testI18,
  })
  .finally(() => process.exit(0));
