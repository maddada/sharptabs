import { create } from "zustand";
import { WorkspaceDefinition } from "@/types/Workspace";
import { saveLastActiveTabForWorkspace, activateLastActiveTabForWorkspace } from "@/utils/workspaces/workspaceActiveTab";

interface WorkspaceState {
    workspaces: WorkspaceDefinition[];
    activeWorkspaceId: string | null; // "general" by default
    isLoading: boolean;

    actions: {
        setWorkspaces: (workspaces: WorkspaceDefinition[]) => void;
        setActiveWorkspaceId: (id: string) => void;
        addWorkspace: (workspace: WorkspaceDefinition) => void;
        removeWorkspace: (id: string) => void;
        updateWorkspace: (id: string, updates: Partial<WorkspaceDefinition>) => void;
        reorderWorkspaces: (workspaces: WorkspaceDefinition[]) => void;
        loadWorkspaces: () => Promise<void>;
        setIsLoading: (loading: boolean) => void;
    };
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
    workspaces: [],
    activeWorkspaceId: "general",
    isLoading: false,

    actions: {
        setWorkspaces: (workspaces) => set({ workspaces }),

        setActiveWorkspaceId: async (id) => {
            const previousWorkspaceId = get().activeWorkspaceId;
            set({ activeWorkspaceId: id });

            // Persist active workspace for current window
            const currentWindow = await chrome.windows.getCurrent();
            if (!currentWindow.id) return;

            const windowId = currentWindow.id;

            // Get settings to check if separate active tab feature is enabled
            const settingsResult = await chrome.storage.local.get("separateActiveTabPerWorkspace");
            const separateActiveTabEnabled = settingsResult.separateActiveTabPerWorkspace === true;

            // Save the current active tab for the previous workspace before switching
            if (separateActiveTabEnabled && previousWorkspaceId && previousWorkspaceId !== id) {
                const [activeTab] = await chrome.tabs.query({ active: true, windowId });
                if (activeTab?.id) {
                    await saveLastActiveTabForWorkspace(windowId, previousWorkspaceId, activeTab.id);
                }
            }

            // Update active workspace in storage
            const result = await chrome.storage.local.get("activeWorkspacePerWindow");
            const activeWorkspacePerWindow = result.activeWorkspacePerWindow || {};
            activeWorkspacePerWindow[windowId] = id;
            await chrome.storage.local.set({ activeWorkspacePerWindow });

            // Activate the last active tab for the new workspace
            if (separateActiveTabEnabled && previousWorkspaceId !== id) {
                // Small delay to allow the UI to update first
                setTimeout(() => {
                    activateLastActiveTabForWorkspace(windowId, id);
                }, 100);
            }
        },

        addWorkspace: (workspace) => {
            const newWorkspaces = [...get().workspaces, workspace];
            set({ workspaces: newWorkspaces });
            chrome.storage.local.set({ workspaces: newWorkspaces });
        },

        removeWorkspace: (id) => {
            // Cannot remove the default "general" workspace
            if (id === "general") return;

            const newWorkspaces = get().workspaces.filter((w) => w.id !== id);
            set({ workspaces: newWorkspaces });
            chrome.storage.local.set({ workspaces: newWorkspaces });

            // If active workspace was deleted, switch to general
            if (get().activeWorkspaceId === id) {
                get().actions.setActiveWorkspaceId("general");
            }
        },

        updateWorkspace: (id, updates) => {
            // Cannot modify the default "general" workspace
            if (id === "general" && (updates.name || updates.isDefault)) return;

            const newWorkspaces = get().workspaces.map((w) => (w.id === id ? { ...w, ...updates } : w));
            set({ workspaces: newWorkspaces });
            chrome.storage.local.set({ workspaces: newWorkspaces });
        },

        reorderWorkspaces: (workspaces) => {
            set({ workspaces });
            chrome.storage.local.set({ workspaces });
        },

        loadWorkspaces: async () => {
            set({ isLoading: true });
            try {
                const result = await chrome.storage.local.get([
                    "workspaces",
                    "activeWorkspacePerWindow",
                    "generalWorkspaceName",
                    "generalWorkspaceIcon",
                ]);

                let workspaces = result.workspaces || [];

                // Get custom General workspace name/icon from settings (or use defaults)
                const generalName = result.generalWorkspaceName || "General";
                const generalIcon = result.generalWorkspaceIcon || "Home";

                // Ensure "General" workspace exists as the first workspace
                const generalIndex = workspaces.findIndex((w: WorkspaceDefinition) => w.id === "general");
                const generalWorkspace: WorkspaceDefinition = {
                    id: "general",
                    name: generalName,
                    icon: generalIcon,
                    isDefault: true,
                };

                if (generalIndex === -1) {
                    // General workspace doesn't exist, add it
                    workspaces = [generalWorkspace, ...workspaces];
                    await chrome.storage.local.set({ workspaces });
                } else {
                    // Update existing General workspace with custom name/icon
                    workspaces[generalIndex] = generalWorkspace;
                }

                set({ workspaces });

                // Set active workspace for current window
                const currentWindow = await chrome.windows.getCurrent();
                console.log(`[Workspace_active_tab_restore] loadWorkspaces - currentWindow.id: ${currentWindow.id}`);

                if (currentWindow.id) {
                    const activeWorkspacePerWindow = result.activeWorkspacePerWindow || {};
                    console.log(`[Workspace_active_tab_restore] activeWorkspacePerWindow:`, JSON.stringify(activeWorkspacePerWindow, null, 2));

                    const activeId = activeWorkspacePerWindow[currentWindow.id] || "general";
                    console.log(`[Workspace_active_tab_restore] Setting activeWorkspaceId to: ${activeId}`);
                    set({ activeWorkspaceId: activeId });

                    // On startup, activate the last remembered tab for this workspace
                    const settingsResult = await chrome.storage.local.get("separateActiveTabPerWorkspace");
                    console.log(
                        `[Workspace_active_tab_restore] separateActiveTabPerWorkspace setting: ${settingsResult.separateActiveTabPerWorkspace}`
                    );

                    if (settingsResult.separateActiveTabPerWorkspace === true) {
                        console.log(`[Workspace_active_tab_restore] Scheduling tab activation for workspace ${activeId} in 500ms`);
                        // Small delay to ensure tabs are loaded
                        setTimeout(() => {
                            console.log(`[Workspace_active_tab_restore] Executing scheduled tab activation for workspace ${activeId}`);
                            activateLastActiveTabForWorkspace(currentWindow.id!, activeId);
                        }, 500);
                    } else {
                        console.log(`[Workspace_active_tab_restore] Setting disabled, skipping tab activation`);
                    }
                } else {
                    console.log(`[Workspace_active_tab_restore] No currentWindow.id, skipping workspace restoration`);
                }
            } catch (error) {
                console.error("Error loading workspaces:", error);
            } finally {
                set({ isLoading: false });
            }
        },

        setIsLoading: (loading) => set({ isLoading: loading }),
    },
}));
