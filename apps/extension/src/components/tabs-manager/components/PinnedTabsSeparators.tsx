import { Separator } from "@/components/simple/Separator";
import { dropTargetClass } from "@/constants/dragAndDrop";
import { useSettingsStore } from "@/stores/settingsStore";
import { ItemType } from "@/types/CombinedItem";
import { cn } from "@/utils/cn";
import { useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";

// Conditions for the seperators appearing are:
// 1. ✅ if there are pinned tabs then show the first and second separators
// 2. ✅ if there are no pinned tabs then just show the first separator
// 3. ✅ if there are pinned tabs and you drag a non-pinned over the pinned tabs then show the 2nd drop target only
// 4. ✅ if there are pinned tabs and you drag a pinned tab to the top then it's moved to the top (1st should show the drop target)
// 5. ✅ if there are no pinned tabs and a tab/group is dragged to the top seperator then show drop target

export function TabHeaderSeperator({
    activeDndId,
    dropTargetId,
    id,
    hasPinned,
}: {
    activeDndId: string | null;
    dropTargetId: string | null;
    id: string;
    hasPinned: boolean;
}) {
    const { setNodeRef } = useSortable({
        id: id,
        animateLayoutChanges: () => false,
        strategy: verticalListSortingStrategy,
    });
    const settings = useSettingsStore((state) => state.settings);

    // const isFirstSeparatorAndThereArePinnedTabs = id === `${ItemType.PSEPARATOR}-1` && hasPinned;
    // const isPinnedItemDraggedOverFirstSeparator = activeDndId?.includes(ItemType.PINNED) && id === `${ItemType.PSEPARATOR}-1`;

    const isDraggingPinnedToTabHeaderSeparator = activeDndId?.includes(ItemType.PINNED) && dropTargetId === `${ItemType.PSEPARATOR}-1`;

    const isDraggingNonPinnedToTabHeaderSeparator = !activeDndId?.includes(ItemType.PINNED) && dropTargetId === `${ItemType.PSEPARATOR}-1`;

    const draggingPinnedToTopPinnedSeparator = activeDndId?.includes(ItemType.PINNED) && dropTargetId === `${ItemType.PSEPARATOR}-1`;

    // Only enable hover expansion when both search and workspace are disabled
    const shouldEnableHoverExpansion = !settings.showSearchBar && !settings.enableWorkspaces;

    const handleMouseEnter = () => {
        if (settings.autoCollapseHeaderButtons && shouldEnableHoverExpansion) {
            const headerContainer = document.querySelector(".header-buttons-container");
            if (headerContainer) {
                headerContainer.classList.add("force-expanded");
            }
        }
    };

    const handleMouseLeave = () => {
        if (settings.autoCollapseHeaderButtons && shouldEnableHoverExpansion) {
            const headerContainer = document.querySelector(".header-buttons-container");
            if (headerContainer) {
                headerContainer.classList.remove("force-expanded");
            }
        }
    };

    return (
        <div
            ref={setNodeRef}
            id={id}
            // style={{ borderTop: "2px solid #363c42" }}
            className={cn("tabs-separator header-separator", settings.autoCollapseHeaderButtons && "hover-trigger-header-expand")}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <Separator
                className={cn(
                    "mt-0 opacity-0",
                    isDraggingPinnedToTabHeaderSeparator ? dropTargetClass() : "",
                    isDraggingNonPinnedToTabHeaderSeparator && !hasPinned ? dropTargetClass() : "",
                    settings.autoCollapseHeaderButtons && !settings.compactPinnedTabs && "h-[2px] py-0"
                )}
                classNameInner={cn(!settings.compactPinnedTabs && draggingPinnedToTopPinnedSeparator && "bg-foreground/0 dark:bg-foreground/0")}
            />
        </div>
    );
}

export const PinnedTabsSeparator = ({ activeDndId, dropTargetId, id }: { activeDndId: string | null; dropTargetId: string | null; id: string }) => {
    const { setNodeRef } = useSortable({
        id: id,
        animateLayoutChanges: () => false,
        strategy: verticalListSortingStrategy,
    });
    const settings = useSettingsStore((state) => state.settings);

    const draggingNonPinnedToPinnedArea =
        !activeDndId?.includes(ItemType.PINNED) && (dropTargetId?.includes(ItemType.PINNED) || dropTargetId?.includes(ItemType.PSEPARATOR));

    return (
        <div ref={setNodeRef} id={id} className="tabs-separator pinned-tabs-separator">
            <Separator
                className={cn(
                    draggingNonPinnedToPinnedArea && !settings.compactPinnedTabs && dropTargetClass(),
                    draggingNonPinnedToPinnedArea && settings.compactPinnedTabs && dropTargetClass("after:bottom-[-2px]"),
                    settings.compactPinnedTabs && "mb-1 mt-2",
                    !settings.compactPinnedTabs && "mt-[10px]"
                )}
                classNameInner={cn(settings.compactPinnedTabs && "opacity-0")}
            />
        </div>
    );
};
