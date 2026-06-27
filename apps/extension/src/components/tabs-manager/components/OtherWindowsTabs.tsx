import { Separator } from "@/components/simple/Separator";
import { TabItem } from "@/components/tab-list-items/TabItem";
import { borderColorMap, colorMap, colorMapGradient } from "@/constants/colorMap";
import { useDndStore } from "@/stores/dndStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTabManagerStore } from "@/stores/tabManagerStore";
import { CombinedItem, ItemType } from "@/types/CombinedItem";
import { Tab } from "@/types/Tab";
import { TabGroup } from "@/types/TabGroup";
import { cn } from "@/utils/cn";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import {
    createOtherWindowEndDndId,
    createOtherWindowGroupDndId,
    createOtherWindowTabDndId,
    createOtherWindowWindowDndId,
} from "../helpers/dragAndDrop/otherWindowDnd";

type OtherWindowData = {
    windowId: number;
    windowTitle: string;
    items: CombinedItem[];
};

export function OtherWindowsTabs() {
    const otherWindowsData = useTabManagerStore((s) => s.otherWindowsData);
    if (!otherWindowsData || otherWindowsData.length === 0) return null;

    return (
        <div className="mt-4 pb-2">
            <Separator className="my-4" />
            <div className="mb-3 select-none px-2 text-[11px] font-semibold uppercase text-muted-foreground">Other Windows</div>
            {otherWindowsData.map((windowData) => (
                <OtherWindowSection key={windowData.windowId} windowData={windowData} />
            ))}
        </div>
    );
}

function OtherWindowSection({ windowData }: { windowData: OtherWindowData }) {
    const itemIds = windowData.items.flatMap((item) => {
        if (item.type !== ItemType.GROUP) return [item.dndId];

        const group = item.data as TabGroup;
        return [item.dndId, ...group.tabs.map((tab) => createOtherWindowTabDndId(windowData.windowId, tab.id))];
    });
    const tabCount = countTabs(windowData.items);

    return (
        <SortableContext items={[...itemIds, createOtherWindowEndDndId(windowData.windowId)]} strategy={verticalListSortingStrategy}>
            <OtherWindowDropArea windowId={windowData.windowId}>
                <div className="mb-2 flex items-center justify-between px-2 text-xs font-semibold text-muted-foreground">
                    <span className="truncate">{windowData.windowTitle}</span>
                    <span className="ml-2 shrink-0">{tabCount} tabs</span>
                </div>
                {windowData.items.map((item) => (
                    <OtherWindowItem key={item.dndId} windowId={windowData.windowId} item={item} />
                ))}
                <OtherWindowEndDropTarget windowId={windowData.windowId} />
            </OtherWindowDropArea>
        </SortableContext>
    );
}

function OtherWindowDropArea({ windowId, children }: { windowId: number; children: ReactNode }) {
    const activeDndId = useDndStore((s) => s.activeDndId);
    const { setNodeRef, isOver } = useDroppable({
        id: createOtherWindowWindowDndId(windowId),
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "mb-5 rounded-md py-1 transition-colors",
                activeDndId && isOver ? "bg-foreground/5 ring-1 ring-foreground/15" : ""
            )}
        >
            {children}
        </div>
    );
}

function OtherWindowItem({ windowId, item }: { windowId: number; item: CombinedItem }) {
    if (item.type === ItemType.GROUP) {
        const group = item.data as TabGroup;
        return <OtherWindowGroup windowId={windowId} group={group} />;
    }

    const tab = item.data as Tab;
    return <OtherWindowTab windowId={windowId} tab={tab} className={item.type === ItemType.PINNED ? "pinned-tab" : "regular-tab"} />;
}

function OtherWindowTab({ windowId, tab, className }: { windowId: number; tab: Tab; className: string }) {
    const id = createOtherWindowTabDndId(windowId, tab.id);

    return (
        <TabItem
            id={id}
            _className={className}
            tab={tab}
            showDropTarget={true}
            selected={false}
            onSelect={async (_tabId, e) => {
                e.preventDefault();
                try {
                    await chrome.windows.update(windowId, { focused: true });
                    await chrome.tabs.update(tab.id, { active: true });
                } catch (err) {
                    console.log("Failed to switch to tab:", err);
                }
            }}
        />
    );
}

function OtherWindowGroup({ windowId, group }: { windowId: number; group: TabGroup }) {
    const id = createOtherWindowGroupDndId(windowId, group.id);
    const activeDndId = useDndStore((s) => s.activeDndId);
    const dropTargetId = useDndStore((s) => s.dropTargetId);
    const { settings } = useSettingsStore();
    const { attributes, listeners, setNodeRef, isDragging } = useSortable({
        id,
        data: { type: ItemType.GROUP, accepts: [ItemType.GTAB, ItemType.GROUP, ItemType.REGULAR] },
        animateLayoutChanges: () => false,
        strategy: verticalListSortingStrategy,
    });

    const groupHeaderColor = settings.enableGroupTextColor
        ? settings.groupTextColor || "#ffffff"
        : settings.themeType === "light"
          ? "#333333"
          : "#ffffff";

    return (
        <div className="group-item-container relative mb-1 flex flex-col">
            <button
                ref={setNodeRef}
                id={id}
                type="button"
                style={{
                    color: groupHeaderColor,
                    height: `calc(${settings.tabHeight}px - 10px)`,
                    minHeight: `calc(${settings.tabHeight}px - 10px)`,
                    maxHeight: `calc(${settings.tabHeight}px - 10px)`,
                    borderRadius: `${settings.tabRoundness}px`,
                    opacity: isDragging ? 0.6 : 1,
                }}
                className={cn(
                    "group-item group mx-1 mb-1 flex w-[calc(100%-8px)] cursor-default select-none items-center justify-between gap-2 px-[10px] text-left text-sm font-medium",
                    settings.outlineGroups
                        ? `${group.color ? borderColorMap[group.color] : "border-gray-300"} border bg-transparent text-foreground`
                        : settings.groupsGradientBackground
                          ? group.color
                              ? colorMapGradient[group.color]
                                    ?.replaceAll("/50", "/" + String(settings.groupBgOpacity + 10))
                                    ?.replaceAll("/40", "/" + String(settings.groupBgOpacity))
                              : "bg-gray-300/40"
                          : group.color
                            ? colorMap[group.color]?.replaceAll("/40", "/" + String(settings.groupBgOpacity))
                            : "bg-gray-300/40",
                    activeDndId && dropTargetId === id
                        ? "relative after:absolute after:bottom-[-5px] after:left-0 after:h-1 after:w-full after:bg-black/50 after:content-[''] after:dark:bg-white"
                        : ""
                )}
                onClick={async (e) => {
                    e.preventDefault();
                    const firstTab = group.tabs[0];
                    if (!firstTab) return;
                    try {
                        await chrome.windows.update(windowId, { focused: true });
                        await chrome.tabs.update(firstTab.id, { active: true });
                    } catch (err) {
                        console.log("Failed to switch to group:", err);
                    }
                }}
                {...attributes}
                {...listeners}
            >
                <span className="flex min-w-0 items-center gap-2">
                    <ChevronDown className="h-4 w-4 shrink-0" strokeWidth={3} />
                    <span className="truncate">{group.title || "Untitled Group"}</span>
                </span>
                <span className="shrink-0 text-xs opacity-80">{group.tabs.length}</span>
            </button>
            <div
                className={`group-tabs-container ml-4 mr-1 flex flex-col border-l-[4px] ${group.color ? borderColorMap[group.color] : "border-gray-300"} border-opacity-40`}
                style={{ gap: "0px", paddingLeft: "4px" }}
            >
                {group.tabs.map((tab) => (
                    <OtherWindowTab key={tab.id} windowId={windowId} tab={tab} className="grouped-tab" />
                ))}
            </div>
        </div>
    );
}

function OtherWindowEndDropTarget({ windowId }: { windowId: number }) {
    const id = createOtherWindowEndDndId(windowId);
    const activeDndId = useDndStore((s) => s.activeDndId);
    const dropTargetId = useDndStore((s) => s.dropTargetId);
    const { setNodeRef } = useSortable({
        id,
        animateLayoutChanges: () => false,
        strategy: verticalListSortingStrategy,
    });

    return (
        <div
            ref={setNodeRef}
            id={id}
            className={cn(
                "relative h-4 shrink-0",
                activeDndId && dropTargetId === id
                    ? "after:absolute after:left-1 after:right-1 after:top-1 after:h-1 after:bg-black/50 after:content-[''] after:dark:bg-white"
                    : ""
            )}
        />
    );
}

function countTabs(items: CombinedItem[]): number {
    return items.reduce((count, item) => {
        if (item.type === ItemType.GROUP) {
            return count + (item.data as TabGroup).tabs.length;
        }

        return count + 1;
    }, 0);
}
