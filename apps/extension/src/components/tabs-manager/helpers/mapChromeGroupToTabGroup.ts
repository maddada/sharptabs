import { Tab } from "@/types/Tab";
import { TabGroup } from "@/types/TabGroup";

export const mapChromeGroupToTabGroup = (group: chrome.tabGroups.TabGroup, tabs: Tab[]): TabGroup => ({
    id: group.id,
    title: group.title || "Unnamed Group",
    color: group.color as any,
    tabs,
    index: tabs.length > 0 ? tabs[0].index : -1,
});
