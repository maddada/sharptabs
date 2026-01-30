import { WorkspaceAssignments } from "@/types/Workspace";
import { matchRestoredItemsToWorkspaces } from "./workspaceMatcher";
import { reorderTabsByWorkspace } from "./workspaceReorder";

/**
 * Restore workspace assignments after a session restore
 */
export async function restoreWorkspaceAssignments(windowId: number, savedAssignments: WorkspaceAssignments): Promise<void> {
    try {
        console.log(`[Workspace Restore] === Starting Restoration for window ${windowId} ===`);
        console.log(`[Workspace Restore] Input savedAssignments:`, JSON.stringify(savedAssignments, null, 2));

        // DEFENSIVE CHECK #1: Don't restore if saved assignments are empty/undefined
        if (!savedAssignments || Object.keys(savedAssignments).length === 0) {
            console.warn(
                `[Workspace Restore] Skipping restore - savedAssignments is empty or undefined. This prevents overwriting existing workspace data.`
            );
            return;
        }

        // Get all tabs and groups in the restored window
        const tabs = await chrome.tabs.query({ windowId });
        const groups = await chrome.tabGroups.query({ windowId });

        console.log(`[Workspace Restore] Found ${tabs.length} tabs and ${groups.length} groups`);

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

        // Match restored items to saved workspace assignments
        const newAssignments = await matchRestoredItemsToWorkspaces(restoredTabs, restoredGroups, savedAssignments);

        // DEFENSIVE CHECK #2: Don't overwrite with empty assignments if we had valid saved assignments
        const hasValidSavedData = Object.keys(savedAssignments).some((workspaceId) => {
            const workspace = savedAssignments[workspaceId];
            return workspace && (workspace.tabs?.length > 0 || workspace.groups?.length > 0);
        });

        const hasValidNewData = Object.keys(newAssignments).some((workspaceId) => {
            const workspace = newAssignments[workspaceId];
            return workspace && (workspace.tabs?.length > 0 || workspace.groups?.length > 0);
        });

        if (hasValidSavedData && !hasValidNewData) {
            console.warn(
                `[Workspace Restore] Matching resulted in empty assignments despite having valid saved data. This may indicate a matching failure. Skipping restore to prevent data loss.`
            );
            console.warn(`[Workspace Restore] Saved assignments had data for workspaces: ${Object.keys(savedAssignments).join(", ")}`);
            return;
        }

        // Update workspace assignments in storage
        const result = await chrome.storage.local.get("workspaceAssignments");
        const workspaceAssignments = result.workspaceAssignments || {};

        console.log(`[Workspace Restore] Old workspaceAssignments for window ${windowId}:`, workspaceAssignments[windowId]);
        console.log(`[Workspace Restore] New workspaceAssignments for window ${windowId}:`, newAssignments);

        workspaceAssignments[windowId] = newAssignments;
        await chrome.storage.local.set({ workspaceAssignments });

        // Immediately reorder tabs to match restored workspace assignments (no debounce)
        // Import is now at top of file
        await reorderTabsByWorkspace(windowId, { debounce: false, reason: "session-restore" });

        console.log(`[Workspace Restore] === Restoration Complete for window ${windowId} ===`);
    } catch (error) {
        console.error("Error restoring workspace assignments:", error);
    }
}

/**
 * Set active workspace for a window after session restore
 */
export async function restoreActiveWorkspace(windowId: number, workspaceId: string): Promise<void> {
    try {
        const result = await chrome.storage.local.get("activeWorkspacePerWindow");
        const activeWorkspacePerWindow = result.activeWorkspacePerWindow || {};

        activeWorkspacePerWindow[windowId] = workspaceId;
        await chrome.storage.local.set({ activeWorkspacePerWindow });

        console.log(`[Workspace Restore] Set active workspace to ${workspaceId} for window ${windowId}`);
    } catch (error) {
        console.error("Error restoring active workspace:", error);
    }
}
