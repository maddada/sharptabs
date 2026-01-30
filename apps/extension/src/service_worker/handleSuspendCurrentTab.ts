import { discardTabsNativelySafely } from "@/utils/tabs/discardTabsNativelySafely";
import { isNewTab } from "@/utils/tabs/isNewTab";

export async function handleSuspendCurrentTab(tab: chrome.tabs.Tab) {
    if (!tab.id) return;

    try {
        // First, try to get selected tabs from the UI
        let selectedTabIds: Set<number>;
        try {
            const response = await chrome.runtime.sendMessage({
                type: "GET_SELECTED_TABS",
            });

            if (response && response.selectedTabIds && response.selectedTabIds.length > 1) {
                // If there are multiple selected tabs, suspend all of them
                selectedTabIds = new Set(response.selectedTabIds);
            } else {
                // If no selection or single tab, just suspend the current tab
                selectedTabIds = new Set([tab.id]);
            }
        } catch (error) {
            // If UI is not available, just suspend the current tab
            console.info("Setting selected tab ids to current tab:", error);
            selectedTabIds = new Set([tab.id]);
        }

        // Get all tabs in the current window
        const allTabs = await chrome.tabs.query({ currentWindow: true });
        const tabsToSuspend = allTabs.filter((t) => t.id && selectedTabIds.has(t.id) && !isNewTab(t));

        console.log(`[Suspend] handleSuspendCurrentTab: Suspending ${tabsToSuspend.length} tab(s)`);

        if (tabsToSuspend.length === 0) return;

        const tabIdsToDiscard = tabsToSuspend.map((t) => t.id).filter((id): id is number => typeof id === "number");

        await discardTabsNativelySafely(tabIdsToDiscard, { windowId: tab.windowId });
    } catch (error) {
        console.log("Error in handleSuspendCurrentTab:", error);

        // Fallback: just suspend the current tab if everything else fails
        if (isNewTab(tab)) return;

        await discardTabsNativelySafely([tab.id], { windowId: tab.windowId });
    }
}
