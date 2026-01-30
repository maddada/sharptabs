import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuShortcut, ContextMenuTrigger } from "@/components/ui/context-menu";
import { WorkspaceDefinition } from "@/types/Workspace";
import { Pencil, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { renameWorkspace, deleteWorkspace, changeWorkspaceIcon } from "@/utils/workspaces/workspaceHandlers";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WorkspaceIconPicker } from "./WorkspaceIconPicker";
import { Label } from "@/components/ui/label";
import { centerContextMenu } from "@/utils/tabs/centerContextMenu";
import { CreateWorkspaceDialog } from "./CreateWorkspaceDialog";
import { Plus } from "lucide-react";

interface WorkspaceContextMenuProps {
    workspace: WorkspaceDefinition;
    children: React.ReactNode;
}

export const WorkspaceContextMenu = React.forwardRef<HTMLElement, WorkspaceContextMenuProps>(({ workspace, children }, ref) => {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newName, setNewName] = useState(workspace.name);
    const [selectedIcon, setSelectedIcon] = useState(workspace.icon);
    const { actions } = useWorkspaceStore();

    const handleEdit = async () => {
        if (!newName.trim()) {
            toast.error("Please enter a workspace name");
            return;
        }

        // Update name if changed
        let nameSuccess = true;
        if (newName.trim() !== workspace.name) {
            nameSuccess = await renameWorkspace(workspace.id, newName.trim());
        }

        // Update icon if changed
        let iconSuccess = true;
        if (selectedIcon !== workspace.icon) {
            iconSuccess = await changeWorkspaceIcon(workspace.id, selectedIcon);
        }

        if (nameSuccess && iconSuccess) {
            // For General workspace, reload from settings; for others, update in store
            if (workspace.isDefault) {
                await actions.loadWorkspaces();
            } else {
                actions.updateWorkspace(workspace.id, {
                    name: newName.trim(),
                    icon: selectedIcon,
                });
            }
            toast.success("Workspace updated");
            setIsEditDialogOpen(false);
        } else {
            toast.error("Failed to update workspace");
        }
    };

    const handleDelete = async () => {
        const success = await deleteWorkspace(workspace.id);
        if (success) {
            actions.removeWorkspace(workspace.id);
            toast.success(`Workspace "${workspace.name}" deleted`);
        } else {
            toast.error("Failed to delete workspace");
        }
    };

    return (
        <>
            <ContextMenu
                onOpenChange={(open) => {
                    centerContextMenu(open);
                }}
            >
                <ContextMenuTrigger asChild ref={ref}>
                    {children}
                </ContextMenuTrigger>
                <ContextMenuContent sticky="always" collisionBoundary={document.body} collisionPadding={10} avoidCollisions={true}>
                    <ContextMenuItem onClick={() => setIsCreateDialogOpen(true)}>
                        New Workspace
                        <ContextMenuShortcut>
                            <Plus className="h-4 w-4" />
                        </ContextMenuShortcut>
                    </ContextMenuItem>
                    <ContextMenuItem
                        onClick={() => {
                            setNewName(workspace.name);
                            setSelectedIcon(workspace.icon);
                            setIsEditDialogOpen(true);
                        }}
                    >
                        Edit
                        <ContextMenuShortcut>
                            <Pencil className="h-4 w-4" />
                        </ContextMenuShortcut>
                    </ContextMenuItem>
                    {/* Only show Delete option for non-default workspaces */}
                    {!workspace.isDefault && (
                        <ContextMenuItem onClick={handleDelete} className="">
                            Delete
                            <ContextMenuShortcut>
                                <Trash2 className="h-4 w-4" />
                            </ContextMenuShortcut>
                        </ContextMenuItem>
                    )}
                </ContextMenuContent>
            </ContextMenu>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Workspace</DialogTitle>
                        <DialogDescription>Change the name or icon for this workspace.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="workspace-name">Workspace Name</Label>
                            <Input
                                id="workspace-name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleEdit();
                                    }
                                }}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Choose Icon</Label>
                            <WorkspaceIconPicker selectedIcon={selectedIcon} onSelectIcon={setSelectedIcon} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEdit} disabled={!newName.trim()}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Workspace Dialog */}
            <CreateWorkspaceDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
        </>
    );
});

WorkspaceContextMenu.displayName = "WorkspaceContextMenu";
