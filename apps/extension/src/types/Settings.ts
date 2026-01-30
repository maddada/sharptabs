import { SavedSession } from "./SavedSession";

export type Settings = {
    enableConsoleLogging: boolean;
    firstLaunchDone: boolean;
    themeType: "light" | "dark" | "system";
    theme: "blue" | "gray" | "red" | "rose" | "orange" | "yellow" | "green" | "violet";
    popupWidth: number;
    fontSize: number;
    tabHeight: number;
    showDiscardedIcon: boolean;
    showCloseButton: boolean;
    showTitleInTooltips: boolean;
    showUrlInTooltips: boolean;
    middleClickOpensNewTab: boolean;
    fadeSuspendedTabText: boolean;
    openPreference: "popup" | "sidepanel";
    outlineGroups: boolean;
    showDiscardedIconGroup: boolean;
    groupBgOpacity: number;

    backgroundEnabled: boolean;
    backgroundColor: string | null;

    newTabBackgroundEnabled: boolean;
    newTabBackgroundColor: string | null;

    backgroundImageEnabled: boolean;
    backgroundImageUrl: string | null;
    backgroundImageOpacity: number;
    backgroundImageSaturation: number;
    backgroundImageBlur: number;
    backgroundImageHue: number;
    backgroundImageContrast: number;
    backgroundImageSize: number;
    backgroundImagePositionX: number;
    backgroundImagePositionY: number;

    newTabBackgroundImageEnabled: boolean;
    newTabBackgroundImageUrl: string | null;
    newTabBackgroundImageOpacity: number;
    newTabBackgroundImageSaturation: number;
    newTabBackgroundImageBlur: number;
    newTabBackgroundImageHue: number;
    newTabBackgroundImageContrast: number;
    newTabBackgroundImageSize: number;
    newTabBackgroundImagePositionX: number;
    newTabBackgroundImagePositionY: number;

    // Light theme background settings
    light_backgroundEnabled: boolean;
    light_backgroundColor: string | null;
    light_backgroundImageEnabled: boolean;
    light_backgroundImageUrl: string | null;
    light_backgroundImageOpacity: number;
    light_backgroundImageSaturation: number;
    light_backgroundImageBlur: number;
    light_backgroundImageHue: number;
    light_backgroundImageContrast: number;
    light_backgroundImageSize: number;
    light_backgroundImagePositionX: number;
    light_backgroundImagePositionY: number;

    // Dark theme background settings
    dark_backgroundEnabled: boolean;
    dark_backgroundColor: string | null;
    dark_backgroundImageEnabled: boolean;
    dark_backgroundImageUrl: string | null;
    dark_backgroundImageOpacity: number;
    dark_backgroundImageSaturation: number;
    dark_backgroundImageBlur: number;
    dark_backgroundImageHue: number;
    dark_backgroundImageContrast: number;
    dark_backgroundImageSize: number;
    dark_backgroundImagePositionX: number;
    dark_backgroundImagePositionY: number;

    enableTabTextColor: boolean;
    animationSpeed: number;
    tabTextColor: string | null;
    enableGroupTextColor: boolean;
    groupTextColor: string | null;
    backgroundForTabFavicon: boolean;
    faviconBackgroundColor: string | null;
    shadowForTabFavicon: boolean;
    shadowColor: string | null;
    showFaviconNotifications: boolean;
    savedSessions: Array<SavedSession>;
    customCss: string;
    enableCustomCss: boolean;
    groupsGradientBackground: boolean;
    showGroupTabCount: boolean;
    showGroupTitleTooltip: boolean;
    highlightHighTabCountEnabled: boolean;
    highlightHighTabCountThreshold: number;
    aiAutoOrganizeTabs: boolean;
    aiAutoGroupNaming: boolean;
    aiAutoCleaner: boolean;
    geminiApiKey: string;

    autoOrganizePrompt?: string;
    autoSuspendEnabled: boolean;
    autoSuspendMinutes: number;
    autoSuspendExcludedDomains: string[];
    autoSuspendPinnedTabs: boolean;
    autoSuspendPanelPages: boolean;
    enableSuspendingGroupedTabs: boolean;
    autoSaveSessionsEnabled: boolean;
    slowerRestoration: boolean;
    closeWindowWhenLastTabClosed: boolean;
    ensureOnlyOneNewTab: boolean;
    minimalNewTabsPage: boolean;
    seenMessages: string[];
    keepChromeTabGroupsCollapsed: boolean;
    compactPinnedTabs: boolean;
    disableMiddleClickAndCloseButtonOnPinnedTabs: boolean;
    hidePinButtonOnPinnedTabs: boolean;
    headerFooterOpacity: number;
    tabRoundness: number;
    showScrollbar: boolean;
    alwaysShowScrollbar: boolean;
    /* Customizable Tab Context Menu items (order, visibility, separators) */
    tabItemContextMenu: Array<{
        id: string; // unique key for the menu item
        type: "item" | "separator";
        label?: string; // for display in settings
        visible: boolean;
    }>;
    /* Customizable Group Context Menu items (order, visibility, separators) */
    groupItemContextMenu: Array<{
        id: string;
        type: "item" | "separator";
        label?: string;
        visible: boolean;
    }>;
    savedThemePreset: string | null; // Deprecated - kept for migration
    savedThemePresetLight: string | null; // Stringified JSON of saved light theme settings
    savedThemePresetDark: string | null; // Stringified JSON of saved dark theme settings
    strictDuplicateChecking: boolean;
    duplicateCloseKeep: "first" | "last";
    enableSharpTabsNewTabPage: boolean;
    newTabLink: string;
    showSearchBar: boolean;
    enableWorkspaces: boolean;
    searchInAllWorkspaces: boolean;
    sharePinnedTabsBetweenWorkspaces: boolean;
    separateActiveTabPerWorkspace: boolean;
    showNewTabButton: boolean;
    showNavigationButtons: boolean;
    showDuplicateTabsButton: boolean;
    autoCollapseHeaderButtons: boolean;
    /* Customizable Header Dropdown Menu items (order, visibility) */
    headerDropdownMenu: Array<{
        id: string;
        type: "item" | "separator";
        label?: string;
        visible: boolean;
    }>;
    /* Customizable General Workspace (name and icon) */
    generalWorkspaceName?: string;
    generalWorkspaceIcon?: string;
    /* Bulk Open Links dialog persisted values */
    bulkOpenLinksBaseUrl: string;
    bulkOpenLinksTerms: string;
    bulkOpenLinksWorkspace: string;
    bulkOpenLinksHistory: Array<{
        workspace: string;
        baseUrl: string;
        terms: string;
        timestamp: number;
    }>;
};

export type SettingsKeys = keyof Settings;
