# 📁 Node.js File & Directory Utilities

A powerful and flexible utility toolkit for managing files and directories in Node.js using `fs` and `path`. Includes support for JSON operations, text handling, backups, renaming strategies, and more!

---

## 📑 Table of Contents

- [📦 JSON Operations](#-json-operations)
  - [`readJsonFile(filePath: string): any`](#readjsonfilefilepath-string-any)
  - [`writeJsonFile(filePath: string, data: any, spaces: number = 2): void`](#writejsonfilefilepath-string-data-any-spaces-number--2-void)
- [📂 Directory Management](#-directory-management)
  - [`ensureDirectory(dirPath: string): void`](#ensuredirectorydirpath-string-void)
  - [`clearDirectory(dirPath: string): void`](#cleardirectorydirpath-string-void)
- [🧪 File Checks](#-file-checks)
  - [`fileExists(filePath: string): boolean`](#fileexistsfilepath-string-boolean)
  - [`dirExists(dirPath: string): boolean`](#direxistsdirpath-string-boolean)
  - [`isDirEmpty(dirPath: string): boolean`](#isdiremptydirpath-string-boolean)
- [📄 File Operations](#-file-operations)
  - [`ensureCopyFile(src: string, dest: string): void`](#ensurecopyfilesrc-string-dest-string-void)
  - [`tryDeleteFile(filePath: string): boolean`](#trydeletefilefilepath-string-boolean)
- [📝 Text Operations](#-text-operations)
  - [`writeTextFile(filePath: string, content: string, ops?: fs.WriteFileOptions): void`](#writetextfilefilepath-string-content-string-ops-fswritefileoptions-void)
- [🧾 Directory Listings](#-directory-listings)
  - [`listFiles(dirPath: string, recursive?: boolean): string[]`](#listfilesdirpath-string-recursive-boolean-string)
  - [`listDirs(dirPath: string, recursive?: boolean): string[]`](#listdirsdirpath-string-recursive-boolean-string)
- [📏 File Info](#-file-info)
  - [`fileSize(filePath: string): number`](#filesizefilepath-string-number)
  - [`dirSize(dirPath: string): number`](#dirsizedirpath-string-number)
- [💾 Backup Utilities](#-backup-utilities)
  - [`backupFile(filePath: string, ext: string = 'bak'): void`](#backupfilefilepath-string-ext-string--bak-void)
  - [`getLatestBackupPath(filePath: string, ext: string = 'bak'): void`](#getlatestbackuppathfilepath-string-ext-string--bak-void)
  - [`restoreLatestBackup(filePath: string, ext: string = 'bak'): void`](#restorelatestbackupfilepath-string-ext-string--bak-void)
- [🔄 Rename Utilities](#-rename-utilities)
  - [`renameFileBatch(dirPath, renameFn, extensions?)`](#renamefilebatchdirpath-renamefn-extensions)
  - [`renameFileRegex(dirPath, pattern, replacement, extensions?)`](#renamefileregexdirpath-pattern-replacement-extensions)
  - [`renameFileAddPrefixSuffix(dirPath, { prefix, suffix }, extensions?)`](#renamefileaddprefixsuffixdirpath--prefix-suffix--extensions)
  - [`renameFileNormalizeCase(dirPath, mode, extensions?, normalizeExt: boolean = false)`](#renamefilenormalizecasedirpath-mode-extensions-normalizeext-boolean--false)
  - [`renameFilePadNumbers(dirPath, totalDigits, extensions?)`](#renamefilepadnumbersdirpath-totaldigits-extensions)
- [🔡 `renameFileNormalizeCase(dirPath, mode = 'lower', extensions = [])`](#-renamefilenormalizecasedirpath-mode--lower-extensions--)
  - [📥 Parameters:](#-parameters)
  - [🎯 Example:](#-example)
- [🔢 `renameFilePadNumbers(dirPath, totalDigits = 3, extensions = [])`](#-renamefilepadnumbersdirpath-totaldigits--3-extensions--)
  - [📥 Parameters:](#-parameters)
  - [🎯 Example:](#-example)
  - [🧠 Notes:](#-notes)
- [📦 More Example Use](#-more-example-use)

---

## 📦 JSON Operations

### `readJsonFile(filePath: string): any`

📖 Reads and parses a JSON file.

* Throws an error if the file doesn't exist or contains invalid JSON.
* Async version: `readJsonFileAsync`.

### `writeJsonFile(filePath: string, data: any, spaces: number = 2): void`

💾 Saves a JavaScript object as a formatted JSON file.

* Automatically creates the directory if it doesn't exist.
* Async version: `writeJsonFileAsync`.

---

## 📂 Directory Management

### `ensureDirectory(dirPath: string): void`

🛠️ Ensures a directory exists. Creates it recursively if needed.

### `clearDirectory(dirPath: string): void`

🧹 Deletes all contents inside a directory while keeping the directory itself.

* Async version: `clearDirectoryAsync`.

---

## 🧪 File Checks

### `fileExists(filePath: string): boolean`

🔎 Checks if a file exists.

### `dirExists(dirPath: string): boolean`

🏢 Checks if a directory exists.

### `isDirEmpty(dirPath: string): boolean`

📭 Checks if a directory is empty.

* Async version: `isDirEmptyAsync`.

---

## 📄 File Operations

### `ensureCopyFile(src: string, dest: string): void`

📋 Copies a file from `src` to `dest`, ensuring the destination directory exists.

* Async version: `ensureCopyFileAsync`.

### `tryDeleteFile(filePath: string): boolean`

🗑️ Tries to delete a file if it exists. Returns `true` if deleted.

* Async version: `tryDeleteFileAsync`.

---

## 📝 Text Operations

### `writeTextFile(filePath: string, content: string, ops?: fs.WriteFileOptions): void`

✍️ Writes text content to a file. Ensures the directory exists before writing.

* Async version: `writeTextFileAsync`.

---

## 🧾 Directory Listings

### `listFiles(dirPath: string, recursive?: boolean): string[]`

📃 Lists all files and dirs in a directory. Can be recursive.

* Async version: `listFilesAsync`.

### `listDirs(dirPath: string, recursive?: boolean): string[]`

📁 Lists all directories in a directory. Can be recursive.

* Async version: `listDirsAsync`.

---

## 📏 File Info

### `fileSize(filePath: string): number`

⚖️ Gets the size of a single file in bytes.

* Async version: `fileSizeAsync`.

### `dirSize(dirPath: string): number`

📦 Gets the total size of all files inside a directory (recursive).

* Async version: `dirSizeAsync`.

---

## 💾 Backup Utilities

### `backupFile(filePath: string, ext: string = 'bak'): void`

🛟 Creates a timestamped `.bak` copy of the file.

* Async version: `backupFileAsync`.

### `getLatestBackupPath(filePath: string, ext: string = 'bak'): void`

📦 Returns the **most recent backup file path** for a given file, without modifying anything. Useful for checking which backup would be restored.

### `restoreLatestBackup(filePath: string, ext: string = 'bak'): void`

♻️ Restores the most recent backup for the file.

Output: `/home/yasmin/notes.txt.bak.20250625T153000`

```
<file name>.<ext>.<timestamp>
```

* Async version: `restoreLatestBackupAsync`.

---

## 🔄 Rename Utilities

### `renameFileBatch(dirPath, renameFn, extensions?)`

🧠 Renames all files using a custom renaming function.

* Only affects files with the specified extensions (if any).

### `renameFileRegex(dirPath, pattern, replacement, extensions?)`

🔡 Renames files using a regex pattern and replacement string.

### `renameFileAddPrefixSuffix(dirPath, { prefix, suffix }, extensions?)`

🔠 Adds a prefix and/or suffix to each filename.

### `renameFileNormalizeCase(dirPath, mode, extensions?, normalizeExt: boolean = false)`

🆎 Converts filenames to lowercase or uppercase.

* `mode`: `'lower'` or `'upper'`.

### `renameFilePadNumbers(dirPath, totalDigits, extensions?)`

🔢 Pads the first numeric sequence in a filename with leading zeros.

---

## 🔡 `renameFileNormalizeCase(dirPath, mode = 'lower', extensions = [])`

Normalizes all filenames in a directory to lowercase or uppercase.

### 📥 Parameters:

* `dirPath` *(string)*: Path to the target directory.
* `mode` *(`'lower' | 'upper'`)*: Case conversion mode.

  * `'lower'`: Converts filenames to lowercase.
  * `'upper'`: Converts filenames to uppercase.
* `extensions` *(string\[])* *(optional)*: List of file extensions to filter. If provided, only files with these extensions will be renamed.

### 🎯 Example:

```js
renameFileNormalizeCase('./images', 'lower', ['.jpg', '.png']);
```

🔁 **Effect**:
`Photo01.JPG` → `photo01.jpg`
`Logo.PNG` → `logo.png`

---

## 🔢 `renameFilePadNumbers(dirPath, totalDigits = 3, extensions = [])`

Pads the first numeric sequence found in each filename to a specified number of digits.

### 📥 Parameters:

* `dirPath` *(string)*: Path to the target directory.
* `totalDigits` *(number)*: Minimum number of digits. Numbers will be padded with leading zeros.
* `extensions` *(string\[])* *(optional)*: Only rename files with matching extensions.

### 🎯 Example:

```js
renameFilePadNumbers('./screenshots', 4, ['.jpg']);
```

🔁 **Effect**:
`screenshot1.jpg` → `screenshot0001.jpg`
`photo23.jpg` → `photo0023.jpg`

### 🧠 Notes:

* Only the **first** number in the filename is affected.
* If a filename has no digits, it will not be changed.

---

## 📦 More Example Use

```js
import { readJsonFile, writeJsonFile, listFiles, backupFile } from 'tiny-essentials/fileManager';

const data = readJsonFile('./config/settings.json');
data.debug = false;
writeJsonFile('./config/settings.json', data);

const files = listFiles('./src/assets', true);
console.log('Found files:', files);

backupFile('./config/settings.json');
```
