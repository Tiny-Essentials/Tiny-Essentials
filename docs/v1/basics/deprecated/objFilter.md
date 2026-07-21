### 🔍 `objType(obj, [type])`

Get the type of any value, or check it against a known type.

```js
objType([], 'array'); // true
objType('hello');     // "string"
objType(undefined);   // null
```

Returns:
- `true` / `false` if a type is provided
- The detected type name as a string if no type is provided
- `null` if `undefined` is passed
