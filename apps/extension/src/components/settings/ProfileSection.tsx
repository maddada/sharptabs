import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/icons/LoadingSpinner";
import { useAuthStore } from "@/stores/authStore";
import { convex, isConvexAvailable } from "@/utils/convex";
import { auth } from "@/utils/firebase";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { getAdditionalUserInfo, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth/web-extension";
import {
    AlertTriangle,
    CheckCircle2,
    Crown,
    ExternalLink,
    Gem,
    LogOut,
    Sparkles,
    User,
} from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";
import { toast } from "sonner";

type ProfileSectionProps = {
    user: any;
    loading: boolean;
    error: any;
};

type SubscriptionData = {
    hasSubscription: boolean;
    hasLifetimeLicense?: boolean;
    status: string;
    subscriptionId?: string;
    priceId?: string;
    currentPeriodStart?: number;
    currentPeriodEnd?: number;
    cancelAtPeriodEnd?: boolean;
    paymentMethod?: {
        brand?: string;
        last4?: string;
    };
    lifetimeLicense?: {
        platform?: string;
        purchaseDate?: number;
        orderId?: string;
    };
    user: {
        email: string;
        id: string;
    };
};

/*
    Steps for magic link sign in for SharpTabs extension are:
    - Send email to user
    - User clicks on link
    - Takes them to [sharptabs.com](http://sharptabs.com)/email-login
    - This page sends message to service worker through the content script
    - service worker opens the extension page with the sign in apitoken and oobCode added in the parameters
    - useEffect on settings checks if it's a firebase sign in link then logs user in based on email in localstorage
*/

export function ProfileSection({ loading, error }: ProfileSectionProps) {
    const { actions } = useAuthStore();
    const user = useAuthStore((s) => s.user);
    const [isWaitingForAuth, setIsWaitingForAuth] = useState(false);
    const shouldSkipSubscriptionQuery = !isConvexAvailable || !user?.uid;

    // Fetch subscription status from Convex
    const subscriptionData = useQuery(
        api.stripe.getSubscriptionStatusByAuthId,
        shouldSkipSubscriptionQuery ? "skip" : { authId: user.uid }
    ) as
        | SubscriptionData
        | undefined;

    const handleSignInOnWebsite = () => {
        // Set waiting state to show progress
        setIsWaitingForAuth(true);

        // Open the website profile page with extension parameter for auto-login detection
        window.open("https://sharptabs.com/profile?from=extension", "_blank");

        // Clear waiting state after 30 seconds (fallback)
        setTimeout(() => {
            setIsWaitingForAuth(false);
        }, 30000);
    };

    const handleAuthCompletionEvent = useEffectEvent(() => {
        setTimeout(() => {
            if (useAuthStore.getState().user?.email?.includes("@")) return;

            // Skip if auth is not available
            if (!auth) {
                console.warn("[ProfileSection] Firebase auth not available - skipping email link sign-in check");
                return;
            }

            // Confirm the current page url is a sign-in with email link (has apikey and oobCode)
            if (isSignInWithEmailLink(auth, window.location.href)) {
                const email = window.localStorage.getItem("emailForSignIn");
                if (!email && !user?.email) {
                    window.location.href = "/settings.html";
                    return;
                }

                // The client SDK will parse the code from the link for you.
                signInWithEmailLink(auth, email || "", window.location.href)
                    .then(async (result) => {
                        window.localStorage.removeItem("emailForSignIn");

                        toast.success("Signed in successfully");
                        actions.setUser(result.user);

                        const additionalUserInfo = getAdditionalUserInfo(result);
                        actions.setAdditionalUserInfo(additionalUserInfo);

                        // Create/update user in Convex (only if convex is available)
                        const hasValidUserData = result.user.uid && result.user.email;
                        if (hasValidUserData && isConvexAvailable) {
                            try {
                                await convex.mutation(api.users.handleUserCreationOrLogin, {
                                    auth_id: result.user.uid,
                                    email: result.user.email!,
                                    email_verified: result.user.emailVerified,
                                    auth_provider: "email",
                                });
                            } catch (error) {
                                console.log("Error creating/updating user in Convex:", error);
                            }
                        }

                        setTimeout(() => {
                            const url = new URL(window.location.href);
                            window.location.href = `${url.origin}${url.pathname}`;
                        }, 100);
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            }
        }, 500);
    });

    useEffect(() => {
        handleAuthCompletionEvent();
    }, []);

    // Listen for auth completion via storage changes (from cross-platform auth)
    useEffect(() => {
        const handleStorageChange = async (changes: { [key: string]: chrome.storage.StorageChange }) => {
            if (changes.googleAuthCompleted && changes.googleAuthCompleted.newValue === true) {
                // Clear waiting state immediately when auth completes
                setIsWaitingForAuth(false);

                try {
                    const result = await chrome.storage.local.get(["googleAuthData", "googleAuthError"]);
                    await chrome.storage.local.remove(["googleAuthCompleted", "googleAuthError"]);

                    // Extract conditions outside try/catch for React Compiler optimization
                    const hasAuthError = result.googleAuthError;
                    const hasAuthData = result.googleAuthData;

                    if (hasAuthError) {
                        toast.error("Sign-in failed. Please try again.");
                        return;
                    }

                    if (hasAuthData) {
                        const userData = result.googleAuthData.user || result.googleAuthData;
                        const authId = userData.uid || userData.id || userData.sub;
                        const email = userData.email;
                        const emailVerified = userData.emailVerified || userData.email_verified || false;
                        const displayName = userData.displayName || userData.name || userData.given_name;
                        const photoURL = userData.photoURL || userData.picture;

                        actions.setUser(userData);
                        actions.setAdditionalUserInfo(result.googleAuthData.additionalUserInfo);

                        // Enhanced success message for auto-login vs manual login
                        const wasAutoLogin = result.googleAuthData.customTokenUsed;
                        toast.success(wasAutoLogin ? "Auto-signed in from website!" : "Signed in successfully!");

                        // Create/update user in Convex (only if convex is available)
                        const hasValidAuthData = authId && email;
                        if (hasValidAuthData && isConvexAvailable) {
                            try {
                                await convex.mutation(api.users.handleUserCreationOrLogin, {
                                    auth_id: authId,
                                    email: email!,
                                    email_verified: emailVerified,
                                    display_name: displayName || undefined,
                                    photo_url: photoURL || undefined,
                                    auth_provider: result.googleAuthData.customTokenUsed ? "website" : "google",
                                });
                            } catch (convexError) {
                                console.error("Convex mutation error:", convexError);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error processing auth completion:", error);
                    toast.error("Error processing authentication result");
                    setIsWaitingForAuth(false);
                }
            }
        };

        chrome.storage.onChanged.addListener(handleStorageChange);
        return () => chrome.storage.onChanged.removeListener(handleStorageChange);
    }, [actions]);

    const getSubscriptionStatusDisplay = () => {
        if (!subscriptionData) {
            if (!shouldSkipSubscriptionQuery) {
                return {
                    title: "Loading...",
                    description: "",
                    icon: "🔄",
                    bgColor: "bg-neutral-100 dark:bg-neutral-900/30",
                    textColor: "text-neutral-900 dark:text-neutral-100",
                };
            }

            return {
                title: "Free",
                description: "Every feature is free. Subscribe only to use AI features without your own API key.",
                icon: "⚠️",
                bgColor: "bg-neutral-100 dark:bg-neutral-900/30",
                textColor: "text-neutral-900 dark:text-neutral-100",
            };
        }

        // Check if user has active subscription
        if (subscriptionData.hasSubscription && subscriptionData.status === "active") {
            const renewalDate = subscriptionData.currentPeriodEnd
                ? new Date(subscriptionData.currentPeriodEnd * 1000).toISOString().split("T")[0]
                : null;

            return {
                title: "AI Subscription Active",
                description: renewalDate
                    ? `Renews on ${renewalDate}${subscriptionData.cancelAtPeriodEnd ? " (Cancels at period end)" : ""}`
                    : "Active subscription",
                icon: "✅",
                bgColor: "bg-green-100 dark:bg-green-900/30",
                textColor: "text-green-900 dark:text-green-100",
            };
        }

        // Check if user has lifetime license
        if (subscriptionData.hasLifetimeLicense && subscriptionData.status === "lifetime") {
            const purchaseDate = subscriptionData.lifetimeLicense?.purchaseDate
                ? new Date(subscriptionData.lifetimeLicense.purchaseDate * 1000).toISOString().split("T")[0]
                : null;

            return {
                title: "Lifetime License Active",
                description: purchaseDate
                    ? `Purchased on ${purchaseDate} | Thank you for supporting Sharp Tabs!`
                    : "Lifetime access to AI features",
                icon: "💎",
                bgColor: "bg-green-100/10 dark:bg-green-800/30",
                textColor: "text-green-900 dark:text-green-100",
            };
        }

        // Default free plan
        return {
            title: "Free",
            description: "Every feature is free. Subscribe only to use AI features without your own API key.",
            icon: "⚠️",
            bgColor: "bg-neutral-100 dark:bg-neutral-900/30",
            textColor: "text-neutral-900 dark:text-neutral-100",
        };
    };

    const statusDisplay = getSubscriptionStatusDisplay();

    return (
        <section id="profile" className="scroll-mt-24 rounded-2xl border border-primary/30 bg-muted/40 p-6 shadow-2xl">
            <div className="relative">
                <h2 className="mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-xl font-bold text-transparent">Profile</h2>

                <div className="flex flex-col gap-4 rounded-xl">
                    {loading && (
                        <div className="flex min-h-[80px] items-center justify-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                        </div>
                    )}
                    {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-red-300">Error: {error.message}</div>}

                    {/* Signed In User */}
                    {!loading && user && (
                        <>
                            {/* User Info Card */}
                            <div className="group relative overflow-hidden rounded-xl border border-primary/20 bg-primary/10 p-4 transition-all duration-300 hover:scale-[1.005]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg">
                                            <User className="h-6 w-6" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="text-sm font-semibold text-white">Logged in as</div>
                                            <div className="text-sm text-gray-300">{user.email}</div>
                                        </div>
                                    </div>
                                    <Button onClick={actions.logout} className="shadow-md" variant="default">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Logout
                                    </Button>
                                </div>
                            </div>

                            {/* Subscription Status Card */}
                            <div
                                className={`group relative overflow-hidden rounded-xl border p-4 transition-all duration-300 hover:scale-[1.005] ${
                                    statusDisplay.bgColor
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        {/* Replace emoji with Lucide icon while preserving status object */}
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 dark:bg-black/30">
                                            {(() => {
                                                // Choose icon by title/status context
                                                if (statusDisplay.title?.toLowerCase().includes("lifetime")) {
                                                    return <Gem className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
                                                }
                                                if (statusDisplay.title?.toLowerCase().includes("subscription")) {
                                                    return <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
                                                }
                                                if (statusDisplay.title?.toLowerCase().includes("free")) {
                                                    return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
                                                }
                                                return <Sparkles className="h-5 w-5 text-blue-600" />;
                                            })()}
                                        </div>
                                        <div className="flex-1">
                                            <div className={`text-lg font-semibold ${statusDisplay.textColor}`}>{statusDisplay.title}</div>
                                            <div className={`text-sm ${statusDisplay.textColor} opacity-80`}>{statusDisplay.description}</div>
                                        </div>
                                    </div>

                                    {/* Upgrade Button for Free Users */}
                                    {subscriptionData && // Don't show button while loading
                                        (!subscriptionData?.hasSubscription || subscriptionData?.status !== "active") &&
                                        (!subscriptionData?.hasLifetimeLicense || subscriptionData?.status !== "lifetime") && (
                                            <Button
                                                onClick={() => window.open("https://sharptabs.com/pricing", "_blank")}
                                                size="sm"
                                                className="ml-4 shadow-md"
                                            >
                                                <Crown className="mr-2 h-4 w-4" />
                                                Get AI Subscription
                                            </Button>
                                        )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Not Signed In */}
                    {!loading && !user && !window.location.href.includes("apiKey=") && (
                        <div className="space-y-6">
                            {/* Welcome Header */}
                            <div className="group relative flex flex-col items-start justify-between gap-5 overflow-hidden rounded-xl border border-primary/20 bg-primary/10 p-5 text-left sm:flex-row sm:items-center">
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg">
                                        <User className="h-6 w-6" />
                                    </div>
                                    <div className="flex min-w-0 flex-col justify-center gap-0.5">
                                        <h3 className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-xl font-bold text-transparent">
                                            Sign In
                                        </h3>
                                        <p className="text-base text-muted-foreground">
                                            The extension is fully free to use. Sign in only to unlock AI-powered features, or use your own API key in settings.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleSignInOnWebsite}
                                    size="lg"
                                    className="sharp-tabs-signin-button h-12 w-full shrink-0 text-base font-semibold shadow-md sm:w-auto sm:min-w-[180px]"
                                    disabled={isWaitingForAuth}
                                >
                                    {isWaitingForAuth ? (
                                        <>
                                            <LoadingSpinner className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            Sign In on Website...
                                        </>
                                    ) : (
                                        <>
                                            <ExternalLink className="mr-2 h-5 w-5" />
                                            Sign In
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Magic Link Processing */}
                    {!user?.email?.includes("@") && window.location.href.includes("apiKey=") && (
                        <div className="flex flex-col items-center gap-3 p-6">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                            <div className="text-sm font-semibold text-white">Signing you in...</div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
