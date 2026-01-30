import { defaultSettings, getDefaultNewTabLink } from "@/stores/settingsStore";

/**
 * Gets the appropriate URL for creating new tabs based on the user's settings.
 * Returns undefined if Sharp Tabs new tab page should be used (default chrome behavior),
 * or the alternative URL if the setting is disabled.
 */
export async function getNewTabUrl(): Promise<string | undefined> {
    return new Promise((resolve) => {
        chrome.storage.local.get(
            {
                enableSharpTabsNewTabPage: defaultSettings.enableSharpTabsNewTabPage,
                newTabLink: defaultSettings.newTabLink,
            },
            async (items) => {
                if (items.enableSharpTabsNewTabPage) {
                    // Sharp Tabs new tab page is enabled, use default chrome behavior
                    resolve(undefined);
                } else {
                    // Sharp Tabs new tab page is disabled, use alternative URL
                    let redirectUrl = items.newTabLink;
                    if (!redirectUrl || redirectUrl === defaultSettings.newTabLink) {
                        // If no custom URL is set, get the browser-specific default
                        redirectUrl = await getDefaultNewTabLink();
                    }
                    resolve(redirectUrl);
                }
            }
        );
    });
}
