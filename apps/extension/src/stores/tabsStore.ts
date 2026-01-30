import { create } from "zustand";
import { Tab } from "@/types/Tab";
import { TabGroup } from "@/types/TabGroup";

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
            set({ collapsedGroups: groups });
            get().actions.persistCollapsedGroups();
        },

        toggleGroup: (groupId: number) => {
            set((state) => {
                const newCollapsedGroups = new Set(state.collapsedGroups);
                newCollapsedGroups.has(groupId) ? newCollapsedGroups.delete(groupId) : newCollapsedGroups.add(groupId);
                return { collapsedGroups: newCollapsedGroups };
            });
            get().actions.persistCollapsedGroups();
        },

        collapseGroup: (groupId: number) => {
            set((state) => {
                const newCollapsedGroups = new Set(state.collapsedGroups);
                newCollapsedGroups.add(groupId);
                return { collapsedGroups: newCollapsedGroups };
            });
            get().actions.persistCollapsedGroups();
        },

        expandGroup: (groupId: number) => {
            set((state) => {
                const newCollapsedGroups = new Set(state.collapsedGroups);
                newCollapsedGroups.delete(groupId);
                return { collapsedGroups: newCollapsedGroups };
            });
            get().actions.persistCollapsedGroups();
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
