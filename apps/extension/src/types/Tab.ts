export type Tab = {
    id: number;
    title: string;
    url: string;
    pinned: boolean;
    groupId: number;
    index: number;
    favIconUrl?: string;
    audible?: boolean;
    mutedInfo?: {
        muted: boolean;
    };
    discarded?: boolean;
    frozen?: boolean;
    status?: string; // "unloaded" | "loading" | "complete" | undefined;
    autoDiscardable?: boolean;
    active?: boolean;
    dndId?: string;
    windowId?: number;
};
