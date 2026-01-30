export async function chromeTabsGroup(tabIds: number[], createProperties: chrome.tabs.CreateProperties) {
    const createdGroupId = await chrome.tabs.group({
        tabIds: [...tabIds],
        createProperties: { windowId: createProperties.windowId },
    });
    return createdGroupId;
}
