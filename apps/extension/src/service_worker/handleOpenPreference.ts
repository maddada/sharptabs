export async function handleOpenPreference(openPreference: "sidepanel" | "popup") {
    if (openPreference === "sidepanel") {
        console.log("Opening side panel");
        try {
            chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.log(error));
            console.log("Side panel opened");
        } catch (error) {
            console.log("Error opening side panel:", error);
        }
    } else {
        console.log("Opening popup");
        try {
            await chrome.action.setPopup({ popup: "popup.html" });
            await chrome.action.openPopup();
            console.log("Popup window opened");
        } catch (error: any) {
            // if (error.includes("Failed to open popup")) return;
            console.log("Error opening popup window", error);
        }
    }
}
