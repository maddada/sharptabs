import { Tab } from "@/types/Tab";

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

    if (tab.url.includes("://newtab") || specialProtocols.some((protocol) => tab.url.startsWith(protocol))) {
        return true;
    }

    return false;
};
