import { extractOriginalUrl, urlsMatch } from "@/utils/workspaces/workspaceMatcher";
import { moveTabToWorkspaceEnd, removeTabFromAllWorkspaces } from "@/utils/workspaces/workspaceHandlers";
import { isNewTab } from "@/utils/tabs/isNewTab";
import type { WorkspaceAssignments, WindowWorkspaceAssignments } from "@/types/Workspace";

function normalizeInternalUrl(url: string): string {
    return url.endsWith("/") ? url.slice(0, -1) : url;
}

function matchesNewTabLink(url: string | undefined, newTabLink: string | undefined): boolean {
    if (!url || !newTabLink) return false;
    return normalizeInternalUrl(url) === normalizeInternalUrl(newTabLink);
}

function isNewTabCandidate(tab: chrome.tabs.Tab, newTabLink: string | undefined): boolean {
    return isNewTab(tab) || matchesNewTabLink(tab.url, newTabLink);
}

function getWindowAssignments(workspaceAssignments: WindowWorkspaceAssignments | undefined, windowId: number): WorkspaceAssignments {
    if (!workspaceAssignments) return {};
    return (workspaceAssignments as any)[windowId] || (workspaceAssignments as any)[String(windowId)] || {};
}

function buildAssignedSets(windowAssignments: WorkspaceAssignments) {
    const assignedGroupFingerprints = new Set<string>();
    const assignedTabUrls = new Set<string>();

    for (const workspaceId of Object.keys(windowAssignments)) {
        if (workspaceId === "general") continue;
        const assignment = windowAssignments[workspaceId];
        assignment?.groups?.forEach((g) => assignedGroupFingerprints.add(`${g.title}|${g.color}`));
        assignment?.tabs?.forEach((t) => assignedTabUrls.add(extractOriginalUrl(t.url)));
    }

    return { assignedGroupFingerprints, assignedTabUrls };
}

function buildWorkspaceLookup(windowAssignments: WorkspaceAssignments, workspaceId: string) {
    const assignment = windowAssignments[workspaceId];
    const groupFingerprints = new Set<string>(assignment?.groups?.map((g) => `${g.title}|${g.color}`) ?? []);
    const tabUrls = assignment?.tabs?.map((t) => t.url) ?? [];
    return { groupFingerprints, tabUrls };
}

async function buildGroupFingerprintMap(windowId: number): Promise<Map<number, string>> {
    const map = new Map<number, string>();
    try {
        const groups = await chrome.tabGroups.query({ windowId });
        for (const group of groups) {
            map.set(group.id, `${group.title ?? ""}|${group.color}`);
        }
    } catch (error) {
        // Ignore group read errors – workspace filtering will fall back to tab-only checks
    }
    return map;
}

function getTabsInWorkspaceScope(
    allTabs: chrome.tabs.Tab[],
    workspaceId: string,
    windowAssignments: WorkspaceAssignments,
    groupFingerprintMap: Map<number, string>,
    sharePinnedTabsBetweenWorkspaces: boolean
): chrome.tabs.Tab[] {
    const { assignedGroupFingerprints, assignedTabUrls } = buildAssignedSets(windowAssignments);
    const { groupFingerprints: workspaceGroupFingerprints, tabUrls: workspaceTabUrls } = buildWorkspaceLookup(windowAssignments, workspaceId);

    return allTabs.filter((tab) => {
        if (!tab.id) return false;

        if (sharePinnedTabsBetweenWorkspaces && tab.pinned) {
            return true;
        }

        if (!workspaceId || workspaceId === "general") {
            if (tab.groupId !== undefined && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
                const fingerprint = groupFingerprintMap.get(tab.groupId);
                if (!fingerprint) return true;
                return !assignedGroupFingerprints.has(fingerprint);
            }

            if (!tab.url) return true;
            const originalUrl = extractOriginalUrl(tab.url);
            return !assignedTabUrls.has(originalUrl);
        }

        // Custom workspace
        if (tab.groupId !== undefined && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
            const fingerprint = groupFingerprintMap.get(tab.groupId);
            if (!fingerprint) return false;
            return workspaceGroupFingerprints.has(fingerprint);
        }

        if (!tab.url) return false;
        return workspaceTabUrls.some((storedUrl) => urlsMatch(storedUrl, tab.url ?? ""));
    });
}

async function ensureActiveTabIsNotDiscarded(
    windowId: number,
    tabIdsToDiscard: Set<number>,
    allTabs: chrome.tabs.Tab[],
    activeTab: chrome.tabs.Tab
): Promise<void> {
    const storage = await chrome.storage.local.get([
        "enableWorkspaces",
        "activeWorkspacePerWindow",
        "workspaceAssignments",
        "newTabLink",
        "sharePinnedTabsBetweenWorkspaces",
    ]);

    const enableWorkspaces = storage.enableWorkspaces === true;
    const sharePinnedTabsBetweenWorkspaces = storage.sharePinnedTabsBetweenWorkspaces === true;
    const activeWorkspaceId = enableWorkspaces ? storage.activeWorkspacePerWindow?.[windowId] || "general" : null;
    const windowAssignments = enableWorkspaces ? getWindowAssignments(storage.workspaceAssignments, windowId) : {};
    const newTabLink: string | undefined = typeof storage.newTabLink === "string" ? storage.newTabLink : undefined;

    const groupFingerprintMap = enableWorkspaces ? await buildGroupFingerprintMap(windowId) : new Map<number, string>();
    const workspaceScopeTabs = enableWorkspaces
        ? getTabsInWorkspaceScope(allTabs, activeWorkspaceId ?? "general", windowAssignments, groupFingerprintMap, sharePinnedTabsBetweenWorkspaces)
        : allTabs;
    const scopeTabs = enableWorkspaces && activeTab.id && !workspaceScopeTabs.some((t) => t.id === activeTab.id) ? allTabs : workspaceScopeTabs;

    const sortedScopeTabs = [...scopeTabs].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    const activeIndex = activeTab.index ?? 0;

    const nextTab = sortedScopeTabs.find((t) => (t.index ?? 0) > activeIndex && t.id);
    if (nextTab?.id) {
        tabIdsToDiscard.delete(nextTab.id);
        await chrome.tabs.update(nextTab.id, { active: true });
        return;
    }

    const scopeMaxIndex = sortedScopeTabs.length > 0 ? Math.max(...sortedScopeTabs.map((t) => t.index ?? 0)) : activeIndex;

    const existingNewTab =
        allTabs.find((t) => t.id && t.id !== activeTab.id && !t.pinned && isNewTabCandidate(t, newTabLink)) ??
        allTabs.find((t) => t.id && t.id !== activeTab.id && isNewTabCandidate(t, newTabLink));
    if (existingNewTab?.id) {
        tabIdsToDiscard.delete(existingNewTab.id);

        if (enableWorkspaces) {
            const targetWorkspaceId = activeWorkspaceId ?? "general";
            if (targetWorkspaceId === "general") {
                await removeTabFromAllWorkspaces(existingNewTab.id, windowId);
            } else {
                await moveTabToWorkspaceEnd(existingNewTab.id, targetWorkspaceId, windowId);
            }
        }

        const moveIndex = scopeMaxIndex + 1 >= allTabs.length ? -1 : scopeMaxIndex + 1;
        await chrome.tabs.move(existingNewTab.id, { index: moveIndex });
        await chrome.tabs.update(existingNewTab.id, { active: true });
        return;
    }

    const createUrl = newTabLink && newTabLink.trim().length > 0 ? newTabLink : undefined;
    const createdTab = await chrome.tabs.create({ windowId, url: createUrl, active: false });
    if (!createdTab.id) return;

    if (enableWorkspaces) {
        const targetWorkspaceId = activeWorkspaceId ?? "general";
        if (targetWorkspaceId === "general") {
            await removeTabFromAllWorkspaces(createdTab.id, windowId);
        } else {
            await moveTabToWorkspaceEnd(createdTab.id, targetWorkspaceId, windowId);
        }
    }

    const moveIndex = scopeMaxIndex + 1 >= allTabs.length + 1 ? -1 : scopeMaxIndex + 1;
    await chrome.tabs.move(createdTab.id, { index: moveIndex });
    await chrome.tabs.update(createdTab.id, { active: true });
}

export async function discardTabsNativelySafely(tabIds: number[], options?: { windowId?: number }, switchTab: boolean = true): Promise<void> {
    const uniqueIds = Array.from(new Set(tabIds)).filter((id) => Number.isFinite(id) && id > 0);
    if (uniqueIds.length === 0) return;

    let windowId = options?.windowId;
    try {
        if (typeof windowId !== "number") {
            const firstTab = await chrome.tabs.get(uniqueIds[0]);
            windowId = firstTab.windowId;
        }
    } catch {
        return;
    }
    if (typeof windowId !== "number") return;

    const allTabs = await chrome.tabs.query({ windowId });
    const tabById = new Map<number, chrome.tabs.Tab>();
    for (const tab of allTabs) {
        if (typeof tab.id === "number") tabById.set(tab.id, tab);
    }

    const filteredIds = uniqueIds.filter((id) => {
        const tab = tabById.get(id);
        return !(tab && isNewTab(tab));
    });
    if (filteredIds.length === 0) return;

    const activeTab = allTabs.find((t) => t.active);
    const tabIdsToDiscard = new Set<number>(filteredIds);

    if (activeTab?.id && tabIdsToDiscard.has(activeTab.id) && switchTab) {
        try {
            await ensureActiveTabIsNotDiscarded(windowId, tabIdsToDiscard, allTabs, activeTab);
        } catch (error) {
            console.log("[Native Discard] Failed to switch away from active tab:", error);
        }
    }

    for (const tabId of tabIdsToDiscard) {
        try {
            await chrome.tabs.discard(tabId);
        } catch (error) {
            // Ignore per-tab discard errors
        }
    }
}
