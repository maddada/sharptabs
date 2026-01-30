/// <reference types="chrome"/>

declare global {
    interface Window {
        chrome: typeof chrome;
        chromeTabs: chrome.tabs.Tab[];
        useSettingsStore: typeof useSettingsStore;
        useTabManagerStore: typeof useTabManagerStore;
        useTabsStore: typeof useTabsStore;
        useSelectionStore: typeof useSelectionStore;
        useGroupsStore: typeof useGroupsStore;
    }
}

export {};
