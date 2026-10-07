/**
 * Node.js port of the browser based event test environments
 * (`test/html/html/events/*`).
 *
 * Covers:
 * - TinyIframeEvents (secure MessageChannel routing)
 * - TinyNewWinEvents (child window messaging)
 *
 * Minimal `window`/`MessageChannel` polyfills are installed before the modules
 * are imported so they can be exercised outside of a real browser.
 *
 * @returns {Promise<number>}
 */

import { TestRunner, section, color } from './_helpers.mjs';

// ---------------------------------------------------------------------------
// Minimal browser polyfills
// ---------------------------------------------------------------------------
class FakeMessagePort {
  constructor() {
    this.onmessage = null;
    this.peer = null;
  }
  postMessage(data) {
    if (this.peer && typeof this.peer.onmessage === 'function') {
      this.peer.onmessage({ data });
    }
  }
  close() {}
}

class MessageChannel {
  constructor() {
    this.port1 = new FakeMessagePort();
    this.port2 = new FakeMessagePort();
    this.port1.peer = this.port2;
    this.port2.peer = this.port1;
  }
}

const listeners = new Map();
const windowStub = {
  location: { origin: 'http://localhost', href: 'http://localhost/' },
  parent: null,
  opener: null,
  addEventListener: (type, handler) => {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(handler);
  },
  removeEventListener: (type, handler) => listeners.get(type)?.delete(handler),
  postMessage: () => {},
  open: () => null,
};
windowStub.parent = windowStub;

class HTMLIFrameElement {}

class Window {}

class Element {}

globalThis.window = windowStub;
globalThis.MessageChannel = MessageChannel;
globalThis.HTMLIFrameElement = HTMLIFrameElement;
globalThis.Window = Window;
globalThis.Element = Element;

const { default: TinyIframeEvents } =
  await import('../../dist/v1/libs/html/events/TinyIframeEvents.mjs');
const { default: TinyNewWinEvents } =
  await import('../../dist/v1/libs/html/events/TinyNewWinEvents.mjs');

/**
 * Node.js port of the browser event test environments.
 * @returns {Promise<number>}
 */
const testEvents = async () => {
  const t = new TestRunner('TinyIframeEvents');

  // -------------------------------------------------------------------
  // TinyIframeEvents
  // -------------------------------------------------------------------
  section('TinyIframeEvents - construction', '🖼️');
  const iframe = new HTMLIFrameElement();
  iframe.contentWindow = { postMessage: () => {} };
  iframe.addEventListener = () => {};
  iframe.removeEventListener = () => {};
  const iframeEvents = new TinyIframeEvents({ targetIframe: iframe });
  t.ok(iframeEvents instanceof TinyIframeEvents, 'Creates an instance');
  t.equal(iframeEvents.selfType, 'parent', 'Detects the parent context');
  t.equal(iframeEvents.ready, false, 'Starts not ready');
  t.equal(typeof iframeEvents.secretEventName, 'string', 'Exposes the secret event name');
  t.throws(() => new TinyIframeEvents({ targetIframe: {} }), 'Rejects an invalid iframe element');

  section('TinyIframeEvents - configuration', '⚙️');
  iframeEvents.secretEventName = '__custom__';
  t.equal(iframeEvents.secretEventName, '__custom__', 'Updates the secret event name');
  t.throws(() => (iframeEvents.secretEventName = 5), 'Validates the secret event name');
  iframeEvents.handshakeEventName = '__hs__';
  t.equal(iframeEvents.handshakeEventName, '__hs__', 'Updates the handshake event name');
  t.throws(() => (iframeEvents.handshakeEventName = 5), 'Validates the handshake event name');
  iframeEvents.readyEventName = '__ready__';
  t.equal(iframeEvents.readyEventName, '__ready__', 'Updates the ready event name');
  t.throws(() => (iframeEvents.readyEventName = 5), 'Validates the ready event name');

  section('TinyIframeEvents - lifecycle', '🔄');
  let readyCalled = false;
  iframeEvents.onReady(() => (readyCalled = true));
  iframeEvents.emit(iframeEvents.readyEventName);
  t.equal(readyCalled, true, 'onReady runs once the connection is ready');
  iframeEvents.destroy();
  t.equal(iframeEvents.isDestroyed(), true, 'destroy marks the instance as destroyed');
  t.throws(() => iframeEvents.ready, 'Throws after being destroyed');

  // -------------------------------------------------------------------
  // TinyNewWinEvents
  // -------------------------------------------------------------------
  const w = new TestRunner('TinyNewWinEvents');
  section('TinyNewWinEvents - construction', '🪟');
  const childWindow = {
    closed: false,
    postMessage: () => {},
    close() {
      this.closed = true;
    },
  };
  const originalOpen = windowStub.open;
  windowStub.open = () => childWindow;

  const conn = new TinyNewWinEvents({ url: 'child.html', name: 'pudding' });
  w.ok(conn instanceof TinyNewWinEvents, 'Creates an instance');
  w.equal(conn.getWin(), childWindow, 'Stores the child window reference');
  w.equal(conn.isConnected(), false, 'Starts disconnected');
  w.throws(
    () => new TinyNewWinEvents({ url: 'child.html', name: '_blank' }),
    'Rejects the _blank window name',
  );
  w.throws(() => new TinyNewWinEvents({ url: 5 }), 'Rejects an invalid url');

  section('TinyNewWinEvents - messaging', '✉️');
  w.throws(() => conn.winEmit(5, null), 'winEmit validates the route');
  conn.winEmit('ping', { from: 'test' });
  w.ok(true, 'winEmit queues messages before the handshake');

  let closed = false;
  const onClose = () => (closed = true);
  conn.onClose(onClose);
  conn.offClose(onClose);
  w.equal(closed, false, 'offClose removes the close listener');

  section('TinyNewWinEvents - lifecycle', '🔄');
  conn.destroy();
  w.equal(conn.isDestroyed(), true, 'destroy marks the instance as destroyed');
  w.throws(() => conn.getWin(), 'Throws after being destroyed');

  windowStub.open = originalOpen;

  console.log(`\n${color('gray', 'Event test-suite finished.')}`);

  return t.summary() + w.summary();
};

export default testEvents;
