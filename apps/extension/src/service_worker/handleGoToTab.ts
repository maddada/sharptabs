export async function handleGoToTab(tab: chrome.tabs.Tab, tabNumber: number) {
    try {
        if (!tab || !tab.windowId) {
            console.log("Invalid tab or windowId");
            return;
        }

        // Get all tabs in the current window
        const tabs = await chrome.tabs.query({ windowId: tab.windowId });

        // Sort tabs by index to ensure correct order
        tabs.sort((a, b) => a.index - b.index);

        // Check if the requested tab number exists (1-indexed)
        if (tabNumber >= 1 && tabNumber <= tabs.length) {
            const targetTab = tabs[tabNumber - 1]; // Convert to 0-indexed
            if (targetTab && targetTab.id) {
                await chrome.tabs.update(targetTab.id, { active: true });
                console.log(`Switched to tab ${tabNumber}: ${targetTab.title}`);
            }
        } else {
            console.log(`Tab ${tabNumber} does not exist in this window`);
        }
    } catch (error) {
        console.log(`Error switching to tab ${tabNumber}:`, error);
    }
}
