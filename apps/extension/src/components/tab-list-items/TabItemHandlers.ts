import { useSelectionStore } from "@/stores/selectionStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTabManagerStore } from "@/stores/tabManagerStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { Tab } from "@/types/Tab";
import { ColorEnum, TabGroup } from "@/types/TabGroup";
import { chromeTabsGroup } from "@/utils/tabs/chromeTabsGroup";
import { TabItemState } from "./TabItem";
import { createNewTab } from "@/utils/tabs/createNewTab";
import { discardTabsNativelySafely } from "@/utils/tabs/discardTabsNativelySafely";
import { isNewTab } from "@/utils/tabs/isNewTab";

export const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) e.preventDefault();
    // Do NOT stop propagation here if using dnd listeners on the same element
};

export const handleAuxClick = (e: React.MouseEvent, tab: Tab) => {
    if (e.button === 1) {
        e.stopPropagation();
        e.preventDefault();

        // Check if the setting is enabled and the tab is pinned
        const { disableMiddleClickAndCloseButtonOnPinnedTabs } = useSettingsStore.getState().settings;
        if (disableMiddleClickAndCloseButtonOnPinnedTabs && tab.pinned) {
            // Don't close pinned tabs when the setting is enabled
            return;
        }

        handleCloseTab(e, tab);
    }
    // Do NOT stop propagation here
};

export const toggleMute = async (e: React.MouseEvent, tab: Tab, tabState: TabItemState) => {
    e.stopPropagation();
    try {
        await chrome.tabs.update(tab.id, { muted: !tabState.isMuted });
    } catch (error) {
        console.log("Error toggling mute:", error);
    }
};

export const handlePin = async (e: React.MouseEvent, tab: Tab) => {
    e?.stopPropagation();
    try {
        await chrome.tabs.update(tab.id, { pinned: true });
    } catch (error) {
        console.log("Error pinning tab:", error);
    }
};

export const handleUnpinTab = async (e: React.MouseEvent, tab: Tab) => {
    e?.stopPropagation();
    try {
        await chrome.tabs.update(tab.id, { pinned: false });
    } catch (error) {
        console.log("Error unpinning tab:", error);
    }
};

export const handleReloadTab = async (e: React.MouseEvent, tab: Tab) => {
    e.stopPropagation();
    try {
        await chrome.tabs.reload(tab.id);
    } catch (error) {
        console.log("Error reloading tab:", error);
    }
};

export const handleCopyUrl = async (e: React.MouseEvent, tabs: Tab[]) => {
    e.stopPropagation();
    try {
        const urls = tabs.map((tab) => tab.url).join("\n");
        await navigator.clipboard.writeText(urls);
    } catch (error) {
        console.log("Error copying URL:", error);
    }
};

export const moveTabToNewWindow = async (tab: Tab) => {
    const newWindow = await chrome.windows.create({});
    await chrome.tabs.move(tab.id, { windowId: newWindow.id, index: -1 }, async (tab) => {
        const newWindowTabs = await chrome.tabs.query({ windowId: newWindow.id });

        // Filter out the tab we want to keep and get IDs of tabs to close
        const tabsToClose = newWindowTabs
            .filter((t) => tab.id !== t.id) // Exclude pinned tabs and our target tab
            .map((t) => t.id ?? 0);

        // Close all other tabs
        chrome.tabs.remove(tabsToClose);
    });
};

export const moveTabToNewWindowMultiple = async (tabs: Tab[]) => {
    const newWindow = await chrome.windows.create({});

    for (const tab of tabs) {
        await chrome.tabs.move(tab.id, { windowId: newWindow.id, index: -1 });
    }

    const newWindowTabs = await chrome.tabs.query({ windowId: newWindow.id });
    // Filter out the tabs we want to keep and get IDs of tabs to close
    const tabsToClose = newWindowTabs
        .filter((t) => !tabs.some((tab) => tab.id === t.id)) // Find tabs not in the tabs array
        .map((t) => t.id ?? 0);

    // Close all other tabs
    chrome.tabs.remove(tabsToClose);
};

export const handleMoveToOtherWindow = async (e: React.MouseEvent, tab: Tab) => {
    e.stopPropagation();
    const { setIsWindowSelectionDialogOpen, setWindowSelectionDialogTab } = useTabManagerStore.getState().actions;

    try {
        const windows = (await chrome.windows.getAll()).filter((window) => window.type === "normal");

        if (windows.length <= 1) {
            await moveTabToNewWindow(tab);
            useSelectionStore.getState().actions.clearSelection();
        } else {
            setWindowSelectionDialogTab(tab);
            setIsWindowSelectionDialogOpen(true);
        }
    } catch (error) {
        console.log("Error opening in new window:", error);
    }
};

export const handleMoveToOtherWindowMultiple = async (e: React.MouseEvent, tabs: Tab[]) => {
    e.stopPropagation();
    const { setIsWindowSelectionDialogOpen, setWindowSelectionDialogTabs } = useTabManagerStore.getState().actions;

    try {
        const windows = (await chrome.windows.getAll()).filter((window) => window.type === "normal");

        if (windows.length <= 1) {
            await moveTabToNewWindowMultiple(tabs);
            useSelectionStore.getState().actions.clearSelection();
        } else {
            setWindowSelectionDialogTabs(tabs);
            setIsWindowSelectionDialogOpen(true);
        }
    } catch (error) {
        console.log("Error opening in new window:", error);
    }
};

export const handleBookmarkTab = async (e: React.MouseEvent, tab?: Tab, tabs?: Tab[]) => {
    e.stopPropagation();
    try {
        const permission = await chrome.permissions.request({ permissions: ["bookmarks"] });
        console.log("permission", permission);
        if (permission) {
            if (tab) {
                await chrome.bookmarks.create({ parentId: "1", title: tab.title, url: tab.url });
            } else if (tabs) {
                const parentId = await chrome.bookmarks.create({ parentId: "1", title: "Saved Tabs", url: "" });
                for (const t of tabs) {
                    await chrome.bookmarks.create({ parentId: parentId.id, title: t.title, url: t.url });
                }
            }
        }
    } catch (error) {
        console.log("Error bookmarking tab:", error);
    }
};

export const handleDuplicateTab = async (e: React.MouseEvent, tab?: Tab, tabs?: Tab[]) => {
    e.stopPropagation();
    try {
        if (tab) {
            const sourceTab = await chrome.tabs.get(tab.id);
            const duplicatedTab = await chrome.tabs.duplicate(tab.id);
            if (duplicatedTab?.id) {
                await chrome.tabs.move(duplicatedTab.id, { index: sourceTab.index + 1 });
            }
        } else if (tabs) {
            for (const t of tabs) {
                const sourceTab = await chrome.tabs.get(t.id);
                const duplicatedTab = await chrome.tabs.duplicate(t.id);
                if (duplicatedTab?.id) {
                    await chrome.tabs.move(duplicatedTab.id, { index: sourceTab.index + 1 });
                }
            }
        }
    } catch (error) {
        console.log("Error duplicating tab:", error);
    }
};

export const handleNewTabBelow = async (e: React.MouseEvent, tab: Tab) => {
    e.stopPropagation();
    try {
        const sourceTab = await chrome.tabs.get(tab.id);
        const activeWorkspaceId = useWorkspaceStore.getState().activeWorkspaceId;
        const newTab = await createNewTab({ active: true }, { workspaceId: activeWorkspaceId ?? undefined });
        if (newTab?.id) {
            await chrome.tabs.move(newTab.id, { index: sourceTab.index + 1 });
        }
    } catch (error) {
        console.log("Error duplicating tab:", error);
    }
};

export const handleCloseTab = async (e: React.MouseEvent, tab: Tab) => {
    e.stopPropagation();
    try {
        await chrome.tabs.remove(tab.id);

        if (useTabManagerStore.getState().isVivaldi) {
            fixVivaldiCloseTabsBug(tab);
        }
    } catch (error) {
        console.log("Error closing tab:", error);
    }
};

export const handleCloseTabs = async (e: React.MouseEvent, tabs: Tab[]) => {
    e.stopPropagation();
    // Handle closing the active tab by finding the next tab to activate
    // If the tab is not active, just close it
    for (const tab of tabs) {
        chrome.tabs.remove(tab.id);
    }

    if (useTabManagerStore.getState().isVivaldi) {
        fixVivaldiCloseTabsBug(tabs[tabs.length - 1]);
    }

    useSelectionStore.getState().actions.clearSelection();
};

function fixVivaldiCloseTabsBug(tab: Tab) {
    // fixing vivaldi bug with no active tab being shown when closing from sharp tabs
    setTimeout(async () => {
        // Query for active tab in the current window
        const activeTabArr = await chrome.tabs.query({ active: true, windowId: tab?.windowId || chrome.windows.WINDOW_ID_CURRENT });

        // If there is no active tab
        if (activeTabArr.length === 0) {
            // Find the tab above the one closed and activate it
            const tabsArr = await chrome.tabs.query({ windowId: tab?.windowId || chrome.windows.WINDOW_ID_CURRENT });

            const newActiveIndex = tabsArr.findIndex((_tab) => _tab.index === tab.index - 1);

            // If there is no tab above the one closed, find the tab below and activate it
            if (newActiveIndex !== -1) {
                chrome.tabs.update(tabsArr[newActiveIndex].id ?? 0, { active: true });
            } else {
                chrome.tabs.update(tabsArr[tabsArr.length - 1].id ?? 0, { active: true });
            }
        }
    }, 80);
}

export const handleCloseTabsBelow = async (e: React.MouseEvent, tab: Tab) => {
    e.stopPropagation();
    try {
        // Get all tabs in the current window
        const allTabs = await chrome.tabs.query({ currentWindow: true });

        // Find tabs below the current tab (higher index)
        const tabsBelow = allTabs.filter((t) => t.index > tab.index);

        if (tabsBelow.length === 0) {
            return; // No tabs below to close
        }

        // Get the tab IDs to close
        const tabIdsToClose = tabsBelow.map((t) => t.id).filter((id) => id !== undefined) as number[];

        // Close all tabs below
        await chrome.tabs.remove(tabIdsToClose);
    } catch (error) {
        console.log("Error closing tabs below:", error);
    }
};

export const handleCloseOtherTabs = async (e: React.MouseEvent, tab?: Tab, tabs?: Tab[], group?: TabGroup) => {
    e?.stopPropagation();
    try {
        // Get all tabs in the current window
        const allTabs = await chrome.tabs.query({ currentWindow: true });

        // Create a set of tab IDs to keep (pinned tabs + selected tabs/group)
        const tabIdsToKeep = new Set<number>();

        // Always keep pinned tabs
        allTabs.filter((t: chrome.tabs.Tab) => t.pinned).forEach((t: chrome.tabs.Tab) => t.id && tabIdsToKeep.add(t.id));

        // Add tabs to keep based on what was passed
        if (group) {
            // Keep all tabs in the group
            group.tabs.forEach((t) => tabIdsToKeep.add(t.id));
        } else if (tabs && tabs.length > 0) {
            // Keep all selected tabs
            tabs.forEach((t) => tabIdsToKeep.add(t.id));
        } else if (tab) {
            // Keep the single tab
            tabIdsToKeep.add(tab.id);
        }

        // Find tabs to close (all others except the ones we want to keep)
        const tabsToClose = allTabs.filter((t: chrome.tabs.Tab) => t.id && !tabIdsToKeep.has(t.id));

        if (tabsToClose.length === 0) {
            return; // No tabs to close
        }

        // Get the tab IDs to close
        const tabIdsToClose = tabsToClose.map((t) => t.id).filter((id) => id !== undefined) as number[];

        // Close all other tabs
        await chrome.tabs.remove(tabIdsToClose);
    } catch (error) {
        console.log("Error closing other tabs:", error);
    }
};

export const handleAddToNewGroup = async (title: string, color: ColorEnum, tabId: number[]) => {
    try {
        const group = await chromeTabsGroup([...tabId], { windowId: chrome.windows.WINDOW_ID_CURRENT });
        await chrome.tabGroups.update(group, { title, color });
        // unselect all tabs
        useSelectionStore.getState().actions.clearSelection();
        // toast.success("Tab added to new group");
    } catch (error) {
        console.log("Error creating new group:", error);
    }
};

export const handleAddToExistingGroup = async (groupId: number, tabId: number[]) => {
    try {
        const groupTabs = await chrome.tabs.query({ groupId });
        const maxIndex = groupTabs.length > 0 ? Math.max(...groupTabs.map((t) => t.index)) : -1;
        await chrome.tabs.group({ tabIds: [...tabId], groupId });
        if (maxIndex !== -1) {
            await chrome.tabs.move(tabId[0], { index: maxIndex + 1 });
        }
        // toast.success("Tab added to existing group");
    } catch (error) {
        console.log("Error adding to existing group:", error);
    }
};

export const handleRemoveFromGroup = async (e: React.MouseEvent, tab: Tab) => {
    e.stopPropagation();
    try {
        // Get the current group's tabs to find the last index
        const groupTabs = await chrome.tabs.query({ groupId: tab.groupId });
        const lastGroupTabIndex = Math.max(...groupTabs.map((t) => t.index));

        // Ungroup the tab
        await chrome.tabs.ungroup(tab.id);

        // Move the tab to just after the group
        await chrome.tabs.move(tab.id, { index: lastGroupTabIndex });
    } catch (error) {
        console.log("Error removing from group:", error);
    }
};

// Suspend tabs using native chrome.tabs.discard()
export async function handleSuspendTab(e: React.MouseEvent, ids: Set<number>) {
    e.stopPropagation();
    const tabIds = Array.from(ids);

    console.log(`[Suspend] handleSuspendTab called with ${tabIds.length} tab(s):`, tabIds);

    // Get all tabs to have access to full tab data for each selected tab
    const allTabs = await chrome.tabs.query({ currentWindow: true });
    const tabsToSuspend = allTabs.filter((t) => tabIds.includes(t.id ?? 0) && !isNewTab(t));

    console.log(`[Suspend] Found ${tabsToSuspend.length} tab(s) to suspend`);

    if (tabsToSuspend.length === 0) return;

    const tabIdsToDiscard = tabsToSuspend.map((t) => t.id).filter((id): id is number => typeof id === "number");

    await discardTabsNativelySafely(tabIdsToDiscard, { windowId: tabsToSuspend[0]?.windowId });
}

// TODO $$: Fix reopening close tab later. It's currently broken and only restores the last closed tab. Hid this feature in the app.
// We need to save the last closed tabs in a stack, then pop + restore each one
export async function handleReopenClosedTab(e: React.MouseEvent, tab: Tab) {
    e.stopPropagation();
    try {
        chrome.sessions.getRecentlyClosed({ maxResults: 1 }, async (sessions) => {
            console.log("sessions", sessions);
            if (sessions.length > 0 && sessions[0].tab != null) {
                await chrome.tabs.create({
                    url: sessions[0].tab.url,
                    index: sessions[0].tab.index,
                    active: true,
                    windowId: chrome.windows.WINDOW_ID_CURRENT,
                });
                await chrome.tabs.group({ groupId: sessions[0].tab.groupId, tabIds: [tab.id] });
            }
        });
    } catch (error) {
        console.log("Error reopening closed tab:", error);
    }
}
