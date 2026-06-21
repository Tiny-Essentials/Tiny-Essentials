/**
 * Private helper to interface with jsmediatags.
 * @param {string} url
   @param {import('jsmediatags')} jsmediatags
 * @returns {Promise<{title?: string, artist?: string}>}
 * @private
 */
const extractId3Tags = (url, jsmediatags) => {
  return new Promise((resolve, reject) => {
    if (!jsmediatags) {
      return reject(new Error('jsmediatags library not found.'));
    }

    jsmediatags.read(url, {
      onSuccess: (tag) => {
        const tags = tag.tags;
        resolve({
          title: tags.title,
          artist: tags.artist,
        });
      },
      onError: (error) => {
        reject(error);
      },
    });
  });
};

export default extractId3Tags;
