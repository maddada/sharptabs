import { useDndStore } from "@/stores/dndStore";
import { cn } from "@/utils/cn";
import { useDroppable } from "@dnd-kit/core";
import { useEffect, useState } from "react";

interface WindowInfo {
    id: number;
    tabCount: number;
}

export function WindowsDropZone() {
    const [windows, setWindows] = useState<WindowInfo[]>([]);
    const activeDndId = useDndStore((s) => s.activeDndId);

    // Make the background area droppable (acts as a blocker for gaps)
    const { setNodeRef: setBackgroundRef } = useDroppable({
        id: "window-zone-background",
    });

    // Fetch all windows when component mounts or when dragging starts
    useEffect(() => {
        if (!activeDndId) return;

        const fetchWindows = async () => {
            try {
                const currentWindow = await chrome.windows.getCurrent();

                const allWindows = await chrome.windows.getAll({ populate: true });
                console.log("allWindows", allWindows);
                const normalWindows = allWindows
                    .filter((w) => w.type === "normal" && w.id !== currentWindow.id)
                    .map((w) => ({
                        id: w.id ?? 0,
                        tabCount: w.tabs?.length ?? 0,
                    }))
                    .sort((a, b) => b.tabCount - a.tabCount); // Sort from most tabs to least

                setWindows(normalWindows);
            } catch (error) {
                console.error("Error fetching windows:", error);
            }
        };

        fetchWindows();
    }, [activeDndId]);

    // Don't show the drop zone if nothing is being dragged
    if (!activeDndId) {
        return null;
    }

    return (
        <div
            ref={setBackgroundRef}
            className="pointer-events-auto absolute bottom-0 left-0 right-0 z-30 flex w-full flex-col justify-center gap-1 bg-background/100 pt-[8px] backdrop-blur-xl duration-300 animate-in fade-in"
        >
            {/* <div className="w-full text-center text-sm font-bold text-foreground">Windows</div> */}
            <div className="flex max-w-full overflow-x-scroll">
                {/* had to use after pseudo-element to add padding to the right of the last window due to a overflow-scroll quirk */}
                <div className={cn("flex min-w-full gap-1 pl-[7px] after:content-[''] after:w-[3px] after:shrink-0 after:block")}>
                    {/* New Window Button - shows "New Window" if no other windows, "New" if 2 windows, "+" if 3+ windows */}
                    <WindowDropTarget windowId={-1} label={windows.length === 0 ? "New Window" : windows.length >= 3 ? "+" : "New"} tabCount={null} />

                    {windows.length > 0 && (
                        <div className="ml-[1px] flex w-1 justify-center">
                            <div className="h-full border-l border-foreground/25"></div>
                        </div>
                    )}

                    {/* Existing Windows */}
                    {windows.map((window) => (
                        <WindowDropTarget key={window.id} windowId={window.id} label={null} tabCount={window.tabCount} />
                    ))}
                </div>
            </div>
        </div>
    );
}

interface WindowDropTargetProps {
    windowId: number;
    label: string | null;
    tabCount: number | null;
}

function WindowDropTarget({ windowId, label, tabCount }: WindowDropTargetProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: `window-${windowId}`,
    });

    return (
        <button
            ref={setNodeRef}
            className={cn(
                "flex flex-1 items-center justify-center gap-1 px-2 py-1 rounded border transition-all duration-200 select-none text-sm font-bold text-foreground ",
                "hover:bg-accent/60 hover:border-foreground/40",
                isOver ? "bg-primary/25 border-primary/70 scale-[1.02] shadow-md ring-1 ring-primary/40" : "bg-background/60 border-foreground/25",
                windowId === -1 ? "bg-accent/60 border-accent/70" : ""
            )}
        >
            {label ? <span className="font-bold">{label}</span> : <span className="font-bold">{tabCount}</span>}
        </button>
    );
}
