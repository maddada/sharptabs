import { create } from "zustand";
import { Tab } from "../types/Tab";

export type SelectionStore = {
    selectedTabIds: Set<number>;
    selectedTabs: Tab[];
    lastSelectedTabId: number | null;
    actions: {
        setSelectedTabIds: (ids: Set<number>) => void;
        setSelectedTabs: (tabs: Tab[]) => void;
        setLastSelectedTabId: (id: number | null) => void;
        clearSelection: () => void;
    };
};

export const useSelectionStore = create<SelectionStore>((set) => ({
    selectedTabIds: new Set(),
    selectedTabs: [],
    lastSelectedTabId: null,
    actions: {
        setSelectedTabIds: (ids) => set({ selectedTabIds: new Set(ids) }),
        setSelectedTabs: (tabs) => set({ selectedTabs: tabs }),
        setLastSelectedTabId: (id) => set({ lastSelectedTabId: id }),
        clearSelection: () => set({ selectedTabIds: new Set(), selectedTabs: [], lastSelectedTabId: null }),
    },
}));
