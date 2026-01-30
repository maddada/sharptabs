import { useTabManagerStore } from "@/stores/tabManagerStore";
import { ColorEnum, TabGroup } from "@/types/TabGroup";
import { moveGroupToNewWindow } from "@/utils/tabs/moveGroupToNewWindow";
import { discardTabsNativelySafely } from "@/utils/tabs/discardTabsNativelySafely";
import { isNewTab } from "@/utils/tabs/isNewTab";
import { toast } from "sonner";

export const handleColorChange = async (color: ColorEnum, group: TabGroup) => {
    try {
        await chrome.tabGroups.update(group.id, { color });
    } catch (error) {
        console.log("Error changing group color:", error);
    }
};

export const handleDiscardAllTabs = async (group: TabGroup) => {
    try {
        console.log(`[Suspend] handleDiscardAllTabs called for group "${group.title}"`);

        const tabsToSuspend = group.tabs.filter((tab) => !isNewTab({ url: tab.url } as chrome.tabs.Tab));

        console.log(`[Suspend] Found ${tabsToSuspend.length} tab(s) to suspend in group`);

        if (tabsToSuspend.length === 0) return;

        const tabIdsToDiscard = tabsToSuspend.map((t) => t.id).filter((id): id is number => typeof id === "number");
        await discardTabsNativelySafely(tabIdsToDiscard, { windowId: group.tabs[0]?.windowId });
    } catch (error) {
        console.log("Error discarding tabs:", error);
    }
};

export const handleUngroupTabs = async (group: TabGroup) => {
    try {
        await chrome.tabs.ungroup(group.tabs.map((tab) => tab.id));
    } catch (error) {
        console.log("Error ungrouping tabs:", error);
    }
};

export const handleCloseGroup = async (group: TabGroup) => {
    try {
        await chrome.tabs.remove(group.tabs.map((tab) => tab.id));
    } catch (error) {
        console.log("Error closing group:", error);
    }
};

export const handleBookmarkAll = async (group: TabGroup) => {
    try {
        const permission = await chrome.permissions.request({ permissions: ["bookmarks"] });
        console.log("permission", permission);
        if (permission) {
            const folder = await chrome.bookmarks.create({
                title: group.title || "Group",
                parentId: "1",
            });

            for (const tab of group.tabs) {
                await chrome.bookmarks.create({
                    parentId: folder.id,
                    title: tab.title,
                    url: tab.url,
                });
            }
        }
        toast.success("Bookmarked Tab Group on Bookmarks Bar");
    } catch (error) {
        toast.error("Error bookmarking tabs");
        console.log("Error bookmarking tabs:", error);
    }
};

export const handleMoveGroupToAnotherWindow = async (group: TabGroup, setIsWindowSelectionDialogOpen: (isOpen: boolean) => void) => {
    try {
        const { setWindowSelectionDialogGroup } = useTabManagerStore.getState().actions;

        const windows = (await chrome.windows.getAll()).filter((window) => window.type === "normal");

        if (windows.length <= 1) {
            await moveGroupToNewWindow(group);
        } else {
            setWindowSelectionDialogGroup(group);
            setIsWindowSelectionDialogOpen(true);
        }
    } catch (error) {
        console.log("Error moving group to new window:", error);
    }
};

export const handleCopyUrls = async (group: TabGroup) => {
    try {
        const urls = group.tabs.map((tab) => tab.url).join("\n");
        await navigator.clipboard.writeText(urls);
    } catch (error) {
        console.log("Error copying URLs:", error);
    }
};
