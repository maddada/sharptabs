import { Button } from "@/components/ui/button";
import { CustomTooltip } from "@/components/simple/CustomTooltip";
import { WorkspaceContextMenu } from "@/components/dialogs/WorkspaceContextMenu";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useDndStore } from "@/stores/dndStore";
import { findWorkspaceForActiveTab } from "@/utils/workspaces/workspaceFilter";
import { cn } from "@/utils/cn";
import * as LucideIcons from "lucide-react";
import React, { useEffect, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { WorkspaceDefinition } from "@/types/Workspace";

interface WorkspaceButtonProps {
    workspace: WorkspaceDefinition;
    isActive: boolean;
    hasActiveTab: boolean;
    onSelect: (id: string) => void;
    isAnyDragging: boolean;
}

function WorkspaceButton({ workspace, isActive, hasActiveTab, onSelect, isAnyDragging }: WorkspaceButtonProps) {
    // Use useDraggable for drag-to-reorder functionality
    const { attributes, listeners, setNodeRef: setDraggableNodeRef, transform, isDragging } = useDraggable({ id: workspace.id });

    // Use useDroppable for:
    // 1. Dropping tabs/groups into workspaces (with "workspace-" prefix)
    // 2. Dropping workspaces onto other workspaces for reordering (accepting workspace IDs)
    const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
        id: `workspace-${workspace.id}`,
        disabled: isActive, // Disable dropping on the currently active workspace
    });

    // Combine refs
    const setRefs = (element: HTMLDivElement | null) => {
        setDraggableNodeRef(element);
        setDroppableNodeRef(element);
    };

    const style = {
        transform: CSS.Transform.toString(transform),
    };

    const IconComponent = (LucideIcons as any)[workspace.icon] || LucideIcons.Folder;

    return (
        <WorkspaceContextMenu workspace={workspace}>
            <div ref={setRefs} style={style}>
                <CustomTooltip content={workspace.name}>
                    <Button
                        data-workspace-id={workspace.id}
                        variant={isActive ? "default" : "ghost"}
                        size="icon"
                        className={cn(
                            "workspace-button",
                            "h-9 w-9 transition-all",
                            isActive && "bg-primary text-primary-foreground",
                            hasActiveTab && !isActive && "ring-2 ring-primary/60 ring-offset-2 ring-offset-background",
                            isOver && !isActive && "ring-2 ring-accent-500/60 ring-offset-2 ring-offset-background scale-110",
                            isDragging && "opacity-50"
                        )}
                        onClick={() => onSelect(workspace.id)}
                        {...attributes}
                        {...listeners}
                    >
                        <IconComponent className="h-4 w-4" />
                    </Button>
                </CustomTooltip>
            </div>
        </WorkspaceContextMenu>
    );
}

export function WorkspaceBar() {
    const { workspaces, activeWorkspaceId, isLoading, actions } = useWorkspaceStore();
    const activeDndId = useDndStore((s) => s.activeDndId);
    const [workspaceWithActiveTab, setWorkspaceWithActiveTab] = useState<string | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Track if any item is being dragged (including workspaces, tabs, or groups)
    const isAnyDragging = activeDndId !== null;

    // Convert vertical scroll to horizontal scroll
    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        const container = containerRef.current;
        if (!container) return;

        // Check if there's horizontal overflow
        const hasOverflow = container.scrollWidth > container.clientWidth;

        if (hasOverflow) {
            // Prevent default vertical scroll
            e.preventDefault();

            // Apply horizontal scroll
            container.scrollLeft += e.deltaY;
        }
    };

    // Load workspaces on mount
    useEffect(() => {
        actions.loadWorkspaces();
    }, [actions]);

    // Listen for workspace switches from service worker (hotkeys)
    useEffect(() => {
        const handleWorkspaceSwitchMessage = async (message: any) => {
            if (message.type === "WORKSPACE_SWITCHED") {
                try {
                    const currentWindow = await chrome.windows.getCurrent();
                    if (currentWindow.id === message.windowId) {
                        actions.setActiveWorkspaceId(message.workspaceId);
                    }
                } catch (error) {
                    console.error("Error handling workspace switch message:", error);
                }
            }
        };

        chrome.runtime.onMessage.addListener(handleWorkspaceSwitchMessage);

        return () => {
            chrome.runtime.onMessage.removeListener(handleWorkspaceSwitchMessage);
        };
    }, [actions]);

    // Track which workspace contains the active tab (prioritizing group assignments)
    useEffect(() => {
        const updateWorkspaceWithActiveTab = async () => {
            try {
                // Get active tab
                const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!activeTab || !activeTab.url) {
                    setWorkspaceWithActiveTab(null);
                    return;
                }

                // Get current window ID
                const currentWindow = await chrome.windows.getCurrent();
                if (!currentWindow.id) {
                    setWorkspaceWithActiveTab(null);
                    return;
                }

                // Load workspace assignments - always get fresh data
                const result = await chrome.storage.local.get("workspaceAssignments");
                const workspaceAssignments = result.workspaceAssignments?.[currentWindow.id] || {};

                // Find which workspace contains this tab (prioritizes group assignment if tab is in a group)
                const workspace = await findWorkspaceForActiveTab(activeTab, workspaceAssignments, workspaces);

                const newWorkspaceId = workspace?.id || null;

                // Only update if changed to avoid unnecessary re-renders
                setWorkspaceWithActiveTab((prev) => {
                    if (prev !== newWorkspaceId) {
                        console.log(`[WorkspaceBar] Active tab workspace: ${prev} -> ${newWorkspaceId}`, {
                            tabUrl: activeTab.url,
                            tabGroupId: activeTab.groupId,
                        });
                        return newWorkspaceId;
                    }
                    return prev;
                });
            } catch (error) {
                console.error("Error finding workspace with active tab:", error);
                setWorkspaceWithActiveTab(null);
            }
        };

        updateWorkspaceWithActiveTab();

        // Listen for tab activation changes
        const handleTabActivated = () => {
            updateWorkspaceWithActiveTab();
        };

        // Listen for tab updates (URL changes)
        const handleTabUpdated = (_tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
            if (changeInfo.url) {
                updateWorkspaceWithActiveTab();
            }
        };

        // Listen for tab moves (happens during workspace reordering)
        const handleTabMoved = () => {
            // Delay slightly to ensure move is complete
            setTimeout(updateWorkspaceWithActiveTab, 100);
        };

        // Listen for storage changes (workspace assignments updated)
        const handleStorageChanged = (changes: { [key: string]: chrome.storage.StorageChange }) => {
            if (changes.workspaceAssignments) {
                // Delay slightly to ensure all changes are persisted
                setTimeout(updateWorkspaceWithActiveTab, 150);
            }
        };

        chrome.tabs.onActivated.addListener(handleTabActivated);
        chrome.tabs.onUpdated.addListener(handleTabUpdated);
        chrome.tabs.onMoved.addListener(handleTabMoved);
        chrome.storage.onChanged.addListener(handleStorageChanged);

        return () => {
            chrome.tabs.onActivated.removeListener(handleTabActivated);
            chrome.tabs.onUpdated.removeListener(handleTabUpdated);
            chrome.tabs.onMoved.removeListener(handleTabMoved);
            chrome.storage.onChanged.removeListener(handleStorageChanged);
        };
    }, [workspaces]);

    if (isLoading) {
        return null; // or a skeleton loader
    }

    return (
        <>
            <div
                ref={containerRef}
                id="workspace-bar-container"
                className="workspace-bar z-[11] flex flex-shrink-0 items-center gap-2 overflow-x-auto px-2"
                onWheel={handleWheel}
            >
                {workspaces.map((workspace) => (
                    <WorkspaceButton
                        key={workspace.id}
                        workspace={workspace}
                        isActive={activeWorkspaceId === workspace.id}
                        hasActiveTab={workspaceWithActiveTab === workspace.id}
                        onSelect={actions.setActiveWorkspaceId}
                        isAnyDragging={isAnyDragging}
                    />
                ))}
            </div>
            <div className="h-[14px] flex-shrink-0 border-b-[2px] border-solid border-foreground/40 dark:border-foreground/20"></div>
        </>
    );
}
