import { create } from "zustand";
import { Tab } from "@/types/Tab";
import { TabGroup } from "@/types/TabGroup";
import { useSettingsStore } from "@/stores/settingsStore";

function getActiveGroupId(tabGroups: TabGroup[], activeTabId: number): number | undefined {
    if (activeTabId < 0) return undefined;
    return tabGroups.find((group) => group.tabs.some((tab) => tab.id === activeTabId))?.id;
}

function syncChromeCollapseState(
    prevCollapsedGroups: Set<number>,
    nextCollapsedGroups: Set<number>,
    tabGroups: TabGroup[],
    activeTabId: number
) {
    if (!useSettingsStore.getState().settings.syncChromeTabGroupCollapseState) return;

    const availableGroupIds = new Set(tabGroups.map((group) => group.id));
    const changedGroupIds = new Set<number>();
    const activeGroupId = getActiveGroupId(tabGroups, activeTabId);

    for (const groupId of prevCollapsedGroups) {
        if (!availableGroupIds.has(groupId)) continue;
        if (!nextCollapsedGroups.has(groupId)) changedGroupIds.add(groupId);
    }

    for (const groupId of nextCollapsedGroups) {
        if (!availableGroupIds.has(groupId)) continue;
        if (!prevCollapsedGroups.has(groupId)) changedGroupIds.add(groupId);
    }

    for (const groupId of changedGroupIds) {
        const shouldBeCollapsed = nextCollapsedGroups.has(groupId);
        // Keep the active tab's Chrome group expanded when syncing collapse state.
        if (shouldBeCollapsed && activeGroupId === groupId) {
            chrome.tabGroups.update(groupId, { collapsed: false }).catch((error) => {
                console.log("Failed keeping active Chrome group expanded while syncing:", groupId, error);
            });
            continue;
        }

        chrome.tabGroups.update(groupId, { collapsed: shouldBeCollapsed }).catch((error) => {
            console.log("Failed syncing Chrome group collapse state:", groupId, error);
        });
    }
}

export type TabsStore = {
    activeTabId: number;
    prevActiveTabId: number | null;
    pinnedTabs: Tab[];
    regularTabs: Tab[];
    tabGroups: TabGroup[];
    collapsedGroups: Set<number>;
    actions: {
        setActiveTabId: (id: number) => void;
        setPrevActiveTabId: (id: number) => void;
        setPinnedTabs: (tabs: Tab[]) => void;
        setRegularTabs: (tabs: Tab[]) => void;
        setTabGroups: (groups: TabGroup[]) => void;
        setCollapsedGroups: (groups: Set<number>) => void;
        toggleGroup: (groupId: number) => void;
        collapseGroup: (groupId: number) => void;
        expandGroup: (groupId: number) => void;
        persistCollapsedGroups: () => void;
    };
};

export const useTabsStore = create<TabsStore>((set, get) => ({
    activeTabId: -1,
    prevActiveTabId: null,
    pinnedTabs: [],
    regularTabs: [],
    tabGroups: [],
    collapsedGroups: new Set(),

    actions: {
        setActiveTabId: (id) => set({ prevActiveTabId: get().activeTabId, activeTabId: id }),
        setPrevActiveTabId: (id) => set({ prevActiveTabId: id }),
        setPinnedTabs: (tabs) => set({ pinnedTabs: tabs }),
        setRegularTabs: (tabs) => set({ regularTabs: tabs }),
        setTabGroups: (groups) => set({ tabGroups: groups }),

        setCollapsedGroups: (groups) => {
            const prevCollapsedGroups = get().collapsedGroups;
            set({ collapsedGroups: groups });
            get().actions.persistCollapsedGroups();
            syncChromeCollapseState(prevCollapsedGroups, groups, get().tabGroups, get().activeTabId);
        },

        toggleGroup: (groupId: number) => {
            const newCollapsedGroups = new Set(get().collapsedGroups);
            newCollapsedGroups.has(groupId) ? newCollapsedGroups.delete(groupId) : newCollapsedGroups.add(groupId);
            get().actions.setCollapsedGroups(newCollapsedGroups);
        },

        collapseGroup: (groupId: number) => {
            const newCollapsedGroups = new Set(get().collapsedGroups);
            newCollapsedGroups.add(groupId);
            get().actions.setCollapsedGroups(newCollapsedGroups);
        },

        expandGroup: (groupId: number) => {
            const newCollapsedGroups = new Set(get().collapsedGroups);
            newCollapsedGroups.delete(groupId);
            get().actions.setCollapsedGroups(newCollapsedGroups);
        },

        persistCollapsedGroups: () => {
            const { collapsedGroups, tabGroups } = get();
            // Save the names of the tab groups that are collapsed,
            // not the ids (because the ids change between sessions)
            const collapsedGroupsNames = Array.from(tabGroups)
                .filter((group) => collapsedGroups.has(group.id))
                .map((group) => group.title ?? "");
            chrome.storage.local.set({ collapsedGroups: collapsedGroupsNames });
        },
    },
}));
