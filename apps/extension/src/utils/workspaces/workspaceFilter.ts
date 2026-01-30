import { Tab } from "@/types/Tab";
import { TabGroup } from "@/types/TabGroup";
import { WorkspaceDefinition, WorkspaceAssignments } from "@/types/Workspace";
import { ItemType, CombinedItem } from "@/types/CombinedItem";

/**
 * Extract the original URL (identity function since we no longer use restore URLs)
 */
function extractOriginalUrl(url: string): string {
    return url;
}

/**
 * Compare two URLs, accounting for restore URL format
 */
function urlsMatch(url1: string, url2: string): boolean {
    const original1 = extractOriginalUrl(url1);
    const original2 = extractOriginalUrl(url2);
    return original1 === original2;
}

/**
 * Generate a unique identifier for a tab
 * Format: url|groupFingerprint|index
 */
export function getTabIdentifier(tab: Tab): string {
    const groupFingerprint = tab.groupId && tab.groupId !== -1 ? `group-${tab.groupId}` : "ungrouped";
    return `${tab.url}|${groupFingerprint}|${tab.index}`;
}

/**
 * Generate a unique identifier for a tab group
 * Format: title|color|index
 */
export function getGroupIdentifier(group: TabGroup): string {
    // Use the index of the first tab in the group
    const firstTabIndex = group.tabs.length > 0 ? group.tabs[0].index : 0;
    return `${group.title}|${group.color}|${firstTabIndex}`;
}

/**
 * Check if a tab is assigned to a specific workspace
 */
export function isTabInWorkspace(tab: Tab, workspaceId: string, workspaceAssignments: WorkspaceAssignments): boolean {
    const workspace = workspaceAssignments[workspaceId];
    if (!workspace) return false;

    // Prefer tabId matching when available
    if (workspace.tabs.some((t) => t.tabId != null && t.tabId === tab.id)) {
        return true;
    }

    // Fallback to URL matching (accounting for restore URLs)
    return workspace.tabs.some((t) => t.tabId == null && urlsMatch(t.url, tab.url));
}

/**
 * Check if a tab group is assigned to a specific workspace
 */
export function isGroupInWorkspace(group: TabGroup, workspaceId: string, workspaceAssignments: WorkspaceAssignments): boolean {
    const workspace = workspaceAssignments[workspaceId];
    if (!workspace) return false;

    // Check if group title+color combination exists in workspace
    return workspace.groups.some((g) => g.title === group.title && g.color === group.color);
}

/**
 * Get all identifiers (tab URLs and group fingerprints) assigned to any custom workspace
 */
export function getAssignedIdentifiers(workspaceAssignments: WorkspaceAssignments, allWorkspaces: WorkspaceDefinition[]): Set<string> {
    const assigned = new Set<string>();

    // Only consider custom workspaces (not "general")
    const customWorkspaces = allWorkspaces.filter((w) => !w.isDefault);

    for (const workspace of customWorkspaces) {
        const assignments = workspaceAssignments[workspace.id];
        if (!assignments) continue;

        // Add all tab URLs (extract original URLs from restore URLs)
        assignments.tabs.forEach((t) => assigned.add(extractOriginalUrl(t.url)));

        // Add all group fingerprints (title|color)
        assignments.groups.forEach((g) => assigned.add(`${g.title}|${g.color}`));
    }

    return assigned;
}

/**
 * Find which workspace contains a specific tab by URL
 */
export function findWorkspaceContainingTab(
    tabUrl: string,
    workspaceAssignments: WorkspaceAssignments,
    allWorkspaces: WorkspaceDefinition[]
): WorkspaceDefinition | null {
    // Check custom workspaces first (not "general")
    const customWorkspaces = allWorkspaces.filter((w) => !w.isDefault);

    for (const workspace of customWorkspaces) {
        const assignments = workspaceAssignments[workspace.id];
        if (assignments) {
            // Check if tab is directly assigned to this workspace (accounting for restore URLs)
            if (assignments.tabs.some((t) => urlsMatch(t.url, tabUrl))) {
                return workspace;
            }

            // Check if tab is part of a group assigned to this workspace (accounting for restore URLs)
            if (assignments.groups.some((g) => g.tabUrls.some((url) => urlsMatch(url, tabUrl)))) {
                return workspace;
            }
        }
    }

    // If not found in any custom workspace, it belongs to "general"
    const generalWorkspace = allWorkspaces.find((w) => w.isDefault);
    return generalWorkspace || null;
}

/**
 * Find which workspace contains a specific tab by tabId
 */
export async function findWorkspaceContainingTabById(
    tabId: number,
    workspaceAssignments: WorkspaceAssignments,
    allWorkspaces: WorkspaceDefinition[]
): Promise<WorkspaceDefinition | null> {
    try {
        const customWorkspaces = allWorkspaces.filter((w) => !w.isDefault);

        for (const workspace of customWorkspaces) {
            const assignments = workspaceAssignments[workspace.id];
            if (assignments?.tabs?.some((t) => t.tabId != null && t.tabId === tabId)) {
                return workspace;
            }
        }

        const tab = await chrome.tabs.get(tabId);
        if (tab.url) {
            return findWorkspaceContainingTab(tab.url, workspaceAssignments, allWorkspaces);
        }
    } catch (error) {
        console.error("Error finding workspace for tab:", error);
    }
    return null;
}

/**
 * Find which workspace contains the active tab, prioritizing group assignments
 *
 * This function ensures that when a tab belongs to a group, the group's workspace
 * assignment takes precedence over any individual tab assignment.
 *
 * @param activeTab - The currently active tab (must include groupId property)
 * @param workspaceAssignments - Current workspace assignments for the window
 * @param allWorkspaces - All defined workspaces
 * @returns The workspace containing the tab (or "general" if unassigned)
 */
export async function findWorkspaceForActiveTab(
    activeTab: chrome.tabs.Tab,
    workspaceAssignments: WorkspaceAssignments,
    allWorkspaces: WorkspaceDefinition[]
): Promise<WorkspaceDefinition | null> {
    // Check if tab is part of a group (and not ungrouped)
    if (activeTab.groupId && activeTab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
        try {
            // Get the group details
            const group = await chrome.tabGroups.get(activeTab.groupId);

            // Find which workspace contains this group (by title + color)
            const customWorkspaces = allWorkspaces.filter((w) => !w.isDefault);

            for (const workspace of customWorkspaces) {
                const assignments = workspaceAssignments[workspace.id];
                if (assignments && assignments.groups) {
                    // Check if this workspace contains the group
                    const groupExists = assignments.groups.some((g) => g.title === group.title && g.color === group.color);

                    if (groupExists) {
                        return workspace;
                    }
                }
            }
        } catch (error) {
            console.error("[Workspace Filter] Error getting group for active tab:", error);
            // Fall through to individual tab check
        }
    }

    // If tab is not in a group (or group not found), check individual tab assignment
    if (activeTab.url) {
        if (activeTab.id != null) {
            const customWorkspaces = allWorkspaces.filter((w) => !w.isDefault);
            for (const workspace of customWorkspaces) {
                const assignments = workspaceAssignments[workspace.id];
                if (assignments?.tabs?.some((t) => t.tabId != null && t.tabId === activeTab.id)) {
                    return workspace;
                }
            }
        }
        return findWorkspaceContainingTab(activeTab.url, workspaceAssignments, allWorkspaces);
    }

    // Default to "general" workspace
    const generalWorkspace = allWorkspaces.find((w) => w.isDefault);
    return generalWorkspace || null;
}

/**
 * Filter combined items (tabs and groups) based on active workspace
 */
export function filterItemsByWorkspace(
    items: CombinedItem[],
    activeWorkspace: WorkspaceDefinition | null,
    workspaceAssignments: WorkspaceAssignments,
    allWorkspaces: WorkspaceDefinition[],
    sharePinnedTabs?: boolean,
    fallbackAssignedIdentifiers?: Set<string>
): CombinedItem[] {
    // If no workspace is active or workspaces not enabled, return all items
    if (!activeWorkspace) return items;

    // If "General" workspace is active, show items NOT in any custom workspace
    if (activeWorkspace.isDefault) {
        const assignedIdentifiers = getAssignedIdentifiers(workspaceAssignments, allWorkspaces);
        const effectiveAssignedIdentifiers =
            assignedIdentifiers.size > 0 ? assignedIdentifiers : (fallbackAssignedIdentifiers ?? assignedIdentifiers);

        return items.filter((item) => {
            // If sharePinnedTabs is enabled, always show pinned tabs regardless of workspace
            if (item.type === ItemType.PINNED && sharePinnedTabs) {
                return true;
            }

            if (item.type === ItemType.GROUP) {
                const group = item.data as TabGroup;
                const groupFingerprint = `${group.title}|${group.color}`;
                return !effectiveAssignedIdentifiers.has(groupFingerprint);
            } else if (item.type === ItemType.REGULAR || item.type === ItemType.PINNED) {
                const tab = item.data as Tab;
                // Extract original URL before checking (handles restore URLs)
                return !effectiveAssignedIdentifiers.has(extractOriginalUrl(tab.url));
            }
            return true;
        });
    }

    // For custom workspaces, only show explicitly assigned items
    const assignments = workspaceAssignments[activeWorkspace.id];
    if (!assignments) return [];

    return items.filter((item) => {
        // If sharePinnedTabs is enabled, always show pinned tabs regardless of workspace
        if (item.type === ItemType.PINNED && sharePinnedTabs) {
            return true;
        }

        if (item.type === ItemType.GROUP) {
            const group = item.data as TabGroup;
            return isGroupInWorkspace(group, activeWorkspace.id, workspaceAssignments);
        } else if (item.type === ItemType.REGULAR || item.type === ItemType.PINNED) {
            const tab = item.data as Tab;
            return isTabInWorkspace(tab, activeWorkspace.id, workspaceAssignments);
        }
        return false;
    });
}
