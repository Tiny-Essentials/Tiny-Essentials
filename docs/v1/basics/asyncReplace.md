# 🔄 AsyncReplace

## `asyncReplace(str, regex, asyncFn)` 🔄

Asynchronously replaces matches in a string using a regular expression and an async function.

This function performs replacements on a string, allowing each match to be asynchronously replaced by calling an asynchronous function for each match. The asynchronous function should return a replacement value for each match and will receive the same arguments as the standard `replace` callback.

### Parameters:

- `str` (`string`): The input string to perform replacements on.
- `regex` (`RegExp`): The regular expression used to match substrings for replacement.
- `asyncFn` (`Function`): An asynchronous function that returns a replacement for each match. 
    - It receives the same arguments as the standard `replace` callback (the matched substring and the matched string's groups).
    - The function should return a `Promise` that resolves to the replacement value for that match.

### Returns:
- `Promise<string>`: A promise that resolves to the resulting string with all async replacements applied.

### Example:

```javascript
await asyncReplace("Hello @user1 and @user2!", /@\w+/g, async (mention) => {
  return await getUserNameFromMention(mention);
});
```

In this example, each `@user` mention is asynchronously replaced by the value returned from `getUserNameFromMention`.

### Description:

This function will:
1. Use a regular expression (`regex`) to find all matches in the input string (`str`).
2. For each match, it will invoke the provided asynchronous function (`asyncFn`), which should return the replacement value.
3. Once all promises are resolved, it replaces the original matches in the string with the resolved values.

This is useful for scenarios where you need to replace parts of a string based on dynamic data (like fetching usernames from a server for each mention in a message).

### Notes:
- The replacements are performed asynchronously, ensuring non-blocking behavior when dealing with large or external data sources.
- The function utilizes `Promise.all` to handle multiple asynchronous operations concurrently before replacing the matches in the original string.
