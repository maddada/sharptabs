import { handleSuspendCurrentTab } from "./handleSuspendCurrentTab";
import { discardTabsNativelySafely } from "@/utils/tabs/discardTabsNativelySafely";
import { isNewTab } from "@/utils/tabs/isNewTab";

export async function handleSuspendGroupTabs(tab: chrome.tabs.Tab) {
    if (tab && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
        console.log(`[Suspend] handleSuspendGroupTabs called for group ${tab.groupId}`);

        const groupId = tab.groupId;
        const groupTabs = await chrome.tabs.query({ groupId: groupId });
        const tabsToSuspend = groupTabs.filter((t) => !isNewTab(t));

        console.log(`[Suspend] Found ${tabsToSuspend.length} tab(s) to suspend in group`);

        if (tabsToSuspend.length === 0) return;

        const tabIdsToDiscard = tabsToSuspend.map((t) => t.id).filter((id): id is number => typeof id === "number");
        await discardTabsNativelySafely(tabIdsToDiscard, { windowId: tab.windowId });
    } else {
        handleSuspendCurrentTab(tab);
    }
}
