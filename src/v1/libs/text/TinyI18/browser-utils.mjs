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
