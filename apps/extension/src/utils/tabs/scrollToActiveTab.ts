import { ItemType } from "@/types/CombinedItem";
import { isElementInView } from "@/components/tabs-manager/helpers/isElementInView";

export const scrollToActiveTab = (
    fromButton: boolean = false,
    currentActiveTabId: number = 0,
    scrollContainerRef: React.MutableRefObject<HTMLDivElement | null> | null,
    activeTabId: number
) => {
    const effectiveTabId = currentActiveTabId || activeTabId;

    if (!scrollContainerRef || !effectiveTabId) {
        return;
    }

    const container = scrollContainerRef.current;
    if (!container) {
        console.log("[SCROLL-TO-ACTIVE] No scroll container available");
        return;
    }

    const selectors = [
        `[data-tab-id="${ItemType.PINNED}-${effectiveTabId}"]`,
        `[data-tab-id="${ItemType.REGULAR}-${effectiveTabId}"]`,
        `[data-tab-id="${ItemType.GTAB}-${effectiveTabId}"]`,
    ];

    const activeTabElement = container.querySelector(selectors.join(", "));

    if (activeTabElement) {
        const { isInView } = isElementInView(activeTabElement, container, 20);

        if (!isInView || fromButton) {
            const containerRect = container.getBoundingClientRect();
            const elementRect = activeTabElement.getBoundingClientRect();
            const scrollTarget = container.scrollTop + (elementRect.top - containerRect.top) - containerRect.height / 2 + elementRect.height / 2;

            container.scrollTo({ top: scrollTarget, behavior: "smooth" });
        }
    } else {
        console.log(`scrollToActiveTab: Tab element ${effectiveTabId} not found for scrolling`);
    }
};
