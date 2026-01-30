import type { OverlayScrollbars } from "overlayscrollbars";
import { useEffect, useRef } from "react";

interface UseOverlayScrollbarsOptions {
    alwaysShowScrollbar: boolean;
    showScrollbar: boolean;
}

export function useOverlayScrollbars({ alwaysShowScrollbar, showScrollbar }: UseOverlayScrollbarsOptions) {
    // Ref to store the OverlayScrollbars instance
    const overlayScrollbarsRef = useRef<OverlayScrollbars | null>(null);
    // Store refs for event handlers to manage them dynamically
    const mouseHandlersRef = useRef<{
        handleMouseEnter: (() => void) | null;
        handleMouseLeave: (() => void) | null;
        listenersAdded: boolean;
    }>({ handleMouseEnter: null, handleMouseLeave: null, listenersAdded: false });

    // Update scrollbar options when scrollbar settings change
    useEffect(() => {
        if (overlayScrollbarsRef.current) {
            const root = document.getElementById("root");
            if (!root) return;

            // Determine the correct scrollbar configuration
            let scrollbarOptions: { autoHide: "never" | "leave"; autoHideDelay: number; visibility?: "auto" | "hidden" };

            if (showScrollbar && alwaysShowScrollbar) {
                scrollbarOptions = {
                    autoHide: "never", // Always show scrollbar
                    autoHideDelay: 0,
                    visibility: "auto",
                };
            } else if (showScrollbar) {
                scrollbarOptions = {
                    autoHide: "leave", // Show on hover (controlled by mouse events)
                    autoHideDelay: 0,
                    visibility: "auto",
                };
            } else {
                scrollbarOptions = {
                    autoHide: "leave",
                    autoHideDelay: 0,
                    visibility: "hidden", // Completely hide scrollbar
                };
            }

            overlayScrollbarsRef.current.options({
                scrollbars: scrollbarOptions,
            });

            // Remove existing listeners if they were added
            if (mouseHandlersRef.current.listenersAdded && mouseHandlersRef.current.handleMouseEnter && mouseHandlersRef.current.handleMouseLeave) {
                root.removeEventListener("mouseenter", mouseHandlersRef.current.handleMouseEnter);
                root.removeEventListener("mouseleave", mouseHandlersRef.current.handleMouseLeave);
                mouseHandlersRef.current.listenersAdded = false;
            }

            // Add new listeners only if showScrollbar is enabled and alwaysShowScrollbar is disabled
            if (showScrollbar && !alwaysShowScrollbar) {
                const handleRootMouseEnter = () => {
                    if (overlayScrollbarsRef.current) {
                        overlayScrollbarsRef.current.options({ scrollbars: { autoHide: "never" } });
                    }
                };
                const handleRootMouseLeave = () => {
                    if (overlayScrollbarsRef.current) {
                        overlayScrollbarsRef.current.options({ scrollbars: { autoHide: "leave" } });
                    }
                };

                mouseHandlersRef.current.handleMouseEnter = handleRootMouseEnter;
                mouseHandlersRef.current.handleMouseLeave = handleRootMouseLeave;

                root.addEventListener("mouseenter", handleRootMouseEnter);
                root.addEventListener("mouseleave", handleRootMouseLeave);
                mouseHandlersRef.current.listenersAdded = true;
            }
        }
    }, [showScrollbar, alwaysShowScrollbar]);

    // Cleanup effect for component unmount
    useEffect(() => {
        return () => {
            const root = document.getElementById("root");
            if (
                root &&
                mouseHandlersRef.current.listenersAdded &&
                mouseHandlersRef.current.handleMouseEnter &&
                mouseHandlersRef.current.handleMouseLeave
            ) {
                root.removeEventListener("mouseenter", mouseHandlersRef.current.handleMouseEnter);
                root.removeEventListener("mouseleave", mouseHandlersRef.current.handleMouseLeave);
                mouseHandlersRef.current.listenersAdded = false;
            }
        };
    }, []);

    // Return the ref and initialization callback for OverlayScrollbarsComponent
    const handleScrollbarsInitialized = (instance: OverlayScrollbars) => {
        // Store the instance reference
        overlayScrollbarsRef.current = instance;

        instance.on("destroyed", () => {
            // Clear the instance reference
            overlayScrollbarsRef.current = null;

            // Clean up mouse event listeners
            const root = document.getElementById("root");
            if (
                root &&
                mouseHandlersRef.current.listenersAdded &&
                mouseHandlersRef.current.handleMouseEnter &&
                mouseHandlersRef.current.handleMouseLeave
            ) {
                root.removeEventListener("mouseenter", mouseHandlersRef.current.handleMouseEnter);
                root.removeEventListener("mouseleave", mouseHandlersRef.current.handleMouseLeave);
                mouseHandlersRef.current.listenersAdded = false;
            }
        });
    };

    return {
        overlayScrollbarsRef,
        handleScrollbarsInitialized,
    };
}
