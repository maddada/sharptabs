import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import {
    addTabToWorkspace,
    addGroupToWorkspace,
    removeTabFromAllWorkspaces,
    removeGroupFromAllWorkspaces,
} from "@/utils/workspaces/workspaceHandlers";
import { isTabInWorkspace, isGroupInWorkspace } from "@/utils/workspaces/workspaceFilter";
import { Tab } from "@/types/Tab";
import { TabGroup } from "@/types/TabGroup";
import * as LucideIcons from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface WorkspacePickerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tabs?: Tab[];
    group?: TabGroup;
}

export function WorkspacePickerDialog({ open, onOpenChange, tabs = [], group }: WorkspacePickerDialogProps) {
    const { workspaces } = useWorkspaceStore();
    const [isMoving, setIsMoving] = useState(false);
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);

    // Load current workspace assignment when dialog opens
    useEffect(() => {
        if (!open) return;

        const loadCurrentWorkspace = async () => {
            try {
                const currentWindow = await chrome.windows.getCurrent();
                if (!currentWindow.id) return;

                const result = await chrome.storage.local.get("workspaceAssignments");
                const workspaceAssignments = result.workspaceAssignments || {};
                const windowAssignments = workspaceAssignments[currentWindow.id] || {};

                // Find which workspace this tab/group belongs to
                for (const workspaceId in windowAssignments) {
                    if (group) {
                        if (isGroupInWorkspace(group, workspaceId, windowAssignments)) {
                            setCurrentWorkspaceId(workspaceId);
                            return;
                        }
                    } else if (tabs.length > 0) {
                        const firstTab = tabs[0];
                        if (isTabInWorkspace(firstTab, workspaceId, windowAssignments)) {
                            setCurrentWorkspaceId(workspaceId);
                            return;
                        }
                    }
                }

                // If not found in any workspace, it's in general
                setCurrentWorkspaceId("general");
            } catch (error) {
                console.error("Error loading current workspace:", error);
                setCurrentWorkspaceId("general");
            }
        };

        loadCurrentWorkspace();
    }, [open, tabs, group]);

    const handleMove = async (workspaceId: string) => {
        setIsMoving(true);
        try {
            const currentWindow = await chrome.windows.getCurrent();
            if (!currentWindow.id) {
                toast.error("Could not get current window");
                return;
            }

            if (group) {
                // Special handling for "general" workspace - remove from all workspaces
                if (workspaceId === "general") {
                    await removeGroupFromAllWorkspaces(group.id, currentWindow.id);
                    toast.success("Group moved to General");
                } else {
                    // Move group to workspace
                    await addGroupToWorkspace(group.id, workspaceId, currentWindow.id);
                    toast.success(`Group moved to ${workspaces.find((w) => w.id === workspaceId)?.name}`);
                }
            } else {
                // Move tabs to workspace
                if (workspaceId === "general") {
                    // Special handling for "general" workspace - ungroup tabs and remove from all workspaces
                    for (const tab of tabs) {
                        // Ungroup tab first if it's in a group
                        if (tab.groupId && tab.groupId !== -1) {
                            try {
                                await chrome.tabs.ungroup(tab.id);
                            } catch (error) {
                                console.error("Error ungrouping tab:", error);
                            }
                        }
                        await removeTabFromAllWorkspaces(tab.id, currentWindow.id);
                    }
                    toast.success(`${tabs.length === 1 ? "Tab" : `${tabs.length} tabs`} moved to General`);
                } else {
                    for (const tab of tabs) {
                        await addTabToWorkspace(tab.id, workspaceId, currentWindow.id);
                    }
                    const workspaceName = workspaces.find((w) => w.id === workspaceId)?.name;
                    toast.success(`${tabs.length === 1 ? "Tab" : `${tabs.length} tabs`} moved to ${workspaceName}`);
                }
            }

            onOpenChange(false);
        } catch (error) {
            console.error("Error moving to workspace:", error);
            toast.error("Failed to move to workspace");
        } finally {
            setIsMoving(false);
        }
    };

    // Filter out the current workspace
    // const availableWorkspaces = workspaces.filter((w) => w.id !== currentWorkspaceId);

    return (
        <Dialog
            modal={true}
            open={open}
            onOpenChange={(newOpen) => {
                if (!newOpen) {
                    return;
                }
            }}
        >
            <DialogContent
                aria-describedby={undefined}
                className="max-w-[calc(100vw-2rem)] rounded-lg px-4 sm:w-[400px] sm:max-w-[calc(100vw-2rem)] sm:px-6"
                onKeyDown={(e) => {
                    if (e.key === "Escape") {
                        onOpenChange(false);
                    }
                }}
                onInteractOutside={(e) => {
                    e.preventDefault();
                    onOpenChange(false);
                }}
            >
                <style>{`button:has(> svg.lucide-x) { display: none; }`}</style>
                <DialogHeader>
                    <DialogTitle>Select Workspace</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-2 py-4">
                    {workspaces.length === 0 ? (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                            No other workspaces available. Create a new workspace first.
                        </div>
                    ) : (
                        workspaces.map((workspace) => {
                            const IconComponent = (LucideIcons as any)[workspace.icon] || LucideIcons.Folder;

                            return (
                                <Button
                                    key={workspace.id}
                                    variant="secondary"
                                    className="max-w-full justify-start gap-2 text-left"
                                    onClick={() => handleMove(workspace.id)}
                                    disabled={isMoving || workspace.id === currentWorkspaceId}
                                >
                                    <IconComponent className="h-4 w-4 shrink-0" />
                                    <div className="truncate">{workspace.name}</div>
                                </Button>
                            );
                        })
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
