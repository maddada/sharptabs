import { navigationHistoryByWindow, programmaticNavigationInProgress } from "./navigationConstants";
import { broadcastNavigationStateChange } from "./broadcastNavigationStateChange";
import { cleanupNavigationHistory } from "./cleanupNavigationHistory";

// Handle navigation back
export async function handleNavigateBack(windowId: number): Promise<boolean> {
    const navHistory = navigationHistoryByWindow[windowId];
    if (!navHistory || navHistory.currentIndex <= 0) {
        return false;
    }

    // Clean up history first
    await cleanupNavigationHistory(windowId);

    // Check if we can still go back after cleanup
    if (navHistory.currentIndex <= 0) {
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

        // Remove invalid tab and try again
        navHistory.history.splice(targetIndex, 1);
        if (targetIndex <= navHistory.currentIndex) {
            navHistory.currentIndex--;
        }
        return false;
    }
}
