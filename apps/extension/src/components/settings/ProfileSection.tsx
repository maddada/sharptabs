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
    ChevronDown,
    ChevronUp,
    Crown,
    ExternalLink,
    Gem,
    HelpCircle,
    LogOut,
    Palette,
    Settings as SettingsIcon,
    Sparkles,
    Star,
    User,
    Wand2,
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

    // Fetch subscription status from Convex
    const subscriptionData = useQuery(api.stripe.getSubscriptionStatusByAuthId, user?.uid ? { authId: user.uid } : "skip") as
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
            return {
                title: "Loading...",
                description: "",
                icon: "🔄",
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
                title: "Premium Plan Active",
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
                    : "Lifetime access to all premium features",
                icon: "💎",
                bgColor: "bg-green-100/10 dark:bg-green-800/30",
                textColor: "text-green-900 dark:text-green-100",
            };
        }

        // Default free plan
        return {
            title: "Free Plan",
            description: "Upgrade to unlock premium features and support development!",
            icon: "⚠️",
            bgColor: "bg-neutral-100 dark:bg-neutral-900/30",
            textColor: "text-neutral-900 dark:text-neutral-100",
        };
    };

    const statusDisplay = getSubscriptionStatusDisplay();

    // UI-only local state for premium section accordion
    const [showPremium, setShowPremium] = useState(false);

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
                                                if (statusDisplay.title?.toLowerCase().includes("premium")) {
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
                                                Upgrade to Premium
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
                            <div className="group relative flex flex-row items-center justify-between overflow-hidden rounded-xl border border-primary/20 bg-primary/10 p-5 text-center transition-all duration-300 hover:scale-[1.005]">
                                <div className="width-fit flex flex-row justify-start gap-3 text-left align-middle">
                                    <div className="mb-3 flex h-14 min-w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg">
                                        <User className="h-6 w-6" />
                                    </div>
                                    <div className="flex flex-col justify-center gap-0.5">
                                        <h3 className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-xl font-bold text-transparent">
                                            Sign In
                                        </h3>
                                        <p className="mb-3 text-base text-gray-300">
                                            The extension is fully free to use. Sign in only to unlock AI-powered features, or use your own API key in settings.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleSignInOnWebsite}
                                    size="lg"
                                    className="sharp-tabs-signin-button h-12 min-w-[180px] text-base font-semibold shadow-md"
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

                            {/* Premium Features Accordion */}
                            <div className="space-y-3">
                                {!showPremium && (
                                    <div className="flex justify-center">
                                        <Button
                                            onClick={() => setShowPremium(true)}
                                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-lg text-white shadow-lg hover:from-blue-500 hover:to-cyan-500"
                                        >
                                            <Gem className="h-4 w-4" />
                                            <span>See Premium Features</span>
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}

                                {showPremium && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="flex-1 text-center text-xl font-bold text-white">Premium Features</h4>
                                            <Button onClick={() => setShowPremium(false)} variant="outline" className="ml-3 flex items-center gap-2">
                                                <ChevronUp className="h-4 w-4" />
                                                Hide
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            {/* AI Features */}
                                            <div className="group relative overflow-hidden rounded-2xl border border-purple-200/50 bg-gradient-to-br from-purple-50 to-indigo-50 p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl dark:border-purple-700/50 dark:from-purple-900/20 dark:to-indigo-900/20">
                                                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-indigo-600/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                                                <div className="relative">
                                                    <div className="mb-4 flex items-center">
                                                        <div className="rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 p-3 text-white">
                                                            <Sparkles className="h-6 w-6" />
                                                        </div>
                                                        <h3 className="ml-3 text-xl font-bold text-white">AI-Powered Features</h3>
                                                    </div>
                                                    <ul className="space-y-3">
                                                        <li className="flex items-start gap-3">
                                                            <div className="mt-3 h-2 w-2 flex-shrink-0 rounded-full bg-purple-400"></div>
                                                            <span className="text-lg leading-relaxed text-gray-300">
                                                                Automatic AI group naming and coloring
                                                            </span>
                                                        </li>
                                                        <li className="flex items-start gap-3">
                                                            <div className="mt-3 h-2 w-2 flex-shrink-0 rounded-full bg-purple-400"></div>
                                                            <span className="text-lg leading-relaxed text-gray-300">Intelligent tab grouping</span>
                                                        </li>
                                                        <li className="flex items-start gap-3">
                                                            <div className="mt-3 h-2 w-2 flex-shrink-0 rounded-full bg-purple-400"></div>
                                                            <span className="text-lg leading-relaxed text-gray-300">Automatic Tabs Cleanup</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>

                                            {/* Advanced Styling */}
                                            <div className="group relative overflow-hidden rounded-2xl border border-orange-200/50 bg-gradient-to-br from-orange-50 to-red-50 p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl dark:border-orange-700/50 dark:from-orange-900/20 dark:to-red-900/20">
                                                <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-red-600/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                                                <div className="relative">
                                                    <div className="mb-4 flex items-center">
                                                        <div className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 p-3 text-white">
                                                            <Wand2 className="h-6 w-6" />
                                                        </div>
                                                        <h3 className="ml-3 text-xl font-bold text-white">Advanced Styling</h3>
                                                    </div>
                                                    <ul className="space-y-3">
                                                        <li className="flex items-start gap-3">
                                                            <div className="mt-3 h-2 w-2 flex-shrink-0 rounded-full bg-orange-400"></div>
                                                            <span className="text-lg leading-relaxed text-gray-300">
                                                                Custom tab heights and styles
                                                            </span>
                                                        </li>
                                                        <li className="flex items-start gap-3">
                                                            <div className="mt-3 h-2 w-2 flex-shrink-0 rounded-full bg-orange-400"></div>
                                                            <span className="text-lg leading-relaxed text-gray-300">Outline tabs style</span>
                                                        </li>
                                                        <li className="flex items-start gap-3">
                                                            <div className="mt-3 h-2 w-2 flex-shrink-0 rounded-full bg-orange-400"></div>
                                                            <span className="text-lg leading-relaxed text-gray-300">
                                                                Premium style customizations
                                                            </span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>

                                            {/* Theming & Design */}
                                            <div className="group relative overflow-hidden rounded-2xl border border-emerald-200/50 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl dark:border-emerald-700/50 dark:from-emerald-900/20 dark:to-teal-900/20">
                                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-teal-600/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                                                <div className="relative">
                                                    <div className="mb-4 flex items-center">
                                                        <div className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 p-3 text-white">
                                                            <Palette className="h-6 w-6" />
                                                        </div>
                                                        <h3 className="ml-3 text-xl font-bold text-white">Theming & Design</h3>
                                                    </div>
                                                    <ul className="space-y-3">
                                                        <li className="flex items-start gap-3">
                                                            <div className="mt-3 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500 dark:bg-emerald-400"></div>
                                                            <span className="text-lg leading-relaxed text-gray-300">
                                                                All current and future themes
                                                            </span>
                                                        </li>
                                                        <li className="flex items-start gap-3">
                                                            <div className="mt-3 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500 dark:bg-emerald-400"></div>
                                                            <span className="text-lg leading-relaxed text-gray-300">
                                                                Custom backgrounds & gradients
                                                            </span>
                                                        </li>
                                                        <li className="flex items-start gap-3">
                                                            <div className="mt-3 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500 dark:bg-emerald-400"></div>
                                                            <span className="text-lg leading-relaxed text-gray-300">Create custom themes</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>

                                            {/* Advanced */}
                                            <div className="group relative overflow-hidden rounded-2xl border border-blue-200/50 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl dark:border-blue-700/50 dark:from-blue-900/20 dark:to-cyan-900/20">
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                                                <div className="relative">
                                                    <div className="mb-4 flex items-center">
                                                        <div className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 p-3 text-white">
                                                            <SettingsIcon className="h-6 w-6" />
                                                        </div>
                                                        <h3 className="ml-3 text-xl font-bold text-white">Advanced</h3>
                                                    </div>
                                                    <ul className="space-y-3">
                                                        <li className="flex items-start gap-3">
                                                            <div className="mt-3 h-2 w-2 flex-shrink-0 rounded-full bg-blue-400"></div>
                                                            <span className="text-lg leading-relaxed text-gray-300">Compact Pinned Tabs</span>
                                                        </li>
                                                        <li className="flex items-start gap-3">
                                                            <div className="mt-3 h-2 w-2 flex-shrink-0 rounded-full bg-blue-400"></div>
                                                            <span className="text-lg leading-relaxed text-gray-300">Custom CSS support</span>
                                                        </li>
                                                        <li className="flex items-start gap-3">
                                                            <div className="mt-3 h-2 w-2 flex-shrink-0 rounded-full bg-blue-400"></div>
                                                            <span className="text-lg leading-relaxed text-gray-300">
                                                                Extensive customization options
                                                            </span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>

                                            {/* Premium Support */}
                                            <div className="group relative inset-0 overflow-hidden rounded-2xl border border-pink-200/30 bg-gradient-to-br from-pink-600/10 to-rose-600/10 p-6 shadow-lg transition-transform hover:scale-105 hover:shadow-xl">
                                                <div className="absolute inset-0 bg-gradient-to-br from-pink-600/10 to-rose-600/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                                                <div className="relative">
                                                    <div className="mb-4 flex items-center">
                                                        <div className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 p-3 text-white">
                                                            <HelpCircle className="h-6 w-6" />
                                                        </div>
                                                        <h3 className="ml-3 text-xl font-bold text-white">Premium Support</h3>
                                                    </div>
                                                    <ul className="space-y-3">
                                                        <li className="flex items-start gap-3">
                                                            <div className="mt-3 h-2 w-2 flex-shrink-0 rounded-full bg-purple-400"></div>
                                                            <span className="text-lg leading-relaxed text-gray-300">
                                                                High Priority Feature Requests
                                                            </span>
                                                        </li>
                                                        <li className="flex items-start gap-3">
                                                            <div className="mt-3 h-2 w-2 flex-shrink-0 rounded-full bg-purple-400"></div>
                                                            <span className="text-lg leading-relaxed text-gray-300">Quick Response</span>
                                                        </li>
                                                        <li className="flex items-start gap-3">
                                                            <div className="mt-3 h-2 w-2 flex-shrink-0 rounded-full bg-purple-400"></div>
                                                            <span className="text-lg leading-relaxed text-gray-300">
                                                                First access to new features
                                                            </span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>

                                            {/* Call to Action */}
                                            <div className="group relative overflow-hidden rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50 to-yellow-50 p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl dark:border-amber-700/50 dark:from-amber-900/20 dark:to-yellow-900/20">
                                                <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 to-yellow-600/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                                                <div className="relative text-left">
                                                    <div className="items-left mx-auto mb-4 flex w-full justify-start">
                                                        <div className="rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 p-3 text-white">
                                                            <Star className="h-6 w-6" />
                                                        </div>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-white">Get Started Now</h3>
                                                    <p className="mx-auto mt-2 max-w-xl text-lg leading-relaxed text-gray-300">
                                                        Sign in to sync settings and unlock premium features!
                                                    </p>
                                                    <div className="mt-6 flex justify-start">
                                                        <Button
                                                            onClick={handleSignInOnWebsite}
                                                            className="sharp-tabs-signin-button transform rounded-xl bg-gradient-to-r from-amber-700 to-yellow-700 p-3 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-amber-700 hover:to-yellow-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
                                                            disabled={isWaitingForAuth}
                                                        >
                                                            {isWaitingForAuth ? (
                                                                <>
                                                                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                                    Connecting...
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
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Call to Action moved into accordion below */}
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
