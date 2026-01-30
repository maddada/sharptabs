// Handle authentication from website using cross-platform auth
export async function handleWebsiteAuth(userData: any, customToken: string) {
    try {
        console.log("[WEBSITE AUTH] Processing authentication for user:", userData.email);
        console.log("[WEBSITE AUTH] Forwarding custom token to content scripts for Firebase auth");

        // Get all tabs to send the custom token to content scripts
        const tabs = await chrome.tabs.query({});

        let signInSuccess = false;

        // Send custom token to all tabs - the settings tab should handle the Firebase sign-in
        for (const tab of tabs) {
            if (tab.id) {
                try {
                    await chrome.tabs.sendMessage(tab.id, {
                        type: "FIREBASE_CUSTOM_TOKEN_SIGNIN",
                        customToken: customToken,
                        userData: userData,
                    });
                    signInSuccess = true;
                } catch (error) {
                    // Ignore errors - content script might not be loaded on all tabs
                    console.log(`[WEBSITE AUTH] Could not send to tab ${tab.id}: ${error}`);
                }
            }
        }

        if (signInSuccess) {
            console.log("[WEBSITE AUTH] Custom token sent to content scripts for Firebase authentication");
        } else {
            console.warn("[WEBSITE AUTH] No content scripts received the custom token");
        }
    } catch (error) {
        console.error("[WEBSITE AUTH] Error in handleWebsiteAuth:", error);
        throw error;
    }
}
