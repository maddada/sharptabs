import { ItemType } from "@/types/CombinedItem";
import { Tab } from "@/types/Tab";
import { TabGroup } from "@/types/TabGroup";
import { parseDndId } from "./parseDndId";

export const getDraggedItemData = (activeDndId: string | null, pinnedTabs: Tab[], regularTabs: Tab[], tabGroups: TabGroup[]) => {
    if (!activeDndId) return null;
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
