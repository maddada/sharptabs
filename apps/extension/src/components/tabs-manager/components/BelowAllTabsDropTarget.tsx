import { dropTargetClass } from "@/constants/dragAndDrop";
import { ItemType } from "@/types/CombinedItem";
import { cn } from "@/utils/cn";
import { useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";

export function BelowAllTabsDropTarget({
    activeDndId,
    dropTargetId,
    id,
    hideIndicator = false,
}: {
    activeDndId: string | null;
    dropTargetId: string | null;
    id: string;
    hideIndicator?: boolean;
}) {
    const { setNodeRef } = useSortable({
        id: id,
        animateLayoutChanges: () => false,
        strategy: verticalListSortingStrategy,
    });

    const isActive = activeDndId != null && !activeDndId.includes(ItemType.PINNED) && dropTargetId === id;

    return (
        <div
            ref={setNodeRef}
            id={id}
            className={cn(
                // Fill remaining space in the scroll container; when overflowing, stay at min height without shrinking others
                "drop-target drop-target-below-tabs grow shrink-0 basis-auto min-h-[5px]",
                "mt-0 mb-0",
                // Only show indicator if not hidden and active
                isActive && !hideIndicator ? dropTargetClass("after:top-[0px]") : ""
            )}
        ></div>
    );
}
