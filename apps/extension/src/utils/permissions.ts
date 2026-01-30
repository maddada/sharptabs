// Permissions utilities
// Note: Auto-suspend no longer requires special permissions since it uses
// native chrome.tabs.discard() API which is already in the manifest.

/**
 * Check if the extension has the required permissions for auto-suspend functionality
 * @returns Promise<boolean> - always true since auto-suspend uses native APIs
 */
export async function hasAutoSuspendPermissions(): Promise<boolean> {
    // Auto-suspend now uses native chrome.tabs.discard() which doesn't require
    // additional host permissions beyond what's in the manifest
    return true;
}

/**
 * Request permissions required for auto-suspend functionality
 * @returns Promise<boolean> - always true since no additional permissions needed
 */
export async function requestAutoSuspendPermissions(): Promise<boolean> {
    // No additional permissions needed for native tab discarding
    return true;
}

/**
 * Remove permissions for auto-suspend functionality
 * @returns Promise<boolean> - always true since no additional permissions to remove
 */
export async function removeAutoSuspendPermissions(): Promise<boolean> {
    // No additional permissions to remove
    return true;
}
