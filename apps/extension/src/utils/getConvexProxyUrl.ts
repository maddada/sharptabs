const toSiteUrl = (url: string) => {
    if (url.includes(".convex.cloud")) {
        return url.replace(".convex.cloud", ".convex.site");
    }
    return url;
};

export const getConvexProxyUrl = (): string | undefined => {
    const publicConvexUrl = import.meta.env.VITE_PUBLIC_CONVEX_URL?.trim();
    if (publicConvexUrl) return publicConvexUrl;

    const convexUrl = import.meta.env.VITE_CONVEX_URL?.trim();
    if (convexUrl) return toSiteUrl(convexUrl);

    return undefined;
};
