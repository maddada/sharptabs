import { navigationHistoryByWindow, programmaticNavigationInProgress } from "./navigationConstants";
import { broadcastNavigationStateChange } from "./broadcastNavigationStateChange";
import { cleanupNavigationHistory } from "./cleanupNavigationHistory";
import { withNavigationLock } from "./withNavigationLock";

// Handle navigation back
export async function handleNavigateBack(windowId: number): Promise<boolean> {
    return withNavigationLock(windowId, async () => {
        const navHistory = navigationHistoryByWindow[windowId];
        if (!navHistory) {
            return false;
        }

        // Clean up history first
        const historyChanged = await cleanupNavigationHistory(windowId);

        // Check if we can still go back after cleanup
        if (navHistory.currentIndex <= 0) {
            if (historyChanged) {
                await broadcastNavigationStateChange(windowId);
            }
            return false;
        }

        const targetIndex = navHistory.currentIndex - 1;
        const targetTabId = navHistory.history[targetIndex];

        try {
            // Mark this as programmatic navigation
            const navigationKey = `${windowId}-${targetTabId}`;
            programmaticNavigationInProgress.add(navigationKey);

            await chrome.tabs.update(targetTabId, { active: true });
            navHistory.currentIndex = targetIndex;

            // Broadcast the navigation state change immediately
            await broadcastNavigationStateChange(windowId);

            return true;
        } catch (error) {
            console.log("Error navigating back:", error);
            // Remove the flag if navigation failed
            const navigationKey = `${windowId}-${targetTabId}`;
            programmaticNavigationInProgress.delete(navigationKey);

            // Remove invalid tab and adjust index
            navHistory.history.splice(targetIndex, 1);
            if (targetIndex <= navHistory.currentIndex) {
                navHistory.currentIndex--;
            }

            if (navHistory.history.length === 0) {
                navHistory.currentIndex = -1;
            } else {
                navHistory.currentIndex = Math.max(0, Math.min(navHistory.currentIndex, navHistory.history.length - 1));
            }

            await broadcastNavigationStateChange(windowId);
            return false;
        }
    });
}
