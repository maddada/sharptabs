export interface WorkspaceDefinition {
    id: string; // UUID for custom workspaces, "general" for default
    name: string;
    icon: string; // Lucide icon name
    isDefault: boolean; // true only for "General" workspace
}

export interface WorkspaceItem {
    type: "group" | "tab";
    // For groups
    title?: string;
    color?: string;
    index: number;
    tabUrls?: string[]; // URLs of tabs in the group
    // For tabs
    url?: string;
    tabTitle?: string;
    groupFingerprint?: string; // Format: "GroupTitle|color" or "ungrouped"
}

export interface WorkspaceAssignments {
    [workspaceId: string]: {
        groups: Array<{
            title: string;
            color: string;
            index: number;
            tabUrls: string[];
        }>;
        tabs: Array<{
            url: string;
            title: string;
            index: number;
            groupFingerprint?: string;
            tabId?: number;
        }>;
    };
}

export interface WindowWorkspaceAssignments {
    [windowId: number]: WorkspaceAssignments;
}

export interface ActiveWorkspacePerWindow {
    [windowId: number]: string; // workspace ID
}
