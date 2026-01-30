import { Tab } from "@/types/Tab";
import { normalizeUrlForDuplicateCheck } from "./normalizeUrlForDuplicateCheck";

/**
 * Groups tabs by their normalized URL and returns a map of URL -> tab IDs
 * Only includes groups with more than one tab (i.e., duplicates)
 */
export function groupDuplicateTabs(tabs: Tab[], strictDuplicateChecking: boolean = false): Map<string, number[]> {
    const urlToTabIds = new Map<string, number[]>();

    // Group tabs by normalized URL
    tabs.forEach((tab) => {
        // Skip tabs with null, undefined, or empty URLs
        if (!tab.url || tab.url.trim() === "") {
            return;
        }

        const normalizedUrl = normalizeUrlForDuplicateCheck(tab.url, strictDuplicateChecking);
        const existingTabIds = urlToTabIds.get(normalizedUrl) || [];
        existingTabIds.push(tab.id);
        urlToTabIds.set(normalizedUrl, existingTabIds);
    });

    // Filter to only include groups with duplicates (more than 1 tab)
    const duplicateGroups = new Map<string, number[]>();
    urlToTabIds.forEach((tabIds, url) => {
        if (tabIds.length > 1) {
            duplicateGroups.set(url, tabIds);
        }
    });

    return duplicateGroups;
}

export function findDuplicateTabs(tabs: Tab[], strictDuplicateChecking: boolean = false): Set<number> {
    const duplicateTabIds = new Set<number>();
    const duplicateGroups = groupDuplicateTabs(tabs, strictDuplicateChecking);

    // Find all tab IDs that have duplicates
    duplicateGroups.forEach((tabIds) => {
        tabIds.forEach((tabId) => duplicateTabIds.add(tabId));
    });

    return duplicateTabIds;
}
