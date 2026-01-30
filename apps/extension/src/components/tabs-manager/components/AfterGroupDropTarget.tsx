import { dropTargetClass } from "@/constants/dragAndDrop";
import { ItemType } from "@/types/CombinedItem";
import { cn } from "@/utils/cn";
import { useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";

export function AfterGroupDropTarget({
    activeDndId,
    dropTargetId,
    id,
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

    return (
        <div
            ref={setNodeRef}
            id={id}
            className={cn(
                "drop-target drop-target-after-group h-[5px] mt-0 mb-0",
                activeDndId != null &&
                    !activeDndId?.includes(ItemType.CPINNED) &&
                    (activeDndId?.includes(ItemType.GTAB) ||
                        activeDndId?.includes(ItemType.REGULAR) ||
                        /* If the active dnd id is a group, and the group id is not the same as the group separator's id, then show the drop target */
                        (activeDndId?.includes(ItemType.GROUP) && !activeDndId?.split("-")[1].includes(dropTargetId?.split("-")[1] || ""))) &&
                    dropTargetId === id
                    ? dropTargetClass("after:bottom-[-1px]")
                    : ""
            )}
            onAuxClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
        ></div>
    );
}
