// Create a combined *flat* array for dnd-kit's SortableContext

import { ItemType } from "@/types/CombinedItem";
import { Tab } from "@/types/Tab";
import { TabGroup } from "@/types/TabGroup";

// Include tabs inside groups directly for drag-out functionality. Use unique IDs.
export const getDndItems = (
    pinnedTabs: Tab[],
    regularTabs: Tab[],
    tabGroups: TabGroup[],
    collapsedGroups: Set<number>,
    searchTerm: string,
    showNewTabButton: boolean = false
): string[] => {
    const items: string[] = [];
    pinnedTabs.forEach((tab) => items.push(`${ItemType.PINNED}-${tab.id}`));
    regularTabs.forEach((tab) => items.push(`${ItemType.REGULAR}-${tab.id}`));
    tabGroups.forEach((group) => {
        items.push(`${ItemType.GROUP}-${group.id}`);
        // Only add tabs if the group isn't collapsed *and* we are not searching
        // (Simplifies context during search, drag might be less intuitive though)
        if (!collapsedGroups.has(group.id) && !searchTerm) {
            group.tabs.forEach((tab) => items.push(`${ItemType.GTAB}-${tab.id}`));
        }
    });

    // Add new tab button as a drop target if it's shown
    if (showNewTabButton) {
        items.push(`${ItemType.ESEPARATOR}-newtab`);
    }

    // Add the below-all-tabs separator as the last drop target
    items.push(`${ItemType.ESEPARATOR}-1`);

    return items;
};
