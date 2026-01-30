export async function updateTabCount() {
    const tabs = await chrome.tabs.query({});
    const count = tabs.length;
    if (count !== 0) {
        await chrome.action.setBadgeText({ text: count.toString() });
        await chrome.action.setBadgeBackgroundColor({ color: "#1d4ed8" });
    }
}
