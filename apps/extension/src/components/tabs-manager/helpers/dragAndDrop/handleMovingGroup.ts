import { ItemType } from "@/types/CombinedItem";
import { logDragOperation } from "./logDragOperation";
import { DragContext } from "../types/dragDrop";
import { ChromeTabOperations } from "../chromeTabOperations";
import { Tab } from "@/types/Tab";
import { TabGroup } from "@/types/TabGroup";

export async function handleMovingGroup(context: DragContext, operations: ChromeTabOperations): Promise<void> {
    const { activeParsed, overParsed, overItemData, activeItemData, tabGroups, overGroupItemData } = context;

    if (!overParsed) return;

    logDragOperation("GROUP-MOVE-FALLBACK", "Using legacy group move logic");

    let targetIndex = -1;

    if (overParsed.type === ItemType.GROUP) {
        targetIndex = (overItemData as TabGroup).index;
    }

    if (overParsed.type === ItemType.GSEPARATOR) {
        targetIndex = (overGroupItemData as TabGroup).index;
    }

    // If dropping onto a group, group separator, or tab that's inside a group, move the group after the parent tab group
    if (
        overParsed.type === ItemType.GROUP ||
        overParsed.type === ItemType.GSEPARATOR ||
        (overParsed.type === ItemType.GTAB && (overItemData as Tab)?.groupId !== -1)
    ) {
        let overGroup = tabGroups.find((g) => g.id === overParsed.id);
        if (!overGroup && overParsed.type === ItemType.GSEPARATOR && overGroupItemData) {
            overGroup = overGroupItemData;
        }
        if (!overGroup) {
            overGroup = tabGroups.find((g) => g.tabs.some((t) => t.id === overParsed.id));
        }
        if (overGroup) {
            const allChromeTabs = await operations.queryTabs({ currentWindow: true });
            const overGroupTabs = allChromeTabs.filter((t) => t.groupId === overGroup.id);
            if (overGroupTabs.length > 0) {
                const activeGroupTabs = allChromeTabs.filter((t) => t.groupId === activeParsed.id);
                if (activeGroupTabs.length > 0) {
                    targetIndex = Math.max(...overGroupTabs.map((t) => t.index)) + 1;
                }
            }
        }
    }

    const tabsLength = (activeItemData as TabGroup).tabs.length;
    if (targetIndex > activeItemData.index) {
        targetIndex = Math.max(targetIndex - tabsLength, 0);
    }

    logDragOperation("GROUP-MOVE-CALC", {
        targetIndex,
        tabsLength,
        activeItemIndex: activeItemData.index,
    });

    try {
        if (targetIndex !== -1) {
            await operations.moveTabGroup(activeParsed.id, targetIndex, {
                successMessage: "Group moved successfully",
            });
        }
    } catch (error) {
        logDragOperation("GROUP-MOVE-ERROR", {
            error: error instanceof Error ? error.message : error,
            groupId: activeParsed.id,
            targetIndex,
        });

        if ((error as Error).message.includes("Cannot move the group to an index that is in the middle of another group.")) {
            const retryIndex = targetIndex - 1;
            logDragOperation("GROUP-MOVE-RETRY", {
                groupId: activeParsed.id,
                retryIndex,
            });
            await operations.moveTabGroup(activeParsed.id, retryIndex, {
                successMessage: "Group moved successfully on retry",
            });
        }
    }
}
