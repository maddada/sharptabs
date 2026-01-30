export async function handleOpenPopup(tab: chrome.tabs.Tab) {
    try {
        await chrome.action.setPopup({ tabId: tab.id, popup: "popup.html" });
        await chrome.windows.update(tab.windowId, { focused: true });
        await chrome.action.openPopup({
            windowId: tab.windowId,
        });
        setTimeout(() => {
            chrome.action.setPopup({ popup: "" });
        }, 1000);
        console.log("Popup window opened");
    } catch (error: any) {
        // if (error.includes("Failed to open popup")) return;
        console.log("Error opening popup window", error);
    }
}
