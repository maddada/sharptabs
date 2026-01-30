import { useSelectionStore } from "@/stores/selectionStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { ItemType } from "@/types/CombinedItem";
import { Tab } from "@/types/Tab";
import { TabGroup } from "@/types/TabGroup";
import { Active, Over } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { ChromeTabOperations } from "../chromeTabOperations";
import { loadTabs } from "../loadTabs";
import { DragContext } from "../types/dragDrop";
import { shouldSkipOperation } from "./dragDropValidation";
import { dropHandlers } from "./dropHandlers";
import { findItemData } from "./findItemData";
import { handleMovingGroup } from "./handleMovingGroup";
import { handleMovingMultipleSelectedTabs } from "./handleMovingMultipleSelectedTabs";
import { handleWorkspaceDrop } from "./handleWorkspaceDrop";
import { logDragOperation } from "./logDragOperation";
import { parseDndId } from "./parseDndId";
import { redirectESeparator } from "./redirectESeparator";

/**
 * Handles the end of a drag operation for tabs and tab groups
 *
 * All of the cases that this function handles (moving from below and from above results in the same outcome):
 *
 * Compact Pinned Tabs:
 * - Dropping a cpinned tab on another cpinned tab -> moves the dragged tab to the over tab's position
 * - Dropping a cpinned tab on anything other than a cpinned tab -> nothing happens
 *
 * Pinned tabs:
 * - Dropping a pinned tab on another pinned tab -> moves the tab below it
 * - Dropping a pinned tab on a regular tab -> nothing happens
 * - Dropping a pinned tab on a group -> nothing happens
 * - Dropping a pinned tab on a tab inside a group -> nothing happens
 *
 * Regular Tabs:
 * - Dropping a tab on a pinned/cpinned tab -> moves after pinned tabs
 * - Dropping a tab on another tab -> moves below it
 * - Dropping a tab on a tab inside a group -> moves tab below the other tab
 * - Dropping a tab on a group -> moves tab to the end of the group
 *
 * Groups:
 * - Dropping a group on a pinned tab -> moves after pinned tabs
 * - Dropping a group on another group -> moves group below the other group
 * - Dropping a group on a tab inside a group -> moves group after the parent group
 */

export async function handleDragEnd(
    active: Active,
    over: Over | null,
    pinnedTabs: Tab[],
    regularTabs: Tab[],
    tabGroups: TabGroup[],
    collapsedGroups: Set<number>,
    setActiveDndId: (id: string | null) => void,
    setDropTargetId: (id: string | null) => void,
    setRecentlyDraggedItem: (id: number | null) => void
): Promise<void> {
    //#region Early Validation and Setup
    logDragOperation("START", {
        activeId: active.id,
        overId: over?.id || "null",
        pinnedTabsCount: pinnedTabs.length,
        regularTabsCount: regularTabs.length,
        tabGroupsCount: tabGroups.length,
        collapsedGroupsCount: collapsedGroups.size,
    });

    setActiveDndId(null);
    setDropTargetId(null);

    const selectedTabsStore = useSelectionStore.getState();
    const isMultipleSelection = selectedTabsStore.selectedTabIds.size > 1;

    logDragOperation("SELECTION-STATE", {
        selectedTabsCount: selectedTabsStore.selectedTabIds.size,
        selectedTabIds: Array.from(selectedTabsStore.selectedTabIds),
        isMultipleSelection,
    });

    const sortedSelectedTabs = selectedTabsStore.selectedTabs.toSorted((a, b) => a.index - b.index);
    const sortedSelectedTabIds = sortedSelectedTabs.map((t) => t.id);
    let originalActiveId = active.id;

    // Create a mutable reference to over since we may need to redirect it
    let currentOver = over;

    // Early exit: no drop target or dropped on itself
    if (!over || active.id === over.id) {
        logDragOperation("CANCELLED", {
            reason: !over ? "no over target" : "dropped on itself",
            activeId: active.id,
            overId: over?.id,
        });
        return;
    }

    // Check for workspace-related operations
    const overIdStr = over.id.toString();
    const workspaceStore = useWorkspaceStore.getState();
    const workspaces = workspaceStore.workspaces;
    const activeWorkspace = workspaces.find((w) => w.id === active.id);

    // Check if dropping a workspace onto another workspace's droppable zone (workspace reordering)
    if (activeWorkspace && overIdStr.startsWith("workspace-")) {
        const overWorkspaceId = overIdStr.replace("workspace-", "");
        const overWorkspace = workspaces.find((w) => w.id === overWorkspaceId);

        if (overWorkspace) {
            logDragOperation("WORKSPACE-REORDER-DETECTED", {
                activeWorkspaceId: activeWorkspace.id,
                overWorkspaceId: overWorkspace.id,
            });

            const oldIndex = workspaces.findIndex((w) => w.id === active.id);
            const newIndex = workspaces.findIndex((w) => w.id === overWorkspaceId);

            const reorderedWorkspaces = arrayMove(workspaces, oldIndex, newIndex);
            workspaceStore.actions.reorderWorkspaces(reorderedWorkspaces);

            setActiveDndId(null);
            setDropTargetId(null);

            logDragOperation("WORKSPACE-REORDER-SUCCESS", {
                activeWorkspaceId: activeWorkspace.id,
                overWorkspaceId: overWorkspace.id,
                oldIndex,
                newIndex,
            });

            return;
        }
    }

    // Check if dropped a tab/group on a workspace (workspace assignment)
    if (overIdStr.startsWith("workspace-")) {
        const workspaceId = overIdStr.replace("workspace-", "");

        logDragOperation("WORKSPACE-DROP-DETECTED", {
            workspaceId,
            activeId: active.id,
        });

        // Parse the active item
        const activeParsed = parseDndId(active.id.toString());
        if (!activeParsed) {
            logDragOperation("ERROR", { message: "Could not parse active drag ID for workspace drop", activeId: active.id });
            return;
        }

        // Get window ID
        const currentWindow = await chrome.windows.getCurrent();
        if (!currentWindow.id) {
            logDragOperation("ERROR", { message: "Could not get current window ID" });
            return;
        }

        // Find the dragged item data
        const activeItemData = findItemData(activeParsed, pinnedTabs, regularTabs, tabGroups);

        // Handle the workspace drop
        await handleWorkspaceDrop(
            workspaceId,
            activeParsed.type,
            activeParsed.id,
            activeItemData,
            currentWindow.id,
            isMultipleSelection ? selectedTabsStore.selectedTabIds : undefined
        );

        // Reload tabs to reflect changes
        await loadTabs("workspace drop");

        logDragOperation("WORKSPACE-DROP-SUCCESS", {
            workspaceId,
            activeType: activeParsed.type,
            activeId: activeParsed.id,
        });

        return;
    }

    // Check if dropped on a window (window move operation)
    if (overIdStr.startsWith("window-")) {
        // Ignore drops on the background zone (gaps between buttons)
        if (overIdStr === "window-zone-background") {
            logDragOperation("CANCELLED", {
                reason: "dropped on window zone background (gap between buttons)",
                activeId: active.id,
                overId: over.id,
            });
            return;
        }

        const windowIdStr = overIdStr.replace("window-", "");
        const targetWindowId = parseInt(windowIdStr, 10);

        logDragOperation("WINDOW-DROP-DETECTED", {
            targetWindowId,
            activeId: active.id,
        });

        // Parse the active item
        const activeParsed = parseDndId(active.id.toString());
        if (!activeParsed) {
            logDragOperation("ERROR", { message: "Could not parse active drag ID for window drop", activeId: active.id });
            return;
        }

        // Find the dragged item data
        const activeItemData = findItemData(activeParsed, pinnedTabs, regularTabs, tabGroups);

        // Handle window drop based on item type
        let finalWindowId = targetWindowId;
        try {
            if (activeParsed.type === ItemType.GROUP) {
                // Moving a group
                const group = activeItemData as TabGroup;

                if (targetWindowId === -1) {
                    // Create new window
                    const newWindow = await chrome.windows.create({});
                    finalWindowId = newWindow.id ?? -1;
                    if (group.tabs.length > 1) {
                        await chrome.tabGroups.move(group.id, { windowId: newWindow.id, index: 0 });
                    }
                    // Close the empty new tab
                    const tabs = await chrome.tabs.query({ windowId: newWindow.id });
                    for (const tab of tabs) {
                        if (tab.groupId === -1) {
                            chrome.tabs.remove(tab.id ?? 0);
                        }
                    }
                } else {
                    // Move to existing window
                    const groupTitle = group.title;
                    const groupColor = group.color;
                    const groupTabs = group.tabs.sort((a, b) => a.index - b.index);
                    const tabIds = groupTabs.map((tab) => tab.id);

                    // Ungroup all tabs
                    await chrome.tabs.ungroup(tabIds);

                    // Move tabs to target window
                    const targetWindowTabs = await chrome.tabs.query({ windowId: targetWindowId });
                    let targetIndex = targetWindowTabs.length;

                    for (const tabId of tabIds) {
                        await chrome.tabs.move(tabId, { windowId: targetWindowId, index: targetIndex });
                        targetIndex++;
                    }

                    // Re-group in target window
                    const newGroupId = await chrome.tabs.group({
                        tabIds: tabIds,
                        createProperties: { windowId: targetWindowId },
                    });

                    await chrome.tabGroups.update(newGroupId, {
                        title: groupTitle,
                        color: groupColor,
                    });
                }
            } else if (isMultipleSelection && selectedTabsStore.selectedTabIds.size > 1) {
                // Moving multiple selected tabs
                const sortedTabs = selectedTabsStore.selectedTabs.toSorted((a, b) => a.index - b.index);

                if (targetWindowId === -1) {
                    // Create new window with first tab
                    const firstTab = sortedTabs[0];
                    const newWindow = await chrome.windows.create({ tabId: firstTab.id });
                    finalWindowId = newWindow.id ?? -1;

                    // Move remaining tabs to new window and preserve pinned state
                    for (let i = 1; i < sortedTabs.length; i++) {
                        await chrome.tabs.move(sortedTabs[i].id, { windowId: newWindow.id, index: -1 });
                    }

                    // Re-pin tabs that were pinned
                    for (const tab of sortedTabs) {
                        if (tab.pinned) {
                            await chrome.tabs.update(tab.id, { pinned: true });
                        }
                    }
                } else {
                    // Move all tabs to existing window and preserve pinned state
                    for (const tab of sortedTabs) {
                        await chrome.tabs.move(tab.id, { windowId: targetWindowId, index: -1 });
                        if (tab.pinned) {
                            await chrome.tabs.update(tab.id, { pinned: true });
                        }
                    }
                }

                // Clear selection
                selectedTabsStore.actions.clearSelection();
            } else {
                // Moving a single tab
                const tab = activeItemData as Tab;

                if (targetWindowId === -1) {
                    // Create new window with this tab
                    const newWindow = await chrome.windows.create({ tabId: tab.id });
                    finalWindowId = newWindow.id ?? -1;

                    // Re-pin if it was pinned
                    if (tab.pinned) {
                        await chrome.tabs.update(tab.id, { pinned: true });
                    }
                } else {
                    // Move to existing window
                    await chrome.tabs.move(tab.id, { windowId: targetWindowId, index: -1 });

                    // Re-pin if it was pinned
                    if (tab.pinned) {
                        await chrome.tabs.update(tab.id, { pinned: true });
                    }
                }
            }

            // Activate/focus the target window
            if (finalWindowId !== -1) {
                await chrome.windows.update(finalWindowId, { focused: true });
            }

            logDragOperation("WINDOW-DROP-SUCCESS", {
                targetWindowId,
                activeType: activeParsed.type,
                activeId: activeParsed.id,
            });
        } catch (error) {
            logDragOperation("ERROR", { message: "Error moving to window", error });
        }

        return;
    }

    // Handle multi-selection: replace active with first selected tab
    if (isMultipleSelection) {
        originalActiveId = active.id;
        const operations = new ChromeTabOperations();
        const newActiveTabData = await operations.getTab(sortedSelectedTabs[0].id);
        active.id = newActiveTabData.groupId === -1 ? `${ItemType.REGULAR}-${newActiveTabData.id}` : `${ItemType.GTAB}-${newActiveTabData.id}`;

        logDragOperation("MULTI-SELECT-REPLACEMENT", {
            originalActiveId,
            newActiveId: active.id,
            newActiveTabData: {
                id: newActiveTabData.id,
                groupId: newActiveTabData.groupId,
                index: newActiveTabData.index,
            },
        });
    }
    //#endregion

    //#region 1- ID Parsing and Validation
    const activeParsed = parseDndId(active.id.toString());
    let overParsed = currentOver ? parseDndId(currentOver.id.toString()) : null;

    if (!activeParsed) {
        logDragOperation("ERROR", { message: "Could not parse active drag ID", activeId: active.id });
        return;
    }

    // Early exit: Group dropped on itself or its separator
    if (activeParsed.type === ItemType.GROUP && overParsed) {
        if (
            (overParsed.type === ItemType.GROUP && activeParsed.id === overParsed.id) ||
            (overParsed.type === ItemType.GSEPARATOR && activeParsed.id === overParsed.id)
        ) {
            logDragOperation("CANCELLED", {
                message: "Group dropped on itself or its separator — no move and no animation",
                active: activeParsed,
                over: overParsed,
            });
            return;
        }

        // Group dropped on a tab within itself
        if (overParsed.type === ItemType.GTAB) {
            const overGroup = tabGroups.find((g) => g.tabs.some((t) => t.id === overParsed?.id));
            if (overGroup && overGroup.id === activeParsed.id) {
                logDragOperation("CANCELLED", {
                    message: "Group dropped on a tab within itself — no move and no animation",
                    active: activeParsed,
                    over: overParsed,
                    groupId: overGroup.id,
                });
                return;
            }
        }
    }
    //#endregion

    //#region 2- ESEPARATOR Redirection
    // Handle both eseparator-1 and eseparator-newtab (new tab button) by redirecting to last item
    if (currentOver) {
        const overIdString = currentOver.id.toString();
        if (
            (overParsed?.type === ItemType.ESEPARATOR || overIdString === `${ItemType.ESEPARATOR}-newtab`) &&
            (activeParsed.type === ItemType.REGULAR || activeParsed.type === ItemType.GTAB || activeParsed.type === ItemType.GROUP)
        ) {
            // Parse as ESEPARATOR for redirect function
            const eSeparatorParsed = overIdString === `${ItemType.ESEPARATOR}-newtab` ? { type: ItemType.ESEPARATOR, id: 1 } : overParsed;

            if (eSeparatorParsed) {
                const redirect = redirectESeparator(eSeparatorParsed, regularTabs, tabGroups);
                if (redirect) {
                    currentOver = redirect.over;
                    overParsed = redirect.overParsed;
                }
            }
        }
    }

    logDragOperation("PARSED-IDS", {
        active: activeParsed,
        over: overParsed,
    });
    //#endregion

    //#region 3- Find actual Chrome Tab/Group data
    const activeItemData = findItemData(activeParsed, pinnedTabs, regularTabs, tabGroups);
    const overItemData = findItemData(overParsed, pinnedTabs, regularTabs, tabGroups);

    let overGroupItemData: TabGroup | null = null;
    if (overParsed?.type === ItemType.GSEPARATOR) {
        const groupParsed = { ...overParsed, type: ItemType.GROUP };
        overGroupItemData = findItemData(groupParsed, pinnedTabs, regularTabs, tabGroups) as TabGroup;
    } else if (overParsed?.type === ItemType.GROUP) {
        overGroupItemData = overItemData as TabGroup;
    }

    logDragOperation("ITEM-DATA", {
        activeItemData: activeItemData
            ? {
                  id: activeItemData.id,
                  index: activeItemData.index,
                  type: activeParsed.type,
                  title: "title" in activeItemData ? activeItemData.title : "N/A",
              }
            : null,
        overItemData: overItemData
            ? {
                  id: overItemData.id,
                  index: overItemData.index,
                  type: overParsed?.type,
                  title: "title" in overItemData ? overItemData.title : "N/A",
              }
            : null,
    });

    if (!activeItemData) {
        logDragOperation("ERROR", {
            message: "Could not find data for active item",
            activeParsed,
        });
        await loadTabs("drag end");
        return;
    }
    //#endregion

    //#region 4- Direction Calculation
    let up = activeItemData.index - (overItemData?.index || 0) > 0;
    if (overItemData === null && overGroupItemData) {
        up = activeItemData.index - (overGroupItemData.index + overGroupItemData.tabs.length || 0) > 0;
    }
    if (overParsed?.type === ItemType.GSEPARATOR && overGroupItemData) {
        up = activeItemData.index - (overGroupItemData.index || 0) > 0;
    }

    const oneIfUp = up ? 1 : 0;
    const oneIfDown = up ? 0 : 1;

    logDragOperation("DIRECTION-CALC", {
        up,
        oneIfUp,
        oneIfDown,
        activeIndex: activeItemData.index,
        overIndex: overItemData?.index || "null",
    });
    //#endregion

    //#region 5- Create context for handlers and animation setup
    const context: DragContext = {
        active,
        over: currentOver,
        pinnedTabs,
        regularTabs,
        tabGroups,
        collapsedGroups,
        activeParsed,
        overParsed,
        activeItemData,
        overItemData,
        overGroupItemData,
        up,
        oneIfUp,
        oneIfDown,
        isMultipleSelection,
        sortedSelectedTabIds,
    };

    // Set recently dragged item for animation (before no-op check to match original behavior)
    setRecentlyDraggedItem(activeParsed.id);
    setTimeout(() => {
        setRecentlyDraggedItem(null);
    }, 520);
    //#endregion

    //#region Check if operation should be skipped (no-op detection)
    const validationResult = shouldSkipOperation(context);
    if (validationResult.shouldSkip) {
        return;
    }
    //#endregion

    //#region 6- Drop Operation Execution
    const operations = new ChromeTabOperations();

    try {
        logDragOperation("OPERATION-START", {
            activeType: activeParsed.type,
            overType: overParsed?.type,
            scenario: `${activeParsed.type} -> ${overParsed?.type}`,
        });

        // Use strategy pattern to handle drop based on target type
        let handlerExecuted = false;
        if (overParsed && dropHandlers[overParsed.type]) {
            await dropHandlers[overParsed.type](context, operations);
            handlerExecuted = true;
        }

        // Fallback for GROUP drops that aren't handled by specific handlers or returned early
        if (
            activeParsed.type === ItemType.GROUP &&
            overParsed &&
            (overParsed.type === ItemType.GSEPARATOR || overParsed.type === ItemType.GTAB || overParsed.type === ItemType.GROUP || !handlerExecuted)
        ) {
            await handleMovingGroup(context, operations);
        }

        // Handle multiple selection cleanup
        if (isMultipleSelection) {
            setTimeout(async () => {
                await handleMovingMultipleSelectedTabs(activeParsed, sortedSelectedTabIds, up, operations);
            }, 50);
        }

        logDragOperation("COMPLETE", {
            activeId: activeParsed.id,
            activeType: activeParsed.type,
            overType: overParsed?.type,
            success: true,
        });
        //#endregion
    } catch (error) {
        //#region 7- Error Handling and Completion
        logDragOperation("ERROR", {
            message: "Error during drag end operation",
            error: error instanceof Error ? error.message : error,
            activeId: activeParsed.id,
            activeType: activeParsed.type,
            overType: overParsed?.type,
            stack: error instanceof Error ? error.stack : undefined,
        });
        await loadTabs("drag end error");
        //#endregion
    }
}
