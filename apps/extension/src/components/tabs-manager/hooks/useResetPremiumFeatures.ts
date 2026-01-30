import { useSettingsStore } from "@/stores/settingsStore";
import { useEffect, useRef } from "react";
import { Settings } from "@/types/Settings";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

export function useResetPremiumFeatures(loading: boolean, isPremium: boolean, settings: Settings) {
    const { updateSettings } = useSettingsStore();
    const user = useAuthStore((state) => state.user);
    const authLoading = useAuthStore((state) => state.loading);

    // Only AI features are premium-gated
    // Non-AI settings are free for all users
    const aiFeaturesRef = useRef(["aiAutoOrganizeTabs", "aiAutoGroupNaming", "aiAutoCleaner"] as const);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        // Don't run during any loading states to avoid premature resets
        if (loading || authLoading) return;

        const checkAndResetAIFeatures = () => {
            // Check if user has their own Gemini API key - if so, they can use AI features
            const hasOwnApiKey = Boolean(settings.geminiApiKey);

            // Skip reset if user has their own API key
            if (hasOwnApiKey) return;

            // Check if any AI features are enabled
            const hasEnabledAIFeatures = aiFeaturesRef.current.some((feature) => {
                return Boolean(settings[feature]);
            });

            // Only reset if:
            // 1. User is not premium (not during loading)
            // 2. User has AI features enabled
            // 3. Either user is not logged in OR logged in but confirmed not premium
            const shouldReset = !isPremium && hasEnabledAIFeatures && !loading && !authLoading;

            if (shouldReset) {
                // Only reset AI features - non-AI settings are free
                updateSettings({
                    aiAutoOrganizeTabs: false,
                    aiAutoGroupNaming: false,
                    aiAutoCleaner: false,
                });

                toast.error("Disabling AI features (premium required or use your own API key)");

                console.log("AI features require premium or own API key. Resetting these settings.");
            }

            // Schedule next check with random interval
            const randomInterval = Math.random() * (19421 - 9421) + 9940;
            timeoutId = setTimeout(checkAndResetAIFeatures, randomInterval);
        };

        // Call the function initially
        checkAndResetAIFeatures();

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [isPremium, loading, authLoading, settings, updateSettings, user]);
}
