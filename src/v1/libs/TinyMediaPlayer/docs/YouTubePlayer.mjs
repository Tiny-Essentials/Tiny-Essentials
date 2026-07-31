/**
 * https://developers.google.com/youtube/iframe_api_reference
 * @fileoverview JSDoc type definitions for the YouTube IFrame Player API.
 * This file provides full IntelliSense/autocomplete for the global `window.YT` object.
 * @module youtube-api-docs
 */

/**
 * Represents the current state of the player.
 * @typedef {-1|0|1|2|3|5} YTPlayerState
 * @property {-1} UNSTARTED - The video has not been started.
 * @property {0} ENDED - The video has ended.
 * @property {1} PLAYING - The video is playing.
 * @property {2} PAUSED - The video is paused.
 * @property {3} BUFFERING - The video is buffering.
 * @property {5} CUED - The video is cued and ready to play.
 */

/**
 * Represents the player error codes.
 * @typedef {2|5|100|101|150} YTPlayerErrors
 * @property {2} INVALIDPARAM - The request contains an invalid parameter value (e.g., invalid video ID).
 * @property {5} INVALIDPLAYER - The content cannot be played in an HTML5 player or an HTML5 error occurred.
 * @property {100} NOTFOUND - The requested video was not found (removed or private).
 * @property {101} NOTALLOWED - The owner does not allow playback in embedded players.
 * @property {150} NOTALLOWED_REDUNDANT - Same as 101.
 */

/**
 * The playback quality string.
 * @typedef {'small'|'medium'|'large'|'hd720'|'hd1080'|'highres'} YTQuality
 */

/**
 * Properties for 360° video playback, defining the viewing angle.
 * @typedef {Object} YTSphericalProperties
 * @property {number} yaw - Horizontal angle of view [0, 360].
 * @property {number} pitch - Vertical angle of view [-90, 90].
 * @property {number} roll - Rotational angle [-180, 180].
 * @property {number} fov - Field of view [30, 120].
 */

/**
 * Base structure for all YouTube Player Events.
 * @typedef {Object} YouTubePlayerEventBase
 * @property {YouTubePlayer} target - The player object that emitted the event.
 */

/**
 * Called when the player is ready to accept commands.
 * @typedef {(event: YouTubePlayerEventBase) => void} OnReadyEvent
 */

/**
 * Called when the video playback state changes (e.g., playing, paused).
 * @typedef {(event: YouTubePlayerEventBase & { data: YTPlayerState }) => void} OnStateChangeEvent
 */

/**
 * Called when an error occurs during video processing or playback.
 * @typedef {(event: YouTubePlayerEventBase & { data: YTPlayerErrors }) => void} OnErrorEvent
 */

/**
 * Called specifically when the playback quality setting is updated.
 * @typedef {(event: YouTubePlayerEventBase & { data: YTQuality }) => void} OnPlaybackQualityChangeEvent
 */

/**
 * Called when the video's speed (playback rate) changes or is set.
 * @typedef {(event: YouTubePlayerEventBase & { data: number }) => void} OnPlaybackRateChangeEvent
 */

/**
 * Called when a change occurs within the API module itself.
 * @typedef {(event: YouTubePlayerEventBase & { data: any }) => void} OnApiChangeEvent
 */

/**
 * Called when automatic playback is specifically blocked by the browser or platform rules.
 * @typedef {(event: YouTubePlayerEventBase) => void} OnAutoplayBlockedEvent
 */

/**
 * Container object for configuring event listeners on the player instance.
 * @typedef {Object} YTPlayerOptionsEvents
 * @property {OnReadyEvent} [onReady] - Called when the player is ready.
 * @property {OnStateChangeEvent} [onStateChange] - Called when the state changes.
 * @property {OnErrorEvent} [onError] - Called when an error occurs.
 * @property {OnPlaybackQualityChangeEvent} [onPlaybackQualityChange] - Called when quality changes.
 * @property {OnPlaybackRateChangeEvent} [onPlaybackRateChange] - Called when playback rate changes.
 * @property {OnApiChangeEvent} [onApiChange] - Called when the API module changes.
 * @property {OnAutoplayBlockedEvent} [onAutoplayBlocked] - Called when autoplay is blocked.
 */

/**
 * Configuration options for initializing the YouTube Player instance.
 * @typedef {Object} YTPlayerOptions
 * @property {number|string} [width=640] - Desired width of the player frame in pixels.
 * @property {number|string} [height=390] - Desired height of the player frame in pixels.
 * @property {string} [videoId] - The unique identifier for the YouTube video to load.
 * @property {Object<string, any>} [playerVars] - Additional configuration parameters passed to the player.
 * @property {YTPlayerOptionsEvents} [events] - An object containing event listeners to handle specific player events.
 */

/**
 * List of valid names for all YouTube Player Event listeners.
 * @typedef {'onReady'|'onStateChange'|'onError'|'onPlaybackQualityChange'|'onPlaybackRateChange'|'onApiChange'|'onAutoplayBlocked'} EventNames
 */

/**
 * Options specifically used when queuing or loading a playlist.
 * @typedef {Object} YTPlaylistOptions
 * @property {'playlist'|'user_uploads'} [listType='playlist'] - Specifies whether to use a standard playlist or user uploads feed.
 * @property {string|string[]} list - The ID of the target playlist or an array containing multiple video IDs.
 * @property {number} [index=0] - The zero-based index of the first video that should be played from the list.
 * @property {number} [startSeconds] - The specific time in seconds where the playback of the first video should begin.
 */

/**
 * Options used to cue or load a video based on its full media URL.
 * @typedef {Object} VideoByUrlOptions
 * @property {string} mediaContentUrl - The complete URL pointing to the desired YouTube video resource.
 * @property {number} [startSeconds] - Optional time in seconds to begin playback from within the video.
 * @property {number} [endSeconds] - Optional time in seconds when playback should stop within the video.
 */

/**
 * Options used to cue or load a video based on its unique ID.
 * @typedef {Object} VideoByIdOptions
 * @property {string} videoId - The unique identifier of the target YouTube video.
 * @property {number} [startSeconds] - Optional time in seconds to begin playback from within the video.
 * @property {number} [endSeconds] - Optional time in seconds when playback should stop within the video.
 */

/**
 * Detailed data object representing the current status and metadata of a loaded YouTube video.
 * @typedef {Object} VideoData
 * @property {boolean|null} allowLiveDvr - Whether DVR capabilities are permitted for live content.
 * @property {string|null} author - The name or ID of the video creator.
 * @property {boolean|null} backgroundable - Indicates if the video can be played in the background while minimized.
 * @property {string|null} cpn - Content Protection Network identifier.
 * @property {number|null} errorCode - A specific error code if playback failed.
 * @property {string|null} eventId - An ID related to a specific content event.
 * @property {boolean|null} hasProgressBarBoundaries - Flag indicating if the progress bar has defined start/end boundaries.
 * @property {boolean|null} isListed - Indicates if the video belongs to a list or series.
 * @property {boolean|null} isLive - True if the content is currently streaming live.
 * @property {boolean|null} isManifestless - Flag indicating if manifest files are not being used for streaming.
 * @property {boolean|null} isMultiChannelAudio - Indicates support for multiple audio channels.
 * @property {boolean|null} isPlayable - Overall flag indicating the video can be played by the player.
 * @property {boolean|null} isPremiere - True if the content is a scheduled premiere.
 * @property {boolean|null} isSeekable - Whether random access seeking within the video is allowed.
 * @property {boolean|null} isWindowedLive - Indicates if it is a windowed live event.
 * @property {string|null} itct - Indicator of Interactivity Content Tracking tag.
 * @property {number|null} paidContentOverlayDurationMs - Duration in milliseconds for paid content overlays.
 * @property {string|null} playerResponseCpn - Content Protection Network response identifier from the player itself.
 * @property {number|null} progressBarEndPositionUtcTimeMillis - UTC time in milliseconds for the end of the video's progress bar.
 * @property {number|null} progressBarStartPositionUtcTimeMillis - UTC time in milliseconds for the start of the video's progress bar.
 * @property {string|null} title - The descriptive title of the video.
 * @property {string|null} video_id - The unique ID string of the video content.
 */

/**
 * The main YouTube Player class instance. Manages all player interactions and state.
 */
class YouTubePlayer {
  /**
   * Constructor for the YouTube Player. Initializes the player element.
   * @param {string|HTMLElement} element - The DOM element or its ID where the player iframe will be inserted.
   * @param {YTPlayerOptions} [options] - Optional configuration settings for the player initialization.
   */
  constructor(element, options) {}

  /**
   * Stores and retrieves the title of the currently loaded video.
   * @type {string|null|undefined}
   */
  videoTitle = '';

  /**
   * Retrieves a comprehensive snapshot of the current video metadata and status (e.g., ID, author, playability).
   * @returns {Partial<VideoData>} A partial object containing various details about the loaded content.
   */
  getVideoData() {
    return {
      allowLiveDvr: false,
      author: '',
      backgroundable: true,
      cpn: '',
      errorCode: null,
      eventId: '',
      hasProgressBarBoundaries: false,
      isListed: true,
      isLive: false,
      isManifestless: false,
      isMultiChannelAudio: false,
      isPlayable: true,
      isPremiere: false,
      isSeekable: null,
      isWindowedLive: false,
      itct: '',
      paidContentOverlayDurationMs: 0,
      playerResponseCpn: '',
      progressBarEndPositionUtcTimeMillis: null,
      progressBarStartPositionUtcTimeMillis: null,
      title: '',
      video_id: '',
    };
  }

  /**
   * Plays the loaded/selected video.
   *
   * The final player state after this function executes will be playing (1).
   * @returns {void}
   */
  playVideo() {}

  /**
   * Pauses the playing video.
   *
   * The final player state after this function executes will be paused (2)
   * unless the player is in the ended (0) state when the function is called,
   * in which case the player state will not change.
   * @returns {void}
   */
  pauseVideo() {}

  /**
   * Stops and cancels the current video playback.
   *
   * Important: Unlike the pauseVideo function, which leaves the player in the
   * paused (2) state, the stopVideo function could put the player into any
   * not-playing state, including ended (0), paused (2), video cued (5) or
   * unstarted (-1).
   * @returns {void}
   */
  stopVideo() {}

  /**
   * Seeks to a specific time in the video.
   * @param {number} seconds - The time to seek to.
   * @param {boolean} [allowSeekAhead] - Whether to make a new request to the server if the time is outside the buffer.
   * @returns {void}
   */
  seekTo(seconds, allowSeekAhead) {}

  /**
   * Retrieves the current spherical properties for 360° video playback.
   * @returns {YTSphericalProperties}
   */
  getSphericalProperties() {
    return { yaw: 0, pitch: 0, roll: 0, fov: 0 };
  }

  /**
   * Sets the orientation for 360° video playback.
   * @param {YTSphericalProperties & { enableOrientationSensor?: boolean }} properties - The new orientation properties.
   * @returns {void}
   */
  setSphericalProperties(properties) {}

  /**
   * Loads and plays the next video in the playlist.
   * @returns {void}
   */
  nextVideo() {}

  /**
   * Loads and plays the previous video in the playlist.
   * @returns {void}
   */
  previousVideo() {}

  /**
   * Loads and plays the video at the specified index in the playlist.
   * @param {number} index - The zero-based index of the video.
   * @returns {void}
   */
  playVideoAt(index) {}

  /**
   * Mutes the player.
   * @returns {void}
   */
  mute() {}

  /**
   * Unmutes the player.
   * @returns {void}
   */
  unMute() {}

  /**
   * Checks if the player is muted.
   * @returns {boolean}
   */
  isMuted() {
    return false;
  }

  /**
   * Sets the player volume.
   * @param {number} volume - Volume level between 0 and 100.
   * @returns {void}
   */
  setVolume(volume) {}

  /**
   * Gets the current player volume between 0 and 100.
   * @returns {number}
   */
  getVolume() {
    return 0;
  }

  /**
   * Sets the size of the <iframe>.
   * @param {number|string} width - Width in pixels.
   * @param {number|string} height - Height in pixels.
   * @returns {this}
   */
  setSize(width, height) {
    return this;
  }

  /**
   * Gets the current playback rate.
   * @returns {number}
   */
  getPlaybackRate() {
    return 1;
  }

  /**
   * Sets the suggested playback rate.
   * @param {number} suggestedRate - The playback rate (e.g., 0.5, 1, 1.5, 2).
   * @returns {void}
   */
  setPlaybackRate(suggestedRate) {}

  /**
   * Gets the available playback rates for the current video.
   * @returns {number[]}
   */
  getAvailablePlaybackRates() {
    return [1];
  }

  /**
   * Sets whether the playlist should loop.
   * @param {boolean} loopPlaylists - If true, the playlist repeats after the last video.
   * @returns {void}
   */
  setLoop(loopPlaylists) {}

  /**
   * Sets whether the playlist should be shuffled.
   * @param {boolean} shufflePlaylist - If true, the playlist order is randomized.
   * @returns {void}
   */
  setShuffle(shufflePlaylist) {}

  /**
   * Returns a number between 0 and 1 that specifies the percentage of the video
   * that the player shows as buffered.
   * @returns {number}
   */
  getVideoLoadedFraction() {
    return 0;
  }

  /**
   * Returns the current player state.
   * @returns {YTPlayerState}
   */
  getPlayerState() {
    return 0;
  }

  /**
   * Returns the current time in seconds.
   * @returns {number}
   */
  getCurrentTime() {
    return 0;
  }

  /**
   * Returns the URL of the current video.
   * @returns {string}
   */
  getVideoUrl() {
    return '';
  }

  /**
   * Returns the embed code of the current video.
   * @returns {string}
   */
  getVideoEmbedCode() {
    return '';
  }

  /**
   * Returns the duration of the video in seconds.
   * @returns {number}
   */
  getDuration() {
    return 0;
  }

  /**
   * Returns the array of video IDs in the current playlist.
   * @returns {string[]}
   */
  getPlaylist() {
    return [];
  }

  /**
   * Returns the index of the current video in the playlist.
   * @returns {number}
   */
  getPlaylistIndex() {
    return 0;
  }

  /**
   * Queues a video by its ID.
   * @param {string|VideoByIdOptions} videoId - The ID of the video.
   * @param {number} [startSeconds] - The time to start at.
   * @param {YTQuality} [quality] - The video quality
   * @returns {void}
   */
  cueVideoById(videoId, startSeconds, quality) {}

  /**
   * Loads a video by its ID.
   * @param {string|VideoByIdOptions} videoId - The ID of the video.
   * @param {number} [startSeconds] - The time to start at.
   * @param {YTQuality} [quality] - The video quality
   * @returns {void}
   */
  loadVideoById(videoId, startSeconds, quality) {}

  /**
   * Queues a video by its URL.
   * @param {string|VideoByUrlOptions} mediaContentUrl - The full URL of the YouTube video.
   * @param {number} [startSeconds] - The time to start at.
   * @param {YTQuality} [quality] - The video quality
   * @returns {void}
   */
  cueVideoByUrl(mediaContentUrl, startSeconds, quality) {}

  /**
   * Loads a video by its URL.
   * @param {string|VideoByUrlOptions} mediaContentUrl - The full URL of the YouTube video.
   * @param {number} [startSeconds] - The time to start at.
   * @param {YTQuality} [quality] - The video quality.
   * @returns {void}
   */
  loadVideoByUrl(mediaContentUrl, startSeconds, quality) {}

  /**
   * Queues a playlist.
   * @param {string|string[]|YTPlaylistOptions} playlist - The playlist ID, array of IDs, or options object.
   * @param {number} [index=0] - The index of the first video.
   * @param {number} [startSeconds] - The time to start at.
   * @returns {void}
   */
  cuePlaylist(playlist, index, startSeconds) {}

  /**
   * Loads a playlist.
   * @param {string|string[]|YTPlaylistOptions} playlist - The playlist ID, array of IDs, or options object.
   * @param {number} [index=0] - The index of the first video.
   * @param {number} [startSeconds] - The time to start at.
   * @returns {void}
   */
  loadPlaylist(playlist, index, startSeconds) {}

  /**
   * Adds an event listener.
   * @param {EventNames} event - The event name.
   * @param {string} listener - The listener is a string that specifies the function
   * that will execute when the specified event fires.
   * @returns {void}
   */
  addEventListener(event, listener) {}

  /**
   * Removes an event listener.
   * @param {EventNames} event - The event name.
   * @param {string} listener - The listener is a string that identifies the function
   * that will no longer execute when the specified event fires.
   * @returns {void}
   */
  removeEventListener(event, listener) {}

  /**
   * Returns the DOM node of the <iframe>.
   * @returns {HTMLElement}
   */
  getIframe() {
    return document.createElement('iframe');
  }

  /**
   * Returns the options available for the current module.
   * @param {string} [module] - The name of the module.
   * @returns {Object<string, any>}
   */
  getOptions(module) {
    return {};
  }

  /**
   * Retrieves an option for a specific module.
   * @param {any} module - The name of the module.
   * @param {any} option - The name of the option.
   * @returns {any}
   */
  getOption(module, option) {
    return undefined;
  }

  /**
   * Sets an option for a specific module.
   * @param {any} module - The name of the module.
   * @param {any} option - The name of the option.
   * @param {any} value - The value to set.
   * @returns {void}
   */
  setOption(module, option, value) {}

  /**
   * Destroys the player and removes the <iframe>.
   * @returns {void}
   */
  destroy() {}
}

export default YouTubePlayer;
