/**
 * Continuous sync of workspace assignments with 1-second debounce
 * This file is used by the service worker to keep workspace data up to date
 */

import { addGroupToWorkspace } from "./workspaceHandlers";
import { debouncedReorderTabsByWorkspace } from "./workspaceReorder";

let syncTimeout: NodeJS.Timeout | null = null;

/**
 * Migration lock to prevent sync from running before migration completes
 * This is critical because sync uses window IDs, which change after browser restart
 * Without this lock, sync might run with old window IDs before migration remaps them
 */
let migrationInProgress = false;
let migrationCompleted = false;
let verificationPending = false;

export function setMigrationInProgress(inProgress: boolean): void {
    migrationInProgress = inProgress;
    if (!inProgress) {
        migrationCompleted = true;
    }
    console.log(`[Workspace Sync] Migration in progress: ${inProgress}, completed: ${migrationCompleted}`);
}

export function setVerificationPending(pending: boolean): void {
    verificationPending = pending;
    console.log(`[Workspace Sync] Verification pending: ${pending}`);
}

export function isMigrationComplete(): boolean {
    return migrationCompleted;
}

export function isVerificationPending(): boolean {
    return verificationPending;
}

/**
 * Check if sync should be blocked due to pending migration or verification
 */
function shouldBlockSync(): boolean {
    // Block sync if migration is actively running
    if (migrationInProgress) {
        console.log("[Workspace Sync] Blocking sync - migration in progress");
        return true;
    }
    // Block sync if verification is pending (6-second window after migration)
    if (verificationPending) {
        console.log("[Workspace Sync] Blocking sync - verification pending");
        return true;
    }
    return false;
}

/**
 * Extract the original URL (identity function since we no longer use restore URLs)
 */
function extractOriginalUrl(url: string): string {
    return url;
}

/**
 * Check if a URL is a placeholder URL (not yet loaded)
 */
function isPlaceholderUrl(url: string | undefined): boolean {
    if (!url || url === "") return true;
    if (url === "chrome://newtab/") return true;
    if (url === "about:blank") return true;
    if (url.includes("://newtab")) return true;
    if (url.includes("://new-tab-page")) return true;
    if (url.includes("vivaldi://startpage")) return true;
    if (url.includes("vivaldi://vivaldi-webui/startpage")) return true;
    return false;
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
 * Auto-assign newly created group to the currently active workspace
 */
async function autoAssignGroupToActiveWorkspace(groupId: number, windowId: number): Promise<void> {
    try {
        // Block if migration is in progress to avoid using stale window IDs
        if (shouldBlockSync()) {
            console.log(`[Workspace Sync] Skipping auto-assignment - blocked by migration`);
            return;
        }

        // Verify the group exists and has tabs
        const groupTabs = await chrome.tabs.query({ groupId });
        if (groupTabs.length === 0) {
            console.log(`[Workspace Sync] Group ${groupId} has no tabs yet, skipping auto-assignment`);
            return;
        }

        const result = await chrome.storage.local.get(["activeWorkspacePerWindow", "enableWorkspaces"]);

        // Only auto-assign if workspaces feature is enabled
        if (!(result.enableWorkspaces ?? false)) {
            console.log(`[Workspace Sync] Workspaces disabled, skipping auto-assignment`);
            return;
        }

        const activeWorkspacePerWindow = result.activeWorkspacePerWindow || {};
        const activeWorkspaceId = activeWorkspacePerWindow[windowId] || "general";

        console.log(`[Workspace Sync] Auto-assigning group ${groupId} (${groupTabs.length} tabs) to workspace ${activeWorkspaceId}`);

        // Don't auto-assign to general workspace (it's computed dynamically)
        if (activeWorkspaceId === "general") {
            console.log(`[Workspace Sync] Active workspace is "general", skipping auto-assignment`);
            return;
        }

        // Add the group (and all its tabs) to the active workspace
        const success = await addGroupToWorkspace(groupId, activeWorkspaceId, windowId);

        if (success) {
            console.log(`[Workspace Sync] ✓ Auto-assigned group ${groupId} to workspace ${activeWorkspaceId}`);

            // Reorder tabs to maintain workspace grouping
            debouncedReorderTabsByWorkspace(windowId, "auto-assign-group");
        } else {
            console.log(`[Workspace Sync] ✗ Failed to auto-assign group ${groupId} to workspace ${activeWorkspaceId}`);
        }
    } catch (error) {
        console.error("[Workspace Sync] Error in autoAssignGroupToActiveWorkspace:", error);
    }
}

/**
 * Handle group updates (rename/recolor) to preserve workspace assignments
 */
async function handleGroupUpdate(group: chrome.tabGroups.TabGroup): Promise<void> {
    try {
        console.log(`[Workspace Sync] handleGroupUpdate called for group:`, {
            id: group.id,
            title: group.title,
            color: group.color,
            windowId: group.windowId,
        });

        const result = await chrome.storage.local.get(["workspaceAssignments", "enableWorkspaces"]);

        // Only handle if workspaces feature is enabled
        if (!(result.enableWorkspaces ?? false)) {
            console.log(`[Workspace Sync] Workspaces disabled, skipping handleGroupUpdate`);
            return;
        }

        const workspaceAssignments = result.workspaceAssignments || {};
        if (!workspaceAssignments[group.windowId]) {
            console.log(`[Workspace Sync] No workspace assignments for window ${group.windowId}`);
            return;
        }

        // Get all tabs in this group to match against stored tabUrls
        const groupTabs = await chrome.tabs.query({ groupId: group.id });
        // Extract original URLs in case tabs are suspended
        const groupTabUrls = groupTabs.map((t) => extractOriginalUrl(t.url || ""));
        console.log(`[Workspace Sync] Group has ${groupTabUrls.length} tabs:`, groupTabUrls);

        // Find which workspace contains this group by matching tabUrls
        for (const workspaceId in workspaceAssignments[group.windowId]) {
            const workspace = workspaceAssignments[group.windowId][workspaceId];

            console.log(`[Workspace Sync] Checking workspace "${workspaceId}", has ${workspace.groups.length} groups`);

            for (let i = 0; i < workspace.groups.length; i++) {
                const assignedGroup = workspace.groups[i];
                console.log(`[Workspace Sync] Comparing with stored group [${i}]:`, {
                    title: assignedGroup.title,
                    color: assignedGroup.color,
                    tabCount: assignedGroup.tabUrls.length,
                    tabUrls: assignedGroup.tabUrls,
                });

                // Match by comparing tab URLs (groups with same tabs are the same group)
                // Both groupTabUrls and assignedGroup.tabUrls now contain original URLs
                const urlsMatchResult =
                    assignedGroup.tabUrls.length === groupTabUrls.length &&
                    assignedGroup.tabUrls.every((url: string) => groupTabUrls.includes(url)) &&
                    groupTabUrls.every((url) => assignedGroup.tabUrls.includes(url));

                console.log(`[Workspace Sync] URLs match: ${urlsMatchResult}`);

                if (urlsMatchResult) {
                    // Update the group's title and color to the new values
                    // Store original URLs (already extracted above)
                    workspace.groups[i] = {
                        title: group.title || "",
                        color: group.color,
                        index: groupTabs.length > 0 ? groupTabs[0].index : assignedGroup.index,
                        tabUrls: groupTabUrls,
                    };

                    await chrome.storage.local.set({ workspaceAssignments });
                    console.log(`[Workspace Sync] ✓ Updated group in workspace ${workspaceId} - new title: "${group.title}"`);
                    return;
                }
            }
        }

        console.log(`[Workspace Sync] ⚠️ No matching group found in any workspace`);
    } catch (error) {
        console.error("Error in handleGroupUpdate:", error);
    }
}

/**
 * Debounced function to sync workspace assignments for a window
 */
export function debouncedSyncWorkspaces(windowId: number): void {
    if (syncTimeout) {
        clearTimeout(syncTimeout);
        console.log(`[Workspace Sync] Debounce reset - will sync in 1 second`);
    } else {
        console.log(`[Workspace Sync] Debounce started - will sync in 1 second`);
    }

    syncTimeout = setTimeout(() => {
        captureAndSyncWorkspace(windowId);
    }, 1000); // 1 second debounce
}

/**
 * Capture current state of tabs/groups and update workspace assignments
 * This only updates metadata (like index, tabUrls) for already-assigned items
 */
async function captureAndSyncWorkspace(windowId: number): Promise<void> {
    try {
        console.log(`[Workspace Sync] captureAndSyncWorkspace starting for window ${windowId}`);

        // Block sync if migration is in progress to avoid using stale window IDs
        if (shouldBlockSync()) {
            console.log(`[Workspace Sync] Skipping sync - blocked by migration`);
            return;
        }

        const result = await chrome.storage.local.get(["workspaceAssignments", "activeWorkspacePerWindow", "enableWorkspaces"]);

        // Only sync if workspaces feature is enabled
        if (!(result.enableWorkspaces ?? false)) {
            console.log(`[Workspace Sync] Workspaces disabled, skipping sync`);
            return;
        }

        const workspaceAssignments = result.workspaceAssignments || {};
        // const activeWorkspacePerWindow = result.activeWorkspacePerWindow || {};

        // Initialize window if needed
        if (!workspaceAssignments[windowId]) {
            workspaceAssignments[windowId] = {};
        }

        // Get all tabs and groups for this window
        const tabs = await chrome.tabs.query({ windowId });
        const groups = await chrome.tabGroups.query({ windowId });

        // Check if session restore is still in progress (many placeholder URLs)
        const placeholderCount = tabs.filter((t) => isPlaceholderUrl(t.url)).length;
        const placeholderRatio = tabs.length > 0 ? placeholderCount / tabs.length : 0;

        if (placeholderRatio > 0.3 && tabs.length > 3) {
            console.log(`[Workspace Sync] Skipping sync - session restore likely in progress`);
            console.log(`[Workspace Sync] ${placeholderCount}/${tabs.length} tabs have placeholder URLs`);
            return;
        }

        console.log(`[Workspace Sync] Found ${tabs.length} tabs and ${groups.length} groups in window`);
        console.log(
            `[Workspace Sync] Current groups in window:`,
            groups.map((g) => ({ id: g.id, title: g.title, color: g.color }))
        );
        console.log(
            `[Workspace Sync] All tabs in window:`,
            tabs.map((t) => ({ id: t.id, url: t.url, groupId: t.groupId, isUngrouped: t.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE }))
        );
        console.log(`[Workspace Sync] TAB_GROUP_ID_NONE value:`, chrome.tabGroups.TAB_GROUP_ID_NONE);

        // Update each workspace's assignments (not just the active one)
        // Skip "general" workspace as it's computed dynamically
        for (const workspaceId in workspaceAssignments[windowId]) {
            if (workspaceId === "general") {
                // General workspace should not have stored assignments - delete if present
                delete workspaceAssignments[windowId]["general"];
                continue;
            }

            const workspace = workspaceAssignments[windowId][workspaceId];
            if (!workspace) continue;

            console.log(`[Workspace Sync] Syncing workspace "${workspaceId}" - has ${workspace.groups.length} assigned groups`);

            // Update group metadata (index, tabUrls) - keep only groups that still exist
            const updatedGroups = [];
            for (const assignedGroup of workspace.groups) {
                console.log(`[Workspace Sync] Looking for assigned group:`, {
                    title: assignedGroup.title,
                    color: assignedGroup.color,
                    tabCount: assignedGroup.tabUrls.length,
                    tabUrls: assignedGroup.tabUrls,
                });

                // First, try to match by tab URLs (more reliable for renamed groups)
                let currentGroup = null;
                for (const group of groups) {
                    const groupTabs = tabs.filter((t) => t.groupId === group.id);
                    const groupTabUrls = groupTabs.map((t) => extractOriginalUrl(t.url || ""));

                    console.log(`[Workspace Sync] Checking group "${group.title}" (${group.color}):`, {
                        id: group.id,
                        tabCount: groupTabUrls.length,
                        tabUrls: groupTabUrls,
                    });

                    // Match if tab URLs are the same (handles renames/recolors)
                    // Account for restore URL format by comparing original URLs
                    const urlsMatchBidirectional =
                        assignedGroup.tabUrls.length === groupTabUrls.length &&
                        assignedGroup.tabUrls.every((url: string) => groupTabUrls.includes(url)) &&
                        groupTabUrls.every((url) => assignedGroup.tabUrls.includes(url));

                    console.log(`[Workspace Sync] URLs match (bidirectional): ${urlsMatchBidirectional}`);

                    if (urlsMatchBidirectional) {
                        currentGroup = group;
                        console.log(`[Workspace Sync] ✓ Matched by URLs!`);
                        break;
                    }
                }

                // Fallback: match by title and color (for groups that haven't been synced yet)
                if (!currentGroup) {
                    currentGroup = groups.find((g) => g.title === assignedGroup.title && g.color === assignedGroup.color);
                    if (currentGroup) {
                        console.log(`[Workspace Sync] ✓ Matched by title+color (fallback)`);
                    }
                }

                if (currentGroup) {
                    const groupTabs = tabs.filter((t) => t.groupId === currentGroup.id);
                    const firstTabIndex = groupTabs.length > 0 ? groupTabs[0].index : 0;
                    updatedGroups.push({
                        title: currentGroup.title || "",
                        color: currentGroup.color,
                        index: firstTabIndex,
                        tabUrls: groupTabs.map((t) => extractOriginalUrl(t.url || "")),
                    });
                    console.log(`[Workspace Sync] ✓ Kept group in workspace "${workspaceId}": "${currentGroup.title}"`);
                } else {
                    console.log(`[Workspace Sync] ✗ Group not found, removing from workspace "${workspaceId}"`);
                }
                // If group doesn't exist anymore, it's removed (not pushed to updatedGroups)
            }

            // Update tab metadata (index, title) - keep only tabs that still exist
            console.log(`[Workspace Sync] Syncing ${workspace.tabs.length} assigned tabs for workspace "${workspaceId}"`);
            const updatedTabs = [];
            for (const assignedTab of workspace.tabs) {
                console.log(`[Workspace Sync] Looking for assigned tab:`, {
                    url: assignedTab.url,
                    title: assignedTab.title,
                });

                // Match tabs accounting for restore URL format
                let currentTab: chrome.tabs.Tab | undefined;

                if (assignedTab.tabId != null) {
                    currentTab = tabs.find((t) => t.id === assignedTab.tabId);
                }

                if (!currentTab) {
                    currentTab = tabs.find((t) => urlsMatch(t.url || "", assignedTab.url || ""));
                }
                if (currentTab) {
                    console.log(`[Workspace Sync] ✓ Found tab:`, {
                        id: currentTab.id,
                        originalUrl: extractOriginalUrl(currentTab.url || ""),
                        currentUrl: currentTab.url,
                        assignedUrl: assignedTab.url,
                        groupId: currentTab.groupId,
                        isUngrouped: currentTab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE,
                    });
                    // Store the original URL (not the restore URL)
                    updatedTabs.push({
                        url: extractOriginalUrl(currentTab.url || ""),
                        title: currentTab.title || "",
                        index: currentTab.index,
                        tabId: currentTab.id,
                    });
                } else {
                    console.log(`[Workspace Sync] ✗ Tab not found with URL:`, assignedTab.url);
                }
                // If tab doesn't exist anymore (closed), it's removed (not pushed to updatedTabs)
            }

            workspaceAssignments[windowId][workspaceId] = {
                groups: updatedGroups,
                tabs: updatedTabs,
            };

            console.log(`[Workspace Sync] Workspace "${workspaceId}" after sync:`, {
                groupCount: updatedGroups.length,
                tabCount: updatedTabs.length,
                groups: updatedGroups.map((g) => ({ title: g.title, color: g.color })),
            });
        }

        await chrome.storage.local.set({ workspaceAssignments });
        console.log(`[Workspace Sync] ✓ Synced workspaces for window ${windowId}`);

        // Reorder tabs to maintain workspace grouping after sync
        debouncedReorderTabsByWorkspace(windowId, "after-sync");
    } catch (error) {
        console.error("Error in captureAndSyncWorkspace:", error);
    }
}

/**
 * Initialize workspace sync listeners
 * This should be called in the service worker
 */
export function initializeWorkspaceSyncListeners(): void {
    // Listen to tab events
    chrome.tabs.onCreated.addListener((tab) => {
        if (tab.windowId) debouncedSyncWorkspaces(tab.windowId);
    });

    chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
        debouncedSyncWorkspaces(removeInfo.windowId);
    });

    chrome.tabs.onMoved.addListener(async (tabId, moveInfo) => {
        // Don't trigger reorder on manual moves - this would override user's positioning
        // Reorder is only triggered when explicitly moving items TO a workspace
        // Just sync workspace data to capture the new position
        debouncedSyncWorkspaces(moveInfo.windowId);
    });

    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (tab.windowId && changeInfo.url) {
            debouncedSyncWorkspaces(tab.windowId);
        }

        // Handle tab being ungrouped - keep it in its workspace as an individual tab
        if (tab.windowId && changeInfo.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
            try {
                const result = await chrome.storage.local.get(["workspaceAssignments", "enableWorkspaces"]);

                if (!(result.enableWorkspaces ?? false) || !tab.url) return;

                const workspaceAssignments = result.workspaceAssignments || {};
                const windowAssignments = workspaceAssignments[tab.windowId] || {};

                const tabOriginalUrl = extractOriginalUrl(tab.url);
                let foundWorkspaceId: string | null = null;

                // Check if this tab's URL exists in any workspace group's tabUrls
                for (const workspaceId in windowAssignments) {
                    const workspace = windowAssignments[workspaceId];
                    if (!workspace.groups) continue;

                    for (const group of workspace.groups) {
                        if (group.tabUrls?.some((url: string) => urlsMatch(url, tabOriginalUrl))) {
                            foundWorkspaceId = workspaceId;
                            break;
                        }
                    }
                    if (foundWorkspaceId) break;
                }

                // If tab was in a workspace group, add it as an individual tab to that workspace
                if (foundWorkspaceId) {
                    if (!windowAssignments[foundWorkspaceId].tabs) {
                        windowAssignments[foundWorkspaceId].tabs = [];
                    }

                    // Check if tab already exists as individual
                    const exists = windowAssignments[foundWorkspaceId].tabs.some(
                        (t: { url: string; tabId?: number }) =>
                            (t.tabId != null && t.tabId === tab.id) || (t.tabId == null && urlsMatch(t.url, tabOriginalUrl))
                    );

                    if (!exists) {
                        // Add with high index to place at current position
                        windowAssignments[foundWorkspaceId].tabs.push({
                            url: tabOriginalUrl,
                            title: tab.title || "",
                            index: tab.index,
                            tabId: tab.id,
                        });

                        workspaceAssignments[tab.windowId] = windowAssignments;
                        await chrome.storage.local.set({ workspaceAssignments });
                        console.log(`[Workspace Sync] Tab ungrouped - kept in workspace ${foundWorkspaceId} as individual tab`);
                    }
                }
            } catch (error) {
                console.error("[Workspace Sync] Error handling ungrouped tab:", error);
            }
        }
    });

    chrome.tabs.onAttached.addListener((tabId, attachInfo) => {
        debouncedSyncWorkspaces(attachInfo.newWindowId);
    });

    chrome.tabs.onDetached.addListener((tabId, detachInfo) => {
        debouncedSyncWorkspaces(detachInfo.oldWindowId);
    });

    // Listen to tab group events
    chrome.tabGroups.onCreated.addListener(async (group) => {
        if (group.windowId) {
            // Delay auto-assignment to ensure tabs have been moved into the group
            // Chrome creates the group first, then moves tabs into it
            setTimeout(async () => {
                await autoAssignGroupToActiveWorkspace(group.id, group.windowId);
                debouncedSyncWorkspaces(group.windowId);
            }, 150); // 150ms delay to allow tabs to be grouped
        }
    });

    chrome.tabGroups.onRemoved.addListener((group) => {
        if (group.windowId) debouncedSyncWorkspaces(group.windowId);
    });

    chrome.tabGroups.onUpdated.addListener(async (group) => {
        console.log(`[Workspace Sync] tabGroups.onUpdated triggered for group:`, {
            id: group.id,
            title: group.title,
            color: group.color,
            windowId: group.windowId,
        });

        if (group.windowId) {
            // Handle group updates (rename/recolor) before syncing
            await handleGroupUpdate(group);
            debouncedSyncWorkspaces(group.windowId);
        }
    });

    chrome.tabGroups.onMoved.addListener(async (group) => {
        if (group.windowId) {
            // Don't trigger reorder on manual moves - this would override user's positioning
            // Reorder is only triggered when explicitly moving items TO a workspace
            // Just sync workspace data to capture the new position
            debouncedSyncWorkspaces(group.windowId);
        }
    });

    console.log("[Workspace Sync] Initialized workspace sync listeners");
}
