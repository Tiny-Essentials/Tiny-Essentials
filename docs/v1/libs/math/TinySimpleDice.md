# 🎲 TinySimpleDice

A **lightweight, flexible dice rolling utility** for generating random numbers.  
You can configure the dice to **allow zero**, set a **maximum value**, and even roll values suitable for **indexing arrays or Sets**.

---

## ⚙️ Class: `TinySimpleDice`

### Properties

| Property    | Type    | Description                       |
| ----------- | ------- | --------------------------------- |
| `maxValue`  | number  | Maximum value the dice can roll.  |
| `allowZero` | boolean | Whether 0 is allowed as a result. |

---

### Constructor

```js
new TinySimpleDice({ maxValue, allowZero = true });
```

**Parameters**

| Name        | Type    | Description                                             |
| ----------- | ------- | ------------------------------------------------------- |
| `maxValue`  | number  | Maximum value the dice can roll (non-negative integer). |
| `allowZero` | boolean | Optional. If `true`, 0 is allowed; default is `true`.   |

**Throws**

* `TypeError` if `maxValue` is not a non-negative integer.
* `TypeError` if `allowZero` is not a boolean.

**Example**

```js
const dice = new TinySimpleDice({ maxValue: 6, allowZero: false });
```

---

### Getters & Setters

#### `maxValue`

* **Getter**: Returns the maximum value of the dice.
* **Setter**: Sets a new maximum value (must be a non-negative integer).
* **Throws**: `TypeError` if invalid.

```js
console.log(dice.maxValue); // 6
dice.maxValue = 10;          // Update maximum value
```

#### `allowZero`

* **Getter**: Returns whether 0 is allowed.
* **Setter**: Sets whether 0 is allowed.
* **Throws**: `TypeError` if not a boolean.

```js
console.log(dice.allowZero); // false
dice.allowZero = true;       // Allow zero
```

---

### Methods

#### `roll()`

Rolls the dice according to the configuration.

```js
const result = dice.roll();
console.log(result); // Random number between 1 and 6 (or 0 if allowZero)
```

**Returns:** `number` — the rolled value.

---

#### `static rollArrayIndex(arr)`

Rolls a value suitable for indexing an **array** or **Set**.

```js
const fruits = ['apple', 'banana', 'cherry'];
const index = TinySimpleDice.rollArrayIndex(fruits);
console.log(fruits[index]); // Random fruit
```

**Parameters:**

| Name | Type              | Description                |
| ---- | ----------------- | -------------------------- |
| arr  | array or Set<any> | The array or Set to index. |

**Returns:** `number` — a valid index.

**Throws:** `TypeError` if input is not an array or Set.

---

#### 🧮 `static _safeEvaluate(expression)`

A strict mathematical parser supporting:

* `+ - * / %`
* Parentheses
* Decimals & fractions
* Exponentiation (`^` or `**`)

Validates every character before evaluating.

```js
/**
 * Safely evaluates a mathematical expression...
 */
```

##### Throws

* `Error` on invalid characters
* `Error` on malformed math expressions

---

#### 🔄 `static replaceValues(input, values)`

Replaces occurrences of dice tokens (`d6`, `d20`, etc.) with corresponding numbers.

Useful internally when reconstructing expressions.

---

#### 🔄 `static tokenizeValues(input, values)`

Tokenizes an expression while replacing dice tokens (`d6`, `3d6`, etc.) with numeric results.

Useful internally when rebuilding or evaluating expressions, since dice rolls are converted into numeric tokens and the rest of the expression is split into operator/number tokens.

---

#### 🔍 `static parseString(input)`

Parses comma-separated dice expressions such as:

* `"d6"`
* `"3d12"`
* `"8d100"`
* `"d6 + 3"` (modifier support)
* `"2d6 * (1 + d4)"`
* `(0 | 1 | d4)` → randomly selects one option

##### Returns:

```ts
{
  sides: { count: number; sides: number }[],
  modifiers: { index: number; original: string; expression: string }[]
}
```

##### Features:

* Supports multi-dice groups
* Recognizes and resolves random-choice groups like `(1 | d6 | 3)`
* Preserves original and final expression

---

#### 🎛️ `static applyModifiers(values, modifiers)`

Applies modifier expressions to a sequence of dice results.

##### Values Format

```ts
(number | { value: number, sides: number })[]
```

You can provide:

* Raw numbers
* Structured dice results for validation

##### Returns

A full `ApplyDiceModifiersResult` with:

* `final`
* `steps[]`

##### Validates:

* Dice values cannot exceed their maximum sides
* Modifier expressions must be math-safe
* Dice tokens are mapped correctly to their evaluated slots

---

## 📝 Examples

```js
// -----------------------------------------------------------
// Basic Dice Usage
// -----------------------------------------------------------

// Create dice
const dice = new TinySimpleDice({ maxValue: 12, allowZero: true });

// Roll dice
console.log(dice.roll()); // e.g., 0–12

// Update dice configuration
dice.maxValue = 20;
dice.allowZero = false;

console.log(dice.roll()); // e.g., 1–20

// -----------------------------------------------------------
// Rolling Random Array / Set Index
// -----------------------------------------------------------

// Roll for an array index
const colors = ['red', 'green', 'blue', 'yellow'];
const idx = TinySimpleDice.rollArrayIndex(colors);
console.log(colors[idx]); // Random color

// Roll for a Set
const mySet = new Set([10, 20, 30]);
console.log(TinySimpleDice.rollArrayIndex(mySet)); // 0–2 index

// -----------------------------------------------------------
// Parsing Dice Strings
// -----------------------------------------------------------

const parsed = TinySimpleDice.parseString("3d6, d8, (0 | 1 | d4)");

console.log(parsed.sides);
// [
//   { count: 3, sides: 6 },
//   { count: 1, sides: 8 },
//   { count: 1, sides: 4 }  // only if d4 was chosen
// ]

console.log(parsed.modifiers);
// [
//   { index: 0, original: "3d6", expression: "3d6" },
//   { index: 1, original: "d8", expression: "d8" },
//   { index: 2, original: "(0 | 1 | d4)", expression: "1" } // example chosen value
// ]


// -----------------------------------------------------------
// Using replaceValues
// -----------------------------------------------------------

const replaced = TinySimpleDice.replaceValues("d6 + d6 + d6", [4, 2, 1]);
console.log(replaced); // "4 + 2 + 1"


// -----------------------------------------------------------
// Applying Modifiers (Simple Example)
// -----------------------------------------------------------

const bases = [4]; // example: rolled a d6 and got 4

const modifiersSimple = [
  { expression: "x + 2", original: "x + 2" } // demonstration of using constants
];

modifiersSimple[0].expression = "4 + 2"; // normally you'd build dynamically

const resultSimple = TinySimpleDice.applyModifiers(bases, modifiersSimple);

console.log(resultSimple);
// {
//   final: 6,
//   steps: [
//     { tokens, rawTokensP, rawTokens, total: 6, ... }
//   ]
// }


// -----------------------------------------------------------
// Applying Modifiers (Full Dice Expressions)
// -----------------------------------------------------------

// Step 1: Parse user input
const parsed2 = TinySimpleDice.parseString("2d6, d8 + 2, (1 | d4) * 3");

// Step 2: Roll all dice
// Assume the parsed result gave us: 2d6, 1d8, 1d4
const allValues = [
  { value: 5, sides: 6 }, // first d6
  { value: 2, sides: 6 }, // second d6
  { value: 7, sides: 8 }, // d8
  { value: 3, sides: 4 }  // d4 chosen in (1 | d4)
];

// Step 3: Apply modifiers
const resultAdv = TinySimpleDice.applyModifiers(
  allValues,
  parsed2.modifiers
);

console.log(resultAdv.final); // e.g., 5+2 + (7+2) + (3*3) = 5+2 + 9 + 9 = 25


// -----------------------------------------------------------
// Inspecting Modifier Steps (Debugging)
// -----------------------------------------------------------

resultAdv.steps.forEach((step, i) => {
  console.log(`--- Step #${i + 1} ---`);
  console.log("Tokens:", step.tokens);
  console.log("Raw tokens:", step.rawTokens);
  console.log("Raw dice slots:", step.rawDiceTokenSlots);
  console.log("Normalized dice slots:", step.diceTokenSlots);
  console.log("Dice results:", step.dicesResult);
  console.log("Subtotal:", step.total);
});


// -----------------------------------------------------------
// Example: Evaluating a Complex RPG-Style Expression
// -----------------------------------------------------------

const parsed3 = TinySimpleDice.parseString("3d6 + (d4 * 2), d20, 2d8 + (0 | 1 | d6)");

const allValues3 = [
  { value: 6, sides: 6 }, // 3d6
  { value: 3, sides: 6 },
  { value: 2, sides: 6 },

  { value: 3, sides: 4 }, // d4 for the multiplier

  { value: 17, sides: 20 }, // d20

  { value: 7, sides: 8 }, // 2d8
  { value: 5, sides: 8 },

  { value: 4, sides: 6 } // chosen from (0 | 1 | d6)
];

const resultRPG = TinySimpleDice.applyModifiers(allValues3, parsed3.modifiers);

console.log("Final total:", resultRPG.final);

console.log("Detailed steps:");
console.log(JSON.stringify(resultRPG.steps, null, 2));


// -----------------------------------------------------------
// Example: Building a Log String for UI / Chat
// -----------------------------------------------------------

function buildDiceLog(result) {
  let out = "Dice Roll Summary:\n";

  result.steps.forEach((s, i) => {
    const rolled = s.dicesResult
      .map((arr) => `[${arr.join(", ")}]`)
      .join(", ");

    out += `Step ${i + 1}: rolled ${rolled}, subtotal = ${s.total}\n`;
  });

  out += `Final total: ${result.final}`;
  return out;
}

console.log(buildDiceLog(resultRPG));


// -----------------------------------------------------------
// Example: Validating Dice Before Use
// -----------------------------------------------------------

try {
  TinySimpleDice.applyModifiers(
    [
      { value: 12, sides: 6 } // invalid: value 12 cannot be from a d6
    ],
    [{ expression: "d6", original: "d6" }]
  );
} catch (err) {
  console.error("Validation error:", err.message);
}
```

---

## 🎯 Features

* ✅ Configurable maximum value
* ✅ Option to allow or disallow zero
* ✅ Static helper to roll indices for arrays or Sets
* ✅ Lightweight and easy to use

---

## 🧠 **How the Modifier Engine Works (High-Level Overview)**

1. **parseString** extracts dice groups & modifiers.

2. You roll all dice using your preferred method.

3. **applyModifiers** uses the rolled values and processes each modifier:

   * Finds dice tokens (`d6`, `3d8`, etc.)
   * Replaces them with corresponding rolled numbers
   * Tokenizes the expression
   * Tracks dice slot positions
   * Evaluates math
   * Collects totals and metadata into a step object

4. All step totals are summed into `final`.

This enables a robust system capable of advanced RPG-style calculations.

---

## 💡 Notes

* The `rollArrayIndex` method always returns a **valid index**, regardless of the collection type.
* Set results are converted to an array internally when accessing values.
* Getters and setters validate values to ensure safe usage.
