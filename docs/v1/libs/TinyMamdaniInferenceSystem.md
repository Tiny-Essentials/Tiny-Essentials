# 🧠 Fuzzy Logic Engine Documentation

Welcome to the official documentation for the **Fuzzy Logic Engine**! 🚀 This robust, type-safe JavaScript module provides a implementation of a Mamdani Inference System, allowing you to model logic using trapezoidal membership functions.

---

## 🛠️ Core Utilities

### 📐 `trapezoid(value, a, b, c, d, optimize = false)`
A high-performance utility to safely calculate the fuzzy membership degree using a trapezoidal shape. It includes built-in protections against division by zero and short-circuit optimizations.

**Parameters:**
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `value` | `number` | The crisp input value to check. |
| `a` | `number` | Start of the rise (membership = 0). |
| `b` | `number` | End of the rise / start of plateau (membership = 1). |
| `c` | `number` | Start of the fall / end of plateau (membership = 1). |
| `d` | `number` | End of the fall (membership = 0). |
| `optimize` | `boolean`, optional | Enables performance optimization by skipping math for absolute bounds. Default is `false`. |

**Returns:** * `number` - The degree of membership, safely clamped between `[0, 1]`.

---

### 🎯 `defuzzifyCentroid(fuzzyOutput, outputSets, step = 0.5)`
Performs defuzzification using the highly accurate Centroid (Center of Gravity) numerical integration method.

* **Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `fuzzyOutput` | `Object.<string, number>` | The evaluated rule strengths (e.g., `{"High": 0.8, "Medium": 0.2}`). |
| `outputSets` | `FuzzySet[]` | The array of sets defining the output spectrum. |
| `step` | `number`, optional | Resolution of the integral approximation. Default is `0.5`. |

* **Returns:** `number` - The final, precise crisp output value.

---

## 🏗️ Classes

### 🟦 `FuzzySet`
Represents a single linguistic term (e.g., "Cold", "High", "Severe") defined by a trapezoidal membership function. It includes strict type validations for all its properties.

#### ⚙️ Constructor
```javascript
new FuzzySet(name, a, b, c, d, optimize = false)
```

#### 📦 Properties
* **`name`** (`string`): The name of the fuzzy set.
* **`a`, `b`, `c`, `d`** (`number`): The coordinates defining the trapezoidal shape.
* **`optimize`** (`boolean`): Internal flag to enable calculation optimization for absolute bounds.

#### 🧮 Methods
* **`calculate(x)`**
  Calculates the membership degree for a specific input using the set's coordinates and optimization flag.
  * **Parameters:** `x` (`number`) - The crisp input value.
  * **Returns:** `number` - Degree of membership `[0, 1]`.

* **`static trapezoid(value, a, b, c, d, optimize = false)`**
  Static wrapper for the global `trapezoid` utility.

---

### 🧠 `MamdaniInferenceSystem`
The core engine that handles the storage of linguistic variables, performs fuzzification, evaluates rules, and calculates the final crisp output via defuzzification.

#### ⚙️ Constructor
```javascript
const engine = new MamdaniInferenceSystem();
```

#### 🧮 Variable Management Methods

* **`addVariable(name, sets)`** ➕
  Registers a new linguistic variable and its associated fuzzy sets.
  * **Parameters:** * `name` (`string`) - The variable's name (e.g., "temperature").
    * `sets` (`FuzzySet[]`) - An array of `FuzzySet` instances.

* **`removeVariable(name)`** 🗑️
  Deletes a linguistic variable from the engine.
  * **Parameters:** `name` (`string`) - The variable's name.
  * **Returns:** `boolean` - `true` if successfully removed.

* **`getVariable(name)`** 🔍
  Retrieves a cloned array of the fuzzy sets for a specific variable.
  * **Parameters:** `name` (`string`) - The variable's name.
  * **Returns:** `FuzzySet[]`
  * **Throws:** `Error` if the variable is not found.

* **`hasVariable(name)`** ❓
  Checks if a variable is registered in the engine.
  * **Parameters:** `name` (`string`) - The variable's name.
  * **Returns:** `boolean`

#### 🔬 Logic Processing Methods

* **`fuzzify(varName, value)`** 🌫️
  Converts a crisp numeric input into a dictionary of fuzzy membership degrees based on the variable's sets.
  * **Parameters:**
    * `varName` (`string`) - The variable to evaluate.
    * `value` (`number`) - The crisp input value.
  * **Returns:** `Object.<string, number>` - A map of set names to their membership degrees.
