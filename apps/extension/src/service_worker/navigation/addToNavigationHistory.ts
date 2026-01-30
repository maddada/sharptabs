import { NAVIGATION_HISTORY_LIMIT, programmaticNavigationInProgress } from "./navigationConstants";
import { broadcastNavigationStateChange } from "./broadcastNavigationStateChange";
import { initializeNavigationHistory } from "./initializeNavigationHistory";

// Helper function to add tab to navigation history
export function addToNavigationHistory(windowId: number, tabId: number) {
    const navigationKey = `${windowId}-${tabId}`;

    // Skip if this is a programmatic navigation
    if (programmaticNavigationInProgress.has(navigationKey)) {
        programmaticNavigationInProgress.delete(navigationKey);
        return;
    }

    const navHistory = initializeNavigationHistory(windowId);

    // If we're not at the end of history, truncate everything after current position
    if (navHistory.currentIndex < navHistory.history.length - 1) {
        navHistory.history = navHistory.history.slice(0, navHistory.currentIndex + 1);
    }

    // Check if this tab already exists in the history
    const existingTabIndex = navHistory.history.indexOf(tabId);
    if (existingTabIndex !== -1) {
        // Remove from old position and add to end
        navHistory.history.splice(existingTabIndex, 1);
        if (existingTabIndex <= navHistory.currentIndex) {
            navHistory.currentIndex--;
        }
    }

    // Add new tab to history
    navHistory.history.push(tabId);
    navHistory.currentIndex = navHistory.history.length - 1;

    // Limit history size
    if (navHistory.history.length > NAVIGATION_HISTORY_LIMIT) {
        navHistory.history.shift();
        navHistory.currentIndex--;
    }

    // Broadcast navigation state change after adding to history
    broadcastNavigationStateChange(windowId);
}
