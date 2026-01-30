import { navigationHistoryByWindow, SimpleNavigationHistory } from "./navigationConstants";

// Helper function to initialize navigation history for a window
export function initializeNavigationHistory(windowId: number): SimpleNavigationHistory {
    if (!navigationHistoryByWindow[windowId]) {
        navigationHistoryByWindow[windowId] = {
            history: [],
            currentIndex: -1,
        };
    }
    return navigationHistoryByWindow[windowId];
}
