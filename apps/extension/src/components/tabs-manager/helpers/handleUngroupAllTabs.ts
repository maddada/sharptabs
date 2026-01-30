import { toast } from "sonner";
import { loadTabs } from "./loadTabs";

export async function handleUngroupAllTabs() {
    try {
        // Get all tab IDs that are currently in a group
        const allTabs = await chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });
        const groupedTabIds = allTabs
            .filter((tab) => typeof tab.groupId === "number" && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE)
            .map((tab) => tab.id ?? 0);

        if (groupedTabIds.length === 0) {
            toast.error("No grouped tabs to ungroup.");
            return;
        }

        // Ungroup all grouped tabs
        await chrome.tabs.ungroup(groupedTabIds);

        // Optionally reload tabs/groups state after ungrouping
        loadTabs("ungroupAllTabs");

        toast.success("Completed ungrouping all tabs in this window");
    } catch (err) {
        // Optionally handle error, e.g. show a toast
        console.log("Failed to ungroup all tabs", err);
    }
}
