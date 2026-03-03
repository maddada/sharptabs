import { ConvexReactClient } from "convex/react";

const configuredConvexUrl = (import.meta.env.VITE_CONVEX_URL || import.meta.env.VITE_PUBLIC_CONVEX_URL) as string | undefined;
const fallbackConvexUrl = "https://placeholder-deployment-123.convex.cloud";

// Flag to track if Convex is properly configured
export const isConvexAvailable = Boolean(configuredConvexUrl);

// Initialize Convex client
// Use a placeholder URL when not configured to avoid crashes from hooks that require ConvexProvider
// The placeholder client won't actually connect, but allows the app to render
let convex: ConvexReactClient;

if (configuredConvexUrl) {
    try {
        convex = new ConvexReactClient(configuredConvexUrl);
    } catch (error) {
        console.warn("[Convex] Failed to initialize Convex client:", error);
        // Fallback to placeholder - queries will fail but app won't crash
        convex = new ConvexReactClient(fallbackConvexUrl);
    }
} else {
    console.warn("[Convex] Missing VITE_CONVEX_URL and VITE_PUBLIC_CONVEX_URL. Backend features will be disabled.");
    // Use placeholder URL to create a non-functional client that won't crash the app
    convex = new ConvexReactClient(fallbackConvexUrl);
}

export { convex };
