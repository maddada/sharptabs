import { Button } from "@/components/ui/button";
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useSelectionStore } from "@/stores/selectionStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTabManagerStore } from "@/stores/tabManagerStore";
import { useTabsStore } from "@/stores/tabsStore";
import { useDndStore } from "@/stores/dndStore";
import { ItemType } from "@/types/CombinedItem";
import { Tab } from "@/types/Tab";
import { cn } from "@/utils/cn";
import { centerContextMenu } from "@/utils/tabs/centerContextMenu";
import { createTooltipString } from "@/utils/tabs/createTooltip";
import { getTabTitle } from "@/utils/tabs/getTabTitle";
import { isDiscardedTab, isSuspendedByChrome } from "@/utils/tabs/isDiscardedTab";
import { useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Moon, X } from "lucide-react";
import { useRef } from "react";
import { TabFavicon } from "./TabFavicon";
import { ContextMenuItems } from "./TabItemContextMenuItems";
import { handleAuxClick, handleCloseTab, handleMouseDown } from "./TabItemHandlers";
import { TabMediaButton } from "./TabMediaButton";
import { TabPinButton } from "./TabPinButton";
import { TabFaviconNotification } from "./TabFaviconNotification";

type TabItemProps = {
    id: string; // Unique ID for dnd-kit (e.g., "pinned-1", "regular-2", "gtab-3")
    _className: string;
    tab: Tab;
    showDropTarget: boolean;
    isOverlay?: boolean;
    "data-tab-id"?: number;
    selected?: boolean;
    onSelect?: (tabId: number, e: React.MouseEvent | React.KeyboardEvent) => void;
    isLastGtab?: boolean;
};

export type TabItemState = {
    iconError: boolean;
    isLoading: boolean;
    isMuted: boolean;
    isAudible: boolean;
    isDiscarded: boolean;
    isActive: boolean;
    isSuspendedByChrome: boolean;
};

export const TabItem = ({ id, _className, tab, showDropTarget, isOverlay = false, "data-tab-id": _dataTabId, selected, onSelect }: TabItemProps) => {
    // Get values from stores
    const activeTabId = useTabsStore((s) => s.activeTabId);
    const dropTargetId = useDndStore((s) => s.dropTargetId);
    const activeDndId = useDndStore((s) => s.activeDndId);
    const isDuplicateCheckMode = useTabManagerStore((s) => s.isDuplicateCheckMode);

    const { settings } = useSettingsStore();
    const { attributes, listeners, setNodeRef, isDragging } = useSortable({
        id: id,
        data: { type: tab.pinned ? ItemType.PINNED : tab.groupId === -1 ? ItemType.REGULAR : ItemType.GTAB, accepts: [] },
        animateLayoutChanges: () => false,
        strategy: verticalListSortingStrategy,
    });

    const selectedTabIds = useSelectionStore((s) => s.selectedTabIds);
    const titleSpanRef = useRef<HTMLSpanElement>(null);

    // Derive tab state from props - no need for useState or useEffect
    const tabState: TabItemState = {
        iconError: false, // Not currently used, kept for interface compatibility
        isLoading: tab.status === "loading",
        isMuted: tab.mutedInfo?.muted ?? false,
        isAudible: tab.audible ?? false,
        isDiscarded: isDiscardedTab(tab),
        isActive: tab.id === activeTabId,
        isSuspendedByChrome: isSuspendedByChrome(tab),
    };

    // Build tooltip dynamically on hover - title only shows when truncated, URL always shows when enabled
    const handleTooltipMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        const titleEl = titleSpanRef.current;
        const isTitleTruncated = titleEl ? titleEl.scrollWidth > titleEl.clientWidth : true;

        e.currentTarget.title = createTooltipString(tab, {
            showTitleInTooltips: settings.showTitleInTooltips,
            showUrlInTooltips: settings.showUrlInTooltips,
            isDuplicateCheckMode,
            isTitleTruncated,
        });
    };

    // Early return if tab is undefined
    if (!tab) {
        return null;
    }

    return isOverlay ? (
        <div
            style={{ borderRadius: `${settings.tabRoundness}px` }}
            className={`text-bold pointer-events-none mx-1 flex w-[calc(100%-8px)] select-none items-center gap-2 truncate bg-neutral-300/50 py-[9px] pl-[6px] text-[14px] font-medium opacity-100`}
        >
            <div className="max-h-4 min-h-4 min-w-4 max-w-4">
                <TabFavicon tabState={tabState} tab={tab} settings={settings} />
            </div>
            <span className="max-w-100% truncate">{getTabTitle(tab)}</span>
        </div>
    ) : (
        <ContextMenu
            onOpenChange={(open) => {
                centerContextMenu(open);
            }}
        >
            <ContextMenuTrigger>
                <div
                    id={String(id)}
                    ref={setNodeRef}
                    onMouseEnter={handleTooltipMouseEnter}
                    style={{
                        height: `${settings.tabHeight}px`,
                        minHeight: `${settings.tabHeight}px`,
                        maxHeight: `${settings.tabHeight}px`,
                        borderRadius: `${settings.tabRoundness}px`,
                    }}
                    data-tab-id={id}
                    className={cn(
                        String(_className),
                        // Selectors for custom css
                        "tab-item",
                        tabState.isActive ? "active-tab-item" : "",
                        tabState.isDiscarded || (tab.url?.includes("chrome-extension://") && tab.url?.includes("/park.html?title"))
                            ? "discarded-tab-item"
                            : "",
                        tabState.isMuted ? "muted-tab-item" : "",
                        tabState.isAudible ? "audible-tab-item" : "",
                        tabState.isLoading ? "loading-tab-item" : "",
                        tab.pinned ? "pinned-tab-item" : "",
                        tab.groupId !== -1 ? "grouped-tab-item" : "",

                        // Default styles
                        "group w-[calc(100%-8px)] justify-start gap-2 py-2 select-none border-transparent relative cursor-default border-2 rounded-md mx-1",

                        // Base styles
                        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-30 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 px-2 hover:bg-neutral-200/70 hover:dark:bg-neutral-600/50",

                        // If tab is active
                        tabState.isActive
                            ? "active-tab-item bg-neutral-200/70 dark:text-light hover:bg-neutral-200/70 hover:dark:bg-neutral-600/70 dark:bg-neutral-600/50 shadow-lg border-primary/50 dark:border-muted-foreground/70"
                            : "",

                        // If tab is selected and there's more than 1 selected tab show an outline
                        selected && (selectedTabIds?.size ?? 0) > 1 ? "border-sky-500 dark:border-sky-500" : "",

                        isOverlay ? "opacity-0" : "",

                        // Adds a drop target indicator class below the tab during drag-and-drop, except when dragging a group over a group tab or when dragging a cpinned item.
                        showDropTarget &&
                            dropTargetId === id &&
                            !(id.includes(ItemType.GTAB) && activeDndId?.includes(ItemType.GROUP)) &&
                            !activeDndId?.startsWith(ItemType.CPINNED)
                            ? "after:absolute after:bottom-[-2px] after:left-0 after:w-full after:h-1 after:bg-black/50 after:dark:bg-white after:content-['']"
                            : ""

                        // $$ If the tab is the last tab in a group
                        // isLastGtab && "focus:mb-0.5"
                    )}
                    onClick={(e) => {
                        if (onSelect) onSelect(tab.id, e);
                    }}
                    onMouseDown={(e) => handleMouseDown(e)}
                    onAuxClick={(e) => handleAuxClick(e, tab)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            if (onSelect) onSelect(tab.id, e);

                            if (useTabManagerStore.getState().inPopup) {
                                window.close();
                            }
                        }
                    }}
                    {...attributes}
                    {...listeners}
                >
                    <div
                        style={{ color: settings.enableTabTextColor && settings.tabTextColor ? settings.tabTextColor : "inherit" }}
                        className={cn(
                            "tab-content-wrapper pointer-events-none flex w-full items-center gap-2",
                            tabState.isDiscarded && !tabState.isActive && settings.fadeSuspendedTabText ? "opacity-70 dark:opacity-60" : "",
                            isDragging ? "opacity-50 dark:opacity-40" : "" // cursor-pointer
                        )}
                    >
                        <div className="tab-favicon-container relative max-h-4 max-w-4">
                            <TabFavicon tabState={tabState} tab={tab} settings={settings} />
                            {settings.showFaviconNotifications && <TabFaviconNotification tabState={tabState} tab={tab} />}
                        </div>
                        <div className="tab-media-container">
                            <TabMediaButton tabState={tabState} tab={tab} />
                        </div>
                        {!settings.hidePinButtonOnPinnedTabs && <TabPinButton tab={tab} />}
                        <span ref={titleSpanRef} className={cn("tab-title shrink grow basis-[0%] justify-self-start truncate text-left")}>
                            {getTabTitle(tab)}
                        </span>
                        {settings.showDiscardedIcon && tabState.isDiscarded && (
                            <div className="tab-discarded-icon flex h-6 w-6 select-none items-center justify-center justify-self-end opacity-75 group-hover:hidden">
                                <Moon className="h-4 w-4 text-amber-300 opacity-50" />
                            </div>
                        )}
                        {settings.showCloseButton && !(settings.disableMiddleClickAndCloseButtonOnPinnedTabs && tab.pinned) && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="tab-close-button pointer-events-auto z-10 hidden h-6 w-6 select-none justify-self-end p-1 opacity-0 hover:bg-white hover:text-neutral-800 group-hover:block group-hover:opacity-75"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCloseTab(e, tab);
                                }}
                                tabIndex={-1}
                            >
                                <X className="block h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </ContextMenuTrigger>
            <ContextMenuItems tab={tab} />
        </ContextMenu>
    );
};

TabItem.displayName = "TabItem";
