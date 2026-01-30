// Import Firebase from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
    getAuth,
    isSignInWithEmailLink,
    sendSignInLinkToEmail,
    signInWithEmailLink,
    GoogleAuthProvider,
    signInWithPopup,
    getAdditionalUserInfo,
    signOut,
    onAuthStateChanged as firebaseOnAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

// Firebase configuration from environment variables
const firebaseConfig = window.firebaseConfig;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Auth state management
function getCurrentUser() {
    return auth.currentUser;
}

function onAuthStateChanged(callback) {
    return firebaseOnAuthStateChanged(auth, callback);
}

// Email link authentication
async function sendEmailLink(email) {
    const actionCodeSettings = {
        // URL you want to redirect back to after email link is clicked
        url: `${window.location.origin}/profile`,
        handleCodeInApp: true,
    };

    try {
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        // Save the email locally for sign-in completion
        window.localStorage.setItem("emailForSignIn", email);
        return { success: true };
    } catch (error) {
        console.error("Error sending email link:", error);
        return { success: false, error: error.message };
    }
}

async function completeSignIn() {
    // Confirm the link is a sign-in with email link
    if (isSignInWithEmailLink(auth, window.location.href)) {
        // Get the email if available
        let email = window.localStorage.getItem("emailForSignIn");
        if (!email) {
            // User opened the link on a different device. To prevent session fixation
            // attacks, ask the user to provide the associated email again.
            email = window.prompt("Please provide your email for confirmation");
        }

        try {
            const result = await signInWithEmailLink(auth, email, window.location.href);
            // Clear email from storage
            window.localStorage.removeItem("emailForSignIn");

            // Remove the login related search parameters from the URL after sign in
            // Only run this code on the client
            if (typeof window !== "undefined") {
                // Check if the URL has any search parameters (like ?apiKey=...)
                if (window.location.search) {
                    const cleanUrl = window.location.origin + window.location.pathname;
                    // Replace the current URL with the clean one without reloading the page
                    window.history.replaceState({}, document.title, cleanUrl);
                }
            }

            // Create or update user in Convex
            try {
                await createOrUpdateUserInConvex(result.user);

                // Send auth to extension after successful email link login
                await sendAuthToExtension(result.user);

                // Show extension login success toast if user came from extension
                const fromExtension = isUserComingFromExtension();
                console.log("[EMAIL LOGIN] User came from extension:", fromExtension);
                if (fromExtension) {
                    console.log("[EMAIL LOGIN] About to show toast, function type:", typeof showExtensionLoginSuccessToast);
                    showExtensionLoginSuccessToast(result.user.email);
                }
            } catch (error) {
                console.error("Error creating/updating user in Convex:", error);
            }

            return { success: true, user: result.user };
        } catch (error) {
            console.error("Error completing sign in:", error);
            return { success: false, error: error.message };
        }
    }
    return { success: false, error: "Invalid sign-in link" };
}

// Google authentication
async function signInWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        provider.addScope("email");
        provider.addScope("profile");

        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const additionalUserInfo = getAdditionalUserInfo(result);

        // Create or update user in Convex
        try {
            await createOrUpdateUserInConvex(user, "google");

            // Send auth to extension after successful Google login
            await sendAuthToExtension(result.user);

            // Show extension login success toast if user came from extension
            const fromExtension = isUserComingFromExtension();
            console.log("[GOOGLE LOGIN] User came from extension:", fromExtension);
            if (fromExtension) {
                console.log("[GOOGLE LOGIN] About to show toast, function type:", typeof showExtensionLoginSuccessToast);
                showExtensionLoginSuccessToast(result.user.email);
            }
        } catch (error) {
            console.error("Error creating/updating user in Convex:", error);
        }

        return { success: true, user: user, additionalUserInfo: additionalUserInfo };
    } catch (error) {
        console.error("Error signing in with Google:", error);
        return { success: false, error: error.message };
    }
}

async function logout() {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        console.error("Error signing out:", error);
        return { success: false, error: error.message };
    }
}

// Helper function to check if user is authenticated
function isAuthenticated() {
    return !!auth.currentUser;
}

// Helper function to create or update user in Convex
async function createOrUpdateUserInConvex(user, authProvider = "email") {
    try {
        if (user.uid && user.email) {
            const convexUrl = window.convexUrl;
            if (!convexUrl) {
                console.error("Convex URL not configured");
                return;
            }

            const idToken = await user.getIdToken();

            const requestBody = {
                auth_id: user.uid,
                email: user.email,
                email_verified: user.emailVerified,
                auth_provider: authProvider,
            };

            // Add Google-specific fields if signing in with Google
            if (authProvider === "google") {
                requestBody.display_name = user.displayName;
                requestBody.photo_url = user.photoURL;
            }

            const response = await fetch(`${convexUrl}/create-user`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (response.ok) {
                console.log("User created/updated in Convex successfully");
            } else {
                console.error("Failed to create/update user in Convex");
            }
        }
    } catch (error) {
        console.error("Error creating/updating user in Convex:", error);
    }
}

// Profile page logic
const loadingState = document.getElementById("loading-state");
const loginSection = document.getElementById("login-section");
const profileSection = document.getElementById("profile-section");
const loginForm = document.getElementById("login-form");
const googleSignInBtn = document.getElementById("google-signin-btn");
const emailSentMessage = document.getElementById("email-sent-message");
const errorMessage = document.getElementById("error-message");
const errorText = document.getElementById("error-text");
const userEmail = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");
const selectedPlan = document.getElementById("selected-plan");
const selectedPlanText = document.getElementById("selected-plan-text");
const purchaseBtn = document.getElementById("purchase-btn");

let currentSelectedPlan = null;

// Check if this is a sign-in link
if (window.location.href.includes("apiKey") || window.location.href.includes("oobCode")) {
    const result = await completeSignIn();
    if (result.success) {
        // Clear URL parameters after successful sign-in
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        showError(result.error);
    }
}

// Auth state listener
onAuthStateChanged(async (user) => {
    loadingState.classList.add("hidden");

    if (user) {
        // User is signed in
        loginSection.classList.add("hidden");
        profileSection.classList.remove("hidden");
        userEmail.textContent = user.email;

        // Create or update user in Convex
        try {
            await createOrUpdateUserInConvex(user);
        } catch (error) {
            console.error("Error creating/updating user in Convex:", error);
        }

        // Check if user came from extension for auto-login
        const urlParams = new URLSearchParams(window.location.search);
        const fromExtension = urlParams.get("from") === "extension";

        if (fromExtension) {
            // User came from extension and is already signed in - trigger auto-login
            console.log("[WEBSITE] Auto-login detected: User already signed in, sending auth to extension");

            // Show auto-login message
            showAutoLoginMessage(user.email);

            try {
                await sendAuthToExtension(user);
            } catch (error) {
                console.error("[WEBSITE] Auto-login failed:", error);
                showAutoLoginError();
            }
        }

        // Load subscription status
        try {
            await loadSubscriptionStatus(user);
        } catch (error) {
            console.error("Error loading subscription status:", error);
        }

        // Auto-select the $4 plan by default if no subscription
        setTimeout(() => {
            const defaultPlan = document.querySelector('[data-plan="3months"]');
            if (defaultPlan) {
                defaultPlan.click();
            }
        }, 100);
    } else {
        // User is signed out
        profileSection.classList.add("hidden");
        loginSection.classList.remove("hidden");
    }
});

// Login form submission
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;

    // Disable submit button permanently after being clicked once
    const submitButton = loginForm.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending...";
    }

    hideMessages();
    const result = await sendEmailLink(email);

    if (result.success) {
        emailSentMessage.classList.remove("hidden");
    } else {
        showError(result.error);
    }
    // Button remains disabled after being clicked once
});

// Google sign-in
if (googleSignInBtn) {
    googleSignInBtn.addEventListener("click", async () => {
        // Disable button during sign-in process
        googleSignInBtn.disabled = true;
        const originalText = googleSignInBtn.textContent;
        googleSignInBtn.textContent = "Signing in...";

        hideMessages();
        const result = await signInWithGoogle();

        if (!result.success) {
            showError(result.error);
            // Re-enable button on error
            googleSignInBtn.disabled = false;
            googleSignInBtn.textContent = originalText;
        }
        // On success, auth state change will handle UI updates
    });
}

// Logout
logoutBtn.addEventListener("click", async () => {
    const result = await logout();
    if (!result.success) {
        showError(result.error);
    }
});

// Plan selection
window.addEventListener("planSelected", (event) => {
    currentSelectedPlan = event.detail;
    selectedPlanText.textContent = `${planNiceString(event.detail.plan)}`; //  - $${event.detail.price}
    selectedPlan.setAttribute("data-plan", event.detail.plan);
    selectedPlan.classList.remove("hidden");
});

// Purchase button
purchaseBtn.addEventListener("click", async () => {
    if (!getCurrentUser()) {
        showError("Please sign in to subscribe");
        return;
    }

    // Disable button permanently after being clicked once
    purchaseBtn.disabled = true;
    const originalText = purchaseBtn.textContent;
    purchaseBtn.textContent = "Processing...";

    try {
        // Check if a plan is selected
        if (!currentSelectedPlan) {
            showError("Please select a subscription plan");
            return;
        }

        // Get Firebase auth token
        const user = getCurrentUser();
        const idToken = await user.getIdToken();

        // Call Convex endpoint to generate Stripe checkout URL
        const convexUrl = window.convexUrl;
        if (!convexUrl) {
            throw new Error("Convex URL not configured");
        }
        const response = await fetch(`${convexUrl}/generate-stripe-checkout`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
                email: user.email,
                firebaseUserId: user.uid,
                plan: currentSelectedPlan.plan,
            }),
        });

        const data = await response.json();

        if (response.ok && data.checkoutUrl) {
            // Redirect to Stripe checkout
            window.location.href = data.checkoutUrl;
        } else {
            showError(data.error || "Failed to create checkout session");
        }
    } catch (error) {
        console.error("Error creating checkout session:", error);
        showError("Failed to create checkout session");
    }
    // Button remains disabled after being clicked once
});

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove("hidden");
}

function hideMessages() {
    emailSentMessage.classList.add("hidden");
    errorMessage.classList.add("hidden");
}

async function loadSubscriptionStatus(user) {
    try {
        const idToken = await user.getIdToken();
        const convexUrl = window.convexUrl;

        if (!convexUrl) {
            throw new Error("Convex URL not configured");
        }

        const response = await fetch(`${convexUrl}/get-subscription-status`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
                email: user.email,
                firebaseUserId: user.uid,
            }),
        });

        if (response.ok) {
            const subscriptionData = await response.json();
            console.log("Subscription data received:", subscriptionData);
            updateSubscriptionUI(subscriptionData, user.email);
        } else {
            console.error("Failed to load subscription status:", response.status, response.statusText);
            const errorText = await response.text();
            console.error("Error response:", errorText);
        }
    } catch (error) {
        console.error("Error loading subscription status:", error);
    }
}

function updateSubscriptionUI(subscriptionData, userEmail) {
    console.log("Updating subscription UI with data:", subscriptionData);
    const subscriptionStatusDiv = document.getElementById("subscription-status");

    // Check if user has premium access (either active subscription or lifetime license)
    const hasPremiumAccess =
        (subscriptionData.hasSubscription && subscriptionData.status === "active") ||
        (subscriptionData.hasLifetimeLicense && subscriptionData.status === "lifetime");

    console.log("Has premium access:", hasPremiumAccess, {
        hasSubscription: subscriptionData.hasSubscription,
        hasLifetimeLicense: subscriptionData.hasLifetimeLicense,
        status: subscriptionData.status,
    });

    if (hasPremiumAccess) {
        // User has premium access (subscription or lifetime)
        let statusText, statusDescription;

        if (subscriptionData.hasLifetimeLicense) {
            statusText = "Lifetime License Active";
            statusDescription = subscriptionData.lifetimeLicense?.purchaseDate
                ? `Purchased on ${new Date(subscriptionData.lifetimeLicense.purchaseDate * 1000).toLocaleDateString()}`
                : "Lifetime access";
        } else {
            statusText = "Premium Plan Active";
            statusDescription = subscriptionData.currentPeriodEnd
                ? `${subscriptionData.cancelAtPeriodEnd ? "Ends" : "Renews"} on ${new Date(subscriptionData.currentPeriodEnd * 1000).toLocaleDateString()}`
                : "Active subscription";
            if (subscriptionData.cancelAtPeriodEnd) {
                statusDescription += " (Cancels at period end)";
            }
        }

        subscriptionStatusDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <div>
                        <p class="text-lg font-semibold text-white">${statusText}</p>
                        <p class="text-gray-300">${statusDescription}</p>
                    </div>
                </div>
                ${
                    subscriptionData.hasSubscription
                        ? `
                    <a
                        id="manage-subscription-btn"
                        href="https://billing.stripe.com/p/login/9B628q0DF5Qu2U8de5bV600?prefilled_email=${encodeURIComponent(userEmail)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="transform rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-blue-500 hover:to-cyan-500 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:scale-[0.98]"
                    >
                        Manage Subscription
                    </a>
                `
                        : ""
                }
            </div>
        `;

        // Hide the plan selection section since user already has premium access
        const planSelectionSection = document.querySelector(".mb-12:has(#purchase-btn)");
        if (planSelectionSection) {
            planSelectionSection.style.display = "none";
        }
    } else {
        // User has no active subscription
        subscriptionStatusDiv.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 text-white">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <div>
                    <p class="text-lg font-semibold text-white">Free Plan</p>
                    <p class="text-gray-300">
                        All features are free! Upgrade only if you want AI features without using your own Gemini API key.
                    </p>
                </div>
            </div>
        `;

        // Show the plan selection section
        const planSelectionSection = document.querySelector(".mb-12:has(#purchase-btn)");
        if (planSelectionSection) {
            planSelectionSection.style.display = "block";
        }
    }
}

// Function to send authentication data to extension
async function sendAuthToExtension(user) {
    try {
        console.log("[WEBSITE -> EXTENSION] Attempting to send auth data to extension for user:", user.email);

        // Get the user's ID token
        const idToken = await user.getIdToken();

        // Call Convex to generate custom token
        const convexUrl = window.convexUrl;
        if (!convexUrl) {
            console.error("[WEBSITE -> EXTENSION] Convex URL not configured");
            return;
        }

        const response = await fetch(`${convexUrl}/generate-custom-token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
            console.error("[WEBSITE -> EXTENSION] Failed to generate custom token:", response.statusText);
            return;
        }

        const { customToken } = await response.json();
        console.log("[WEBSITE -> EXTENSION] Custom token generated successfully");

        // Send message to content script via postMessage (same approach as email-sign-in.astro)
        const authData = {
            customToken: customToken,
            user: {
                uid: user.uid,
                email: user.email,
                emailVerified: user.emailVerified,
                displayName: user.displayName,
                photoURL: user.photoURL,
            },
        };

        console.log("[WEBSITE -> EXTENSION] Sending auth data via postMessage:", authData);

        window.postMessage(
            {
                type: "SHARPTABS_WEBSITE_AUTH_SUCCESS",
                authData: authData,
            },
            window.origin
        );

        console.log("[WEBSITE -> EXTENSION] Auth data sent to content script successfully");
    } catch (error) {
        console.error("[WEBSITE -> EXTENSION] Error sending auth to extension:", error);
    }
}

function planNiceString(plan) {
    switch (plan) {
        case "3months":
            return "3 months";
        case "6months":
            return "6 months";
        case "12months":
            return "1 year";
        case "lifetime":
            return "Lifetime";
    }
}

// Helper function to check if user came from extension
function isUserComingFromExtension() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("from") === "extension";
}

// Extension toast functions are imported from toast-utils.js
console.log("[PROFILE-CLIENT] Toast utils loaded:", typeof window.showExtensionLoginSuccessToast);

// Auto-login visual feedback functions
function showAutoLoginMessage(email) {
    console.log("[AUTO LOGIN] About to show toast, function type:", typeof showExtensionLoginSuccessToast);
    setTimeout(() => {
        showExtensionLoginSuccessToast(email);
    }, 3000);

    // Clean up URL parameter
    const url = new URL(window.location.href);
    url.searchParams.delete("from");
    window.history.replaceState({}, document.title, url.toString());
}

// showAutoLoginError function is imported from toast-utils.js
