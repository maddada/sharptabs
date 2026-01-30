/**
 * Workspace Diagnostics Utility
 * Exports comprehensive workspace state for debugging
 */

import type { WorkspaceDefinition } from "../../types/Workspace";
import { urlsMatch } from "./workspaceMatcher";

export interface WorkspaceDiagnostics {
    timestamp: string;
    windows: WindowDiagnostics[];
    workspaceDefinitions: WorkspaceDefinition[];
    workspaceAssignments: Record<number, any>;
    activeWorkspacePerWindow: Record<number, string>;
}

export interface WindowDiagnostics {
    windowId: number;
    activeWorkspace: string;
    chromeTabs: ChromeTabInfo[];
    chromeTabGroups: ChromeTabGroupInfo[];
    assignedTabs: AssignedItemInfo[];
    assignedGroups: AssignedItemInfo[];
    unassignedTabs: ChromeTabInfo[];
}

export interface ChromeTabInfo {
    id: number;
    url: string;
    title: string;
    index: number;
    groupId: number;
    pinned: boolean;
    active: boolean;
    windowId: number;
    status?: string;
}

export interface ChromeTabGroupInfo {
    id: number;
    title?: string;
    color: chrome.tabGroups.ColorEnum;
    collapsed: boolean;
    windowId: number;
}

export interface AssignedItemInfo {
    workspaceId: string;
    workspaceName: string;
    type: "tab" | "group";
    chromeId?: number;
    storedData: any;
    matchedChromeItem?: any;
}

/**
 * Gathers comprehensive workspace diagnostics
 */
export async function gatherWorkspaceDiagnostics(): Promise<WorkspaceDiagnostics> {
    // Get all storage data
    const storageData = await chrome.storage.local.get(["workspaces", "workspaceAssignments", "activeWorkspacePerWindow"]);

    const workspaces: WorkspaceDefinition[] = storageData.workspaces || [];
    const workspaceAssignments = storageData.workspaceAssignments || {};
    const activeWorkspacePerWindow = storageData.activeWorkspacePerWindow || {};

    // Get all windows
    const windows = await chrome.windows.getAll();

    // Build diagnostics for each window
    const windowDiagnostics: WindowDiagnostics[] = [];

    for (const window of windows) {
        const windowId = window.id ?? 0;

        // Get all tabs in this window
        const chromeTabs = await chrome.tabs.query({ windowId });
        const chromeTabsInfo: ChromeTabInfo[] = chromeTabs.map((tab) => ({
            id: tab.id ?? 0,
            url: tab.url || "",
            title: tab.title || "",
            index: tab.index,
            groupId: tab.groupId,
            pinned: tab.pinned,
            active: tab.active,
            windowId: tab.windowId ?? 0,
            status: tab.status,
        }));

        // Get all tab groups in this window
        const chromeTabGroups = await chrome.tabGroups.query({ windowId });
        const chromeTabGroupsInfo: ChromeTabGroupInfo[] = chromeTabGroups.map((group) => ({
            id: group.id,
            title: group.title,
            color: group.color,
            collapsed: group.collapsed,
            windowId: group.windowId ?? 0,
        }));

        // Get workspace assignments for this window
        const windowAssignments = workspaceAssignments[windowId] || {};

        // Build assigned items info
        const assignedTabs: AssignedItemInfo[] = [];
        const assignedGroups: AssignedItemInfo[] = [];

        for (const [workspaceId, assignment] of Object.entries(windowAssignments)) {
            const workspace = workspaces.find((w) => w.id === workspaceId);
            const workspaceName = workspace?.name || "Unknown";

            // Type guard for assignment
            if (!assignment || typeof assignment !== "object") continue;
            const typedAssignment = assignment as { tabs?: any[]; groups?: any[] };

            // Process assigned tabs
            if (typedAssignment.tabs && Array.isArray(typedAssignment.tabs)) {
                for (const tabAssignment of typedAssignment.tabs) {
                    // Use urlsMatch to account for suspended/restore tabs
                    const matchedTab = chromeTabs.find((t) => urlsMatch(t.url || "", tabAssignment.url || ""));

                    assignedTabs.push({
                        workspaceId,
                        workspaceName,
                        type: "tab",
                        chromeId: matchedTab?.id,
                        storedData: tabAssignment,
                        matchedChromeItem: matchedTab
                            ? {
                                  id: matchedTab.id,
                                  url: matchedTab.url,
                                  title: matchedTab.title,
                                  index: matchedTab.index,
                                  groupId: matchedTab.groupId,
                              }
                            : null,
                    });
                }
            }

            // Process assigned groups
            if (typedAssignment.groups && Array.isArray(typedAssignment.groups)) {
                for (const groupAssignment of typedAssignment.groups) {
                    const matchedGroup = chromeTabGroups.find((g) => g.title === groupAssignment.title && g.color === groupAssignment.color);

                    assignedGroups.push({
                        workspaceId,
                        workspaceName,
                        type: "group",
                        chromeId: matchedGroup?.id,
                        storedData: groupAssignment,
                        matchedChromeItem: matchedGroup
                            ? {
                                  id: matchedGroup.id,
                                  title: matchedGroup.title,
                                  color: matchedGroup.color,
                                  collapsed: matchedGroup.collapsed,
                              }
                            : null,
                    });
                }
            }
        }

        // Find unassigned tabs (tabs not in any workspace)
        // Use urlsMatch to handle suspended tabs properly
        const unassignedTabs = chromeTabsInfo.filter((tab) => !assignedTabs.some((at) => urlsMatch(tab.url, at.storedData.url)));

        windowDiagnostics.push({
            windowId,
            activeWorkspace: activeWorkspacePerWindow[windowId] || "general",
            chromeTabs: chromeTabsInfo,
            chromeTabGroups: chromeTabGroupsInfo,
            assignedTabs,
            assignedGroups,
            unassignedTabs,
        });
    }

    return {
        timestamp: new Date().toISOString(),
        windows: windowDiagnostics,
        workspaceDefinitions: workspaces,
        workspaceAssignments,
        activeWorkspacePerWindow,
    };
}

/**
 * Exports diagnostics as a downloadable JSON file
 */
export async function exportWorkspaceDiagnostics(): Promise<void> {
    const diagnostics = await gatherWorkspaceDiagnostics();

    const blob = new Blob([JSON.stringify(diagnostics, null, 2)], { type: "application/json" });

    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `workspace-diagnostics-${timestamp}.json`;

    // Download the file
    await chrome.downloads.download({
        url,
        filename,
        saveAs: true,
    });

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Logs diagnostics to console (for service worker debugging)
 */
export async function logWorkspaceDiagnostics(): Promise<void> {
    const diagnostics = await gatherWorkspaceDiagnostics();
    console.log("=== WORKSPACE DIAGNOSTICS ===");
    console.log(JSON.stringify(diagnostics, null, 2));
    console.log("=== END DIAGNOSTICS ===");
}

/**
 * Clean Google search URLs by removing tracking parameters
 */
function cleanGoogleSearchUrl(url: string): string {
    try {
        const urlObj = new URL(url);

        // Only process Google search URLs
        if (!urlObj.hostname.includes("google.com") || !urlObj.pathname.includes("/search")) {
            return url;
        }

        // Get the search query parameters we want to keep
        const q = urlObj.searchParams.get("q");
        const oq = urlObj.searchParams.get("oq");

        // Create a new URL with only the parameters we want
        const cleanUrl = new URL(urlObj.origin + urlObj.pathname);
        if (q) cleanUrl.searchParams.set("q", q);
        if (oq) cleanUrl.searchParams.set("oq", oq);

        return cleanUrl.toString();
    } catch {
        // If URL parsing fails, return original
        return url;
    }
}

/**
 * Exports workspace structure in YAML format
 */
export async function exportWorkspaceStructureAsYAML(): Promise<string> {
    // Get all storage data
    const storageData = await chrome.storage.local.get(["workspaces", "workspaceAssignments", "activeWorkspacePerWindow"]);

    const workspaces: WorkspaceDefinition[] = storageData.workspaces || [];
    const workspaceAssignments = storageData.workspaceAssignments || {};

    // Get all windows
    const windows = await chrome.windows.getAll();

    let yaml = "TABS STRUCTURE:\n";

    for (const window of windows) {
        const windowId = window.id ?? 0;

        // Get all tabs in this window
        const chromeTabs = await chrome.tabs.query({ windowId });
        const chromeTabGroups = await chrome.tabGroups.query({ windowId });

        // Sort tabs by index
        chromeTabs.sort((a, b) => a.index - b.index);

        // Get workspace assignments for this window
        const windowAssignments = workspaceAssignments[windowId] || {};

        // Create a map of group IDs to workspace IDs (do this first)
        const groupIdToWorkspace = new Map<number, string>();
        for (const [workspaceId, assignment] of Object.entries(windowAssignments)) {
            const typedAssignment = assignment as { tabs?: any[]; groups?: any[] };
            if (typedAssignment.groups && Array.isArray(typedAssignment.groups)) {
                for (const groupAssignment of typedAssignment.groups) {
                    const matchedGroup = chromeTabGroups.find((g) => g.title === groupAssignment.title && g.color === groupAssignment.color);
                    if (matchedGroup) {
                        groupIdToWorkspace.set(matchedGroup.id, workspaceId);
                    }
                }
            }
        }

        // Create a map of tab URLs to workspace IDs
        // Check both direct tab assignments AND group assignments
        const tabUrlToWorkspace = new Map<string, string>();

        // First, add tabs that are directly assigned to workspaces
        for (const [workspaceId, assignment] of Object.entries(windowAssignments)) {
            const typedAssignment = assignment as { tabs?: any[]; groups?: any[] };
            if (typedAssignment.tabs && Array.isArray(typedAssignment.tabs)) {
                for (const tabAssignment of typedAssignment.tabs) {
                    // Use urlsMatch to handle suspended tabs
                    const matchedTab = chromeTabs.find((t) => urlsMatch(t.url || "", tabAssignment.url || ""));
                    if (matchedTab) {
                        tabUrlToWorkspace.set(matchedTab.url || "", workspaceId);
                    }
                }
            }
        }

        // Then, add tabs that belong to groups assigned to workspaces
        for (const tab of chromeTabs) {
            // Skip if already directly assigned
            if (tabUrlToWorkspace.has(tab.url || "")) continue;

            // Check if this tab's group is assigned to a workspace
            if (tab.groupId !== -1) {
                const workspaceId = groupIdToWorkspace.get(tab.groupId);
                if (workspaceId) {
                    console.log(`[Export Structure] Assigning tab "${tab.title}" (groupId: ${tab.groupId}) to workspace: ${workspaceId}`);
                    tabUrlToWorkspace.set(tab.url || "", workspaceId);
                }
            }
        }

        console.log("[Export Structure] groupIdToWorkspace:", Array.from(groupIdToWorkspace.entries()));
        console.log(
            "[Export Structure] tabUrlToWorkspace:",
            Array.from(tabUrlToWorkspace.entries()).map(([url, ws]) => [url.substring(0, 50), ws])
        );

        // Get all workspace IDs (including general)
        const allWorkspaceIds = new Set<string>(["general"]);
        workspaces.forEach((w) => allWorkspaceIds.add(w.id));

        // Process each workspace
        for (const workspaceId of allWorkspaceIds) {
            const workspace = workspaces.find((w) => w.id === workspaceId);
            const workspaceName = workspace ? workspace.name : "General";

            yaml += `  ${workspaceName} (${workspaceId}):\n`;

            // Get tabs for this workspace
            const workspaceTabs = chromeTabs.filter((tab) => {
                const tabWorkspaceId = tabUrlToWorkspace.get(tab.url || "");
                return workspaceId === "general" ? !tabWorkspaceId || tabWorkspaceId === "general" : tabWorkspaceId === workspaceId;
            });

            if (workspaceTabs.length === 0) {
                yaml += `    (no tabs)\n`;
                continue;
            }

            // Separate pinned tabs
            const pinnedTabs = workspaceTabs.filter((t) => t.pinned);
            const unpinnedTabs = workspaceTabs.filter((t) => !t.pinned);

            // Add pinned tabs first
            for (const tab of pinnedTabs) {
                const title = tab.title || "Untitled";
                const url = cleanGoogleSearchUrl(tab.url || "");
                yaml += `    [PINNED] ${title} -- ${url}\n`;
            }

            // Process unpinned tabs
            // Group tabs by their group ID
            const tabsByGroup = new Map<number, chrome.tabs.Tab[]>();
            const ungroupedTabs: chrome.tabs.Tab[] = [];

            for (const tab of unpinnedTabs) {
                if (tab.groupId === -1) {
                    ungroupedTabs.push(tab);
                } else {
                    if (!tabsByGroup.has(tab.groupId)) {
                        tabsByGroup.set(tab.groupId, []);
                    }
                    tabsByGroup.get(tab.groupId)!.push(tab);
                }
            }

            // Interleave ungrouped tabs and groups based on their position
            const processedItems = new Set<number>();

            for (const tab of unpinnedTabs) {
                if (processedItems.has(tab.index)) continue;

                if (tab.groupId === -1) {
                    // Add ungrouped tab
                    const title = tab.title || "Untitled";
                    const url = cleanGoogleSearchUrl(tab.url || "");
                    yaml += `    ${title} -- ${url}\n`;
                    processedItems.add(tab.index);
                } else {
                    // Add group and all its tabs
                    const groupTabs = tabsByGroup.get(tab.groupId);
                    if (groupTabs && groupTabs.length > 0) {
                        const group = chromeTabGroups.find((g) => g.id === tab.groupId);
                        if (group) {
                            const groupTitle = group.title || "Untitled Group";
                            const groupColor = group.color;
                            yaml += `    [GROUP] ${groupTitle} (${groupColor})\n`;

                            for (const groupTab of groupTabs) {
                                const title = groupTab.title || "Untitled";
                                const url = cleanGoogleSearchUrl(groupTab.url || "");
                                yaml += `      ${title} -- ${url}\n`;
                                processedItems.add(groupTab.index);
                            }
                        }
                    }
                }
            }
        }
    }

    return yaml;
}
