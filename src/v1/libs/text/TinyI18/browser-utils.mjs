
/**
 * Joins URL segments into a single normalized path.
 *
 * @param {...string} segments - URL segments to join, in order.
 * @returns {string} The joined URL path.
 * @throws {TypeError} If any segment is not a string.
 */
export const joinUrl = (...segments) => {
  for (const segment of segments) {
    if (typeof segment !== 'string') {
      throw new TypeError('TinyI18: "joinUrl" expects only string segments');
    }
  }

  const [head = '', ...tail] = segments;
  const base = head.replace(/\/+$/, '');
  const parts = tail
    .map((segment) => segment.replace(/^\/+/, '').replace(/\/+$/, ''))
    .filter((segment) => segment.length > 0);

  return parts.length === 0 ? base : `${base}/${parts.join('/')}`;
};

/**
 * Reads a file from the network using the Fetch API.
 *
 * @param {string} path - The URL of the file to read.
 * @returns {Promise<string>} A promise that resolves with the file contents as text.
 */
export const readFile = async (path) => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`TinyI18: failed to load "${path}": ${response.status} ${response.statusText}`);
  }
  return response.text();
};
