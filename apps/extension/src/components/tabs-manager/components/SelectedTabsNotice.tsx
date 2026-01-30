import { CustomTooltip } from "@/components/simple/CustomTooltip";
import { useSelectionStore } from "@/stores/selectionStore";
import { useDndStore } from "@/stores/dndStore";
import { cn } from "@/utils/cn";
import { X } from "lucide-react";

export function SelectedTabsNotice() {
    const selectedTabIds = useSelectionStore((s) => s.selectedTabIds);
    const activeDndId = useDndStore((s) => s.activeDndId);

    // Hide when dragging or when less than 2 tabs selected
    if (selectedTabIds == null || selectedTabIds.size < 2 || activeDndId) return null;

    return (
        <div
            id="selected-tabs-notice"
            className={cn(
                `opacity-0`,
                `fixed bottom-[10px] left-1/2 z-40 flex w-[calc(100%-20px)] animate-fade-in flex-col items-center gap-1 rounded-lg border border-border bg-popover px-4 py-4 text-sm font-medium text-popover-foreground shadow-lg pointer-events-none`,
                selectedTabIds.size > 1 && "opacity-100 pointer-events-auto"
            )}
            style={{ transform: "translateX(-50%)" }}
            aria-live="polite"
        >
            <span className="selected-tabs-count absolute left-4 top-1/2 -translate-y-1/2 select-none text-xs text-primary">
                {selectedTabIds.size} tabs selected
            </span>
            <span className="select-none">&nbsp;</span>
            <CustomTooltip content="Clear selection">
                <button
                    className="selected-tabs-clear-button absolute right-4 top-1/2 -translate-y-1/2 transform"
                    onClick={() => {
                        useSelectionStore.getState().actions.clearSelection();
                    }}
                >
                    <X className="h-4 w-4 text-muted-foreground" />
                </button>
            </CustomTooltip>
        </div>
    );
}
