/**
 * Automatic tab reordering by workspace assignment
 *
 * This module ensures tabs are physically ordered in the browser tab strip
 * according to their workspace assignments:
 * - General workspace tabs first
 * - Custom Workspace 1 tabs
 * - Custom Workspace 2 tabs
 * - etc.
 *
 * This improves keyboard navigation (Ctrl+Tab) by keeping workspace tabs adjacent.
 */

import { WindowWorkspaceAssignments, WorkspaceAssignments, WorkspaceDefinition } from "@/types/Workspace";

/**
 * Extract the original URL (identity function since we no longer use restore URLs)
 */
function extractOriginalUrl(url: string): string {
    return url;
}

/**
 * Compare two URLs, accounting for restore URL format
 *
 * NOTE: Duplicated here to avoid code splitting issues with service worker context
 */
function urlsMatch(url1: string, url2: string): boolean {
    const original1 = extractOriginalUrl(url1);
    const original2 = extractOriginalUrl(url2);
    return original1 === original2;
}

// Track windows currently being reordered to prevent loops
const isReordering = new Set<number>();

// Debounce timeouts per window
const reorderTimeouts = new Map<number, NodeJS.Timeout>();

interface ReorderOptions {
    debounce?: boolean;
    reason?: string;
}

interface MoveOperation {
    tabId: number;
    targetIndex: number;
}

/**
 * Get the workspace a tab belongs to
 * Priority: Group assignment > Individual tab assignment > General
 */
function getWorkspaceForTab(
    tab: chrome.tabs.Tab,
    groupWorkspaceMap: Map<number, string>,
    workspaceAssignments: WindowWorkspaceAssignments,
    windowId: number
): string {
    // 1. Check group assignment (highest priority)
    if (tab.groupId !== undefined && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
        const groupWorkspace = groupWorkspaceMap.get(tab.groupId);
        if (groupWorkspace && groupWorkspace !== "general") {
            return groupWorkspace;
        }
    }

    // 2. Check individual tab assignment
    const assignments = workspaceAssignments[windowId] || {};

    // Prefer tabId matches when available
    for (const workspaceId in assignments) {
        if (workspaceId === "general") continue; // Skip general (computed)

        const workspace = assignments[workspaceId];
        if (workspace.tabs && workspace.tabs.some((t) => t.tabId != null && t.tabId === tab.id)) {
            return workspaceId;
        }
    }

    // Fallback to URL matching when no tabId match exists
    for (const workspaceId in assignments) {
        if (workspaceId === "general") continue; // Skip general (computed)

        const workspace = assignments[workspaceId];
        if (workspace.tabs && workspace.tabs.some((t) => t.tabId == null && urlsMatch(t.url, tab.url || ""))) {
            return workspaceId;
        }
    }

    // 3. Default to general
    return "general";
}

/**
 * Get the stored index for a tab within its workspace
 */
function getStoredIndex(tab: chrome.tabs.Tab, workspaceId: string, assignments: WorkspaceAssignments): number {
    const workspace = assignments[workspaceId];
    if (!workspace) {
        return tab.index; // Fallback to current index
    }

    // Check if tab is in a stored group
    if (workspace.groups) {
        for (const group of workspace.groups) {
            const tabIndex = group.tabUrls?.findIndex((url) => urlsMatch(url, tab.url || ""));
            if (tabIndex !== undefined && tabIndex !== -1) {
                return group.index + tabIndex; // Group's index + position in group
            }
        }
    }

    // Check individual tab assignment
    if (workspace.tabs) {
        const storedTabById = workspace.tabs.find((t) => t.tabId != null && t.tabId === tab.id);
        if (storedTabById) {
            return storedTabById.index;
        }

        const storedTabByUrl = workspace.tabs.find((t) => t.tabId == null && urlsMatch(t.url, tab.url || ""));
        if (storedTabByUrl) {
            return storedTabByUrl.index;
        }
    }

    // Fallback to current index
    return tab.index;
}

/**
 * Build a map of group IDs to their workspace assignments
 */
function buildGroupWorkspaceMap(
    groups: chrome.tabGroups.TabGroup[],
    workspaceAssignments: WindowWorkspaceAssignments,
    windowId: number
): Map<number, string> {
    const groupWorkspaceMap = new Map<number, string>();
    const assignments = workspaceAssignments[windowId] || {};

    for (const group of groups) {
        // Find which workspace this group belongs to
        for (const workspaceId in assignments) {
            if (workspaceId === "general") continue;

            const workspace = assignments[workspaceId];
            if (workspace.groups) {
                const matchingGroup = workspace.groups.find((g) => g.title === group.title && g.color === group.color);

                if (matchingGroup) {
                    groupWorkspaceMap.set(group.id, workspaceId);
                    break;
                }
            }
        }
    }

    return groupWorkspaceMap;
}

/**
 * Get the workspace for a tab group
 */
function getWorkspaceForGroup(group: chrome.tabGroups.TabGroup, workspaceAssignments: WindowWorkspaceAssignments, windowId: number): string {
    const assignments = workspaceAssignments[windowId] || {};

    for (const workspaceId in assignments) {
        if (workspaceId === "general") continue;

        const workspace = assignments[workspaceId];
        if (workspace.groups) {
            const matchingGroup = workspace.groups.find((g) => g.title === group.title && g.color === group.color);
            if (matchingGroup) {
                return workspaceId;
            }
        }
    }

    return "general";
}

/**
 * Reorder all tabs in a window by workspace assignment
 * Uses chrome.tabGroups.move() for groups to preserve group integrity
 */
export async function reorderTabsByWorkspace(windowId: number, options: ReorderOptions = {}): Promise<void> {
    const { reason = "unknown" } = options;

    // Prevent recursive reordering
    if (isReordering.has(windowId)) {
        console.log(`[Workspace Reorder] Skipping - already reordering window ${windowId}`);
        return;
    }

    isReordering.add(windowId);
    const startTime = Date.now();

    try {
        console.log(`[Workspace Reorder] Starting reorder for window ${windowId} (${reason})`);

        // Get all tabs and groups for the window
        const tabs = await chrome.tabs.query({ windowId });
        const groups = await chrome.tabGroups.query({ windowId });

        console.log(`[Workspace Reorder] Found ${tabs.length} tabs, ${groups.length} groups`);

        // Get workspace data
        const result = await chrome.storage.local.get(["workspaces", "workspaceAssignments", "enableWorkspaces"]);

        // Early exit if workspaces disabled
        if (!(result.enableWorkspaces ?? false)) {
            console.log("[Workspace Reorder] Workspaces disabled, skipping");
            return;
        }

        const workspaces: WorkspaceDefinition[] = result.workspaces || [];
        const workspaceAssignments: WindowWorkspaceAssignments = result.workspaceAssignments || {};

        // Validate workspace data
        if (!workspaceAssignments || typeof workspaceAssignments !== "object") {
            console.warn("[Workspace Reorder] Invalid workspace assignments, skipping");
            return;
        }

        const windowAssignments = workspaceAssignments[windowId];
        if (!windowAssignments) {
            console.log(`[Workspace Reorder] No assignments for window ${windowId}`);
            return;
        }

        // Build group workspace map
        const groupWorkspaceMap = buildGroupWorkspaceMap(groups, workspaceAssignments, windowId);

        // Helper to get workspace order index
        const getWorkspaceOrderIndex = (workspaceId: string): number => {
            const index = workspaces.findIndex((w) => w.id === workspaceId);
            return index === -1 ? 999 : index; // Unknown workspaces go to end
        };

        // Separate tabs by type: pinned, ungrouped unpinned, and grouped
        const pinnedTabs = tabs.filter((t) => t.pinned);
        const ungroupedUnpinnedTabs = tabs.filter((t) => !t.pinned && (t.groupId === undefined || t.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE));

        // Get tabs for each group
        const groupTabsMap = new Map<number, chrome.tabs.Tab[]>();
        for (const group of groups) {
            const groupTabs = tabs.filter((t) => t.groupId === group.id);
            groupTabsMap.set(group.id, groupTabs);
        }

        // Sort pinned tabs by workspace, then by current index
        pinnedTabs.sort((a, b) => {
            const aWorkspace = getWorkspaceForTab(a, groupWorkspaceMap, workspaceAssignments, windowId);
            const bWorkspace = getWorkspaceForTab(b, groupWorkspaceMap, workspaceAssignments, windowId);
            const workspaceCompare = getWorkspaceOrderIndex(aWorkspace) - getWorkspaceOrderIndex(bWorkspace);

            if (workspaceCompare !== 0) return workspaceCompare;
            return a.index - b.index; // Preserve relative order within workspace
        });

        // Sort groups by workspace
        const sortedGroups = [...groups].sort((a, b) => {
            const aWorkspace = getWorkspaceForGroup(a, workspaceAssignments, windowId);
            const bWorkspace = getWorkspaceForGroup(b, workspaceAssignments, windowId);
            const workspaceCompare = getWorkspaceOrderIndex(aWorkspace) - getWorkspaceOrderIndex(bWorkspace);

            if (workspaceCompare !== 0) return workspaceCompare;

            // Within workspace, preserve relative order by first tab index
            const aFirstTab = groupTabsMap.get(a.id)?.[0];
            const bFirstTab = groupTabsMap.get(b.id)?.[0];
            return (aFirstTab?.index ?? 0) - (bFirstTab?.index ?? 0);
        });

        // Sort ungrouped tabs by workspace, then by stored index
        ungroupedUnpinnedTabs.sort((a, b) => {
            const aWorkspace = getWorkspaceForTab(a, groupWorkspaceMap, workspaceAssignments, windowId);
            const bWorkspace = getWorkspaceForTab(b, groupWorkspaceMap, workspaceAssignments, windowId);
            const workspaceCompare = getWorkspaceOrderIndex(aWorkspace) - getWorkspaceOrderIndex(bWorkspace);

            if (workspaceCompare !== 0) return workspaceCompare;

            // Within workspace, preserve stored index order
            const aStoredIndex = getStoredIndex(a, aWorkspace, windowAssignments);
            const bStoredIndex = getStoredIndex(b, bWorkspace, windowAssignments);
            return aStoredIndex - bStoredIndex;
        });

        // Build interleaved target order:
        // 1. Pinned tabs first
        // 2. Unpinned items (groups and ungrouped tabs) sorted by workspace

        // Create a combined list of "items" (groups or single tabs) with their workspace
        type ReorderItem =
            | { type: "pinnedTab"; tab: chrome.tabs.Tab; workspace: string }
            | { type: "group"; group: chrome.tabGroups.TabGroup; tabs: chrome.tabs.Tab[]; workspace: string }
            | { type: "ungroupedTab"; tab: chrome.tabs.Tab; workspace: string };

        const reorderItems: ReorderItem[] = [];

        // Add pinned tabs
        for (const tab of pinnedTabs) {
            const workspace = getWorkspaceForTab(tab, groupWorkspaceMap, workspaceAssignments, windowId);
            reorderItems.push({ type: "pinnedTab", tab, workspace });
        }

        // Add groups and ungrouped tabs as items, sorted by workspace
        const unpinnedItems: ReorderItem[] = [];

        for (const group of sortedGroups) {
            const workspace = getWorkspaceForGroup(group, workspaceAssignments, windowId);
            const groupTabs = groupTabsMap.get(group.id) || [];
            unpinnedItems.push({ type: "group", group, tabs: groupTabs, workspace });
        }

        for (const tab of ungroupedUnpinnedTabs) {
            const workspace = getWorkspaceForTab(tab, groupWorkspaceMap, workspaceAssignments, windowId);
            unpinnedItems.push({ type: "ungroupedTab", tab, workspace });
        }

        // Helper to get stored index for groups
        // Falls back to current Chrome position if no stored index (e.g., General workspace)
        const getStoredGroupIndex = (group: chrome.tabGroups.TabGroup, workspaceId: string): number => {
            const workspace = windowAssignments[workspaceId];
            const groupTabs = groupTabsMap.get(group.id);
            const currentPosition = groupTabs?.[0]?.index ?? 0;

            // For General workspace or workspaces without stored data, use current Chrome position
            if (!workspace?.groups) return currentPosition;

            const storedGroup = workspace.groups.find(
                (g: { title: string; color: string; index?: number }) => g.title === group.title && g.color === group.color
            );

            // If no stored index, fall back to current position
            return storedGroup?.index ?? currentPosition;
        };

        // Sort unpinned items by workspace order, then by STORED index (not current Chrome index)
        // This ensures newly moved items go to the end of their workspace
        unpinnedItems.sort((a, b) => {
            const workspaceCompare = getWorkspaceOrderIndex(a.workspace) - getWorkspaceOrderIndex(b.workspace);
            if (workspaceCompare !== 0) return workspaceCompare;

            // Use stored index for ordering within workspace
            let aIndex: number;
            let bIndex: number;

            if (a.type === "group") {
                aIndex = getStoredGroupIndex(a.group, a.workspace);
            } else {
                aIndex = getStoredIndex(a.tab, a.workspace, windowAssignments);
            }

            if (b.type === "group") {
                bIndex = getStoredGroupIndex(b.group, b.workspace);
            } else {
                bIndex = getStoredIndex(b.tab, b.workspace, windowAssignments);
            }

            return aIndex - bIndex;
        });

        reorderItems.push(...unpinnedItems);

        // Calculate target positions and execute moves
        let currentTargetIndex = 0;
        let movesMade = 0;

        // Process pinned tabs first
        for (const item of reorderItems) {
            if (item.type === "pinnedTab") {
                if (item.tab.id !== undefined && item.tab.index !== currentTargetIndex) {
                    try {
                        await chrome.tabs.move(item.tab.id, { index: currentTargetIndex });
                        movesMade++;
                    } catch (error: any) {
                        if (!error.message?.includes("No tab with id")) {
                            console.error(`[Workspace Reorder] Error moving pinned tab ${item.tab.id}:`, error);
                        }
                    }
                }
                currentTargetIndex++;
            }
        }

        // Process unpinned items (groups and ungrouped tabs)
        for (const item of reorderItems) {
            if (item.type === "group") {
                // Move entire group using chrome.tabGroups.move()
                // This preserves group integrity
                const firstTabOfGroup = item.tabs[0];
                if (firstTabOfGroup && firstTabOfGroup.index !== currentTargetIndex) {
                    try {
                        await chrome.tabGroups.move(item.group.id, { index: currentTargetIndex });
                        movesMade++;
                        console.log(`[Workspace Reorder] Moved group "${item.group.title}" to index ${currentTargetIndex}`);
                    } catch (error: any) {
                        if (!error.message?.includes("No group with id")) {
                            console.error(`[Workspace Reorder] Error moving group ${item.group.id}:`, error);
                        }
                    }
                }
                currentTargetIndex += item.tabs.length;
            } else if (item.type === "ungroupedTab") {
                if (item.tab.id !== undefined && item.tab.index !== currentTargetIndex) {
                    try {
                        await chrome.tabs.move(item.tab.id, { index: currentTargetIndex });
                        movesMade++;
                    } catch (error: any) {
                        if (!error.message?.includes("No tab with id")) {
                            console.error(`[Workspace Reorder] Error moving tab ${item.tab.id}:`, error);
                        }
                    }
                }
                currentTargetIndex++;
            }
        }

        if (movesMade === 0) {
            console.log("[Workspace Reorder] Tabs already in correct order");
        } else {
            console.log(`[Workspace Reorder] Made ${movesMade} moves`);
        }

        const duration = Date.now() - startTime;
        console.log(`[Workspace Reorder] Complete in ${duration}ms`);
    } catch (error) {
        console.error(`[Workspace Reorder] Failed to reorder window ${windowId}:`, error);
    } finally {
        isReordering.delete(windowId);
    }
}

/**
 * Debounced version of reorderTabsByWorkspace
 * Coalesces multiple rapid calls into a single reorder operation
 */
export function debouncedReorderTabsByWorkspace(windowId: number, reason?: string): void {
    // Clear existing timeout for this window
    const existing = reorderTimeouts.get(windowId);
    if (existing) {
        clearTimeout(existing);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
        reorderTabsByWorkspace(windowId, { reason });
        reorderTimeouts.delete(windowId);
    }, 300);

    reorderTimeouts.set(windowId, timeout);
}

/**
 * Check if a window is currently being reordered
 * Useful for sync logic to avoid triggering during reorder
 */
export function isWindowReordering(windowId: number): boolean {
    return isReordering.has(windowId);
}
