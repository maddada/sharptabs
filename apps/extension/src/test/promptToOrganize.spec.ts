import { describe, expect, it } from "vitest";
import { getSchemaAndPromptSuffix, organizeTabsSchema, PROMPT_TO_ORGANIZE_MAX_LENGTH, promptOrganizingPrompt } from "@packages/shared/gemini-config";
import { getPromptToOrganizePrompt } from "@/utils/tabs/getGroupingPrompts";
import { getPromptOrganizationFallback } from "@/utils/tabs/getPromptOrganizationFallback";

describe("Prompt to organize", () => {
    it("uses structured group output and leaves unrelated tabs out", () => {
        const result = getSchemaAndPromptSuffix("promptOrganize", "ignored");

        expect(result.schema).toBe(organizeTabsSchema);
        expect(result.promptSuffix).toBe(promptOrganizingPrompt);
        expect(result.promptSuffix).toContain("Leave unrelated tabs out of the response");
    });

    it("limits the user instruction and serializes tab data as valid JSON", () => {
        const instruction = `Group YouTube tabs ${"x".repeat(PROMPT_TO_ORGANIZE_MAX_LENGTH)}`;
        const tabs = [
            {
                id: 42,
                title: 'A "quoted" title',
                url: "https://youtube.com/watch?v=abc&list=123",
            },
        ];

        const prompt = getPromptToOrganizePrompt(tabs, instruction);
        const instructionMatch = prompt.match(/<user_instruction>\s*([\s\S]*?)\s*<\/user_instruction>/);
        const tabsMatch = prompt.match(/<tabs_list>\s*([\s\S]*?)\s*<\/tabs_list>/);

        expect(instructionMatch?.[1].trim()).toHaveLength(PROMPT_TO_ORGANIZE_MAX_LENGTH);
        expect(JSON.parse(tabsMatch?.[1].trim() ?? "")).toEqual(tabs);
        expect(prompt).toContain('{"groups":[{"name":"Group name","color":"red","tabIds":[123]}]}');
    });

    it("locally matches YouTube tabs when the AI returns no groups", () => {
        const tabs = [
            { id: 1, title: "A video", url: "https://www.youtube.com/watch?v=abc" },
            { id: 2, title: "A short video", url: "https://youtu.be/xyz" },
            { id: 3, title: "Inbox", url: "https://mail.google.com/" },
        ];

        expect(getPromptOrganizationFallback(tabs, "group youtube links")).toEqual({
            name: "YouTube",
            color: "red",
            tabIds: [1, 2],
        });
    });

    it("matches actual YouTube hosts, not mentions or lookalike domains", () => {
        const tabs = [
            { id: 1, title: "Music", url: "https://music.youtube.com/" },
            { id: 2, title: "YouTube news", url: "https://example.com/youtube.com" },
            { id: 3, title: "YouTube", url: "https://youtube.com.example.com/" },
        ];
        expect(getPromptOrganizationFallback(tabs, "Create a new group for all YouTube links")?.tabIds).toEqual([1]);
    });

    it.each([
        "group youtube links except music",
        "do not group youtube links",
        "group youtube coding videos",
        "group youtube links into Learning",
        "group everything except youtube",
    ])("does not override the AI's interpretation of %s", (instruction) => {
        const tabs = [{ id: 1, title: "Music on YouTube", url: "https://youtube.com/" }];
        expect(getPromptOrganizationFallback(tabs, instruction)).toBeNull();
    });
});
