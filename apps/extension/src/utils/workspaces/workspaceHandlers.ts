import { WorkspaceDefinition } from "@/types/Workspace";
import { extractOriginalUrl, urlsMatch } from "./workspaceMatcher";
import { debouncedReorderTabsByWorkspace } from "./workspaceReorder";

/**
 * Generate a unique ID for a workspace
 */
export function generateWorkspaceId(): string {
    return `workspace_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create a new workspace
 */
export async function createWorkspace(name: string, icon: string): Promise<WorkspaceDefinition> {
    const workspace: WorkspaceDefinition = {
        id: generateWorkspaceId(),
        name,
        icon,
        isDefault: false,
    };

    // Add to storage
    const result = await chrome.storage.local.get("workspaces");
    const workspaces = result.workspaces || [];
    workspaces.push(workspace);
    await chrome.storage.local.set({ workspaces });

    return workspace;
}

/**
 * Delete a workspace
 */
export async function deleteWorkspace(workspaceId: string): Promise<boolean> {
    // Cannot delete the default "general" workspace
    if (workspaceId === "general") return false;

    try {
        // Remove from workspaces list
        const result = await chrome.storage.local.get(["workspaces", "workspaceAssignments", "activeWorkspacePerWindow"]);

        const workspaces = (result.workspaces || []).filter((w: WorkspaceDefinition) => w.id !== workspaceId);
        await chrome.storage.local.set({ workspaces });

        // Remove assignments for this workspace
        const workspaceAssignments = result.workspaceAssignments || {};
        for (const windowId in workspaceAssignments) {
            if (workspaceAssignments[windowId][workspaceId]) {
                delete workspaceAssignments[windowId][workspaceId];
            }
        }
        await chrome.storage.local.set({ workspaceAssignments });

        // If any window had this workspace active, switch to general
        const activeWorkspacePerWindow = result.activeWorkspacePerWindow || {};
        for (const windowId in activeWorkspacePerWindow) {
            if (activeWorkspacePerWindow[windowId] === workspaceId) {
                activeWorkspacePerWindow[windowId] = "general";
            }
        }
        await chrome.storage.local.set({ activeWorkspacePerWindow });

        return true;
    } catch (error) {
        console.error("Error deleting workspace:", error);
        return false;
    }
}

/**
 * Rename a workspace
 */
export async function renameWorkspace(workspaceId: string, newName: string): Promise<boolean> {
    try {
        // Special handling for "general" workspace - save to settings instead
        if (workspaceId === "general") {
            await chrome.storage.local.set({ generalWorkspaceName: newName });
            return true;
        }

        const result = await chrome.storage.local.get("workspaces");
        const workspaces = result.workspaces || [];

        const workspace = workspaces.find((w: WorkspaceDefinition) => w.id === workspaceId);
        if (workspace) {
            workspace.name = newName;
            await chrome.storage.local.set({ workspaces });
            return true;
        }

        return false;
    } catch (error) {
        console.error("Error renaming workspace:", error);
        return false;
    }
}

/**
 * Change workspace icon
 */
export async function changeWorkspaceIcon(workspaceId: string, newIcon: string): Promise<boolean> {
    try {
        // Special handling for "general" workspace - save to settings instead
        if (workspaceId === "general") {
            await chrome.storage.local.set({ generalWorkspaceIcon: newIcon });
            return true;
        }

        const result = await chrome.storage.local.get("workspaces");
        const workspaces = result.workspaces || [];

        const workspace = workspaces.find((w: WorkspaceDefinition) => w.id === workspaceId);
        if (workspace) {
            workspace.icon = newIcon;
            await chrome.storage.local.set({ workspaces });
            return true;
        }

        return false;
    } catch (error) {
        console.error("Error changing workspace icon:", error);
        return false;
    }
}

/**
 * Add tab to workspace
 */
interface AddTabToWorkspaceOptions {
    skipUrlDeduplication?: boolean;
}

export async function addTabToWorkspace(
    tabId: number,
    workspaceId: string,
    windowId: number,
    options: AddTabToWorkspaceOptions = {}
): Promise<boolean> {
    try {
        // Cannot manually assign to "general" workspace (it's computed dynamically)
        if (workspaceId === "general") {
            return false;
        }

        const tab = await chrome.tabs.get(tabId);
        if (!tab.url) return false;

        // Extract the original URL in case this is a suspended/restore tab
        const tabOriginalUrl = extractOriginalUrl(tab.url);
        const { skipUrlDeduplication = false } = options;

        const result = await chrome.storage.local.get("workspaceAssignments");
        const workspaceAssignments = result.workspaceAssignments || {};

        if (!workspaceAssignments[windowId]) {
            workspaceAssignments[windowId] = {};
        }

        // Remove tab from all other workspaces first
        for (const wsId in workspaceAssignments[windowId]) {
            if (wsId !== workspaceId && workspaceAssignments[windowId][wsId].tabs) {
                workspaceAssignments[windowId][wsId].tabs = workspaceAssignments[windowId][wsId].tabs.filter((t: { url: string; tabId?: number }) => {
                    if (t.tabId != null && t.tabId === tabId) return false;
                    if (skipUrlDeduplication) return true;
                    return !urlsMatch(t.url, tabOriginalUrl);
                });
            }
        }

        if (!workspaceAssignments[windowId][workspaceId]) {
            workspaceAssignments[windowId][workspaceId] = { groups: [], tabs: [] };
        }

        const targetWorkspace = workspaceAssignments[windowId][workspaceId];
        const existingTabIndex = targetWorkspace.tabs.findIndex(
            (t: { url: string; tabId?: number }) =>
                (t.tabId != null && t.tabId === tabId) || (!skipUrlDeduplication && urlsMatch(t.url, tabOriginalUrl))
        );

        if (existingTabIndex !== -1) {
            targetWorkspace.tabs[existingTabIndex] = {
                ...targetWorkspace.tabs[existingTabIndex],
                url: tabOriginalUrl,
                title: tab.title || "",
                tabId,
            };
        } else {
            // Use a high index to place at end of workspace
            // This will be sorted relative to other tabs in the same workspace
            const maxIndex = Math.max(...targetWorkspace.tabs.map((t: any) => t.index || 0), 0);

            // Always store the original URL (not the restore URL)
            targetWorkspace.tabs.push({
                url: tabOriginalUrl,
                title: tab.title || "",
                index: maxIndex + 1000, // Large increment to ensure it's at the end
                tabId,
            });
        }

        await chrome.storage.local.set({ workspaceAssignments });

        // Reorder all tabs by workspace to maintain logical grouping
        // Import is now at top of file
        debouncedReorderTabsByWorkspace(windowId, "add-tab-to-workspace");

        return true;
    } catch (error) {
        console.error("Error adding tab to workspace:", error);
        return false;
    }
}

/**
 * Force a tab to the end of a workspace.
 * - If workspaceId === "general", the tab is removed from all custom workspaces.
 * - Otherwise the tab is removed from all other workspaces, then inserted into the target workspace
 *   with a very large index so workspace reordering places it at the end.
 */
export async function moveTabToWorkspaceEnd(tabId: number, workspaceId: string, windowId: number): Promise<boolean> {
    try {
        if (workspaceId === "general") {
            return await removeTabFromAllWorkspaces(tabId, windowId);
        }

        const tab = await chrome.tabs.get(tabId);
        if (!tab.url) return false;

        const tabOriginalUrl = extractOriginalUrl(tab.url);

        const result = await chrome.storage.local.get("workspaceAssignments");
        const workspaceAssignments = result.workspaceAssignments || {};

        if (!workspaceAssignments[windowId]) {
            workspaceAssignments[windowId] = {};
        }

        // Remove from all other workspaces first
        for (const wsId in workspaceAssignments[windowId]) {
            if (wsId !== workspaceId && workspaceAssignments[windowId][wsId].tabs) {
                workspaceAssignments[windowId][wsId].tabs = workspaceAssignments[windowId][wsId].tabs.filter((t: { url: string; tabId?: number }) => {
                    if (t.tabId != null && t.tabId === tabId) return false;
                    return t.tabId != null ? true : !urlsMatch(t.url, tabOriginalUrl);
                });
            }
        }

        if (!workspaceAssignments[windowId][workspaceId]) {
            workspaceAssignments[windowId][workspaceId] = { groups: [], tabs: [] };
        }

        const targetWorkspace = workspaceAssignments[windowId][workspaceId];

        // Remove existing entries for this tab in the target workspace so we can re-insert at end
        if (targetWorkspace.tabs) {
            targetWorkspace.tabs = targetWorkspace.tabs.filter((t: { url: string; tabId?: number }) => {
                if (t.tabId != null && t.tabId === tabId) return false;
                return t.tabId != null ? true : !urlsMatch(t.url, tabOriginalUrl);
            });
        } else {
            targetWorkspace.tabs = [];
        }

        // Compute a "very end" index that will end up after all tabs and groups
        let maxIndex = 0;
        if (targetWorkspace.tabs.length > 0) {
            maxIndex = Math.max(maxIndex, ...targetWorkspace.tabs.map((t: any) => t.index || 0));
        }
        if (targetWorkspace.groups && targetWorkspace.groups.length > 0) {
            for (const group of targetWorkspace.groups) {
                const groupEndIndex = (group.index || 0) + (group.tabUrls?.length || 0);
                maxIndex = Math.max(maxIndex, groupEndIndex);
            }
        }

        targetWorkspace.tabs.push({
            url: tabOriginalUrl,
            title: tab.title || "",
            index: maxIndex + 1000,
            tabId,
        });

        await chrome.storage.local.set({ workspaceAssignments });

        debouncedReorderTabsByWorkspace(windowId, "move-tab-to-workspace-end");

        return true;
    } catch (error) {
        console.error("Error moving tab to workspace end:", error);
        return false;
    }
}

/**
 * Remove tab from all workspaces (assign to "general" workspace)
 */
export async function removeTabFromAllWorkspaces(tabId: number, windowId: number): Promise<boolean> {
    try {
        const tab = await chrome.tabs.get(tabId);
        if (!tab.url) return false;

        // Extract the original URL in case this is a suspended/restore tab
        const tabOriginalUrl = extractOriginalUrl(tab.url);

        const result = await chrome.storage.local.get("workspaceAssignments");
        const workspaceAssignments = result.workspaceAssignments || {};

        if (!workspaceAssignments[windowId]) {
            return true; // Already not assigned
        }

        // Remove tab from all workspaces using URL matching
        for (const wsId in workspaceAssignments[windowId]) {
            // Remove from individual tab assignments
            if (workspaceAssignments[windowId][wsId].tabs) {
                workspaceAssignments[windowId][wsId].tabs = workspaceAssignments[windowId][wsId].tabs.filter((t: { url: string; tabId?: number }) => {
                    if (t.tabId != null && t.tabId === tabId) return false;
                    return t.tabId != null ? true : !urlsMatch(t.url, tabOriginalUrl);
                });
            }

            // ALSO remove from any group's tabUrls array
            if (workspaceAssignments[windowId][wsId].groups) {
                workspaceAssignments[windowId][wsId].groups.forEach((g: { tabUrls: string[] }) => {
                    g.tabUrls = g.tabUrls.filter((url: string) => !urlsMatch(url, tabOriginalUrl));
                });
            }
        }

        await chrome.storage.local.set({ workspaceAssignments });

        // Reorder all tabs by workspace to maintain logical grouping
        // Import is now at top of file
        debouncedReorderTabsByWorkspace(windowId, "remove-tab-from-workspaces");

        return true;
    } catch (error) {
        console.error("Error removing tab from all workspaces:", error);
        return false;
    }
}

/**
 * Remove tab group from all workspaces (assign to "general" workspace)
 * Also removes all tabs inside the group from all workspaces
 */
export async function removeGroupFromAllWorkspaces(groupId: number, windowId: number): Promise<boolean> {
    try {
        const group = await chrome.tabGroups.get(groupId);
        const tabs = await chrome.tabs.query({ groupId });

        const result = await chrome.storage.local.get("workspaceAssignments");
        const workspaceAssignments = result.workspaceAssignments || {};

        if (!workspaceAssignments[windowId]) {
            return true; // Already not assigned
        }

        // Remove group from all workspaces
        for (const wsId in workspaceAssignments[windowId]) {
            if (workspaceAssignments[windowId][wsId].groups) {
                workspaceAssignments[windowId][wsId].groups = workspaceAssignments[windowId][wsId].groups.filter(
                    (g: { title: string; color: string }) => !(g.title === group.title && g.color === group.color)
                );
            }
        }

        // Remove all tabs in the group from all workspaces using URL matching
        for (const tab of tabs) {
            if (!tab.url) continue;

            const tabOriginalUrl = extractOriginalUrl(tab.url);

            for (const wsId in workspaceAssignments[windowId]) {
                if (workspaceAssignments[windowId][wsId].tabs) {
                    workspaceAssignments[windowId][wsId].tabs = workspaceAssignments[windowId][wsId].tabs.filter(
                        (t: { url: string }) => !urlsMatch(t.url, tabOriginalUrl)
                    );
                }
            }
        }

        await chrome.storage.local.set({ workspaceAssignments });

        // Reorder all tabs by workspace to maintain logical grouping
        // Import is now at top of file
        debouncedReorderTabsByWorkspace(windowId, "remove-group-from-workspaces");

        return true;
    } catch (error) {
        console.error("Error removing group from all workspaces:", error);
        return false;
    }
}

/**
 * Add tab group to workspace
 * Also adds all tabs inside the group to the same workspace
 */
export async function addGroupToWorkspace(groupId: number, workspaceId: string, windowId: number): Promise<boolean> {
    try {
        // Cannot manually assign to "general" workspace (it's computed dynamically)
        if (workspaceId === "general") {
            return false;
        }

        const group = await chrome.tabGroups.get(groupId);
        const tabs = await chrome.tabs.query({ groupId });

        const result = await chrome.storage.local.get("workspaceAssignments");
        const workspaceAssignments = result.workspaceAssignments || {};

        if (!workspaceAssignments[windowId]) {
            workspaceAssignments[windowId] = {};
        }

        // Remove group from all other workspaces first (ensure it's only in one workspace)
        for (const wsId in workspaceAssignments[windowId]) {
            if (wsId !== workspaceId && workspaceAssignments[windowId][wsId].groups) {
                workspaceAssignments[windowId][wsId].groups = workspaceAssignments[windowId][wsId].groups.filter(
                    (g: { title: string; color: string }) => !(g.title === group.title && g.color === group.color)
                );
            }
        }

        if (!workspaceAssignments[windowId][workspaceId]) {
            workspaceAssignments[windowId][workspaceId] = { groups: [], tabs: [] };
        }

        // Check if group already exists in target workspace
        const exists = workspaceAssignments[windowId][workspaceId].groups.some(
            (g: { title: string; color: string }) => g.title === group.title && g.color === group.color
        );

        if (!exists) {
            // Use a high index to place at end of workspace
            // Calculate max index from both groups and tabs in this workspace
            const maxGroupIndex = Math.max(...workspaceAssignments[windowId][workspaceId].groups.map((g: any) => g.index || 0), 0);
            const maxTabIndex = Math.max(...workspaceAssignments[windowId][workspaceId].tabs.map((t: any) => t.index || 0), 0);
            const maxIndex = Math.max(maxGroupIndex, maxTabIndex);

            // Store original URLs (not restore URLs)
            workspaceAssignments[windowId][workspaceId].groups.push({
                title: group.title || "",
                color: group.color,
                index: maxIndex + 1000, // Large increment to ensure it's at the end
                tabUrls: tabs.map((t) => extractOriginalUrl(t.url || "")),
            });
        }

        // Also add all tabs in the group to the same workspace
        // This ensures tabs remain in the workspace even after being ungrouped
        for (const tab of tabs) {
            if (!tab.url) continue;

            const tabOriginalUrl = extractOriginalUrl(tab.url);

            // Remove tab from all other workspaces using URL matching
            for (const wsId in workspaceAssignments[windowId]) {
                if (wsId !== workspaceId && workspaceAssignments[windowId][wsId].tabs) {
                    workspaceAssignments[windowId][wsId].tabs = workspaceAssignments[windowId][wsId].tabs.filter(
                        (t: { url: string; tabId?: number }) => {
                            if (t.tabId != null && t.tabId === tab.id) return false;
                            return t.tabId != null ? true : !urlsMatch(t.url, tabOriginalUrl);
                        }
                    );
                }
            }

            // Check if tab already exists in target workspace using URL matching
            const tabExists = workspaceAssignments[windowId][workspaceId].tabs.some(
                (t: { url: string; tabId?: number }) =>
                    (t.tabId != null && t.tabId === tab.id) || (t.tabId == null && urlsMatch(t.url, tabOriginalUrl))
            );

            if (!tabExists) {
                // Use a high index to place at end of workspace
                const maxIndex = Math.max(...workspaceAssignments[windowId][workspaceId].tabs.map((t: any) => t.index || 0), 0);

                // Store the original URL (not the restore URL)
                workspaceAssignments[windowId][workspaceId].tabs.push({
                    url: tabOriginalUrl,
                    title: tab.title || "",
                    index: maxIndex + 1000, // Large increment to ensure it's at the end
                    tabId: tab.id,
                });
            }
        }

        await chrome.storage.local.set({ workspaceAssignments });

        // Reorder all tabs by workspace to maintain logical grouping
        // Import is now at top of file
        debouncedReorderTabsByWorkspace(windowId, "add-group-to-workspace");

        return true;
    } catch (error) {
        console.error("Error adding group to workspace:", error);
        return false;
    }
}
