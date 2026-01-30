import { WorkspaceAssignments } from "@/types/Workspace";

/**
 * Match restored tabs/groups to saved workspace assignments after browser restart
 * Uses fuzzy matching based on title, color, url, and index
 */

interface RestoredTab {
    id: number;
    url: string;
    title?: string;
    index: number;
    groupId: number;
}

interface RestoredGroup {
    id: number;
    title?: string;
    color: string;
}

/**
 * Extract the original URL (identity function since we no longer use restore URLs)
 */
export function extractOriginalUrl(url: string): string {
    return url;
}

/**
 * Compare two URLs, accounting for restore URL format
 */
export function urlsMatch(url1: string, url2: string): boolean {
    const original1 = extractOriginalUrl(url1);
    const original2 = extractOriginalUrl(url2);
    return original1 === original2;
}

/**
 * Match restored tabs and groups to workspace assignments
 * Returns new workspace assignments with updated tab/group info
 */
export async function matchRestoredItemsToWorkspaces(
    restoredTabs: RestoredTab[],
    restoredGroups: RestoredGroup[],
    savedAssignments: WorkspaceAssignments
): Promise<WorkspaceAssignments> {
    console.log("[Workspace Matcher] === Starting Matching Process ===");
    console.log("[Workspace Matcher] Saved assignments:", JSON.stringify(savedAssignments, null, 2));
    console.log(
        "[Workspace Matcher] Restored tabs:",
        restoredTabs.map((t) => ({
            id: t.id,
            url: t.url,
            title: t.title,
            groupId: t.groupId,
            isUngrouped: t.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE,
        }))
    );
    console.log("[Workspace Matcher] Restored groups:", restoredGroups);
    console.log("[Workspace Matcher] TAB_GROUP_ID_NONE value:", chrome.tabGroups.TAB_GROUP_ID_NONE);

    const newAssignments: WorkspaceAssignments = {};

    for (const [workspaceId, assignment] of Object.entries(savedAssignments)) {
        // Skip "general" workspace as it's computed dynamically
        if (workspaceId === "general") {
            console.log("[Workspace Matcher] Skipping general workspace");
            continue;
        }

        console.log(`[Workspace Matcher] Processing workspace: ${workspaceId}`);
        console.log(`[Workspace Matcher] Saved tabs for ${workspaceId}:`, assignment.tabs);
        console.log(`[Workspace Matcher] Saved groups for ${workspaceId}:`, assignment.groups);

        newAssignments[workspaceId] = {
            groups: [],
            tabs: [],
        };

        // Match groups by title + color
        for (const savedGroup of assignment.groups) {
            // Exact match: title + color
            const matchedGroup = restoredGroups.find((g) => g.title === savedGroup.title && g.color === savedGroup.color);

            if (matchedGroup) {
                // Get tabs in this group
                const groupTabs = restoredTabs.filter((t) => t.groupId === matchedGroup.id);

                newAssignments[workspaceId].groups.push({
                    title: savedGroup.title,
                    color: savedGroup.color,
                    index: groupTabs.length > 0 ? groupTabs[0].index : savedGroup.index,
                    tabUrls: groupTabs.map((t) => extractOriginalUrl(t.url)),
                });
            }
        }

        // Match tabs by URL (only ungrouped tabs)
        for (const savedTab of assignment.tabs) {
            console.log(`[Workspace Matcher] Trying to match saved tab:`, savedTab);

            // Exact match by URL, but only for tabs that are NOT in a group
            // Account for restore URL format
            const matchedTab = restoredTabs.find((t) => urlsMatch(t.url, savedTab.url) && t.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE);

            if (matchedTab) {
                console.log(`[Workspace Matcher] ✓ Matched tab:`, {
                    id: matchedTab.id,
                    originalUrl: extractOriginalUrl(matchedTab.url),
                    restoreUrl: matchedTab.url,
                    savedUrl: savedTab.url,
                });
                // Store the original URL (not the restore URL)
                newAssignments[workspaceId].tabs.push({
                    url: extractOriginalUrl(matchedTab.url),
                    title: matchedTab.title || savedTab.title,
                    index: matchedTab.index,
                });
            } else {
                console.log(`[Workspace Matcher] ✗ No match found for tab URL: ${savedTab.url}`);
                // Check if URL exists at all (accounting for restore URL format)
                const tabWithUrl = restoredTabs.find((t) => urlsMatch(t.url, savedTab.url));
                if (tabWithUrl) {
                    console.log(
                        `[Workspace Matcher]   URL exists but groupId is ${tabWithUrl.groupId} (expected ${chrome.tabGroups.TAB_GROUP_ID_NONE})`
                    );
                } else {
                    console.log(`[Workspace Matcher]   URL not found in any restored tab`);
                }
            }
        }
    }

    console.log("[Workspace Matcher] === Matching Complete ===");
    console.log("[Workspace Matcher] New assignments:", JSON.stringify(newAssignments, null, 2));
    return newAssignments;
}

/**
 * Rebuild workspace assignments from current window state
 */
export async function rebuildWorkspaceAssignments(windowId: number, savedAssignments: WorkspaceAssignments): Promise<WorkspaceAssignments> {
    try {
        const tabs = await chrome.tabs.query({ windowId });
        const groups = await chrome.tabGroups.query({ windowId });

        const restoredTabs = tabs.map((t) => ({
            id: t.id ?? 0,
            url: t.url || "",
            title: t.title,
            index: t.index,
            groupId: t.groupId,
        }));

        const restoredGroups = groups.map((g) => ({
            id: g.id ?? 0,
            title: g.title,
            color: g.color,
        }));

        return matchRestoredItemsToWorkspaces(restoredTabs, restoredGroups, savedAssignments);
    } catch (error) {
        console.error("Error rebuilding workspace assignments:", error);
        return {};
    }
}
