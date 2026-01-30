import { Button } from "@/components/ui/button";
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useSelectionStore } from "@/stores/selectionStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTabsStore } from "@/stores/tabsStore";
import { useDndStore } from "@/stores/dndStore";
import { useTabManagerStore } from "@/stores/tabManagerStore";
import { ItemType } from "@/types/CombinedItem";
import { Tab } from "@/types/Tab";
import { cn } from "@/utils/cn";
import { centerContextMenu } from "@/utils/tabs/centerContextMenu";
import { createTooltipString } from "@/utils/tabs/createTooltip";
import { isDiscardedTab, isSuspendedByChrome } from "@/utils/tabs/isDiscardedTab";
import { useSortable } from "@dnd-kit/sortable";
import { Volume2, VolumeX } from "lucide-react";
import { TabFavicon } from "./TabFavicon";
import { TabItemState } from "./TabItem";
import { ContextMenuItems } from "./TabItemContextMenuItems";
import { handleAuxClick, handleCloseTab, handleMouseDown, toggleMute } from "./TabItemHandlers";

type TabItemCompactPinnedProps = {
    tab: Tab;
    isOverlay?: boolean;
    onSelect?: (tabId: number, e: React.MouseEvent | React.KeyboardEvent) => void;
    selected?: boolean;
};

export const TabItemCompactPinned = ({ tab, isOverlay = false, onSelect, selected }: TabItemCompactPinnedProps) => {
    // Get values from stores
    const activeTabId = useTabsStore((s) => s.activeTabId);
    const dropTargetId = useDndStore((s) => s.dropTargetId);
    const activeDndId = useDndStore((s) => s.activeDndId);
    const isDuplicateCheckMode = useTabManagerStore((s) => s.isDuplicateCheckMode);

    const sortableId = `cpinned-${tab.id}`;
    const { attributes, listeners, setNodeRef, transition, isDragging } = useSortable({
        id: sortableId,
    });

    const style = {
        // transform: isOverlay ? CSS.Transform.toString(transform) : undefined,
        transition: isOverlay ? transition : undefined,
        opacity: isDragging ? 0.2 : 1,
        zIndex: isOverlay ? 10 : undefined,
    };

    const { settings } = useSettingsStore();
    const selectedTabIds = useSelectionStore((s) => s.selectedTabIds);

    // Derive state from props instead of using useEffect
    const tabState: TabItemState = {
        iconError: false,
        isLoading: tab.status === "loading",
        isMuted: tab.mutedInfo?.muted ?? false,
        isAudible: tab.audible ?? false,
        isDiscarded: isDiscardedTab(tab),
        isActive: tab.id === activeTabId,
        isSuspendedByChrome: isSuspendedByChrome(tab),
    };

    // Create the tooltip for the tab
    const tooltipString = createTooltipString(tab, {
        showTitleInTooltips: settings.showTitleInTooltips,
        showUrlInTooltips: settings.showUrlInTooltips,
        isDuplicateCheckMode,
    });

    // Early return if tab is undefined
    if (!tab) {
        return null;
    }

    return isOverlay ? (
        <div style={{ borderRadius: `${settings.tabRoundness}px` }} className="pointer-events-none size-[20px] bg-neutral-300/30 opacity-70">
            <TabFavicon tabState={tabState} tab={tab} settings={settings} />
        </div>
    ) : (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                borderRadius: dropTargetId === sortableId && activeDndId ? `${settings.tabRoundness}px` : undefined,
            }}
            {...attributes}
            className={cn(
                "relative",
                isOverlay ? "opacity-0" : "",
                // Add rounded outline to the drop target compact pinned tab
                dropTargetId === sortableId && activeDndId?.includes(ItemType.CPINNED) && activeDndId
                    ? "outline outline-2 outline-black/60 dark:outline-white/70 outline-offset-1"
                    : ""
            )}
        >
            <ContextMenu
                onOpenChange={(open) => {
                    centerContextMenu(open);
                }}
            >
                <ContextMenuTrigger>
                    <Button
                        id={`cpinned-${tab.id}`}
                        variant="ghost"
                        size="icon"
                        data-tab-id={tab.id}
                        title={tooltipString}
                        style={{ borderRadius: `${settings.tabRoundness}px` }}
                        className={cn(
                            // Base styles for compact pinned tab
                            "compact-pinned-tab relative size-[30px] p-[5px] hover:bg-neutral-200/70 hover:dark:bg-neutral-600/50 cursor-default border-2 border-transparent",

                            // Active tab styling
                            tabState.isActive
                                ? "bg-neutral-200/70 dark:bg-neutral-600/50 shadow-lg border-primary/50 dark:border-muted-foreground/70"
                                : "",

                            // Discarded tab styling
                            tabState.isDiscarded ? "opacity-70 dark:opacity-60" : "",

                            // Selection outline - show blue border when selected and there's more than 1 selected tab
                            selected && (selectedTabIds?.size ?? 0) > 1 ? "border-sky-500 dark:border-sky-500" : ""

                            // Drag cursor
                            // "cursor-grab active:cursor-grabbing"
                        )}
                        onClick={(e) => {
                            if (onSelect) onSelect(tab.id, e);
                        }}
                        onMouseDown={(e) => handleMouseDown(e)}
                        onAuxClick={(e) => {
                            if (e.button === 1) {
                                // Middle click
                                e.preventDefault();
                                e.stopPropagation();
                                handleCloseTab(e, tab);
                            } else {
                                handleAuxClick(e, tab);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                if (onSelect) onSelect(tab.id, e);
                            }
                        }}
                        {...listeners}
                    >
                        <div className="compact-pinned-icon-container relative flex h-full w-full items-center justify-center">
                            <TabFavicon tabState={tabState} tab={tab} settings={settings} />

                            {/* Audio icon overlay */}
                            {tabState.isAudible && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="compact-pinned-audio-overlay absolute -right-1 -top-1 h-3 w-3 rounded-full bg-background/80 p-0.5 opacity-90 hover:opacity-100"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleMute(e, tab, tabState);
                                    }}
                                    tabIndex={-1}
                                >
                                    {tabState.isMuted ? <VolumeX className="h-2 w-2" /> : <Volume2 className="h-2 w-2" />}
                                </Button>
                            )}

                        </div>
                    </Button>
                </ContextMenuTrigger>
                <ContextMenuItems tab={tab} />
            </ContextMenu>
        </div>
    );
};

TabItemCompactPinned.displayName = "TabItemCompactPinned";
