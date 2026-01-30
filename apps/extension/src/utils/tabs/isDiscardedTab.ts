import { Tab } from "@/types/Tab";

export const isDiscardedTab = (tab: Tab) => tab.discarded || tab.frozen || tab.status === "unloaded";

export const isSuspendedByChrome = (tab: Tab) => tab.discarded || tab.frozen || tab.status === "unloaded";
