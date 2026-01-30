import { convertChromeTabToTab } from "@/utils/tabs/convertChromeTabToTab";
import { isDiscardedTab } from "@/utils/tabs/isDiscardedTab";
import { isGroupedTab } from "@/utils/tabs/isGroupedTab";
import { isSpecialBrowserTab } from "@/utils/tabs/isSpecialBrowserTab";

// Suspend a tab by its ID using native chrome.tabs.discard()
export async function handleSuspendTabById(tabId: number, autoSuspendPinnedTabs: boolean = false, enableSuspendingGroupedTabs: boolean = false) {
    try {
        // Check if tab still exists and is not already discarded
        const tab = await chrome.tabs.get(tabId);
        const convertedTab = convertChromeTabToTab(tab);

        if (tab && !isDiscardedTab(convertedTab) && !isSpecialBrowserTab(convertedTab) && !tab.active && tab.autoDiscardable) {
            // If the tab is pinned and autoSuspendPinnedTabs is false, don't suspend
            if (tab.pinned && !autoSuspendPinnedTabs) {
                console.log(`[Suspend] Skipping suspension of pinned tab: ${tab.title}`);
                return;
            }

            // If the tab is in a group and enableSuspendingGroupedTabs is false, don't suspend
            if (isGroupedTab(convertedTab) && !enableSuspendingGroupedTabs) {
                console.log(`[Suspend] Skipping suspension of grouped tab: ${tab.title}`);
                return;
            }

            console.log(`[Suspend] Discarding tab ${tabId}: ${tab.title}`);
            await chrome.tabs.discard(tabId);
        }
    } catch (error) {
        // Tab might have been closed, ignore error
        console.log(`Could not suspend tab ${tabId}:`, error);
    }
}
