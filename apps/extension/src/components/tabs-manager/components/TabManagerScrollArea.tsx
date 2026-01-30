import { CompactPinnedTabs } from "@/components/tab-list-items/CompactPinnedTabs";
import { GroupItem } from "@/components/tab-list-items/GroupItem";
import { TabItem } from "@/components/tab-list-items/TabItem";
import { useOverlayScrollbars } from "@/hooks/useOverlayScrollbars";
import { useSelectionStore } from "@/stores/selectionStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTabManagerStore } from "@/stores/tabManagerStore";
import { useTabsStore } from "@/stores/tabsStore";
import { useDndStore } from "@/stores/dndStore";
import { useSearchStore } from "@/stores/searchStore";
import { CombinedItem, ItemType } from "@/types/CombinedItem";
import { Tab } from "@/types/Tab";
import { TabGroup } from "@/types/TabGroup";
import { cn } from "@/utils/cn";
import { middleClickOpensNewTab } from "@/utils/tabs/middleClickOpensNewTab";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { OverlayScrollbars } from "overlayscrollbars";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/styles/overlayscrollbars.css";
import { Fragment } from "react/jsx-runtime";
import { handleTabSelection } from "../helpers/handleTabSelection";
import { toggleGroup } from "../helpers/toggleGroup";
import { expandAndScrollToActiveTab } from "@/utils/tabs/expandAndScrollToActiveTab";
import { AfterGroupDropTarget } from "./AfterGroupDropTarget";
import { BelowAllTabsDropTarget } from "./BelowAllTabsDropTarget";
import { NewTabButtonDropTarget } from "./NewTabButtonDropTarget";
import { OtherWindowsTabs } from "./OtherWindowsTabs";
import { PinnedTabsSeparator, TabHeaderSeperator } from "./PinnedTabsSeparators";
import { WorkspaceBar } from "./WorkspaceBar";

export function TabManagerScrollArea({
    scrollContainerRef,
    hasPinned,
    dndItemIds,
    itemsToRender,
}: {
    scrollContainerRef: React.MutableRefObject<HTMLDivElement | null>;
    hasPinned: boolean;
    dndItemIds: string[];
    itemsToRender: CombinedItem[];
}) {
    // Get values from stores
    const activeDndId = useDndStore((s) => s.activeDndId);
    const dropTargetId = useDndStore((s) => s.dropTargetId);
    const recentlyDraggedItem = useDndStore((s) => s.recentlyDraggedItem);

    const searchTerm = useSearchStore((s) => s.searchTerm);

    const isDuplicateCheckMode = useTabManagerStore((s) => s.isDuplicateCheckMode);
    const otherWindowsData = useTabManagerStore((s) => s.otherWindowsData);
    const { setIsAddToGroupModalOpen } = useTabManagerStore((s) => s.actions);

    const collapsedGroups = useTabsStore((s) => s.collapsedGroups);
    const { setCollapsedGroups } = useTabsStore((s) => s.actions);

    const handleSearchClear = () => {
        const previousCollapsedState = useTabManagerStore.getState().previousCollapsedState;
        const setSearchTerm = useSearchStore.getState().actions.setSearchTerm;
        const setIsSearchBarFocused = useSearchStore.getState().actions.setIsSearchBarFocused;
        const searchInputRef = useSearchStore.getState().searchInputRef;
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
    const { settings } = useSettingsStore();
    const selectedTabIds = useSelectionStore((s) => s.selectedTabIds);
    const activeTabId = useTabsStore((s) => s.activeTabId);
    const skipAnimation = useTabManagerStore((s) => s.skipAnimation);
    const setSkipAnimation = useTabManagerStore((s) => s.actions.setSkipAnimation);

    const { handleScrollbarsInitialized } = useOverlayScrollbars({
        alwaysShowScrollbar: settings.alwaysShowScrollbar,
        showScrollbar: settings.showScrollbar,
    });

    // Extract pinned tabs for compact mode
    const pinnedItemsInFilter = itemsToRender.filter((item) => item.type === ItemType.PINNED);
    const pinnedTabsForCompact = pinnedItemsInFilter.map((item) => item.data as Tab);

    // Filter out pinned tabs from regular list when compact mode is enabled
    const itemsToRenderFiltered = settings.compactPinnedTabs ? itemsToRender.filter((item) => item.type !== ItemType.PINNED) : itemsToRender;

    // Update hasPinned logic for compact mode
    const hasPinnedInRegularList = itemsToRenderFiltered.some((item) => item.type === ItemType.PINNED);

    return (
        <>
            {settings.showSearchBar && settings.enableWorkspaces && <div className="h-[14px] flex-shrink-0"></div>}

            {!settings.showSearchBar && settings.enableWorkspaces && <div className="h-[10px] flex-shrink-0"></div>}

            {/* Workspace Bar - positioned below search and above tab header separator */}
            {settings.enableWorkspaces && <WorkspaceBar />}

            {(settings.showSearchBar || settings.enableWorkspaces) && settings.compactPinnedTabs && pinnedTabsForCompact.length > 0 && (
                <div className="h-[10px] flex-shrink-0"></div>
            )}

            {/* Compact pinned tabs at the top */}
            {settings.compactPinnedTabs && pinnedTabsForCompact.length > 0 && (
                <CompactPinnedTabs pinnedTabs={pinnedTabsForCompact} onSelect={(tabId, e) => handleTabSelection(e, tabId, itemsToRender)} />
            )}
            <OverlayScrollbarsComponent
                options={{
                    overflow: {
                        x: "hidden",
                        y: "scroll",
                    },
                    scrollbars: {
                        autoHide: settings.alwaysShowScrollbar ? "never" : "leave",
                        autoHideDelay: 0,
                        visibility: !settings.showScrollbar && !settings.alwaysShowScrollbar ? "hidden" : "auto",
                    },
                }}
                events={{
                    initialized: (instance: OverlayScrollbars) => {
                        handleScrollbarsInitialized(instance);

                        const viewport = instance.elements().viewport as HTMLDivElement | null;
                        if (viewport) {
                            // Wire existing ref usages to the actual scrollable viewport
                            scrollContainerRef.current = viewport;
                            // Enforce axis-specific overflow behavior on the actual viewport element
                            viewport.style.overflowX = "hidden";
                            viewport.style.overflowY = "auto";
                        }
                    },
                }}
                className={cn("relative w-full flex-grow")}
            >
                <div
                    id="tabs-scroll-container"
                    data-show-scrollbar={settings.showScrollbar}
                    data-always-show-scrollbar={settings.alwaysShowScrollbar}
                    className={cn(
                        // Main container styles
                        "relative flex flex-col w-full min-h-[100%]"
                    )}
                    style={
                        {
                            "--header-height": "127px",
                            "--footer-height": "71px",
                            "--top-gradient-opacity": "0",
                            "--bottom-gradient-opacity": "0",
                            gap: "0px",
                        } as React.CSSProperties
                    }
                    onAuxClick={middleClickOpensNewTab}
                >
                    {!settings.compactPinnedTabs && (
                        <TabHeaderSeperator
                            key={`${ItemType.PSEPARATOR}-1`}
                            id={`${ItemType.PSEPARATOR}-1`}
                            activeDndId={activeDndId}
                            dropTargetId={dropTargetId}
                            hasPinned={hasPinned}
                        />
                    )}
                    <SortableContext items={dndItemIds} strategy={verticalListSortingStrategy}>
                        {itemsToRenderFiltered.map((item, index, array) => {
                            const lastPinnedIndex = array.findLastIndex((i) => i.type === ItemType.PINNED);

                            const isFirstUnpinned =
                                item.type !== ItemType.PINNED && (lastPinnedIndex === -1 ? index === 0 : index === lastPinnedIndex + 1);

                            // Only show drop target if the operation is allowed
                            const draggedItemType = activeDndId ? activeDndId.split("-")[0] : null;

                            // Don't show drop target when dragging pinned items over non-pinned items
                            const draggingPinnedOverNonPinned =
                                draggedItemType === ItemType.PINNED && (item.type === ItemType.REGULAR || item.type === ItemType.GROUP);
                            // Don't show drop target when dragging a tab or group to the pinned tabs section
                            const draggingTabOrGroupToPinned =
                                (draggedItemType === ItemType.REGULAR || draggedItemType === ItemType.GROUP || draggedItemType === ItemType.GTAB) &&
                                item.type === ItemType.PINNED;

                            const showDropTarget = !draggingPinnedOverNonPinned && !draggingTabOrGroupToPinned;

                            return (
                                <Fragment key={item.dndId}>
                                    {isFirstUnpinned && (hasPinned || settings.compactPinnedTabs) && (
                                        <PinnedTabsSeparator
                                            key={`${ItemType.PSEPARATOR}-2`}
                                            id={`${ItemType.PSEPARATOR}-2`}
                                            activeDndId={activeDndId}
                                            dropTargetId={dropTargetId}
                                        />
                                    )}
                                    <div id={item.dndId} className={cn(recentlyDraggedItem === item.data.id && `animate-gentle-settle-zoom-out`)}>
                                        {item.type === ItemType.PINNED && (
                                            <TabItem
                                                id={item.dndId}
                                                _className="pinned-tab"
                                                tab={item.data as Tab}
                                                showDropTarget={showDropTarget}
                                                selected={selectedTabIds.has(item.data.id)}
                                                onSelect={(tabId, e) => handleTabSelection(e, tabId, itemsToRender)}
                                            />
                                        )}
                                        {item.type === ItemType.REGULAR && (
                                            <TabItem
                                                id={item.dndId}
                                                _className="regular-tab"
                                                tab={item.data as Tab}
                                                showDropTarget={showDropTarget}
                                                selected={selectedTabIds.has(item.data.id)}
                                                onSelect={(tabId, e) => handleTabSelection(e, tabId, itemsToRender)}
                                            />
                                        )}
                                        {item.type === ItemType.GROUP && (
                                            <>
                                                <GroupItem
                                                    id={item.dndId}
                                                    group={item.data as TabGroup}
                                                    showDropTarget={showDropTarget}
                                                    onTabSelect={(tabId, e) => handleTabSelection(e, tabId, itemsToRender)}
                                                />
                                                <AfterGroupDropTarget
                                                    activeDndId={activeDndId}
                                                    dropTargetId={dropTargetId}
                                                    id={item.dndId.replace(ItemType.GROUP, ItemType.GSEPARATOR)}
                                                    hasPinned={hasPinnedInRegularList}
                                                />
                                            </>
                                        )}
                                    </div>
                                </Fragment>
                            );
                        })}

                        {/* New Tab Button right after last tab - with drop indicator when active */}
                        {settings.showNewTabButton && (
                            <NewTabButtonDropTarget activeDndId={activeDndId} dropTargetId={dropTargetId} id={`${ItemType.ESEPARATOR}-newtab`} />
                        )}

                        {/* Drop target for tabs below all tabs - fills remaining space */}
                        <BelowAllTabsDropTarget
                            activeDndId={activeDndId}
                            dropTargetId={dropTargetId}
                            id={`${ItemType.ESEPARATOR}-1`}
                            hideIndicator={settings.showNewTabButton}
                        />
                    </SortableContext>

                    {/* Render other windows' filtered items below current window's tabs */}
                    <OtherWindowsTabs />
                </div>
            </OverlayScrollbarsComponent>
        </>
    );
}
