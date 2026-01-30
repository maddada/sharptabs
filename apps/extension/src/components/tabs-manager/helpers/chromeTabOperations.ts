import { ChromeOperations } from "./types/dragDrop";
import { logDragOperation } from "./dragAndDrop/logDragOperation";

export class ChromeTabOperations implements ChromeOperations {
    async moveTab(tabId: number, targetIndex: number, callExtra: Record<string, unknown> = {}): Promise<void> {
        logDragOperation("CHROME-API-CALL", {
            operation: callExtra?.operation ?? "chrome.tabs.move",
            tabId,
            targetIndex,
            ...callExtra,
        });
        await chrome.tabs.move(tabId, { index: targetIndex });
        if (callExtra.successMessage) {
            logDragOperation("CHROME-API-SUCCESS", callExtra.successMessage);
        }
    }

    async moveTabGroup(groupId: number, targetIndex: number, callExtra: Record<string, unknown> = {}): Promise<void> {
        logDragOperation("CHROME-API-CALL", {
            operation: callExtra?.operation ?? "chrome.tabGroups.move",
            groupId,
            targetIndex,
            ...callExtra,
        });
        await chrome.tabGroups.move(groupId, { index: targetIndex });
        if (callExtra.successMessage) {
            logDragOperation("CHROME-API-SUCCESS", callExtra.successMessage);
        }
    }

    async ungroupTab(tabId: number): Promise<void> {
        logDragOperation("CHROME-API-CALL", {
            operation: "chrome.tabs.ungroup",
            tabId,
        });
        await chrome.tabs.ungroup(tabId);
    }

    async groupTabs(tabIds: number[], groupId: number): Promise<void> {
        logDragOperation("CHROME-API-CALL", {
            operation: "chrome.tabs.group",
            tabIds,
            groupId,
        });
        await chrome.tabs.group({ tabIds, groupId });
    }

    async getTab(tabId: number): Promise<chrome.tabs.Tab> {
        return chrome.tabs.get(tabId);
    }

    async queryTabs(query: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> {
        return chrome.tabs.query(query);
    }

    // Semantic helper methods for common operations
    async moveTabAfterPinned(tabId: number, pinnedTabsLength: number): Promise<void> {
        await this.moveTab(tabId, pinnedTabsLength - 1, {
            successMessage: "Moved tab after pinned tabs",
        });
    }

    async ungroupAndMoveTab(tabId: number, targetIndex: number, extra?: Record<string, unknown>): Promise<void> {
        await this.ungroupTab(tabId);
        await this.moveTab(tabId, targetIndex, {
            operation: "chrome.tabs.ungroup + chrome.tabs.move",
            ...extra,
        });
    }

    async addTabToGroup(tabId: number, groupId: number, targetIndex: number, extra?: Record<string, unknown>): Promise<void> {
        await this.groupTabs([tabId], groupId);
        await this.moveTab(tabId, targetIndex, {
            operation: "chrome.tabs.group + chrome.tabs.move",
            groupId,
            ...extra,
        });
    }

    async moveTabFromGroupToGroup(tabId: number, newGroupId: number, targetIndex: number, extra?: Record<string, unknown>): Promise<void> {
        await this.ungroupTab(tabId);
        await this.groupTabs([tabId], newGroupId);
        await this.moveTab(tabId, targetIndex, {
            operation: "chrome.tabs.ungroup + chrome.tabs.group + chrome.tabs.move",
            groupId: newGroupId,
            ...extra,
        });
    }
}
