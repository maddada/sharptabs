import { navigationHistoryByWindow } from "./navigationConstants";

// Get navigation state for UI buttons
export async function getNavigationState(windowId: number): Promise<{ canGoBack: boolean; canGoForward: boolean }> {
    const navHistory = navigationHistoryByWindow[windowId];

    if (!navHistory || navHistory.history.length === 0) {
        return { canGoBack: false, canGoForward: false };
    }

    // Simple check without validation for performance
    const canGoBack = navHistory.currentIndex > 0;
    const canGoForward = navHistory.currentIndex < navHistory.history.length - 1;

    return { canGoBack, canGoForward };
}
