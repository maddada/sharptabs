// Smooth scrolling for anchor links
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();

            const targetId = this.getAttribute("href");

            // Skip if it's just "#" (often used for JS-controlled elements)
            if (targetId === "#") return;

            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                // Smooth scroll to the element
                targetElement.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });

                // Update URL hash without causing a jump
                history.pushState(null, "", targetId);
            }
        });
    });
});
