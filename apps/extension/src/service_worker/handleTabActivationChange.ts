// Notify content scripts when a tab becomes active/inactive so they can update the tabLastActiveTimestamp
export async function handleTabActivationChange(activeTabId: number, windowId: number) {
    try {
        // Get all tabs in the window
        const tabs = await chrome.tabs.query({ windowId });

        for (const tab of tabs) {
            if (tab.id) {
                const isActive = tab.id === activeTabId;
                // Send message to content script to update activity status
                chrome.tabs
                    .sendMessage(tab.id, {
                        type: "TAB_ACTIVITY_CHANGED",
                        isActive,
                        timestamp: Date.now(),
                    })
                    .catch(() => {
                        // Ignore errors - content script might not be loaded
                    });
            }
        }
    } catch (error) {
        // Ignore errors - tab might be closed or not accessible
        console.info("Error handling tab activation change:", error);
    }
}
