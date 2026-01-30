import { handleAcceptDeleteUselessTabs } from "@/components/tabs-manager/helpers/handleDeleteUselessTabs";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTabManagerStore } from "@/stores/tabManagerStore";
import { Tab } from "@/types/Tab";
import { createTooltipString } from "@/utils/tabs/createTooltip";
import { BrushCleaning, ChevronDown, ChevronRight, Trash2, XSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TabFavicon } from "../tab-list-items/TabFavicon";
import { handleCloseTab } from "../tab-list-items/TabItemHandlers";
import { Button } from "../ui/button";

interface DeleteUselessTabsDialogProps {
    open: boolean;
    onClose: () => void;
    tabsById: Record<number, Tab>;
    loading: boolean;
}

export function DeleteUselessTabsDialog({ open, onClose, tabsById, loading }: DeleteUselessTabsDialogProps) {
    const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
    const [removedTabIds, setRemovedTabIds] = useState<Set<number>>(new Set());
    const acceptButtonRef = useRef<HTMLButtonElement>(null);
    const previousOpenRef = useRef(open);
    const { settings } = useSettingsStore();

    // Reset removed tabs when dialog closes (not when it opens) to avoid cascading renders
    useEffect(() => {
        if (!open && previousOpenRef.current) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setRemovedTabIds(new Set());
        }
        previousOpenRef.current = open;
    }, [open]);

    const toggleCollapse = (idx: number) => setCollapsed((prev) => ({ ...prev, [idx]: !prev[idx] }));
    const groups = useTabManagerStore((state) => state.deleteUselessTabsGroups);

    // Filter out removed tabs from groups
    const filteredGroups = groups
        .map((group) => ({
            ...group,
            tabIds: group.tabIds.filter((tabId) => !removedTabIds.has(tabId)),
        }))
        .filter((group) => group.tabIds.length > 0);

    const handleCloseUselessTab = async (e: React.MouseEvent, tabId: number) => {
        try {
            // Close the tab using Chrome API
            handleCloseTab(e, tabsById[tabId]);

            // Add to removed set for UI tracking
            setRemovedTabIds((prev) => new Set([...prev, tabId]));

            // Update the store to remove the tab from the groups
            const { setCloseUselessTabsGroups: setCloseUselessTabsGroups } = useTabManagerStore.getState().actions;
            const updatedGroups = groups
                .map((group) => ({
                    ...group,
                    tabIds: group.tabIds.filter((id) => id !== tabId),
                }))
                .filter((group) => group.tabIds.length > 0);
            setCloseUselessTabsGroups(updatedGroups);
        } catch (error) {
            console.error("Failed to close tab:", error);
        }
    };

    const handleCloseUselessGroup = async (groupIndex: number) => {
        const group = filteredGroups[groupIndex];
        if (!group) return;

        try {
            // Close all tabs in this group using Chrome API
            await chrome.tabs.remove(group.tabIds);

            // Add all tabs from this group to the removed set
            setRemovedTabIds((prev) => new Set([...prev, ...group.tabIds]));

            // Update the store to remove all tabs from this group
            const { setCloseUselessTabsGroups: setCloseUselessTabsGroups } = useTabManagerStore.getState().actions;
            const updatedGroups = groups
                .map((g) => ({
                    ...g,
                    tabIds: g.reason === group.reason ? [] : g.tabIds,
                }))
                .filter((g) => g.tabIds.length > 0);
            setCloseUselessTabsGroups(updatedGroups);
        } catch (error) {
            console.error("Failed to close group tabs:", error);
        }
    };

    // Custom handler to prevent all automatic closing - dialog should only close via Cancel/Accept buttons
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            return;
        }
    };

    const handleAccept = () => {
        handleAcceptDeleteUselessTabs();
        onClose();
    };

    useEffect(() => {
        setTimeout(() => {
            if (open) {
                acceptButtonRef.current?.focus();
            }
        }, 50);
    }, [open]);

    const totalTabsToClose = filteredGroups.reduce((sum, group) => sum + group.tabIds.length, 0);

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent
                id="delete-useless-tabs-dialog"
                className="max-w-[calc(100vw-2rem)] rounded-lg px-4 sm:w-[400px] sm:max-w-[calc(100vw-2rem)] sm:px-6"
            >
                <style>{`button:has(> svg.lucide-x) { display: none; }`}</style>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">Suggested Tabs to Close</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogDescription>
                    <div className="text-sm text-muted-foreground">
                        {loading
                            ? "Analyzing tabs to cleanup..."
                            : totalTabsToClose > 0
                              ? `Close individual tabs, or groups, or use the Close All button (Results are not perfect, please check)`
                              : removedTabIds.size > 0
                                ? "All suggested tabs have been closed."
                                : "Didn't find any unnecessary tabs."}
                    </div>
                </AlertDialogDescription>
                {loading ? (
                    <div className="py-8 text-center text-muted-foreground">
                        Analyzing tabs for duplicates, old searches, and other useless tabs...
                    </div>
                ) : (
                    <div className="max-h-[50vh] space-y-4 overflow-y-auto">
                        {filteredGroups.length === 0 ? (
                            <div className="text-center text-muted-foreground">No useless tabs identified.</div>
                        ) : (
                            filteredGroups.map((group, i) => {
                                const isCollapsed = collapsed[i];
                                return (
                                    <div key={i} className="overflow-hidden rounded border p-0">
                                        <div className="group/header relative">
                                            <button
                                                type="button"
                                                className="flex w-full cursor-pointer select-none items-center justify-between gap-2 bg-red-100 px-3 py-2 font-semibold text-red-800 dark:bg-red-900/20 dark:text-red-200"
                                                onClick={() => toggleCollapse(i)}
                                                tabIndex={-1}
                                            >
                                                <div className="flex w-full items-center gap-2 text-left">
                                                    <div className="flex-shrink-0">
                                                        {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                                                    </div>
                                                    <span className="min-w-0 flex-1 truncate">{group.reason}</span>
                                                    <span className="ml-2 flex-shrink-0 text-base opacity-80">{group.tabIds.length}</span>
                                                </div>
                                            </button>
                                            <Button
                                                title="Close all tabs of this type"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 transform p-1 opacity-0 transition-opacity duration-200 group-hover/header:opacity-100"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCloseUselessGroup(i);
                                                }}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        {!isCollapsed && (
                                            <div className="cursor-pointer space-y-1 bg-muted/20 py-2 pl-1 pr-1">
                                                {group.tabIds.map((tabId) => {
                                                    const tab = tabsById[tabId];

                                                    const tooltipString = createTooltipString(tab, {
                                                        showTitleInTooltips: true,
                                                        showUrlInTooltips: true,
                                                        isDuplicateCheckMode: true,
                                                    });
                                                    return (
                                                        <div
                                                            key={tabId}
                                                            className="group/tab relative flex select-none items-center justify-between rounded px-2 py-1 hover:bg-accent"
                                                            onClick={async () => {
                                                                await chrome.tabs.update(tabId, { active: true });
                                                            }}
                                                        >
                                                            <button
                                                                className="flex w-full items-center gap-2 overflow-hidden"
                                                                title={tooltipString}
                                                                onAuxClick={async (e) => {
                                                                    if (e.button === 1) {
                                                                        handleCloseUselessTab(e, tabId);
                                                                    }
                                                                }}
                                                            >
                                                                <div className="max-h-4 min-h-4 min-w-4 max-w-4">
                                                                    <TabFavicon
                                                                        tab={tab}
                                                                        tabState={{
                                                                            iconError: false,
                                                                            isLoading: false,
                                                                            isMuted: false,
                                                                            isAudible: false,
                                                                            isDiscarded: false,
                                                                            isActive: false,
                                                                            isSuspendedByChrome: false,
                                                                        }}
                                                                        settings={settings}
                                                                    />
                                                                </div>
                                                                <span className="truncate text-base">{tab?.title || `Tab ${tabId}`}</span>
                                                            </button>
                                                            <Button
                                                                title="Close this tab"
                                                                variant="destructive"
                                                                size="icon"
                                                                className="absolute right-1 top-1/2 h-5 w-5 -translate-y-1/2 transform p-0.5 opacity-0 transition-opacity duration-200 group-hover/tab:opacity-100"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCloseUselessTab(e, tabId);
                                                                }}
                                                            >
                                                                <XSquare className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                <AlertDialogFooter className="gap-1.5">
                    {!loading && filteredGroups.length > 0 && (
                        <Button variant="default" onClick={handleAccept} disabled={loading} ref={acceptButtonRef}>
                            <BrushCleaning className="mr-0 h-4 w-4" />
                            Close {totalTabsToClose} Tab{totalTabsToClose === 1 ? "" : "s"}
                        </Button>
                    )}
                    <Button variant="outline" disabled={loading} onClick={onClose}>
                        Cancel
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
