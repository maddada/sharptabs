export async function handleDuplicateTab(tab: chrome.tabs.Tab) {
    if (!tab.id) return;

    try {
        // First, try to get selected tabs from the UI
        let selectedTabIds: Set<number>;
        try {
            const response = await chrome.runtime.sendMessage({
                type: "GET_SELECTED_TABS",
            });

            if (response && response.selectedTabIds && response.selectedTabIds.length > 1) {
                // If there are multiple selected tabs, duplicate all of them
                selectedTabIds = new Set(response.selectedTabIds);
            } else {
                // If no selection or single tab, just duplicate the current tab
                selectedTabIds = new Set([tab.id]);
            }
        } catch (error) {
            console.error("Error getting selected tabs:", error);
            // If UI is not available, just duplicate the current tab
            selectedTabIds = new Set([tab.id]);
        }

        // Get all tabs in the current window
        const allTabs = await chrome.tabs.query({ currentWindow: true });
        const tabsToDuplicate = allTabs.filter((t) => t.id && selectedTabIds.has(t.id));

        // Sort by index to maintain order when duplicating
        tabsToDuplicate.sort((a, b) => a.index - b.index);

        // Duplicate each selected tab
        for (let i = 0; i < tabsToDuplicate.length; i++) {
            const currentTab = tabsToDuplicate[i];

            if (!currentTab.id) continue;

            try {
                const sourceTab = await chrome.tabs.get(currentTab.id);
                const duplicatedTab = await chrome.tabs.duplicate(currentTab.id);
                if (duplicatedTab?.id) {
                    // Place duplicated tab right after the source tab
                    // For multiple tabs, we need to account for previously duplicated tabs
                    const newIndex = sourceTab.index + 1 + i;
                    await chrome.tabs.move(duplicatedTab.id, { index: newIndex });
                }
            } catch (tabError) {
                console.log(`Error duplicating tab ${currentTab.id}:`, tabError);
            }
        }
    } catch (error) {
        console.log("Error in handleDuplicateTab:", error);

        // Fallback: just duplicate the current tab if everything else fails
        try {
            if (tab.id) {
                const sourceTab = await chrome.tabs.get(tab.id);
                const duplicatedTab = await chrome.tabs.duplicate(tab.id);
                if (duplicatedTab?.id) {
                    await chrome.tabs.move(duplicatedTab.id, { index: sourceTab.index + 1 });
                }
            }
        } catch (fallbackError) {
            console.log("Error in duplicate fallback:", fallbackError);
        }
    }
}
