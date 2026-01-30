class TooltipManager {
    constructor() {
        this.tooltip = null;
        this.currentTarget = null;
        this.hideTimeout = null;
        this.init();
    }

    init() {
        this.createTooltip();
        this.bindEvents();
    }

    createTooltip() {
        this.tooltip = document.createElement("div");
        this.tooltip.className = "custom-tooltip";
        this.tooltip.style.cssText = `
            position: absolute;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 12px;
            padding: 12px 16px;
            color: white;
            font-size: 14px;
            font-weight: 500;
            line-height: 1.4;
            max-width: 300px;
            word-wrap: break-word;
            z-index: 1000;
            pointer-events: none;
            opacity: 0;
            transform: translateY(-5px);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow:
                0 8px 32px rgba(0, 0, 0, 0.3),
                0 2px 16px rgba(0, 0, 0, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.1);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif;
        `;
        document.body.appendChild(this.tooltip);
    }

    show(element, text) {
        // Always clear any pending hide operation
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        // If showing tooltip for the same element with same text, don't do anything
        if (this.currentTarget === element && this.tooltip.textContent === text && this.tooltip.style.opacity === "1") {
            return;
        }

        this.currentTarget = element;
        this.tooltip.textContent = text;

        const rect = element.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();

        // Position below the element with 5px gap
        let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        let top = rect.bottom + 5;

        // Keep tooltip within viewport bounds
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (left < 10) {
            left = 10;
        } else if (left + tooltipRect.width > viewportWidth - 10) {
            left = viewportWidth - tooltipRect.width - 10;
        }

        if (top + tooltipRect.height > viewportHeight - 10) {
            // If tooltip would go below viewport, show it above the element instead
            top = rect.top - tooltipRect.height - 5;
        }

        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.opacity = "1";
        this.tooltip.style.transform = "translateY(0)";
    }

    hide() {
        if (!this.tooltip) return;

        this.tooltip.style.opacity = "0";
        this.tooltip.style.transform = "translateY(-5px)";
        this.currentTarget = null;
    }

    bindEvents() {
        // Use a single mouseover handler to track what we're hovering over
        document.addEventListener("mouseover", (e) => {
            const target = e.target.closest("[data-tooltip]");

            if (target) {
                const tooltipText = target.getAttribute("data-tooltip");
                if (tooltipText) {
                    this.show(target, tooltipText);
                }
            } else if (this.currentTarget) {
                // Mouse is over something without a tooltip, start hide timer
                if (this.hideTimeout) {
                    clearTimeout(this.hideTimeout);
                }
                this.hideTimeout = setTimeout(() => {
                    this.hide();
                }, 100);
            }
        });

        // Hide tooltip when scrolling or resizing
        window.addEventListener("scroll", () => this.hide());
        window.addEventListener("resize", () => this.hide());
    }

    destroy() {
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }
    }
}

// Auto-initialize when script loads
let _tooltipManager;
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        _tooltipManager = new TooltipManager();
    });
} else {
    _tooltipManager = new TooltipManager();
}
