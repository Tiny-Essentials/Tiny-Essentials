# 🍴 TinyFork CLI (BETA)

**The smart, AST-powered tree-shaking extractor for `tiny-essentials`.**

Welcome to TinyFork! This is a friendly command-line interface (CLI) designed to extract specific functions, classes, and modules from the `tiny-essentials` library. Instead of forcing you to bundle the entire library into your project, TinyFork performs a deep Abstract Syntax Tree (AST) analysis to cherry-pick exactly what you need. It automatically resolves and extracts all necessary local dependencies, imports, and jsDocs without bringing in any dead code.

### 📦 Prerequisites

Before running TinyFork, make sure you have the required Babel core packages installed in your project so the AST parsing can work its magic:
```bash
npm install @babel/core @babel/parser @babel/traverse @babel/generator @babel/types
```

## ✨ Key Features

* 🌳 **Deep Tree-Shaking:** Uses `@babel/parser` to deeply trace your code. If you extract one function, TinyFork automatically finds and includes its dependencies (variables, other functions, dynamic imports) while leaving the rest behind.
* 📁 **Structure Mirroring:** Extracted files are automatically saved maintaining their original folder structure inside your project, preventing naming conflicts and keeping imports clean.
* 🧩 **Smart Class Extraction:** Can extract static methods from default exported classes and convert them into clean, standalone functions.
* 🔄 **Version Fallback:** Automatically scans for the requested files starting from the latest version down to `v1`. You can also explicitly request a specific version.

---

## 🚀 Usage

You can run TinyFork directly using `npx` from any project that has `tiny-essentials` installed.

**Basic Syntax:**
```bash
npx tiny-essentials-fork [--out-dir=custom/path] <target1> [target2] ...
```

By default, all files are extracted to: `./vendor/tiny-essentials/` at the root of your project.

---

## 📖 Examples & Capabilities

### 1. Extracting a Full File
If you want to extract an entire JavaScript module, simply provide the path to the file (without the extension). TinyFork will extract it and automatically trace all of its internal imports!

```bash
npx tiny-essentials-fork basics/array
```
*Result:* Creates `vendor/tiny-essentials/basics/array.mjs` and includes any other internal modules that `array.mjs` depends on.

### 2. Extracting Specific Functions
To extract only specific exports from a file, append them to the path separated by commas. 

```bash
npx tiny-essentials-fork basics/array/multiplyArrayBlocks,diffArrayList
```
*Result:* Extracts **only** `multiplyArrayBlocks` and `diffArrayList` (and their specific local dependencies) from the `basics/array.mjs` file, discarding all other unused functions.

### 3. Extracting Static Methods from a Class
If a module exports a default class filled with static methods, you can extract those methods just like regular functions. TinyFork will intelligently detach them from the class and export them as standalone functions!

```bash
npx tiny-essentials-fork libs/array/TinyArrayComparator/generateHash
```

### 4. Extracting Multiple Targets at Once
You can queue as many targets as you want in a single command. TinyFork will orchestrate the entire extraction, mapping all dependencies together.

```bash
npx tiny-essentials-fork libs/html/TinyHtml basics/array/multiplyArrayBlocks libs/array/TinyArrayComparator/generateHash
```

### 5. Specifying a Library Version
If you need a file from a specific version of `tiny-essentials` (e.g., `v1`), prepend the version number to the path. If no version is specified, TinyFork starts searching from the latest version downwards.

```bash
npx tiny-essentials-fork v1/basics/array/multiplyArrayBlocks
```

### 6. Using a Custom Output Directory
Don't want to use the default `vendor/tiny-essentials` folder? Use the `--out-dir` flag to specify your own path.

```bash
npx tiny-essentials-fork --out-dir=src/assets/tiny-modules basics/array
```

---

## ⚙️ How it Works Under the Hood

1. **Target Parsing:** TinyFork reads your CLI arguments and resolves the correct file path and version inside the `tiny-essentials/dist` folder.
2. **Dependency Tracing (Bottom-Up):** Using Babel, it builds an AST of the requested file. It traces all identifiers used by your target functions, finding exactly which local variables and internal imports are required to make them work.
3. **Surgical Pruning:** It removes all AST nodes (dead code) that are not part of the required trace.
4. **Formatting & Output:** The optimized AST is generated back into standard JavaScript (preserving your original `jsDoc` comments) and written to your project's file system, perfectly mirroring the original directory structure.
