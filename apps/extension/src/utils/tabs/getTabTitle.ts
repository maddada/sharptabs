import { Tab } from "@/types/Tab";
import { isNewTab } from "./isNewTab";

/**
 * Extracts a human-readable title from a tab.
 * Handles special browser pages (start pages, settings, new tabs) and cleans up tab titles
 * by removing notification indicators and unread count badges.
 *
 * @param tab - The tab object to extract the title from
 * @returns A cleaned, human-readable title string
 *
 * @example
 * getTabTitle({ title: "(5) Inbox - Gmail", url: "https://mail.google.com" })
 * Returns: "Inbox - Gmail"
 *
 * @example
 * getTabTitle({ title: "", url: "chrome://new-tab-page" })
 * Returns: "New Tab"
 */
export function getTabTitle(tab?: Tab): string {
    if (!tab) return "";

    if (
        tab.url?.includes("chrome://vivaldi-webui/startpage?section=history") ||
        tab.url?.includes("vivaldi://history") ||
        tab.url?.includes("vivaldi:history")
    ) {
        return "History";
    }

    if (
        tab.url?.includes("chrome://vivaldi-webui/startpage?section=bookmarks") ||
        tab.url?.includes("vivaldi://bookmarks") ||
        tab.url?.includes("vivaldi:bookmarks")
    ) {
        return "Bookmarks";
    }

    // Handle Vivaldi start pages
    if (
        tab.url?.startsWith("chrome://vivaldi-webui/startpage") ||
        tab.url?.startsWith("chrome://startpage") ||
        tab.title?.startsWith("chrome://startpage") ||
        tab.url?.includes("vivaldi://vivaldi-webui/startpage")
    ) {
        return "Start Page";
    }

    // Handle settings pages
    if (tab.url?.includes("/settings.html")) {
        return "Settings";
    }

    // Handle new tab pages
    if (tab.url && isNewTab(tab as chrome.tabs.Tab)) {
        return "New Tab";
    }

    // Use tab title if available, cleaning up notification indicators
    if (tab.title !== null && tab.title?.trim() !== "") {
        const cleaned = tab.title
            .trim()
            .replace(/^•\s*/, "") // Remove bullet indicator with optional space
            .replace(/^\(\d+\+?\)\s*/, ""); // Remove unread count badges like "(5) " or "(10+) "

        // If cleaning left us with an empty string, fall through to URL
        if (cleaned.trim() !== "") {
            return cleaned;
        }
    }

    // Fall back to URL if no title is available
    if (tab?.url !== null && tab?.url?.trim() !== "") {
        return tab.url.trim();
    }

    // Default for tabs that are still loading
    return "Loading...";
}
