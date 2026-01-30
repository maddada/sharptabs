import { AUTO_SAVE_ALARM_NAME, AUTO_SUSPEND_CHECK_ALARM_NAME, TAB_LAST_ACTIVE_KEY } from "./service_worker/_constants";
import { handleAutoGroupFromOpener } from "./service_worker/handleAutoGroupFromOpener";
import { handleDuplicateTab } from "./service_worker/handleDuplicateTab";
import { handleGoToLastTab } from "./service_worker/handleGoToLastTab";
import { handleGoToTab } from "./service_worker/handleGoToTab";
import { handleNewTabCurrentGroup } from "./service_worker/handleNewTabCurrentGroup";
import { handleOpenPopup } from "./service_worker/handleOpenPopup";
import { handleOpenPreference } from "./service_worker/handleOpenPreference";
import { handleOpenSidePanel } from "./service_worker/handleOpenSidePanel";
import { handleSwitchToLastActiveTab } from "./service_worker/handleSwitchToLastActiveTab";
import { handleSwitchToWorkspace } from "./service_worker/handleSwitchToWorkspace";
import { handleTabActivationChange } from "./service_worker/handleTabActivationChange";
import { handleWebsiteAuth } from "./service_worker/handleWebsiteAuth";
import { addToNavigationHistory } from "./service_worker/navigation/addToNavigationHistory";
import { broadcastNavigationStateChange } from "./service_worker/navigation/broadcastNavigationStateChange";
import { getNavigationState } from "./service_worker/navigation/getNavigationState";
import { handleNavigateBack } from "./service_worker/navigation/handleNavigateBack";
import { handleNavigateForward } from "./service_worker/navigation/handleNavigateForward";
import { navigationHistoryByWindow, programmaticNavigationInProgress } from "./service_worker/navigation/navigationConstants";
import { performSessionSave } from "./service_worker/performSessionSave";
import { updateTabCount } from "./service_worker/updateTabCount";
import { WorkspaceDefinition } from "./types/Workspace";
import { gatherWorkspaceDiagnostics, exportWorkspaceStructureAsYAML } from "./utils/workspaces/workspaceDiagnostics";
import { migrateWorkspaceAssignmentsOnStartup } from "./utils/workspaces/workspaceMigration";
import { initializeWorkspaceSyncListeners } from "./utils/workspaces/workspaceSync";
import { debouncedReorderTabsByWorkspace } from "./utils/workspaces/workspaceReorder";
import { saveLastActiveTabForWorkspace, getCurrentTabWorkspace, cleanupClosedWindowData } from "./utils/workspaces/workspaceActiveTab";
import { handleSuspendCurrentTab } from "./service_worker/handleSuspendCurrentTab";
import { handleSuspendGroupTabs } from "./service_worker/handleSuspendGroupTabs";
import { handleSuspendWindowTabs } from "./service_worker/handleSuspendWindowTabs";

console.log("Service worker loaded");

// Initialize workspace sync listeners
initializeWorkspaceSyncListeners();

// Update the tab count badge on startup
updateTabCount();
chrome.tabs.onCreated.addListener(updateTabCount);
chrome.tabs.onRemoved.addListener(updateTabCount);
chrome.tabs.onReplaced.addListener(updateTabCount);

// #region Auto-Suspend System

// Track tab activity - update timestamp when tab becomes active
async function updateTabLastActiveTimestamp(tabId: number) {
    try {
        const result = await chrome.storage.local.get([TAB_LAST_ACTIVE_KEY]);
        const timestamps: Record<number, number> = result[TAB_LAST_ACTIVE_KEY] || {};
        timestamps[tabId] = Date.now();
        await chrome.storage.local.set({ [TAB_LAST_ACTIVE_KEY]: timestamps });
    } catch (error) {
        // Ignore errors - tab might have been closed
    }
}

// Check if a URL is in the excluded domains list
function isExcludedDomain(url: string | undefined, excludedDomains: string[]): boolean {
    if (!url || !excludedDomains || excludedDomains.length === 0) return false;

    try {
        const hostname = new URL(url).hostname.toLowerCase();

        return excludedDomains.some((domain) => {
            const domainLower = domain.toLowerCase();

            // Handle wildcard patterns like *.google.com
            if (domainLower.startsWith("*.")) {
                const baseDomain = domainLower.substring(2);
                return hostname === baseDomain || hostname.endsWith("." + baseDomain);
            }

            // Handle exact domain matching (google.com should match google.com and www.google.com)
            return hostname === domainLower || hostname === "www." + domainLower;
        });
    } catch (e) {
        return false;
    }
}

// Check and suspend inactive tabs
async function checkAndSuspendInactiveTabs() {
    try {
        const settings = await chrome.storage.local.get([
            "autoSuspendEnabled",
            "autoSuspendMinutes",
            "autoSuspendExcludedDomains",
            "autoSuspendPinnedTabs",
            "autoSuspendPanelPages",
            "enableSuspendingGroupedTabs",
        ]);

        if (!settings.autoSuspendEnabled) return;

        const thresholdMs = (settings.autoSuspendMinutes ?? 20) * 60 * 1000;
        const result = await chrome.storage.local.get([TAB_LAST_ACTIVE_KEY]);
        const timestamps: Record<number, number> = result[TAB_LAST_ACTIVE_KEY] || {};
        const now = Date.now();

        const tabs = await chrome.tabs.query({});

        for (const tab of tabs) {
            if (!tab.id) continue;

            // Skip active tabs
            if (tab.active) continue;

            // Skip already discarded tabs
            if (tab.discarded) continue;

            // Skip tabs playing audio (using Chrome's native audible property)
            if (tab.audible) continue;

            // Skip pinned tabs if setting is disabled
            if (tab.pinned && !settings.autoSuspendPinnedTabs) continue;

            // Skip grouped tabs if setting is disabled
            if (tab.groupId !== -1 && !settings.enableSuspendingGroupedTabs) continue;

            // Skip excluded domains
            if (isExcludedDomain(tab.url, settings.autoSuspendExcludedDomains || [])) continue;

            // Skip chrome:// and extension:// URLs (can't be discarded)
            if (tab.url?.startsWith("chrome://") || tab.url?.startsWith("chrome-extension://")) continue;

            // Check if tab has been inactive long enough
            const lastActive = timestamps[tab.id] ?? now;
            if (now - lastActive >= thresholdMs) {
                try {
                    await chrome.tabs.discard(tab.id);
                    console.log(`[Auto-Suspend] Discarded tab ${tab.id}: ${tab.title}`);
                } catch (e) {
                    // Tab may not be discardable (e.g., has unsaved changes)
                }
            }
        }

        // Clean up timestamps for closed tabs
        const tabIds = new Set(tabs.map((t) => t.id).filter((id): id is number => id !== undefined));
        const cleanedTimestamps: Record<number, number> = {};
        for (const [idStr, timestamp] of Object.entries(timestamps)) {
            const id = Number(idStr);
            if (tabIds.has(id)) {
                cleanedTimestamps[id] = timestamp;
            }
        }
        await chrome.storage.local.set({ [TAB_LAST_ACTIVE_KEY]: cleanedTimestamps });
    } catch (error) {
        console.error("[Auto-Suspend] Error checking inactive tabs:", error);
    }
}

// #endregion Auto-Suspend System

// Set default preference on installation and handle click events
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === "install") {
        // Check if this is truly the first install by looking for existing data
        const result = await chrome.storage.local.get(["openPreference", "welcomeShown"]);

        // Only show welcome if no previous settings exist and welcome hasn't been shown
        if (!result.openPreference && !result.welcomeShown) {
            chrome.storage.local.set({
                openPreference: "popup", // Default to popup
                welcomeShown: true, // Mark that welcome has been shown
            });

            // Open welcome page on first install
            chrome.tabs.create({ url: "https://sharptabs.com/welcome" });
        } else if (!result.openPreference) {
            // If openPreference doesn't exist but welcomeShown does, just set the default
            chrome.storage.local.set({ openPreference: "popup" });
        }

        // Initialize workspaces on install
        // Load custom General workspace name/icon from settings (or use defaults)
        const settingsResult = await chrome.storage.local.get(["generalWorkspaceName", "generalWorkspaceIcon"]);
        const generalWorkspace: WorkspaceDefinition = {
            id: "general",
            name: settingsResult.generalWorkspaceName || "General",
            icon: settingsResult.generalWorkspaceIcon || "Home",
            isDefault: true,
        };
        await chrome.storage.local.set({
            workspaces: [generalWorkspace],
            workspaceAssignments: {},
            activeWorkspacePerWindow: {},
        });
        console.log("[Workspaces] Initialized default 'General' workspace");
    }

    // Ensure workspaces exist even on update (in case feature was added after install)
    const workspaceResult = await chrome.storage.local.get(["workspaces", "generalWorkspaceName", "generalWorkspaceIcon"]);
    if (!workspaceResult.workspaces || workspaceResult.workspaces.length === 0) {
        const generalWorkspace: WorkspaceDefinition = {
            id: "general",
            name: workspaceResult.generalWorkspaceName || "General",
            icon: workspaceResult.generalWorkspaceIcon || "Home",
            isDefault: true,
        };
        await chrome.storage.local.set({
            workspaces: [generalWorkspace],
        });
        console.log("[Workspaces] Ensured 'General' workspace exists");
    }

    // Set uninstall URL to redirect to feedback page
    chrome.runtime.setUninstallURL("https://sharptabs.com/feedback");

    // Clear existing context menus to avoid conflicts during updates
    chrome.contextMenus.removeAll(() => {
        // Create parent menu first
        chrome.contextMenus.create(
            {
                id: "sharptabs",
                title: "Sharp Tabs",
                type: "normal",
                contexts: ["all", "page"],
            },
            () => {
                // Create child menus after parent is created
                chrome.contextMenus.create({
                    id: "sharptabs-suspend-current-tab",
                    parentId: "sharptabs",
                    title: "Suspend Current Tab",
                    type: "normal",
                    contexts: ["all", "page"],
                });

                chrome.contextMenus.create({
                    id: "sharptabs-open-sidepanel",
                    parentId: "sharptabs",
                    title: "Open Side Panel",
                    type: "normal",
                    contexts: ["all", "page"],
                });

                chrome.contextMenus.create({
                    id: "sharptabs-separator-1",
                    parentId: "sharptabs",
                    type: "separator",
                    contexts: ["all", "page"],
                });

                chrome.contextMenus.create({
                    id: "sharptabs-settings",
                    parentId: "sharptabs",
                    title: "Settings",
                    type: "normal",
                    contexts: ["all", "page"],
                });
            }
        );
    });

    // Create the alarm for auto-saving sessions
    console.log("Setting up auto-save alarm...");
    chrome.alarms.create(AUTO_SAVE_ALARM_NAME, {
        delayInMinutes: 1, // Start after 1 minute
        periodInMinutes: 10, // Repeat every 10 minutes
    });

    // Create the alarm for auto-suspend checks (every minute)
    console.log("Setting up auto-suspend check alarm...");
    chrome.alarms.create(AUTO_SUSPEND_CHECK_ALARM_NAME, {
        delayInMinutes: 1,
        periodInMinutes: 1,
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    console.log("Context menu clicked", info);

    if (info.menuItemId === "sharptabs-suspend-current-tab" && tab) {
        handleSuspendCurrentTab(tab);
    } else if (info.menuItemId === "sharptabs-settings") {
        chrome.tabs.create({ url: "settings.html", active: true });
    }

    if (info.menuItemId === "sharptabs-open-sidepanel") {
        chrome.sidePanel.open({ windowId: tab?.windowId ?? chrome.windows.WINDOW_ID_CURRENT });
    }
});

chrome.runtime.onStartup.addListener(async () => {
    console.log("Extension started");

    // Ensure uninstall URL is set on startup
    chrome.runtime.setUninstallURL("https://sharptabs.com/feedback");

    // Migrate workspace assignments from old window IDs to current windows
    // This is necessary because Chrome window IDs change after browser restart
    await migrateWorkspaceAssignmentsOnStartup();

    // Create the auto-suspend check alarm on startup (in case it doesn't exist)
    chrome.alarms.create(AUTO_SUSPEND_CHECK_ALARM_NAME, {
        delayInMinutes: 1,
        periodInMinutes: 1,
    });
});

// Handle extension icon clicks based on user preference
chrome.action.onClicked.addListener(async () => {
    // Retrieve the user's preference from storage
    console.log("Extension icon clicked");

    const result = await chrome.storage.local.get(["openPreference"]);
    const openPreference = result.openPreference || "popup"; // Default to popup if not set
    handleOpenPreference(openPreference);
});

// Notify content scripts when a tab is created
chrome.tabs.onCreated.addListener(async (tab) => {
    if (tab.id && tab.windowId) {
        // Auto-group tabs opened from links to the same group as their opener
        handleAutoGroupFromOpener(tab);

        // Track tab activity for auto-suspend
        await updateTabLastActiveTimestamp(tab.id);

        // Assign new tab to currently active workspace
        try {
            const result = await chrome.storage.local.get(["activeWorkspacePerWindow", "enableWorkspaces", "workspaceAssignments"]);

            // Only assign to workspace if feature is enabled
            if (result.enableWorkspaces ?? false) {
                // Check if this is a new tab (chrome://newtab/, about:blank, etc.)
                const isNewTabUrl =
                    tab.url === "chrome://newtab/" ||
                    tab.url === "about:blank" ||
                    tab.url?.includes("://newtab") ||
                    tab.url?.includes("://new-tab-page") ||
                    tab.url?.includes("vivaldi://startpage") ||
                    tab.url?.includes("vivaldi://vivaldi-webui/startpage") ||
                    !tab.url ||
                    tab.url === "";

                if (isNewTabUrl) {
                    // Default to "general" workspace if no active workspace is set for this window
                    const activeWorkspace = result.activeWorkspacePerWindow?.[tab.windowId] || "general";

                    // Only assign to custom workspaces (general is computed dynamically)
                    if (activeWorkspace !== "general") {
                        const workspaceAssignments = result.workspaceAssignments || {};

                        if (!workspaceAssignments[tab.windowId]) {
                            workspaceAssignments[tab.windowId] = {};
                        }

                        if (!workspaceAssignments[tab.windowId][activeWorkspace]) {
                            workspaceAssignments[tab.windowId][activeWorkspace] = { groups: [], tabs: [] };
                        }

                        const existingIndex = workspaceAssignments[tab.windowId][activeWorkspace].tabs.findIndex(
                            (t: { tabId?: number }) => t.tabId === tab.id
                        );

                        if (existingIndex === -1) {
                            // Add tab to active workspace with placeholder URL
                            // This will be updated when the tab navigates to a real URL
                            // Store tabId to correctly match this placeholder later
                            workspaceAssignments[tab.windowId][activeWorkspace].tabs.push({
                                url: tab.url || "about:blank",
                                title: tab.title || "",
                                index: tab.index,
                                tabId: tab.id, // Track which tab this placeholder belongs to
                            });
                        }

                        await chrome.storage.local.set({ workspaceAssignments });
                        console.log(`[Workspace] Assigned new tab to workspace: ${activeWorkspace}`);

                        // Reorder tabs to position the new tab in the correct workspace section
                        debouncedReorderTabsByWorkspace(tab.windowId, "new-tab-created");
                    }
                }
            }
        } catch (error) {
            console.error("[Workspace] Error assigning new tab to workspace:", error);
        }
    }
});

// Also notify content scripts when they might have missed the initial state
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Handle workspace assignment when URL changes (e.g., navigating from new tab page)
    if (changeInfo.url && tab.windowId) {
        try {
            const result = await chrome.storage.local.get(["activeWorkspacePerWindow", "enableWorkspaces", "workspaceAssignments"]);

            // Only assign to workspace if feature is enabled
            if ((result.enableWorkspaces ?? false) && changeInfo.url) {
                // Helper function to check if URL is a new tab URL
                const isNewTabUrl = (url: string | undefined) =>
                    url === "chrome://newtab/" ||
                    url === "about:blank" ||
                    url?.includes("://newtab") ||
                    url?.includes("://new-tab-page") ||
                    url?.includes("vivaldi://startpage") ||
                    url?.includes("vivaldi://vivaldi-webui/startpage") ||
                    !url ||
                    url === "";

                // Default to "general" workspace if no active workspace is set for this window
                const activeWorkspace = result.activeWorkspacePerWindow?.[tab.windowId] || "general";
                const workspaceAssignments = result.workspaceAssignments || {};

                // Check if tab is already assigned to any workspace
                let assignedWorkspaceId: string | null = null;
                let updatedAssignment = false;

                if (workspaceAssignments[tab.windowId]) {
                    // Pass 1: match by tabId first (most reliable)
                    for (const workspaceId in workspaceAssignments[tab.windowId]) {
                        const workspace = workspaceAssignments[tab.windowId][workspaceId];

                        for (let i = 0; i < workspace.tabs.length; i++) {
                            const t = workspace.tabs[i] as { url: string; title: string; index: number; tabId?: number };
                            if (t.tabId != null && t.tabId === tabId) {
                                const wasPlaceholder = isNewTabUrl(t.url);
                                workspace.tabs[i] = {
                                    ...t,
                                    url: changeInfo.url,
                                    title: tab.title || "",
                                    index: tab.index,
                                    tabId,
                                };
                                assignedWorkspaceId = workspaceId;
                                updatedAssignment = true;
                                if (wasPlaceholder) {
                                    console.log(`[Workspace] Updated placeholder URL to ${changeInfo.url} in workspace: ${workspaceId}`);
                                }
                                break;
                            }
                        }

                        if (assignedWorkspaceId) break;
                    }

                    // Pass 2: match by URL only if no tabId match (ignore entries that already have a different tabId)
                    if (!assignedWorkspaceId) {
                        for (const workspaceId in workspaceAssignments[tab.windowId]) {
                            const workspace = workspaceAssignments[tab.windowId][workspaceId];

                            for (let i = 0; i < workspace.tabs.length; i++) {
                                const t = workspace.tabs[i] as { url: string; title: string; index: number; tabId?: number };

                                if (t.tabId != null && t.tabId !== tabId) continue;

                                if (t.url === changeInfo.url) {
                                    workspace.tabs[i] = {
                                        ...t,
                                        url: changeInfo.url,
                                        title: tab.title || "",
                                        index: tab.index,
                                        tabId,
                                    };
                                    assignedWorkspaceId = workspaceId;
                                    updatedAssignment = true;
                                    break;
                                }
                            }

                            if (assignedWorkspaceId) break;
                        }
                    }
                }

                // If already assigned, update storage if needed and exit
                if (assignedWorkspaceId) {
                    if (updatedAssignment) {
                        await chrome.storage.local.set({ workspaceAssignments });
                    }
                    return;
                }

                // If not assigned, assign to active workspace (unless it's "general")
                if (!assignedWorkspaceId && activeWorkspace !== "general") {
                    if (!workspaceAssignments[tab.windowId]) {
                        workspaceAssignments[tab.windowId] = {};
                    }

                    if (!workspaceAssignments[tab.windowId][activeWorkspace]) {
                        workspaceAssignments[tab.windowId][activeWorkspace] = { groups: [], tabs: [] };
                    }

                    // Add tab to active workspace
                    workspaceAssignments[tab.windowId][activeWorkspace].tabs.push({
                        url: changeInfo.url,
                        title: tab.title || "",
                        index: tab.index,
                        tabId,
                    });

                    await chrome.storage.local.set({ workspaceAssignments });
                    console.log(`[Workspace] Assigned tab with new URL to workspace: ${activeWorkspace}`);
                }
            }
        } catch (error) {
            console.error("[Workspace] Error assigning updated tab to workspace:", error);
        }
    }
});

// Handle open preference changed
chrome.storage.onChanged.addListener(async (changes) => {
    const openPreference = changes?.openPreference?.newValue;
    if (openPreference) {
        console.log("Service Worker: Open preference changed:", openPreference);
        if (openPreference === "sidepanel") {
            chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.log(error));
            await chrome.action.setPopup({ popup: "" });
        } else {
            chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch((error) => console.log(error));
            await chrome.action.setPopup({ popup: "popup.html" });
        }
    }
});

chrome.action.onUserSettingsChanged.addListener(function (e) {
    console.log("User action settings changed", e);
});

// #region Hot Keys
chrome.commands.onCommand.addListener(async (command, tab) => {
    if (command === "suspend-current-tab") {
        handleSuspendCurrentTab(tab);
    }
    if (command === "suspend-group-tabs") {
        handleSuspendGroupTabs(tab);
    }
    if (command === "suspend-window-tabs") {
        handleSuspendWindowTabs();
    }
    if (command === "open-sidepanel") {
        handleOpenSidePanel(tab);
    }
    if (command === "open-popup") {
        handleOpenPopup(tab);
    }
    if (command === "duplicate-tab") {
        handleDuplicateTab(tab);
    }
    if (command === "new-tab-current-group") {
        handleNewTabCurrentGroup(tab);
    }
    if (command === "switch-to-last-active-tab") {
        handleSwitchToLastActiveTab(tab, prevActiveTabIdByWindow);
    }
    if (command.startsWith("go-to-tab-")) {
        const tabNumber = parseInt(command.replace("go-to-tab-", ""));
        handleGoToTab(tab, tabNumber);
    }
    if (command === "go-to-tab-last-tab") {
        handleGoToLastTab(tab);
    }
    if (command === "navigate-back") {
        if (tab && tab.windowId) {
            await handleNavigateBack(tab.windowId);
        }
    }
    if (command === "navigate-forward") {
        if (tab && tab.windowId) {
            await handleNavigateForward(tab.windowId);
        }
    }
    if (command.startsWith("switch-to-workspace-")) {
        const workspaceNumber = parseInt(command.replace("switch-to-workspace-", ""));
        await handleSwitchToWorkspace(tab, workspaceNumber);
    }
});

// Clean up navigation history when window is closed
chrome.windows.onRemoved.addListener((windowId) => {
    delete navigationHistoryByWindow[windowId];

    // Clean up any programmatic navigation flags for this window
    for (const key of programmaticNavigationInProgress) {
        if (key.startsWith(`${windowId}-`)) {
            programmaticNavigationInProgress.delete(key);
        }
    }

    // Clean up workspace active tab data for this window
    cleanupClosedWindowData(windowId);
});

// Clean up stale programmatic navigation flags periodically
setInterval(() => {
    if (programmaticNavigationInProgress.size > 0) {
        programmaticNavigationInProgress.clear();
    }
}, 10000);

// Track last active tab per window
const lastActiveTabIdByWindow: Record<number, number | null> = {};
const prevActiveTabIdByWindow: Record<number, number | null> = {};

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const { tabId, windowId } = activeInfo;

    // Update tab activity timestamp for auto-suspend
    await updateTabLastActiveTimestamp(tabId);

    // Add to navigation history
    addToNavigationHistory(windowId, tabId);

    // Move current active to previous, then update current
    if (lastActiveTabIdByWindow[windowId] && lastActiveTabIdByWindow[windowId] !== tabId) {
        prevActiveTabIdByWindow[windowId] = lastActiveTabIdByWindow[windowId];
    }
    lastActiveTabIdByWindow[windowId] = tabId;

    // Notify content scripts about tab activation change
    handleTabActivationChange(tabId, windowId);

    // Track last active tab per workspace (if feature is enabled)
    try {
        const settingsResult = await chrome.storage.local.get(["separateActiveTabPerWorkspace", "enableWorkspaces"]);
        if ((settingsResult.enableWorkspaces ?? false) && (settingsResult.separateActiveTabPerWorkspace ?? false)) {
            const workspaceId = await getCurrentTabWorkspace(tabId, windowId);
            if (workspaceId) {
                await saveLastActiveTabForWorkspace(windowId, workspaceId, tabId);
            }
        }
    } catch (error) {
        // Silently ignore errors to not break tab activation
    }
});

// Clean up navigation history when tabs are removed
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    const { windowId } = removeInfo;

    // Clean up the navigation history for this window
    const navHistory = navigationHistoryByWindow[windowId];
    if (navHistory) {
        const tabIndex = navHistory.history.indexOf(tabId);
        if (tabIndex !== 0) {
            // Remove the tab from history
            navHistory.history.splice(tabIndex, 1);

            // Adjust current index if needed
            if (navHistory.currentIndex >= tabIndex && navHistory.currentIndex > 0) {
                navHistory.currentIndex--;
            }

            // Ensure current index is valid
            if (navHistory.history.length === 0) {
                navHistory.currentIndex = -1;
            } else {
                navHistory.currentIndex = Math.max(0, Math.min(navHistory.currentIndex, navHistory.history.length - 1));
            }

            // Broadcast navigation state change after tab removal
            broadcastNavigationStateChange(windowId);
        }
    }
});
// #endregion Hot Keys

// #region Message Listeners

// Listener for alarms (auto-save and auto-suspend)
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === AUTO_SAVE_ALARM_NAME) {
        performSessionSave(true);
        return;
    }

    if (alarm.name === AUTO_SUSPEND_CHECK_ALARM_NAME) {
        checkAndSuspendInactiveTabs();
        return;
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Listen for messages from content scripts (this is for logging in a user using email magic link)
    // Rest of the code is in the website code in the /email-sign-in page
    if (message.type === "OPEN_SETTINGS_TAB_AND_SIGNIN" && typeof message.url === "string") {
        chrome.tabs.create({ url: message.url });
        return false;
    }

    // Handle manual session save requests (this saves all window sessions)
    if (message.type === "SAVE_ALL_SESSIONS") {
        console.log("Received SAVE_ALL_SESSIONS message");

        // Send immediate acknowledgment to prevent timeout
        sendResponse({ success: true, message: "Save operation started" });

        // Perform the save operation in the background
        performSessionSave(false)
            .then(() => {
                console.log("Background save completed successfully");
            })
            .catch((error) => {
                console.log("Background save failed:", error);
            });

        return false; // Don't keep message channel open since we already responded
    }

    // Handle recent tab navigation requests (back and forward buttons in tab manager header)
    if (message.type === "NAVIGATE_BACK" && message.windowId) {
        (async () => {
            try {
                const success = await handleNavigateBack(message.windowId);
                sendResponse({ success });
            } catch (error) {
                console.log("Error in NAVIGATE_BACK:", error);
                sendResponse({ success: false });
            }
        })();
        return true; // Keep message channel open
    }

    // Handle recent tab navigation requests (back and forward buttons in tab manager header)
    if (message.type === "NAVIGATE_FORWARD" && message.windowId) {
        (async () => {
            try {
                const success = await handleNavigateForward(message.windowId);
                sendResponse({ success });
            } catch (error) {
                console.log("Error in NAVIGATE_FORWARD:", error);
                sendResponse({ success: false });
            }
        })();
        return true; // Keep message channel open
    }

    // Give the current state of the history to the buttons in the tab manager header (different by window)
    if (message.type === "GET_NAVIGATION_STATE" && message.windowId) {
        (async () => {
            try {
                const navigationState = await getNavigationState(message.windowId);
                sendResponse(navigationState);
            } catch (error) {
                console.log("Error in GET_NAVIGATION_STATE:", error);
                sendResponse({ canGoBack: false, canGoForward: false });
            }
        })();
        return true; // Keep message channel open
    }

    // Handle tab pinning request when restoring a session so it doesn't get pinned on the
    // original window that the restore session was called from
    if (message.type === "PIN_TAB" && message.tabId && message.windowId) {
        (async () => {
            try {
                await chrome.tabs.update(message.tabId, { pinned: true });
                console.log(`Tab pinned successfully: ${message.tabId}`);
            } catch (error) {
                console.log(`Error pinning tab ${message.tabId}:`, error);
            }
        })();
        return false;
    }

    // Handle authentication from website (cross-platform auth)
    if (message.type === "WEBSITE_AUTH_SUCCESS") {
        console.log("[WEBSITE AUTH] Received authentication from website");
        (async () => {
            try {
                await handleWebsiteAuth(message.user, message.customToken);
                sendResponse({ success: true });
            } catch (error: any) {
                console.error("[WEBSITE AUTH] Error handling website auth:", error);
                sendResponse({ success: false, error: error.message });
            }
        })();
        return true; // Keep message channel open for async response
    }

    // Workspace message handlers
    if (message.type === "GET_WORKSPACES") {
        (async () => {
            try {
                const result = await chrome.storage.local.get("workspaces");
                sendResponse({ workspaces: result.workspaces || [] });
            } catch (error) {
                console.error("Error getting workspaces:", error);
                sendResponse({ workspaces: [] });
            }
        })();
        return true;
    }

    if (message.type === "GET_WORKSPACE_ASSIGNMENTS" && message.windowId) {
        (async () => {
            try {
                const result = await chrome.storage.local.get("workspaceAssignments");
                const assignments = result.workspaceAssignments?.[message.windowId] || {};
                sendResponse({ assignments });
            } catch (error) {
                console.error("Error getting workspace assignments:", error);
                sendResponse({ assignments: {} });
            }
        })();
        return true;
    }

    if (message.type === "EXPORT_WORKSPACE_DIAGNOSTICS") {
        (async () => {
            try {
                const diagnostics = await gatherWorkspaceDiagnostics();
                console.log("[Workspace Diagnostics] Gathered diagnostics:", diagnostics);
                sendResponse({ success: true, diagnostics });
            } catch (error) {
                console.error("[Workspace Diagnostics] Error gathering diagnostics:", error);
                sendResponse({ success: false, error: String(error) });
            }
        })();
        return true;
    }

    if (message.type === "EXPORT_WORKSPACE_STRUCTURE") {
        (async () => {
            try {
                const yaml = await exportWorkspaceStructureAsYAML();
                console.log("[Workspace Structure] Exported structure as YAML");
                sendResponse({ success: true, yaml });
            } catch (error) {
                console.error("[Workspace Structure] Error exporting structure:", error);
                sendResponse({ success: false, error: String(error) });
            }
        })();
        return true;
    }

    return false;
});

// #endregion Message Listeners
