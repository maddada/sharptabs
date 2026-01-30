/**
 * Utilities for tracking and restoring the last active tab per workspace
 * Used when "Separate Active Tab in Each Workspace" setting is enabled
 */

import { extractOriginalUrl, urlsMatch } from "./workspaceMatcher";

// Storage key for last active tab per workspace
// Format: { [windowId]: { [workspaceId]: { tabId: number, url: string } } }
const STORAGE_KEY = "lastActiveTabPerWorkspace";

interface LastActiveTabData {
    tabId: number;
    url: string; // Store URL as backup in case tabId changes
}

type LastActiveTabPerWorkspace = {
    [windowId: number]: {
        [workspaceId: string]: LastActiveTabData;
    };
};

/**
 * Save the last active tab for a workspace
 */
export async function saveLastActiveTabForWorkspace(windowId: number, workspaceId: string, tabId: number): Promise<void> {
    try {
        const tab = await chrome.tabs.get(tabId);
        if (!tab.url) return;

        const result = await chrome.storage.local.get(STORAGE_KEY);
        const data: LastActiveTabPerWorkspace = result[STORAGE_KEY] || {};

        if (!data[windowId]) {
            data[windowId] = {};
        }

        data[windowId][workspaceId] = {
            tabId,
            url: extractOriginalUrl(tab.url),
        };

        await chrome.storage.local.set({ [STORAGE_KEY]: data });
        console.log(`[Workspace ActiveTab] Saved tab ${tabId} as last active for workspace ${workspaceId}`);
    } catch (error) {
        console.error("[Workspace ActiveTab] Error saving last active tab:", error);
    }
}

/**
 * Migrate stored data from old window IDs to current window ID
 * This handles browser restart where window IDs change
 * Also merges missing workspace data from old windows into current window
 */
async function migrateWindowData(currentWindowId: number): Promise<LastActiveTabPerWorkspace> {
    console.log(`[Workspace_active_tab_restore] migrateWindowData called for windowId: ${currentWindowId}`);

    const result = await chrome.storage.local.get(STORAGE_KEY);
    const data: LastActiveTabPerWorkspace = result[STORAGE_KEY] || {};

    console.log(`[Workspace_active_tab_restore] Raw stored data:`, JSON.stringify(data, null, 2));
    console.log(`[Workspace_active_tab_restore] Stored window IDs: ${Object.keys(data).join(", ") || "none"}`);

    // Get all current windows
    const currentWindows = await chrome.windows.getAll();
    const currentWindowIds = new Set(currentWindows.map((w) => w.id));
    console.log(`[Workspace_active_tab_restore] Current browser window IDs: ${Array.from(currentWindowIds).join(", ")}`);

    // Find data from old (non-existent) windows
    const oldWindowIds = Object.keys(data)
        .map(Number)
        .filter((id) => !currentWindowIds.has(id));

    console.log(`[Workspace_active_tab_restore] Old (stale) window IDs found in storage: ${oldWindowIds.join(", ") || "none"}`);

    // Initialize current window data if needed
    if (!data[currentWindowId]) {
        data[currentWindowId] = {};
    }

    const currentWorkspaces = Object.keys(data[currentWindowId]);
    console.log(`[Workspace_active_tab_restore] Current window workspaces: ${currentWorkspaces.join(", ") || "none"}`);

    if (oldWindowIds.length > 0) {
        // Take data from the most recent old window (highest ID usually means most recent)
        const oldWindowId = Math.max(...oldWindowIds);
        const oldData = data[oldWindowId];

        console.log(`[Workspace_active_tab_restore] Selected old window ${oldWindowId} for migration`);
        console.log(`[Workspace_active_tab_restore] Old window data:`, JSON.stringify(oldData, null, 2));

        if (oldData && Object.keys(oldData).length > 0) {
            let mergedCount = 0;
            // Merge missing workspaces from old window to current window
            for (const workspaceId of Object.keys(oldData)) {
                if (!data[currentWindowId][workspaceId]) {
                    data[currentWindowId][workspaceId] = oldData[workspaceId];
                    console.log(`[Workspace_active_tab_restore] Merged workspace ${workspaceId} from old window`);
                    mergedCount++;
                } else {
                    console.log(`[Workspace_active_tab_restore] Workspace ${workspaceId} already exists in current window, skipping`);
                }
            }

            // Clean up old window data
            delete data[oldWindowId];
            await chrome.storage.local.set({ [STORAGE_KEY]: data });
            console.log(`[Workspace_active_tab_restore] Merged ${mergedCount} workspaces from window ${oldWindowId} to ${currentWindowId}`);
        } else {
            console.log(`[Workspace_active_tab_restore] Old window ${oldWindowId} had no data to migrate`);
        }

        // Also clean up other old window IDs
        for (const oldId of oldWindowIds) {
            if (oldId !== oldWindowId && data[oldId]) {
                delete data[oldId];
                console.log(`[Workspace_active_tab_restore] Cleaned up stale window data for ${oldId}`);
            }
        }
        await chrome.storage.local.set({ [STORAGE_KEY]: data });
    } else {
        console.log(`[Workspace_active_tab_restore] No old window data to migrate`);
    }

    console.log(`[Workspace_active_tab_restore] Final workspaces for current window: ${Object.keys(data[currentWindowId]).join(", ")}`);
    return data;
}

/**
 * Get and activate the last active tab for a workspace
 * Returns true if a tab was activated, false otherwise
 */
export async function activateLastActiveTabForWorkspace(windowId: number, workspaceId: string): Promise<boolean> {
    console.log(`[Workspace_active_tab_restore] activateLastActiveTabForWorkspace called - windowId: ${windowId}, workspaceId: ${workspaceId}`);

    try {
        // Migrate data from old window IDs if needed (handles browser restart)
        const data = await migrateWindowData(windowId);

        const lastActiveData = data[windowId]?.[workspaceId];
        console.log(`[Workspace_active_tab_restore] Last active data for workspace ${workspaceId}:`, JSON.stringify(lastActiveData, null, 2));

        if (!lastActiveData) {
            console.log(`[Workspace_active_tab_restore] No last active tab found for workspace ${workspaceId}`);
            return false;
        }

        console.log(`[Workspace_active_tab_restore] Attempting to activate tab ${lastActiveData.tabId} with URL: ${lastActiveData.url}`);

        // First try to activate by tabId
        try {
            const tab = await chrome.tabs.get(lastActiveData.tabId);
            console.log(`[Workspace_active_tab_restore] Tab ${lastActiveData.tabId} exists, windowId: ${tab.windowId}, expected: ${windowId}`);
            if (tab && tab.windowId === windowId) {
                await chrome.tabs.update(lastActiveData.tabId, { active: true });
                console.log(`[Workspace_active_tab_restore] SUCCESS: Activated tab ${lastActiveData.tabId} by ID for workspace ${workspaceId}`);
                return true;
            } else {
                console.log(`[Workspace_active_tab_restore] Tab ${lastActiveData.tabId} exists but in different window, trying URL fallback`);
            }
        } catch (tabError) {
            // Tab doesn't exist anymore, try to find by URL
            console.log(`[Workspace_active_tab_restore] Tab ${lastActiveData.tabId} no longer exists, trying URL fallback. Error:`, tabError);
        }

        // Fallback: find tab by URL in the same window
        const tabs = await chrome.tabs.query({ windowId });
        console.log(`[Workspace_active_tab_restore] Searching ${tabs.length} tabs in window for URL match: ${lastActiveData.url}`);

        const matchingTab = tabs.find((t) => t.url && urlsMatch(t.url, lastActiveData.url));

        if (matchingTab && matchingTab.id) {
            console.log(`[Workspace_active_tab_restore] Found matching tab by URL: id=${matchingTab.id}, url=${matchingTab.url}`);
            await chrome.tabs.update(matchingTab.id, { active: true });
            // Update stored tabId
            data[windowId][workspaceId].tabId = matchingTab.id;
            await chrome.storage.local.set({ [STORAGE_KEY]: data });
            console.log(`[Workspace_active_tab_restore] SUCCESS: Activated tab ${matchingTab.id} by URL match for workspace ${workspaceId}`);
            return true;
        }

        console.log(`[Workspace_active_tab_restore] FAILED: No matching tab found for workspace ${workspaceId}. Tabs checked:`);
        tabs.forEach((t, i) => console.log(`[Workspace_active_tab_restore]   ${i}: id=${t.id}, url=${t.url}`));
        return false;
    } catch (error) {
        console.error("[Workspace_active_tab_restore] Error activating last active tab:", error);
        return false;
    }
}

/**
 * Get the current active tab's workspace
 * Used to save the active tab when it changes
 */
export async function getCurrentTabWorkspace(tabId: number, windowId: number): Promise<string | null> {
    try {
        const tab = await chrome.tabs.get(tabId);
        if (!tab.url) return null;

        const tabOriginalUrl = extractOriginalUrl(tab.url);

        const result = await chrome.storage.local.get("workspaceAssignments");
        const workspaceAssignments = result.workspaceAssignments || {};
        const windowAssignments = workspaceAssignments[windowId] || {};

        // Check if tab is in a group assigned to a workspace
        if (tab.groupId && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
            const group = await chrome.tabGroups.get(tab.groupId);
            for (const workspaceId in windowAssignments) {
                const workspace = windowAssignments[workspaceId];
                if (workspace.groups) {
                    const matchingGroup = workspace.groups.find(
                        (g: { title: string; color: string }) => g.title === group.title && g.color === group.color
                    );
                    if (matchingGroup) {
                        return workspaceId;
                    }
                }
            }
        }

        // Check individual tab assignments
        for (const workspaceId in windowAssignments) {
            const workspace = windowAssignments[workspaceId];
            if (workspace.tabs) {
                const matchingTab = workspace.tabs.find((t: { url: string }) => urlsMatch(t.url, tabOriginalUrl));
                if (matchingTab) {
                    return workspaceId;
                }
            }
        }

        // Not assigned to any workspace = General
        return "general";
    } catch (error) {
        console.error("[Workspace ActiveTab] Error getting tab workspace:", error);
        return null;
    }
}

/**
 * Clean up data for closed windows
 * Only cleans up if browser is still running (other windows exist)
 * This prevents data loss when browser is shutting down
 */
export async function cleanupClosedWindowData(windowId: number): Promise<void> {
    try {
        // Check if browser is shutting down (no other windows exist)
        const windows = await chrome.windows.getAll();
        if (windows.length === 0) {
            // Browser is shutting down, don't clean up data
            console.log(`[Workspace ActiveTab] Browser shutting down, preserving data for window ${windowId}`);
            return;
        }

        const result = await chrome.storage.local.get(STORAGE_KEY);
        const data: LastActiveTabPerWorkspace = result[STORAGE_KEY] || {};

        if (data[windowId]) {
            delete data[windowId];
            await chrome.storage.local.set({ [STORAGE_KEY]: data });
            console.log(`[Workspace ActiveTab] Cleaned up data for closed window ${windowId}`);
        }
    } catch (error) {
        console.error("[Workspace ActiveTab] Error cleaning up closed window data:", error);
    }
}
