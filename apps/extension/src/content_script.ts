// Sign-in event and redirect to extension settings page
// Listen for a postMessage from the website indicating a sign-in event
window.addEventListener("message", (event) => {
    // When the user visits sharptabs check if they're trying to sign in (token in url)
    // and redirect them with the correct token to the extension's settings page to sign in

    // Only accept messages from the same origin for security
    const isAllowedOrigin =
        event.origin === "https://sharptabs.com" ||
        event.origin === "https://best-vertical-tabs.firebaseapp.com" ||
        event.origin.startsWith("http://localhost:"); // Allow localhost for development

    if (!isAllowedOrigin) {
        return;
    }

    // The website should send a message like: { type: "SHARPTABS_SETTINGS_SIGNIN", url: "..." }
    if (event.data && event.data.type === "SHARPTABS_SETTINGS_SIGNIN" && typeof event.data.url === "string") {
        try {
            const url = new URL(event.data.url);
            const params = url.searchParams;

            // Build the extension settings page URL with the same params
            const extId = chrome.runtime.id;
            const settingsUrl = `chrome-extension://${extId}/settings.html?` + params.toString();

            // Open the extension settings page in a new tab
            chrome.runtime.sendMessage({
                type: "OPEN_SETTINGS_TAB_AND_SIGNIN",
                url: settingsUrl,
            });
        } catch (e) {
            // Ignore invalid URLs
            console.info("[content_script] Error handling sign in:", e);
        }
    }

    // Handle Google Auth success from website
    if (event.data && event.data.type === "SHARPTABS_GOOGLE_AUTH_SUCCESS") {
        console.log("[content_script] Received Google auth success, storing data and redirecting...");
        console.log("[content_script] Auth data:", event.data.authData);

        try {
            // Store auth data in extension storage (even if it's a fallback)
            chrome.storage.local
                .set({
                    googleAuthData: event.data.authData,
                })
                .then(() => {
                    console.log("[content_script] Auth data stored successfully");

                    // Get return URL from current page
                    const urlParams = new URLSearchParams(window.location.search);
                    const returnUrl = urlParams.get("returnUrl");

                    if (returnUrl && returnUrl.includes("chrome-extension://")) {
                        console.log("[content_script] Redirecting to:", returnUrl);
                        window.location.href = returnUrl;
                    } else {
                        console.log("[content_script] No valid return URL found");
                    }
                })
                .catch((error) => {
                    console.error("[content_script] Error storing auth data:", error);
                });
        } catch (e) {
            console.error("[content_script] Error handling Google auth:", e);
        }
    }

    // Handle website authentication success (cross-platform auth)
    if (event.data && event.data.type === "SHARPTABS_WEBSITE_AUTH_SUCCESS") {
        console.log("[content_script] Received website auth success, forwarding to service worker...");
        console.log("[content_script] Auth data:", event.data.authData);

        try {
            // Forward the auth data to the service worker
            chrome.runtime.sendMessage({
                type: "WEBSITE_AUTH_SUCCESS",
                customToken: event.data.authData.customToken,
                user: event.data.authData.user,
            });

            console.log("[content_script] Auth data forwarded to service worker successfully");
        } catch (e) {
            console.error("[content_script] Error handling website auth:", e);
        }
    }
});
