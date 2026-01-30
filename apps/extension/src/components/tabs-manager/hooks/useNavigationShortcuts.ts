import { useEffect } from "react";

/**
 * Navigation Shortcuts Hook for Tab Manager
 *
 * Provides keyboard shortcuts for back/forward navigation:
 * - Alt+Left / Cmd+[ : Navigate back
 * - Alt+Right / Cmd+] : Navigate forward
 *
 * These shortcuts match common browser navigation patterns.
 */
export function useNavigationShortcuts() {
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            // Skip if in input fields
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Check for navigation shortcuts
            const isNavigateBack = (e.altKey && e.key === "ArrowLeft") || ((e.metaKey || e.ctrlKey) && e.key === "[");

            const isNavigateForward = (e.altKey && e.key === "ArrowRight") || ((e.metaKey || e.ctrlKey) && e.key === "]");

            if (isNavigateBack || isNavigateForward) {
                e.preventDefault();
                e.stopPropagation();

                try {
                    const currentWindow = await chrome.windows.getCurrent();
                    if (currentWindow.id) {
                        const messageType = isNavigateBack ? "NAVIGATE_BACK" : "NAVIGATE_FORWARD";
                        console.log(`[NAV SHORTCUT] Sending ${messageType} for window ${currentWindow.id}`);

                        const response = await chrome.runtime.sendMessage({
                            type: messageType,
                            windowId: currentWindow.id,
                        });

                        if (!response?.success) {
                            console.log(`Navigation ${isNavigateBack ? "back" : "forward"} failed via keyboard shortcut`);
                        }
                    }
                } catch (error) {
                    console.log("Error in navigation shortcut:", error);
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);
}
