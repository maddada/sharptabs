export function isNewTab(_tab: chrome.tabs.Tab): boolean {
    const runtimeId = typeof chrome !== "undefined" ? chrome.runtime?.id : undefined;
    const isExtensionNewTab =
        !!runtimeId &&
        (_tab.url?.startsWith(`chrome-extension://${runtimeId}/newtab.html`) ||
            _tab.url?.startsWith(`edge-extension://${runtimeId}/newtab.html`));

    return (
        _tab.url === "chrome://newtab/" ||
        _tab.url === "about:blank" ||
        _tab.url?.includes("://newtab") ||
        _tab.url?.includes("://new-tab-page") ||
        _tab.url?.includes("about:newtab") ||
        isExtensionNewTab ||
        _tab.url?.includes("vivaldi://startpage") ||
        _tab.url?.includes("vivaldi://vivaldi-webui/startpage") ||
        _tab.url?.includes("chrome://vivaldi-webui/startpage") ||
        !_tab.url ||
        _tab.url === ""
    );
}
