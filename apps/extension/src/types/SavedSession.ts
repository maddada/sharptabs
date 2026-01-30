import { Tab } from "./Tab";
import { TabGroup } from "./TabGroup";

export interface SavedSession {
    timestamp: number; // Use timestamp as a unique ID
    date: string;
    time: string;
    pinnedTabs: Tab[];
    regularTabs: Tab[];
    tabGroups: TabGroup[];
    isAuto: boolean; // Flag to distinguish auto vs manual saves

    // Workspace data for restoration
    workspaceAssignments?: {
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
            }>;
        };
    };

    // Active workspace when session was saved
    activeWorkspace?: string;
}
