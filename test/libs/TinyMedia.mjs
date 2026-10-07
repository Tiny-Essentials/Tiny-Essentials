/**
 * Node.js port of the browser based media test environments
 * (`test/html/media/*`).
 *
 * Covers:
 * - MockMediaAdapter (BaseMediaAdapter contract)
 * - TinyRadioFm (playlist scheduling / timeline queries)
 */

import { TestRunner, section, color } from './_helpers.mjs';

const { MockMediaAdapter } = await import('../../dist/v1/libs/media/TinyMediaPlayer/Mock.mjs');
const { default: TinyRadioFm } = await import('../../dist/v1/libs/media/TinyRadioFm.mjs');

/**
 * Node.js port of the browser media test environments.
 * @returns {Promise<number>}
 */
const testMedia = async () => {
  const t = new TestRunner('MockMediaAdapter');

  // -------------------------------------------------------------------
  // MockMediaAdapter
  // -------------------------------------------------------------------
  section('MockMediaAdapter - playback', '🎵');
  const player = new MockMediaAdapter();
  t.equal(player.id, 'mock', 'Exposes the adapter id');
  t.equal(player.isReady(), true, 'Is ready after construction');
  t.equal(player.isPlaying, false, 'Starts paused');

  await player.play({ url: 'https://example.com/song.mp3' });
  t.equal(player.isPlaying, true, 'play() starts playback');
  t.equal(player.currentContentId, 'https://example.com/song.mp3', 'Tracks the content id');

  await player.pause();
  t.equal(player.isPaused(), true, 'pause() pauses playback');
  t.equal(player.isPlaying, false, 'isPlaying is false after pause');

  await player.stop();
  t.equal(player.isEnded(), true, 'stop() marks the media as ended');

  section('MockMediaAdapter - time & volume', '⏱️');
  await player.seek(15000);
  t.equal(player.getCurrentTime(), 15000, 'seek() updates the current time');
  t.equal(player.getTotalDuration(), 60000, 'Reports the total duration');
  t.equal(player.getRemainingTime(), 45000, 'Computes the remaining time');
  t.equal(player.getPlaybackPercentage(), 25, 'Computes the playback percentage');

  player.setVolume(0.5);
  t.equal(player.getVolume(), 0.5, 'setVolume/getVolume round-trips');
  t.throws(() => player.setVolume(2), 'Rejects an out-of-range volume');

  t.equal(MockMediaAdapter.canHandle({ url: 'x' }), true, 'canHandle accepts a url');
  t.equal(MockMediaAdapter.canHandle({}), false, 'canHandle rejects content without a url');

  player.destroy();
  t.equal(player.destroyed, true, 'destroy marks the adapter as destroyed');
  t.throws(() => player.isPlaying, 'Throws after being destroyed');

  // -------------------------------------------------------------------
  // TinyRadioFm
  // -------------------------------------------------------------------
  const r = new TestRunner('TinyRadioFm');
  section('TinyRadioFm - playlists', '📻');
  const radio = new TinyRadioFm();
  radio.add('music', { id: 'song-1', duration: 1000 });
  radio.add('music', { id: 'song-2', duration: 2000 });
  radio.add('voice', { id: 'voice-1', duration: 500 });

  const events = radio.queryTimeline(Date.now(), 3);
  r.equal(Array.isArray(events), true, 'queryTimeline returns an array');
  r.ok(events.length > 0, 'queryTimeline resolves upcoming events');
  r.equal(typeof events[0].id, 'string', 'Events expose their id');
  r.equal(typeof events[0].absoluteStart, 'number', 'Events expose an absolute start');
  r.equal(typeof events[0].absoluteEnd, 'number', 'Events expose an absolute end');

  section('TinyRadioFm - validation', '🛡️');
  r.throws(() => radio.add('invalid', { id: 'x', duration: 1 }), 'Rejects an invalid type');
  r.throws(() => radio.add('music', { id: 'x' }), 'Rejects content without a duration');
  r.throws(() => radio.queryTimeline(Date.now(), 0), 'Rejects a non-positive limit');
  r.throws(() => new TinyRadioFm('nope'), 'Rejects invalid initial data');

  section('TinyRadioFm - config', '⚙️');
  r.equal(typeof radio.config, 'object', 'Exposes the configuration');
  r.throws(() => (radio.config = { mode: 'nope' }), 'Rejects an invalid mode');

  radio.destroy();
  r.throws(() => radio.getCurrentEvent(), 'Throws after being destroyed');

  console.log(`\n${color('gray', 'Media test-suite finished.')}`);

  return t.summary() + r.summary();
};

export default testMedia;
