import { handleCloseOtherTabs, handleCloseTabsBelow } from "@/components/tab-list-items/TabItemHandlers";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useSelectionStore } from "@/stores/selectionStore";
import { useTabManagerStore } from "@/stores/tabManagerStore";
import { useEffect, useRef } from "react";

export function CloseTabsDialog() {
    const isCloseTabsDialogOpen = useTabManagerStore((s) => s.isCloseTabsDialogOpen);
    const closeTabsDialogTab = useTabManagerStore((s) => s.closeTabsDialogTab);
    const closeTabsDialogType = useTabManagerStore((s) => s.closeTabsDialogType);
    const activeTabGroup = useTabManagerStore((s) => s.activeTabGroup);
    const { closeCloseTabsDialog } = useTabManagerStore((s) => s.actions);
    const actionRef = useRef<HTMLButtonElement>(null);

    const selectedTabs = useSelectionStore((s) => s.selectedTabs);

    const handleConfirm = async () => {
        // Create a mock event since the handler expects it
        const mockEvent = {
            stopPropagation: () => {},
        } as React.MouseEvent;

        if (closeTabsDialogType === "below" && closeTabsDialogTab) {
            await handleCloseTabsBelow(mockEvent, closeTabsDialogTab);
        } else if (closeTabsDialogType === "others") {
            if (activeTabGroup) {
                // Close other tabs but keep the group
                await handleCloseOtherTabs(mockEvent, undefined, undefined, activeTabGroup);
            } else if (selectedTabs.length > 1) {
                // Close other tabs but keep selected tabs
                await handleCloseOtherTabs(mockEvent, undefined, selectedTabs);
            } else if (closeTabsDialogTab) {
                // Close other tabs but keep this tab
                await handleCloseOtherTabs(mockEvent, closeTabsDialogTab);
            }
        }

        closeCloseTabsDialog();
    };

    useEffect(() => {
        if (isCloseTabsDialogOpen) {
            setTimeout(() => {
                actionRef.current?.focus();
            }, 50);
        }
    }, [isCloseTabsDialogOpen]);

    const getDialogContent = () => {
        if (closeTabsDialogType === "below") {
            return {
                title: "Close Tabs Below",
                description: "Are you sure you want to close all tabs below this tab?",
                action: "Close All Below",
            };
        } else if (closeTabsDialogType === "others") {
            if (activeTabGroup) {
                return {
                    title: "Close Other Tabs",
                    description: `Are you sure you want to close all other tabs except this group? Pinned tabs will be kept.`,
                    action: "Close Other Tabs",
                };
            } else if (selectedTabs.length > 1) {
                return {
                    title: "Close Other Tabs",
                    description: `Are you sure you want to close all other tabs except the ${selectedTabs.length} selected tabs? Pinned tabs will be kept.`,
                    action: "Close Other Tabs",
                };
            } else {
                return {
                    title: "Close Other Tabs",
                    description: "Are you sure you want to close all other tabs except this one? Pinned tabs will be kept.",
                    action: "Close Other Tabs",
                };
            }
        }

        return {
            title: "Close Tabs",
            description: "Are you sure you want to proceed?",
            action: "Confirm",
        };
    };

    const dialogContent = getDialogContent();

    return (
        <AlertDialog
            open={isCloseTabsDialogOpen}
            onOpenChange={(newOpen) => {
                if (!newOpen) {
                    closeCloseTabsDialog();
                }
            }}
        >
            <AlertDialogContent className="max-w-[calc(100vw-1rem)] rounded-lg sm:w-[400px] sm:max-w-[calc(100vw-1rem)]">
                <AlertDialogHeader>
                    <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
                    <AlertDialogDescription>{dialogContent.description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-0.5">
                    <Button variant="destructive" onClick={handleConfirm} ref={actionRef}>
                        {dialogContent.action}
                    </Button>
                    <Button variant="outline" onClick={closeCloseTabsDialog}>
                        Cancel
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
