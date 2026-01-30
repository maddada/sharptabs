// Bridge for communicating with extension
console.log("[Screenshot Bridge] Loading screenshot-bridge.js");

class ScreenshotBridge {
    constructor() {
        console.log("[Screenshot Bridge] Initializing ScreenshotBridge");
        this.pendingRequests = new Map();
        this.setupMessageListener();
    }

    setupMessageListener() {
        console.log("[Screenshot Bridge] Setting up message listener");
        window.addEventListener("message", (event) => {
            // Log all messages for debugging
            if (event.data?.type?.startsWith("SHARPTABS_")) {
                console.log("[Screenshot Bridge] Received message:", event.data.type, event.data);
            }

            if (event.data?.type === "SHARPTABS_SCREENSHOT_RESPONSE") {
                const requestId = event.data.requestId || "default";
                const callback = this.pendingRequests.get(requestId);

                console.log("[Screenshot Bridge] Screenshot response received:", {
                    requestId,
                    hasCallback: !!callback,
                    hasScreenshot: !!event.data.screenshot,
                    screenshotSize: event.data.screenshot ? event.data.screenshot.length : 0,
                });

                if (callback) {
                    callback(event.data.screenshot);
                    this.pendingRequests.delete(requestId);
                    console.log("[Screenshot Bridge] Callback executed and request cleaned up");
                } else {
                    console.warn("[Screenshot Bridge] No callback found for requestId:", requestId);
                }
            }
        });
    }

    async requestScreenshot(url, timeout = 2000) {
        console.log("[Screenshot Bridge] Requesting screenshot for URL:", url);
        return new Promise((resolve) => {
            const requestId = `${Date.now()}_${Math.random()}`;
            console.log("[Screenshot Bridge] Request ID:", requestId);

            const timeoutId = setTimeout(() => {
                console.warn("[Screenshot Bridge] Request timed out after", timeout, "ms for URL:", url);
                this.pendingRequests.delete(requestId);
                resolve(null);
            }, timeout);

            this.pendingRequests.set(requestId, (screenshot) => {
                clearTimeout(timeoutId);
                console.log("[Screenshot Bridge] Screenshot received, resolving promise");
                resolve(screenshot);
            });

            console.log("[Screenshot Bridge] Posting message to window:", {
                type: "SHARPTABS_GET_SCREENSHOT",
                url: url,
                requestId: requestId,
            });

            window.postMessage(
                {
                    type: "SHARPTABS_GET_SCREENSHOT",
                    url: url,
                    requestId: requestId,
                },
                "*"
            );
        });
    }
}

window.screenshotBridge = new ScreenshotBridge();
console.log("[Screenshot Bridge] ScreenshotBridge instance created and attached to window");
