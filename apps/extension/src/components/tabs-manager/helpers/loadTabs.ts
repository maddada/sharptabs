import { useTabManagerStore } from "@/stores/tabManagerStore";
import { useTabsStore } from "@/stores/tabsStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { Tab } from "@/types/Tab";
import { debounce } from "lodash-es";
import { collapseAllGroupsExceptActive } from "./collapseAllGroupsExceptActive";
import { findDuplicateTabs } from "@/utils/tabs/findDuplicateTabs";
import { syncGroupedTabsWithWorkspaces } from "./syncGroupedTabsWithWorkspaces";

// Define the original async function logic internally
const _loadTabs = async (cameFrom: string) => {
    const { setActiveTabId, setPinnedTabs, setRegularTabs, setTabGroups, setCollapsedGroups } = useTabsStore.getState().actions;

    const activeTabId = useTabsStore.getState().activeTabId;
    const isInitialMount = useTabManagerStore.getState().isInitialMount;
    const setIsInitialMount = useTabManagerStore.getState().actions.setIsInitialMount;

    console.log("[LOADTABS] loadTabs", cameFrom); // Use collapsed group
    try {
        const [chromeTabs, groups] = await Promise.all([
            chrome.tabs.query({ currentWindow: true }),
            chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT }),
        ]);

        console.log("[LOADTABS] Raw Tabs:", chromeTabs);
        console.log("[LOADTABS] Raw Groups:", groups);

        // Sort tabs by index first to process them in order
        const sortedChromeTabs = [...chromeTabs].sort((a, b) => a.index - b.index);

        const tabs: Tab[] = sortedChromeTabs
            .map((tab: chrome.tabs.Tab) => ({
                id: tab.id ?? 0,
                title: tab.title ?? "",
                url: tab.url ?? "",
                pinned: tab.pinned ?? false,
                groupId: tab.groupId ?? -1,
                index: tab.index, // Keep the original Chrome index
                favIconUrl: tab.favIconUrl,
                audible: tab.audible ?? false,
                mutedInfo: { muted: tab.mutedInfo?.muted ?? false },
                discarded: tab.discarded ?? false,
                frozen: tab.frozen ?? false,
                status: tab.status,
                autoDiscardable: tab.autoDiscardable ?? false,
                active: tab.active ?? false,
                windowId: tab.windowId,
            }))
            .filter((tab) => tab.id !== 0); // Filter out invalid tabs

        const pinned = tabs.filter((tab) => tab.pinned);
        const regularAndGrouped = tabs.filter((tab) => !tab.pinned);

        // Process groups and assign tabs
        const groupsWithTabs = groups
            .map((group) => {
                const groupTabs = regularAndGrouped.filter((tab) => tab.groupId === group.id);
                // Tabs are already sorted by index from the initial sort

                // Group index is the index of its first tab
                const groupIndex = groupTabs.length > 0 ? groupTabs[0].index : -1;

                return {
                    id: group.id,
                    title: group.title || "Unnamed Group",
                    color: group.color,
                    tabs: groupTabs,
                    index: groupIndex,
                };
            })
            .filter((g) => g.index !== -1) // Filter out groups that might be empty or invalid
            .sort((a, b) => a.index - b.index); // Sort groups by their index

        const ungroupedRegular = regularAndGrouped.filter((tab) => tab.groupId === -1);
        // These are already sorted by index

        // Get active tab ID
        const activeTab = tabs.find((tab) => tab.active);
        const newActiveTabId = activeTab?.id ?? 0;
        if (newActiveTabId !== activeTabId) {
            setActiveTabId(newActiveTabId);
        }

        console.log("[LOADTABS] Processed Pinned:", pinned);
        console.log("[LOADTABS] Processed Ungrouped:", ungroupedRegular);
        console.log("[LOADTABS] Processed Groups:", groupsWithTabs);

        // Expand the tabs that were expanded last time OR collapseAllGroupsExceptActive
        if (isInitialMount) {
            const saved = await chrome.storage.local.get("collapsedGroups");
            const savedCollapsedGroupsNames = saved?.collapsedGroups ?? [];
            console.log("[LOADTABS] Loaded collapsedGroups:", saved.collapsedGroups);

            const tabGroups = await chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });
            if (
                Array.isArray(savedCollapsedGroupsNames) &&
                savedCollapsedGroupsNames.length > 0 &&
                savedCollapsedGroupsNames.length !== tabGroups.length
            ) {
                console.log("[LOADTABS] loadTabs: Restoring the expanded/collapsed groups on initial load");
                const savedCollapsedGroupsIds = new Set<number>();
                for (const group of tabGroups) {
                    if (savedCollapsedGroupsNames.includes(group.title)) {
                        savedCollapsedGroupsIds.add(group.id);
                    }
                }
                setCollapsedGroups(savedCollapsedGroupsIds);
                chrome.storage.local.remove("collapsedGroups");
            } else {
                collapseAllGroupsExceptActive(groupsWithTabs, activeTab, setCollapsedGroups);
            }
        }

        setPinnedTabs(pinned);
        setRegularTabs(ungroupedRegular);
        setTabGroups(groupsWithTabs);

        // Sync grouped tabs with their parent group's workspace assignments
        await syncGroupedTabsWithWorkspaces(groupsWithTabs);

        // Check for duplicates after tab data is updated
        checkForDuplicates();

        if (isInitialMount) {
            setIsInitialMount(false);
            // console.groupEnd();
            return;
        }
    } catch (error) {
        console.log("Error loading tabs:", error);
    }
    // console.groupEnd();
};

// Function to check for duplicate tabs with debounce
const _checkForDuplicates = () => {
    try {
        const { pinnedTabs, regularTabs, tabGroups } = useTabsStore.getState();
        const { setDuplicateTabsCount } = useTabManagerStore.getState().actions;
        const { strictDuplicateChecking } = useSettingsStore.getState().settings;

        // Collect all tabs for duplicate checking
        const allTabs: Tab[] = [...pinnedTabs, ...regularTabs, ...tabGroups.flatMap((g) => g.tabs)];
        const duplicateTabIds = findDuplicateTabs(allTabs, strictDuplicateChecking);

        // Update the duplicate count
        setDuplicateTabsCount(duplicateTabIds.size);

        console.log(`[LOADTABS] Found ${duplicateTabIds.size} duplicate tabs`);
    } catch (error) {
        console.log("Error checking for duplicates:", error);
    }
};

// Create debounced version for duplicate checking
export const checkForDuplicates = debounce(_checkForDuplicates, 500, {
    leading: false, // Execute immediately
    trailing: true, // Execute after the wait time
});

// Create and export the debounced version
export const loadTabs = debounce(_loadTabs, 100, {
    leading: false, // Execute immediately on the first call
    trailing: true, // Execute after the wait time if called again during the wait
});
