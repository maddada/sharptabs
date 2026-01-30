let isSidePanelOpen = false;

export async function handleOpenSidePanel(tab: chrome.tabs.Tab) {
    try {
        if (!isSidePanelOpen) {
            chrome.sidePanel.setOptions({
                enabled: true,
            });
            await chrome.sidePanel.open({
                windowId: tab.windowId,
            });
            isSidePanelOpen = true;
            console.log("Side panel opened");
        } else {
            await chrome.sidePanel.setOptions({
                enabled: false,
            });
            isSidePanelOpen = false;
            console.log("Side panel closed");
        }
    } catch (error) {
        console.log("Error opening side panel:", error);
    }
}
