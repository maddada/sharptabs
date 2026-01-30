import { Tab } from "@/types/Tab";
import { isSpecialBrowserTab } from "./isSpecialBrowserTab";

// Helper function to get favicon URL with multiple fallback methods
export const getFaviconUrl = (tab: Tab, shouldEncode: boolean = false): string => {
    let faviconUrl: string;

    if (tab.url.includes("anthropic.com")) {
        faviconUrl = "https://sharptabs.com/anthropic.ico";
    }

    // Keep existing logic - if we have a valid favicon URL, use it
    if (tab.favIconUrl && tab.favIconUrl.length < 30000 && !tab.url.startsWith("https://mail.google.com")) {
        faviconUrl = tab.favIconUrl;
    }
    // Keep existing Gmail special case
    else if (tab.url.startsWith("https://mail.google.com")) {
        faviconUrl = "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico";
    }
    // New improved fallback logic
    else if (!(tab.url === "about:blank" || isSpecialBrowserTab(tab))) {
        let url = tab.url;

        // Only proceed if we have a valid HTTPS URL
        if (url.startsWith("https://")) {
            const parts = url.split("/");
            let hostname = parts[2];

            // Extract the main domain from subdomain
            const domainParts = hostname.split(".");
            if (domainParts.length > 2) {
                // Take the last two parts (domain.tld)
                hostname = domainParts.slice(-2).join(".");
            }

            url = parts[0] + "//" + hostname;

            // Use Google's favicon service if we have a valid URL and it's not localhost
            if (url !== null && typeof url === "string" && url.trim() !== "" && !url.startsWith("http://127.0.0.1")) {
                faviconUrl = `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url}&size=16`;
            } else {
                faviconUrl = "/icons/file.svg";
            }
        } else {
            faviconUrl = "/icons/file.svg";
        }
    } else if (tab.url.startsWith("chrome-extension://ooagakphldicpdeamgchdkpfbehcdjjk")) {
        faviconUrl = "/icons/file.svg";
    }
    // Final fallback to default Sharp Tabs icon
    else {
        faviconUrl = "/icons/file.svg";
    }

    return shouldEncode ? encodeURIComponent(faviconUrl) : faviconUrl;
};
