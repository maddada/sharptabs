import { Active, Over } from "@dnd-kit/core";
import { Tab } from "@/types/Tab";
import { TabGroup } from "@/types/TabGroup";
import { ItemTypeEnum } from "@/types/CombinedItem";

export interface ParsedDndId {
    type: ItemTypeEnum;
    id: number;
}

export interface DragContext {
    active: Active;
    over: Over | null;
    pinnedTabs: Tab[];
    regularTabs: Tab[];
    tabGroups: TabGroup[];
    collapsedGroups: Set<number>;
    activeParsed: ParsedDndId;
    overParsed: ParsedDndId | null;
    activeItemData: Tab | TabGroup;
    overItemData: Tab | TabGroup | null;
    overGroupItemData: TabGroup | null;
    up: boolean;
    oneIfUp: number;
    oneIfDown: number;
    isMultipleSelection: boolean;
    sortedSelectedTabIds: number[];
}

export interface DragOperationResult {
    shouldSkip: boolean;
    reason?: string;
    targetIndex?: number;
}

export type DropHandler = (context: DragContext, operations: ChromeOperations) => Promise<void>;

export interface ChromeOperations {
    moveTab: (tabId: number, targetIndex: number, extra?: Record<string, unknown>) => Promise<void>;
    moveTabGroup: (groupId: number, targetIndex: number, extra?: Record<string, unknown>) => Promise<void>;
    ungroupTab: (tabId: number) => Promise<void>;
    groupTabs: (tabIds: number[], groupId: number) => Promise<void>;
    getTab: (tabId: number) => Promise<chrome.tabs.Tab>;
    queryTabs: (query: chrome.tabs.QueryInfo) => Promise<chrome.tabs.Tab[]>;
    moveTabAfterPinned: (tabId: number, pinnedTabsLength: number) => Promise<void>;
    ungroupAndMoveTab: (tabId: number, targetIndex: number, extra?: Record<string, unknown>) => Promise<void>;
    addTabToGroup: (tabId: number, groupId: number, targetIndex: number, extra?: Record<string, unknown>) => Promise<void>;
    moveTabFromGroupToGroup: (tabId: number, newGroupId: number, targetIndex: number, extra?: Record<string, unknown>) => Promise<void>;
}
