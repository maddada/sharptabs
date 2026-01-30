export function getElementPosition(elementSelector: string) {
    const element = document.querySelector(elementSelector);

    if (!element) {
        console.log(`Element not found for selector: ${elementSelector}`);
        return null; // Element doesn't exist
    }

    // Get the position and size relative to the viewport
    const rect = element.getBoundingClientRect();

    return {
        top: rect.top, // Distance from the viewport's top edge to the element's top edge
        left: rect.left, // Distance from the viewport's left edge to the element's left edge
        right: rect.right, // Distance from the viewport's left edge to the element's right edge
        bottom: rect.bottom, // Distance from the viewport's top edge to the element's bottom edge
        width: rect.width, // Width of the element
        height: rect.height, // Height of the element
        x: rect.x, // Same as rect.left (horizontal coordinate)
        y: rect.y, // Same as rect.top (vertical coordinate)
    };
}
