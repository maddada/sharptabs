/**
 * Automatically adds a newly opened tab to the same group as its opener tab.
 * This handles the case when a user clicks a link that opens in a new tab -
 * the new tab should be in the same group as the tab where the link was clicked.
 *
 * Note: This only triggers when openerTabId is set, which happens when:
 * - User clicks a link that opens in a new tab
 * - User Ctrl+clicks or middle-clicks a link
 *
 * It does NOT trigger for:
 * - Reopening closed tabs (they restore to original position)
 * - Opening new tabs via Ctrl+T
 * - Session restore
 */
export async function handleAutoGroupFromOpener(tab: chrome.tabs.Tab): Promise<void> {
    // Only process if the tab has an opener and a valid ID
    if (!tab.openerTabId || !tab.id) {
        return;
    }

    try {
        // Get the opener tab to check its group
        const openerTab = await chrome.tabs.get(tab.openerTabId);

        // Only proceed if opener tab is in a group
        if (openerTab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
            return;
        }

        // Add the new tab to the same group as the opener
        await chrome.tabs.group({
            tabIds: [tab.id],
            groupId: openerTab.groupId,
        });

        console.log(`[AutoGroup] Added tab ${tab.id} to group ${openerTab.groupId} (opened from tab ${tab.openerTabId})`);
    } catch (error) {
        // Opener tab might have been closed already, or other edge cases
        console.log("[AutoGroup] Could not auto-group tab:", error);
    }
}
