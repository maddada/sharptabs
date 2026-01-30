import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuShortcut } from "@/components/ui/context-menu";
import { colorMap } from "@/constants/colorMap";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTabManagerStore } from "@/stores/tabManagerStore";
import { ColorEnum, TabGroup } from "@/types/TabGroup";
import { Bookmark, Copy, ExternalLink, FolderInput, Moon, Pencil, Ungroup, X, XCircle } from "lucide-react";
import React, { useState } from "react";
import {
    handleBookmarkAll,
    handleCloseGroup,
    handleColorChange,
    handleCopyUrls,
    handleDiscardAllTabs,
    handleMoveGroupToAnotherWindow,
    handleUngroupTabs,
} from "./GroupItemHandlers";
import { WorkspacePickerDialog } from "@/components/dialogs/WorkspacePickerDialog";
interface GroupItemContextMenuItemsProps {
    group: TabGroup;
}

export const GroupItemContextMenuItems: React.FC<GroupItemContextMenuItemsProps> = ({ group }) => {
    const settings = useSettingsStore((s) => s.settings);
    const { setIsRenameModalOpen, setIsWindowSelectionDialogOpen, setActiveTabGroup, setIsCloseTabsDialogOpen, setCloseTabsDialogType } =
        useTabManagerStore((s) => s.actions);

    const [isWorkspacePickerOpen, setIsWorkspacePickerOpen] = useState(false);

    // Map of menu item id to render function
    const groupMenuItemRenderers: Record<string, () => React.JSX.Element | null> = {
        rename: () => (
            <ContextMenuItem
                onClick={() => {
                    setActiveTabGroup(group);
                    setIsRenameModalOpen(true);
                }}
            >
                Rename
                <ContextMenuShortcut>
                    <Pencil className="h-4 w-4" />
                </ContextMenuShortcut>
            </ContextMenuItem>
        ),
        colorPicker: () => (
            <ContextMenuItem className="py-2 hover:bg-transparent">
                <div className="flex gap-1">
                    {Object.keys(colorMap).map((color) => (
                        <div
                            key={color}
                            onClick={() => handleColorChange(color as ColorEnum, group)}
                            className={`${colorMap[color as ColorEnum].replace("/40", "/80")} h-4 w-4 rounded-full cursor-pointer`}
                        />
                    ))}
                </div>
            </ContextMenuItem>
        ),
        suspendAllTabs: () => (
            <ContextMenuItem onClick={() => handleDiscardAllTabs(group)}>
                Suspend
                <ContextMenuShortcut>
                    <Moon className="h-4 w-4" />
                </ContextMenuShortcut>
            </ContextMenuItem>
        ),
        ungroupTabs: () => (
            <ContextMenuItem onClick={() => handleUngroupTabs(group)}>
                Ungroup
                <ContextMenuShortcut>
                    <Ungroup className="h-4 w-4" />
                </ContextMenuShortcut>
            </ContextMenuItem>
        ),
        closeGroup: () => (
            <ContextMenuItem onClick={() => handleCloseGroup(group)}>
                Close
                <ContextMenuShortcut>
                    <X className="h-4 w-4" />
                </ContextMenuShortcut>
            </ContextMenuItem>
        ),
        bookmarkAll: () => (
            <ContextMenuItem onClick={() => handleBookmarkAll(group)}>
                Bookmark
                <ContextMenuShortcut>
                    <Bookmark className="h-4 w-4" />
                </ContextMenuShortcut>
            </ContextMenuItem>
        ),
        copyUrls: () => (
            <ContextMenuItem onClick={() => handleCopyUrls(group)}>
                Copy URLs
                <ContextMenuShortcut>
                    <Copy className="h-4 w-4" />
                </ContextMenuShortcut>
            </ContextMenuItem>
        ),
        moveToWindow: () => (
            <ContextMenuItem onClick={() => handleMoveGroupToAnotherWindow(group, setIsWindowSelectionDialogOpen)}>
                Move to Window
                <ContextMenuShortcut>
                    <ExternalLink className="h-4 w-4" />
                </ContextMenuShortcut>
            </ContextMenuItem>
        ),
        closeOtherTabs: () => (
            <ContextMenuItem
                onClick={() => {
                    setActiveTabGroup(group);
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
        moveToWorkspace: () =>
            settings.enableWorkspaces ? (
                <ContextMenuItem onClick={() => setIsWorkspacePickerOpen(true)}>
                    Move to Workspace
                    <ContextMenuShortcut>
                        <FolderInput className="h-4 w-4" />
                    </ContextMenuShortcut>
                </ContextMenuItem>
            ) : null,
    };

    return (
        <>
            <ContextMenuContent sticky="always" collisionBoundary={document.body} collisionPadding={10} avoidCollisions={true}>
                {settings.groupItemContextMenu
                    .filter((item) => item.visible)
                    .map((item) => {
                        if (item.type === "separator") {
                            return <ContextMenuSeparator key={item.id} />;
                        }
                        const render = groupMenuItemRenderers[item.id];
                        if (!render) return null;
                        const element = render();
                        return element ? <span key={item.id}>{element}</span> : null;
                    })}
            </ContextMenuContent>

            <WorkspacePickerDialog open={isWorkspacePickerOpen} onOpenChange={setIsWorkspacePickerOpen} group={group} />
        </>
    );
};
