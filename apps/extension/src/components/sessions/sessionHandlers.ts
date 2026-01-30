import { SavedSession } from "@/types/SavedSession";
import { Tab } from "@/types/Tab";
import { TabGroup } from "@/types/TabGroup";
import { chromeTabsGroup } from "@/utils/tabs/chromeTabsGroup";
import { useSettingsStore } from "@/stores/settingsStore";
import { toast } from "sonner";
import { useTabManagerStore } from "@/stores/tabManagerStore";
import { restoreWorkspaceAssignments, restoreActiveWorkspace } from "@/utils/workspaces/workspaceRestore";

const sessionToastOptions = {
    position: "top-center",
    closeButton: false,
} as const;

export const handleSaveSession = async () => {
    try {
        // Send message to service worker to save all windows
        const response = await chrome.runtime.sendMessage({ type: "SAVE_ALL_SESSIONS" });

        // Check if response is undefined (service worker not responding)
        if (!response) {
            throw new Error("No response from service worker. The service worker may not be running.");
        }

        if (response.success) {
            console.log("Save operation initiated successfully");
            toast.info("Saving sessions...", sessionToastOptions);

            // Wait a moment for the background save to complete, then refresh
            setTimeout(async () => {
                toast.success("All windows saved successfully!\n (Identical windows are ignored)", sessionToastOptions);
            }, 1000);
        } else {
            throw new Error(response.error || "Unknown error occurred");
        }
    } catch (error) {
        console.log("Error saving windows:", error);
        toast.error("Error saving windows. \n" + error, sessionToastOptions);
    }
};

export const handleDeleteSession = async (timestampToDelete: number, setSavedSessions: (sessions: SavedSession[]) => void) => {
    try {
        const result = await chrome.storage.local.get({ savedSessions: [] });
        const updatedSessions = (result.savedSessions as SavedSession[]).filter((session) => session.timestamp !== timestampToDelete);
        await chrome.storage.local.set({ savedSessions: updatedSessions });
        setSavedSessions(updatedSessions); // Update local state
        console.log("Session deleted successfully:", timestampToDelete);
    } catch (error) {
        console.log("Error deleting session:", error);
    }
};

// Helper sleep function
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// New, more robust session restore function
export const handleRestoreSession = async (sessionToRestore: SavedSession, setIsRestoreDialogOpen: (isOpen: boolean) => void) => {
    setIsRestoreDialogOpen(false);

    const { inPopup } = useTabManagerStore.getState();
    if (inPopup) {
        toast.error("Please open the sidebar to restore full sessions or groups", sessionToastOptions);
        return;
    }

    // Get current settings
    const { settings } = useSettingsStore.getState();
    const sleepDelay = settings.slowerRestoration ? 150 : 20;

    try {
        // 1. Create a new window
        const newWindow = await chrome.windows.create({});
        const newWindowId = newWindow.id;

        if (!newWindowId) {
            throw new Error("Failed to create a new window.");
        }

        // Get the ID of the default blank tab created with the window
        const initialTab = newWindow.tabs?.[0];

        const createdTabIds: number[] = []; // To store IDs of tabs created before grouping

        // 2. Restore pinned tabs
        for (const tab of sessionToRestore.pinnedTabs) {
            try {
                const restoreUrl = tab.url;
                const createdTab = await chrome.tabs.create({
                    windowId: newWindowId,
                    url: restoreUrl,
                    active: false,
                });
                // Pin the tab after creation
                if (createdTab.id) {
                    chrome.runtime.sendMessage({
                        type: "PIN_TAB",
                        tabId: createdTab.id,
                        windowId: newWindowId,
                    });
                }
            } catch (error) {
                console.log(`Error restoring pinned tab: ${tab.url}`, error);
            }
        }

        // 3. Restore tab groups, one by one, with 2s wait between
        for (const group of sessionToRestore.tabGroups) {
            try {
                if (!group.tabs || group.tabs.length === 0) continue;
                const tabIdsForGroup: number[] = [];
                for (const tab of group.tabs) {
                    try {
                        await sleep(sleepDelay);
                        const restoreUrl = tab.url;
                        const createdTab = await chrome.tabs.create({
                            windowId: newWindowId,
                            url: restoreUrl,
                            active: false,
                        });
                        if (createdTab.id) {
                            tabIdsForGroup.push(createdTab.id);
                        }
                    } catch (error) {
                        console.log(`Error creating tab for group ${group.title}: ${tab.url}`, error);
                    }
                }
                if (tabIdsForGroup.length > 0) {
                    try {
                        await sleep(sleepDelay);
                        const newGroupId = await chromeTabsGroup(tabIdsForGroup, { windowId: newWindowId });
                        await sleep(sleepDelay);
                        await chrome.tabGroups.update(newGroupId, {
                            title: group.title,
                            color: group.color,
                        });
                    } catch (error) {
                        console.log(`Error creating or updating tab group: ${group.title}`, error);
                    }
                }
            } catch (error) {
                console.log(`Error restoring group: ${group.title}`, error);
            }
        }

        // 4. Restore regular tabs, one by one, with a wait between
        for (const tab of sessionToRestore.regularTabs) {
            try {
                const restoreUrl = tab.url;
                await chrome.tabs.create({
                    windowId: newWindowId,
                    url: restoreUrl,
                    active: false,
                });
                await sleep(sleepDelay); // Wait between regular tabs
            } catch (error) {
                console.log(`Error restoring regular tab: ${tab.url}`, error);
            }
        }

        // 5. Close the initial blank tab if it still exists and wasn't part of the restored session
        if (initialTab?.id && !createdTabIds.includes(initialTab.id)) {
            // Check if the tab still exists before trying to remove it
            try {
                await chrome.tabs.get(initialTab.id); // Check existence
                await chrome.tabs.remove(initialTab.id);
            } catch (error) {
                // Tab might have been closed already or never existed, ignore error
                console.info("[Session Handler] Initial tab likely already closed or invalid.", error);
            }
        }

        // 6. Restore workspace assignments if they exist in the session
        console.log("[Session Handler] Checking workspace restoration conditions:", {
            hasWorkspaceAssignments: !!sessionToRestore.workspaceAssignments,
            newWindowId: newWindowId,
            workspaceAssignmentsKeys: sessionToRestore.workspaceAssignments ? Object.keys(sessionToRestore.workspaceAssignments) : [],
        });

        if (sessionToRestore.workspaceAssignments && newWindowId) {
            console.log("[Session Handler] ✓ Conditions met, calling restoreWorkspaceAssignments");
            try {
                await restoreWorkspaceAssignments(newWindowId, sessionToRestore.workspaceAssignments);

                // Restore active workspace if it was saved
                if (sessionToRestore.activeWorkspace) {
                    await restoreActiveWorkspace(newWindowId, sessionToRestore.activeWorkspace);
                }

                console.log("[Session Restore] Workspace data restored successfully");
            } catch (error) {
                console.error("[Session Restore] Error restoring workspace data:", error);
                // Don't throw error - session restoration should still succeed even if workspace restore fails
            }
        } else {
            console.log("[Session Handler] ✗ Workspace restoration skipped");
        }
    } catch (error) {
        console.log("Error in handleRestoreSession2:", error);
        toast.error(`Failed to restore session: ${error instanceof Error ? error.message : String(error)}`, sessionToastOptions);
    }
};

// New function to restore a single tab to the current window
export const handleRestoreSingleTab = async (tabToRestore: Tab) => {
    console.log("Attempting to restore single tab:", tabToRestore);

    try {
        const createdTab = await chrome.tabs.create({
            windowId: chrome.windows.WINDOW_ID_CURRENT, // Restore to current window
            url: tabToRestore.url,
            active: false, // Don't activate immediately
        });
        console.log("Single tab restored successfully:", createdTab.id);
        toast.success(`Tab "${tabToRestore.title || tabToRestore.url}" restored.`, sessionToastOptions);
    } catch (error) {
        console.log(`Error restoring single tab: ${tabToRestore.url}`, error);
        toast.error(`Failed to restore tab: ${error instanceof Error ? error.message : String(error)}`, sessionToastOptions);
    }
};

// New function to restore a single tab group and its tabs to the current window
export const handleRestoreSingleGroup = async (group: TabGroup) => {
    console.log("Attempting to restore single group:", group);

    const { inPopup } = useTabManagerStore.getState();
    if (inPopup) {
        toast.error("Please open the sidebar to restore full sessions or groups", sessionToastOptions);
        return;
    }

    if (!group.tabs || group.tabs.length === 0) {
        toast.info("Cannot restore an empty group.", sessionToastOptions);
        return;
    }

    // Get current settings
    const { settings } = useSettingsStore.getState();
    const sleepDelay = settings.slowerRestoration ? 150 : 20;

    const tabIdsForGroup: number[] = [];
    try {
        // 1. Create tabs for the group in the current window
        for (const tab of group.tabs) {
            try {
                await sleep(sleepDelay);
                const restoreUrl = tab.url;
                const createdTab = await chrome.tabs.create({
                    windowId: chrome.windows.WINDOW_ID_CURRENT, // Restore to current window
                    url: restoreUrl,
                    active: false,
                });
                if (createdTab.id) {
                    tabIdsForGroup.push(createdTab.id);
                }
            } catch (error) {
                console.log(`Error creating tab for group ${group.title}: ${tab.url}`, error);
                // Continue trying to create other tabs in the group
            }
        }

        // 2. Group the newly created tabs if any were successful
        if (tabIdsForGroup.length > 0) {
            try {
                await sleep(sleepDelay);
                const newGroupId = await chromeTabsGroup(tabIdsForGroup, { windowId: -2 });
                await sleep(sleepDelay);
                await chrome.tabGroups.update(newGroupId, {
                    title: group.title,
                    color: group.color,
                });

                console.log("Single group restored successfully:", newGroupId);
                toast.success(`Group "${group.title || "Untitled Group"}" restored.`, sessionToastOptions);
            } catch (error) {
                console.log(`Error creating or updating tab group: ${group.title}`, error);
                toast.error(`Failed to group tabs for "${group.title || "Untitled Group"}". Tabs may be ungrouped.`, sessionToastOptions);
                // Tabs were created but grouping failed, maybe inform user?
            }
        } else {
            toast.error(`Failed to restore any tabs for group "${group.title || "Untitled Group"}".`);
        }
    } catch (error) {
        console.log("Error during single group restoration:", error);
        toast.error(`Failed to restore group: ${error instanceof Error ? error.message : String(error)}`, sessionToastOptions);
    }
};
