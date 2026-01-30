import { ItemType } from "@/types/CombinedItem";
import { Tab } from "@/types/Tab";
import { TabGroup } from "@/types/TabGroup";
import { ChromeTabOperations } from "../chromeTabOperations";
import { DragContext, DropHandler } from "../types/dragDrop";

const logDragOperation = (phase: string, data: any) => {
    console.log(`[DRAG-${phase}]`, data);
};

export const handleDropOnPinned: DropHandler = async (context: DragContext, operations: ChromeTabOperations) => {
    const { activeParsed, overItemData, pinnedTabs, oneIfUp } = context;

    logDragOperation("CASE", "Dropping on PINNED tab");

    switch (activeParsed.type) {
        case ItemType.PINNED:
            const targetIndex = (overItemData?.index ?? 0) + oneIfUp;
            await operations.moveTab(activeParsed.id, targetIndex, {
                successMessage: "Moved pinned tab to pinned position",
            });
            break;
        case ItemType.REGULAR:
            const afterPinnedIndex = pinnedTabs.length - 1;
            await operations.moveTab(activeParsed.id, afterPinnedIndex, {
                successMessage: "Moved regular tab after pinned tabs",
            });
            break;
        case ItemType.GTAB:
            await operations.ungroupTab(activeParsed.id);
            await operations.moveTab(activeParsed.id, pinnedTabs.length - 1, {
                operation: "chrome.tabs.ungroup + chrome.tabs.move",
                successMessage: "Ungrouped and moved tab after pinned tabs",
            });
            break;
        case ItemType.GROUP:
            const groupTargetIndex = pinnedTabs.length;
            await operations.moveTabGroup(activeParsed.id, groupTargetIndex, {
                successMessage: "Moved group after pinned tabs",
            });
            break;
    }
};

export const handleDropOnCompactPinned: DropHandler = async (context: DragContext, operations: ChromeTabOperations) => {
    const { activeParsed, overParsed, pinnedTabs } = context;

    if (!overParsed) return;

    // Handle CPINNED -> CPINNED reordering
    if (activeParsed.type === ItemType.CPINNED) {
        logDragOperation("CASE", "Compact pinned tab reordering");

        const activeTabId = activeParsed.id;
        const overTabId = overParsed.id;

        const activeTabIndex = pinnedTabs.findIndex((tab) => tab.id === activeTabId);
        const overTabIndex = pinnedTabs.findIndex((tab) => tab.id === overTabId);

        if (activeTabIndex !== -1 && overTabIndex !== -1) {
            const targetIndex = overTabIndex;

            logDragOperation("CHROME-API-CALL", {
                operation: "chrome.tabs.move (compact pinned)",
                tabId: activeTabId,
                targetIndex,
                activeTabIndex,
                overTabIndex,
            });

            await operations.moveTab(activeTabId, targetIndex, {
                successMessage: "Reordered compact pinned tab",
            });
        }
        return;
    }

    // Handle REGULAR/GTAB/GROUP -> CPINNED (move after pinned tabs)
    logDragOperation("CASE", "Dropping on COMPACT PINNED tab");

    switch (activeParsed.type) {
        case ItemType.REGULAR:
            const afterPinnedIndex = pinnedTabs.length - 1;
            await operations.moveTab(activeParsed.id, afterPinnedIndex, {
                successMessage: "Moved regular tab after pinned tabs",
            });
            break;
        case ItemType.GTAB:
            await operations.ungroupTab(activeParsed.id);
            await operations.moveTab(activeParsed.id, pinnedTabs.length - 1, {
                operation: "chrome.tabs.ungroup + chrome.tabs.move",
                successMessage: "Ungrouped and moved tab after pinned tabs",
            });
            break;
        case ItemType.GROUP:
            const groupTargetIndex = pinnedTabs.length;
            await operations.moveTabGroup(activeParsed.id, groupTargetIndex, {
                successMessage: "Moved group after pinned tabs",
            });
            break;
        case ItemType.PINNED:
            // Pinned tabs shouldn't be handled here, they have their own logic
            break;
    }
};

export const handleDropOnPSeparator: DropHandler = async (context: DragContext, operations: ChromeTabOperations) => {
    const { activeParsed, overParsed, pinnedTabs } = context;

    if (!overParsed) return;

    logDragOperation("CASE", `Dropping on PSEPARATOR (id: ${overParsed.id})`);

    switch (activeParsed.type) {
        case ItemType.PINNED:
            if (overParsed.id === 1) {
                await operations.moveTab(activeParsed.id, 0, {
                    successMessage: "Moved pinned tab to top",
                });
            }
            if (overParsed.id === 2) {
                await operations.moveTab(activeParsed.id, pinnedTabs.length, {
                    successMessage: "Moved pinned tab to end of pinned section",
                });
            }
            break;
        case ItemType.REGULAR:
            const pinnedLength = pinnedTabs.length;
            await operations.moveTab(activeParsed.id, pinnedLength, {
                successMessage: "Moved regular tab after pinned tabs",
            });
            break;
        case ItemType.GTAB:
            await operations.ungroupTab(activeParsed.id);
            await operations.moveTab(activeParsed.id, pinnedTabs.length, {
                operation: "chrome.tabs.ungroup + chrome.tabs.move",
                successMessage: "Ungrouped and moved tab after pinned tabs",
            });
            break;
        case ItemType.GROUP:
            const groupIndex = pinnedTabs.length;
            await operations.moveTabGroup(activeParsed.id, groupIndex, {
                successMessage: "Moved group after pinned tabs",
            });
            break;
    }
};

export const handleDropOnGSeparator: DropHandler = async (context: DragContext, operations: ChromeTabOperations) => {
    const { activeParsed, overGroupItemData, up, tabGroups } = context;

    logDragOperation("CASE", "Dropping on GSEPARATOR");
    const group = overGroupItemData as TabGroup;

    switch (activeParsed.type) {
        case ItemType.PINNED:
            logDragOperation("SKIP", "Pinned tab cannot be moved to group separator");
            return;
        case ItemType.REGULAR:
            const regTargetIndex = up ? group.index + group.tabs.length : group.index + group.tabs.length - 1;
            await operations.moveTab(activeParsed.id, regTargetIndex, {
                direction: up ? "after group" : "within group",
                successMessage: "Moved regular tab relative to group",
            });
            break;
        case ItemType.GTAB:
            // Check if the tab is from the same group - if so, we need to offset by 1
            // because ungrouping will reduce the group's tab count.
            // Only apply offset when up = true (dragging from below toward the end)
            const activeGroupId = tabGroups.find((g) => g.tabs.some((t) => t.id === activeParsed.id))?.id;
            const isSameGroup = activeGroupId === group.id;
            const tabCountOffset = isSameGroup && up ? 1 : 0;

            const gtabTargetIndex = up ? group.index + group.tabs.length - tabCountOffset : group.index + group.tabs.length - 1;
            await operations.ungroupTab(activeParsed.id);
            await operations.moveTab(activeParsed.id, gtabTargetIndex, {
                operation: "chrome.tabs.ungroup + chrome.tabs.move",
                direction: up ? "after group" : "within group",
                successMessage: "Ungrouped and moved tab relative to group",
            });
            break;
        case ItemType.GROUP:
            // GROUP -> GSEPARATOR should behave like GROUP -> GROUP
            // Don't handle here, let the fallback handle it
            break;
    }
};

export const handleDropOnESeparator: DropHandler = async (context: DragContext, operations: ChromeTabOperations) => {
    const { activeParsed, tabGroups, regularTabs } = context;

    logDragOperation("CASE", "Dropping on ESEPARATOR (end separator)");
    const lastTabIndex = tabGroups.reduce((acc, group) => acc + group.tabs.length, 0) + regularTabs.length;

    switch (activeParsed.type) {
        case ItemType.PINNED:
            logDragOperation("SKIP", "Pinned tab cannot be moved to end separator");
            return;
        case ItemType.REGULAR:
            const endIndex = lastTabIndex;
            await operations.moveTab(activeParsed.id, endIndex, {
                successMessage: "Moved regular tab to end",
            });
            break;
        case ItemType.GTAB:
            const gtabEndIndex = lastTabIndex;
            await operations.ungroupTab(activeParsed.id);
            await operations.moveTab(activeParsed.id, gtabEndIndex, {
                operation: "chrome.tabs.ungroup + chrome.tabs.move",
                successMessage: "Ungrouped and moved tab to end",
            });
            break;
        case ItemType.GROUP:
            const groupEndIndex = lastTabIndex;
            const group = tabGroups.find((g) => g.id === activeParsed.id);
            await operations.moveTabGroup(activeParsed.id, groupEndIndex + 1 - (group?.tabs.length || 0), {
                successMessage: "Moved group to end",
            });
            break;
    }
};

export const handleDropOnRegular: DropHandler = async (context: DragContext, operations: ChromeTabOperations) => {
    const { activeParsed, overItemData, activeItemData, oneIfUp, up } = context;

    logDragOperation("CASE", "Dropping on REGULAR tab");

    switch (activeParsed.type) {
        case ItemType.PINNED:
            logDragOperation("SKIP", "Pinned tab cannot be moved to regular tab position");
            return;
        case ItemType.REGULAR:
            const regToRegIndex = (overItemData?.index ?? 0) + oneIfUp;
            await operations.moveTab(activeParsed.id, regToRegIndex, {
                successMessage: "Moved regular tab to regular tab position",
            });
            break;
        case ItemType.GTAB:
            const gtabToRegIndex = (overItemData?.index ?? 0) + oneIfUp;
            await operations.ungroupTab(activeParsed.id);
            await operations.moveTab(activeParsed.id, gtabToRegIndex, {
                operation: "chrome.tabs.ungroup + chrome.tabs.move",
                successMessage: "Ungrouped and moved tab to regular tab position",
            });
            break;
        case ItemType.GROUP:
            const groupToRegIndex = up ? (overItemData?.index ?? 0) + 1 : (overItemData?.index ?? 0) - (activeItemData as TabGroup).tabs.length + 1;
            await operations.moveTabGroup(activeParsed.id, groupToRegIndex, {
                direction: up ? "down" : "up",
                successMessage: "Moved group relative to regular tab",
            });
            break;
    }
};

export const handleDropOnGroup: DropHandler = async (context: DragContext, operations: ChromeTabOperations) => {
    const { activeParsed, overParsed, overItemData, overGroupItemData, collapsedGroups, oneIfDown, tabGroups } = context;

    if (!overParsed) return;

    logDragOperation("CASE", `Dropping on GROUP (collapsed: ${collapsedGroups.has(overParsed.id)})`);

    switch (activeParsed.type) {
        case ItemType.PINNED:
            logDragOperation("SKIP", "Pinned tab cannot be moved to group");
            return;
        case ItemType.REGULAR:
            if (collapsedGroups.has(overParsed.id)) {
                const endOfGroupIndex = (overItemData?.index ?? 0) + (overGroupItemData as TabGroup).tabs.length - oneIfDown;
                await operations.groupTabs([activeParsed.id], overParsed.id);
                await operations.moveTab(activeParsed.id, endOfGroupIndex, {
                    operation: "chrome.tabs.group + chrome.tabs.move",
                    groupId: overParsed.id,
                    groupState: "collapsed",
                    successMessage: "Added tab to end of collapsed group",
                });
            } else {
                const startOfGroupIndex = (overItemData?.index ?? 0) - oneIfDown;
                await operations.groupTabs([activeParsed.id], overParsed.id);
                await operations.moveTab(activeParsed.id, startOfGroupIndex, {
                    operation: "chrome.tabs.group + chrome.tabs.move",
                    groupId: overParsed.id,
                    groupState: "expanded",
                    successMessage: "Added tab to start of expanded group",
                });
            }
            break;
        case ItemType.GTAB:
            const activeGroupId = tabGroups.find((g: TabGroup) => g.tabs.find((t: Tab) => t.id === activeParsed.id))?.id ?? null;
            if (collapsedGroups.has(overParsed.id)) {
                const endOfGroupIndex = (overItemData?.index ?? 0) + (overGroupItemData as TabGroup).tabs.length - oneIfDown;
                await operations.moveTabFromGroupToGroup(activeParsed.id, overParsed.id, endOfGroupIndex, {
                    groupState: "collapsed",
                    successMessage: "Moved tab to end of collapsed group",
                });
            } else {
                if (activeGroupId === overParsed.id) {
                    await operations.moveTab(activeParsed.id, overItemData?.index ?? 0, {
                        scenario: "same group reorder",
                        successMessage: "Reordered tab within same group",
                    });
                } else {
                    const startOfGroupIndex = (overItemData?.index ?? 0) - oneIfDown;
                    await operations.moveTabFromGroupToGroup(activeParsed.id, overParsed.id, startOfGroupIndex, {
                        scenario: "different group",
                        successMessage: "Moved tab to start of different group",
                    });
                }
            }
            break;
    }
};

export const handleDropOnGTab: DropHandler = async (context: DragContext, operations: ChromeTabOperations) => {
    const { activeParsed, overItemData, oneIfUp, tabGroups } = context;

    logDragOperation("CASE", "Dropping on GTAB (tab within group)");

    const overGroupId = tabGroups.find((g: TabGroup) => g.tabs.find((t) => t.id === context.overParsed?.id))?.id;
    const activeGroupId =
        activeParsed.type === ItemType.GTAB ? tabGroups.find((g: TabGroup) => g.tabs.find((t) => t.id === activeParsed.id))?.id : null;

    switch (activeParsed.type) {
        case ItemType.PINNED:
            logDragOperation("SKIP", "Pinned tab cannot be moved to grouped tab position");
            return;
        case ItemType.REGULAR:
            const regToGtabIndex = (overItemData?.index ?? 0) + oneIfUp;
            await operations.addTabToGroup(activeParsed.id, overGroupId ?? 0, regToGtabIndex, {
                successMessage: "Added regular tab to group at specific position",
            });
            break;
        case ItemType.GTAB:
            if (activeGroupId === overGroupId) {
                const sameGroupIndex = (overItemData?.index ?? 0) + oneIfUp;
                await operations.moveTab(activeParsed.id, sameGroupIndex, {
                    scenario: "same group reorder",
                    successMessage: "Reordered tab within same group",
                });
            } else {
                const diffGroupIndex = (overItemData?.index ?? 0) + oneIfUp;
                await operations.moveTabFromGroupToGroup(activeParsed.id, overGroupId ?? 0, diffGroupIndex, {
                    scenario: "different group",
                    successMessage: "Moved tab to different group at specific position",
                });
            }
            break;
    }
};

// Handler map for strategy pattern
export const dropHandlers: Record<string, DropHandler> = {
    [ItemType.PINNED]: handleDropOnPinned,
    [ItemType.CPINNED]: handleDropOnCompactPinned,
    [ItemType.PSEPARATOR]: handleDropOnPSeparator,
    [ItemType.GSEPARATOR]: handleDropOnGSeparator,
    [ItemType.ESEPARATOR]: handleDropOnESeparator,
    [ItemType.REGULAR]: handleDropOnRegular,
    [ItemType.GROUP]: handleDropOnGroup,
    [ItemType.GTAB]: handleDropOnGTab,
};
