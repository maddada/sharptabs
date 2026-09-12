import { ColorEnum } from "@/types/TabGroup";

interface PromptTab {
    id: number;
    title: string;
    url: string;
}

export interface PromptOrganizationFallback {
    name: string;
    color: ColorEnum;
    tabIds: number[];
}

export function getPromptOrganizationFallback(tabs: PromptTab[], instruction: string): PromptOrganizationFallback | null {
    // Only recover unambiguous whole-site requests. Qualifiers, exclusions and
    // custom names must be interpreted by the AI, never silently discarded.
    const normalizedInstruction = instruction
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/[.!?]+$/, "");
    const simpleYouTubeRequest =
        /^(?:please )?(?:group|organize|create (?:a )?(?:new )?group for) (?:all )?(?:my |the )?(?:youtube|youtu\.be)(?: links| tabs| videos)?$/;
    if (!simpleYouTubeRequest.test(normalizedInstruction)) return null;

    const tabIds = tabs
        .filter((tab) => {
            try {
                const hostname = new URL(tab.url).hostname.toLowerCase();
                return hostname === "youtube.com" || hostname.endsWith(".youtube.com") || hostname === "youtu.be";
            } catch {
                return false;
            }
        })
        .map((tab) => tab.id);
    if (tabIds.length === 0) return null;

    return {
        name: "YouTube",
        color: "red",
        tabIds,
    };
}
