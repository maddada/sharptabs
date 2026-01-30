export function isNewTab(_tab: chrome.tabs.Tab): boolean {
    return (
        _tab.url === "chrome://newtab/" ||
        _tab.url === "about:blank" ||
        _tab.url?.includes("://newtab") ||
        _tab.url?.includes("://new-tab-page") ||
        _tab.url?.includes("vivaldi://startpage") ||
        _tab.url?.includes("vivaldi://vivaldi-webui/startpage") ||
        !_tab.url ||
        _tab.url === ""
    );
}
