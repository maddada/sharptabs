import { Tab } from "@/types/Tab";
import { groupDuplicateTabs } from "./findDuplicateTabs";

/**
 * Closes all duplicate tabs, keeping either the first or last occurrence of each duplicate group.
 * @param keepPreference - Which duplicate to keep: "first" or "last"
 * @param strictDuplicateChecking - Whether to use strict URL comparison
 * @returns The number of tabs closed
 */
export async function closeAllDuplicates(keepPreference: "first" | "last", strictDuplicateChecking: boolean): Promise<number> {
    // Get all tabs in the current window
    const chromeTabs = await chrome.tabs.query({ currentWindow: true });

    // Convert chrome tabs to our Tab type
    const tabs: Tab[] = chromeTabs.map((tab) => ({
        id: tab.id ?? -1,
        title: tab.title ?? "",
        url: tab.url ?? "",
        pinned: tab.pinned ?? false,
        groupId: tab.groupId ?? -1,
        index: tab.index ?? 0,
        favIconUrl: tab.favIconUrl,
        audible: tab.audible,
        mutedInfo: tab.mutedInfo,
        discarded: tab.discarded,
        status: tab.status,
        autoDiscardable: tab.autoDiscardable,
        active: tab.active,
        windowId: tab.windowId,
    }));

    // Get duplicate groups
    const duplicateGroups = groupDuplicateTabs(tabs, strictDuplicateChecking);

    // Collect tab IDs to close
    const tabIdsToClose: number[] = [];

    duplicateGroups.forEach((tabIds) => {
        // Determine which tabs to close based on keepPreference
        if (keepPreference === "first") {
            // Keep the first tab (index 0), close the rest
            tabIdsToClose.push(...tabIds.slice(1));
        } else {
            // Keep the last tab, close the rest
            tabIdsToClose.push(...tabIds.slice(0, -1));
        }
    });

    // Close the duplicate tabs
    if (tabIdsToClose.length > 0) {
        await chrome.tabs.remove(tabIdsToClose);
    }

    return tabIdsToClose.length;
}
