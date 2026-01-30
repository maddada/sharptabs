import { useSettingsStore } from "@/stores/settingsStore";
import { ItemType } from "@/types/CombinedItem";
import { isNewTab } from "@/utils/tabs/isNewTab";
import { useEffect } from "react";
import { loadTabs } from "../helpers/loadTabs";
import { parseDndId } from "../helpers/dragAndDrop/parseDndId";

export function useTabEventListeners({
    expandAndScrollToActiveTab,
    setActiveTabId,
    setActiveDndId,
    activeDndId,
}: {
    expandAndScrollToActiveTab: (fromButton?: boolean, tabId?: number) => void;
    setActiveTabId: (id: number) => void;
    setActiveDndId: (id: string | null) => void;
    activeDndId: string | null;
}) {
    useEffect(() => {
        loadTabs("initial load"); // Load tabs on initial mount

        const tabUpdatedListener = (_tabId: number, changeInfo: chrome.tabs.TabChangeInfo, _tab: chrome.tabs.Tab) => {
            // Check if the change affects order, grouping, pinning, or visual state
            if (
                "pinned" in changeInfo ||
                "groupId" in changeInfo ||
                "index" in changeInfo ||
                "url" in changeInfo ||
                "favIconUrl" in changeInfo ||
                "title" in changeInfo ||
                "discarded" in changeInfo ||
                "frozen" in changeInfo ||
                "status" in changeInfo ||
                "audible" in changeInfo ||
                "mutedInfo" in changeInfo ||
                changeInfo.status // Reload/discard status
            ) {
                // Only reload if not actively dragging to avoid disrupting the drag
                if (!activeDndId) {
                    console.log("tabs info updated, Ran loadTabs. changeInfo: ", changeInfo);
                    loadTabs("tabs info updated. changeInfo: " + JSON.stringify(changeInfo)); // Reload on tab update
                } else {
                    console.log("tabs info updated BUT DIDN'T RUN LOADTABS!!! changeInfo: ", changeInfo);
                }
            }
        };

        const tabMovedListener = (_tabId: number, _moveInfo: chrome.tabs.TabMoveInfo) => {
            if (!activeDndId) loadTabs("tab moved");
        };

        const tabAttachedListener = (_tabId: number, _attachInfo: chrome.tabs.TabAttachInfo) => {
            if (!activeDndId) {
                loadTabs(`tab ${_tabId} attached`);
            }
        };

        const tabDetachedListener = async (_tabId: number, _detachInfo: chrome.tabs.TabDetachInfo) => {
            if (!activeDndId) {
                loadTabs(`tab ${_tabId} detached`);
            }

            // Check if the old window should be closed after tab was detached (moved to another window)
            const currentSettings = useSettingsStore.getState().settings;
            if (currentSettings.closeWindowWhenLastTabClosed) {
                try {
                    // Query remaining tabs in the old window
                    const remainingTabs = await chrome.tabs.query({ windowId: _detachInfo.oldWindowId });

                    // If no tabs remain in the window, close it
                    if (remainingTabs.length === 0) {
                        console.log(`Window ${_detachInfo.oldWindowId} has no tabs left after detach, closing window`);
                        await chrome.windows.remove(_detachInfo.oldWindowId);
                    }
                } catch (error) {
                    // Handle errors gracefully - window might already be closed or other issues
                    console.log("Error checking/closing empty window after detach:", error);
                }
            }
        };

        const tabCreatedListener = async (_tab: chrome.tabs.Tab) => {
            if (!activeDndId) {
                loadTabs(`tab ${_tab.id} created`);

                // Check if "Ensure only 1 new tab available" setting is enabled
                const currentSettings = useSettingsStore.getState().settings;
                if (currentSettings.ensureOnlyOneNewTab && _tab.id && isNewTab(_tab)) {
                    setTimeout(async () => {
                        // Check if the newly created tab is a "new tab"
                        try {
                            // Get all tabs in the current window
                            const allTabs = await chrome.tabs.query({ windowId: _tab.windowId });

                            // Find all other new tabs (excluding the one just created)
                            const otherNewTabs = allTabs.filter((otherTab) => {
                                return isNewTab(otherTab) && otherTab.id !== _tab.id;
                            });

                            // Close all other new tabs
                            if (otherNewTabs.length > 0) {
                                const tabIdsToClose = otherNewTabs.map((tab) => tab.id ?? 0);
                                console.log(`Closing ${otherNewTabs.length} other new tabs:`, tabIdsToClose);
                                await chrome.tabs.remove(tabIdsToClose);
                            }
                        } catch (error) {
                            console.log("Error closing other new tabs:", error);
                        }
                    }, 2000);
                }

                setTimeout(async () => {
                    if ((window as any).isAutoOrganizing === true) return;

                    console.log("expandAndScrollToActiveTab in tabCreatedListener", _tab.id);
                    try {
                        const tabExists = await chrome.tabs.get(_tab.id ?? 0);
                        if (tabExists) {
                            expandAndScrollToActiveTab(false, _tab.id ?? 0);
                        }
                    } catch (error) {
                        // tab doesn't exist so don't expand and scroll to it (might be created by utils/tabs/chromeTabsGroup)
                        console.info("tab doesn't exist so don't expand and scroll to it in tabCreatedListener", _tab.id, error);
                    }
                }, 300);
            }
        };

        const tabRemovedListener = async (_tabId: number, _removeInfo: chrome.tabs.TabRemoveInfo) => {
            if (!activeDndId) loadTabs(`tab ${_tabId} removed`);

            // If the removed tab was the active drag item, cancel the drag
            const parsed = parseDndId(activeDndId ?? "");
            if (
                parsed &&
                (parsed.type === ItemType.GTAB ||
                    parsed.type === ItemType.PINNED ||
                    parsed.type === ItemType.CPINNED ||
                    parsed.type === ItemType.REGULAR) &&
                parsed.id === _tabId
            ) {
                setActiveDndId(null);
            }

            // Check if this was the last tab in the window and close the window if so (only if setting is enabled)
            const currentSettings = useSettingsStore.getState().settings;
            if (currentSettings.closeWindowWhenLastTabClosed) {
                try {
                    // Only proceed if the window isn't already being closed
                    if (!_removeInfo.isWindowClosing) {
                        // Query remaining tabs in the window
                        const remainingTabs = await chrome.tabs.query({ windowId: _removeInfo.windowId });

                        // If no tabs remain in the window, close it
                        if (remainingTabs.length === 0) {
                            console.log(`Window ${_removeInfo.windowId} has no tabs left, closing window`);
                            await chrome.windows.remove(_removeInfo.windowId);
                        }
                    }
                } catch (error) {
                    // Handle errors gracefully - window might already be closed or other issues
                    console.log("Error checking/closing empty window:", error);
                }
            }
        };

        const tabActivatedListener = async (_activeInfo: chrome.tabs.TabActiveInfo) => {
            setActiveTabId(_activeInfo.tabId);
            const tab = await chrome.tabs.get(_activeInfo.tabId);

            // Don't scroll if dragging
            if (!activeDndId) {
                setTimeout(async () => {
                    try {
                        // Don't scroll if the group has more than 10 tabs
                        if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
                            const groupTabs = await chrome.tabs.query({ groupId: tab.groupId });
                            if (groupTabs.length > 10) {
                                // Don't scroll if the group has more than 10 tabs
                                return;
                            }
                        }
                        console.log("expandAndScrollToActiveTab in tabActivatedListener", _activeInfo.tabId);
                        expandAndScrollToActiveTab(false, _activeInfo.tabId);
                    } catch (error) {
                        console.log("expandAndScrollToActiveTab in tabActivatedListener error", _activeInfo.tabId, error);
                        // If there's an error getting tab info, still scroll as fallback
                        expandAndScrollToActiveTab(false, _activeInfo.tabId);
                    }
                }, 200);
            }
        };

        const groupUpdatedListener = (_group: chrome.tabGroups.TabGroup) => {
            if (!activeDndId) loadTabs("group updated"); // Reload on group title/color change
            const parsed = parseDndId(activeDndId ?? "");
            if (parsed && parsed.type === ItemType.GROUP && parsed.id === _group.id) {
                // Potentially update drag overlay if needed, or just reload if drag ends
            }
        };

        const groupMovedListener = (_group: chrome.tabGroups.TabGroup) => {
            if (!activeDndId) loadTabs("group moved"); // Reload when a group is moved
        };

        chrome.tabs.onAttached.addListener(tabAttachedListener);
        chrome.tabs.onDetached.addListener(tabDetachedListener);
        chrome.tabs.onUpdated.addListener(tabUpdatedListener);
        chrome.tabs.onMoved.addListener(tabMovedListener);
        chrome.tabs.onCreated.addListener(tabCreatedListener);
        chrome.tabs.onRemoved.addListener(tabRemovedListener);
        chrome.tabs.onActivated.addListener(tabActivatedListener);
        chrome.tabGroups.onUpdated.addListener(groupUpdatedListener);
        chrome.tabGroups.onMoved.addListener(groupMovedListener);

        return () => {
            chrome.tabs.onUpdated.removeListener(tabUpdatedListener);
            chrome.tabs.onMoved.removeListener(tabMovedListener);
            chrome.tabs.onCreated.removeListener(tabCreatedListener);
            chrome.tabs.onRemoved.removeListener(tabRemovedListener);
            chrome.tabs.onActivated.removeListener(tabActivatedListener);
            chrome.tabGroups.onUpdated.removeListener(groupUpdatedListener);
            chrome.tabGroups.onMoved.removeListener(groupMovedListener);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
