import { create } from "zustand";
import { Settings } from "../types/Settings";

// Function to get the appropriate default new tab link based on browser
export const getDefaultNewTabLink = async (): Promise<string> => {
    try {
        const currentWindow = await chrome.windows.getCurrent();
        const isVivaldi = !!(currentWindow as any)["vivExtData"];
        return isVivaldi ? "chrome://vivaldi-webui/startpage?section=Speed-dials&background-color=#1f1f1f" : "chrome://newtab";
    } catch {
        return "chrome://newtab";
    }
};

export const defaultSettings: Settings = {
    themeType: "dark",
    theme: "gray",
    groupBgOpacity: 40,

    backgroundEnabled: false,
    backgroundImageEnabled: true,
    backgroundColor: "radial-gradient(circle, rgba(20,54,79,1) 0%, RGBA(1,5,7,1) 76%)",

    newTabBackgroundEnabled: false,
    newTabBackgroundImageEnabled: true,
    newTabBackgroundColor: "linear-gradient(110deg, rgba(7,9,11,1) 0%, RGB(13, 49, 84) 100%)",

    backgroundImageOpacity: 0.7,
    backgroundImageSaturation: 0.9,
    backgroundImageBlur: 32,
    backgroundImageHue: 0,
    backgroundImageContrast: 1,
    backgroundImageSize: 790,
    backgroundImagePositionX: 85,
    backgroundImagePositionY: 50,
    backgroundImageUrl: "https://images.pexels.com/photos/2156881/pexels-photo-2156881.jpeg?auto=compress&cs=tinysrgb&h=1500",

    newTabBackgroundImageOpacity: 0.65,
    newTabBackgroundImageSaturation: 0.65,
    newTabBackgroundImageBlur: 27,
    newTabBackgroundImageHue: 0,
    newTabBackgroundImageContrast: 1,
    newTabBackgroundImageSize: 390,
    newTabBackgroundImagePositionX: 100,
    newTabBackgroundImagePositionY: 100,
    newTabBackgroundImageUrl: "https://images.pexels.com/photos/2156881/pexels-photo-2156881.jpeg?auto=compress&cs=tinysrgb&h=1500",

    // Light theme background settings (light-friendly defaults: less blur, higher opacity)
    light_backgroundEnabled: false,
    light_backgroundColor: "radial-gradient(circle, rgba(200,220,240,1) 0%, rgba(240,245,250,1) 76%)",
    light_backgroundImageEnabled: true,
    light_backgroundImageUrl: "https://images.pexels.com/photos/2156881/pexels-photo-2156881.jpeg?auto=compress&cs=tinysrgb&h=1500",
    light_backgroundImageOpacity: 0.3,
    light_backgroundImageSaturation: 0.6,
    light_backgroundImageBlur: 40,
    light_backgroundImageHue: 0,
    light_backgroundImageContrast: 1,
    light_backgroundImageSize: 790,
    light_backgroundImagePositionX: 85,
    light_backgroundImagePositionY: 50,

    // Dark theme background settings (same as current dark defaults)
    dark_backgroundEnabled: false,
    dark_backgroundColor: "radial-gradient(circle, rgba(20,54,79,1) 0%, RGBA(1,5,7,1) 76%)",
    dark_backgroundImageEnabled: true,
    dark_backgroundImageUrl: "https://images.pexels.com/photos/2156881/pexels-photo-2156881.jpeg?auto=compress&cs=tinysrgb&h=1500",
    dark_backgroundImageOpacity: 0.7,
    dark_backgroundImageSaturation: 0.9,
    dark_backgroundImageBlur: 32,
    dark_backgroundImageHue: 0,
    dark_backgroundImageContrast: 1,
    dark_backgroundImageSize: 790,
    dark_backgroundImagePositionX: 85,
    dark_backgroundImagePositionY: 50,

    enableConsoleLogging: false,
    firstLaunchDone: true,
    fontSize: 14,
    tabHeight: 45,
    popupWidth: 500,
    showDiscardedIcon: false,
    showCloseButton: true,
    showTitleInTooltips: true,
    showUrlInTooltips: false,
    middleClickOpensNewTab: true,
    fadeSuspendedTabText: true,

    // hidden for now because (buggy in manifest/service worker)
    openPreference: "popup",

    outlineGroups: false,
    showDiscardedIconGroup: false,

    enableTabTextColor: false,
    animationSpeed: 1,
    tabTextColor: "#ffffff",
    enableGroupTextColor: false,
    groupTextColor: "#ffffff",
    backgroundForTabFavicon: false,
    faviconBackgroundColor: "rgba(255, 255, 255, 0.4)",
    shadowForTabFavicon: true,
    shadowColor: "rgba(0, 0, 0, 0.3)",
    showFaviconNotifications: true,
    savedSessions: [],
    customCss: "",
    enableCustomCss: false,
    groupsGradientBackground: true,
    showGroupTabCount: false,
    showGroupTitleTooltip: true,
    highlightHighTabCountEnabled: true,
    highlightHighTabCountThreshold: 20,

    aiAutoOrganizeTabs: true,
    aiAutoGroupNaming: true,
    aiAutoCleaner: true,
    geminiApiKey: "",

    autoOrganizePrompt: "",
    autoSuspendEnabled: false,
    autoSuspendMinutes: 20,
    autoSuspendExcludedDomains: [],
    autoSuspendPinnedTabs: false,
    autoSuspendPanelPages: false,
    enableSuspendingGroupedTabs: true,
    autoSaveSessionsEnabled: true,
    slowerRestoration: true,
    closeWindowWhenLastTabClosed: false,
    ensureOnlyOneNewTab: false,
    minimalNewTabsPage: true,
    seenMessages: [],
    keepChromeTabGroupsCollapsed: true,
    compactPinnedTabs: true,
    disableMiddleClickAndCloseButtonOnPinnedTabs: false,
    hidePinButtonOnPinnedTabs: false,
    headerFooterOpacity: 100,
    tabRoundness: 6,
    showScrollbar: false,
    alwaysShowScrollbar: false,
    tabItemContextMenu: [
        { id: "pinTab", type: "item", label: "Pin", visible: true },
        { id: "unpinTab", type: "item", label: "Unpin", visible: true },
        { id: "addToGroup", type: "item", label: "Add to Group", visible: true },
        { id: "moveToWorkspace", type: "item", label: "Move to Workspace", visible: true },
        { id: "moveToWindow", type: "item", label: "Move to Window", visible: true },
        { id: "separator-1", type: "separator", visible: true },
        { id: "suspendTab", type: "item", label: "Suspend ", visible: true },
        { id: "duplicateTab", type: "item", label: "Duplicate", visible: true },
        { id: "bookmarkTab", type: "item", label: "Bookmark", visible: true },
        { id: "separator-2", type: "separator", visible: true },
        { id: "close", type: "item", label: "Close", visible: true },
        { id: "reload", type: "item", label: "Reload", visible: false },
        { id: "separator-3", type: "separator", visible: false },
        { id: "copyUrl", type: "item", label: "Copy URL", visible: false },
        { id: "removeFromGroup", type: "item", label: "Remove from Group", visible: false },
        { id: "newTabBelow", type: "item", label: "New Tab Below", visible: false },
        { id: "closeTabsBelow", type: "item", label: "Close Tabs Below", visible: false },
        { id: "closeOtherTabs", type: "item", label: "Close Other Tabs", visible: false },
        { id: "exportWorkspaceDiagnostics", type: "item", label: "Export Workspaces", visible: true },
        { id: "exportWorkspaceStructure", type: "item", label: "Export Structure", visible: true },
        { id: "reloadExtension", type: "item", label: "Reload Extension", visible: true },
    ],
    groupItemContextMenu: [
        { id: "rename", type: "item", label: "Rename", visible: true },
        { id: "colorPicker", type: "item", label: "Change Color", visible: true },
        { id: "separator-1", type: "separator", visible: true },
        { id: "moveToWorkspace", type: "item", label: "Move to Workspace", visible: true },
        { id: "moveToWindow", type: "item", label: "Move to Window", visible: true },
        { id: "suspendAllTabs", type: "item", label: "Suspend", visible: true },
        { id: "bookmarkAll", type: "item", label: "Bookmark Group", visible: true },
        { id: "copyUrls", type: "item", label: "Copy URLs", visible: true },
        { id: "separator-2", type: "separator", visible: true },
        { id: "ungroupTabs", type: "item", label: "Ungroup", visible: true },
        { id: "closeGroup", type: "item", label: "Close", visible: true },
        { id: "closeOtherTabs", type: "item", label: "Close Other Tabs", visible: false },
    ],
    savedThemePreset: null,
    savedThemePresetLight: null,
    savedThemePresetDark: null,
    strictDuplicateChecking: false,
    duplicateCloseKeep: "first",

    // Disabled because people are uninstalling due to a warning about sharptabs hijacking the new tab page
    enableSharpTabsNewTabPage: false,

    newTabLink: "",
    showSearchBar: false,
    enableWorkspaces: false,
    searchInAllWorkspaces: true,
    sharePinnedTabsBetweenWorkspaces: false,
    separateActiveTabPerWorkspace: false,
    showNewTabButton: true,
    showNavigationButtons: true,
    showDuplicateTabsButton: true,
    autoCollapseHeaderButtons: true,
    headerDropdownMenu: [
        { id: "scrollToCurrentTab", type: "item", label: "Scroll to Current Tab", visible: true },
        { id: "separator-1", type: "separator", visible: true },
        { id: "saveSession", type: "item", label: "Save Session", visible: true },
        { id: "restoreSession", type: "item", label: "Restore Session", visible: true },
        { id: "suspendAll", type: "item", label: "Suspend All", visible: true },
        { id: "bulkOpenLinks", type: "item", label: "Bulk Open Links", visible: true },
        { id: "separator-2", type: "separator", visible: true },
        { id: "aiAutoGroup", type: "item", label: "AI Auto Group", visible: true },
        { id: "aiAutoClean", type: "item", label: "AI Auto Clean", visible: true },
        { id: "collapseExpandAll", type: "item", label: "Collapse/Expand All", visible: false },
        { id: "restoreClosed", type: "item", label: "Restore Closed", visible: false },
        { id: "ungroupAll", type: "item", label: "Ungroup All", visible: false },
        { id: "separator-3", type: "separator", visible: false },
        { id: "settings", type: "item", label: "Settings", visible: true },
    ],
    generalWorkspaceName: undefined,
    generalWorkspaceIcon: undefined,
    bulkOpenLinksBaseUrl: "",
    bulkOpenLinksTerms: "",
    bulkOpenLinksWorkspace: "",
    bulkOpenLinksHistory: [],
};

type SettingsStore = {
    settings: Settings;
    setSettings: (settings: Settings) => void;
    initChromeStoreToDefault: () => void;
    updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
    updateSettings: (newSettings: Partial<Settings>) => void;
};

export const useSettingsStore = create<SettingsStore>((set) => ({
    settings: defaultSettings,
    setSettings: (newSettings) => set({ settings: newSettings }),
    initChromeStoreToDefault: () => {
        chrome.storage.local.set(defaultSettings, () => {
            console.log("Chrome storage initialized with default settings.");
        });
    },
    updateSetting: (key, value) => {
        console.log("Update Setting Store and Chrome Store", key, value);
        set((state) => ({
            settings: {
                ...state.settings,
                [key]: value,
            },
        }));

        // Update the setting in Chrome storage to keep it in sync with settingsStore
        chrome.storage.local.set({
            [key]: value,
        });
    },
    updateSettings: (newSettings) => {
        set((state) => ({
            settings: {
                ...state.settings,
                ...newSettings,
            },
        }));

        // Update the setting in Chrome storage to keep it in sync with settingsStore
        chrome.storage.local.set(newSettings);
    },
}));
