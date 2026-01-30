import { getNavigationState } from "./getNavigationState";

// Helper function to broadcast navigation state changes to UI
export async function broadcastNavigationStateChange(windowId: number) {
    try {
        const navigationState = await getNavigationState(windowId);

        // Broadcast to all contexts (popup, sidepanel, newtab)
        chrome.runtime
            .sendMessage({
                type: "NAVIGATION_STATE_CHANGED",
                windowId: windowId,
                navigationState: navigationState,
            })
            .catch(() => {
                // Ignore errors - no listeners might be active
            });

        console.log(`[NAV DEBUG SW] Broadcasted navigation state for window ${windowId}:`, navigationState);
    } catch (error) {
        console.log("Error broadcasting navigation state:", error);
    }
}
