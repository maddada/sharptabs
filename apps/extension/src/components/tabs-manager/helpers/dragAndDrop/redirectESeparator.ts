import { Over } from "@dnd-kit/core";
import { Tab } from "@/types/Tab";
import { TabGroup } from "@/types/TabGroup";
import { ItemType, ItemTypeEnum } from "@/types/CombinedItem";
import { ParsedDndId } from "../types/dragDrop";
import { logDragOperation } from "./logDragOperation";

export const redirectESeparator = (
    overParsed: ParsedDndId,
    regularTabs: Tab[],
    tabGroups: TabGroup[]
): { over: Over; overParsed: ParsedDndId } | null => {
    if (overParsed.type !== ItemType.ESEPARATOR) return null;

    let lastItem: Tab | TabGroup | null = null;
    let lastItemType: ItemTypeEnum | null = null;
    let highestIndex = -1;

    if (regularTabs.length > 0) {
        const lastRegularTab = regularTabs[regularTabs.length - 1];
        if (lastRegularTab.index > highestIndex) {
            lastItem = lastRegularTab;
            lastItemType = ItemType.REGULAR;
            highestIndex = lastRegularTab.index;
        }
    }

    if (tabGroups.length > 0) {
        const lastTabGroup = tabGroups[tabGroups.length - 1];
        if (lastTabGroup.index > highestIndex) {
            lastItem = lastTabGroup;
            lastItemType = ItemType.GROUP;
            highestIndex = lastTabGroup.index;
        }
    }

    if (lastItem && lastItemType) {
        const newOverId = lastItemType === ItemType.GROUP ? `${ItemType.GSEPARATOR}-${lastItem.id}` : `${lastItemType}-${lastItem.id}`;

        const newOverParsed =
            lastItemType === ItemType.GROUP ? { type: ItemType.GSEPARATOR, id: lastItem.id } : { type: lastItemType, id: lastItem.id };

        logDragOperation("ESEPARATOR-REDIRECT", {
            message: "Redirecting eseparator drop to last item",
            originalOverId: "eseparator-1",
            newOverId,
            lastItemId: lastItem.id,
            lastItemType,
            redirectedToType: newOverParsed.type,
            lastItemIndex: highestIndex,
        });

        return {
            over: { id: newOverId } as Over,
            overParsed: newOverParsed,
        };
    }

    return null;
};
