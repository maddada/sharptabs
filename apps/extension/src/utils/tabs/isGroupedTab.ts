import { Tab } from "@/types/Tab";

export const isGroupedTab = (tab: Tab): boolean => {
    return tab.groupId !== undefined && tab.groupId !== null && tab.groupId !== -1;
};
