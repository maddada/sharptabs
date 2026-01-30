import { useSelectionStore } from "@/stores/selectionStore";
import { useTabsStore } from "@/stores/tabsStore";
import { CombinedItem, ItemType } from "@/types/CombinedItem";
import { Tab } from "@/types/Tab";
import { TabGroup } from "@/types/TabGroup";

export const getAllTabIdsInRenderOrder = (itemsToRender: CombinedItem[]) => {
    const ids: number[] = [];
    itemsToRender.forEach((item) => {
        if (item.type === ItemType.PINNED || item.type === ItemType.CPINNED || item.type === ItemType.REGULAR) {
            ids.push(item.data.id);
        } else if (item.type === ItemType.GROUP) {
            const group = item.data as TabGroup;
            (group.tabs || []).forEach((tab: Tab) => ids.push(tab.id));
        }
    });
    return ids;
};

export const handleTabSelection = (e: React.MouseEvent | React.KeyboardEvent, tabId: number, itemsToRender: CombinedItem[]) => {
    const selectedTabsStore = useSelectionStore.getState();
    const { setSelectedTabIds, setSelectedTabs, setLastSelectedTabId } = selectedTabsStore.actions;
    const tabsStore = useTabsStore.getState();
    const pinnedTabs = tabsStore.pinnedTabs;
    const regularTabs = tabsStore.regularTabs;
    const tabGroups = tabsStore.tabGroups;

    if (e.ctrlKey || e.metaKey) {
        const newSet = new Set(selectedTabsStore.selectedTabIds);
        if (newSet.has(tabId)) {
            newSet.delete(tabId);
        } else {
            newSet.add(tabId);
        }
        setSelectedTabIds(newSet);
        setSelectedTabs([...regularTabs, ...pinnedTabs, ...tabGroups.flatMap((group) => group.tabs)].filter((tab) => newSet.has(tab.id)));
        setLastSelectedTabId(tabId);
    } else if (e.shiftKey) {
        const allIds = getAllTabIdsInRenderOrder(itemsToRender);
        // Use lastSelectedTabId if available, otherwise use the currently active tab
        const startTabId = selectedTabsStore.lastSelectedTabId !== null ? selectedTabsStore.lastSelectedTabId : tabsStore.activeTabId;
        const start = allIds.indexOf(startTabId);
        const end = allIds.indexOf(tabId);
        if (start !== -1 && end !== -1) {
            const [from, to] = start < end ? [start, end] : [end, start];
            const range = allIds.slice(from, to + 1);
            const newSet = new Set(selectedTabsStore.selectedTabIds);
            range.forEach((id) => newSet.add(id));
            selectedTabsStore.actions.setSelectedTabIds(newSet);
            selectedTabsStore.actions.setSelectedTabs(
                [...regularTabs, ...pinnedTabs, ...tabGroups.flatMap((group) => group.tabs)].filter((tab) => newSet.has(tab.id))
            );
            setLastSelectedTabId(tabId);
        }
    } else {
        const newSet = new Set([tabId]);
        setSelectedTabIds(newSet);
        setSelectedTabs([...regularTabs, ...pinnedTabs, ...tabGroups.flatMap((group) => group.tabs)].filter((tab) => newSet.has(tab.id)));
        chrome.tabs.update(tabId, { active: true });
        setLastSelectedTabId(tabId);
    }
};
