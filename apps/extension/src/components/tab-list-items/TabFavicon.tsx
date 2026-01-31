import { LoadingSpinner } from "@/icons/LoadingSpinner";
import { Settings } from "@/types/Settings";
import { Tab } from "@/types/Tab";
import { cn } from "@/utils/cn";
import { getFaviconUrl } from "@/utils/tabs/getFaviconUrl";
import { isNewTab } from "@/utils/tabs/isNewTab";
import { PanelTop } from "lucide-react";
import { TabItemState } from "./TabItem";

function faviconURL(u: string) {
    const url = new URL(chrome.runtime.getURL("/_favicon/"));
    url.searchParams.set("pageUrl", u);
    url.searchParams.set("size", "32");
    return url.toString();
}

export const TabFavicon = ({ tabState, tab, settings }: { tabState: TabItemState; tab: Tab; settings: Partial<Settings> }) => {
    // Debug logging for the specific problematic tab
    if (tab?.url?.includes("settings.html")) {
        console.log("DEBUG TabIcon - Settings tab:", {
            tabId: tab.id,
            tabStateIsLoading: tabState.isLoading,
            tabStatus: tab.status,
            favIconUrl: tab.favIconUrl,
            iconError: tabState.iconError,
        });
    }

    // Early return if tab is undefined
    if (!tab) {
        return (
            <div
                style={{
                    backgroundColor: settings?.backgroundForTabFavicon ? (settings?.faviconBackgroundColor ?? undefined) : undefined,
                }}
                className={cn(
                    "flex h-full w-full select-none items-center justify-center justify-self-start",
                    settings?.backgroundForTabFavicon ? `rounded-md` : ""
                )}
            >
                <PanelTop
                    fill={settings?.themeType === "dark" ? "#fafafa20" : "#fafafa20"}
                    strokeWidth={2}
                    style={{ filter: settings?.shadowForTabFavicon ? `drop-shadow( 1px 1px 1px ${settings?.shadowColor})` : "" }}
                />
            </div>
        );
    }

    // Always use Discord's favicon for discord.com domains
    if (tab.url) {
        try {
            const url = new URL(tab.url);
            if (url.hostname === "discord.com" || url.hostname.endsWith(".discord.com")) {
                return (
                    <div
                        style={{
                            backgroundColor: settings?.backgroundForTabFavicon ? (settings?.faviconBackgroundColor ?? undefined) : undefined,
                        }}
                        className={cn(
                            "tab-favicon flex w-4 h-4 select-none items-center justify-center justify-self-start",
                            settings?.backgroundForTabFavicon ? `rounded-md` : ""
                        )}
                    >
                        <img
                            src="https://discord.com/assets/favicon.ico"
                            alt=""
                            style={{ filter: settings?.shadowForTabFavicon ? `drop-shadow( 1px 1px 1px ${settings?.shadowColor})` : "" }}
                            className="h-full w-full"
                        />
                    </div>
                );
            }
        } catch (e) {
            // Invalid URL, continue with normal logic
        }
    }

    // Show loading spinner only if tab is actually loading AND doesn't have a favicon yet
    if ((tabState.isLoading || tab.status === "loading") && (!tab.favIconUrl || tab.favIconUrl.trim() === ""))
        return (
            <div className="flex h-full w-full select-none items-center justify-center justify-self-start">
                <LoadingSpinner />
            </div>
        );

    if (isNewTab(tab as chrome.tabs.Tab) && tab?.title !== "Sharp Tabs Search") {
        return (
            <div
                style={{
                    backgroundColor: settings?.backgroundForTabFavicon ? (settings?.faviconBackgroundColor ?? undefined) : undefined,
                }}
                className={cn(
                    "flex h-full w-full select-none items-center justify-center justify-self-start",
                    settings?.backgroundForTabFavicon ? `rounded-md` : ""
                )}
            >
                <PanelTop
                    fill={settings?.themeType === "dark" ? "#fafafa20" : "#fafafa20"}
                    strokeWidth={2}
                    style={{ filter: settings?.shadowForTabFavicon ? `drop-shadow( 1px 1px 1px ${settings?.shadowColor})` : "" }}
                />
            </div>
        );
    }

    // If there's an error or no favicon
    const faviconUrl = getFaviconUrl(tab, false);
    if (tabState.iconError || !tab.favIconUrl || tab.favIconUrl.trim() === "" || faviconUrl.trim() === "") {
        // Use the utility function to get favicon URL
        const fallbackFaviconUrl = faviconUrl;

        // If we got a valid favicon URL from the utility function, use it
        if (fallbackFaviconUrl !== "/icons/file.svg") {
            return (
                <div className="flex h-full min-w-full select-none items-center justify-center justify-self-start">
                    <img src={fallbackFaviconUrl} alt="" className="h-full w-full" />
                </div>
            );
        }

        return (
            <div
                style={{
                    backgroundColor: settings?.backgroundForTabFavicon ? (settings?.faviconBackgroundColor ?? undefined) : undefined,
                }}
                className={cn(
                    "flex h-full min-w-full select-none items-center justify-center justify-self-start",
                    settings?.backgroundForTabFavicon ? `rounded-md` : ""
                )}
            >
                <img
                    src="/icons/file.svg"
                    alt=""
                    style={{ filter: settings?.shadowForTabFavicon ? `drop-shadow( 1px 1px 1px ${settings?.shadowColor})` : "" }}
                    className="h-full w-full"
                />
            </div>
        );
    }

    return (
        <div
            style={{
                backgroundColor: settings?.backgroundForTabFavicon ? (settings?.faviconBackgroundColor ?? undefined) : undefined,
            }}
            className={cn(
                "tab-favicon flex w-4 h-4 select-none items-center justify-center justify-self-start",
                settings?.backgroundForTabFavicon ? `rounded-md` : ""
            )}
        >
            <img
                src={faviconURL(tab.url)}
                alt=""
                style={{ filter: settings?.shadowForTabFavicon ? `drop-shadow( 1px 1px 1px ${settings?.shadowColor})` : "" }}
                className="h-full w-full"
            />
        </div>
    );
};
