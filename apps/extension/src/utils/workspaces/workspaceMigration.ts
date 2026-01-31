/**
 * Workspace assignments are stored per-window, but Chrome window IDs change after browser restart.
 * This module migrates stored windowId keys to the current windows using fuzzy matching.
 *
 * IMPORTANT: Workspace membership is still determined via the existing workaround approach:
 * - Groups: title + color (+ tabUrls for higher confidence)
 * - Tabs: URL (restore URLs are normalized via `extractOriginalUrl`)
 */

import { WindowWorkspaceAssignments, WorkspaceAssignments } from "@/types/Workspace";
import { extractOriginalUrl, urlsMatch } from "./workspaceMatcher";
import { setMigrationInProgress } from "./workspaceSync";
import { isNewTab } from "../tabs/isNewTab";

interface WindowFingerprint {
    windowId: number;
    tabCount: number;
    groupCount: number;
    groupSignatures: Set<string>;
    urlSet: Set<string>;
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPlaceholderUrl(url: string | undefined): boolean {
    return isNewTab({ url } as chrome.tabs.Tab);
}

function getGroupSignature(title: string | undefined, color: string): string {
    return `${title || ""}|${color}`;
}

function hasMeaningfulAssignments(assignments: WorkspaceAssignments | undefined): boolean {
    if (!assignments) return false;
    return Object.values(assignments).some((ws) => (ws?.groups?.length || 0) > 0 || (ws?.tabs?.length || 0) > 0);
}

function getAssignmentFingerprint(windowId: number, assignments: WorkspaceAssignments): WindowFingerprint {
    const groupSignatures = new Set<string>();
    const urlSet = new Set<string>();
    let tabCount = 0;
    let groupCount = 0;

    for (const [workspaceId, ws] of Object.entries(assignments)) {
        if (!ws || workspaceId === "general") continue;

        groupCount += ws.groups?.length || 0;
        tabCount += ws.tabs?.length || 0;

        for (const group of ws.groups || []) {
            groupSignatures.add(getGroupSignature(group.title, group.color));
            for (const tabUrl of group.tabUrls || []) {
                const normalized = extractOriginalUrl(tabUrl);
                if (normalized) urlSet.add(normalized);
            }
        }

        for (const tab of ws.tabs || []) {
            const normalized = extractOriginalUrl(tab.url);
            if (normalized) urlSet.add(normalized);
        }
    }

    return { windowId, tabCount, groupCount, groupSignatures, urlSet };
}

async function getBrowserFingerprint(windowId: number): Promise<WindowFingerprint> {
    const [tabs, groups] = await Promise.all([chrome.tabs.query({ windowId }), chrome.tabGroups.query({ windowId })]);

    const groupSignatures = new Set<string>();
    for (const group of groups) {
        groupSignatures.add(getGroupSignature(group.title, group.color));
    }

    const urlSet = new Set<string>();
    for (const tab of tabs) {
        const candidate = !isPlaceholderUrl(tab.url) ? tab.url : !isPlaceholderUrl(tab.pendingUrl) ? tab.pendingUrl : "";
        if (!candidate) continue;
        urlSet.add(extractOriginalUrl(candidate));
    }

    return {
        windowId,
        tabCount: tabs.length,
        groupCount: groups.length,
        groupSignatures,
        urlSet,
    };
}

function setOverlap(source: Set<string>, target: Set<string>): { jaccard: number; coverage: number; intersectionCount: number } {
    // "coverage" is asymmetric (source→target): how much of the source set is present in the target.
    // This is important because our stored assignments intentionally exclude "general" items, so
    // the stored set is often a strict subset of the current window's full tab/group set.
    if (source.size === 0 || target.size === 0) return { jaccard: 0, coverage: 0, intersectionCount: 0 };

    let intersectionCount = 0;
    for (const value of source) {
        if (target.has(value)) intersectionCount++;
    }

    const unionCount = source.size + target.size - intersectionCount;
    const jaccard = unionCount === 0 ? 0 : intersectionCount / unionCount;
    const coverage = source.size === 0 ? 0 : intersectionCount / source.size;

    return { jaccard, coverage, intersectionCount };
}

function countSimilarity(a: WindowFingerprint, b: WindowFingerprint): number {
    const maxTabs = Math.max(a.tabCount, b.tabCount, 1);
    const maxGroups = Math.max(a.groupCount, b.groupCount, 1);
    const tabDiff = Math.abs(a.tabCount - b.tabCount) / maxTabs;
    const groupDiff = Math.abs(a.groupCount - b.groupCount) / maxGroups;
    return 1 - (tabDiff + groupDiff) / 2;
}

function getFingerprintSimilarity(
    orphan: WindowFingerprint,
    current: WindowFingerprint
): {
    score: number;
    groupSimilarity: number;
    urlSimilarity: number;
    urlOverlap: number;
} {
    const group = setOverlap(orphan.groupSignatures, current.groupSignatures);
    const urls = setOverlap(orphan.urlSet, current.urlSet);
    const counts = countSimilarity(orphan, current);

    // Weighting:
    // - If groups exist, group signatures are the strongest signal.
    // - Otherwise, rely on URL overlap.
    let score = 0;
    if (orphan.groupSignatures.size > 0 && current.groupSignatures.size > 0) {
        score = group.coverage * 0.6 + urls.coverage * 0.3 + counts * 0.1;
    } else if (orphan.urlSet.size > 0 && current.urlSet.size > 0) {
        score = urls.coverage * 0.7 + counts * 0.3;
    } else {
        // Last resort: counts only (avoid matching unless very close)
        score = counts * 0.5;
    }

    return {
        score,
        groupSimilarity: group.coverage,
        urlSimilarity: urls.coverage,
        urlOverlap: urls.intersectionCount,
    };
}

function mergeWorkspaceAssignments(source: WorkspaceAssignments, existing: WorkspaceAssignments | undefined): WorkspaceAssignments {
    const merged: WorkspaceAssignments = JSON.parse(JSON.stringify(source));
    if (!existing) return merged;

    for (const [workspaceId, ws] of Object.entries(existing)) {
        if (!ws || workspaceId === "general") continue;

        if (!merged[workspaceId]) {
            merged[workspaceId] = { groups: [], tabs: [] };
        }

        const target = merged[workspaceId];

        // Groups: dedupe by title|color
        for (const group of ws.groups || []) {
            const exists = target.groups.some((g) => g.title === group.title && g.color === group.color);
            if (!exists) target.groups.push(group);
        }

        // Tabs: dedupe by URL (normalize restore URLs)
        for (const tab of ws.tabs || []) {
            const exists = target.tabs.some((t) => urlsMatch(t.url, tab.url));
            if (!exists) target.tabs.push(tab);
        }
    }

    return merged;
}

async function performMigrationPass(options: { requireSufficientWindows: boolean }): Promise<{
    orphanedWindowIds: number[];
    meaningfulOrphanCount: number;
    eligibleWindowCount: number;
    movedCount: number;
}> {
    const [currentWindows, storage] = await Promise.all([
        chrome.windows.getAll(),
        chrome.storage.local.get(["workspaceAssignments", "activeWorkspacePerWindow"]),
    ]);

    const workspaceAssignments: WindowWorkspaceAssignments = storage.workspaceAssignments || {};
    const activeWorkspacePerWindow: Record<number, string> = storage.activeWorkspacePerWindow || {};

    const currentWindowIds = new Set(currentWindows.map((w) => w.id).filter((id): id is number => id !== undefined));

    const orphanedWindowIds = Object.keys(workspaceAssignments)
        .map((id) => parseInt(id, 10))
        .filter((id) => !currentWindowIds.has(id) && Number.isFinite(id));

    // Clean up truly empty orphaned entries immediately
    for (const orphanedId of orphanedWindowIds) {
        const orphaned = workspaceAssignments[orphanedId];
        if (!hasMeaningfulAssignments(orphaned)) {
            delete workspaceAssignments[orphanedId];
            delete activeWorkspacePerWindow[orphanedId];
        }
    }

    const cleanedOrphanedWindowIds = Object.keys(workspaceAssignments)
        .map((id) => parseInt(id, 10))
        .filter((id) => !currentWindowIds.has(id) && Number.isFinite(id));

    const meaningfulOrphanedWindowIds = cleanedOrphanedWindowIds.filter((id) => hasMeaningfulAssignments(workspaceAssignments[id]));

    if (cleanedOrphanedWindowIds.length === 0) {
        return { orphanedWindowIds: [], meaningfulOrphanCount: 0, eligibleWindowCount: 0, movedCount: 0 };
    }

    // Only migrate into windows that currently have no meaningful assignments.
    // This prevents accidentally merging multiple orphan windows into a single current window
    // while Chrome is still restoring additional windows.
    const eligibleWindowIds = [...currentWindowIds].filter((id) => !hasMeaningfulAssignments(workspaceAssignments[id]));

    if (options.requireSufficientWindows && meaningfulOrphanedWindowIds.length > 1 && eligibleWindowIds.length < meaningfulOrphanedWindowIds.length) {
        return {
            orphanedWindowIds: cleanedOrphanedWindowIds,
            meaningfulOrphanCount: meaningfulOrphanedWindowIds.length,
            eligibleWindowCount: eligibleWindowIds.length,
            movedCount: 0,
        };
    }

    const currentFingerprints = await Promise.all(eligibleWindowIds.map(async (id) => getBrowserFingerprint(id)));

    const orphanFingerprints = cleanedOrphanedWindowIds.map((orphanedId) => getAssignmentFingerprint(orphanedId, workspaceAssignments[orphanedId]));

    type Candidate = {
        orphanedId: number;
        targetWindowId: number;
        score: number;
        groupSimilarity: number;
        urlSimilarity: number;
        urlOverlap: number;
        secondBestScore: number;
    };

    const candidates: Candidate[] = [];

    for (const orphanFp of orphanFingerprints) {
        const scores = currentFingerprints
            .map((currentFp) => {
                const sim = getFingerprintSimilarity(orphanFp, currentFp);
                return { targetWindowId: currentFp.windowId, ...sim };
            })
            .sort((a, b) => b.score - a.score);

        const best = scores[0];
        if (!best) continue;

        const secondBestScore = scores[1]?.score ?? 0;
        candidates.push({
            orphanedId: orphanFp.windowId,
            targetWindowId: best.targetWindowId,
            score: best.score,
            groupSimilarity: best.groupSimilarity,
            urlSimilarity: best.urlSimilarity,
            urlOverlap: best.urlOverlap,
            secondBestScore,
        });
    }

    // Accept only confident matches, then resolve conflicts greedily by score
    const confident = candidates
        .filter((c) => {
            const orphanFp = orphanFingerprints.find((fp) => fp.windowId === c.orphanedId);
            if (!orphanFp) return false;

            const margin = c.score - c.secondBestScore;
            const hasGroups = orphanFp.groupSignatures.size > 0;
            const hasUrls = orphanFp.urlSet.size > 0;

            // If we have group signatures, require decent group similarity or overall score.
            if (hasGroups) {
                if (c.groupSimilarity < 0.5 && c.score < 0.6) return false;
            } else if (hasUrls) {
                // For URL-only windows, require at least some overlap.
                if (c.urlOverlap === 0) return false;
                if (c.urlSimilarity < 0.35 && c.score < 0.5) return false;
            } else {
                // Count-only is too ambiguous to migrate reliably.
                return false;
            }

            // Avoid ambiguous matches early in startup.
            if (margin < 0.08 && currentFingerprints.length > 1) return false;

            return true;
        })
        .sort((a, b) => b.score - a.score);

    const usedWindows = new Set<number>();
    const usedOrphans = new Set<number>();
    const matches: Array<{ orphanedId: number; targetWindowId: number }> = [];

    for (const c of confident) {
        if (usedWindows.has(c.targetWindowId)) continue;
        if (usedOrphans.has(c.orphanedId)) continue;

        usedWindows.add(c.targetWindowId);
        usedOrphans.add(c.orphanedId);
        matches.push({ orphanedId: c.orphanedId, targetWindowId: c.targetWindowId });
    }

    if (matches.length === 0) {
        return {
            orphanedWindowIds: cleanedOrphanedWindowIds,
            meaningfulOrphanCount: meaningfulOrphanedWindowIds.length,
            eligibleWindowCount: eligibleWindowIds.length,
            movedCount: 0,
        };
    }

    for (const { orphanedId, targetWindowId } of matches) {
        const orphanedData = workspaceAssignments[orphanedId];
        if (!orphanedData) continue;

        const existingTarget = workspaceAssignments[targetWindowId];
        workspaceAssignments[targetWindowId] = mergeWorkspaceAssignments(orphanedData, existingTarget);

        if (activeWorkspacePerWindow[orphanedId] && !activeWorkspacePerWindow[targetWindowId]) {
            activeWorkspacePerWindow[targetWindowId] = activeWorkspacePerWindow[orphanedId];
        }

        delete workspaceAssignments[orphanedId];
        delete activeWorkspacePerWindow[orphanedId];
    }

    await chrome.storage.local.set({
        workspaceAssignments,
        activeWorkspacePerWindow,
    });

    const remainingOrphans = Object.keys(workspaceAssignments)
        .map((id) => parseInt(id, 10))
        .filter((id) => !currentWindowIds.has(id) && Number.isFinite(id));

    const meaningfulRemaining = remainingOrphans.filter((id) => hasMeaningfulAssignments(workspaceAssignments[id]));

    return {
        orphanedWindowIds: remainingOrphans,
        meaningfulOrphanCount: meaningfulRemaining.length,
        eligibleWindowCount: eligibleWindowIds.length,
        movedCount: matches.length,
    };
}

/**
 * Migrate orphaned workspace assignments to current windows on browser startup.
 * Retries for a short period to allow Chrome to finish restoring multiple windows.
 */
export async function migrateWorkspaceAssignmentsOnStartup(isRetry: boolean = false): Promise<void> {
    // Keep the original signature (isRetry) to avoid changing call sites.
    void isRetry;

    setMigrationInProgress(true);
    const startTime = Date.now();

    try {
        const maxWaitMs = 10000;
        const pollIntervalMs = 1000;
        const requireAllWindowsUntilMs = 4000;

        while (Date.now() - startTime < maxWaitMs) {
            const elapsedMs = Date.now() - startTime;
            const { orphanedWindowIds, meaningfulOrphanCount, eligibleWindowCount, movedCount } = await performMigrationPass({
                requireSufficientWindows: elapsedMs < requireAllWindowsUntilMs,
            });

            if (orphanedWindowIds.length === 0) {
                console.log("[Workspace Migration] No orphaned window assignments found");
                return;
            }

            if (meaningfulOrphanCount === 0) {
                console.log("[Workspace Migration] Only empty orphaned assignments remained; cleaned up");
                return;
            }

            if (movedCount > 0) {
                console.log(`[Workspace Migration] Migrated ${movedCount} orphaned window assignment(s)`);
            } else if (elapsedMs < requireAllWindowsUntilMs && eligibleWindowCount < meaningfulOrphanCount) {
                console.log(`[Workspace Migration] Waiting for Chrome to restore more windows (${eligibleWindowCount}/${meaningfulOrphanCount})...`);
            } else {
                console.log(`[Workspace Migration] Orphaned assignments remain (${meaningfulOrphanCount}); waiting for more restore data...`);
            }

            await delay(pollIntervalMs);
        }

        // Timeout reached. Still attempt a best-effort migration with whatever windows are currently open,
        // even if Chrome never restored all expected windows (e.g. stale/orphan entries from non-normal windows).
        const finalPass = await performMigrationPass({ requireSufficientWindows: false });

        if (finalPass.orphanedWindowIds.length === 0) {
            console.log("[Workspace Migration] No orphaned window assignments found");
            return;
        }

        if (finalPass.meaningfulOrphanCount === 0) {
            console.log("[Workspace Migration] Only empty orphaned assignments remained; cleaned up");
            return;
        }

        if (finalPass.movedCount > 0) {
            console.log(`[Workspace Migration] Migrated ${finalPass.movedCount} orphaned window assignment(s) on final pass`);
        }

        console.warn(`[Workspace Migration] Timed out waiting to migrate all orphaned assignments (${finalPass.meaningfulOrphanCount} remaining).`);
    } catch (error) {
        console.error("[Workspace Migration] Error during migration:", error);
    } finally {
        setMigrationInProgress(false);
    }
}
