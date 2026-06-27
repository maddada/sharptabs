import { useEffect, useState } from "react";
import Fuse from "fuse.js";
import { CombinedItem, ItemType } from "@/types/CombinedItem";
import { mapChromeTabToTab } from "../helpers/mapChromeTabToTab";
import { mapChromeGroupToTabGroup } from "../helpers/mapChromeGroupToTabGroup";
import { createOtherWindowGroupDndId, createOtherWindowTabDndId } from "../helpers/dragAndDrop/otherWindowDnd";

export function useFilterOtherWindows(searchTerm: string, showWhenSearchIsEmpty: boolean = false) {
    const [_otherWindowsData, _setOtherWindowsData] = useState<
        {
            windowId: number;
            windowTitle: string;
            items: CombinedItem[];
        }[]
    >([]);
    const [currentWindowId, setCurrentWindowId] = useState<number | null>(null);

    const shouldShowOtherWindows = searchTerm || showWhenSearchIsEmpty;
    const otherWindowsData = shouldShowOtherWindows ? _otherWindowsData : [];
    const setOtherWindowsData = _setOtherWindowsData;

    useEffect(() => {
        if (!shouldShowOtherWindows) {
            return;
        }
        let isCancelled = false;

        const loadOtherWindows = async () => {
            const currentWindow = await chrome.windows.getCurrent();
            setCurrentWindowId(currentWindow.id ?? null);
            const allWindows = (await chrome.windows.getAll({ populate: true })).filter((w) => w.type === "normal");
            const others: typeof otherWindowsData = [];

            for (const [i, window] of allWindows.entries()) {
                if (window.id === currentWindow.id) continue;
                const windowId = window.id ?? 0;
                const chromeTabs = (window.tabs ?? []).map(mapChromeTabToTab);
                const chromeGroups = await chrome.tabGroups.query({ windowId: window.id });
                const pinnedTabs = chromeTabs.filter((tab) => tab.pinned);
                const regularAndGrouped = chromeTabs.filter((tab) => !tab.pinned);
                const groupsWithTabs = chromeGroups
                    .map((group) => {
                        const groupTabs = regularAndGrouped.filter((tab) => tab.groupId === group.id);
                        return mapChromeGroupToTabGroup(group, groupTabs);
                    })
                    .filter((g) => g.tabs.length > 0);
                const ungroupedRegular = regularAndGrouped.filter((tab) => tab.groupId === -1);
                const results: CombinedItem[] = [];

                if (!searchTerm) {
                    results.push(
                        ...pinnedTabs.map((tab) => ({
                            type: ItemType.PINNED,
                            data: tab,
                            index: tab.index,
                            dndId: createOtherWindowTabDndId(windowId, tab.id),
                        })),
                        ...ungroupedRegular.map((tab) => ({
                            type: ItemType.REGULAR,
                            data: tab,
                            index: tab.index,
                            dndId: createOtherWindowTabDndId(windowId, tab.id),
                        })),
                        ...groupsWithTabs.map((group) => ({
                            type: ItemType.GROUP,
                            data: group,
                            index: group.index,
                            dndId: createOtherWindowGroupDndId(windowId, group.id),
                        }))
                    );
                } else {
                    const fuseOptions = { keys: ["title", "url"], threshold: 0.3, includeScore: true, ignoreLocation: true };
                    const fusePinned = new Fuse(pinnedTabs, fuseOptions);
                    const fuseRegular = new Fuse(ungroupedRegular, fuseOptions);
                    const fuseGroupTabs = groupsWithTabs.map((group) => ({
                        groupId: group.id,
                        fuse: new Fuse(group.tabs, fuseOptions),
                    }));
                    const addedTabIds = new Set<number>();

                    fusePinned.search(searchTerm).forEach((result) => {
                        results.push({
                            type: ItemType.PINNED,
                            data: result.item,
                            index: result.item.index,
                            dndId: createOtherWindowTabDndId(windowId, result.item.id),
                        });
                        addedTabIds.add(result.item.id);
                    });

                    fuseRegular.search(searchTerm).forEach((result) => {
                        results.push({
                            type: ItemType.REGULAR,
                            data: result.item,
                            index: result.item.index,
                            dndId: createOtherWindowTabDndId(windowId, result.item.id),
                        });
                        addedTabIds.add(result.item.id);
                    });

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
                                dndId: createOtherWindowGroupDndId(windowId, group.id),
                            });
                        }
                    });
                }

                if (results.length > 0) {
                    others.push({
                        windowId,
                        windowTitle: `Window ${i + 1}`,
                        items: results.sort((a, b) => a.index - b.index),
                    });
                }
            }

            if (!isCancelled) setOtherWindowsData(others);
        };

        void loadOtherWindows();

        const reloadOtherWindows = () => {
            void loadOtherWindows();
        };

        chrome.tabs.onCreated.addListener(reloadOtherWindows);
        chrome.tabs.onRemoved.addListener(reloadOtherWindows);
        chrome.tabs.onMoved.addListener(reloadOtherWindows);
        chrome.tabs.onAttached.addListener(reloadOtherWindows);
        chrome.tabs.onDetached.addListener(reloadOtherWindows);
        chrome.tabs.onUpdated.addListener(reloadOtherWindows);
        chrome.tabGroups.onCreated.addListener(reloadOtherWindows);
        chrome.tabGroups.onRemoved.addListener(reloadOtherWindows);
        chrome.tabGroups.onMoved.addListener(reloadOtherWindows);
        chrome.tabGroups.onUpdated.addListener(reloadOtherWindows);
        chrome.windows.onCreated.addListener(reloadOtherWindows);
        chrome.windows.onRemoved.addListener(reloadOtherWindows);

        return () => {
            isCancelled = true;
            chrome.tabs.onCreated.removeListener(reloadOtherWindows);
            chrome.tabs.onRemoved.removeListener(reloadOtherWindows);
            chrome.tabs.onMoved.removeListener(reloadOtherWindows);
            chrome.tabs.onAttached.removeListener(reloadOtherWindows);
            chrome.tabs.onDetached.removeListener(reloadOtherWindows);
            chrome.tabs.onUpdated.removeListener(reloadOtherWindows);
            chrome.tabGroups.onCreated.removeListener(reloadOtherWindows);
            chrome.tabGroups.onRemoved.removeListener(reloadOtherWindows);
            chrome.tabGroups.onMoved.removeListener(reloadOtherWindows);
            chrome.tabGroups.onUpdated.removeListener(reloadOtherWindows);
            chrome.windows.onCreated.removeListener(reloadOtherWindows);
            chrome.windows.onRemoved.removeListener(reloadOtherWindows);
        };
    }, [searchTerm, shouldShowOtherWindows, setOtherWindowsData]);

    return [otherWindowsData, setOtherWindowsData, currentWindowId, setCurrentWindowId] as const;
}
