# 📚 TinyArrayPaginator

A small but powerful utility for **paginating arrays or sets** 🔄.
It allows you to filter data using **objects**, **functions**, or **regular expressions**, and retrieve paginated results along with useful metadata.

---

## 🔍 GetFilter — Predicate Function

A predicate function used to determine whether an item should be included in the filtered results.
Works similarly to the callback function of `Array.prototype.filter`.

```js
/**
 * @callback GetFilter
 * @param {any} value  - The current element being processed in the array.
 * @param {number} index - The index of the current element within the array.
 * @param {any[]} array - The full array being processed.
 * @returns {boolean}   - `true` to include the element, `false` to exclude it.
 */
```

---

## 🛠 Class: `TinyArrayPaginator`

### ✨ Features

* **Immutable source safety** — The original array/set is never modified.
* **Flexible filtering** — Supports:

  * Object key-value filters
  * Custom filter functions
  * RegExp matching
* **Pagination metadata** — Returns total items, total pages, and navigation info.

---

### 🏗 Constructor

```js
new TinyArrayPaginator(data)
```

**Parameters:**

* `data` (`any[] | Set<any>`) — The data source to paginate.

**Throws:**

* `TypeError` if `data` is not an array or set.

---

### 📥 `.data` (Getter)

Gets the current stored array/set.

**Returns:**
`any[] | Set<any>`

---

### 📤 `.data` (Setter)

Replaces the current data source.

**Parameters:**

* `value` (`any[] | Set<any>`) — The new data source.

**Throws:**

* `TypeError` if the value is not an array or set.

---

### 📏 `.size`

Gets the total number of items in the current data source.

**Returns:**
`number`

---

### 📄 `.get({ page, perPage, filter })`

Filters and paginates the stored data.

**Parameters:**

* `page` (`number`) — The page number (1-based).
* `perPage` (`number`) — Number of items per page.
* `filter` (`Record<string, any> | GetFilter`, optional) — Filtering criteria:

  * **Object** — Key-value pairs for exact match, substring match, or RegExp.
  * **RegExp** values in the object are matched using `.test()`.

**Returns:**

```ts
{
  items: any[],       // Items for the current page
  page: number,       // Current page number (validated)
  perPage: number,    // Items per page
  totalItems: number, // Total filtered items
  totalPages: number, // Total available pages
  hasPrev: boolean,   // True if a previous page exists
  hasNext: boolean    // True if a next page exists
}
```

**Throws:**

* `RangeError` if `page` or `perPage` is not a positive integer.
* `TypeError` if `filter` is neither an object nor a function.

---

### 📌 Example Usage

```js
import TinyArrayPaginator from 'tiny-essentials/libs/array/TinyArrayPaginator';

const paginator = new TinyArrayPaginator([
  { id: 1, category: 'fruit' },
  { id: 2, category: 'vegetable' },
  { id: 3, category: 'fruit' },
  { id: 4, category: 'grain' }
]);

// Example: Filter only fruits and get the first page
const result = paginator.get({
  page: 1,
  perPage: 2,
  filter: { category: 'fruit' }
});

console.log(result);
// {
//   items: [{ id: 1, category: 'fruit' }, { id: 3, category: 'fruit' }],
//   page: 1,
//   perPage: 2,
//   totalItems: 2,
//   totalPages: 1,
//   hasPrev: false,
//   hasNext: false
// }
```
