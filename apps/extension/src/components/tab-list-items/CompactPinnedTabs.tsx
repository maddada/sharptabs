import { useDndStore } from "@/stores/dndStore";
import { useSelectionStore } from "@/stores/selectionStore";
import { Tab } from "@/types/Tab";
import { cn } from "@/utils/cn";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { TabItemCompactPinned } from "./TabItemCompactPinned";

type CompactPinnedTabsProps = {
    pinnedTabs: Tab[];
    onSelect?: (tabId: number, e: React.MouseEvent | React.KeyboardEvent) => void;
};

export const CompactPinnedTabs = ({ pinnedTabs, onSelect }: CompactPinnedTabsProps) => {
    // Get values from stores
    const recentlyDraggedItem = useDndStore((s) => s.recentlyDraggedItem);
    const selectedTabIds = useSelectionStore((s) => s.selectedTabIds);

    // Create sortable item IDs for compact pinned tabs
    const sortableItemIds = pinnedTabs.map((tab) => `cpinned-${tab.id}`);

    // Don't render if no pinned tabs
    if (!pinnedTabs || pinnedTabs.length === 0) {
        return null;
    }
    return (
        <div
            id="compact-pinned-tabs"
            className="z-10 mx-auto w-full border-b-[2px] border-foreground/40 px-[0px] pb-[10px] dark:border-foreground/20 xs:ml-[0px] xs:px-[10px] sm:px-[20px]"
        >
            <SortableContext items={sortableItemIds} strategy={rectSortingStrategy}>
                <div
                    id="compact-pinned-tabs-grid"
                    className="grid justify-center justify-items-start gap-x-[10px] gap-y-[8px] px-1 pb-0 pt-0"
                    style={{
                        gridTemplateColumns: "repeat(auto-fit, minmax(30px, 30px))",
                    }}
                >
                    {pinnedTabs.map((tab) => {
                        const dndId = `cpinned-${tab.id}`;
                        return (
                            <div
                                key={tab.id}
                                id={dndId}
                                className={cn("compact-pinned-tab-wrapper", recentlyDraggedItem === tab.id && "animate-gentle-settle-zoom-out")}
                            >
                                <TabItemCompactPinned tab={tab} onSelect={onSelect} selected={selectedTabIds.has(tab.id)} />
                            </div>
                        );
                    })}
                </div>
            </SortableContext>
        </div>
    );
};

CompactPinnedTabs.displayName = "CompactPinnedTabs";
