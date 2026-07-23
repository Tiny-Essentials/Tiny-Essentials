/**
 * @typedef {import('../../basics/mediaContent.mjs').PictureDataType} PictureDataType
 * @typedef {import('../../basics/mediaContent.mjs').MediaContent<PictureDataType>} MediaContent
 */

/**
 * Interface definition for a Media Provider Adapter.
 * All specific API wrappers must extend and implement this class.
 * @abstract
 */
class BaseMediaAdapter {
  constructor() {
    if (new.target === BaseMediaAdapter) {
      throw new Error('BaseMediaAdapter is an abstract class and cannot be instantiated directly.');
    }
  }

  /**
   * Determines if this adapter can play the provided content.
   * @param {MediaContent} content - The media content to evaluate.
   * @returns {boolean} True if the adapter can handle the content, false otherwise.
   */
  canHandle(content) {
    throw new Error('Method "canHandle" must be implemented by the subclass.');
  }

  /**
   * Starts or resumes playback of the provided content.
   * @param {MediaContent} content - The media content to play.
   * @returns {Promise<void>}
   */
  async play(content) {
    throw new Error('Method "play" must be implemented by the subclass.');
  }

  /**
   * Pauses the current playback.
   * @returns {Promise<void>}
   */
  async pause() {
    throw new Error('Method "pause" must be implemented by the subclass.');
  }

  /**
   * Stops the playback completely and resets the internal platform state.
   * @returns {Promise<void>}
   */
  async stop() {
    throw new Error('Method "stop" must be implemented by the subclass.');
  }

  /**
   * Seeks to a specific time in the media timeline.
   * @param {number} timeMs - The target time in milliseconds.
   * @returns {Promise<void>}
   */
  async seek(timeMs) {
    throw new Error('Method "seek" must be implemented by the subclass.');
  }

  /**
   * Retrieves the current playback time from the underlying API.
   * @returns {number} The current time in milliseconds.
   */
  getCurrentTime() {
    throw new Error('Method "getCurrentTime" must be implemented by the subclass.');
  }

  /**
   * Sets the playback volume for the underlying API.
   * @param {number} volume - The volume level from 0.0 to 1.0.
   * @returns {void}
   */
  setVolume(volume) {
    throw new Error('Method "setVolume" must be implemented by the subclass.');
  }
}

export { BaseMediaAdapter };
