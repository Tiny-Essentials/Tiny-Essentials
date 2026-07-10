### 🌐 `fetchTemplate(...)`

Loads data from a remote URL using the Fetch API, with support for custom HTTP methods, retries, timeouts, headers, and even external abort controllers.

#### 📥 Parameters

* `url` *(string)*: The full URL to fetch from (must start with `http://`, `https://`, `/`, `./`, or `../`).
* `options` *(object)* *(optional)*:

  * `signal` *(`AbortSignal` | `null`)*: Custom abort signal.
  * `method` *(string)*: The HTTP method to use (e.g., `GET`, `POST`, `PUT`, `DELETE`, etc.).
  * `timeout` *(number)*: Request timeout in milliseconds. Default is `0` (no timeout).
  * `retries` *(number)*: Number of retry attempts if the request fails. Default is `0`.
  * `headers` *(object)*: Additional headers to include in the request.
  * `body` *(object)*: Request body. If the value is a plain object, it will be automatically stringified as JSON.
  * `onProgress` *((loaded: number, total: number) => void)*: Track the load progress.
  * `returnResponse` *((res: Response) => ResponseInit)* *(optional)*: The callback function to return the ResponseInit to ReadableStream.
