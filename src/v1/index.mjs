import TinyLevelUp from './libs/game/TinyLevelUp.mjs';
import {
  diffArrayList,
  shuffleArray,
  arraySortPositions,
  multiplyArrayBlocks,
} from './basics/array.mjs';
import {
  breakdownDuration,
  formatCustomTimer,
  formatDayTimer,
  formatTimer,
  getTimeDuration,
  getUserTimeFormat,
} from './basics/clock.mjs';
import {
  extendObjType,
  reorderObjTypeOrder,
  cloneObjTypeOrder,
  objType,
  checkObj,
  objTypeName,
  isObjType,
  getObjTypeOrder,
} from './basics/objFilter.mjs';
import { countObj, isJsonObject, isValidObj } from './basics/objChecker.mjs';
import {
  documentIsFullScreen,
  isScreenFilled,
  requestFullScreen,
  exitFullScreen,
  isFullScreenMode,
  onFullScreenChange,
  offFullScreenChange,
} from './basics/fullScreen.mjs';
import {
  calculateMarketcap,
  compareMarketcap,
  formatBytes,
  genFibonacciSeq,
  getAge,
  getPercentage,
  getSimplePerc,
  ruleOfThree,
} from './basics/simpleMath.mjs';
import {
  addAiMarkerShortcut,
  diffStrings,
  diffObjList,
  safeTextTrim,
  toTitleCase,
  toTitleCaseLowerFirst,
  asyncReplace,
} from './basics/text.mjs';
import ColorSafeStringify from './libs/color/ColorSafeStringify.mjs';
import TinyPromiseQueue from './libs/utils/TinyPromiseQueue.mjs';
import TinyRateLimiter from './libs/math/TinyRateLimiter.mjs';
import TinyNotifyCenter from './libs/html/notification/TinyNotifyCenter.mjs';
import TinyToastNotify from './libs/html/notification/TinyToastNotify.mjs';
import {
  readJsonBlob,
  saveJsonFile,
  fetchJson,
  installWindowHiddenScript,
  readFileBlob,
  readBase64Blob,
  fetchText,
} from './basics/html.mjs';
import TinyDragDropDetector from './libs/html/drag/TinyDragDropDetector.mjs';

import {
  readJsonFile,
  writeJsonFile,
  ensureDirectory,
  clearDirectory,
  fileExists,
  dirExists,
  isDirEmpty,
  ensureCopyFile,
  tryDeleteFile,
  writeTextFile,
  listFiles,
  listDirs,
  fileSize,
  dirSize,
  backupFile,
  restoreLatestBackup,
  renameFileBatch,
  renameFileRegex,
  renameFileAddPrefixSuffix,
  renameFileNormalizeCase,
  renameFilePadNumbers,
  getLatestBackupPath,
} from './fileManager/normalFuncs.mjs';

import {
  listFilesAsync,
  listDirsAsync,
  clearDirectoryAsync,
  isDirEmptyAsync,
  fileSizeAsync,
  dirSizeAsync,
} from './fileManager/asyncFuncs.mjs';

import TinyDragger from './libs/html/drag/TinyDragger.mjs';
import TinyDomReadyManager from './libs/html/TinyDomReadyManager.mjs';
import TinyNotifications from './libs/html/notification/TinyNotifications.mjs';
import {
  areElsCollTop,
  areElsCollBottom,
  areElsCollLeft,
  areElsCollRight,
  areElsCollPerfTop,
  areElsCollPerfBottom,
  areElsCollPerfLeft,
  areElsCollPerfRight,
  areElsColliding,
  areElsPerfColliding,
  getElsColliding,
  getElsPerfColliding,
  getElsCollOverlap,
  getElsCollOverlapPos,
  getRectCenter,
  getElsRelativeCenterOffset,
  getElsCollDirDepth,
  getElsCollDetails,
} from './basics/collision.mjs';
import {
  extractMediaId3Tags,
  parseMediaMetadata,
  valMediaContentMetadata,
  valFetchMediaContent,
} from './basics/mediaContent.mjs';
import TinyHtml from './libs/html/TinyHtml.mjs';
import TinyAfterScrollWatcher from './libs/html/scroll/TinyAfterScrollWatcher.mjs';
import UltraRandomMsgGen from './libs/utils/UltraRandomMsgGen.mjs';
import TinySmartScroller from './libs/html/scroll/TinySmartScroller.mjs';
import TinyTextRangeEditor from './libs/text/TinyTextRangeEditor.mjs';
import TinyClipboard from './libs/text/TinyClipboard.mjs';
import TinyColorConverter from './libs/color/TinyColorConverter.mjs';
import TinyTimeout from './libs/math/TinyTimeout.mjs';
import TinyLocalStorage from './libs/storage/TinyLocalStorage.mjs';
import TinyIframeEvents from './libs/html/events/TinyIframeEvents.mjs';
import TinyNewWinEvents from './libs/html/events/TinyNewWinEvents.mjs';
import TinyTextarea from './libs/text/TinyTextarea.mjs';
import TinyGamepad from './libs/game/TinyGamepad.mjs';
import TinyDayNightCycle from './libs/game/TinyDayNightCycle.mjs';
import TinyAdvancedRaffle from './libs/math/TinyAdvancedRaffle.mjs';
import TinyArrayPaginator from './libs/array/TinyArrayPaginator.mjs';
import TinyInventory from './libs/game/TinyInventory.mjs';
import TinyInventoryTrader from './libs/game/TinyInventoryTrader.mjs';
import TinyCookieConsent from './libs/html/templates/TinyCookieConsent.mjs';
import TinyI18 from './libs/text/TinyI18.mjs';
import TinyNeedBar from './libs/game/TinyNeedBar.mjs';
import TinySimpleDice from './libs/math/TinySimpleDice.mjs';
import TinyElementObserver from './libs/html/TinyElementObserver.mjs';
import TinyLoadingScreen from './libs/html/templates/TinyLoadingScreen.mjs';
import TinyColorValidator from './libs/color/TinyColorValidator.mjs';
import TinyAnalogClock from './libs/html/templates/TinyAnalogClock.mjs';
import TinyTextDiffer from './libs/text/TinyTextDiffer.mjs';
import TinyArrayComparator from './libs/array/TinyArrayComparator.mjs';
import {
  FuzzySet,
  MamdaniInferenceSystem,
  trapezoid,
  defuzzifyCentroid,
} from './libs/math/TinyMamdaniInferenceSystem.mjs';
import TinyClassManager from './libs/tools/TinyClassManager.mjs';
import TinyRadioFm from './libs/media/TinyRadioFm.mjs';
import TinyMediaPlayer from './libs/media/TinyMediaPlayer.mjs';
import { createCheckDestroyed } from './libs/utils/tools.mjs';
import { createSingletonTask, waitForTrue } from './basics/promiseUtils.mjs';
import TinyDebugger from './libs/tools/TinyDebugger.mjs';
import {
  browserIs,
  getBrowserCssPrefix,
  getBrowserPings,
  getDuckTyping,
  isBrowserAgent,
} from './basics/browserDetector.mjs';
import TinyUploadClicker from './libs/html/upload/TinyUploadClicker.mjs';
import TinyPkgExportValidator from './libs/tools/TinyPkgExportValidator.mjs';
import { jsonFilter, jsonFilterRecursive, jsonFilterByKeys } from './basics/jsonFilter.mjs';
import TinyRouter from './libs/router/TinyRouter.mjs';
import TinyMapCache from './libs/router/TinyMapCache.mjs';
import { TinyServiceWorker } from './build/TinyServiceWorker.mjs';
import { makeSegmentExtractor, segmentExtractorV1 } from './regexp/SegmentExtractor.mjs';
import { TinyCloner } from './build/TinyCloner.mjs';
// import TinyHtmlElems from './libs/TinyHtml/index.mjs';

export {
  TinyCloner,
  TinyServiceWorker,
  TinyMapCache,
  TinyRouter,
  TinyDebugger,
  TinyMediaPlayer,
  TinyRadioFm,
  TinyClassManager,
  FuzzySet,
  MamdaniInferenceSystem,
  TinyArrayComparator,
  TinyTextDiffer,
  TinyAnalogClock,
  // TinyHtmlElems,
  TinyPkgExportValidator,
  TinyUploadClicker,
  TinyColorValidator,
  TinyLoadingScreen,
  TinyElementObserver,
  TinySimpleDice,
  TinyNeedBar,
  TinyI18,
  TinyCookieConsent,
  TinyInventory,
  TinyInventoryTrader,
  TinyArrayPaginator,
  TinyAdvancedRaffle,
  TinyDayNightCycle,
  TinyGamepad,
  TinyTextarea,
  TinyNewWinEvents,
  TinyIframeEvents,
  TinyLocalStorage,
  TinyTimeout,
  TinyColorConverter,
  TinyClipboard,
  TinyTextRangeEditor,
  TinySmartScroller,
  UltraRandomMsgGen,
  TinyAfterScrollWatcher,
  TinyHtml,
  TinyNotifications,
  TinyDomReadyManager,
  TinyDragger,
  TinyDragDropDetector,
  TinyToastNotify,
  TinyNotifyCenter,
  TinyRateLimiter,
  ColorSafeStringify,
  TinyPromiseQueue,
  TinyLevelUp,
  getObjTypeOrder,
  segmentExtractorV1,
  makeSegmentExtractor,
  jsonFilter,
  jsonFilterRecursive,
  jsonFilterByKeys,
  getUserTimeFormat,
  getBrowserPings,
  isBrowserAgent,
  getBrowserCssPrefix,
  getDuckTyping,
  browserIs,
  isValidObj,
  createSingletonTask,
  waitForTrue,
  multiplyArrayBlocks,
  createCheckDestroyed,
  valMediaContentMetadata,
  valFetchMediaContent,
  parseMediaMetadata,
  extractMediaId3Tags,
  defuzzifyCentroid,
  trapezoid,
  diffArrayList,
  diffStrings,
  diffObjList,
  breakdownDuration,
  calculateMarketcap,
  compareMarketcap,
  getPercentage,
  areElsCollTop,
  areElsCollBottom,
  areElsCollLeft,
  areElsCollRight,
  areElsCollPerfTop,
  areElsCollPerfBottom,
  areElsCollPerfLeft,
  areElsCollPerfRight,
  areElsColliding,
  areElsPerfColliding,
  getElsColliding,
  getElsPerfColliding,
  getElsCollOverlap,
  getElsCollOverlapPos,
  getRectCenter,
  getElsRelativeCenterOffset,
  getElsCollDirDepth,
  getElsCollDetails,
  safeTextTrim,
  installWindowHiddenScript,
  genFibonacciSeq,
  isDirEmptyAsync,
  fileSizeAsync,
  dirSizeAsync,
  listFilesAsync,
  listDirsAsync,
  getLatestBackupPath,
  fetchJson,
  fetchText,
  readJsonBlob,
  readFileBlob,
  readBase64Blob,
  saveJsonFile,
  readJsonFile,
  writeJsonFile,
  ensureDirectory,
  clearDirectoryAsync,
  clearDirectory,
  fileExists,
  dirExists,
  isDirEmpty,
  ensureCopyFile,
  tryDeleteFile,
  writeTextFile,
  listFiles,
  listDirs,
  fileSize,
  dirSize,
  backupFile,
  restoreLatestBackup,
  renameFileBatch,
  renameFileRegex,
  renameFileAddPrefixSuffix,
  renameFileNormalizeCase,
  renameFilePadNumbers,
  documentIsFullScreen,
  isScreenFilled,
  requestFullScreen,
  exitFullScreen,
  isFullScreenMode,
  onFullScreenChange,
  offFullScreenChange,
  isJsonObject,
  arraySortPositions,
  formatBytes,
  addAiMarkerShortcut,
  extendObjType,
  reorderObjTypeOrder,
  cloneObjTypeOrder,
  countObj,
  checkObj,
  objTypeName,
  isObjType,
  objType,
  ruleOfThree,
  getSimplePerc,
  asyncReplace,
  getAge,
  formatCustomTimer,
  formatDayTimer,
  formatTimer,
  getTimeDuration,
  shuffleArray,
  toTitleCase,
  toTitleCaseLowerFirst,
};
