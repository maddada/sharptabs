// Simple navigation history per window
export const NAVIGATION_HISTORY_LIMIT = 30;

export interface SimpleNavigationHistory {
    history: number[]; // Array of tab IDs in chronological order
    currentIndex: number; // Current position in history array
}

// Track programmatic navigation to avoid adding it to history
export const programmaticNavigationInProgress = new Set<string>(); // Set of "windowId-tabId" keys

// Navigation history per window (shared state)
export const navigationHistoryByWindow: Record<number, SimpleNavigationHistory> = {};
