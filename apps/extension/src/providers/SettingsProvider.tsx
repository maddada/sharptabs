import { defaultSettings, useSettingsStore, getDefaultNewTabLink } from "@/stores/settingsStore";
import { Settings } from "@/types/Settings";
import { applyTheme } from "@/utils/applyTheme";
import { useEffect } from "react";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const { setSettings } = useSettingsStore();

    useEffect(() => {
        // INIT $$ 1: SettingsProvider → Check if first launch and initialize Chrome storage with default settings
        chrome.storage.local.get({ firstLaunchDone: false }, async (items) => {
            const firstLaunchDone = items.firstLaunchDone as boolean;
            if (!firstLaunchDone) {
                console.log("First launch detected, initializing Chrome storage with default settings.");
                // Set browser-specific default for newTabLink
                const browserSpecificNewTabLink = await getDefaultNewTabLink();
                const settingsWithBrowserDefaults = {
                    ...defaultSettings,
                    newTabLink: browserSpecificNewTabLink,
                };
                chrome.storage.local.set(settingsWithBrowserDefaults, () => {
                    console.log("Chrome storage initialized with browser-specific default settings.");
                });
            }
        });

        // INIT $$ 2: SettingsProvider → Once - load settings from chrome.storage.local and sets them on store
        chrome.storage.local.get(defaultSettings, (items) => {
            // Using setSettings (not updateSettings) here to only init the zustand store
            const storedSettings = items as Settings;
            if (typeof storedSettings.autoSuspendPanelPages === "undefined") {
                chrome.storage.local.set({ autoSuspendPanelPages: false });
                storedSettings.autoSuspendPanelPages = false;
            }
            if (typeof storedSettings.showSearchBar === "undefined") {
                chrome.storage.local.set({ showSearchBar: false });
                storedSettings.showSearchBar = false;
            }
            if (typeof storedSettings.showNewTabButton === "undefined") {
                chrome.storage.local.set({ showNewTabButton: true });
                storedSettings.showNewTabButton = true;
            }
            if (typeof storedSettings.showNavigationButtons === "undefined") {
                chrome.storage.local.set({ showNavigationButtons: true });
                storedSettings.showNavigationButtons = true;
            }
            if (typeof storedSettings.showDuplicateTabsButton === "undefined") {
                chrome.storage.local.set({ showDuplicateTabsButton: true });
                storedSettings.showDuplicateTabsButton = true;
            }
            if (typeof storedSettings.showGroupTabCount === "undefined") {
                chrome.storage.local.set({ showDuplicateTabsButton: true });
                storedSettings.showDuplicateTabsButton = true;
            }
            if (typeof storedSettings.showFaviconNotifications === "undefined") {
                chrome.storage.local.set({ showFaviconNotifications: true });
                storedSettings.showFaviconNotifications = true;
            }
            if (typeof storedSettings.disableMiddleClickAndCloseButtonOnPinnedTabs === "undefined") {
                chrome.storage.local.set({ disableMiddleClickAndCloseButtonOnPinnedTabs: false });
                storedSettings.disableMiddleClickAndCloseButtonOnPinnedTabs = false;
            }
            if (typeof storedSettings.hidePinButtonOnPinnedTabs === "undefined") {
                chrome.storage.local.set({ hidePinButtonOnPinnedTabs: false });
                storedSettings.hidePinButtonOnPinnedTabs = false;
            }
            if (typeof storedSettings.showGroupTitleTooltip === "undefined") {
                chrome.storage.local.set({ showGroupTitleTooltip: true });
                storedSettings.showGroupTitleTooltip = true;
            }
            if (typeof storedSettings.sharePinnedTabsBetweenWorkspaces === "undefined") {
                chrome.storage.local.set({ sharePinnedTabsBetweenWorkspaces: false });
                storedSettings.sharePinnedTabsBetweenWorkspaces = false;
            }
            if (!storedSettings.headerDropdownMenu) {
                chrome.storage.local.set({ headerDropdownMenu: defaultSettings.headerDropdownMenu });
                storedSettings.headerDropdownMenu = defaultSettings.headerDropdownMenu;
            } else if (storedSettings.headerDropdownMenu && !storedSettings.headerDropdownMenu.some((item: any) => item.id === "ungroupAll")) {
                // Add ungroupAll item for existing users
                const suspendAllIndex = storedSettings.headerDropdownMenu.findIndex((item: any) => item.id === "suspendAll");
                if (suspendAllIndex !== -1) {
                    storedSettings.headerDropdownMenu.splice(suspendAllIndex, 0, {
                        id: "ungroupAll",
                        type: "item",
                        label: "Ungroup All",
                        visible: true,
                    });
                    chrome.storage.local.set({ headerDropdownMenu: storedSettings.headerDropdownMenu });
                }
            }

            // Migration: Add bulkOpenLinks menu item for existing users
            if (storedSettings.headerDropdownMenu && !storedSettings.headerDropdownMenu.some((item: any) => item.id === "bulkOpenLinks")) {
                const suspendAllIndex = storedSettings.headerDropdownMenu.findIndex((item: any) => item.id === "suspendAll");
                if (suspendAllIndex !== -1) {
                    storedSettings.headerDropdownMenu.splice(suspendAllIndex + 1, 0, {
                        id: "bulkOpenLinks",
                        type: "item",
                        label: "Bulk Open Links",
                        visible: true,
                    });
                    chrome.storage.local.set({ headerDropdownMenu: storedSettings.headerDropdownMenu });
                }
            }

            // Migration: Add bulkOpenLinksBaseUrl and bulkOpenLinksTerms for existing users
            if (typeof storedSettings.bulkOpenLinksBaseUrl === "undefined") {
                chrome.storage.local.set({ bulkOpenLinksBaseUrl: "" });
                storedSettings.bulkOpenLinksBaseUrl = "";
            }
            if (typeof storedSettings.bulkOpenLinksTerms === "undefined") {
                chrome.storage.local.set({ bulkOpenLinksTerms: "" });
                storedSettings.bulkOpenLinksTerms = "";
            }
            if (typeof storedSettings.bulkOpenLinksWorkspace === "undefined") {
                chrome.storage.local.set({ bulkOpenLinksWorkspace: "" });
                storedSettings.bulkOpenLinksWorkspace = "";
            }
            if (!Array.isArray(storedSettings.bulkOpenLinksHistory)) {
                chrome.storage.local.set({ bulkOpenLinksHistory: [] });
                storedSettings.bulkOpenLinksHistory = [];
            }

            if (typeof storedSettings.duplicateCloseKeep === "undefined") {
                chrome.storage.local.set({ duplicateCloseKeep: "first" });
                storedSettings.duplicateCloseKeep = "first";
            }

            // Migration: Add geminiApiKey for existing users
            if (typeof storedSettings.geminiApiKey === "undefined") {
                chrome.storage.local.set({ geminiApiKey: "" });
                storedSettings.geminiApiKey = "";
            }

            // Migration: Copy legacy background settings to BOTH light_* and dark_* for existing users
            // This ensures user's current customizations work in both modes
            if (typeof storedSettings.dark_backgroundEnabled === "undefined") {
                const bgSettings = {
                    backgroundEnabled: storedSettings.backgroundEnabled ?? defaultSettings.dark_backgroundEnabled,
                    backgroundColor: storedSettings.backgroundColor ?? defaultSettings.dark_backgroundColor,
                    backgroundImageEnabled: storedSettings.backgroundImageEnabled ?? defaultSettings.dark_backgroundImageEnabled,
                    backgroundImageUrl: storedSettings.backgroundImageUrl ?? defaultSettings.dark_backgroundImageUrl,
                    backgroundImageOpacity: storedSettings.backgroundImageOpacity ?? defaultSettings.dark_backgroundImageOpacity,
                    backgroundImageSaturation: storedSettings.backgroundImageSaturation ?? defaultSettings.dark_backgroundImageSaturation,
                    backgroundImageBlur: storedSettings.backgroundImageBlur ?? defaultSettings.dark_backgroundImageBlur,
                    backgroundImageHue: storedSettings.backgroundImageHue ?? defaultSettings.dark_backgroundImageHue,
                    backgroundImageContrast: storedSettings.backgroundImageContrast ?? defaultSettings.dark_backgroundImageContrast,
                    backgroundImageSize: storedSettings.backgroundImageSize ?? defaultSettings.dark_backgroundImageSize,
                    backgroundImagePositionX: storedSettings.backgroundImagePositionX ?? defaultSettings.dark_backgroundImagePositionX,
                    backgroundImagePositionY: storedSettings.backgroundImagePositionY ?? defaultSettings.dark_backgroundImagePositionY,
                };

                // Copy to both light_* and dark_*
                const migration: Record<string, any> = {};
                for (const [key, value] of Object.entries(bgSettings)) {
                    migration[`dark_${key}`] = value;
                    migration[`light_${key}`] = value;
                }

                chrome.storage.local.set(migration);
                Object.assign(storedSettings, migration);
            }

            // Migration: Add moveToWorkspace context menu item for existing users
            let needsUpdate = false;

            // Check and migrate tabItemContextMenu
            if (storedSettings.tabItemContextMenu && !storedSettings.tabItemContextMenu.some((item) => item.id === "moveToWorkspace")) {
                const moveToWindowIndex = storedSettings.tabItemContextMenu.findIndex((item) => item.id === "moveToWindow");
                if (moveToWindowIndex !== -1) {
                    storedSettings.tabItemContextMenu.splice(moveToWindowIndex + 1, 0, {
                        id: "moveToWorkspace",
                        type: "item",
                        label: "Move to Workspace",
                        visible: true,
                    });
                    needsUpdate = true;
                }
            }

            // Check and migrate groupItemContextMenu
            if (storedSettings.groupItemContextMenu && !storedSettings.groupItemContextMenu.some((item) => item.id === "moveToWorkspace")) {
                const moveToWindowIndex = storedSettings.groupItemContextMenu.findIndex((item) => item.id === "moveToWindow");
                if (moveToWindowIndex !== -1) {
                    storedSettings.groupItemContextMenu.splice(moveToWindowIndex + 1, 0, {
                        id: "moveToWorkspace",
                        type: "item",
                        label: "Move to Workspace",
                        visible: true,
                    });
                    needsUpdate = true;
                }
            }

            // Check and migrate tabItemContextMenu to add exportWorkspaceDiagnostics
            if (storedSettings.tabItemContextMenu && !storedSettings.tabItemContextMenu.some((item) => item.id === "exportWorkspaceDiagnostics")) {
                storedSettings.tabItemContextMenu.push({
                    id: "exportWorkspaceDiagnostics",
                    type: "item",
                    label: "Export Workspaces",
                    visible: true,
                });
                needsUpdate = true;
            }

            // Check and migrate tabItemContextMenu to add reloadExtension
            if (storedSettings.tabItemContextMenu && !storedSettings.tabItemContextMenu.some((item) => item.id === "reloadExtension")) {
                storedSettings.tabItemContextMenu.push({
                    id: "reloadExtension",
                    type: "item",
                    label: "Reload Extension",
                    visible: true,
                });
                needsUpdate = true;
            }

            // Check and migrate tabItemContextMenu to add exportWorkspaceStructure
            if (storedSettings.tabItemContextMenu && !storedSettings.tabItemContextMenu.some((item) => item.id === "exportWorkspaceStructure")) {
                storedSettings.tabItemContextMenu.push({
                    id: "exportWorkspaceStructure",
                    type: "item",
                    label: "Export Structure",
                    visible: true,
                });
                needsUpdate = true;
            }

            // Check and migrate groupItemContextMenu to add copyUrls
            if (storedSettings.groupItemContextMenu && !storedSettings.groupItemContextMenu.some((item) => item.id === "copyUrls")) {
                const bookmarkAllIndex = storedSettings.groupItemContextMenu.findIndex((item) => item.id === "bookmarkAll");
                if (bookmarkAllIndex !== -1) {
                    storedSettings.groupItemContextMenu.splice(bookmarkAllIndex + 1, 0, {
                        id: "copyUrls",
                        type: "item",
                        label: "Copy URLs",
                        visible: true,
                    });
                } else {
                    storedSettings.groupItemContextMenu.push({
                        id: "copyUrls",
                        type: "item",
                        label: "Copy URLs",
                        visible: true,
                    });
                }
                needsUpdate = true;
            }

            // Save migrated context menus if needed
            if (needsUpdate) {
                chrome.storage.local.set({
                    tabItemContextMenu: storedSettings.tabItemContextMenu,
                    groupItemContextMenu: storedSettings.groupItemContextMenu,
                });
                console.log("Migrated context menus to include moveToWorkspace items");
            }

            setSettings(storedSettings);
        });

        // INIT $$ 3: SettingsProvider → Add listener to chrome local storage changes and update the zustand store automatically
        chrome.storage.onChanged.addListener(handleStorageChange);
        function handleStorageChange(changes: { [key: string]: chrome.storage.StorageChange }) {
            const updates: Partial<Settings> = {};
            if (changes.theme) updates.theme = changes.theme.newValue;
            if (changes.themeType) updates.themeType = changes.themeType.newValue;
            if (changes.popupWidth) updates.popupWidth = changes.popupWidth.newValue;
            if (changes.fontSize) updates.fontSize = changes.fontSize.newValue;
            if (changes.tabHeight) updates.tabHeight = changes.tabHeight.newValue;
            if (changes.showCloseButton) updates.showCloseButton = changes.showCloseButton.newValue;
            if (changes.showDiscardedIcon) updates.showDiscardedIcon = changes.showDiscardedIcon.newValue;
            if (changes.showTitleInTooltips) updates.showTitleInTooltips = changes.showTitleInTooltips.newValue;
            if (changes.showUrlInTooltips) updates.showUrlInTooltips = changes.showUrlInTooltips.newValue;
            if (changes.middleClickOpensNewTab) updates.middleClickOpensNewTab = changes.middleClickOpensNewTab.newValue;
            if (changes.fadeSuspendedTabText) updates.fadeSuspendedTabText = changes.fadeSuspendedTabText.newValue;
            if (changes.outlineGroups) updates.outlineGroups = changes.outlineGroups.newValue;
            if (changes.showDiscardedIconGroup) updates.showDiscardedIconGroup = changes.showDiscardedIconGroup.newValue;
            if (changes.groupBgOpacity) updates.groupBgOpacity = changes.groupBgOpacity.newValue;

            // Background Color
            if (changes.backgroundEnabled) updates.backgroundEnabled = changes.backgroundEnabled.newValue;
            if (changes.backgroundColor) updates.backgroundColor = changes.backgroundColor.newValue;

            // New Tab Background Color
            if (changes.newTabBackgroundEnabled) updates.newTabBackgroundEnabled = changes.newTabBackgroundEnabled.newValue;
            if (changes.newTabBackgroundColor) updates.newTabBackgroundColor = changes.newTabBackgroundColor.newValue;

            // Background Image
            if (changes.backgroundImageEnabled) updates.backgroundImageEnabled = changes.backgroundImageEnabled.newValue;
            if (changes.backgroundImageUrl) updates.backgroundImageUrl = changes.backgroundImageUrl.newValue;
            if (changes.backgroundImageOpacity) updates.backgroundImageOpacity = changes.backgroundImageOpacity.newValue;
            if (changes.backgroundImageSaturation) updates.backgroundImageSaturation = changes.backgroundImageSaturation.newValue;
            if (changes.backgroundImageBlur) updates.backgroundImageBlur = changes.backgroundImageBlur.newValue;
            if (changes.backgroundImageHue) updates.backgroundImageHue = changes.backgroundImageHue.newValue;
            if (changes.backgroundImageContrast) updates.backgroundImageContrast = changes.backgroundImageContrast.newValue;
            if (changes.backgroundImageSize) updates.backgroundImageSize = changes.backgroundImageSize.newValue;
            if (changes.backgroundImagePositionX) updates.backgroundImagePositionX = changes.backgroundImagePositionX.newValue;
            if (changes.backgroundImagePositionY) updates.backgroundImagePositionY = changes.backgroundImagePositionY.newValue;

            // New Tab Background Image
            if (changes.newTabBackgroundImageEnabled) updates.newTabBackgroundImageEnabled = changes.newTabBackgroundImageEnabled.newValue;
            if (changes.newTabBackgroundImageUrl) updates.newTabBackgroundImageUrl = changes.newTabBackgroundImageUrl.newValue;
            if (changes.newTabBackgroundImageOpacity) updates.newTabBackgroundImageOpacity = changes.newTabBackgroundImageOpacity.newValue;
            if (changes.newTabBackgroundImageSaturation) updates.newTabBackgroundImageSaturation = changes.newTabBackgroundImageSaturation.newValue;
            if (changes.newTabBackgroundImageBlur) updates.newTabBackgroundImageBlur = changes.newTabBackgroundImageBlur.newValue;
            if (changes.newTabBackgroundImageHue) updates.newTabBackgroundImageHue = changes.newTabBackgroundImageHue.newValue;
            if (changes.newTabBackgroundImageContrast) updates.newTabBackgroundImageContrast = changes.newTabBackgroundImageContrast.newValue;
            if (changes.newTabBackgroundImageSize) updates.newTabBackgroundImageSize = changes.newTabBackgroundImageSize.newValue;
            if (changes.newTabBackgroundImagePositionX) updates.newTabBackgroundImagePositionX = changes.newTabBackgroundImagePositionX.newValue;
            if (changes.newTabBackgroundImagePositionY) updates.newTabBackgroundImagePositionY = changes.newTabBackgroundImagePositionY.newValue;

            // Enable Console Logging
            if (changes.enableConsoleLogging) updates.enableConsoleLogging = changes.enableConsoleLogging.newValue;

            // Tab Text Color
            if (changes.enableTabTextColor) updates.enableTabTextColor = changes.enableTabTextColor.newValue;
            if (changes.tabTextColor) updates.tabTextColor = changes.tabTextColor.newValue;
            if (changes.backgroundForTabFavicon) updates.backgroundForTabFavicon = changes.backgroundForTabFavicon.newValue;
            if (changes.shadowForTabFavicon) updates.shadowForTabFavicon = changes.shadowForTabFavicon.newValue;
            if (changes.groupTextColor) updates.groupTextColor = changes.groupTextColor.newValue;
            if (changes.enableGroupTextColor) updates.enableGroupTextColor = changes.enableGroupTextColor.newValue;
            if (changes.enableCustomCss) updates.enableCustomCss = changes.enableCustomCss.newValue;
            if (changes.customCss) updates.customCss = changes.customCss.newValue;
            if (changes.groupsGradientBackground) updates.groupsGradientBackground = changes.groupsGradientBackground.newValue;
            if (changes.showGroupTabCount) updates.showGroupTabCount = changes.showGroupTabCount.newValue;
            if (changes.showGroupTitleTooltip) updates.showGroupTitleTooltip = changes.showGroupTitleTooltip.newValue;
            if (changes.highlightHighTabCountEnabled) updates.highlightHighTabCountEnabled = changes.highlightHighTabCountEnabled.newValue;
            if (changes.highlightHighTabCountThreshold) updates.highlightHighTabCountThreshold = changes.highlightHighTabCountThreshold.newValue;
            if (changes.faviconBackgroundColor) updates.faviconBackgroundColor = changes.faviconBackgroundColor.newValue;
            if (changes.shadowColor) updates.shadowColor = changes.shadowColor.newValue;
            if (changes.showFaviconNotifications) updates.showFaviconNotifications = changes.showFaviconNotifications.newValue;
            if (changes.tabItemContextMenu) updates.tabItemContextMenu = changes.tabItemContextMenu.newValue;
            if (changes.groupItemContextMenu) updates.groupItemContextMenu = changes.groupItemContextMenu.newValue;
            if (changes.aiAutoOrganizeTabs) updates.aiAutoOrganizeTabs = changes.aiAutoOrganizeTabs.newValue;
            if (changes.aiAutoGroupNaming) updates.aiAutoGroupNaming = changes.aiAutoGroupNaming.newValue;
            if (changes.geminiApiKey) updates.geminiApiKey = changes.geminiApiKey.newValue;
            if (changes.autoOrganizePrompt) updates.autoOrganizePrompt = changes.autoOrganizePrompt.newValue;
            if (changes.animationSpeed) updates.animationSpeed = changes.animationSpeed.newValue;
            if (changes.autoSuspendEnabled) updates.autoSuspendEnabled = changes.autoSuspendEnabled.newValue;
            if (changes.autoSuspendMinutes) updates.autoSuspendMinutes = changes.autoSuspendMinutes.newValue;
            if (changes.autoSuspendExcludedDomains) updates.autoSuspendExcludedDomains = changes.autoSuspendExcludedDomains.newValue;
            if (changes.autoSuspendPinnedTabs) updates.autoSuspendPinnedTabs = changes.autoSuspendPinnedTabs.newValue;
            if (changes.autoSuspendPanelPages) updates.autoSuspendPanelPages = changes.autoSuspendPanelPages.newValue;
            if (changes.disableMiddleClickAndCloseButtonOnPinnedTabs)
                updates.disableMiddleClickAndCloseButtonOnPinnedTabs = changes.disableMiddleClickAndCloseButtonOnPinnedTabs.newValue;
            if (changes.hidePinButtonOnPinnedTabs) updates.hidePinButtonOnPinnedTabs = changes.hidePinButtonOnPinnedTabs.newValue;
            if (changes.autoSaveSessionsEnabled) updates.autoSaveSessionsEnabled = changes.autoSaveSessionsEnabled.newValue;
            if (changes.slowerRestoration) updates.slowerRestoration = changes.slowerRestoration.newValue;
            if (changes.ensureOnlyOneNewTab) updates.ensureOnlyOneNewTab = changes.ensureOnlyOneNewTab.newValue;
            if (changes.minimalNewTabsPage) updates.minimalNewTabsPage = changes.minimalNewTabsPage.newValue;
            if (changes.keepChromeTabGroupsCollapsed) updates.keepChromeTabGroupsCollapsed = changes.keepChromeTabGroupsCollapsed.newValue;
            if (changes.compactPinnedTabs) updates.compactPinnedTabs = changes.compactPinnedTabs.newValue;
            if (changes.headerFooterOpacity) updates.headerFooterOpacity = changes.headerFooterOpacity.newValue;
            if (changes.tabRoundness) updates.tabRoundness = changes.tabRoundness.newValue;
            if (changes.showScrollbar) updates.showScrollbar = changes.showScrollbar.newValue;
            if (changes.alwaysShowScrollbar) updates.alwaysShowScrollbar = changes.alwaysShowScrollbar.newValue;
            if (changes.strictDuplicateChecking) updates.strictDuplicateChecking = changes.strictDuplicateChecking.newValue;
            if (changes.duplicateCloseKeep) updates.duplicateCloseKeep = changes.duplicateCloseKeep.newValue;
            if (changes.enableSharpTabsNewTabPage) updates.enableSharpTabsNewTabPage = changes.enableSharpTabsNewTabPage.newValue;
            if (changes.newTabLink) updates.newTabLink = changes.newTabLink.newValue;
            if (changes.showSearchBar) updates.showSearchBar = changes.showSearchBar.newValue;
            if (changes.showNewTabButton) updates.showNewTabButton = changes.showNewTabButton.newValue;
            if (changes.showNavigationButtons) updates.showNavigationButtons = changes.showNavigationButtons.newValue;
            if (changes.showDuplicateTabsButton) updates.showDuplicateTabsButton = changes.showDuplicateTabsButton.newValue;
            if (changes.enableWorkspaces) updates.enableWorkspaces = changes.enableWorkspaces.newValue;
            if (changes.sharePinnedTabsBetweenWorkspaces)
                updates.sharePinnedTabsBetweenWorkspaces = changes.sharePinnedTabsBetweenWorkspaces.newValue;
            if (changes.separateActiveTabPerWorkspace) updates.separateActiveTabPerWorkspace = changes.separateActiveTabPerWorkspace.newValue;
            if (changes.headerDropdownMenu) updates.headerDropdownMenu = changes.headerDropdownMenu.newValue;
            if (changes.autoCollapseHeaderButtons) updates.autoCollapseHeaderButtons = changes.autoCollapseHeaderButtons.newValue;
            if (changes.bulkOpenLinksBaseUrl) updates.bulkOpenLinksBaseUrl = changes.bulkOpenLinksBaseUrl.newValue;
            if (changes.bulkOpenLinksTerms) updates.bulkOpenLinksTerms = changes.bulkOpenLinksTerms.newValue;
            if (changes.bulkOpenLinksWorkspace) updates.bulkOpenLinksWorkspace = changes.bulkOpenLinksWorkspace.newValue;
            if (changes.bulkOpenLinksHistory) updates.bulkOpenLinksHistory = changes.bulkOpenLinksHistory.newValue;

            // Light theme background settings
            if (changes.light_backgroundEnabled) updates.light_backgroundEnabled = changes.light_backgroundEnabled.newValue;
            if (changes.light_backgroundColor) updates.light_backgroundColor = changes.light_backgroundColor.newValue;
            if (changes.light_backgroundImageEnabled) updates.light_backgroundImageEnabled = changes.light_backgroundImageEnabled.newValue;
            if (changes.light_backgroundImageUrl) updates.light_backgroundImageUrl = changes.light_backgroundImageUrl.newValue;
            if (changes.light_backgroundImageOpacity) updates.light_backgroundImageOpacity = changes.light_backgroundImageOpacity.newValue;
            if (changes.light_backgroundImageSaturation) updates.light_backgroundImageSaturation = changes.light_backgroundImageSaturation.newValue;
            if (changes.light_backgroundImageBlur) updates.light_backgroundImageBlur = changes.light_backgroundImageBlur.newValue;
            if (changes.light_backgroundImageHue) updates.light_backgroundImageHue = changes.light_backgroundImageHue.newValue;
            if (changes.light_backgroundImageContrast) updates.light_backgroundImageContrast = changes.light_backgroundImageContrast.newValue;
            if (changes.light_backgroundImageSize) updates.light_backgroundImageSize = changes.light_backgroundImageSize.newValue;
            if (changes.light_backgroundImagePositionX) updates.light_backgroundImagePositionX = changes.light_backgroundImagePositionX.newValue;
            if (changes.light_backgroundImagePositionY) updates.light_backgroundImagePositionY = changes.light_backgroundImagePositionY.newValue;

            // Dark theme background settings
            if (changes.dark_backgroundEnabled) updates.dark_backgroundEnabled = changes.dark_backgroundEnabled.newValue;
            if (changes.dark_backgroundColor) updates.dark_backgroundColor = changes.dark_backgroundColor.newValue;
            if (changes.dark_backgroundImageEnabled) updates.dark_backgroundImageEnabled = changes.dark_backgroundImageEnabled.newValue;
            if (changes.dark_backgroundImageUrl) updates.dark_backgroundImageUrl = changes.dark_backgroundImageUrl.newValue;
            if (changes.dark_backgroundImageOpacity) updates.dark_backgroundImageOpacity = changes.dark_backgroundImageOpacity.newValue;
            if (changes.dark_backgroundImageSaturation) updates.dark_backgroundImageSaturation = changes.dark_backgroundImageSaturation.newValue;
            if (changes.dark_backgroundImageBlur) updates.dark_backgroundImageBlur = changes.dark_backgroundImageBlur.newValue;
            if (changes.dark_backgroundImageHue) updates.dark_backgroundImageHue = changes.dark_backgroundImageHue.newValue;
            if (changes.dark_backgroundImageContrast) updates.dark_backgroundImageContrast = changes.dark_backgroundImageContrast.newValue;
            if (changes.dark_backgroundImageSize) updates.dark_backgroundImageSize = changes.dark_backgroundImageSize.newValue;
            if (changes.dark_backgroundImagePositionX) updates.dark_backgroundImagePositionX = changes.dark_backgroundImagePositionX.newValue;
            if (changes.dark_backgroundImagePositionY) updates.dark_backgroundImagePositionY = changes.dark_backgroundImagePositionY.newValue;

            // Theme presets
            if (changes.savedThemePresetLight) updates.savedThemePresetLight = changes.savedThemePresetLight.newValue;
            if (changes.savedThemePresetDark) updates.savedThemePresetDark = changes.savedThemePresetDark.newValue;

            console.log("Storage changes detected:", changes);
            if (changes.themeType) {
                console.log("ThemeType applied:", changes.themeType.newValue);
                applyTheme(changes.themeType.newValue, null);
            }
            if (changes.theme) {
                console.log("Theme applied:", changes.theme.newValue);
                applyTheme(null, changes.theme.newValue);
            }

            if (Object.keys(updates).length > 0) {
                chrome.storage.local.get(defaultSettings, (items) => {
                    setSettings({ ...(items as Settings), ...updates });
                });
            }
        }

        // Listen for OS theme changes to reapply theme when in system mode
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleSystemThemeChange = () => {
            chrome.storage.local.get("themeType", (result) => {
                if (result.themeType === "system") {
                    applyTheme("system", null);
                }
            });
        };
        mediaQuery.addEventListener("change", handleSystemThemeChange);

        // Cleanup function to remove listeners
        return () => {
            chrome.storage.onChanged.removeListener(handleStorageChange);
            mediaQuery.removeEventListener("change", handleSystemThemeChange);
        };
    }, [setSettings]);
    return <>{children}</>;
}
