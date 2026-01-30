import { useEffect } from "react";
import { useTabManagerStore } from "@/stores/tabManagerStore";

/**
 * Custom hook that automatically collapses all Chrome tab groups in the current window
 * every X seconds when the feature is enabled and the extension is loaded as sidebar.
 *
 * @param isEnabled - Whether the auto-collapse feature should be active
 */
export function useKeepChromeGroupsCollapsed(isEnabled: boolean) {
    const inPopup = useTabManagerStore((state) => state.inPopup);
    const inSidepanel = useTabManagerStore((state) => state.inSidepanel);
    const inNewTab = useTabManagerStore((state) => state.inNewTab);

    useEffect(() => {
        // Set up the interval to run the collapse function every X seconds
        const intervalId = setInterval(collapseAllGroupsInCurrentWindow, 5000);

        setTimeout(() => {
            // Run it once immediately when the hook is first enabled
            collapseAllGroupsInCurrentWindow();
        }, 1000);

        async function collapseAllGroupsInCurrentWindow() {
            try {
                // Only run when enabled and when extension is loaded as sidebar (not popup)
                if (!isEnabled || !inSidepanel) {
                    clearInterval(intervalId);
                    return;
                }

                // 1. Query for all tab groups within the current window.
                const tabGroups = await chrome.tabGroups.query({
                    windowId: chrome.windows.WINDOW_ID_CURRENT,
                });

                // 2. Check if any tab groups were found to avoid running unnecessary code.
                if (tabGroups.length === 0) {
                    return;
                }

                // console.log(`Found ${tabGroups.length} groups. Collapsing them...`);

                // 3. Create an array of promises for all the update operations.
                // This allows us to run the updates in parallel for better performance.
                const updatePromises = tabGroups
                    .map((group) => {
                        // We only update the group if it's not already collapsed.
                        if (!group.collapsed) {
                            // collapse a group
                            return chrome.tabGroups.update(group.id, { collapsed: true });
                        }
                        return null;
                    })
                    .filter(Boolean);

                // 4. Wait for all the update operations to complete.
                await Promise.all(updatePromises);

                // console.log("All tab groups have been collapsed.");
            } catch (error) {
                console.log("An error occurred while collapsing tab groups:", error);
            }
        }

        // Cleanup function to clear the interval when the hook is disabled or component unmounts
        return () => {
            clearInterval(intervalId);
        };
    }, [isEnabled, inPopup, inSidepanel, inNewTab]);
}
