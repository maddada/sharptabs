import { useSettingsStore } from "@/stores/settingsStore";
import { useTabManagerStore } from "@/stores/tabManagerStore";
import { addTabToWorkspace } from "@/utils/workspaces/workspaceHandlers";

interface CreateNewTabOptions {
    workspaceId?: string;
}

/**
 * Creates a new tab with the appropriate URL based on user settings.
 * This is a drop-in replacement for chrome.tabs.create() that respects the new tab setting.
 */
export async function createNewTab(createProperties: chrome.tabs.CreateProperties = {}, options: CreateNewTabOptions = {}): Promise<chrome.tabs.Tab> {
    const newTabLink = useSettingsStore.getState().settings.newTabLink;
    const updateSetting = useSettingsStore.getState().updateSetting;
    const isVivaldi = useTabManagerStore.getState().isVivaldi;
    const enableWorkspaces = useSettingsStore.getState().settings.enableWorkspaces;

    if (newTabLink === "" && !isVivaldi) {
        updateSetting("newTabLink", "chrome://newtab");
    } else if (newTabLink === "" && isVivaldi) {
        updateSetting("newTabLink", "chrome://vivaldi-webui/startpage?section=Speed-dials&background-color=#1f1f1f");
    }

    if (newTabLink) {
        createProperties.url = newTabLink;
    }

    const newTab = await chrome.tabs.create(createProperties);

    // If workspaces are enabled, add the new tab to the active workspace
    if (enableWorkspaces && newTab.id && newTab.windowId) {
        try {
            // Get active workspace for this window
            const activeWorkspaceOverride = options.workspaceId;
            const result = await chrome.storage.local.get("activeWorkspacePerWindow");
            const activeWorkspacePerWindow = result.activeWorkspacePerWindow || {};
            const activeWorkspaceId = activeWorkspaceOverride ?? activeWorkspacePerWindow[newTab.windowId];

            // Only add to workspace if it's not the "general" workspace
            // (tabs in general workspace are just unassigned)
            if (activeWorkspaceId && activeWorkspaceId !== "general") {
                // Small delay to ensure tab is fully created before assigning
                setTimeout(async () => {
                    await addTabToWorkspace(newTab.id ?? 0, activeWorkspaceId, newTab.windowId ?? 0, {
                        skipUrlDeduplication: true,
                    });
                }, 100);
            }
        } catch (error) {
            console.error("Error adding new tab to workspace:", error);
        }
    }

    return newTab;
}
