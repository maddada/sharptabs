export function isElementInView(element: Element, container: Element, padding = 0) {
    const containerRect = container.getBoundingClientRect();
    const visibleTop = containerRect.top;
    const visibleBottom = containerRect.bottom;
    const elementRect = element.getBoundingClientRect();
    const elementTop = elementRect.top;
    const elementBottom = elementRect.bottom;
    const isInView = elementTop >= visibleTop + padding && elementBottom <= visibleBottom - padding;
    const isAbove = elementTop < visibleTop + padding;
    const isBelow = !isInView && !isAbove;
    return { isInView, isAbove, isBelow };
}
