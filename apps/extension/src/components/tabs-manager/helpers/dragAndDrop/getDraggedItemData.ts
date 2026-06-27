import { CombinedItem, ItemType } from "@/types/CombinedItem";
import { Tab } from "@/types/Tab";
import { TabGroup } from "@/types/TabGroup";
import { parseOtherWindowDndId } from "./otherWindowDnd";
import { parseDndId } from "./parseDndId";

export const getDraggedItemData = (
    activeDndId: string | null,
    pinnedTabs: Tab[],
    regularTabs: Tab[],
    tabGroups: TabGroup[],
    otherWindowsData: Array<{ windowId: number; items: CombinedItem[] }> = []
) => {
    if (!activeDndId) return null;

    const otherWindowParsed = parseOtherWindowDndId(activeDndId);
    if (otherWindowParsed) {
        for (const windowData of otherWindowsData) {
            if (windowData.windowId !== otherWindowParsed.windowId) continue;

            for (const item of windowData.items) {
                if (otherWindowParsed.type === "group" && item.type === ItemType.GROUP && item.data.id === otherWindowParsed.id) {
                    return item.data;
                }

                if (item.type === ItemType.GROUP) {
                    const tab = (item.data as TabGroup).tabs.find((groupTab) => groupTab.id === otherWindowParsed.id);
                    if (tab) return tab;
                    continue;
                }

                if ((item.type === ItemType.PINNED || item.type === ItemType.REGULAR) && item.data.id === otherWindowParsed.id) {
                    return item.data;
                }
            }
        }

        return null;
    }

    const parsed = parseDndId(activeDndId);
    if (!parsed) return null;

    if (parsed.type === ItemType.PINNED) return pinnedTabs.find((t) => t.id === parsed.id);
    if (parsed.type === ItemType.CPINNED) return pinnedTabs.find((t) => t.id === parsed.id);
    if (parsed.type === ItemType.REGULAR) return regularTabs.find((t) => t.id === parsed.id);
    if (parsed.type === ItemType.GROUP) return tabGroups.find((g) => g.id === parsed.id);
    if (parsed.type === ItemType.GTAB) {
        for (const group of tabGroups) {
            const tab = group.tabs.find((t) => t.id === parsed.id);
            if (tab) return tab;
        }
    }
    return null;
};
