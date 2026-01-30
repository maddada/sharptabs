import { TabsManager } from "@/components/tabs-manager/TabsManager";
import { SettingsProvider } from "@/providers/SettingsProvider";
import "@/styles/globals.css";
import { convex } from "@/utils/convex";
import { ConvexProvider } from "convex/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { defaultSettings, getDefaultNewTabLink } from "@/stores/settingsStore";

// Function to check if redirect is needed and perform it
async function checkAndRedirectIfNeeded(): Promise<boolean> {
    return new Promise((resolve) => {
        chrome.storage.local.get(
            {
                enableSharpTabsNewTabPage: defaultSettings.enableSharpTabsNewTabPage,
                newTabLink: defaultSettings.newTabLink,
            },
            async (items) => {
                if (!items.enableSharpTabsNewTabPage) {
                    // Get the appropriate redirect URL
                    let redirectUrl = items.newTabLink;
                    if (!redirectUrl || redirectUrl === defaultSettings.newTabLink) {
                        // If no custom URL is set, get the browser-specific default
                        redirectUrl = await getDefaultNewTabLink();
                    }
                    // Redirect immediately using Chrome API
                    console.log("Sharp Tabs new tab page disabled, redirecting to:", redirectUrl);
                    chrome.tabs.getCurrent((tab) => {
                        if (tab?.id) {
                            chrome.tabs.update(tab.id, { url: redirectUrl });
                        } else {
                            // Fallback for cases where getCurrent doesn't work
                            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                                if (tabs[0]?.id) {
                                    chrome.tabs.update(tabs[0].id, { url: redirectUrl });
                                }
                            });
                        }
                    });
                    resolve(true); // Redirected
                } else {
                    resolve(false); // No redirect needed
                }
            }
        );
    });
}

// Component for Sharp Tabs new tab page
export function NewTabPageWrapper() {
    return (
        <ConvexProvider client={convex}>
            <SettingsProvider>
                <TabsManager initialContainerHeight="100%" initialInNewTab={true} />
            </SettingsProvider>
        </ConvexProvider>
    );
}

// Initialize the page
async function initializePage() {
    const container = document.getElementById("root");
    if (!container) return;

    // Check if we need to redirect before rendering anything
    const didRedirect = await checkAndRedirectIfNeeded();

    // Only render the React component if we didn't redirect
    if (!didRedirect) {
        const root = createRoot(container);
        root.render(
            <StrictMode>
                <NewTabPageWrapper />
            </StrictMode>
        );
    }
}

// Start the initialization
initializePage();
