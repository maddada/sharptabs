import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { useAuthStore } from "./authStore";
import { isConvexAvailable } from "@/utils/convex";

export type PremiumStatus = {
    isPremium: boolean;
    hasActiveSubscription: boolean;
    subscriptionStatus: string;
    loading: boolean;
};

/**
 * Premium status hook that checks for active subscription or lifetime license
 */
export function usePremiumStatus(): PremiumStatus {
    const user = useAuthStore((state) => state.user);

    // Skip queries if convex is not properly configured or user is not logged in
    const shouldSkip = !isConvexAvailable || !user?.uid;

    // Query backend for subscription status
    const subscriptionData = useQuery(api.stripe.getSubscriptionStatusByAuthId, shouldSkip ? "skip" : { authId: user.uid });

    const loading = subscriptionData === undefined;

    if (loading || !user) {
        return {
            isPremium: false,
            hasActiveSubscription: false,
            subscriptionStatus: "none",
            loading: true,
        };
    }

    // Check if user has an active subscription
    const hasActiveSubscription =
        subscriptionData?.hasSubscription && subscriptionData?.status === "active" && (subscriptionData?.currentPeriodEnd || 0) > Date.now() / 1000;

    // Check if user has lifetime license
    const hasLifetimeLicense = subscriptionData?.hasLifetimeLicense === true;

    // Premium status is true if: active subscription OR lifetime license
    const isPremium = hasActiveSubscription || hasLifetimeLicense;

    return {
        isPremium,
        hasActiveSubscription,
        subscriptionStatus: subscriptionData?.status || "none",
        loading: false,
    };
}
