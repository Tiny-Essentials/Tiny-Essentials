# JavaScript RegExp: Reuse vs. Re-instantiation

This document serves as a guide for professional developers on when it is efficient and safe to reuse a `RegExp` object in JavaScript, and when doing so can lead to critical bugs.

## 1. When to Reuse a RegExp

Reusing a `RegExp` object (storing it in a `const` outside of a function or loop) is a best practice in several scenarios.

### A. Static Patterns (Single Source of Truth)
If you have a pattern that never changes, such as an email validation pattern, a phone number format, or a specific error code format, you should define it once.
*   **Why:** It ensures consistency across your entire application. If the validation rule changes, you only update it in one location.

### B. Performance Optimization (Pre-compilation)
When you define a regex using the literal syntax (e.g., `/pattern/`) or the `new RegExp()` constructor, the JavaScript engine must compile that pattern into an internal format.
*   **Why:** If you are performing a regex operation inside a loop that runs thousands of times, defining the regex *inside* the loop forces the engine to re-compile the pattern on every iteration. Defining it *outside* the loop performs the compilation only once.

### Example: Efficient Reuse
```javascript
// GOOD: Compiled once, reused many times
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmails(emailList) {
  return emailList.map(email => EMAIL_PATTERN.test(email));
}
```

---

## 2. When NEVER to Reuse a RegExp

There are specific technical reasons why reusing a regex can cause your application to fail.

### A. The `lastIndex` Trap (Stateful Regex)
This is the most critical reason to avoid reuse. When a `RegExp` has the global (`g`) or sticky (`y`) flag, it becomes **stateful**. It maintains a property called `lastIndex`, which tracks the position where the next match should begin.

*   **The Problem:** If you use `.test()` or `.exec()` on a global regex, the `lastIndex` is updated after every match. If you reuse that same regex instance later, it will start searching from the *previous* position rather than the beginning of the string, often leading to false negatives.

### Example: The `lastIndex` Bug
```javascript
// BAD: Reusing a global regex leads to unpredictable results
const SEARCH_PATTERN = /abc/g;
const str = "abcabc";

console.log(SEARCH_PATTERN.test(str)); // true (lastIndex is now 3)
console.log(SEARCH_PATTERN.test(str)); // false! (Starts searching at index 3, finds nothing)

// FIX: Either do not use the 'g' flag if you only need to test once, 
// or reset the index manually:
SEARCH_PATTERN.lastIndex = 0; 
console.log(SEARCH_PATTERN.test(str)); // true
```

### B. Dynamic Patterns
If the pattern itself depends on a variable (e.g., searching for a user-provided string), you cannot use a static constant.
*   **Why:** A constant is immutable. If the search criteria change, you must instantiate a new `RegExp` using the `new RegExp(patternString)` constructor.

### Example: Dynamic Pattern
```javascript
// GOOD: Creating a new instance because the pattern changes
function findUser(userName) {
  // We must create a new instance because 'userName' is dynamic
  const dynamicPattern = new RegExp(userName, 'i'); 
  return dynamicPattern.test(currentData);
}
```

## Summary Table

| Scenario | Action | Reason |
| :--- | :--- | :--- |
| **Static Pattern (e.g., Email)** | **Reuse** | Consistency and Performance. |
| **Inside a Loop (Static Pattern)** | **Reuse** | Avoids repeated compilation overhead. |
| **Regex with `g` or `y` flags** | **Avoid Reuse** | Prevents `lastIndex` state bugs. |
| **Pattern depends on variables** | **Do Not Reuse** | The pattern is not constant. |
