import { useEffect, useState } from "react";
import Fuse from "fuse.js";
import { CombinedItem, ItemType } from "@/types/CombinedItem";
import { mapChromeTabToTab } from "../helpers/mapChromeTabToTab";
import { mapChromeGroupToTabGroup } from "../helpers/mapChromeGroupToTabGroup";

export function useFilterOtherWindows(searchTerm: string) {
    const [_otherWindowsData, _setOtherWindowsData] = useState<
        {
            windowId: number;
            windowTitle: string;
            items: CombinedItem[];
        }[]
    >([]);
    const [currentWindowId, setCurrentWindowId] = useState<number | null>(null);

    // Derive the actual data - when searchTerm is empty, return empty array
    const otherWindowsData = searchTerm ? _otherWindowsData : [];
    const setOtherWindowsData = _setOtherWindowsData;

    useEffect(() => {
        if (!searchTerm) {
            return;
        }
        let isCancelled = false;
        (async () => {
            // Get current window ID
            const currentWindow = await chrome.windows.getCurrent();
            setCurrentWindowId(currentWindow.id ?? null);
            // Get all windows
            const allWindows = (await chrome.windows.getAll({ populate: true })).filter((w) => w.type === "normal");
            // For each window (except current), get tabs and groups
            const others: typeof otherWindowsData = [];
            for (const [i, window] of allWindows.entries()) {
                if (window.id === currentWindow.id) continue;
                const chromeTabs = (window.tabs ?? []).map(mapChromeTabToTab);
                // Get tab groups for this window
                const chromeGroups = await chrome.tabGroups.query({ windowId: window.id });
                // Split tabs into pinned, regular, grouped
                const pinnedTabs = chromeTabs.filter((tab) => tab.pinned);
                const regularAndGrouped = chromeTabs.filter((tab) => !tab.pinned);
                // Map groups
                const groupsWithTabs = chromeGroups
                    .map((group) => {
                        const groupTabs = regularAndGrouped.filter((tab) => tab.groupId === group.id);
                        return mapChromeGroupToTabGroup(group, groupTabs);
                    })
                    .filter((g) => g.tabs.length > 0);
                // Ungrouped regular tabs
                const ungroupedRegular = regularAndGrouped.filter((tab) => tab.groupId === -1);
                // Fuzzy search
                const fuseOptions = { keys: ["title", "url"], threshold: 0.3, includeScore: true, ignoreLocation: true };
                const fusePinned = new Fuse(pinnedTabs, fuseOptions);
                const fuseRegular = new Fuse(ungroupedRegular, fuseOptions);
                const fuseGroupTabs = groupsWithTabs.map((group) => ({
                    groupId: group.id,
                    fuse: new Fuse(group.tabs, fuseOptions),
                }));
                const results: CombinedItem[] = [];
                const addedTabIds = new Set<number>();
                // Search Pinned
                fusePinned.search(searchTerm).forEach((result) => {
                    results.push({
                        type: ItemType.PINNED,
                        data: result.item,
                        index: result.item.index,
                        dndId: `${ItemType.PINNED}-${result.item.id}`,
                    });
                    addedTabIds.add(result.item.id);
                });
                // Search Regular
                fuseRegular.search(searchTerm).forEach((result) => {
                    results.push({
                        type: ItemType.REGULAR,
                        data: result.item,
                        index: result.item.index,
                        dndId: `${ItemType.REGULAR}-${result.item.id}`,
                    });
                    addedTabIds.add(result.item.id);
                });
                // Search Groups (all expanded)
                groupsWithTabs.forEach((group) => {
                    const groupFuse = fuseGroupTabs.find((f) => f.groupId === group.id)?.fuse;
                    if (!groupFuse) return;
                    const matchingTabs = groupFuse
                        .search(searchTerm)
                        .map((result) => result.item)
                        .filter((tab) => !addedTabIds.has(tab.id));
                    if (matchingTabs.length > 0) {
                        results.push({
                            type: ItemType.GROUP,
                            data: { ...group, tabs: matchingTabs },
                            index: group.index,
                            dndId: `${ItemType.GROUP}-${group.id}`,
                        });
                    }
                });
                // Only add if there are results
                if (results.length > 0) {
                    others.push({
                        windowId: window.id ?? 0,
                        windowTitle: `Window ${i + 1}`,
                        items: results.sort((a, b) => a.index - b.index),
                    });
                }
            }
            if (!isCancelled) setOtherWindowsData(others);
        })();
        return () => {
            isCancelled = true;
        };
    }, [searchTerm, setOtherWindowsData]);

    return [otherWindowsData, setOtherWindowsData, currentWindowId, setCurrentWindowId] as const;
}
