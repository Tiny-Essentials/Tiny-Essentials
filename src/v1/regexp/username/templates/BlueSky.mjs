/**
 * @typedef {import('../jsDoc.mjs').UsernameRegexTemplate} UsernameRegexTemplate
 */


/**
 * Bluesky / AT Protocol
 */
const BlueSky = Object.freeze({
  /**
   * User Identifier (Handle)
   * Format: @user.bsky.social (or custom domains)
   * @type {UsernameRegexTemplate}
   */
  handle: {
    prefix: '@',
    validValues: '[a-zA-Z0-9-]',
    length: [1, 63],
    domainPattern: '(?:\\.[a-zA-Z0-9-]+)+',
  },
  /**
   * Decentralized Identifier (DID) - The actual identity in the database
   * Format: did:plc:1234567890abcdefghi or did:web:domain.com
   * @type {UsernameRegexTemplate}
   */
  did: {
    prefix: 'did:',
    validValues: '[a-z]', // Captures the method (e.g., "plc" or "web")
    length: [3, 4],
    domainPattern: ':[a-zA-Z0-9.-]+', // Captures the rest of the unique identifier
  },
  /**
   * AT URI (Points to specific records such as posts, profiles, feeds)
   * Format: at://did:plc:1234567890abcdefghi/app.bsky.feed.post/3jklmn56pqr2
   * @type {UsernameRegexTemplate}
   */
  atUri: {
    prefix: 'at://',
    validValues: '[a-zA-Z0-9.:-]', // Captures the authority (can be the DID or a Handle)
    length: [1, 253],
    domainPattern: '\\/[a-zA-Z0-9.-]+\\/[a-zA-Z0-9.-]+', // Captures the collection and the record ID (rkey)
  },
  /**
   * Standard Hashtags
   * Format: #hashtag
   * @type {UsernameRegexTemplate}
   */
  hashtag: {
    prefix: '#',
    validValues: '[a-zA-Z0-9_]',
    length: [1, 64],
  }
});

export default BlueSky;
