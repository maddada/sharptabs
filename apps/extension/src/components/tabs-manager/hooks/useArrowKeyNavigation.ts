import { useEffect, useRef, useCallback } from "react";

/**
 * Arrow Key Navigation Hook for Tab Manager
 *
 * Provides robust keyboard navigation functionality for tab and group elements using arrow keys.
 * Handles complex scenarios including element removal, focus recovery, and state preservation.
 *
 * ## Core Features:
 * • **Bidirectional Navigation**: Up/Down arrow key navigation through focusable tab and group elements
 * • **Smart Element Detection**: Automatically finds focusable buttons with `data-tab-id` or `id^='group-'` attributes
 * • **Smooth Scrolling**: Automatically scrolls focused elements into view with smooth behavior
 * • **Accessibility Compliance**: Respects disabled states and tabindex attributes
 *
 * ## Focus Management:
 * • **Focus Tracking**: Maintains references to last focused element with index and navigation direction
 * • **Activation Tracking**: Preserves focus on elements activated with Enter/Space keys
 * • **Focus Recovery**: Multiple fallback mechanisms when focus is lost or elements are removed
 * • **DOM Monitoring**: Detects when focused elements are removed from DOM and triggers recovery
 *
 * ## Recovery Mechanisms:
 * • **Smart Recovery**: When elements are removed, intelligently calculates new focus position based on:
 *   - Navigation direction (up/down)
 *   - Original element index
 *   - Available elements in updated DOM
 * • **Active Tab Fallback**: Falls back to currently active tab when no other focus target is available
 * • **Last Activated Restoration**: Restores focus to last element activated with Enter/Space
 * • **Stale Reference Cleanup**: Automatically cleans up references to removed DOM elements
 *
 * ## Search Integration:
 * • **Search State Detection**: Checks if search input is active and has content
 * • **Conditional Logic**: Skips active tab fallback behavior when search is in progress
 * • **Input Field Exclusion**: Ignores arrow keys when focus is in input/textarea elements
 *
 * ## Edge Case Handling:
 * • **Dynamic DOM**: Handles scenarios where elements are added/removed during navigation
 * • **Empty States**: Gracefully handles cases with no focusable elements
 * • **Timing Issues**: Uses setTimeout to monitor element state after focus changes
 * • **Modifier Keys**: Ignores navigation when Ctrl/Alt/Meta keys are pressed
 * • **Circular Navigation**: Wraps around when reaching first/last element
 *
 * ## Event Handling:
 * • **Enter/Space Activation**: Tracks when elements are activated for focus preservation
 * • **Arrow Key Prevention**: Prevents default browser behavior for up/down arrows
 * • **Event Propagation**: Stops event bubbling to prevent conflicts
 * • **Cleanup**: Properly removes event listeners on component unmount
 *
 * ## Performance Optimizations:
 * • **DOM Query Caching**: Caches focusable elements between operations
 * • **Debounced Navigation**: Prevents excessive DOM queries on rapid key presses
 * • **Timeout Cleanup**: Manages and cleans up monitoring timeouts
 * • **Conditional Logging**: Only logs in development mode
 *
 * @returns {void} Hook doesn't return anything, manages keyboard navigation internally
 */
export function useArrowKeyNavigation() {
    // Track the last focused element and its index for recovery
    const lastFocusedRef = useRef<{ element: HTMLElement; index: number; direction: "up" | "down" } | null>(null);
    // Track the element that was activated with enter/space to preserve focus
    const lastActivatedRef = useRef<{ element: HTMLElement; index: number } | null>(null);
    // Cache for focusable elements to reduce DOM queries
    const elementsCache = useRef<{ elements: HTMLElement[]; timestamp: number } | null>(null);
    // Track active timeouts for cleanup
    const activeTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());
    // Debounce timer
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    const CACHE_DURATION = 100; // ms
    const DEBOUNCE_DELAY = 50; // ms

    // Helper function to log only in development
    const devLog = (...args: any[]) => {
        if (process.env.NODE_ENV !== "production") {
            console.log(...args);
        }
    };

    // Helper function to get all focusable elements with caching
    const getFocusableElements = useCallback((): HTMLElement[] => {
        const now = Date.now();

        // Return cached elements if still valid
        if (elementsCache.current && now - elementsCache.current.timestamp < CACHE_DURATION) {
            return elementsCache.current.elements;
        }

        const tabElements = document.querySelectorAll("div[data-tab-id], button[id^='group-']");
        const focusableElements = Array.from(tabElements).filter((el) => {
            const element = el as HTMLElement;
            return element.offsetParent !== null && !element.hasAttribute("disabled") && element.getAttribute("tabindex") !== "-1";
        }) as HTMLElement[];

        // Cache the result
        elementsCache.current = { elements: focusableElements, timestamp: now };
        return focusableElements;
    }, []);

    // Simple helper functions - no need for useCallback
    const invalidateCache = () => {
        elementsCache.current = null;
    };

    const focusAndScroll = (element: HTMLElement): void => {
        element.focus();
        element.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };

    const updateTracking = (element: HTMLElement, index: number, direction: "up" | "down"): void => {
        lastFocusedRef.current = { element, index, direction };
    };

    const createMonitoredTimeout = (callback: () => void, delay: number): NodeJS.Timeout => {
        const timeout = setTimeout(() => {
            activeTimeouts.current.delete(timeout);
            callback();
        }, delay);
        activeTimeouts.current.add(timeout);
        return timeout;
    };

    const cleanupTimeouts = () => {
        activeTimeouts.current.forEach((timeout) => clearTimeout(timeout));
        activeTimeouts.current.clear();
    };

    // Helper function to find the active tab element
    const findActiveTab = useCallback((focusableElements: HTMLElement[]): { element: HTMLElement; index: number } | null => {
        for (let i = 0; i < focusableElements.length; i++) {
            const element = focusableElements[i];
            if (element.classList.contains("active-tab-item")) {
                return { element, index: i };
            }
        }
        return null;
    }, []);

    // Centralized navigation helper - eliminates duplication
    const navigateFromIndex = useCallback(
        (fromIndex: number, direction: "up" | "down", focusableElements: HTMLElement[], logContext: string): void => {
            const nextIndex = calculateNextIndex(fromIndex, direction, focusableElements.length);
            const nextElement = focusableElements[nextIndex];

            devLog(`[useArrowKeyNavigation] ➡️ ${logContext}: navigating ${direction} from index ${fromIndex} to ${nextIndex}`, {
                elementId: nextElement.id,
                textContent: nextElement.textContent?.slice(0, 30),
            });

            focusAndScroll(nextElement);
            updateTracking(nextElement, nextIndex, direction);
        },
        []
    );

    // Helper function to perform smart recovery when elements are removed
    const performSmartRecovery = useCallback((originalIndex: number, direction: "up" | "down", focusableElements: HTMLElement[]): boolean => {
        if (focusableElements.length === 0) return false;

        let recoveryIndex: number;
        if (direction === "down") {
            recoveryIndex = Math.min(originalIndex, focusableElements.length - 1);
        } else {
            recoveryIndex = Math.max(0, Math.min(originalIndex - 1, focusableElements.length - 1));
        }

        const recoveryElement = focusableElements[recoveryIndex];
        devLog("[useArrowKeyNavigation] 🩹 performSmartRecovery: focusing recovery element at index", recoveryIndex, {
            element: recoveryElement,
            id: recoveryElement.id,
            textContent: recoveryElement.textContent?.slice(0, 30),
            direction,
            originalIndex,
        });

        focusAndScroll(recoveryElement);
        updateTracking(recoveryElement, recoveryIndex, direction);
        return true;
    }, []);

    // Main navigation handler with debouncing
    const handleNavigation = useCallback(
        (direction: "up" | "down"): void => {
            // Clear any existing debounce timer
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }

            debounceTimer.current = setTimeout(() => {
                devLog(`[useArrowKeyNavigation] 🎮 handleNavigation: processing ${direction} navigation`);

                const focusableElements = getFocusableElements();
                devLog("[useArrowKeyNavigation] 📋 handleNavigation: found", focusableElements.length, "focusable elements");

                if (focusableElements.length === 0) {
                    devLog("[useArrowKeyNavigation] ❌ handleNavigation: no focusable elements found, aborting");
                    return;
                }

                const currentFocusedElement = document.activeElement;
                let currentIndex = focusableElements.findIndex((el) => el === currentFocusedElement);
                devLog("[useArrowKeyNavigation] 🎯 handleNavigation: current focused element index:", currentIndex);

                // Helper function to try starting from active tab when no search is active
                const tryStartFromActiveTab = (): boolean => {
                    if (isSearchActive()) {
                        devLog("[useArrowKeyNavigation] 🔍 tryStartFromActiveTab: search is active, skipping active tab logic");
                        return false;
                    }

                    const activeTab = findActiveTab(focusableElements);
                    if (!activeTab) {
                        devLog("[useArrowKeyNavigation] 🔍 tryStartFromActiveTab: no active tab found");
                        return false;
                    }

                    devLog("[useArrowKeyNavigation] 🎯 tryStartFromActiveTab: found active tab at index", activeTab.index);
                    navigateFromIndex(activeTab.index, direction, focusableElements, "tryStartFromActiveTab");
                    devLog("[useArrowKeyNavigation] ✅ tryStartFromActiveTab: successfully started navigation from active tab");
                    return true;
                };

                // Helper function to try restoring focus to last activated element
                const tryRestoreActivatedElement = (): boolean => {
                    if (!lastActivatedRef.current || !document.contains(lastActivatedRef.current.element)) {
                        if (lastActivatedRef.current && !document.contains(lastActivatedRef.current.element)) {
                            devLog("[useArrowKeyNavigation] 🗑️ tryRestoreActivatedElement: clearing stale reference - element no longer in DOM");
                            lastActivatedRef.current = null; // Clear stale reference
                        }
                        return false;
                    }

                    const currentActivatedIndex = focusableElements.findIndex((el) => el === lastActivatedRef.current?.element);
                    if (currentActivatedIndex === -1) {
                        devLog("[useArrowKeyNavigation] 🗑️ tryRestoreActivatedElement: clearing stale reference - element no longer focusable");
                        lastActivatedRef.current = null; // Clear stale reference
                        return false;
                    }

                    devLog("[useArrowKeyNavigation] 🎯 tryRestoreActivatedElement: found last activated element at index", currentActivatedIndex);
                    navigateFromIndex(currentActivatedIndex, direction, focusableElements, "tryRestoreActivatedElement");
                    devLog("[useArrowKeyNavigation] ✅ tryRestoreActivatedElement: successfully restored and navigated from activated element");
                    return true;
                };

                // Helper function to try restoring focus using last focused element tracking
                const tryRestoreLastFocused = (): boolean => {
                    if (!lastFocusedRef.current) return false;

                    const lastFocused = lastFocusedRef.current;
                    devLog("[useArrowKeyNavigation] 🔍 tryRestoreLastFocused: checking last focused element at index", lastFocused.index, {
                        elementId: lastFocused.element.id,
                        lastDirection: lastFocused.direction,
                        stillInDOM: document.contains(lastFocused.element),
                    });

                    if (document.contains(lastFocused.element)) {
                        devLog("[useArrowKeyNavigation] ✅ tryRestoreLastFocused: last focused element still in DOM, no recovery needed");
                        return false;
                    }

                    devLog(
                        "[useArrowKeyNavigation] 🚨 tryRestoreLastFocused: last focused element removed from DOM! Calling performSmartRecovery..."
                    );
                    return performSmartRecovery(lastFocused.index, direction, focusableElements);
                };

                // Handle focus recovery if no current focus
                if (currentIndex === -1) {
                    devLog("[useArrowKeyNavigation] 🔍 handleNavigation: no current focus, attempting recovery...");

                    // Try to start from active tab when no search is active
                    if (tryStartFromActiveTab()) {
                        devLog("[useArrowKeyNavigation] ✅ handleNavigation: recovery successful via tryStartFromActiveTab");
                        return;
                    }

                    // Try to restore focus to last activated element
                    if (tryRestoreActivatedElement()) {
                        devLog("[useArrowKeyNavigation] ✅ handleNavigation: recovery successful via tryRestoreActivatedElement");
                        return;
                    }

                    // Try to restore focus using last focused element tracking
                    if (tryRestoreLastFocused()) {
                        devLog("[useArrowKeyNavigation] ✅ handleNavigation: recovery successful via tryRestoreLastFocused");
                        return;
                    }

                    // No recovery possible, start from first element
                    devLog("[useArrowKeyNavigation] 🚀 handleNavigation: no recovery possible, starting from first element (index 0)");
                    currentIndex = 0;
                } else {
                    // Navigate based on direction
                    const originalIndex = currentIndex;
                    currentIndex = calculateNextIndex(currentIndex, direction, focusableElements.length);
                    devLog(
                        `[useArrowKeyNavigation] ➡️ handleNavigation: normal navigation ${direction} from index ${originalIndex} to ${currentIndex}`
                    );
                }

                const nextElement = focusableElements[currentIndex];
                devLog("[useArrowKeyNavigation] 🎯 handleNavigation: about to focus element at index", currentIndex, {
                    elementId: nextElement.id,
                    textContent: nextElement.textContent?.slice(0, 30),
                    isStillInDOM: document.contains(nextElement),
                });

                // Handle case where element is no longer in DOM
                if (!document.contains(nextElement)) {
                    devLog(
                        "[useArrowKeyNavigation] ⚠️ handleNavigation: target element no longer in DOM! Re-querying and calling performSmartRecovery..."
                    );
                    invalidateCache();
                    const updatedFocusableElements = getFocusableElements();

                    if (updatedFocusableElements.length > 0) {
                        performSmartRecovery(currentIndex, direction, updatedFocusableElements);
                    } else {
                        devLog("[useArrowKeyNavigation] ❌ handleNavigation: no focusable elements found after re-query");
                    }
                    return;
                }

                focusAndScroll(nextElement);
                updateTracking(nextElement, currentIndex, direction);
                devLog("[useArrowKeyNavigation] ✅ handleNavigation: successfully focused element at index", currentIndex);

                // Monitor for element removal after focusing with cleanup
                createMonitoredTimeout(() => {
                    const stillFocused = document.activeElement === nextElement;
                    const stillInDOM = document.contains(nextElement);

                    if (!stillInDOM) {
                        devLog(
                            "[useArrowKeyNavigation] 💥 handleNavigation: element was removed from DOM after focusing! Calling performSmartRecovery..."
                        );
                        invalidateCache();
                        const recoveryElements = getFocusableElements();
                        if (recoveryElements.length > 0) {
                            performSmartRecovery(currentIndex, direction, recoveryElements);
                        } else {
                            devLog("[useArrowKeyNavigation] ❌ handleNavigation: no recovery elements found after removal");
                        }
                    } else if (!stillFocused) {
                        devLog("[useArrowKeyNavigation] ⚠️ handleNavigation: focus was lost but element still in DOM");
                    }
                }, 300);
            }, DEBOUNCE_DELAY);
        },
        [getFocusableElements, findActiveTab, navigateFromIndex, performSmartRecovery]
    );

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            devLog("============ [useArrowKeyNavigation] handleKeyDown ============", e.key, e.metaKey);

            // Handle enter/space activation - track the focused element for preservation
            if (e.key === "Enter" || e.key === " ") {
                const currentFocusedElement = document.activeElement;
                if (currentFocusedElement && (currentFocusedElement.hasAttribute("data-tab-id") || currentFocusedElement.id.startsWith("group-"))) {
                    const focusableElements = getFocusableElements();
                    const currentIndex = focusableElements.findIndex((el) => el === currentFocusedElement);

                    if (currentIndex !== -1) {
                        lastActivatedRef.current = {
                            element: currentFocusedElement as HTMLElement,
                            index: currentIndex,
                        };
                        devLog("[useArrowKeyNavigation] 🎯 handleKeyDown: tracked activated element at index", currentIndex, {
                            elementId: currentFocusedElement.id,
                            textContent: currentFocusedElement.textContent?.slice(0, 30),
                        });
                    }
                }
                return; // Don't prevent default for enter/space
            }

            // Only handle arrow keys when not in input fields
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.ctrlKey || e.altKey || e.metaKey) {
                devLog("[useArrowKeyNavigation] 🚫 handleKeyDown: ignoring - input field or modifier key detected");
                return;
            }

            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                e.stopPropagation();
                devLog(
                    `[useArrowKeyNavigation] ⬇️⬆️ handleKeyDown: arrow key detected, calling handleNavigation(${e.key === "ArrowDown" ? "down" : "up"})`
                );
                handleNavigation(e.key === "ArrowDown" ? "down" : "up");
            }
        };

        // Invalidate cache when DOM might have changed
        const handleMutations = () => {
            invalidateCache();
        };

        document.addEventListener("keydown", handleKeyDown);

        // Listen for DOM changes that might affect focusable elements
        const observer = new MutationObserver(handleMutations);
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["disabled", "tabindex", "data-tab-id"],
        });

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            observer.disconnect();
            cleanupTimeouts();
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [handleNavigation, getFocusableElements]);
}

const calculateNextIndex = (currentIndex: number, direction: "up" | "down", arrayLength: number): number => {
    if (direction === "down") {
        return (currentIndex + 1) % arrayLength;
    } else {
        return (currentIndex - 1 + arrayLength) % arrayLength;
    }
};

// Pure function moved outside component
const isSearchActive = (): boolean => {
    const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    return searchInput && searchInput.value.trim().length > 0;
};
