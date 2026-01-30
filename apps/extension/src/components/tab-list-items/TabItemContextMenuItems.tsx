import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuShortcut } from "@/components/ui/context-menu";
import { useSelectionStore } from "@/stores/selectionStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTabManagerStore } from "@/stores/tabManagerStore";
import { Tab } from "@/types/Tab";
import {
    Bookmark,
    ChevronDown,
    Copy,
    Download,
    ExternalLink,
    FileText,
    Files,
    FolderInput,
    Layers,
    Layers2,
    Moon,
    Pin,
    Plus,
    RefreshCcw,
    RotateCw,
    X,
    XCircle,
} from "lucide-react";
import {
    handleBookmarkTab,
    handleCloseTab,
    handleCloseTabs,
    handleCopyUrl,
    handleDuplicateTab,
    handleMoveToOtherWindow,
    handleMoveToOtherWindowMultiple,
    handleNewTabBelow,
    handlePin,
    handleReloadTab,
    handleRemoveFromGroup,
    handleSuspendTab,
    handleUnpinTab,
} from "./TabItemHandlers";
import { WorkspacePickerDialog } from "@/components/dialogs/WorkspacePickerDialog";
import { useState } from "react";

export function ContextMenuItems({ tab }: { tab: Tab }) {
    const settings = useSettingsStore((s) => s.settings);
    const setIsAddToGroupModalOpen = useTabManagerStore((s) => s.actions.setIsAddToGroupModalOpen);
    const { setIsCloseTabsDialogOpen, setCloseTabsDialogTab, setCloseTabsDialogType } = useTabManagerStore((s) => s.actions);

    const selectedTabIds = useSelectionStore((s) => s.selectedTabIds);
    const selectedTabs = useSelectionStore((s) => s.selectedTabs);
    const setSelectedTabs = useSelectionStore((s) => s.actions.setSelectedTabs);
    const setSelectedTabIds = useSelectionStore((s) => s.actions.setSelectedTabIds);

    const [isWorkspacePickerOpen, setIsWorkspacePickerOpen] = useState(false);
    const [isExportingDiagnostics, setIsExportingDiagnostics] = useState(false);

    const handleExportDiagnostics = async () => {
        setIsExportingDiagnostics(true);
        try {
            const response = await chrome.runtime.sendMessage({
                type: "EXPORT_WORKSPACE_DIAGNOSTICS",
            });

            if (response.success && response.diagnostics) {
                // Create a blob and download the file using anchor tag approach
                const blob = new Blob([JSON.stringify(response.diagnostics, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                const filename = `workspace-diagnostics-${timestamp}.json`;

                // Create a temporary anchor element and trigger download
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();

                // Clean up
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            } else {
                console.error("Failed to export diagnostics:", response.error);
            }
        } catch (error) {
            console.error("Error exporting diagnostics:", error);
        } finally {
            setIsExportingDiagnostics(false);
        }
    };

    const handleExportWorkspaceStructure = async () => {
        setIsExportingDiagnostics(true);
        try {
            const response = await chrome.runtime.sendMessage({
                type: "EXPORT_WORKSPACE_STRUCTURE",
            });

            if (response.success && response.yaml) {
                // Create a blob and download the file
                const blob = new Blob([response.yaml], { type: "text/yaml" });
                const url = URL.createObjectURL(blob);
                const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                const filename = `workspace-structure-${timestamp}.yaml`;

                // Create a temporary anchor element and trigger download
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();

                // Clean up
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            } else {
                console.error("Failed to export workspace structure:", response.error);
            }
        } catch (error) {
            console.error("Error exporting workspace structure:", error);
        } finally {
            setIsExportingDiagnostics(false);
        }
    };

    function getTabsForAction() {
        if (selectedTabIds && selectedTabIds.size > 1 && selectedTabIds.has(tab.id)) {
            return selectedTabIds;
        } else {
            // Ensure the right clicked tab is selected
            if (selectedTabs.length === 0 || !selectedTabIds.has(tab.id)) {
                setSelectedTabs([tab]);
                setSelectedTabIds(new Set([tab.id]));
            }
            return new Set([tab.id]);
        }
    }

    // Map of menu item id to render function
    const tabMenuItemRenderers: Record<string, () => React.JSX.Element | null> = {
        removeFromGroup: () =>
            tab.groupId !== -1 ? (
                <ContextMenuItem
                    onClick={async (e) => {
                        e.stopPropagation();
                        const ids = getTabsForAction();
                        for (let i = ids.size - 1; i >= 0; i--) await handleRemoveFromGroup(e, { ...tab, id: Array.from(ids)[i] });
                    }}
                >
                    Remove from Group
                    <ContextMenuShortcut>
                        <Layers2 className="h-4 w-4" />
                    </ContextMenuShortcut>
                </ContextMenuItem>
            ) : null,
        addToGroup: () => (
            <ContextMenuItem
                onClick={() => {
                    getTabsForAction(); // Making sure
                    setIsAddToGroupModalOpen(true);
                }}
            >
                {tab.groupId !== -1 ? "Move to Group" : "Add to Group"}
                <ContextMenuShortcut>
                    <Layers className="h-4 w-4" />
                </ContextMenuShortcut>
            </ContextMenuItem>
        ),
        suspendTab: () => (
            <ContextMenuItem onClick={(e) => handleSuspendTab(e, getTabsForAction())}>
                Suspend
                {/* Tab{selectedTabIds?.size > 1 ? "s" : ""} */}
                <ContextMenuShortcut>
                    <Moon className="h-4 w-4" />
                </ContextMenuShortcut>
            </ContextMenuItem>
        ),
        newTabBelow: () =>
            (selectedTabIds?.size ?? 0) <= 1 ? (
                <ContextMenuItem
                    onClick={async (e) => {
                        e.stopPropagation();
                        const ids = getTabsForAction();
                        for (const id of ids) await handleNewTabBelow(e, { ...tab, id });
                    }}
                >
                    New Tab Below
                    <ContextMenuShortcut>
                        <Plus className="h-4 w-4" />
                    </ContextMenuShortcut>
                </ContextMenuItem>
            ) : null,
        pinTab: () =>
            !tab.pinned ? (
                <ContextMenuItem
                    onClick={async (e) => {
                        e.stopPropagation();
                        const ids = getTabsForAction();
                        for (const id of ids) await handlePin(e, { ...tab, id });
                    }}
                >
                    Pin
                    <ContextMenuShortcut>
                        <Pin className="h-4 w-4 rotate-45" />
                    </ContextMenuShortcut>
                </ContextMenuItem>
            ) : null,
        unpinTab: () =>
            tab.pinned ? (
                <ContextMenuItem
                    onClick={async (e) => {
                        e.stopPropagation();
                        const ids = getTabsForAction();
                        for (const id of ids) await handleUnpinTab(e, { ...tab, id });
                    }}
                >
                    Unpin
                    <ContextMenuShortcut>
                        <Pin className="h-4 w-4 rotate-45 fill-current" />
                    </ContextMenuShortcut>
                </ContextMenuItem>
            ) : null,
        reload: () => (
            <ContextMenuItem
                onClick={async (e) => {
                    e.stopPropagation();
                    const ids = getTabsForAction();
                    for (const id of ids) await handleReloadTab(e, { ...tab, id });
                }}
            >
                Reload
                <ContextMenuShortcut>
                    <RefreshCcw className="h-4 w-4" />
                </ContextMenuShortcut>
            </ContextMenuItem>
        ),
        copyUrl: () => (
            <ContextMenuItem
                onClick={async (e) => {
                    e.stopPropagation();
                    const ids = getTabsForAction();
                    if (ids.size === 1) {
                        await handleCopyUrl(e, [tab]);
                    } else {
                        await handleCopyUrl(e, selectedTabs);
                    }
                }}
            >
                Copy URL{(selectedTabIds?.size ?? 0) > 1 && selectedTabIds.has(tab.id) ? "s" : ""}
                <ContextMenuShortcut>
                    <Copy className="h-4 w-4" />
                </ContextMenuShortcut>
            </ContextMenuItem>
        ),
        moveToWindow: () => (
            <ContextMenuItem
                onClick={async (e) => {
                    e.stopPropagation();
                    const ids = getTabsForAction();
                    if (ids.size === 1) {
                        await handleMoveToOtherWindow(e, tab);
                    } else {
                        await handleMoveToOtherWindowMultiple(e, selectedTabs);
                    }
                }}
            >
                Move to Window
                <ContextMenuShortcut>
                    <ExternalLink className="h-4 w-4" />
                </ContextMenuShortcut>
            </ContextMenuItem>
        ),
        bookmarkTab: () => (
            <ContextMenuItem
                onClick={async (e) => {
                    e.stopPropagation();
                    const ids = getTabsForAction();
                    if (ids.size === 1) {
                        await handleBookmarkTab(e, tab);
                    } else {
                        await handleBookmarkTab(e, undefined, selectedTabs);
                    }
                }}
            >
                Bookmark
                {/* Tab{selectedTabIds?.size > 1 ? "s" : ""} */}
                <ContextMenuShortcut>
                    <Bookmark className="h-4 w-4" />
                </ContextMenuShortcut>
            </ContextMenuItem>
        ),
        duplicateTab: () => (
            <ContextMenuItem
                onClick={async (e) => {
                    e.stopPropagation();
                    const ids = getTabsForAction();
                    if (ids.size === 1) {
                        await handleDuplicateTab(e, tab);
                    } else {
                        await handleDuplicateTab(e, undefined, selectedTabs);
                    }
                }}
            >
                Duplicate
                <ContextMenuShortcut>
                    <Files className="h-4 w-4" />
                </ContextMenuShortcut>
            </ContextMenuItem>
        ),
        closeTabsBelow: () => (
            <ContextMenuItem
                onClick={(e) => {
                    e.stopPropagation();
                    setCloseTabsDialogTab(tab);
                    setCloseTabsDialogType("below");
                    setIsCloseTabsDialogOpen(true);
                }}
            >
                Close Tabs Below
                <ContextMenuShortcut>
                    <ChevronDown className="h-4 w-4" />
                </ContextMenuShortcut>
            </ContextMenuItem>
        ),
        closeOtherTabs: () => (
            <ContextMenuItem
                onClick={(e) => {
                    e.stopPropagation();
                    setCloseTabsDialogTab(tab);
                    setCloseTabsDialogType("others");
                    setIsCloseTabsDialogOpen(true);
                }}
            >
                Close Other Tabs
                <ContextMenuShortcut>
                    <XCircle className="h-4 w-4" />
                </ContextMenuShortcut>
            </ContextMenuItem>
        ),
        close: () => (
            <ContextMenuItem
                onClick={async (e) => {
                    e.stopPropagation();
                    const ids = getTabsForAction();
                    if (ids.size === 1) {
                        await handleCloseTab(e, tab);
                    } else {
                        await handleCloseTabs(e, selectedTabs);
                    }
                }}
            >
                Close
                <ContextMenuShortcut>
                    <X className="h-4 w-4" />
                </ContextMenuShortcut>
            </ContextMenuItem>
        ),
        moveToWorkspace: () =>
            settings.enableWorkspaces ? (
                <ContextMenuItem
                    onClick={(e) => {
                        e.stopPropagation();
                        getTabsForAction();
                        setIsWorkspacePickerOpen(true);
                    }}
                >
                    Move to Workspace
                    <ContextMenuShortcut>
                        <FolderInput className="h-4 w-4" />
                    </ContextMenuShortcut>
                </ContextMenuItem>
            ) : null,
        exportWorkspaceDiagnostics: () =>
            process.env.NODE_ENV === "development" && settings.enableWorkspaces ? (
                <ContextMenuItem
                    onClick={(e) => {
                        e.stopPropagation();
                        handleExportDiagnostics();
                    }}
                    disabled={isExportingDiagnostics}
                >
                    {isExportingDiagnostics ? "Exporting..." : "Export Workspaces"}
                    <ContextMenuShortcut>
                        <Download className="h-4 w-4" />
                    </ContextMenuShortcut>
                </ContextMenuItem>
            ) : null,
        exportWorkspaceStructure: () =>
            process.env.NODE_ENV === "development" && settings.enableWorkspaces ? (
                <ContextMenuItem
                    onClick={(e) => {
                        e.stopPropagation();
                        handleExportWorkspaceStructure();
                    }}
                    disabled={isExportingDiagnostics}
                >
                    {isExportingDiagnostics ? "Exporting..." : "Export Structure"}
                    <ContextMenuShortcut>
                        <FileText className="h-4 w-4" />
                    </ContextMenuShortcut>
                </ContextMenuItem>
            ) : null,
        reloadExtension: () =>
            process.env.NODE_ENV === "development" ? (
                <ContextMenuItem
                    onClick={(e) => {
                        e.stopPropagation();
                        window.location.reload();
                    }}
                >
                    Reload Extension
                    <ContextMenuShortcut>
                        <RotateCw className="h-4 w-4" />
                    </ContextMenuShortcut>
                </ContextMenuItem>
            ) : null,
    };

    return (
        <>
            <ContextMenuContent sticky="always" collisionBoundary={document.body} collisionPadding={10} avoidCollisions={true}>
                {settings.tabItemContextMenu
                    .filter((item) => item.visible)
                    .map((item) => {
                        if (item.type === "separator") {
                            return <ContextMenuSeparator key={item.id} />;
                        }
                        const render = tabMenuItemRenderers[item.id];
                        if (!render) return null;
                        const element = render();
                        return element ? <span key={item.id}>{element}</span> : null;
                    })}
            </ContextMenuContent>

            <WorkspacePickerDialog
                open={isWorkspacePickerOpen}
                onOpenChange={setIsWorkspacePickerOpen}
                tabs={selectedTabIds.size > 1 && selectedTabIds.has(tab.id) ? selectedTabs : [tab]}
            />
        </>
    );
}
