import { TabGroup } from "@/types/TabGroup";

export const moveGroupToNewWindow = async (group: TabGroup) => {
    // If there's only one window, create a new one and move the group there
    const newWindow = await chrome.windows.create({});
    if (group.tabs.length > 1) {
        await chrome.tabGroups.move(group.id, { windowId: newWindow.id, index: 0 });
    }

    // close the empty new tab that's created when the window is created
    const tabs = await chrome.tabs.query({ windowId: newWindow.id });
    for (const tab of tabs) {
        if (tab.groupId === -1) {
            chrome.tabs.remove(tab.id ?? 0);
        }
    }
};
