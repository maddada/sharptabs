import { create } from "zustand";
import { computed } from "zustand-middleware-computed-state";
import { SavedSession } from "@/types/SavedSession";
import { ColorEnum, TabGroup } from "@/types/TabGroup";
import { Tab } from "@/types/Tab";
import { MutableRefObject, RefObject } from "react";

interface AutoOrganizeGroup {
    name: string;
    color: ColorEnum | undefined;
    tabIds: number[];
}

interface UselessTabsGroup {
    reason: string;
    tabIds: number[];
}

interface TabManagerState {
    isInitialMount: boolean;
    inPopup: boolean;
    inSidepanel: boolean;
    inNewTab: boolean;
    containerHeight: string;

    isAutoOrganizeDialogOpen: boolean;
    autoOrganizeGroups: AutoOrganizeGroup[];
    isAutoOrganizeLoading: boolean;

    isDeleteUselessTabsDialogOpen: boolean;
    deleteUselessTabsGroups: UselessTabsGroup[];
    isDeleteUselessTabsLoading: boolean;
    previousCollapsedState: Set<number>;
    skipAnimation: boolean;
    savedSessions: SavedSession[];
    isRestoreDialogOpen: boolean;
    isAddToGroupModalOpen: boolean;
    isRenameModalOpen: boolean;
    activeTabGroup: TabGroup | null;
    toastDuration: number;
    isWindowSelectionDialogOpen: boolean;
    windowSelectionDialogTab: Tab | null;
    windowSelectionDialogTabs: Tab[] | null;
    windowSelectionDialogGroup: TabGroup | null;
    isCloseTabsDialogOpen: boolean;
    closeTabsDialogTab: Tab | null;
    closeTabsDialogType: "below" | "others" | null;
    scrollContainerRef: MutableRefObject<HTMLDivElement | null> | null;
    isWindowFocused: boolean;
    isWindowFocusListenersInitialized: boolean;
    isDuplicateCheckMode: boolean;
    duplicateTabsCount: number;
    isVivaldi: boolean;
    workspaceAssignments: any;
    otherWindowsData: Array<{ windowId: number; windowTitle: string; items: any[] }>;
    showBackgroundImage: boolean;
    isBulkOpenLinksDialogOpen: boolean;

    actions: {
        setIsInitialMount: (isInitialMount: boolean) => void;
        setInPopup: (isPopup: boolean) => void;
        setInSidepanel: (inSidepanel: boolean) => void;
        setInNewTab: (inNewTab: boolean) => void;
        setContainerHeight: (height: string) => void;
        setIsAutoOrganizeDialogOpen: (open: boolean) => void;
        setAutoOrganizeGroups: (groups: AutoOrganizeGroup[]) => void;
        setIsAutoOrganizeLoading: (loading: boolean) => void;

        setIsDeleteUselessTabsDialogOpen: (open: boolean) => void;
        setCloseUselessTabsGroups: (groups: UselessTabsGroup[]) => void;
        setIsDeleteUselessTabsLoading: (loading: boolean) => void;
        setPreviousCollapsedState: (state: Set<number>) => void;
        setSkipAnimation: (skip: boolean) => void;
        setSavedSessions: (sessions: SavedSession[]) => void;
        setIsRestoreDialogOpen: (open: boolean) => void;
        setIsAddToGroupModalOpen: (open: boolean) => void;
        setIsRenameModalOpen: (open: boolean) => void;
        setActiveTabGroup: (group: TabGroup | null) => void;
        setToastDuration: (duration: number) => void;
        setIsWindowSelectionDialogOpen: (open: boolean) => void;
        setWindowSelectionDialogTab: (tab: Tab | null) => void;
        setWindowSelectionDialogTabs: (tabs: Tab[]) => void;
        setWindowSelectionDialogGroup: (group: TabGroup | null) => void;
        closeWindowSelectionDialog: () => void;
        setIsCloseTabsDialogOpen: (open: boolean) => void;
        setCloseTabsDialogTab: (tab: Tab | null) => void;
        setCloseTabsDialogType: (type: "below" | "others" | null) => void;
        closeCloseTabsDialog: () => void;
        setScrollContainerRef: (ref: RefObject<HTMLDivElement | null> | null) => void;
        clearScrollContainerRef: () => void;
        setIsWindowFocused: (focused: boolean) => void;
        initializeWindowFocusListeners: () => void;
        cleanupWindowFocusListeners: () => void;
        setIsDuplicateCheckMode: (enabled: boolean) => void;
        toggleDuplicateCheckMode: () => void;
        setDuplicateTabsCount: (count: number) => void;
        setIsVivaldi: (isVivaldi: boolean) => void;
        setWorkspaceAssignments: (assignments: any) => void;
        setOtherWindowsData: (data: Array<{ windowId: number; windowTitle: string; items: any[] }>) => void;
        setShowBackgroundImage: (show: boolean) => void;
        setIsBulkOpenLinksDialogOpen: (open: boolean) => void;
    };
}

type SetType = (
    partial: TabManagerState | Partial<TabManagerState> | ((state: TabManagerState) => TabManagerState | Partial<TabManagerState>),
    replace?: boolean | undefined
) => void;

export const useTabManagerStore = create<TabManagerState>(
    computed<TabManagerState, {}>(
        (set: SetType, get: () => TabManagerState) => ({
            isInitialMount: true,

            inPopup: false,
            inSidepanel: false,
            inNewTab: false,
            containerHeight: "600px",

            isAutoOrganizeDialogOpen: false,
            autoOrganizeGroups: [],
            isAutoOrganizeLoading: false,

            isDeleteUselessTabsDialogOpen: false,
            deleteUselessTabsGroups: [],
            isDeleteUselessTabsLoading: false,
            previousCollapsedState: new Set<number>(),
            skipAnimation: true,
            savedSessions: [],
            isRestoreDialogOpen: false,
            isAddToGroupModalOpen: false,
            isRenameModalOpen: false,
            activeTabGroup: null,
            toastDuration: 3000,
            isWindowSelectionDialogOpen: false,
            windowSelectionDialogTab: null,
            windowSelectionDialogTabs: null,
            windowSelectionDialogGroup: null,
            isCloseTabsDialogOpen: false,
            closeTabsDialogTab: null,
            closeTabsDialogType: null,
            scrollContainerRef: null,
            isWindowFocused: true,
            isWindowFocusListenersInitialized: false,
            isDuplicateCheckMode: false,
            duplicateTabsCount: 0,
            isVivaldi: false,
            workspaceAssignments: {},
            otherWindowsData: [],
            showBackgroundImage: false,
            isBulkOpenLinksDialogOpen: false,

            actions: {
                setIsInitialMount: (isInitialMount: boolean) => set({ isInitialMount }),
                setInPopup: (inPopup: boolean) => set({ inPopup }),
                setInSidepanel: (inSidepanel: boolean) => set({ inSidepanel }),
                setInNewTab: (inNewTab: boolean) => set({ inNewTab }),
                setContainerHeight: (height: string) => set({ containerHeight: height }),
                setIsAutoOrganizeDialogOpen: (open: boolean) => set({ isAutoOrganizeDialogOpen: open }),
                setAutoOrganizeGroups: (groups: AutoOrganizeGroup[]) => set({ autoOrganizeGroups: groups }),
                setIsAutoOrganizeLoading: (loading: boolean) => set({ isAutoOrganizeLoading: loading }),

                setIsDeleteUselessTabsDialogOpen: (open: boolean) => set({ isDeleteUselessTabsDialogOpen: open }),
                setCloseUselessTabsGroups: (groups: UselessTabsGroup[]) => set({ deleteUselessTabsGroups: groups }),
                setIsDeleteUselessTabsLoading: (loading: boolean) => set({ isDeleteUselessTabsLoading: loading }),
                setPreviousCollapsedState: (state: Set<number>) => set({ previousCollapsedState: state }),
                setSkipAnimation: (skip: boolean) => set({ skipAnimation: skip }),
                setSavedSessions: (sessions: SavedSession[]) => set({ savedSessions: sessions }),
                setIsRestoreDialogOpen: (open: boolean) => set({ isRestoreDialogOpen: open }),
                setIsAddToGroupModalOpen: (open: boolean) => set({ isAddToGroupModalOpen: open }),
                setIsRenameModalOpen: (open: boolean) => set({ isRenameModalOpen: open }),
                setActiveTabGroup: (group: TabGroup | null) => set({ activeTabGroup: group }),
                setToastDuration: (duration: number) => set({ toastDuration: duration }),
                setIsWindowSelectionDialogOpen: (open: boolean) => set({ isWindowSelectionDialogOpen: open }),
                setWindowSelectionDialogTab: (tab: Tab | null) => set({ windowSelectionDialogTab: tab }),
                setWindowSelectionDialogTabs: (tabs: Tab[] | null) => set({ windowSelectionDialogTabs: tabs ?? [] }),
                setWindowSelectionDialogGroup: (group: TabGroup | null) => set({ windowSelectionDialogGroup: group }),
                closeWindowSelectionDialog: () =>
                    set({
                        isWindowSelectionDialogOpen: false,
                        windowSelectionDialogTab: null,
                        windowSelectionDialogTabs: null,
                        windowSelectionDialogGroup: null,
                    }),
                setIsCloseTabsDialogOpen: (open: boolean) => set({ isCloseTabsDialogOpen: open }),
                setCloseTabsDialogTab: (tab: Tab | null) => set({ closeTabsDialogTab: tab }),
                setCloseTabsDialogType: (type: "below" | "others" | null) => set({ closeTabsDialogType: type }),
                closeCloseTabsDialog: () =>
                    set({
                        isCloseTabsDialogOpen: false,
                        closeTabsDialogTab: null,
                        closeTabsDialogType: null,
                    }),
                setScrollContainerRef: (ref: MutableRefObject<HTMLDivElement | null> | null) => set({ scrollContainerRef: ref }),
                clearScrollContainerRef: () => set({ scrollContainerRef: null }),
                setIsWindowFocused: (focused: boolean) => set({ isWindowFocused: focused }),
                initializeWindowFocusListeners: () => {
                    const state = get();
                    if (state.isWindowFocusListenersInitialized) {
                        return; // Already initialized
                    }

                    const handleFocus = () => set({ isWindowFocused: true });
                    const handleBlur = () => set({ isWindowFocused: false });

                    window.addEventListener("focus", handleFocus);
                    window.addEventListener("blur", handleBlur);

                    // Set initial focus state and mark as initialized
                    set({
                        isWindowFocused: document.hasFocus(),
                        isWindowFocusListenersInitialized: true,
                    });

                    // Store cleanup function
                    (window as any).__tabManagerFocusCleanup = () => {
                        window.removeEventListener("focus", handleFocus);
                        window.removeEventListener("blur", handleBlur);
                    };
                },
                cleanupWindowFocusListeners: () => {
                    if ((window as any).__tabManagerFocusCleanup) {
                        (window as any).__tabManagerFocusCleanup();
                        delete (window as any).__tabManagerFocusCleanup;
                        set({ isWindowFocusListenersInitialized: false });
                    }
                },
                setIsDuplicateCheckMode: (enabled: boolean) => set({ isDuplicateCheckMode: enabled }),
                toggleDuplicateCheckMode: () => set((state) => ({ isDuplicateCheckMode: !state.isDuplicateCheckMode })),
                setDuplicateTabsCount: (count: number) => {
                    set({ duplicateTabsCount: count });
                    // Auto-disable duplicate mode if no duplicates exist
                    if (count === 0) {
                        set({ isDuplicateCheckMode: false });
                    }
                },
                setIsVivaldi: (isVivaldi: boolean) => set({ isVivaldi }),
                setWorkspaceAssignments: (assignments: any) => set({ workspaceAssignments: assignments }),
                setOtherWindowsData: (data: Array<{ windowId: number; windowTitle: string; items: any[] }>) => set({ otherWindowsData: data }),
                setShowBackgroundImage: (show: boolean) => set({ showBackgroundImage: show }),
                setIsBulkOpenLinksDialogOpen: (open: boolean) => set({ isBulkOpenLinksDialogOpen: open }),
            },
        }),
        () => ({}) // No computed state for now
    )
);
