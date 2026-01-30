import { describe, it, expect } from "vitest";
import { getTabTitle } from "@/utils/tabs/getTabTitle";
import type { Tab } from "@/types/Tab";

/**
 * Helper function to create a partial Tab object for testing
 */
const createTab = (overrides: Partial<Tab>): Tab => {
    return {
        id: 1,
        title: "",
        url: "",
        pinned: false,
        groupId: -1,
        index: 0,
        ...overrides,
    };
};

describe("getTabTitle", () => {
    describe("edge cases", () => {
        it("returns empty string for undefined tab", () => {
            expect(getTabTitle(undefined)).toBe("");
        });

        it("returns empty string for null tab (cast as undefined)", () => {
            expect(getTabTitle(undefined)).toBe("");
        });

        it("returns 'Loading...' for tab with empty title and empty URL", () => {
            const tab = createTab({ title: "", url: "" });
            expect(getTabTitle(tab)).toBe("Loading...");
        });

        it("returns 'Loading...' for tab with whitespace-only title and URL", () => {
            const tab = createTab({ title: "   ", url: "   " });
            expect(getTabTitle(tab)).toBe("Loading...");
        });
    });

    describe("special browser pages", () => {
        describe("Start Page detection", () => {
            it("returns 'Start Page' for Vivaldi start page (chrome://vivaldi-webui/startpage)", () => {
                const tab = createTab({
                    title: "Vivaldi Start Page",
                    url: "chrome://vivaldi-webui/startpage",
                });
                expect(getTabTitle(tab)).toBe("Start Page");
            });

            it("returns 'Start Page' for chrome://startpage URL", () => {
                const tab = createTab({
                    title: "Start Page",
                    url: "chrome://startpage",
                });
                expect(getTabTitle(tab)).toBe("Start Page");
            });

            it("returns 'Start Page' when title starts with chrome://startpage", () => {
                const tab = createTab({
                    title: "chrome://startpage - Browser",
                    url: "about:blank",
                });
                expect(getTabTitle(tab)).toBe("Start Page");
            });

            it("returns 'Start Page' for vivaldi://vivaldi-webui/startpage URL", () => {
                const tab = createTab({
                    title: "Start",
                    url: "vivaldi://vivaldi-webui/startpage",
                });
                expect(getTabTitle(tab)).toBe("Start Page");
            });

            it("returns 'Start Page' for URL containing vivaldi://vivaldi-webui/startpage", () => {
                const tab = createTab({
                    title: "Start",
                    url: "vivaldi://vivaldi-webui/startpage?param=value",
                });
                expect(getTabTitle(tab)).toBe("Start Page");
            });
        });

        describe("Settings page detection", () => {
            it("returns 'Settings' for chrome://settings/", () => {
                const tab = createTab({
                    title: "Settings - Appearance",
                    url: "chrome://settings.html",
                });
                expect(getTabTitle(tab)).toBe("Settings");
            });

            it("returns 'Settings' for any URL containing /settings.html", () => {
                const tab = createTab({
                    title: "Browser Settings",
                    url: "chrome-extension://abc123/settings.html",
                });
                expect(getTabTitle(tab)).toBe("Settings");
            });

            it("returns 'Settings' for vivaldi://settings.html", () => {
                const tab = createTab({
                    title: "Vivaldi Settings",
                    url: "vivaldi://settings.html",
                });
                expect(getTabTitle(tab)).toBe("Settings");
            });
        });

        describe("New Tab page detection", () => {
            it("returns 'New Tab' for chrome://new-tab-page", () => {
                const tab = createTab({
                    title: "",
                    url: "chrome://new-tab-page",
                });
                expect(getTabTitle(tab)).toBe("New Tab");
            });

            it("returns 'New Tab' for URL containing ://newtab", () => {
                const tab = createTab({
                    title: "",
                    url: "chrome://newtab",
                });
                expect(getTabTitle(tab)).toBe("New Tab");
            });

            it("returns 'New Tab' for about:newtab", () => {
                const tab = createTab({
                    title: "",
                    url: "about:newtab",
                });
                expect(getTabTitle(tab)).toBe("New Tab");
            });

            it("returns 'New Tab' for edge://newtab", () => {
                const tab = createTab({
                    title: "",
                    url: "edge://newtab",
                });
                expect(getTabTitle(tab)).toBe("New Tab");
            });
        });
    });

    describe("title cleaning", () => {
        it("returns tab title as-is when no special characters are present", () => {
            const tab = createTab({
                title: "GitHub - Homepage",
                url: "https://github.com",
            });
            expect(getTabTitle(tab)).toBe("GitHub - Homepage");
        });

        it("removes bullet indicator (•) from title", () => {
            const tab = createTab({
                title: "• Slack - Team Communication",
                url: "https://slack.com",
            });
            expect(getTabTitle(tab)).toBe("Slack - Team Communication");
        });

        it("removes unread count badge with single digit", () => {
            const tab = createTab({
                title: "(5) Inbox - Gmail",
                url: "https://mail.google.com",
            });
            expect(getTabTitle(tab)).toBe("Inbox - Gmail");
        });

        it("removes unread count badge with multiple digits", () => {
            const tab = createTab({
                title: "(123) Messages - Discord",
                url: "https://discord.com",
            });
            expect(getTabTitle(tab)).toBe("Messages - Discord");
        });

        it("removes unread count badge with plus sign", () => {
            const tab = createTab({
                title: "(99+) Notifications - Twitter",
                url: "https://twitter.com",
            });
            expect(getTabTitle(tab)).toBe("Notifications - Twitter");
        });

        it("removes both bullet and unread count if present (edge case)", () => {
            const tab = createTab({
                title: "• (10) New Messages",
                url: "https://example.com",
            });
            // First removes bullet, then removes count
            expect(getTabTitle(tab)).toBe("New Messages");
        });

        it("trims whitespace from title", () => {
            const tab = createTab({
                title: "   Padded Title   ",
                url: "https://example.com",
            });
            expect(getTabTitle(tab)).toBe("Padded Title");
        });

        it("handles title with only spaces after cleaning (falls back to URL)", () => {
            const tab = createTab({
                title: "• ",
                url: "https://example.com",
            });
            expect(getTabTitle(tab)).toBe("https://example.com");
        });
    });

    describe("URL fallback", () => {
        it("returns URL when title is empty", () => {
            const tab = createTab({
                title: "",
                url: "https://example.com/page",
            });
            expect(getTabTitle(tab)).toBe("https://example.com/page");
        });

        it("returns URL when title is only whitespace", () => {
            const tab = createTab({
                title: "   ",
                url: "https://example.com/page",
            });
            expect(getTabTitle(tab)).toBe("https://example.com/page");
        });

        it("trims whitespace from URL when used as fallback", () => {
            const tab = createTab({
                title: "",
                url: "  https://example.com  ",
            });
            expect(getTabTitle(tab)).toBe("https://example.com");
        });
    });

    describe("loading state", () => {
        it("returns 'Loading...' when both title and URL are empty", () => {
            const tab = createTab({
                title: "",
                url: "",
            });
            expect(getTabTitle(tab)).toBe("Loading...");
        });

        it("returns 'Loading...' when both title and URL are whitespace", () => {
            const tab = createTab({
                title: "   ",
                url: "   ",
            });
            expect(getTabTitle(tab)).toBe("Loading...");
        });

        it("returns 'Loading...' when title is null and URL is empty", () => {
            const tab = createTab({
                title: null as any,
                url: "",
            });
            expect(getTabTitle(tab)).toBe("Loading...");
        });
    });

    describe("real-world scenarios", () => {
        it("handles Gmail tab with unread count", () => {
            const tab = createTab({
                title: "(15) Inbox - user@gmail.com - Gmail",
                url: "https://mail.google.com/mail/u/0/#inbox",
            });
            expect(getTabTitle(tab)).toBe("Inbox - user@gmail.com - Gmail");
        });

        it("handles Slack with bullet indicator", () => {
            const tab = createTab({
                title: "• general - My Workspace | Slack",
                url: "https://app.slack.com/client/T123/C456",
            });
            expect(getTabTitle(tab)).toBe("general - My Workspace | Slack");
        });

        it("handles Discord with high unread count", () => {
            const tab = createTab({
                title: "(99+) Discord | #general",
                url: "https://discord.com/channels/123/456",
            });
            expect(getTabTitle(tab)).toBe("Discord | #general");
        });

        it("handles GitHub repository page", () => {
            const tab = createTab({
                title: "anthropics/claude-code: Official CLI for Claude",
                url: "https://github.com/anthropics/claude-code",
            });
            expect(getTabTitle(tab)).toBe("anthropics/claude-code: Official CLI for Claude");
        });

        it("handles YouTube video", () => {
            const tab = createTab({
                title: "How to Build Chrome Extensions - YouTube",
                url: "https://www.youtube.com/watch?v=abc123",
            });
            expect(getTabTitle(tab)).toBe("How to Build Chrome Extensions - YouTube");
        });

        it("handles suspended/parked tab with restore URL", () => {
            const tab = createTab({
                title: "Suspended Tab",
                url: "chrome-extension://xyz/park.html?title=Original%20Title",
            });
            expect(getTabTitle(tab)).toBe("Suspended Tab");
        });

        it("handles data URL (edge case)", () => {
            const tab = createTab({
                title: "",
                url: "data:text/html,<h1>Hello</h1>",
            });
            expect(getTabTitle(tab)).toBe("data:text/html,<h1>Hello</h1>");
        });

        it("handles blob URL (edge case)", () => {
            const tab = createTab({
                title: "Document",
                url: "blob:https://example.com/abc-123",
            });
            expect(getTabTitle(tab)).toBe("Document");
        });

        it("handles file:// protocol", () => {
            const tab = createTab({
                title: "",
                url: "file:///Users/user/documents/file.html",
            });
            expect(getTabTitle(tab)).toBe("file:///Users/user/documents/file.html");
        });
    });

    describe("priority order", () => {
        it("prioritizes start page detection over title cleaning", () => {
            const tab = createTab({
                title: "(5) chrome://startpage",
                url: "chrome://startpage",
            });
            // Should return "Start Page" not cleaned title
            expect(getTabTitle(tab)).toBe("Start Page");
        });

        it("prioritizes settings detection over title", () => {
            const tab = createTab({
                title: "(10) Browser Settings",
                url: "chrome://settings.html",
            });
            expect(getTabTitle(tab)).toBe("Settings");
        });

        it("prioritizes new tab detection over URL fallback", () => {
            const tab = createTab({
                title: "",
                url: "chrome://new-tab-page",
            });
            expect(getTabTitle(tab)).toBe("New Tab");
        });

        it("uses title before falling back to URL", () => {
            const tab = createTab({
                title: "Page Title",
                url: "https://example.com",
            });
            expect(getTabTitle(tab)).toBe("Page Title");
        });

        it("uses URL before 'Loading...'", () => {
            const tab = createTab({
                title: "",
                url: "https://example.com",
            });
            expect(getTabTitle(tab)).toBe("https://example.com");
        });
    });
});
