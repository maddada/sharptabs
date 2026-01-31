import { Tab } from "@/types/Tab";
import { isNewTab } from "./isNewTab";

export const isSpecialBrowserTab = (tab: Tab) => {
    const specialProtocols = [
        "chrome://",
        "chrome-extension://",
        "about:",
        "edge://",
        "opera://",
        "brave://",
        "vivaldi://",
        "extension://",
        "edge-extension://",
    ];

    if (isNewTab(tab as chrome.tabs.Tab) || specialProtocols.some((protocol) => tab.url.startsWith(protocol))) {
        return true;
    }

    return false;
};
