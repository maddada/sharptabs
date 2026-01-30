import { Tab } from "@/types/Tab";
import { extractOriginalUrl, urlsMatch } from "@/utils/workspaces/workspaceMatcher";

/**
 * Sync grouped tabs with their parent group's workspace assignment
 * This ensures that grouped tabs are always in the same workspace as their parent group
 */
export const syncGroupedTabsWithWorkspaces = async (groupsWithTabs: Array<{ id: number; title: string; color: string; tabs: Tab[] }>) => {
    try {
        const currentWindow = await chrome.windows.getCurrent();
        if (!currentWindow.id) return;

        const result = await chrome.storage.local.get("workspaceAssignments");
        const workspaceAssignments = result.workspaceAssignments || {};
        const windowAssignments = workspaceAssignments[currentWindow.id] || {};

        let hasChanges = false;

        // For each workspace
        for (const workspaceId in windowAssignments) {
            const workspace = windowAssignments[workspaceId];
            if (!workspace.groups) continue;

            // For each group in this workspace
            for (const assignedGroup of workspace.groups) {
                // Find the matching group in the current window
                const matchingGroup = groupsWithTabs.find((g) => g.title === assignedGroup.title && g.color === assignedGroup.color);

                if (matchingGroup && matchingGroup.tabs.length > 0) {
                    // Remove individual tab entries for tabs that are in this group
                    // Groups should be tracked via the groups array, not individual tabs
                    for (const tab of matchingGroup.tabs) {
                        if (!tab.url) continue;

                        const tabOriginalUrl = extractOriginalUrl(tab.url);

                        // Remove this tab from ALL workspaces' individual tabs arrays
                        // (including this workspace, since it's tracked via the group)
                        for (const wsId in windowAssignments) {
                            const ws = windowAssignments[wsId];
                            if (!ws.tabs) continue;

                            const originalLength = ws.tabs.length;
                            ws.tabs = ws.tabs.filter((t: any) => !urlsMatch(t.url, tabOriginalUrl));

                            if (ws.tabs.length !== originalLength) {
                                hasChanges = true;
                                console.log(
                                    `[LoadTabs] Removed grouped tab "${tab.title}" from workspace ${wsId} individual tabs (tracked via group instead)`
                                );
                            }
                        }
                    }

                    // Also update the group's tabUrls to match current tabs
                    const currentTabUrls = matchingGroup.tabs.map((t: any) => extractOriginalUrl(t.url)).filter(Boolean);
                    const storedTabUrls = assignedGroup.tabUrls || [];

                    // Check if the arrays are different
                    if (currentTabUrls.length !== storedTabUrls.length || !currentTabUrls.every((url, i) => urlsMatch(url, storedTabUrls[i]))) {
                        assignedGroup.tabUrls = currentTabUrls;
                        hasChanges = true;
                        console.log(`[LoadTabs] Updated tabUrls for group "${assignedGroup.title}" in workspace ${workspaceId}`);
                    }
                }
            }
        }

        // Save changes if any were made
        if (hasChanges) {
            workspaceAssignments[currentWindow.id] = windowAssignments;
            await chrome.storage.local.set({ workspaceAssignments });
            console.log("[LoadTabs] Workspace assignments synced successfully");
        }
    } catch (error) {
        console.error("[LoadTabs] Error syncing grouped tabs with workspaces:", error);
    }
};
