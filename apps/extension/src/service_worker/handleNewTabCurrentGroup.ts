import { createNewTab } from "@/utils/tabs/createNewTab";

export async function handleNewTabCurrentGroup(tab: chrome.tabs.Tab) {
    try {
        const activeWorkspaceResult = await chrome.storage.local.get("activeWorkspacePerWindow");
        const activeWorkspaceId = activeWorkspaceResult.activeWorkspacePerWindow?.[tab.windowId ?? 0];
        const workspaceOverride = activeWorkspaceId || undefined;
        if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
            const tabs = await chrome.tabs.query({ currentWindow: true });
            const groupTabs = tabs.filter((t) => t.groupId === tab.groupId);
            if (groupTabs.length > 0) {
                // create a tab at the end of this group
                const newTab = await createNewTab(
                    {
                        index: groupTabs[groupTabs.length - 1].index + 1,
                        active: true,
                    },
                    { workspaceId: workspaceOverride }
                );
                // move the new tab to this group
                if (newTab.id != null) {
                    await chrome.tabs.group({
                        tabIds: [newTab.id],
                        groupId: tab.groupId,
                    });
                }
            }
        } else {
            // create tab at the end of the window because this tab isn't in a group
            createNewTab({ windowId: tab.windowId, active: true }, { workspaceId: workspaceOverride });
        }
    } catch (error) {
        console.log("Error duplicating tab:", error);
    }
}
