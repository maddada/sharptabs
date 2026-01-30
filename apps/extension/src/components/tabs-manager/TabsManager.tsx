import { RenameGroupDialog } from "@/components/dialogs/RenameGroupDialog";
import { GroupItem } from "@/components/tab-list-items/GroupItem";
import { TabItem } from "@/components/tab-list-items/TabItem";
import { TabItemCompactPinned } from "@/components/tab-list-items/TabItemCompactPinned";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useConsoleLoggingDisabler } from "@/hooks/useConsoleLoggingDisabler";
import { useDndStore } from "@/stores/dndStore";
import { usePremiumStatus } from "@/stores/premiumStore";
import { useSearchStore } from "@/stores/searchStore";
import { useSelectionStore } from "@/stores/selectionStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTabManagerStore } from "@/stores/tabManagerStore";
import { useTabsStore } from "@/stores/tabsStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { CombinedItem, ItemType } from "@/types/CombinedItem";
import { Tab } from "@/types/Tab";
import { TabGroup } from "@/types/TabGroup";
import { cn } from "@/utils/cn";
import { expandAndScrollToActiveTab } from "@/utils/tabs/expandAndScrollToActiveTab";
import { findDuplicateTabs } from "@/utils/tabs/findDuplicateTabs";
import { middleClickOpensNewTab } from "@/utils/tabs/middleClickOpensNewTab";
import { filterItemsByWorkspace } from "@/utils/workspaces/workspaceFilter";
import { extractOriginalUrl } from "@/utils/workspaces/workspaceMatcher";
import { getEffectiveBackgroundSetting, getSystemTheme } from "@/utils/getEffectiveBackgroundSettings";
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    pointerWithin,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import Fuse from "fuse.js";
import { RefObject, useCallback, useEffect, useEffect as useReactEffect, useRef, useState } from "react";
import { AddToGroupDialog } from "../dialogs/AddToGroupDialog";
import { AutoOrganizeDialog } from "../dialogs/AutoOrganizeDialog";
import { BulkOpenLinksDialog } from "../dialogs/BulkOpenLinksDialog";
import { CloseTabsDialog } from "../dialogs/CloseTabsDialog";
import { DeleteUselessTabsDialog } from "../dialogs/DeleteUselessTabsDialog";
import { WindowSelectionDialog } from "../dialogs/WindowSelectionDialog";
import { SessionManagementDialog } from "../sessions/SessionManagementDialog";
import { SelectedTabsNotice } from "./components/SelectedTabsNotice";
import { TabManagerFooter } from "./components/TabManagerFooter";
import { TabManagerHeader } from "./components/TabManagerHeader";
import { TabManagerScrollArea } from "./components/TabManagerScrollArea";
import { WindowsDropZone } from "./components/WindowsDropZone";
import { getDndItems } from "./helpers/dragAndDrop/getDndItems";
import { getDraggedItemData } from "./helpers/dragAndDrop/getDraggedItemData";
import { handleDragEnd } from "./helpers/dragAndDrop/handleDragEnd";
import { useArrowKeyNavigation } from "./hooks/useArrowKeyNavigation";
import { useFilterOtherWindows } from "./hooks/useFilterOtherWindows";
import { useKeepChromeGroupsCollapsed } from "./hooks/useKeepChromeGroupsCollapsed";
import { useNavigationShortcuts } from "./hooks/useNavigationShortcuts";
import { useResetPremiumFeatures } from "./hooks/useResetPremiumFeatures";
import { useSavedSessionsLoader } from "./hooks/useSavedSessionsLoader";
import { useSearchKeysListener } from "./hooks/useSearchKeysListener";
import { useSkipAnimationsOnFirstLoad } from "./hooks/useSkipAnimationsOnFirstLoad";
import { useTabEventListeners } from "./hooks/useTabEventListeners";

function getAssignedIdentifiersFromOrphanedWindowAssignments(allWindowAssignments: Record<string, any>, currentWindowIds: Set<number>): Set<string> {
    const assigned = new Set<string>();

    for (const [windowIdString, windowAssignments] of Object.entries(allWindowAssignments)) {
        const windowId = Number(windowIdString);
        if (!Number.isFinite(windowId)) continue;
        if (currentWindowIds.has(windowId)) continue;
        if (!windowAssignments || typeof windowAssignments !== "object") continue;

        for (const [workspaceId, workspace] of Object.entries(windowAssignments)) {
            if (workspaceId === "general") continue;
            if (!workspace || typeof workspace !== "object") continue;

            const tabs = Array.isArray((workspace as any).tabs) ? ((workspace as any).tabs as Array<{ url?: string }>) : [];
            const groups = Array.isArray((workspace as any).groups) ? ((workspace as any).groups as Array<{ title?: string; color?: string }>) : [];

            for (const tab of tabs) {
                if (!tab?.url) continue;
                assigned.add(extractOriginalUrl(tab.url));
            }

            for (const group of groups) {
                assigned.add(`${group?.title ?? ""}|${group?.color ?? ""}`);
            }
        }
    }

    return assigned;
}

export function TabsManager({
    initialContainerHeight = "600px",
    initialInPopup = false,
    initialInSidepanel = false,
    initialInNewTab = false,
}: {
    initialContainerHeight?: string;
    initialInPopup?: boolean;
    initialInSidepanel?: boolean;
    initialInNewTab?: boolean;
}) {
    // #region State and Variables

    // Get values from stores
    const activeTabId = useTabsStore((s) => s.activeTabId);
    const containerHeight = useTabManagerStore((s) => s.containerHeight);
    const inPopup = useTabManagerStore((s) => s.inPopup);
    const inSidepanel = useTabManagerStore((s) => s.inSidepanel);
    const inNewTab = useTabManagerStore((s) => s.inNewTab);
    const showBackgroundImage = useTabManagerStore((s) => s.showBackgroundImage);
    const workspaceAssignments = useTabManagerStore((s) => s.workspaceAssignments);
    const [fallbackAssignedIdentifiers, setFallbackAssignedIdentifiers] = useState<Set<string> | null>(null);
    const fallbackAssignedIdentifiersTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Add premium status check
    const { isPremium, loading } = usePremiumStatus();

    const pinnedTabs = useTabsStore((s) => s.pinnedTabs);
    const regularTabs = useTabsStore((s) => s.regularTabs);
    const tabGroups = useTabsStore((s) => s.tabGroups);
    const collapsedGroups = useTabsStore((s) => s.collapsedGroups);
    const { setActiveTabId, setCollapsedGroups } = useTabsStore((s) => s.actions);
    const isDuplicateCheckMode = useTabManagerStore((s) => s.isDuplicateCheckMode);

    const isAutoOrganizeDialogOpen = useTabManagerStore((s) => s.isAutoOrganizeDialogOpen);
    const isAutoOrganizeLoading = useTabManagerStore((s) => s.isAutoOrganizeLoading);
    const isDeleteUselessTabsDialogOpen = useTabManagerStore((s) => s.isDeleteUselessTabsDialogOpen);
    const isDeleteUselessTabsLoading = useTabManagerStore((s) => s.isDeleteUselessTabsLoading);
    const previousCollapsedState = useTabManagerStore((s) => s.previousCollapsedState);
    const skipAnimation = useTabManagerStore((s) => s.skipAnimation);
    const savedSessions = useTabManagerStore((s) => s.savedSessions);
    const isRestoreDialogOpen = useTabManagerStore((s) => s.isRestoreDialogOpen);
    const isAddToGroupModalOpen = useTabManagerStore((s) => s.isAddToGroupModalOpen);
    const toastDuration = useTabManagerStore((s) => s.toastDuration);

    const {
        setIsVivaldi,
        setContainerHeight,
        setInPopup,
        setInSidepanel,
        setInNewTab,
        setShowBackgroundImage,
        setWorkspaceAssignments,
        setOtherWindowsData,
    } = useTabManagerStore((s) => s.actions);

    useEffect(() => {
        chrome.windows.getCurrent().then((currentWindow) => {
            const isVivaldi = !!(currentWindow as any)["vivExtData"];
            setIsVivaldi(isVivaldi);
        });
    }, [setIsVivaldi]);

    // Create a stable ref and store it in Zustand store
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { setScrollContainerRef, clearScrollContainerRef } = useTabManagerStore((s) => s.actions);

    useEffect(() => {
        setScrollContainerRef(scrollContainerRef);
        return () => {
            clearScrollContainerRef();
        };
    }, [setScrollContainerRef, clearScrollContainerRef]);

    const { settings } = useSettingsStore();

    // Track system theme for real-time switching when in system mode
    const [currentSystemTheme, setCurrentSystemTheme] = useState<"light" | "dark">(getSystemTheme);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = (e: MediaQueryListEvent) => {
            setCurrentSystemTheme(e.matches ? "dark" : "light");
        };
        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    // Workspace filtering
    const { workspaces, activeWorkspaceId } = useWorkspaceStore();

    // Initialize store values from props
    useEffect(() => {
        setContainerHeight(initialContainerHeight);
        setInPopup(initialInPopup);
        setInSidepanel(initialInSidepanel);
        setInNewTab(initialInNewTab);
    }, [initialContainerHeight, initialInPopup, initialInSidepanel, initialInNewTab, setContainerHeight, setInPopup, setInSidepanel, setInNewTab]);

    // Load workspace assignments when component mounts
    useReactEffect(() => {
        if (settings.enableWorkspaces) {
            // Load initial workspace assignments
            const loadWorkspaceAssignments = () => {
                chrome.windows.getCurrent().then((window) => {
                    if (window.id) {
                        chrome.storage.local.get("workspaceAssignments").then((result) => {
                            if (result.workspaceAssignments?.[window.id ?? 0]) {
                                setWorkspaceAssignments(result.workspaceAssignments[window.id ?? 0]);
                            } else {
                                setWorkspaceAssignments({});
                            }
                        });
                    }
                });
            };

            loadWorkspaceAssignments();

            // Listen for storage changes to update workspace assignments in real-time
            const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
                if (changes.workspaceAssignments) {
                    chrome.windows.getCurrent().then((window) => {
                        if (window.id) {
                            const newValue = changes.workspaceAssignments.newValue?.[window.id];

                            // Update state even if newValue is empty/undefined
                            // This ensures UI reflects when workspace data is cleared
                            if (newValue !== undefined) {
                                setWorkspaceAssignments(newValue || {});
                            } else {
                                // Window ID not in newValue - set to empty
                                setWorkspaceAssignments({});
                            }
                        }
                    });
                }
            };

            chrome.storage.onChanged.addListener(handleStorageChange);

            // Cleanup listener on unmount
            return () => {
                chrome.storage.onChanged.removeListener(handleStorageChange);
            };
        }
    }, [settings.enableWorkspaces, activeWorkspaceId, setWorkspaceAssignments]);

    // On browser startup, workspaceAssignments may still be keyed by old window IDs for a short time.
    // While that migration runs, hide anything that is assigned to any custom workspace (from orphaned window entries)
    // so it doesn't momentarily appear in General.
    useReactEffect(() => {
        if (!settings.enableWorkspaces) {
            setFallbackAssignedIdentifiers(null);
            return;
        }

        let isCancelled = false;

        const computeFallbackAssignedIdentifiers = async () => {
            try {
                const [windows, storage] = await Promise.all([chrome.windows.getAll(), chrome.storage.local.get("workspaceAssignments")]);

                if (isCancelled) return;

                const currentWindowIds = new Set<number>(windows.map((w) => w.id).filter((id): id is number => typeof id === "number"));

                const allAssignments = (storage.workspaceAssignments || {}) as Record<string, any>;
                const assigned = getAssignedIdentifiersFromOrphanedWindowAssignments(allAssignments, currentWindowIds);

                if (fallbackAssignedIdentifiersTimeoutRef.current) {
                    clearTimeout(fallbackAssignedIdentifiersTimeoutRef.current);
                    fallbackAssignedIdentifiersTimeoutRef.current = null;
                }

                if (assigned.size > 0) {
                    setFallbackAssignedIdentifiers(assigned);
                    // Keep this conservative filter short-lived so stale orphaned entries can't hide tabs indefinitely.
                    fallbackAssignedIdentifiersTimeoutRef.current = setTimeout(() => {
                        setFallbackAssignedIdentifiers(null);
                        fallbackAssignedIdentifiersTimeoutRef.current = null;
                    }, 6000);
                } else {
                    setFallbackAssignedIdentifiers(null);
                }
            } catch (error) {
                console.error("[Workspace Restore UI] Error computing fallback assigned identifiers:", error);
                setFallbackAssignedIdentifiers(null);
            }
        };

        void computeFallbackAssignedIdentifiers();

        return () => {
            isCancelled = true;
            if (fallbackAssignedIdentifiersTimeoutRef.current) {
                clearTimeout(fallbackAssignedIdentifiersTimeoutRef.current);
                fallbackAssignedIdentifiersTimeoutRef.current = null;
            }
        };
    }, [settings.enableWorkspaces]);

    const {
        setIsAutoOrganizeDialogOpen,
        setIsDeleteUselessTabsDialogOpen,
        setPreviousCollapsedState,
        setSkipAnimation,
        setSavedSessions,
        setIsRestoreDialogOpen,
        setIsAddToGroupModalOpen,
    } = useTabManagerStore((s) => s.actions);

    // Search store
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchTerm = useSearchStore((s) => s.searchTerm);
    const isSearchBarFocused = useSearchStore((s) => s.isSearchBarFocused);
    const { setSearchTerm, setIsSearchBarFocused, setSearchInputRef } = useSearchStore((s) => s.actions);

    // Set search input ref in store
    useEffect(() => {
        setSearchInputRef(searchInputRef as RefObject<HTMLInputElement>);
    }, [setSearchInputRef]);

    // DnD store
    const activeDndId = useDndStore((s) => s.activeDndId);
    const dropTargetId = useDndStore((s) => s.dropTargetId);
    const recentlyDraggedItem = useDndStore((s) => s.recentlyDraggedItem);
    const { setActiveDndId, setDropTargetId, setRecentlyDraggedItem } = useDndStore((s) => s.actions);
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 13,
            },
        })
    );

    // Get other windows data from store
    const otherWindowsData = useTabManagerStore((s) => s.otherWindowsData);

    // Use hook to update other windows data
    const [hookOtherWindowsData] = useFilterOtherWindows(searchTerm);

    // Update store when hook data changes
    useEffect(() => {
        setOtherWindowsData(hookOtherWindowsData);
    }, [hookOtherWindowsData, setOtherWindowsData]);

    // #endregion State and Variables

    // Add this new useEffect for periodic premium validation
    useResetPremiumFeatures(loading, isPremium, settings);

    // Prevent console logs
    useConsoleLoggingDisabler();

    // #region Initial load and event listeners setup
    // Tab event listeners setup (reload internal tabs state on tab updates)
    useTabEventListeners({
        expandAndScrollToActiveTab,
        setActiveTabId,
        setActiveDndId,
        activeDndId,
    });

    // Set default theme if not set
    // eslint-disable-next-line react-you-might-not-need-an-effect/no-empty-effect
    useEffect(() => {
        if (localStorage.getItem("themeType") == null) {
            localStorage.setItem("themeType", "dark");
            localStorage.setItem("theme", "blue");
        }
    }, []);

    // Handle messages from service worker (e.g., for hotkey suspend functionality)
    useEffect(() => {
        const handleMessage = (message: any, sender: any, sendResponse: (response?: any) => void) => {
            if (message.type === "GET_SELECTED_TABS") {
                const selectedTabIds = useSelectionStore.getState().selectedTabIds;
                sendResponse({
                    selectedTabIds: Array.from(selectedTabIds),
                });
                return true; // Keep message channel open for async response
            }
            return false;
        };

        chrome.runtime.onMessage.addListener(handleMessage);

        return () => {
            chrome.runtime.onMessage.removeListener(handleMessage);
        };
    }, []);

    // Saved Sessions Loader
    useSavedSessionsLoader(setSavedSessions);

    // Skip animations on first load
    useSkipAnimationsOnFirstLoad(setSkipAnimation);

    // Keep Chrome tab groups collapsed when enabled
    useKeepChromeGroupsCollapsed(settings.keepChromeTabGroupsCollapsed);

    // #region Helper Functions + Drag & Drop Handlers
    function handleDragStart({ active }: DragStartEvent) {
        setActiveDndId(active.id.toString());
    }

    function handleDragOver(event: DragOverEvent) {
        if (!event.over) {
            setDropTargetId(null);
            return;
        }
        setDropTargetId(event.over.id.toString());
    }

    // Shorthand for handling the drag end event
    function _handleDragEnd(e: DragEndEvent) {
        handleDragEnd(e.active, e.over, pinnedTabs, regularTabs, tabGroups, collapsedGroups, setActiveDndId, setDropTargetId, setRecentlyDraggedItem);
    }

    // #endregion Helper Functions + Drag & Drop Handlers

    // #region Search methods and component
    const fuseOptions = {
        keys: ["title", "url"],
        threshold: 0.3,
        includeScore: true,
        ignoreLocation: true,
    };
    const fusePinned = new Fuse(pinnedTabs, fuseOptions);
    const fuseRegular = new Fuse(regularTabs, fuseOptions);
    const fuseGroupTabs = tabGroups.map((group) => ({
        groupId: group.id,
        fuse: new Fuse(group.tabs, fuseOptions),
    }));

    const handleSearchClear = useCallback(() => {
        setSearchTerm("");
        if (previousCollapsedState.size > 0 || searchTerm) {
            setCollapsedGroups(previousCollapsedState);
            setPreviousCollapsedState(new Set());
        }
        searchInputRef.current?.blur();
        setIsSearchBarFocused(false);
        useSelectionStore.getState().actions.clearSelection();
    }, [previousCollapsedState, searchTerm, setSearchTerm, setIsSearchBarFocused, setCollapsedGroups, setPreviousCollapsedState]);

    const handleSearchChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newSearchTerm = e.target.value;
            if (newSearchTerm && !searchTerm) {
                setPreviousCollapsedState(collapsedGroups);
                setCollapsedGroups(new Set());
            } else if (!newSearchTerm && searchTerm) {
                setCollapsedGroups(previousCollapsedState);
                setPreviousCollapsedState(new Set());
            }
            setSearchTerm(newSearchTerm);
        },
        [searchTerm, collapsedGroups, previousCollapsedState, setSearchTerm, setCollapsedGroups, setPreviousCollapsedState]
    );

    const handleSearchTermUpdate = useCallback(
        (newSearchTerm: string) => {
            if (newSearchTerm && !searchTerm) {
                setPreviousCollapsedState(collapsedGroups);
                setCollapsedGroups(new Set());
            } else if (!newSearchTerm && searchTerm) {
                setCollapsedGroups(previousCollapsedState);
                setPreviousCollapsedState(new Set());
            }
            setSearchTerm(newSearchTerm);

            // Hide search bar when cleared if showSearchBar setting is false
            if (!newSearchTerm) {
                const settings = useSettingsStore.getState().settings;
                if (!settings.showSearchBar) {
                    setIsSearchBarFocused(false);
                }
            }
        },
        [searchTerm, collapsedGroups, previousCollapsedState, setSearchTerm, setIsSearchBarFocused, setCollapsedGroups, setPreviousCollapsedState]
    );

    // Search keys listener (focus on input when typing any key, clear on escape)
    useSearchKeysListener(searchInputRef, handleSearchClear, setIsSearchBarFocused, handleSearchTermUpdate);

    // Arrow key navigation (up/down arrows behave like Tab/Shift+Tab)
    useArrowKeyNavigation();

    // Navigation shortcuts (Alt+Left/Right or Cmd+[/])
    useNavigationShortcuts();

    // Filter based on combined list for rendering
    const allItemsForRender: CombinedItem[] = [
        ...pinnedTabs.map((tab) => ({
            type: ItemType.PINNED,
            data: tab,
            index: tab.index,
            dndId: `${ItemType.PINNED}-${tab.id}`, // Add dndId
        })),
        ...regularTabs.map((tab) => ({
            type: ItemType.REGULAR,
            data: tab,
            index: tab.index,
            dndId: `${ItemType.REGULAR}-${tab.id}`, // Add dndId
        })),
        ...tabGroups.map((group) => ({
            type: ItemType.GROUP,
            data: group,
            index: group.index, // Use the calculated group index
            dndId: `${ItemType.GROUP}-${group.id}`, // Add dndId
        })),
    ].sort((a, b) => a.index - b.index);

    const filteredItemsForRender = useCallback(
        (term: string): CombinedItem[] => {
            if (!term) {
                return allItemsForRender;
            }
            const results: CombinedItem[] = [];
            const addedTabIds = new Set<number>();
            // Search Pinned
            fusePinned.search(term).forEach((result) => {
                results.push({ type: ItemType.PINNED, data: result.item, index: result.item.index, dndId: `${ItemType.PINNED}-${result.item.id}` });
                addedTabIds.add(result.item.id);
            });
            // Search Regular (Ungrouped)
            fuseRegular.search(term).forEach((result) => {
                results.push({ type: ItemType.REGULAR, data: result.item, index: result.item.index, dndId: `${ItemType.REGULAR}-${result.item.id}` });
                addedTabIds.add(result.item.id);
            });
            // Search within Groups
            tabGroups.forEach((group) => {
                const groupFuse = fuseGroupTabs.find((f) => f.groupId === group.id)?.fuse;
                if (!groupFuse) return;
                const matchingTabs = groupFuse
                    .search(term)
                    .map((result) => result.item)
                    .filter((tab) => !addedTabIds.has(tab.id)); // Avoid duplicates if somehow possible
                if (matchingTabs.length > 0) {
                    results.push({
                        type: ItemType.GROUP,
                        data: { ...group, tabs: matchingTabs }, // Show group header with *only* matching tabs
                        index: group.index,
                        dndId: `${ItemType.GROUP}-${group.id}`,
                    });
                }
            });
            return results.sort((a, b) => a.index - b.index);
        },
        [tabGroups, fusePinned, fuseRegular, fuseGroupTabs, allItemsForRender]
    );
    // #endregion

    // Calculate if there are duplicate tabs for the footer button
    const allTabs = [...pinnedTabs, ...regularTabs, ...tabGroups.flatMap((g) => g.tabs)];
    const duplicateTabIds = findDuplicateTabs(allTabs, settings.strictDuplicateChecking);

    let itemsToRender;
    if (!inNewTab || !settings.minimalNewTabsPage) {
        itemsToRender = searchTerm ? filteredItemsForRender(searchTerm) : allItemsForRender;

        // Apply workspace filtering if enabled
        if (settings.enableWorkspaces && activeWorkspaceId) {
            // Skip workspace filtering if searching and searchInAllWorkspaces is enabled
            if (!(searchTerm && settings.searchInAllWorkspaces)) {
                const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
                if (activeWorkspace) {
                    itemsToRender = filterItemsByWorkspace(
                        itemsToRender,
                        activeWorkspace,
                        workspaceAssignments,
                        workspaces,
                        settings.sharePinnedTabsBetweenWorkspaces,
                        fallbackAssignedIdentifiers ?? undefined
                    );
                }
            }
        }

        // Apply duplicate filtering if in duplicate check mode
        if (isDuplicateCheckMode) {
            itemsToRender = itemsToRender
                .map((item) => {
                    if (item.type === ItemType.PINNED || item.type === ItemType.REGULAR) {
                        // Filter out non-duplicate tabs
                        const tab = item.data as Tab;
                        if (!duplicateTabIds.has(tab.id)) {
                            return null;
                        }
                    } else if (item.type === ItemType.GROUP) {
                        // Filter tabs within groups
                        const group = item.data as TabGroup;
                        const filteredTabs = group.tabs.filter((tab) => duplicateTabIds.has(tab.id));
                        if (filteredTabs.length === 0) {
                            return null; // Remove empty groups
                        }
                        return {
                            ...item,
                            data: { ...group, tabs: filteredTabs },
                        };
                    }
                    return item;
                })
                .filter(Boolean) as CombinedItem[];
        }
    } else {
        itemsToRender = searchTerm ? filteredItemsForRender(searchTerm) : [];
    }

    const hasPinned = itemsToRender.some((item) => item.type === ItemType.PINNED);
    const draggedItem = getDraggedItemData(activeDndId, pinnedTabs, regularTabs, tabGroups);

    // Show background image after a short delay to avoid conflict between newTab & normal background images
    useEffect(() => {
        setTimeout(() => {
            setShowBackgroundImage(true);
        }, 50);
    }, []);

    // Get effective background settings (accounts for system theme mode)
    const effectiveBgOptions = { settings, forRendering: true, currentSystemTheme };
    const effectiveBackgroundEnabled = getEffectiveBackgroundSetting<boolean>("backgroundEnabled", effectiveBgOptions);
    const effectiveBackgroundColor = getEffectiveBackgroundSetting<string | null>("backgroundColor", effectiveBgOptions);
    const effectiveBackgroundImageEnabled = getEffectiveBackgroundSetting<boolean>("backgroundImageEnabled", effectiveBgOptions);
    const effectiveBackgroundImageUrl = getEffectiveBackgroundSetting<string | null>("backgroundImageUrl", effectiveBgOptions);
    const effectiveBackgroundImageBlur = getEffectiveBackgroundSetting<number>("backgroundImageBlur", effectiveBgOptions);
    const effectiveBackgroundImageSaturation = getEffectiveBackgroundSetting<number>("backgroundImageSaturation", effectiveBgOptions);
    const effectiveBackgroundImageHue = getEffectiveBackgroundSetting<number>("backgroundImageHue", effectiveBgOptions);
    const effectiveBackgroundImageContrast = getEffectiveBackgroundSetting<number>("backgroundImageContrast", effectiveBgOptions);
    const effectiveBackgroundImageSize = getEffectiveBackgroundSetting<number>("backgroundImageSize", effectiveBgOptions);
    const effectiveBackgroundImagePositionX = getEffectiveBackgroundSetting<number>("backgroundImagePositionX", effectiveBgOptions);
    const effectiveBackgroundImagePositionY = getEffectiveBackgroundSetting<number>("backgroundImagePositionY", effectiveBgOptions);
    const effectiveBackgroundImageOpacity = getEffectiveBackgroundSetting<number>("backgroundImageOpacity", effectiveBgOptions);

    return (
        <>
            {effectiveBackgroundEnabled && !inNewTab && (
                <style>
                    {`
                        body {
                            background: ${effectiveBackgroundColor != null && effectiveBackgroundEnabled ? effectiveBackgroundColor : "unset"};
                        }
                    `}
                </style>
            )}

            {settings.newTabBackgroundEnabled && inNewTab === true && (
                <style>
                    {`
                        body {
                            background: ${settings.newTabBackgroundColor != null && settings.newTabBackgroundEnabled ? settings.newTabBackgroundColor : "unset"};
                        }
                    `}
                </style>
            )}

            {showBackgroundImage && settings.newTabBackgroundImageEnabled && inNewTab === true && (
                <style>
                    {`
                        body::before {
                            content: "";
                            position: fixed;
                            inset: 0;
                            z-index: -1;
                            background-image: url("${settings.newTabBackgroundImageUrl}");
                            filter: blur(${settings.newTabBackgroundImageBlur}px) saturate(${settings.newTabBackgroundImageSaturation}) hue-rotate(${settings.newTabBackgroundImageHue}deg) contrast(${settings.newTabBackgroundImageContrast});
                            background-size: ${settings.newTabBackgroundImageSize}%;
                            background-position: ${settings.newTabBackgroundImagePositionX}% ${settings.newTabBackgroundImagePositionY}%;
                            opacity: ${settings.newTabBackgroundImageOpacity};
                        }
                    `}
                    {settings.newTabBackgroundImageEnabled && settings.newTabBackgroundImageUrl
                        ? `
                            body {
                                background-color: transparent !important;
                            }
                        `
                        : ``}
                </style>
            )}
            {showBackgroundImage && effectiveBackgroundImageEnabled && (inSidepanel === true || inPopup === true) && (
                <style>
                    {`
                        body::before {
                            content: "";
                            position: fixed;
                            inset: 0;
                            z-index: -1;
                            background-image: url("${effectiveBackgroundImageUrl}");
                            filter: blur(${effectiveBackgroundImageBlur}px) saturate(${effectiveBackgroundImageSaturation}) hue-rotate(${effectiveBackgroundImageHue}deg) contrast(${effectiveBackgroundImageContrast});
                            background-size: ${effectiveBackgroundImageSize}%;
                            background-position: ${effectiveBackgroundImagePositionX}% ${effectiveBackgroundImagePositionY}%;
                            opacity: ${effectiveBackgroundImageOpacity};
                        }
                    `}
                    {effectiveBackgroundImageEnabled && effectiveBackgroundImageUrl
                        ? `
                            body {
                                background-color: transparent !important;
                            }
                        `
                        : ``}
                </style>
            )}
            {settings.enableCustomCss && <style>{settings.customCss}</style>}
            <TooltipProvider delayDuration={500} disableHoverableContent={true} skipDelayDuration={500}>
                <DndContext
                    sensors={sensors}
                    collisionDetection={activeDndId?.startsWith(ItemType.CPINNED) ? closestCenter : pointerWithin}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={_handleDragEnd}
                    modifiers={
                        activeDndId?.startsWith(ItemType.CPINNED)
                            ? []
                            : workspaces.some((w) => w.id === activeDndId)
                              ? [restrictToHorizontalAxis]
                              : [restrictToVerticalAxis]
                    }
                >
                    <div
                        id="tabs-manager-container"
                        className={cn(
                            "relative flex w-full flex-col",
                            settings.enableCustomCss && "custom-css-enabled",
                            inPopup && "in-popup",
                            inSidepanel && "in-sidepanel",
                            inNewTab && "in-new-tab"
                        )}
                        style={{
                            height: inPopup ? containerHeight : "100vh",
                            minHeight: inPopup ? containerHeight : "100vh",
                            maxHeight: inPopup ? containerHeight : "100vh",
                            maxWidth: "100%",
                            minWidth: "100%",
                            width: `${settings.popupWidth}px`,
                            fontSize: `${settings.fontSize}px`,
                        }}
                        onAuxClick={middleClickOpensNewTab}
                        onContextMenu={(e) => {
                            // Disable the browser's default context when right clicking on the extension's background in production (needed in dev to reload/inspect)
                            if (process.env.NODE_ENV === "production") {
                                e.preventDefault();
                                e.stopPropagation();
                            }
                        }}
                    >
                        {/* Header */}
                        <TabManagerHeader />

                        {/* Windows Drop Zone - shown when dragging */}
                        <WindowsDropZone />

                        <TabManagerScrollArea
                            scrollContainerRef={scrollContainerRef}
                            hasPinned={hasPinned}
                            dndItemIds={getDndItems(
                                pinnedTabs,
                                regularTabs,
                                tabGroups,
                                isDuplicateCheckMode ? new Set<number>() : collapsedGroups,
                                searchTerm,
                                settings.showNewTabButton
                            )}
                            itemsToRender={itemsToRender}
                        />

                        <SelectedTabsNotice />

                        <TabManagerFooter />

                        {/* Show a simpler hovering version of the tab or group when dragging */}
                        <DragOverlay className="pointer-events-none" dropAnimation={null}>
                            {(() => {
                                if (!activeDndId || !draggedItem) {
                                    return null;
                                }

                                if (activeDndId.split("-")[0] === ItemType.CPINNED) {
                                    return <TabItemCompactPinned tab={draggedItem as Tab} isOverlay={true} />;
                                } else if (activeDndId.split("-")[0] === ItemType.GROUP) {
                                    return (
                                        <GroupItem
                                            isOverlay={true}
                                            id={activeDndId}
                                            group={draggedItem as TabGroup}
                                            showDropTarget={false}
                                            onTabSelect={() => {}}
                                        />
                                    );
                                } else {
                                    return (
                                        <TabItem
                                            _className="regular-tab"
                                            isOverlay={true}
                                            id={activeDndId}
                                            tab={draggedItem as Tab}
                                            showDropTarget={false}
                                        />
                                    );
                                }
                            })()}
                        </DragOverlay>
                    </div>
                </DndContext>
                {settings.aiAutoOrganizeTabs && (
                    <AutoOrganizeDialog
                        open={isAutoOrganizeDialogOpen}
                        onClose={() => setIsAutoOrganizeDialogOpen(false)}
                        tabsById={Object.fromEntries(regularTabs.map((t) => [t.id, t]))}
                        loading={isAutoOrganizeLoading}
                    />
                )}

                <DeleteUselessTabsDialog
                    open={isDeleteUselessTabsDialogOpen}
                    onClose={() => setIsDeleteUselessTabsDialogOpen(false)}
                    tabsById={Object.fromEntries([...pinnedTabs, ...regularTabs, ...tabGroups.flatMap((g) => g.tabs)].map((t) => [t.id, t]))}
                    loading={isDeleteUselessTabsLoading}
                />

                {/* Dialogs */}

                {/* Window Selection Dialog */}
                <WindowSelectionDialog />

                {/* Rename Group Dialog */}
                <RenameGroupDialog />

                {/* Session Management Dialog */}
                <SessionManagementDialog
                    isRestoreDialogOpen={isRestoreDialogOpen}
                    setIsRestoreDialogOpen={setIsRestoreDialogOpen}
                    savedSessions={savedSessions}
                    setSavedSessions={setSavedSessions}
                />

                {/* Dialogs */}
                <AddToGroupDialog isOpen={isAddToGroupModalOpen} onClose={() => setIsAddToGroupModalOpen(false)} />

                {/* Close Tabs Below Dialog */}
                <CloseTabsDialog />

                {/* Bulk Open Links Dialog */}
                <BulkOpenLinksDialog />
            </TooltipProvider>

            {/* Toaster */}
            <Toaster
                mobileOffset={{ bottom: "10px" }}
                offset={{ bottom: "10px" }}
                duration={toastDuration}
                closeButton={true}
                position="bottom-center"
                richColors
                swipeDirections={["left", "right"]}
                toastOptions={{
                    style: {
                        userSelect: "none",
                    },
                }}
            />
        </>
    );
}
