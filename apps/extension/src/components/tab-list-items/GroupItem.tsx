import { Button } from "@/components/ui/button";
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import { borderColorMap, colorMap, colorMapBorder, colorMapGradient } from "@/constants/colorMap";
import { useDndStore } from "@/stores/dndStore";
import { useSearchStore } from "@/stores/searchStore";
import { useSelectionStore } from "@/stores/selectionStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTabManagerStore } from "@/stores/tabManagerStore";
import { useTabsStore } from "@/stores/tabsStore";
import { ItemType } from "@/types/CombinedItem";
import { Tab } from "@/types/Tab";
import { TabGroup } from "@/types/TabGroup";
import { cn } from "@/utils/cn";
import { centerContextMenu } from "@/utils/tabs/centerContextMenu";
import { isDiscardedTab } from "@/utils/tabs/isDiscardedTab";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, MapPin, Moon, Plus, Volume2, VolumeX } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo } from "react";
import { GroupItemContextMenuItems } from "./GroupItemContextMenuItems";
import { TabItem } from "./TabItem";

interface GroupItemProps {
    id: string; // Unique ID for dnd-kit (e.g., "group-123")
    group: TabGroup;
    showDropTarget: boolean;
    isOverlay?: boolean; // Optional prop for styling when in DragOverlay
    "data-group-id"?: number; // Keep if used elsewhere, dnd uses `id` prop
    onTabSelect: (tabId: number, e: React.MouseEvent | React.KeyboardEvent) => void;
}

export const GroupItem = ({ id, group, showDropTarget, isOverlay = false, "data-group-id": dataGroupId, onTabSelect }: GroupItemProps) => {
    // Get values from stores
    const activeTabId = useTabsStore((s) => s.activeTabId);
    const collapsedGroups = useTabsStore((s) => s.collapsedGroups);
    const { setCollapsedGroups } = useTabsStore((s) => s.actions);

    const activeDndId = useDndStore((s) => s.activeDndId);
    const dropTargetId = useDndStore((s) => s.dropTargetId);
    const recentlyDraggedItem = useDndStore((s) => s.recentlyDraggedItem);

    const searchTerm = useSearchStore((s) => s.searchTerm);

    const skipAnimation = useTabManagerStore((s) => s.skipAnimation);
    const isDuplicateCheckMode = useTabManagerStore((s) => s.isDuplicateCheckMode);
    const { setSkipAnimation, setIsAddToGroupModalOpen } = useTabManagerStore((s) => s.actions);

    const toggleGroup = (groupId: number) => {
        setSkipAnimation(false);
        const newCollapsedGroups = new Set(collapsedGroups);
        if (newCollapsedGroups.has(groupId)) {
            newCollapsedGroups.delete(groupId);
        } else {
            newCollapsedGroups.add(groupId);
        }
        setCollapsedGroups(newCollapsedGroups);
    };
    // Ensure group.tabs exists and is an array
    const tabs = group.tabs || [];

    const { settings } = useSettingsStore();

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: id,
        data: { type: ItemType.GROUP, accepts: [ItemType.GTAB, ItemType.GROUP] },
    });

    const style = {
        transform: isOverlay ? CSS.Translate.toString(transform) : undefined,
        transition: isOverlay ? transition : undefined,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isOverlay ? 10 : undefined,
    };

    const isCollapsed = collapsedGroups.has(group.id);
    const containsActiveTab = tabs.some((tab) => tab?.id === activeTabId);
    const isAudible = tabs.some((tab) => tab?.audible && !tab?.mutedInfo?.muted);
    const isMutedAudible = tabs.some((tab) => tab?.audible && tab?.mutedInfo?.muted);
    const allDiscarded = tabs.length > 0 && tabs.every((tab) => tab && isDiscardedTab(tab));

    // Create IDs for tabs within this group for the nested SortableContext
    const groupTabDndIds = tabs.map((tab) => `gtab-${tab?.id}`).filter((id) => !id.includes("undefined"));

    const dropTargetStyles =
        "after:absolute after:bottom-[-6px] z-10 after:left-0 after:w-full after:h-1 after:bg-black/50 after:dark:bg-white after:content-[''] after:pointer-events-none";

    const isTabDraggedOverGroupHeader =
        activeDndId &&
        dropTargetId === id &&
        (String(activeDndId).startsWith(`${ItemType.GTAB}-`) || String(activeDndId).startsWith(`${ItemType.REGULAR}-`));

    // Determine if a group is being dragged over this group
    const isGroupDraggedOverThisGroup = activeDndId && activeDndId.startsWith(`${ItemType.GROUP}-`) && activeDndId !== id;

    const isGroupDraggedOverGtab =
        activeDndId &&
        activeDndId !== id &&
        tabs.some((tab) => tab?.id === Number(dropTargetId?.split("-")[1])) &&
        activeDndId.startsWith(`${ItemType.GROUP}-`) &&
        dropTargetId?.startsWith(`${ItemType.GTAB}-`);

    let groupHeaderColor = "#ffffff";
    if (settings.enableGroupTextColor) {
        groupHeaderColor = settings.groupTextColor || "#ffffff";
    } else if (settings.themeType === "light") {
        groupHeaderColor = "#333333";
    }

    const groupHeaderStyle = useMemo(
        () => ({
            color: groupHeaderColor,
            height: `calc(${settings.tabHeight}px - 10px)`,
            minHeight: `calc(${settings.tabHeight}px - 10px)`,
            maxHeight: `calc(${settings.tabHeight}px - 10px)`,
            marginTop: `1px`,
            marginBottom: `0px`,
            borderRadius: `${settings.tabRoundness}px`,
        }),
        [groupHeaderColor, settings.tabHeight, settings.tabRoundness]
    );

    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            if (e.target === e.currentTarget || e.currentTarget.contains(e.target as Node)) {
                toggleGroup(group.id);
            }
        },
        [toggleGroup, group.id]
    );

    const handleNewTabInGroup = async (e: any, fromButton: boolean = false) => {
        e.stopPropagation();

        if (!fromButton) {
            if (e.button !== 1) return; // Only add on middle click
            if (!settings.middleClickOpensNewTab) return;
        }

        // Check if there are tabs in the group before accessing the last one
        if (tabs.length === 0) return;

        // create a new tab at the end of the group
        const newTab = await chrome.tabs.create({
            index: tabs[tabs.length - 1]?.index + 1,
            active: true,
            url: useSettingsStore.getState().settings.newTabLink || "chrome://newtab",
        });

        // move the new tab to this group
        if (newTab.id != null) {
            await chrome.tabs.group({
                tabIds: [newTab.id],
                groupId: group.id,
            });

            // Set this tab as active
            await chrome.tabs.update(newTab?.id ?? 0, { active: true });

            useTabsStore.getState().actions.expandGroup(group.id);
        }
    };

    const selectedTabIds = useSelectionStore((s) => s.selectedTabIds);

    // Early return if group is undefined
    if (!group) {
        return null;
    }

    return isOverlay ? (
        <div
            style={{ borderRadius: `${settings.tabRoundness}px` }}
            className={`${group.color ? colorMapGradient[group.color]?.replaceAll("/40", "/30") : "bg-gray-300/30"} py-[5px] pl-[34px] text-[14px] pointer-events-none w-[calc(100%-8px)] zoom-out-100 select-none truncate text-bold font-medium mx-1`}
        >
            {group.title || "Untitled Group"}
        </div>
    ) : (
        <div
            ref={setNodeRef}
            style={style}
            onAuxClick={handleNewTabInGroup}
            data-group-id={dataGroupId ?? group.id}
            className={cn(
                "group-item-container",
                "flex flex-col relative",
                isDragging ? "shadow-lg" : "",
                showDropTarget &&
                    dropTargetId === id &&
                    (isGroupDraggedOverThisGroup
                        ? /* $$ IS GROUP DRAGGED OVER THIS GROUP HEADER (SHOWS LINE BELOW THE WHOLE GROUP) */
                          dropTargetStyles
                        : /* $$ DRAGGING TAB OR GTAB OVER GROUP HEADER WHILE IT'S EXPANDED (SHOWS LINE BELOW THE GROUP HEADER) */ ""),
                isGroupDraggedOverGtab && dropTargetStyles
            )}
        >
            <ContextMenu
                onOpenChange={(open) => {
                    centerContextMenu(open);
                }}
            >
                <ContextMenuTrigger>
                    <Button
                        id={String(id)}
                        variant={settings.outlineGroups ? "outline" : "default"}
                        style={groupHeaderStyle}
                        onClick={handleClick}
                        onAuxClick={handleNewTabInGroup}
                        {...attributes}
                        {...listeners}
                        tabIndex={searchTerm !== null && searchTerm !== "" ? -1 : 0}
                        className={cn(
                            // Selectors for custom css
                            "group-item",
                            containsActiveTab ? "contains-active-tab" : "",
                            isCollapsed ? "collapsed-group" : "",

                            // Default styles
                            "group w-[calc(100%-8px)] flex justify-between gap-2 text-white font-medium relative z-[1] cursor-default px-[10px] mx-1",

                            // Outline on group header when the group is collapsed and contains the active tab
                            containsActiveTab && !settings.outlineGroups && isCollapsed
                                ? "outline outline-2 outline-black/60 dark:outline-white/70"
                                : "",

                            // Gradient backgrounds settings
                            settings.outlineGroups
                                ? group.color
                                    ? colorMapBorder[group.color]
                                    : "border-gray-300"
                                : settings.groupsGradientBackground
                                  ? // Gradient backgrounds
                                    group.color
                                      ? colorMapGradient[group.color]
                                            ?.replaceAll("/50", "/" + String(settings.groupBgOpacity + 10))
                                            ?.replaceAll("/40", "/" + String(settings.groupBgOpacity))
                                      : "bg-gray-300/40"
                                  : // Not gradient backgrounds
                                    group.color
                                    ? colorMap[group.color]?.replaceAll("/40", "/" + String(settings.groupBgOpacity))
                                    : "bg-gray-300/40",

                            // Outline on group header when the group is collapsed and contains the active tab
                            settings.outlineGroups && "text-foreground bg-transparent",

                            // $$ IF DRAGGING OVER A GROUP HEADER WHILE IT'S COLLAPSED (SHOWS OUTLINE ON THE GROUP HEADER)
                            isTabDraggedOverGroupHeader &&
                                isCollapsed &&
                                !activeDndId?.startsWith(ItemType.CPINNED) &&
                                "after:absolute after:inset-[-2px] after:rounded-lg after:border-0 after:border-transparent after:p-[1px] after:-m-[1px] after:pointer-events-none outline outline-2 outline-black/60 dark:outline-white",

                            // $$ IF DRAGGING OVER A TAB OR GTAB OVER GROUP HEADER WHILE IT'S NOT COLLAPSED (SHOWS LINE BELOW THE HEADER) - CONFIRMED 2025-07-21
                            isTabDraggedOverGroupHeader &&
                                !isCollapsed &&
                                !activeDndId?.startsWith(ItemType.CPINNED) &&
                                "after:absolute after:bottom-[-6px] after:left-6 after:w-[calc(100%-30px)] after:h-1 after:bg-white after:content-['']"
                        )}
                    >
                        {/* Group Header P1 (Expand/Collapse Icon, Audible Icon, Muted Audible Icon, Group Title) */}
                        <div className="pointer-events-none flex min-w-0 items-center gap-2">
                            <>
                                {/* Expand/Collapse Icon */}
                                <span className="group-expand-icon-container">
                                    {isCollapsed ? (
                                        <ChevronRight className="group-expand-icon" strokeWidth={3} size={20} />
                                    ) : (
                                        <ChevronDown className="group-expand-icon" strokeWidth={3} size={20} />
                                    )}
                                </span>
                                {/* Audible Icon */}
                                {isAudible && <Volume2 className="group-audio-icon h-4 w-4 shrink-0 opacity-100" />}
                                {/* Muted Audible Icon */}
                                {isMutedAudible && <VolumeX className="group-audio-icon h-4 w-4 shrink-0 opacity-100" />}
                                {/* Group Title */}
                                <span
                                    className={`group-title pointer-events-auto flex-shrink flex-grow basis-0 select-none overflow-hidden text-ellipsis whitespace-pre`}
                                    onMouseEnter={
                                        settings.showGroupTitleTooltip
                                            ? (e) => {
                                                  const el = e.currentTarget;
                                                  el.title = el.scrollWidth > el.clientWidth ? group.title || "Untitled Group" : "";
                                              }
                                            : undefined
                                    }
                                >
                                    {group.title || "Untitled Group"}
                                </span>
                            </>
                        </div>

                        {/* Group Header P2 (New Tab Button, Discarded Icon, Active Tab Icon) */}
                        <div className="flex shrink-0 items-center gap-2">
                            {allDiscarded && settings.showDiscardedIconGroup && <Moon className="group-discarded-icon h-4 w-4 opacity-50" />}
                            {containsActiveTab && settings.outlineGroups && (
                                <MapPin className="group-current-icon h-4 w-4 opacity-50" size={18} strokeWidth={3} />
                            )}

                            <div
                                title="New Tab Button"
                                className="group-add-tab-button w-6 min-w-6 cursor-pointer select-none rounded-md py-1 text-center text-sm font-light hover:bg-neutral-800/60"
                                onClick={(e) => handleNewTabInGroup(e, true)}
                                tabIndex={-1}
                            >
                                <div className="hidden w-full select-none justify-center text-center align-middle text-sm group-hover:flex">
                                    <Plus strokeWidth={3} size={20} />
                                </div>
                                <div
                                    className={cn(
                                        "font-foreground flex w-full shrink-0 select-none justify-center text-center align-middle text-sm group-hover:hidden",
                                        settings.highlightHighTabCountEnabled &&
                                            tabs.length > settings.highlightHighTabCountThreshold &&
                                            "text-red-500"
                                    )}
                                >
                                    {settings.showGroupTabCount ? tabs.length : ""}
                                </div>
                            </div>
                        </div>
                    </Button>
                </ContextMenuTrigger>

                <AnimatePresence initial={false}>
                    {!isCollapsed && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: "tween", duration: skipAnimation ? 0 : 0.15 * settings.animationSpeed, ease: "linear" }}
                            // style={{ overflow: "hidden" }}
                        >
                            <SortableContext items={groupTabDndIds} strategy={verticalListSortingStrategy}>
                                <div
                                    className={`group-tabs-container ml-4 flex flex-col border-l-[4px] mr-1 mt-1 ${group.color ? borderColorMap[group.color] : "border-gray-300"} border-opacity-40`}
                                    style={{ gap: "0px", paddingLeft: "4px" }}
                                >
                                    {tabs.map((tab: Tab, index: number) => {
                                        // Skip if tab is null/undefined
                                        if (!tab) return null;

                                        return (
                                            <div
                                                key={`gtab-${tab.id}`}
                                                className={cn(
                                                    "gtab-item-container",
                                                    recentlyDraggedItem === tab.id && `animate-gentle-settle-zoom-out`
                                                )}
                                            >
                                                <TabItem
                                                    id={`gtab-${tab.id}`}
                                                    _className="grouped-tab"
                                                    tab={tab}
                                                    showDropTarget={showDropTarget}
                                                    selected={selectedTabIds.has(tab.id)}
                                                    onSelect={onTabSelect}
                                                    isLastGtab={index === tabs.length - 1}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </SortableContext>
                        </motion.div>
                    )}
                </AnimatePresence>

                <GroupItemContextMenuItems group={group} />
            </ContextMenu>
        </div>
    );
};

GroupItem.displayName = "GroupItem";
