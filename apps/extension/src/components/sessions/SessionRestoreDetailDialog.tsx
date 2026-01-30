import { TabFavicon } from "@/components/tab-list-items/TabFavicon"; // Reuse TabIcon
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { borderColorMap, colorMap } from "@/constants/colorMap"; // Assuming these are exported
import { useSettingsStore } from "@/stores/settingsStore";
import { SavedSession } from "@/types/SavedSession";
import { Settings } from "@/types/Settings"; // Correct import
import { Tab } from "@/types/Tab";
import { cn } from "@/utils/cn";
import { ChevronDown, ChevronRight, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { handleRestoreSession, handleRestoreSingleGroup, handleRestoreSingleTab } from "./sessionHandlers"; // Need to create these
import { isDiscardedTab, isSuspendedByChrome } from "@/utils/tabs/isDiscardedTab";

// Define props for the new component
type SessionDetailTabItemProps = {
    tab: Tab;
    settings: Settings; // Use the correct type
    onRestore: (tab: Tab) => void;
};

// New dedicated component for rendering a single tab item
const SessionDetailTabItem = ({ tab, settings, onRestore }: SessionDetailTabItemProps) => {
    const [iconError] = useState(false);

    // State object needed by TabIcon
    const tabState = {
        iconError: iconError,
        isLoading: false, // Assuming loading state isn't needed here
        isMuted: false, // Assuming muted state isn't needed here
        isAudible: false, // Assuming audible state isn't needed here
        isDiscarded: isDiscardedTab(tab),
        isActive: false, // Tabs in the restore dialog are never 'active' in the live sense
        isSuspendedByChrome: isSuspendedByChrome(tab),
    };

    return (
        <div className="group/tab relative flex items-center justify-between rounded p-1 hover:bg-accent" title={tab.title || tab.url}>
            <div className="w-100 flex select-none items-center gap-2 overflow-hidden">
                {/* Use TabIcon directly with its required props */}
                <div className="min-w-4 max-w-4">
                    <TabFavicon tabState={tabState} tab={tab} settings={settings} />
                </div>
                <span className="flex-shrink truncate text-sm">{tab.title || tab.url}</span>
            </div>
            <Button
                title="Restore Tab"
                variant="default"
                size="icon"
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 transform p-1 opacity-0 transition-opacity group-hover/tab:opacity-100"
                onClick={(e) => {
                    e.stopPropagation();
                    onRestore(tab); // Use the passed handler
                }}
            >
                <RefreshCcw className="h-4 w-4" />
            </Button>
        </div>
    );
};

type SessionRestoreDetailDialogProps = {
    session: SavedSession | null;
    isOpen: boolean;
    onClose: () => void;
};

export function SessionRestoreDetailDialog({ session, isOpen, onClose }: SessionRestoreDetailDialogProps) {
    const [collapsedDialogGroups, setDialogCollapsedGroups] = useState<Set<number>>(new Set());
    const { settings } = useSettingsStore(); // For potential styling consistency

    const toggleGroup = (groupIndex: number) => {
        setDialogCollapsedGroups((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(groupIndex)) {
                newSet.delete(groupIndex);
            } else {
                newSet.add(groupIndex);
            }
            return newSet;
        });
    };

    if (!session) return null;

    const allGroupsCollapsed = session.tabGroups.length > 0 && collapsedDialogGroups.size === session.tabGroups.length;

    const handleToggleAll = () => {
        if (allGroupsCollapsed) {
            setDialogCollapsedGroups(new Set());
        } else {
            const allTabGroupIndices = session.tabGroups.map((_, index) => index);
            setDialogCollapsedGroups(new Set(allTabGroupIndices));
        }
    };

    return (
        <Dialog
            modal={true}
            open={isOpen}
            onOpenChange={(newOpen) => {
                if (!newOpen) {
                    return;
                }
            }}
        >
            <DialogContent
                aria-describedby={undefined}
                className="max-w-[calc(100vw-2rem)] rounded-lg px-4 sm:w-[400px] sm:max-w-[calc(100vw-2rem)] sm:px-6"
            >
                <style>{`button:has(> svg.lucide-x) { display: none; }`}</style>
                <DialogHeader>
                    <DialogTitle>Restore Items from Session</DialogTitle>
                    <DialogDescription>
                        <br />
                        Restore tabs or groups to your current window.
                        <br />
                        {session.date} - {session.time}
                        <br />
                    </DialogDescription>
                </DialogHeader>
                {session.tabGroups.length > 0 && (
                    <Button className="w-full justify-self-end sm:w-fit" onClick={handleToggleAll} variant="outline" size="sm">
                        {allGroupsCollapsed ? "Expand All" : "Collapse All"}
                    </Button>
                )}
                <div className="h-[60vh] space-y-2 overflow-y-auto p-1 pr-3">
                    {/* Render Pinned Tabs */}
                    {session.pinnedTabs.map((tab, index) => (
                        // Use the new component here too
                        <SessionDetailTabItem key={`pinned-tab-${index}`} tab={tab} settings={settings} onRestore={handleRestoreSingleTab} />
                    ))}
                    {session.pinnedTabs.length > 0 && session.pinnedTabs.length > 0 && <hr className="my-3" />}
                    {/* Render Tab Groups */}
                    {session.tabGroups.map((group, index) => {
                        const isCollapsed = collapsedDialogGroups.has(index);
                        const groupColor = group.color || "grey"; // Default color if undefined

                        return (
                            <div key={`group-${index}`} className="group/group-container mb-1 rounded">
                                <div
                                    title={group.title}
                                    className={cn(
                                        "flex items-center justify-between p-2 rounded-t cursor-pointer group/header relative",
                                        settings.groupsGradientBackground
                                            ? colorMapGradient[groupColor] // Use gradient if enabled
                                                  .replaceAll("/50", "/" + String(settings.groupBgOpacity + 10))
                                                  .replaceAll("/40", "/" + String(settings.groupBgOpacity))
                                            : colorMap[groupColor].replaceAll("/40", "/" + String(settings.groupBgOpacity)), // Use solid color otherwise
                                        !isCollapsed && "rounded-b-none",
                                        "text-white" // Assuming default text color contrast works
                                    )}
                                    onClick={() => toggleGroup(index)}
                                >
                                    <div className="flex w-full items-center justify-between gap-2 overflow-hidden">
                                        <div className="flex max-w-[80%] flex-grow items-center gap-2">
                                            {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                                            <span className="truncate font-medium">{group.title || "Untitled Group"}</span>
                                        </div>
                                    </div>
                                    <Button
                                        title="Restore Group"
                                        variant="default"
                                        size="icon"
                                        className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 transform p-1 opacity-0 transition-opacity group-hover/header:opacity-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRestoreSingleGroup(group);
                                        }}
                                    >
                                        <RefreshCcw className="h-4 w-4" />
                                    </Button>
                                </div>
                                {!isCollapsed && (
                                    <div
                                        className={cn(
                                            "ml-4 pl-2 py-1 border-l-4 space-y-1 rounded-b",
                                            borderColorMap[groupColor] || "border-gray-500", // Fallback border color
                                            "bg-muted/20 dark:bg-muted/10"
                                        )}
                                    >
                                        {group.tabs.length > 0 ? (
                                            group.tabs.map((tab, tabIndex) => (
                                                // Use the new component here
                                                <SessionDetailTabItem
                                                    key={`group-${index}-tab-${tabIndex}`}
                                                    tab={tab}
                                                    settings={settings}
                                                    onRestore={handleRestoreSingleTab}
                                                />
                                            ))
                                        ) : (
                                            <p className="pl-3 text-xs italic text-muted-foreground">No tabs in this group.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Render Regular Tabs */}
                    {session.regularTabs.length > 0 && session.tabGroups.length > 0 && <hr className="my-3" />}
                    {session.regularTabs.map((tab, index) => (
                        // Use the new component here too
                        <SessionDetailTabItem key={`regular-tab-${index}`} tab={tab} settings={settings} onRestore={handleRestoreSingleTab} />
                    ))}

                    {/* Show message if session is empty */}
                    {session.tabGroups.length === 0 && session.regularTabs.length === 0 && (
                        <p className="text-center text-muted-foreground">This saved session is empty.</p>
                    )}
                </div>
                <DialogFooter className="flex-col gap-2">
                    <Button variant="outline" onClick={() => handleRestoreSession(session, onClose)}>
                        Restore Session
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Helper function to extract gradient class - might need adjustment based on actual export
const colorMapGradient: Record<string, string> = {
    grey: "bg-gradient-to-r from-gray-500/50 to-gray-600/40",
    blue: "bg-gradient-to-r from-blue-500/50 to-blue-600/40",
    red: "bg-gradient-to-r from-red-500/50 to-red-600/40",
    yellow: "bg-gradient-to-r from-yellow-500/50 to-yellow-600/40",
    green: "bg-gradient-to-r from-green-500/50 to-green-600/40",
    pink: "bg-gradient-to-r from-pink-500/50 to-pink-600/40",
    purple: "bg-gradient-to-r from-purple-500/50 to-purple-600/40",
    cyan: "bg-gradient-to-r from-cyan-500/50 to-cyan-600/40",
    orange: "bg-gradient-to-r from-orange-500/50 to-orange-600/40",
};
