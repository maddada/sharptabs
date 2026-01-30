import { Tab } from "@/types/Tab";

export const mapChromeTabToTab = (tab: chrome.tabs.Tab): Tab => ({
    id: tab.id ?? 0,
    title: tab.title ?? "",
    url: tab.url ?? "",
    pinned: tab.pinned ?? false,
    groupId: tab.groupId ?? -1,
    index: tab.index, // Keep the original Chrome index
    favIconUrl: tab.favIconUrl,
    audible: tab.audible ?? false,
    mutedInfo: { muted: tab.mutedInfo?.muted ?? false },
    discarded: tab.discarded ?? false,
    frozen: tab.frozen ?? false,
    status: tab.status,
    autoDiscardable: tab.autoDiscardable ?? false,
    active: tab.active ?? false,
});
