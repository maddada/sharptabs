import { SavedSession } from "@/types/SavedSession";
import { Tab } from "@/types/Tab";
import { TabGroup } from "@/types/TabGroup";
import { WorkspaceAssignments } from "@/types/Workspace";
import { formatDateCustom } from "@/utils/dateUtils";
import { AUTO_SAVE_LIMIT } from "./_constants";

// Helper function to compare two sessions for identical content
function areSessionsIdentical(session1: SavedSession, session2: SavedSession): boolean {
    // Quick check: compare counts first
    if (
        session1.pinnedTabs.length !== session2.pinnedTabs.length ||
        session1.regularTabs.length !== session2.regularTabs.length ||
        session1.tabGroups.length !== session2.tabGroups.length
    ) {
        return false;
    }

    // Check pinned tabs URLs in order
    for (let i = 0; i < session1.pinnedTabs.length; i++) {
        if (session1.pinnedTabs[i].url !== session2.pinnedTabs[i].url) {
            return false;
        }
    }

    // Check regular tabs URLs in order
    for (let i = 0; i < session1.regularTabs.length; i++) {
        if (session1.regularTabs[i].url !== session2.regularTabs[i].url) {
            return false;
        }
    }

    // Check group names in order
    for (let i = 0; i < session1.tabGroups.length; i++) {
        if (session1.tabGroups[i].title !== session2.tabGroups[i].title) {
            return false;
        }

        // Also check the URLs of tabs within each group
        const group1Tabs = session1.tabGroups[i].tabs;
        const group2Tabs = session2.tabGroups[i].tabs;

        if (group1Tabs.length !== group2Tabs.length) {
            return false;
        }

        for (let j = 0; j < group1Tabs.length; j++) {
            if (group1Tabs[j].url !== group2Tabs[j].url) {
                return false;
            }
        }
    }

    return true;
}

export async function performSessionSave(isAutoSave: boolean = true) {
    console.log(`[AUTOSAVE] Performing ${isAutoSave ? "auto-save" : "manual save"} at ${new Date().toLocaleTimeString()}`);

    // Check if auto-save is enabled (only for auto-saves)
    if (isAutoSave) {
        const settingsResult = await chrome.storage.local.get({ autoSaveSessionsEnabled: true });
        if (settingsResult.autoSaveSessionsEnabled === false) {
            console.log("[AUTOSAVE] Auto-save is disabled, skipping save.");
            return;
        }
    }

    try {
        // 1. Get all normal windows
        const allWindows = await chrome.windows.getAll({ populate: true, windowTypes: ["normal"] });
        if (allWindows.length === 0) {
            console.log("[AUTOSAVE] No normal windows found.");
            return;
        }

        console.log(`[AUTOSAVE] Found ${allWindows.length} window(s) to save.`);

        // 2. Load existing sessions to check for duplicates and manage limits
        const storageResult = await chrome.storage.local.get({ savedSessions: [] });
        const allSavedSessions: SavedSession[] = storageResult.savedSessions || [];

        const manualSaves = allSavedSessions.filter((s) => !s.isAuto);
        let autoSaves = allSavedSessions.filter((s) => s.isAuto);

        const newSessions: SavedSession[] = [];
        const now = new Date();

        // 3. Process each window to create sessions
        for (const window of allWindows) {
            if (!window.id) continue;

            const windowId = window.id;
            const allTabs = await chrome.tabs.query({ windowId: windowId });
            const chromeGroups = await chrome.tabGroups.query({ windowId: windowId });

            // Skip empty windows
            if (allTabs.length === 0) {
                console.log(`[AUTOSAVE] Skipping empty window ${windowId}.`);
                continue;
            }

            // Process tabs and groups into our format
            const pinnedTabs: Tab[] = [];
            const regularTabs: Tab[] = [];
            const groupMap = new Map<number, Tab[]>(); // groupId -> tabs

            allTabs.forEach((tab) => {
                const simpleTab: Tab = {
                    id: tab.id ?? 0,
                    title: tab.title ?? "",
                    url: tab.url ?? "",
                    favIconUrl: tab.favIconUrl,
                    index: tab.index,
                    pinned: tab.pinned,
                    active: tab.active,
                    groupId: tab.groupId,
                    audible: tab.audible,
                    discarded: tab.discarded,
                    frozen: tab.frozen,
                    status: tab.status,
                    autoDiscardable: tab.autoDiscardable,
                    mutedInfo: tab.mutedInfo,
                };

                if (tab.pinned) {
                    pinnedTabs.push(simpleTab);
                } else if (tab.groupId && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
                    if (!groupMap.has(tab.groupId)) {
                        groupMap.set(tab.groupId, []);
                    }
                    groupMap.get(tab.groupId)?.push(simpleTab);
                } else {
                    regularTabs.push(simpleTab);
                }
            });

            const tabGroups: TabGroup[] = chromeGroups.map((group) => ({
                id: group.id,
                title: group.title ?? "",
                color: group.color,
                collapsed: group.collapsed,
                windowId: group.windowId,
                index: -1, // Index might not be directly available or relevant here, set later if needed
                tabs: groupMap.get(group.id)?.sort((a, b) => a.index - b.index) ?? [],
            }));

            // Assign group index based on the minimum tab index within the group
            tabGroups.forEach((group) => {
                if (group.tabs.length > 0) {
                    group.index = Math.min(...group.tabs.map((t) => t.index));
                } else {
                    // Handle empty groups? Assign a high index? Or rely on chromeGroups order?
                    // For simplicity, let's find the group's position relative to tabs
                    const firstTabAfterGroup = allTabs.find((t) => t.index > (group.index === -1 ? -1 : group.index) && t.groupId !== group.id);
                    group.index = firstTabAfterGroup ? firstTabAfterGroup.index - 0.5 : allTabs.length; // Approximate index
                }
            });
            tabGroups.sort((a, b) => a.index - b.index);

            // Get workspace data for this window
            let workspaceAssignments: WorkspaceAssignments | undefined = undefined;
            let activeWorkspace: string | undefined = undefined;
            try {
                const workspaceResult = await chrome.storage.local.get(["workspaceAssignments", "activeWorkspacePerWindow", "enableWorkspaces"]);

                if (workspaceResult.enableWorkspaces ?? false) {
                    workspaceAssignments = workspaceResult.workspaceAssignments?.[windowId];
                    activeWorkspace = workspaceResult.activeWorkspacePerWindow?.[windowId];

                    // DEFENSIVE CHECK: Validate workspace data before including in session
                    if (workspaceAssignments) {
                        const hasValidData = Object.keys(workspaceAssignments).some((workspaceId) => {
                            const workspace = workspaceAssignments![workspaceId];
                            return workspace && (workspace.tabs?.length > 0 || workspace.groups?.length > 0);
                        });

                        if (!hasValidData) {
                            console.log(`[AUTOSAVE] Window ${windowId} has no valid workspace assignments, excluding from session`);
                            workspaceAssignments = undefined;
                        } else {
                            console.log(
                                `[AUTOSAVE] Including workspace assignments for window ${windowId} (${Object.keys(workspaceAssignments).length} workspace(s))`
                            );
                        }
                    }
                }
            } catch (error) {
                console.error("[AUTOSAVE] Error getting workspace data:", error);
                // Don't include potentially corrupted workspace data in the session
                workspaceAssignments = undefined;
                activeWorkspace = undefined;
            }

            // Create the new session object for this window
            const newSession: SavedSession = {
                timestamp: now.getTime(),
                date: formatDateCustom(now), // Use custom date format
                time: now.toLocaleTimeString(),
                pinnedTabs: pinnedTabs,
                regularTabs: regularTabs,
                tabGroups: tabGroups,
                isAuto: isAutoSave,
                workspaceAssignments,
                activeWorkspace,
            };

            // Check if this session is identical to any of the recent sessions
            // Compare against the last X sessions where X is the number of windows
            const recentSessions = allSavedSessions.sort((a, b) => b.timestamp - a.timestamp).slice(0, allWindows.length + 3);
            const isIdenticalToRecent = recentSessions.some((recentSession) => areSessionsIdentical(newSession, recentSession));

            if (isIdenticalToRecent) {
                console.log(`[AUTOSAVE] Session for window ${windowId} is identical to a recent session, skipping.`);
                continue;
            }

            newSessions.push(newSession);
        }

        if (newSessions.length === 0) {
            console.log("[AUTOSAVE] No new sessions to save (all were identical to recent ones).");
            return;
        }

        // 4. Manage auto-save limits (only for auto-saves)
        if (isAutoSave) {
            // Sort auto-saves by timestamp (oldest first) to facilitate removal
            autoSaves.sort((a, b) => a.timestamp - b.timestamp);

            // Calculate how many sessions we need to remove to stay within limit
            const totalAutoSaves = autoSaves.length + newSessions.length;
            const excessAutoSaves = totalAutoSaves - AUTO_SAVE_LIMIT;

            if (excessAutoSaves > 0) {
                autoSaves = autoSaves.slice(excessAutoSaves); // Remove the oldest ones
                console.log(`[AUTOSAVE] Removed ${excessAutoSaves} oldest auto-save(s).`);
            }
        }

        // 5. Combine and save
        const updatedSessions = [...manualSaves, ...autoSaves, ...newSessions].sort((a, b) => b.timestamp - a.timestamp); // Keep newest first overall

        await chrome.storage.local.set({ savedSessions: updatedSessions });
        console.log(`${isAutoSave ? "Auto-save" : "Manual save"} completed successfully. Saved ${newSessions.length} new session(s).`);
    } catch (error) {
        console.log(`Error during ${isAutoSave ? "auto-save" : "manual save"}:`, error);
        // Re-throw the error so it can be caught by the message handler
        throw error;
    }
}
