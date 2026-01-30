import { useSelectionStore } from "@/stores/selectionStore";
import { ChromeTabOperations } from "../chromeTabOperations";
import { ParsedDndId } from "../types/dragDrop";
import { logDragOperation } from "./logDragOperation";

export async function handleMovingMultipleSelectedTabs(
    activeParsed: ParsedDndId,
    sortedSelectedTabIds: number[],
    up: boolean,
    operations: ChromeTabOperations
): Promise<void> {
    logDragOperation("MULTI-SELECT-CLEANUP-START", {
        selectedTabsCount: sortedSelectedTabIds.length,
        selectedTabIds: sortedSelectedTabIds,
    });

    const tempSelectedTabIds = Array.from(sortedSelectedTabIds);
    tempSelectedTabIds.splice(tempSelectedTabIds.indexOf(activeParsed.id), 1);

    const activeTab = await operations.getTab(activeParsed.id);
    if (activeTab.groupId !== -1) {
        await operations.groupTabs(tempSelectedTabIds, activeTab.groupId);
    }

    for (let i = 0; i < tempSelectedTabIds.length; i++) {
        const tempTab = await operations.getTab(tempSelectedTabIds[i]);
        if (tempTab.groupId !== activeTab.groupId) {
            await operations.ungroupTab(tempSelectedTabIds[i]);
        }

        const moveIndex = up ? activeTab.index + 1 + i : activeTab.index;
        logDragOperation("MULTI-SELECT-MOVE", {
            tabId: tempSelectedTabIds[i],
            targetIndex: moveIndex,
            iteration: i + 1,
        });
        await operations.moveTab(tempSelectedTabIds[i], moveIndex);
    }

    const selectedTabsStoreActions = useSelectionStore.getState().actions;
    selectedTabsStoreActions.setSelectedTabIds(new Set());
    selectedTabsStoreActions.setSelectedTabs([]);
    selectedTabsStoreActions.setLastSelectedTabId(null);

    logDragOperation("MULTI-SELECT-CLEANUP-COMPLETE", "Cleared selection state");
}
