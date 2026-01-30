export async function handleSwitchToWorkspace(tab: chrome.tabs.Tab, workspaceNumber: number) {
    if (!tab.windowId) return;

    try {
        // Get workspaces from storage
        const result = await chrome.storage.local.get(["workspaces", "activeWorkspacePerWindow", "enableWorkspaces"]);

        // Check if workspaces feature is enabled
        if (!(result.enableWorkspaces ?? false)) {
            console.log("Workspaces feature is not enabled");
            return;
        }

        const workspaces = result.workspaces || [];

        // Get the workspace at the specified index (0-based, so subtract 1)
        const targetWorkspace = workspaces[workspaceNumber - 1];

        if (!targetWorkspace) {
            console.log(`Workspace ${workspaceNumber} does not exist`);
            return;
        }

        // Update active workspace for current window
        const activeWorkspacePerWindow = result.activeWorkspacePerWindow || {};
        activeWorkspacePerWindow[tab.windowId] = targetWorkspace.id;
        await chrome.storage.local.set({ activeWorkspacePerWindow });

        console.log(`Switched to workspace: ${targetWorkspace.name}`);

        // Notify the UI to update (if sidepanel is open)
        try {
            await chrome.runtime.sendMessage({
                type: "WORKSPACE_SWITCHED",
                workspaceId: targetWorkspace.id,
                windowId: tab.windowId,
            });
        } catch (error) {
            // Sidepanel might not be open, that's okay
            console.error("Error sending workspace switched message:", error);
        }
    } catch (error) {
        console.error("Error switching workspace:", error);
    }
}
