import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSelectionStore } from "@/stores/selectionStore";
import { useTabManagerStore } from "@/stores/tabManagerStore";
import { Tab } from "@/types/Tab";
import { TabGroup } from "@/types/TabGroup";
import { moveGroupToNewWindow } from "@/utils/tabs/moveGroupToNewWindow";
import { useEffect, useState } from "react";
import { moveTabToNewWindow, moveTabToNewWindowMultiple } from "../tab-list-items/TabItemHandlers";
import { useTabsStore } from "@/stores/tabsStore";

interface WindowInfo {
    id: number;
    tabCount: number;
    title: string;
}

const handleWindowSelectGroup = async (group: TabGroup, windowId: number) => {
    try {
        if (windowId === -1) {
            // Moving to new window
            await moveGroupToNewWindow(group);
            return;
        }

        // 1. Save the group's title and color
        const groupTitle = group.title;
        const groupColor = group.color;

        // 2. Save the tabs inside the group (sorted by index to maintain order)
        const groupTabs = group.tabs.sort((a, b) => a.index - b.index);
        const tabIds = groupTabs.map((tab) => tab.id);

        // Store the current window ID before moving tabs
        const currentWindowId = (await chrome.windows.getCurrent()).id;

        // 3. Ungroup all the tabs in the group being moved
        await chrome.tabs.ungroup(tabIds);

        // 4. Move the tabs to the end of the other window (in the same order)
        // Get the current last index in the target window
        const targetWindowTabs = await chrome.tabs.query({ windowId: windowId });
        let targetIndex = targetWindowTabs.length;

        // Move tabs one by one to maintain order
        for (const tabId of tabIds) {
            await chrome.tabs.move(tabId, { windowId, index: targetIndex });
            targetIndex++; // Increment for next tab
        }

        // 5. Group them in the other window
        const newGroupId = await chrome.tabs.group({
            tabIds: tabIds,
            createProperties: { windowId },
        });

        // Set the group title and color
        await chrome.tabGroups.update(newGroupId, {
            title: groupTitle,
            color: groupColor,
        });

        // 6. Check if current window should be closed
        if (currentWindowId) {
            setTimeout(async () => {
                // Check if all remaining tabs are new tabs
                const remainingTabs = await chrome.tabs.query({ windowId: currentWindowId });
                const allNewTabs = remainingTabs.every((tab) => tab.url && tab.url.includes("://newtab"));

                if (allNewTabs && remainingTabs.length > 0) {
                    // Close the current window since all remaining tabs are new tabs
                    await chrome.windows.remove(currentWindowId);
                }
            }, 750);
        }

        // 7. Set the group as collapsed
        useTabsStore.getState().actions.setCollapsedGroups(new Set([...useTabsStore.getState().collapsedGroups, group.id]));
    } catch (error) {
        console.log("Error moving group to window:", error);
    }
};

const handleWindowSelectTab = async (tab: Tab, windowId: number) => {
    try {
        if (windowId === -1) {
            await moveTabToNewWindow(tab);
        } else {
            await chrome.tabs.move(tab.id, { windowId, index: -1 });
        }

        // Check if current window should be closed
        setTimeout(async () => {
            // Check if all remaining tabs are new tabs
            const remainingTabs = await chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });
            const allNewTabs = remainingTabs.every((tab) => tab.url && tab.url.includes("://newtab"));

            const currentWindowId = (await chrome.windows.getCurrent()).id;
            if (currentWindowId && allNewTabs) {
                await chrome.windows.remove(currentWindowId);
            }
        }, 750);
    } catch (error) {
        console.log("Error moving tab to window:", error);
    }
};

const handleWindowSelectTabs = async (tabs: Tab[], windowId: number) => {
    try {
        if (windowId === -1) {
            await moveTabToNewWindowMultiple(tabs);
        } else {
            for (const tab of tabs) {
                await chrome.tabs.move(tab.id, { windowId, index: -1 });
            }
        }

        // Check if current window should be closed
        setTimeout(async () => {
            // Check if all remaining tabs are new tabs
            const remainingTabs = await chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });
            const allNewTabs = remainingTabs.every((tab) => tab.url && tab.url.includes("://newtab"));

            const currentWindowId = (await chrome.windows.getCurrent()).id;
            if (currentWindowId && allNewTabs) {
                await chrome.windows.remove(currentWindowId);
            }
        }, 750);
    } catch (error) {
        console.log("Error moving tabs to window:", error);
    }
};

export function WindowSelectionDialog() {
    const isOpen = useTabManagerStore((s) => s.isWindowSelectionDialogOpen);
    const { closeWindowSelectionDialog } = useTabManagerStore((s) => s.actions);
    const group = useTabManagerStore((s) => s.windowSelectionDialogGroup);
    const tab = useTabManagerStore((s) => s.windowSelectionDialogTab);
    const tabs = useTabManagerStore((s) => s.windowSelectionDialogTabs);

    const [windows, setWindows] = useState<WindowInfo[]>([]);
    const [currentWindowId, setCurrentWindowId] = useState<number | null>(null);

    useEffect(() => {
        const loadWindows = async () => {
            // Get current window ID
            const currentWindow = await chrome.windows.getCurrent();
            setCurrentWindowId(currentWindow.id ?? null);

            // Get all windows
            const allWindows = (await chrome.windows.getAll({ populate: true })).filter((window) => window.type === "normal");

            // Transform windows into WindowInfo format
            let windowInfos = allWindows.map((window) => ({
                id: window.id ?? -1,
                tabCount: window.tabs?.length ?? 0,
                // Use the title of the active tab as the window title
                title: window.tabs?.find((tab) => tab.active)?.title || "Window",
            }));

            // Sort so current window is first
            windowInfos.sort((a, b) => {
                if (a.id === currentWindow.id) return -1;
                if (b.id === currentWindow.id) return 1;
                return 0;
            });

            // Remove current window
            windowInfos = windowInfos.filter((window) => window.id !== currentWindow.id);

            windowInfos.push({
                id: -1,
                tabCount: currentWindow.tabs?.length ?? 0,
                title: "New Window",
            });

            setWindows(windowInfos);
        };

        if (isOpen) {
            loadWindows();
        }
    }, [isOpen]);

    return (
        <Dialog
            modal={true}
            open={isOpen}
            onOpenChange={(newOpen) => {
                if (!newOpen) {
                    return;
                }
            }}
        >
            <DialogContent
                id="window-selection-dialog"
                aria-describedby={undefined}
                className="max-w-[calc(100vw-2rem)] rounded-lg px-4 sm:w-[400px] sm:max-w-[calc(100vw-2rem)] sm:px-6"
                onKeyDown={(e) => {
                    if (e.key === "Escape") {
                        closeWindowSelectionDialog();
                    }
                }}
                onInteractOutside={(e) => {
                    e.preventDefault();
                    closeWindowSelectionDialog();
                }}
            >
                <style>{`button:has(> svg.lucide-x) { display: none; }`}</style>
                <DialogHeader>
                    <DialogTitle>Select Window</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-2 py-4">
                    {windows.map((window) => (
                        <Button
                            key={window.id}
                            variant={window.id !== -1 ? "secondary" : "outline"}
                            className="max-w-full justify-between text-left"
                            onClick={() => {
                                if (group) {
                                    handleWindowSelectGroup(group, window.id);
                                } else if (tab) {
                                    handleWindowSelectTab(tab, window.id);
                                } else if (tabs) {
                                    handleWindowSelectTabs(tabs, window.id);
                                }
                                useSelectionStore.getState().actions.clearSelection();
                                closeWindowSelectionDialog();
                            }}
                        >
                            <div className="truncate">
                                {window.id === currentWindowId ? "Current Window: " : ""}
                                {window.id === -1 ? "New Window" : `${window.tabCount} ${window.tabCount === 1 ? "Tab Window" : "Tabs Window"}`}
                            </div>
                        </Button>
                    ))}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={closeWindowSelectionDialog}>
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
