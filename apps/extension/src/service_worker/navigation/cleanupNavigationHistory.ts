import { navigationHistoryByWindow } from "./navigationConstants";

// Helper function to clean up closed tabs from history
export async function cleanupNavigationHistory(windowId: number): Promise<boolean> {
    const navHistory = navigationHistoryByWindow[windowId];
    if (!navHistory || navHistory.history.length === 0) return false;

    const validatedHistory: number[] = [];
    let adjustedCurrentIndex = navHistory.currentIndex;
    let removedAny = false;

    for (let i = 0; i < navHistory.history.length; i++) {
        const tabId = navHistory.history[i];
        try {
            await chrome.tabs.get(tabId);
            validatedHistory.push(tabId);
        } catch (error) {
            console.log("Error getting tab:", error);
            removedAny = true;
            // Tab is closed, adjust current index if needed
            if (i <= navHistory.currentIndex) {
                adjustedCurrentIndex--;
            }
        }
    }

    // Update history with only valid tabs
    navHistory.history = validatedHistory;
    const clampedIndex = Math.max(-1, Math.min(adjustedCurrentIndex, validatedHistory.length - 1));
    const historyChanged = removedAny || clampedIndex !== navHistory.currentIndex;
    navHistory.currentIndex = clampedIndex;

    return historyChanged;
}
