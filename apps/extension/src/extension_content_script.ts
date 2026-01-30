// Extension content script for Firebase authentication in extension pages
// This runs in extension pages like settings.html, popup.html, etc.
// It also runs in the website to recieve the login message

import { signInWithCustomToken } from "firebase/auth/web-extension";
import { auth } from "./utils/firebase";

console.log("[EXTENSION AUTH] Extension content script loaded");

if (!auth) {
    console.warn("[EXTENSION AUTH] Firebase auth not available - auth features disabled");
}

// Listen for custom token sign-in messages from service worker
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.type === "FIREBASE_CUSTOM_TOKEN_SIGNIN") {
        console.log("[EXTENSION AUTH] Received custom token for Firebase sign-in");
        console.log("[EXTENSION AUTH] User data:", message.userData);

        if (!auth) {
            console.warn("[EXTENSION AUTH] Firebase auth not available");
            sendResponse({ success: false, error: "Firebase auth not available" });
            return true;
        }

        try {
            // Sign in to Firebase using the custom token
            const userCredential = await signInWithCustomToken(auth, message.customToken);
            const user = userCredential.user;

            console.log("[EXTENSION AUTH] Successfully signed in to Firebase:", user.email);
            console.log("[EXTENSION AUTH] Firebase will now handle auth persistence automatically");

            // Firebase onAuthStateChanged will trigger in authStore.ts
            // No need to store anything in Chrome storage!

            sendResponse({ success: true, user: user.email });
        } catch (error) {
            console.error("[EXTENSION AUTH] Error signing in with custom token:", error);
            sendResponse({ success: false, error: (error as Error).message });
        }

        return true; // Keep message channel open for async response
    }

    return false;
});

// Also handle the case where this content script is injected into the website
// Listen for postMessages from the website (cross-platform auth)
window.addEventListener("message", (event) => {
    // Only accept messages from sharptabs.com domains for security
    if (event.origin !== "https://sharptabs.com" && event.origin !== "https://best-vertical-tabs.firebaseapp.com") {
        return;
    }

    // Handle website authentication success (cross-platform auth)
    if (event.data && event.data.type === "SHARPTABS_WEBSITE_AUTH_SUCCESS") {
        console.log("[EXTENSION AUTH] Received website auth success, processing custom token...");
        console.log("[EXTENSION AUTH] Auth data:", event.data.authData);

        // Immediately try to sign in with the custom token (only if auth is available)
        if (event.data.authData.customToken && auth) {
            signInWithCustomToken(auth, event.data.authData.customToken)
                .then((userCredential) => {
                    console.log("[EXTENSION AUTH] Successfully signed in to Firebase from website:", userCredential.user.email);
                    // Firebase auth state will propagate to all extension contexts
                })
                .catch((error) => {
                    console.error("[EXTENSION AUTH] Error signing in with custom token from website:", error);
                });
        } else if (!auth) {
            console.warn("[EXTENSION AUTH] Firebase auth not available - skipping custom token sign-in");
        }

        // Also forward to service worker as before (for compatibility)
        try {
            chrome.runtime.sendMessage({
                type: "WEBSITE_AUTH_SUCCESS",
                customToken: event.data.authData.customToken,
                user: event.data.authData.user,
            });
        } catch (e) {
            console.error("[EXTENSION AUTH] Error forwarding to service worker:", e);
        }
    }
});
