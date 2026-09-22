# 📡 TinyPingPwa

A lightweight utility to verify that the `TinyServiceWorkerEngine` is communicating correctly.

### 🚀 Quick Usage

1.  **Register the plugin:**
    ```javascript
    import TinyPingPwa from 'tiny-essentials/libs/sw/service/plugins/Ping';
    engineInstance.installPlugin(TinyPingPwa);
    ```

2.  **Send a test message:**
    ```javascript
    import TinyServiceWorker from 'tiny-essentials/libs/sw/browser/TinyServiceWorker';

    const swManager = new TinyServiceWorker({
        id: 'web-manager',
        swUrl: '/sw.js',
        version: '1.0.0',
        debugMode: import.meta.env.DEV,
        useLogColors: true,
    });

    swManager.on('pong', ({ data }) => console.log(data.msg));

    swManager.register({ type: import.meta.env.DEV ? 'module' : 'classic' }).then(() => {
        swManager.emit('ping');
    });
    ```

### ✅ Expected Result

When a `'ping'` is sent, the plugin will respond with:
*   **Type:** `'pong'`
*   **Data:** `{ msg: 'mio! :3' }`
