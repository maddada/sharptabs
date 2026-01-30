export async function handleSwitchToLastActiveTab(tab: chrome.tabs.Tab, prevActiveTabIdByWindow: Record<number, number | null>) {
    if (!tab || !tab.windowId) return;
    const windowId = tab.windowId;
    const prevTabId = prevActiveTabIdByWindow[windowId];
    if (prevTabId && prevTabId !== tab.id) {
        try {
            await chrome.tabs.update(prevTabId, { active: true });
        } catch (e) {
            // Tab may have been closed, ignore
            console.info("Error switching to last active tab:", e);
        }
    }
}
