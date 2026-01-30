import { ConfirmUngroupAllDialog } from "@/components/dialogs/ConfirmUngroupAllDialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuthStore } from "@/stores/authStore";
import { usePremiumStatus } from "@/stores/premiumStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { cn } from "@/utils/cn";
import { discardTabsNativelySafely } from "@/utils/tabs/discardTabsNativelySafely";
import { isNewTab } from "@/utils/tabs/isNewTab";
import { findWorkspaceContainingTabById } from "@/utils/workspaces/workspaceFilter";
import { Separator } from "@radix-ui/react-separator";
import {
    BrushCleaning,
    Ellipsis,
    FolderOpen,
    History,
    Link2,
    Loader2,
    MapPin,
    Moon,
    RefreshCcw,
    Save,
    SettingsIcon,
    Sparkles,
    Undo2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { handleAutoOrganize } from "../helpers/handleAutoOrganize";
import { handleDeleteUselessTabs } from "../helpers/handleDeleteUselessTabs";
import { handleUngroupAllTabs } from "../helpers/handleUngroupAllTabs";

import { getOpacityClass } from "@/utils/getOpacityClass";
import { expandAndScrollToActiveTab } from "@/utils/tabs/expandAndScrollToActiveTab";
import { handleSaveSession as handleSaveSessionUtil } from "../../sessions/sessionHandlers";
import { useTabManagerStore } from "@/stores/tabManagerStore";

export function MoreOptionsButton() {
    // Get values from stores
    const isAutoOrganizeLoading = useTabManagerStore((state) => state.isAutoOrganizeLoading);
    const isDeleteUselessTabsLoading = useTabManagerStore((state) => state.isDeleteUselessTabsLoading);
    const { setIsRestoreDialogOpen, setIsBulkOpenLinksDialogOpen } = useTabManagerStore((state) => state.actions);
    const [isUngroupDialogOpen, setIsUngroupDialogOpen] = useState(false);
    const [isUngrouping, setIsUngrouping] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const settings = useSettingsStore((state) => state.settings);
    const opacityClass = getOpacityClass(settings.headerFooterOpacity);

    const { isPremium } = usePremiumStatus();
    const user = useAuthStore((state) => state.user);
    const geminiApiKey = settings.geminiApiKey;
    const hasOwnApiKey = Boolean(geminiApiKey);

    // Workspace logic for scroll to current tab
    const { workspaces, actions: workspaceActions } = useWorkspaceStore();

    const handleScrollToCurrentTab = async () => {
        setIsPopoverOpen(false);

        // If workspaces are enabled, find and switch to the workspace containing the active tab
        if (settings.enableWorkspaces) {
            try {
                // Get active tab
                const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (activeTab?.id) {
                    // Get current window ID
                    const currentWindow = await chrome.windows.getCurrent();
                    if (currentWindow.id) {
                        // Load workspace assignments
                        const result = await chrome.storage.local.get("workspaceAssignments");
                        const workspaceAssignments = result.workspaceAssignments?.[currentWindow.id] || {};

                        // Find which workspace contains this tab
                        const workspace = await findWorkspaceContainingTabById(activeTab.id, workspaceAssignments, workspaces);

                        // Switch to that workspace if found
                        if (workspace) {
                            workspaceActions.setActiveWorkspaceId(workspace.id);
                            // Small delay to allow UI to update before scrolling
                            setTimeout(() => {
                                expandAndScrollToActiveTab(true, activeTab.id);
                            }, 100);
                            return;
                        }
                    }
                }
            } catch (error) {
                console.error("Error switching workspace:", error);
            }
        }

        // Fallback to just scrolling
        expandAndScrollToActiveTab(true);
    };

    const onConfirmUngroup = async () => {
        setIsUngrouping(true);
        setIsPopoverOpen(false);
        await handleUngroupAllTabs();
        setIsUngrouping(false);
        setIsUngroupDialogOpen(false);
    };

    const handleSaveSessionClick = () => {
        setIsPopoverOpen(false);
        handleSaveSessionUtil();
    };

    const handleDiscardAllTabsInWindow = async () => {
        try {
            console.log("[Suspend] handleDiscardAllTabsInWindow called");

            const tabs = await chrome.tabs.query({ currentWindow: true });
            const tabsToSuspend = tabs.filter(
                (tab) =>
                    !tab.url?.startsWith("chrome://") &&
                    !tab.url?.startsWith("chrome-extension://") &&
                    !tab.url?.startsWith("edge://") &&
                    !tab.url?.startsWith("about:blank") &&
                    !tab.url?.startsWith("about:newtab") &&
                    !isNewTab(tab) &&
                    !tab.active
            );

            console.log(`[Suspend] Found ${tabsToSuspend.length} tab(s) to suspend`);

            const tabIdsToDiscard = tabsToSuspend.map((t) => t.id).filter((id): id is number => typeof id === "number");
            const windowId = tabs[0]?.windowId;
            await discardTabsNativelySafely(tabIdsToDiscard, { windowId });
        } catch (error) {
            console.log("Error discarding tabs:", error);
        }
    };

    const handleRestoreSessionClick = () => {
        setIsPopoverOpen(false);
        setIsRestoreDialogOpen(true);
    };

    const handleAutoOrganizeClick = async () => {
        setIsPopoverOpen(false);
        if (!isPremium && !hasOwnApiKey) {
            toast.error("AI Auto Group requires a premium subscription or your own Gemini API key. Set your key in Settings > AI Features.", {
                position: "top-center",
            });
            return;
        }
        handleAutoOrganize(isPremium, user?.email, geminiApiKey);
    };

    const handleDeleteUselessTabsClick = async () => {
        setIsPopoverOpen(false);
        if (!isPremium && !hasOwnApiKey) {
            toast.error("AI Auto Clean requires a premium subscription or your own Gemini API key. Set your key in Settings > AI Features.", {
                position: "top-center",
            });
            return;
        }
        handleDeleteUselessTabs(isPremium, user?.email, geminiApiKey);
    };

    return (
        <>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                    <div className={cn("header-menu-trigger", opacityClass)}>
                        <Button id="header-options-menu" variant="ghost" className="menu-button h-6 px-2" tabIndex={-1}>
                            <Ellipsis className="h-4 w-4" />
                        </Button>
                    </div>
                </PopoverTrigger>
                <PopoverContent id="options-menu-popover" className="mr-4 w-fit p-1">
                    <div className="flex flex-col space-y-1">
                        {/* Only show reload extension button in development mode */}
                        {process.env.NODE_ENV === "development" && (
                            <Button
                                variant="ghost"
                                className="h-8 w-full justify-start px-2 text-base font-normal hover:bg-gray-300 dark:hover:bg-gray-600"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.reload();
                                }}
                            >
                                <RefreshCcw className="mr-2 h-4 w-4" />
                                Reload Extension
                            </Button>
                        )}

                        {settings.headerDropdownMenu.map((item) => {
                            if (!item.visible) return null;

                            if (item.type === "separator") {
                                return <Separator key={item.id} className="my-2 border-b-[1px] border-gray-300 dark:border-gray-800" />;
                            }

                            // Render menu items based on their ID
                            switch (item.id) {
                                case "scrollToCurrentTab":
                                    return (
                                        <Button
                                            key={item.id}
                                            variant="ghost"
                                            className="h-8 w-full justify-start px-2 text-base font-normal hover:bg-gray-300 dark:hover:bg-gray-600"
                                            onClick={handleScrollToCurrentTab}
                                        >
                                            <MapPin className="mr-2 h-4 w-4" />
                                            Go to Active Tab
                                        </Button>
                                    );

                                case "restoreClosed":
                                    return (
                                        <Button
                                            key={item.id}
                                            variant="ghost"
                                            className="h-8 w-full justify-start px-2 text-base font-normal hover:bg-gray-300 dark:hover:bg-gray-600"
                                            onClick={async () => {
                                                await chrome.sessions.restore();
                                                setIsPopoverOpen(false);
                                            }}
                                        >
                                            <Undo2 className="mr-2 h-4 w-4" />
                                            Restore Closed
                                        </Button>
                                    );

                                case "saveSession":
                                    return (
                                        <Button
                                            key={item.id}
                                            variant="ghost"
                                            className="h-8 w-full justify-start px-2 text-base font-normal hover:bg-gray-300 dark:hover:bg-gray-600"
                                            onClick={handleSaveSessionClick}
                                        >
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Session
                                        </Button>
                                    );

                                case "restoreSession":
                                    return (
                                        <Button
                                            key={item.id}
                                            variant="ghost"
                                            className="h-8 w-full justify-start px-2 text-base font-normal hover:bg-gray-300 dark:hover:bg-gray-600"
                                            onClick={handleRestoreSessionClick}
                                        >
                                            <History className="mr-2 h-4 w-4" />
                                            Restore Session
                                        </Button>
                                    );

                                case "aiAutoGroup":
                                    if (!settings.aiAutoOrganizeTabs) return null;
                                    return (
                                        <Button
                                            key={item.id}
                                            variant="ghost"
                                            className="h-8 w-full justify-start px-2 text-base font-normal hover:bg-gray-300 dark:hover:bg-gray-600"
                                            disabled={isAutoOrganizeLoading}
                                            onClick={handleAutoOrganizeClick}
                                        >
                                            {isAutoOrganizeLoading ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Sparkles className="mr-2 h-4 w-4" />
                                            )}
                                            AI Auto Group
                                        </Button>
                                    );

                                case "aiAutoClean":
                                    if (!settings.aiAutoCleaner) return null;
                                    return (
                                        <Button
                                            key={item.id}
                                            variant="ghost"
                                            className="h-8 w-full justify-start px-2 text-base font-normal hover:bg-gray-300 dark:hover:bg-gray-600"
                                            disabled={isDeleteUselessTabsLoading}
                                            onClick={handleDeleteUselessTabsClick}
                                        >
                                            {isDeleteUselessTabsLoading ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <BrushCleaning className="mr-2 h-4 w-4" />
                                            )}
                                            AI Auto Clean
                                        </Button>
                                    );

                                case "ungroupAll":
                                    return (
                                        <Button
                                            key={item.id}
                                            variant="ghost"
                                            className="h-8 w-full justify-start px-2 text-base font-normal hover:bg-gray-300 dark:hover:bg-gray-600"
                                            onClick={() => {
                                                setIsUngroupDialogOpen(true);
                                                setIsPopoverOpen(false);
                                            }}
                                        >
                                            <FolderOpen className="mr-2 h-4 w-4" />
                                            Ungroup All
                                        </Button>
                                    );

                                case "suspendAll":
                                    return (
                                        <Button
                                            key={item.id}
                                            variant="ghost"
                                            className="h-8 w-full justify-start px-2 text-base font-normal hover:bg-gray-300 dark:hover:bg-gray-600"
                                            onClick={handleDiscardAllTabsInWindow}
                                        >
                                            <Moon className="mr-2 h-4 w-4" />
                                            Suspend All
                                        </Button>
                                    );

                                case "bulkOpenLinks":
                                    return (
                                        <Button
                                            key={item.id}
                                            variant="ghost"
                                            className="h-8 w-full justify-start px-2 text-base font-normal hover:bg-gray-300 dark:hover:bg-gray-600"
                                            onClick={() => {
                                                setIsPopoverOpen(false);
                                                setIsBulkOpenLinksDialogOpen(true);
                                            }}
                                        >
                                            <Link2 className="mr-2 h-4 w-4" />
                                            Bulk Open Links
                                        </Button>
                                    );

                                case "settings":
                                    return (
                                        <Button
                                            key={item.id}
                                            variant="ghost"
                                            className="h-8 w-full justify-start px-2 text-base font-normal hover:bg-gray-300 dark:hover:bg-gray-600"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsPopoverOpen(false);
                                                chrome.runtime.openOptionsPage();
                                            }}
                                        >
                                            <SettingsIcon className="mr-2 h-4 w-4" />
                                            Settings
                                        </Button>
                                    );

                                default:
                                    return null;
                            }
                        })}
                    </div>
                </PopoverContent>
            </Popover>

            <ConfirmUngroupAllDialog
                isUngroupDialogOpen={isUngroupDialogOpen}
                setIsUngroupDialogOpen={setIsUngroupDialogOpen}
                onConfirmUngroup={onConfirmUngroup}
                isUngrouping={isUngrouping}
                setIsPopoverOpen={setIsPopoverOpen}
            />
        </>
    );
}
