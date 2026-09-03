/**
 * Asynchronously generates a cryptographic hash of the provided text using
 * the specified algorithm and returns the result as a hexadecimal string.
 *
 * @param {string} text - The input string to be hashed.
 * @param {AlgorithmIdentifier} algorithm - The cryptographic algorithm to be used for hashing.
 * @returns {Promise<string>} A promise that resolves to the hexadecimal hash string.
 */
export async function hashText(text, algorithm) {
  if (typeof text !== 'string') {
    throw new TypeError('The "text" parameter must be a string.');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
