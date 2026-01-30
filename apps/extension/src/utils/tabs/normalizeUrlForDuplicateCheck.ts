export function normalizeUrlForDuplicateCheck(url: string, strictDuplicateChecking: boolean = false): string {
    try {
        // Create URL object to parse the URL
        const urlObj = new URL(url);

        // Check if there's a 'url' parameter that contains an encoded URL
        const encodedUrl = urlObj.hostname.includes("sharptabs.com") && urlObj.searchParams.get("url");

        if (encodedUrl) {
            // Decode the URL parameter and use it for normalization
            const decodedUrl = decodeURIComponent(encodedUrl);
            try {
                // Try to parse the decoded URL
                const decodedUrlObj = new URL(decodedUrl);
                // Return the decoded URL without parameters
                return `${decodedUrlObj.protocol}//${decodedUrlObj.host}${decodedUrlObj.pathname}${decodedUrlObj.search}${decodedUrlObj.hash}`;
            } catch {
                // If the decoded URL is invalid, fall back to using the original URL
            }
        }

        // $$ SECTION Sites where query parameters are essential for identifying unique content
        const hostname = urlObj.hostname.toLowerCase();

        // YouTube videos and searches
        if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
            if (urlObj.pathname === "/watch" || urlObj.pathname === "/results" || urlObj.pathname.includes("/live/")) {
                return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
            }
        }

        // Search engines - queries are essential
        if (
            hostname.includes("google.com") ||
            hostname.includes("bing.com") ||
            hostname.includes("duckduckgo.com") ||
            hostname.includes("yahoo.com") ||
            hostname.includes("yandex.com") ||
            hostname.includes("baidu.com")
        ) {
            if (urlObj.pathname === "/search" || urlObj.pathname === "/results" || urlObj.searchParams.has("q") || urlObj.searchParams.has("query")) {
                return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
            }
        }

        // Social media searches and specific content
        if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
            if (urlObj.pathname === "/search" || urlObj.searchParams.has("q")) {
                return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
            }
        }

        if (hostname.includes("reddit.com")) {
            if (urlObj.pathname === "/search" || urlObj.searchParams.has("q")) {
                return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
            }
        }

        if (hostname.includes("testrail")) {
            return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}${urlObj.search}`;
        }

        // GitHub - specific files, commits, branches, issues
        if (hostname.includes("github.com")) {
            if (
                urlObj.searchParams.has("tab") ||
                urlObj.searchParams.has("q") ||
                urlObj.pathname.includes("/blob/") ||
                urlObj.pathname.includes("/tree/")
            ) {
                return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
            }
        }

        // Maps - coordinates and search queries are essential
        if (hostname.includes("maps.google.com") || hostname.includes("maps.apple.com")) {
            return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
        }

        // Streaming platforms
        if (hostname.includes("twitch.tv")) {
            if (urlObj.pathname.includes("/directory/") || urlObj.searchParams.has("q")) {
                return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
            }
        }

        // E-commerce with filters/searches
        if (hostname.includes("amazon.com") || hostname.includes("ebay.com") || hostname.includes("etsy.com") || hostname.includes("shopify.com")) {
            if (
                urlObj.pathname === "/s" ||
                urlObj.pathname.includes("/search") ||
                urlObj.searchParams.has("q") ||
                urlObj.searchParams.has("keywords")
            ) {
                return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
            }
        }

        // Other sites
        if (hostname.includes("mixpanel.com") || hostname.includes("shortpoint.testrail.io")) {
            return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
        }

        if (strictDuplicateChecking) {
            return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
        }

        return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    } catch {
        // If URL parsing fails, return the original URL
        // This handles cases like chrome:// URLs or other special URLs
        const questionMarkIndex = url.indexOf("?");
        if (questionMarkIndex !== -1) {
            return url.substring(0, questionMarkIndex);
        }
        return url;
    }
}
