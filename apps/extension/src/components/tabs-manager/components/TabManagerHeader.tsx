import { CustomTooltip } from "@/components/simple/CustomTooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";
import { ChevronLeft, ChevronRight, Search, X, Copy, ChevronsUpDown, ChevronsDownUp } from "lucide-react";
import React, { useEffect, useState } from "react";
import { MoreOptionsButton } from "./MoreOptionsButton";
import { useTabManagerStore } from "@/stores/tabManagerStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useSearchStore } from "@/stores/searchStore";
import { useTabsStore } from "@/stores/tabsStore";
import { useSelectionStore } from "@/stores/selectionStore";
import { getOpacityClass } from "@/utils/getOpacityClass";

// Debounce utility
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout | null = null;
    return ((...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    }) as T;
}

export function TabManagerHeader() {
    // Get values from stores
    const searchInputRef = useSearchStore((s) => s.searchInputRef);
    const searchTerm = useSearchStore((s) => s.searchTerm);
    const isSearchBarFocused = useSearchStore((s) => s.isSearchBarFocused);
    const { setSearchTerm, setIsSearchBarFocused } = useSearchStore((s) => s.actions);

    const inNewTab = useTabManagerStore((state) => state.inNewTab);
    const inPopup = useTabManagerStore((state) => state.inPopup);

    const [navigationState, setNavigationState] = useState({ canGoBack: false, canGoForward: false });
    const [isNavigating, setIsNavigating] = useState(false);
    const [showHeaderInitially, setShowHeaderInitially] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const isWindowFocused = useTabManagerStore((state) => state.isWindowFocused);
    const initializeWindowFocusListeners = useTabManagerStore((state) => state.actions.initializeWindowFocusListeners);
    const cleanupWindowFocusListeners = useTabManagerStore((state) => state.actions.cleanupWindowFocusListeners);
    const isDuplicateCheckMode = useTabManagerStore((state) => state.isDuplicateCheckMode);
    const toggleDuplicateCheckMode = useTabManagerStore((state) => state.actions.toggleDuplicateCheckMode);
    const duplicateTabsCount = useTabManagerStore((state) => state.duplicateTabsCount);
    const settings = useSettingsStore((state) => state.settings);

    // Collapse/Expand all logic
    const tabGroups = useTabsStore((s) => s.tabGroups);
    const collapsedGroups = useTabsStore((s) => s.collapsedGroups);
    const { setCollapsedGroups } = useTabsStore((s) => s.actions);
    const setSkipAnimation = useTabManagerStore((s) => s.actions.setSkipAnimation);

    const allGroupIds = tabGroups.map((group) => group.id);
    const areAllCollapsed = allGroupIds.length > 0 && allGroupIds.every((id) => collapsedGroups.has(id));

    // Get handlers from parent component via a custom hook or import them as utility functions
    // For now, we'll create them inline using store values
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSearchTerm = e.target.value;
        const collapsedGroups = useTabsStore.getState().collapsedGroups;
        const previousCollapsedState = useTabManagerStore.getState().previousCollapsedState;
        const setCollapsedGroups = useTabsStore.getState().actions.setCollapsedGroups;
        const setPreviousCollapsedState = useTabManagerStore.getState().actions.setPreviousCollapsedState;

        if (newSearchTerm && !searchTerm) {
            setPreviousCollapsedState(collapsedGroups);
            setCollapsedGroups(new Set());
        } else if (!newSearchTerm && searchTerm) {
            setCollapsedGroups(previousCollapsedState);
            setPreviousCollapsedState(new Set());
        }
        setSearchTerm(newSearchTerm);
    };

    const handleSearchClear = () => {
        const previousCollapsedState = useTabManagerStore.getState().previousCollapsedState;
        const setCollapsedGroups = useTabsStore.getState().actions.setCollapsedGroups;
        const setPreviousCollapsedState = useTabManagerStore.getState().actions.setPreviousCollapsedState;

        setSearchTerm("");
        if (previousCollapsedState.size > 0 || searchTerm) {
            setCollapsedGroups(previousCollapsedState);
            setPreviousCollapsedState(new Set());
        }
        if (searchInputRef?.current) {
            searchInputRef.current.blur();
        }
        setIsSearchBarFocused(false);
        useSelectionStore.getState().actions.clearSelection();
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") {
            handleSearchClear();
            e.stopPropagation();
        }

        if (e.key === "ArrowDown" || e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();

            const tabElements = document.querySelectorAll("div[data-tab-id], button[id^='group-']");
            const focusableElements = Array.from(tabElements).filter((el) => {
                const element = el as HTMLElement;
                return element.offsetParent !== null && !element.hasAttribute("disabled") && element.getAttribute("tabindex") !== "-1";
            });

            if (focusableElements.length > 0) {
                const firstElement = focusableElements[0] as HTMLElement;
                firstElement.focus();

                if (e.key === "Enter") {
                    setTimeout(() => {
                        firstElement.click();
                    }, 75);
                }

                firstElement.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                });
            }
        }
    };

    const opacityClass = getOpacityClass(settings.headerFooterOpacity);

    // Initialize window focus listeners
    useEffect(() => {
        initializeWindowFocusListeners();
        return cleanupWindowFocusListeners;
    }, [initializeWindowFocusListeners, cleanupWindowFocusListeners]);

    // Show header initially for 1 second when auto-collapse is enabled
    useEffect(() => {
        if (settings.autoCollapseHeaderButtons) {
            setShowHeaderInitially(true);
            const timer = setTimeout(() => {
                // Only collapse if not hovered
                if (!isHovered) {
                    setShowHeaderInitially(false);
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [settings.autoCollapseHeaderButtons, isHovered]);

    // Create a stable reference for the debounced update function
    const debouncedUpdateNavigationState = React.useRef(
        debounce(async () => {
            try {
                const currentWindow = await chrome.windows.getCurrent();
                if (currentWindow.id) {
                    const response = await chrome.runtime.sendMessage({
                        type: "GET_NAVIGATION_STATE",
                        windowId: currentWindow.id,
                    });
                    // Ensure response has the expected structure
                    if (response && typeof response === "object" && "canGoBack" in response && "canGoForward" in response) {
                        setNavigationState(response);
                    } else {
                        console.log("Invalid navigation state response:", response);
                        setNavigationState({ canGoBack: false, canGoForward: false });
                    }
                }
            } catch (error) {
                console.log("Error getting navigation state:", error);
                setNavigationState({ canGoBack: false, canGoForward: false });
            }
        }, 25)
    ).current;

    // Update navigation state when component mounts and when tabs change
    useEffect(() => {
        // Initial update
        debouncedUpdateNavigationState();

        // Listen for push notifications from service worker
        const handleNavigationStateMessage = async (message: any) => {
            if (message.type === "NAVIGATION_STATE_CHANGED") {
                try {
                    const currentWindow = await chrome.windows.getCurrent();
                    if (currentWindow.id === message.windowId) {
                        setNavigationState(message.navigationState);
                    }
                } catch (error) {
                    console.log("Error handling navigation state push notification:", error);
                }
            }
        };

        // Listen for tab activation changes to update button states (fallback)
        const handleTabActivated = () => {
            // Use debounced update to prevent rapid state changes
            debouncedUpdateNavigationState();
        };

        // Also listen for tab removal to update navigation state (fallback)
        const handleTabRemoved = () => {
            // Delay slightly to allow service worker to process the removal
            setTimeout(() => debouncedUpdateNavigationState(), 25);
        };

        chrome.runtime.onMessage.addListener(handleNavigationStateMessage);
        chrome.tabs.onActivated.addListener(handleTabActivated);
        chrome.tabs.onRemoved.addListener(handleTabRemoved);

        return () => {
            chrome.runtime.onMessage.removeListener(handleNavigationStateMessage);
            chrome.tabs.onActivated.removeListener(handleTabActivated);
            chrome.tabs.onRemoved.removeListener(handleTabRemoved);
        };
    }, [debouncedUpdateNavigationState]);

    const handleNavigateBack = async () => {
        if (isNavigating) return; // Prevent concurrent navigations

        setIsNavigating(true);
        try {
            const currentWindow = await chrome.windows.getCurrent();
            if (currentWindow.id) {
                const response = await chrome.runtime.sendMessage({
                    type: "NAVIGATE_BACK",
                    windowId: currentWindow.id,
                });

                if (response?.success) {
                    // Immediately update navigation state after successful navigation
                    debouncedUpdateNavigationState();
                } else {
                    console.log("Navigation back failed");
                    // Update navigation state immediately on failure
                    debouncedUpdateNavigationState();
                }
            }
            // Reset navigation state after a delay
            setTimeout(() => setIsNavigating(false), 100);
        } catch (error) {
            console.log("Error navigating back:", error);
            // Update navigation state on error
            debouncedUpdateNavigationState();
            // Reset navigation state after a delay
            setTimeout(() => setIsNavigating(false), 100);
        }
    };

    const handleNavigateForward = async () => {
        if (isNavigating) return; // Prevent concurrent navigations

        setIsNavigating(true);
        try {
            const currentWindow = await chrome.windows.getCurrent();
            if (currentWindow.id) {
                const response = await chrome.runtime.sendMessage({
                    type: "NAVIGATE_FORWARD",
                    windowId: currentWindow.id,
                });

                if (response?.success) {
                    // Immediately update navigation state after successful navigation
                    debouncedUpdateNavigationState();
                } else {
                    console.log("Navigation forward failed");
                    // Update navigation state immediately on failure
                    debouncedUpdateNavigationState();
                }
            }
            // Reset navigation state after a delay
            setTimeout(() => setIsNavigating(false), 30);
        } catch (error) {
            console.log("Error navigating forward:", error);
            // Update navigation state on error
            debouncedUpdateNavigationState();
            // Reset navigation state after a delay
            setTimeout(() => setIsNavigating(false), 30);
        }
    };

    const handleCollapseExpandAll = () => {
        setSkipAnimation(true);
        if (areAllCollapsed) {
            setCollapsedGroups(new Set());
        } else {
            setCollapsedGroups(new Set(allGroupIds));
        }
    };

    const minimalNewTabsPage = useSettingsStore.getState().settings.minimalNewTabsPage;

    return (
        <>
            <div
                id="tabs-manager-header"
                className={cn(
                    "flex h-fit flex-col border-foreground/40 pt-0 px-2 opacity-80 dark:border-foreground/20 z-20",
                    inNewTab && settings.minimalNewTabsPage && "border-b-0",
                    (settings.showSearchBar || searchTerm || isSearchBarFocused || inPopup) && !settings.enableWorkspaces && "pb-2"
                )}
            >
                <div
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className={cn(
                        "header-buttons-container flex items-center justify-between transition-all duration-300 ease-in-out",
                        settings.autoCollapseHeaderButtons &&
                            !showHeaderInitially &&
                            !inPopup &&
                            !isDuplicateCheckMode &&
                            !isHovered &&
                            "mt-0 h-[14px] overflow-hidden opacity-0",
                        settings.autoCollapseHeaderButtons &&
                            (showHeaderInitially || inPopup || isDuplicateCheckMode || isHovered) &&
                            "pt-2 pb-2 h-[34px] opacity-100",
                        !settings.autoCollapseHeaderButtons && "pt-2 pb-2"
                    )}
                >
                    <div
                        className={cn("header-buttons-left flex items-center gap-1", inNewTab && minimalNewTabsPage && "opacity-0 hover:opacity-100")}
                    >
                        {/* Navigation Buttons */}
                        {settings.showNavigationButtons && (
                            <>
                                <CustomTooltip content="Go Back">
                                    <div className={opacityClass}>
                                        <Button
                                            id="header-nav-back"
                                            variant="ghost"
                                            className="navigation-button-left h-6 px-2"
                                            disabled={!navigationState.canGoBack || isNavigating}
                                            onClick={handleNavigateBack}
                                            tabIndex={-1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CustomTooltip>
                                <CustomTooltip content="Go Forward">
                                    <div className={opacityClass}>
                                        <Button
                                            id="header-nav-forward"
                                            variant="ghost"
                                            className="navigation-button-right h-6 px-2"
                                            disabled={!navigationState.canGoForward || isNavigating}
                                            onClick={handleNavigateForward}
                                            tabIndex={-1}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CustomTooltip>
                            </>
                        )}

                        {/* Collapse/Expand All Button */}
                        <CustomTooltip content={areAllCollapsed ? "Expand All" : "Collapse All"}>
                            <div className={opacityClass}>
                                <Button
                                    id="header-collapse-expand-all"
                                    variant="ghost"
                                    className="h-6 px-2"
                                    disabled={allGroupIds.length === 0}
                                    onClick={handleCollapseExpandAll}
                                    tabIndex={-1}
                                >
                                    {areAllCollapsed ? <ChevronsUpDown className="h-4 w-4" /> : <ChevronsDownUp className="h-4 w-4" />}
                                </Button>
                            </div>
                        </CustomTooltip>

                        {/* Duplicate Check Button */}
                        {settings.showDuplicateTabsButton && (
                            <CustomTooltip delayDuration={duplicateTabsCount === 0 ? 99999 : undefined} content="Show duplicate tabs">
                                <div id="header-duplicate-badge" className="relative">
                                    <div className={opacityClass}>
                                        <Button
                                            id="header-duplicate-check"
                                            variant="ghost"
                                            className={cn(
                                                "duplicate-tabs-button px-2 h-6 transition-all duration-300 ease-in-out gap-1",
                                                duplicateTabsCount > 0 ? "opacity-100" : "opacity-0 pointer-events-none",
                                                isDuplicateCheckMode && "bg-foreground/20"
                                            )}
                                            onClick={toggleDuplicateCheckMode}
                                            tabIndex={-1}
                                        >
                                            <Copy style={{ zoom: 0.9 }} />
                                            <span className="text-xs">{duplicateTabsCount}</span>
                                        </Button>
                                    </div>
                                    {/* <div
                                        className={cn(
                                            "absolute top-[2px] right-[-6px] bg-foreground/20 p-[8px] text-foreground flex h-3 w-3 items-center justify-center rounded-full text-xs font-medium shadow-lg select-none transition-opacity duration-300 ease-in-out",
                                            duplicateTabsCount > 0 ? "opacity-80" : "opacity-0 pointer-events-none"
                                        )}
                                    >
                                        {duplicateTabsCount}
                                    </div> */}
                                </div>
                            </CustomTooltip>
                        )}
                    </div>
                    <div className={cn("header-buttons-right flex items-center gap-1", "opacity-100 hover:opacity-100")}>
                        <MoreOptionsButton />
                    </div>
                </div>

                <div
                    id="search-container"
                    className="relative mt-[4px]"
                    style={{ display: settings.showSearchBar || searchTerm || isSearchBarFocused || inPopup ? "block" : "none" }}
                >
                    <Search className="text-muted-background absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
                    <Input
                        ref={searchInputRef as React.RefObject<HTMLInputElement>}
                        type="text"
                        placeholder={isWindowFocused && window.innerWidth > 200 ? "Type to Search..." : ""}
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onKeyDown={handleSearchKeyDown}
                        onFocus={() => {
                            console.log("🔍 [TabManagerHeader] Input focused!", {
                                showSearchBar: settings.showSearchBar,
                                searchTerm: searchTerm,
                                isSearchBarFocused: isSearchBarFocused,
                            });
                            setIsSearchBarFocused(true);
                        }}
                        onBlur={() => {
                            console.log("🔍 [TabManagerHeader] Input blurred!", {
                                showSearchBar: settings.showSearchBar,
                                searchTerm: searchTerm,
                            });
                            // Hide the search bar again if showSearchBar is false and searchTerm is empty
                            if (!settings.showSearchBar && !searchTerm) {
                                console.log("🔍 [TabManagerHeader] Hiding search bar - no setting and no searchTerm");
                                setIsSearchBarFocused(false);
                            }
                        }}
                        tabIndex={-1}
                        id="tabs-manager-search-input"
                        className={cn(
                            `pl-9 pr-8 h-[38px] ring-2 ring-offset-background transition-all duration-600 dark:bg-neutral-800/40 bg-neutral-200/40`,
                            opacityClass,
                            isWindowFocused ? "ring-white" : "ring-ring/30"
                        )}
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={handleSearchClear}
                            className="search-clear-button absolute right-2 top-1/2 -translate-y-1/2 transform rounded-full p-1 hover:bg-muted focus:bg-muted focus:outline-none"
                            aria-label="Clear search"
                            tabIndex={-1}
                        >
                            <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
