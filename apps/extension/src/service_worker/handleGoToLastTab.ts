export async function handleGoToLastTab(tab: chrome.tabs.Tab) {
    const tabs = await chrome.tabs.query({ windowId: tab.windowId });
    const lastTab = tabs[tabs.length - 1];
    if (lastTab.id) {
        await chrome.tabs.update(lastTab.id, { active: true });
    }
}
