import { ItemType } from "@/types/CombinedItem";
import { cn } from "@/utils/cn";
import { useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { createNewTab } from "@/utils/tabs/createNewTab";
import { middleClickOpensNewTab } from "@/utils/tabs/middleClickOpensNewTab";
import { useWorkspaceStore } from "@/stores/workspaceStore";

export function NewTabButtonDropTarget({ activeDndId, dropTargetId, id }: { activeDndId: string | null; dropTargetId: string | null; id: string }) {
    const { setNodeRef } = useSortable({
        id: id,
        animateLayoutChanges: () => false,
        strategy: verticalListSortingStrategy,
    });
    const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

    const isActive =
        activeDndId != null && !activeDndId.includes(ItemType.PINNED) && (dropTargetId === id || dropTargetId === `${ItemType.ESEPARATOR}-1`);

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "new-tab-button-area relative flex-shrink-0",
                // Show drop indicator at top when dragging over the button or eseparator-1
                isActive
                    ? "before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-black/50 before:dark:bg-white before:z-10 before:content-['']"
                    : ""
            )}
        >
            <Button
                id={id}
                variant="ghost"
                className={cn(
                    "w-[calc(100%-8px)] hover:bg-slate-200/20 transition-opacity mx-[4px] duration-300 border-0 h-[45px] pointer-events-auto rounded-md cursor-default"
                )}
                onClick={() => createNewTab({ active: true }, { workspaceId: activeWorkspaceId ?? undefined })}
                onAuxClick={middleClickOpensNewTab}
                tabIndex={-1}
            >
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    );
}
