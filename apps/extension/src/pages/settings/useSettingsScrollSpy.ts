import { useCallback, useEffect, useRef, useState } from "react";

type Section = { readonly id: string };

export const useSettingsScrollSpy = (sections: readonly Section[], offset = 75) => {
    const [centeredSection, setCenteredSection] = useState(sections[0]?.id ?? "");
    const contentRef = useRef<HTMLDivElement>(null);

    const handleSidebarClick = useCallback(
        (id: string) => {
            const content = contentRef.current;
            const target = document.getElementById(id);
            if (!content || !target) return;

            const contentRect = content.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            const scrollOffset = targetRect.top - contentRect.top + content.scrollTop - offset;

            const start = content.scrollTop;
            const end = scrollOffset;
            const duration = 500;
            const startTime = performance.now();

            const animateScroll = (now: number) => {
                if (!content) return;
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
                content.scrollTop = start + (end - start) * ease;
                if (progress < 1) {
                    requestAnimationFrame(animateScroll);
                } else {
                    content.scrollTop = end;
                }
            };

            requestAnimationFrame(animateScroll);
        },
        [offset]
    );

    const handleScroll = useCallback(() => {
        const content = contentRef.current;
        if (!content) return;

        const contentTop = content.getBoundingClientRect().top;
        let closestSection = sections[0]?.id ?? "";
        let minDistance = Infinity;

        for (const section of sections) {
            const el = document.getElementById(section.id);
            if (!el) continue;
            const distance = Math.abs(el.getBoundingClientRect().top - contentTop);
            if (distance < minDistance) {
                minDistance = distance;
                closestSection = section.id;
            }
        }

        setCenteredSection(closestSection);
    }, [sections]);

    useEffect(() => {
        const content = contentRef.current;
        if (!content) return;
        content.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
        return () => {
            content.removeEventListener("scroll", handleScroll);
        };
    }, [handleScroll]);

    return { centeredSection, contentRef, handleSidebarClick };
};
