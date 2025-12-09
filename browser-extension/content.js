// Content Script - Injects Ionova Provider

(function () {
    // Inject inpage script
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inpage.js');
    script.onload = function () {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(script);

    // Listen for messages from inpage script
    window.addEventListener('message', async (event) => {
        if (event.source !== window) return;
        if (!event.data.type || !event.data.type.startsWith('IONOVA_')) return;

        // Forward to background script
        const response = await chrome.runtime.sendMessage({
            type: event.data.type.replace('IONOVA_', ''),
            ...event.data.payload
        });

        // Send response back to page
        window.postMessage({
            type: 'IONOVA_RESPONSE',
            id: event.data.id,
            result: response
        }, '*');
    });
})();
