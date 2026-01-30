import {
    addTabToWorkspace,
    addGroupToWorkspace,
    removeTabFromAllWorkspaces,
    removeGroupFromAllWorkspaces,
} from "@/utils/workspaces/workspaceHandlers";
import { ItemTypeEnum, ItemType } from "@/types/CombinedItem";
import { Tab } from "@/types/Tab";
import { TabGroup } from "@/types/TabGroup";
import { logDragOperation } from "./logDragOperation";
import { useSelectionStore } from "@/stores/selectionStore";

/**
 * Handles dropping a tab, grouped tab, or group onto a workspace
 * Special case: dropping on "general" workspace removes all workspace assignments
 */
export async function handleWorkspaceDrop(
    workspaceId: string,
    draggedItemType: ItemTypeEnum,
    draggedItemId: number,
    draggedItemData: Tab | TabGroup | null,
    windowId: number,
    selectedTabIds?: Set<number>
): Promise<void> {
    try {
        logDragOperation("WORKSPACE-DROP-START", {
            workspaceId,
            draggedItemType,
            draggedItemId,
            selectedTabsCount: selectedTabIds?.size || 0,
        });

        // Special case: dropping on "general" workspace removes assignments
        const isGeneralWorkspace = workspaceId === "general";

        // Handle multiple selected tabs
        if (selectedTabIds && selectedTabIds.size > 1) {
            logDragOperation("WORKSPACE-DROP-MULTI", {
                workspaceId,
                selectedTabIds: Array.from(selectedTabIds),
                isGeneralWorkspace,
            });

            for (const tabId of selectedTabIds) {
                const tab = await chrome.tabs.get(tabId);

                // If tab is in a group, always ungroup it first when moving to any workspace
                if (tab.groupId !== -1) {
                    await chrome.tabs.ungroup(tabId);
                    logDragOperation("WORKSPACE-DROP-UNGROUP", {
                        tabId,
                        oldGroupId: tab.groupId,
                    });
                }

                // Add to workspace or remove from all workspaces
                if (isGeneralWorkspace) {
                    await removeTabFromAllWorkspaces(tabId, windowId);
                } else {
                    await addTabToWorkspace(tabId, workspaceId, windowId);
                }
            }

            logDragOperation("WORKSPACE-DROP-MULTI-COMPLETE", {
                workspaceId,
                tabsAdded: selectedTabIds.size,
                isGeneralWorkspace,
            });

            // Reorder tabs to maintain workspace grouping
            const { debouncedReorderTabsByWorkspace } = await import("@/utils/workspaces/workspaceReorder");
            debouncedReorderTabsByWorkspace(windowId, "workspace-drop-multi");

            useSelectionStore.getState().actions.clearSelection();

            return;
        }

        // Handle single GROUP drop
        if (draggedItemType === ItemType.GROUP) {
            logDragOperation("WORKSPACE-DROP-GROUP", {
                workspaceId,
                groupId: draggedItemId,
                isGeneralWorkspace,
            });

            if (isGeneralWorkspace) {
                await removeGroupFromAllWorkspaces(draggedItemId, windowId);
            } else {
                await addGroupToWorkspace(draggedItemId, workspaceId, windowId);
            }

            // Reorder tabs to maintain workspace grouping
            const { debouncedReorderTabsByWorkspace } = await import("@/utils/workspaces/workspaceReorder");
            debouncedReorderTabsByWorkspace(windowId, "workspace-drop-group");

            logDragOperation("WORKSPACE-DROP-GROUP-COMPLETE", {
                workspaceId,
                groupId: draggedItemId,
                isGeneralWorkspace,
            });

            useSelectionStore.getState().actions.clearSelection();

            return;
        }

        // Handle single GTAB (grouped tab) drop - needs to be ungrouped first
        if (draggedItemType === ItemType.GTAB) {
            const tab = await chrome.tabs.get(draggedItemId);
            const oldGroupId = tab.groupId;

            logDragOperation("WORKSPACE-DROP-GTAB", {
                workspaceId,
                tabId: draggedItemId,
                oldGroupId,
                isGeneralWorkspace,
            });

            // Always ungroup the tab first when moving to any workspace
            if (oldGroupId !== -1) {
                await chrome.tabs.ungroup(draggedItemId);
                logDragOperation("WORKSPACE-DROP-UNGROUP", {
                    tabId: draggedItemId,
                    oldGroupId,
                });
            }

            // Add to workspace or remove from all workspaces
            if (isGeneralWorkspace) {
                await removeTabFromAllWorkspaces(draggedItemId, windowId);
            } else {
                await addTabToWorkspace(draggedItemId, workspaceId, windowId);
            }

            // Reorder tabs to maintain workspace grouping
            const { debouncedReorderTabsByWorkspace } = await import("@/utils/workspaces/workspaceReorder");
            debouncedReorderTabsByWorkspace(windowId, "workspace-drop-grouped-tab");

            useSelectionStore.getState().actions.clearSelection();

            logDragOperation("WORKSPACE-DROP-GTAB-COMPLETE", {
                workspaceId,
                tabId: draggedItemId,
                isGeneralWorkspace,
            });
            return;
        }

        // Handle single REGULAR, PINNED, or CPINNED (compact pinned) tab drop
        if (draggedItemType === ItemType.REGULAR || draggedItemType === ItemType.PINNED || draggedItemType === ItemType.CPINNED) {
            const tab = await chrome.tabs.get(draggedItemId);
            const oldGroupId = tab.groupId;

            logDragOperation("WORKSPACE-DROP-TAB", {
                workspaceId,
                tabId: draggedItemId,
                type: draggedItemType,
                oldGroupId,
                isGeneralWorkspace,
            });

            // If tab is in a group, ungroup it first before adding to workspace
            if (oldGroupId !== -1) {
                await chrome.tabs.ungroup(draggedItemId);
                logDragOperation("WORKSPACE-DROP-UNGROUP", {
                    tabId: draggedItemId,
                    oldGroupId,
                });
            }

            if (isGeneralWorkspace) {
                await removeTabFromAllWorkspaces(draggedItemId, windowId);
            } else {
                await addTabToWorkspace(draggedItemId, workspaceId, windowId);
            }

            // Reorder tabs to maintain workspace grouping
            const { debouncedReorderTabsByWorkspace: reorderTabs } = await import("@/utils/workspaces/workspaceReorder");
            reorderTabs(windowId, "workspace-drop-tab");

            logDragOperation("WORKSPACE-DROP-TAB-COMPLETE", {
                workspaceId,
                tabId: draggedItemId,
                isGeneralWorkspace,
            });

            useSelectionStore.getState().actions.clearSelection();

            return;
        }

        logDragOperation("WORKSPACE-DROP-UNKNOWN", {
            workspaceId,
            draggedItemType,
            draggedItemId,
        });
    } catch (error) {
        logDragOperation("WORKSPACE-DROP-ERROR", {
            workspaceId,
            draggedItemType,
            draggedItemId,
            error: error instanceof Error ? error.message : error,
        });
        throw error;
    }
}
