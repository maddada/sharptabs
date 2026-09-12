type TabBlock = { type: "group"; groupId: number; tabCount: number } | { type: "tabs"; tabIds: number[] };

function getUnpinnedTabBlocks(tabs: chrome.tabs.Tab[]): TabBlock[] {
    const blocks: TabBlock[] = [];

    for (const tab of tabs) {
        if (tab.pinned || typeof tab.id !== "number") continue;

        if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
            const previousBlock = blocks.at(-1);
            if (previousBlock?.type === "group" && previousBlock.groupId === tab.groupId) {
                previousBlock.tabCount += 1;
            } else {
                blocks.push({ type: "group", groupId: tab.groupId, tabCount: 1 });
            }
            continue;
        }

        const previousBlock = blocks.at(-1);
        if (previousBlock?.type === "tabs") {
            previousBlock.tabIds.push(tab.id);
        } else {
            blocks.push({ type: "tabs", tabIds: [tab.id] });
        }
    }

    return blocks;
}

export async function mergeAllWindows(): Promise<number> {
    const currentWindow = await chrome.windows.getCurrent();
    if (typeof currentWindow.id !== "number" || currentWindow.type !== "normal") {
        throw new Error("SharpTabs is not attached to a normal browser window.");
    }

    const windows = await chrome.windows.getAll({
        populate: true,
        windowTypes: ["normal"],
    });
    const sourceWindows = windows.filter((window) => window.id !== currentWindow.id);
    const currentTabs = currentWindow.tabs ?? (await chrome.tabs.query({ windowId: currentWindow.id }));
    let targetPinnedTabCount = currentTabs.filter((tab) => tab.pinned).length;
    let mergedTabCount = 0;

    for (const sourceWindow of sourceWindows) {
        if (typeof sourceWindow.id !== "number") continue;

        const tabs = [...(sourceWindow.tabs ?? (await chrome.tabs.query({ windowId: sourceWindow.id })))].sort(
            (firstTab, secondTab) => firstTab.index - secondTab.index
        );
        const pinnedTabIds = tabs
            .filter((tab) => tab.pinned)
            .map((tab) => tab.id)
            .filter((tabId): tabId is number => typeof tabId === "number");

        if (pinnedTabIds.length > 0) {
            await chrome.tabs.move(pinnedTabIds, {
                windowId: currentWindow.id,
                index: targetPinnedTabCount,
            });
            targetPinnedTabCount += pinnedTabIds.length;
            mergedTabCount += pinnedTabIds.length;
        }

        for (const block of getUnpinnedTabBlocks(tabs)) {
            if (block.type === "group") {
                await chrome.tabGroups.move(block.groupId, {
                    windowId: currentWindow.id,
                    index: -1,
                });
                mergedTabCount += block.tabCount;
            } else {
                await chrome.tabs.move(block.tabIds, {
                    windowId: currentWindow.id,
                    index: -1,
                });
                mergedTabCount += block.tabIds.length;
            }
        }
    }

    return mergedTabCount;
}
