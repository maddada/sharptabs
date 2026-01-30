export function centerContextMenu(open: boolean) {
    if (open && window.innerWidth < 400) {
        setTimeout(() => {
            const sharpTabsContextMenuStyle = document.querySelector("head > style.sharp-tabs-context-menu-style");
            const popperElement = document.querySelector("[data-radix-popper-content-wrapper]");

            const yTransformValue = getYTransformInlineStyleValue(popperElement as HTMLElement);
            let prevYTransformValue = null;

            if (sharpTabsContextMenuStyle) {
                prevYTransformValue = sharpTabsContextMenuStyle.getAttribute("data-prev-y-transform-value");
            }

            if (yTransformValue !== prevYTransformValue && popperElement) {
                document.querySelector("head")?.insertAdjacentHTML(
                    "beforeend",
                    `
                    <style class="sharp-tabs-context-menu-style" data-prev-y-transform-value="${yTransformValue}">
                        [data-radix-popper-content-wrapper] {
                            transform: translate(${window.innerWidth / 2 - 195 / 2}px, ${yTransformValue}) !important;
                            display: block !important;
                        }
                    </style>
                `
                );
            }
        }, 10);
    } else {
        const sharpTabsContextMenuStyle = document.querySelector("head > style.sharp-tabs-context-menu-style");
        sharpTabsContextMenuStyle?.remove();
    }
}

function getYTransformInlineStyleValue(popperElement: HTMLElement | null) {
    let yTransformValue = "0px";

    if (popperElement) {
        const transformStyle = popperElement.getAttribute("style");

        if (transformStyle) {
            const match = transformStyle.match(/translate\([^,]+,\s*([^)]+)\)/);

            if (match && match[1]) {
                yTransformValue = match[1].trim();
            }
        }
    }

    return yTransformValue;
}
