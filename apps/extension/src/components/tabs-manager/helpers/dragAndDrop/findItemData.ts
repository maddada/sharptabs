import { Tab } from "@/types/Tab";
import { TabGroup } from "@/types/TabGroup";
import { ItemType } from "@/types/CombinedItem";
import { ParsedDndId } from "../types/dragDrop";

export const findItemData = (parsedId: ParsedDndId | null, pinnedTabs: Tab[], regularTabs: Tab[], tabGroups: TabGroup[]): Tab | TabGroup | null => {
    if (!parsedId) return null;

    if (parsedId.type === ItemType.PINNED || parsedId.type === ItemType.CPINNED) {
        return pinnedTabs.find((t) => t.id === parsedId.id) || null;
    }
    if (parsedId.type === ItemType.REGULAR) {
        return regularTabs.find((t) => t.id === parsedId.id) || null;
    }
    if (parsedId.type === ItemType.GROUP) {
        return tabGroups.find((g) => g.id === parsedId.id) || null;
    }
    if (parsedId.type === ItemType.GTAB) {
        for (const group of tabGroups) {
            const tab = group.tabs.find((t) => t.id === parsedId.id);
            if (tab) return tab;
        }
    }
    if (parsedId.type === ItemType.ESEPARATOR) {
        return {
            type: ItemType.ESEPARATOR,
            id: parsedId.id,
            title: "",
            url: "",
            pinned: false,
            index: 0,
            groupId: -1,
            favIconUrl: "",
        } as Tab;
    }
    return null;
};
