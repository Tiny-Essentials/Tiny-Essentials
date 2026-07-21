import TinyLevelUp from './libs/TinyLevelUp.mjs';
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
} from './basics/clock.mjs';
import {
  extendObjType,
  reorderObjTypeOrder,
  cloneObjTypeOrder,
  objType,
  checkObj,
  objTypeName,
  isObjType,
} from './basics/objFilter.mjs';
import { countObj, isJsonObject } from './basics/objChecker.mjs';
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
import ColorSafeStringify from './libs/ColorSafeStringify.mjs';
import TinyPromiseQueue from './libs/TinyPromiseQueue.mjs';
import TinyRateLimiter from './libs/TinyRateLimiter.mjs';
import TinyNotifyCenter from './libs/TinyNotifyCenter.mjs';
import TinyToastNotify from './libs/TinyToastNotify.mjs';
import {
  readJsonBlob,
  saveJsonFile,
  fetchJson,
  installWindowHiddenScript,
  readFileBlob,
  readBase64Blob,
  fetchText,
} from './basics/html.mjs';
import TinyDragDropDetector from './libs/TinyDragDropDetector.mjs';

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

import TinyDragger from './libs/TinyDragger.mjs';
import TinyDomReadyManager from './libs/TinyDomReadyManager.mjs';
import TinyNotifications from './libs/TinyNotifications.mjs';
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
  valMediaContentMetadataPartial,
} from './basics/mediaContent.mjs';
import TinyHtml from './libs/TinyHtml.mjs';
import TinyAfterScrollWatcher from './libs/TinyAfterScrollWatcher.mjs';
import UltraRandomMsgGen from './libs/UltraRandomMsgGen.mjs';
import TinySmartScroller from './libs/TinySmartScroller.mjs';
import TinyTextRangeEditor from './libs/TinyTextRangeEditor.mjs';
import TinyClipboard from './libs/TinyClipboard.mjs';
import TinyColorConverter from './libs/TinyColorConverter.mjs';
import TinyTimeout from './libs/TinyTimeout.mjs';
import TinyLocalStorage from './libs/TinyLocalStorage.mjs';
import TinyIframeEvents from './libs/TinyIframeEvents.mjs';
import TinyNewWinEvents from './libs/TinyNewWinEvents.mjs';
import TinyTextarea from './libs/TinyTextarea.mjs';
import TinyGamepad from './libs/TinyGamepad.mjs';
import TinyDayNightCycle from './libs/TinyDayNightCycle.mjs';
import TinyAdvancedRaffle from './libs/TinyAdvancedRaffle.mjs';
import TinyArrayPaginator from './libs/TinyArrayPaginator.mjs';
import TinyInventory from './libs/TinyInventory.mjs';
import TinyInventoryTrader from './libs/TinyInventoryTrader.mjs';
import TinyCookieConsent from './libs/TinyCookieConsent.mjs';
import TinyI18 from './libs/TinyI18.mjs';
import TinyNeedBar from './libs/TinyNeedBar.mjs';
import TinySimpleDice from './libs/TinySimpleDice.mjs';
import TinyElementObserver from './libs/TinyElementObserver.mjs';
import TinyLoadingScreen from './libs/TinyLoadingScreen.mjs';
import TinyColorValidator from './libs/TinyColorValidator.mjs';
import TinyAnalogClock from './libs/TinyAnalogClock.mjs';
import TinyTextDiffer from './libs/TinyTextDiffer.mjs';
import TinyArrayComparator from './libs/TinyArrayComparator.mjs';
import {
  FuzzySet,
  MamdaniInferenceSystem,
  trapezoid,
  defuzzifyCentroid,
} from './libs/TinyMamdaniInferenceSystem.mjs';
import TinyClassManager from './libs/TinyClassManager.mjs';
import TinyRadioFm from './libs/TinyRadioFm.mjs';
import TinyMediaPlayer from './libs/TinyMediaPlayer.mjs';
import { createCheckDestroyed } from './libs/utils.mjs';
// import TinyHtmlElems from './libs/TinyHtml/index.mjs';

export {
  TinyMediaPlayer,
  TinyRadioFm,
  TinyClassManager,
  FuzzySet,
  MamdaniInferenceSystem,
  TinyArrayComparator,
  TinyTextDiffer,
  TinyAnalogClock,
  // TinyHtmlElems,
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
  multiplyArrayBlocks,
  createCheckDestroyed,
  valMediaContentMetadata,
  valMediaContentMetadataPartial,
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
