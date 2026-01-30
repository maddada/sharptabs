import { useTabManagerStore } from "@/stores/tabManagerStore";
import { useTabsStore } from "@/stores/tabsStore";
import { scrollToActiveTab } from "@/utils/tabs/scrollToActiveTab";

export function expandAndScrollToActiveTab(fromButton: boolean = false, tabId?: number) {
    const { activeTabId, tabGroups, collapsedGroups, actions: tabsActions } = useTabsStore.getState();
    const { scrollContainerRef } = useTabManagerStore.getState();
    const { setSkipAnimation } = useTabManagerStore.getState().actions;

    const targetTabId = tabId || activeTabId;
    if (!targetTabId) {
        return;
    }

    const activeTabGroup = tabGroups.find((group) => group.tabs.some((tab) => tab.id === targetTabId));
    const targetTabForScroll = targetTabId; // ID to scroll to

    if (activeTabGroup && collapsedGroups.has(activeTabGroup.id)) {
        setSkipAnimation(false);
        tabsActions.expandGroup(activeTabGroup.id);
        // Scroll after state update and re-render
        setTimeout(() => scrollToActiveTab(fromButton, targetTabForScroll, scrollContainerRef, targetTabId), 100);
    } else {
        // Group is already expanded or tab is not in a group
        scrollToActiveTab(fromButton, targetTabForScroll, scrollContainerRef, targetTabId);
    }
}
