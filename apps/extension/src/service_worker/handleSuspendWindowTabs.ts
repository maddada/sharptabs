import { discardTabsNativelySafely } from "@/utils/tabs/discardTabsNativelySafely";
import { isNewTab } from "@/utils/tabs/isNewTab";

export async function handleSuspendWindowTabs() {
    console.log(`[Suspend] handleSuspendWindowTabs called`);

    const tabs = await chrome.tabs.query({ currentWindow: true });
    const tabsToSuspend = tabs.filter((tab) => !isNewTab(tab));

    console.log(`[Suspend] Found ${tabsToSuspend.length} tab(s) to suspend in window`);

    if (tabsToSuspend.length === 0) return;

    const tabIdsToDiscard = tabsToSuspend.map((t) => t.id).filter((id): id is number => typeof id === "number");
    const windowId = tabs[0]?.windowId;
    await discardTabsNativelySafely(tabIdsToDiscard, { windowId });
}
