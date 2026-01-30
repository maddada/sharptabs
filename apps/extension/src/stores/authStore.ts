import {
    AdditionalUserInfo,
    Auth,
    User,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth/web-extension";
import { create } from "zustand";
import { convex, isConvexAvailable } from "@/utils/convex";
import { auth } from "@/utils/firebase";
import { computed } from "zustand-middleware-computed-state";
import { api } from "@packages/backend/convex/_generated/api";

// Flag to track if Firebase auth is available
const isAuthAvailable = auth !== null;

interface AuthState {
    auth: Auth | null;
    user: User | null;
    additionalUserInfo: AdditionalUserInfo | null;
    loading: boolean;
    error: Error | null;
    authDisabled: boolean;
    actions: {
        setUser: (user: User | null) => void;
        setAdditionalUserInfo: (additionalUserInfo: AdditionalUserInfo | null) => void;
        setLoading: (loading: boolean) => void;
        setError: (error: Error | null) => void;
        signUpWithEmail: (email: string, password: string) => Promise<void>;
        signInWithEmail: (email: string, password: string) => Promise<void>;
        logout: () => Promise<void>;
    };
}

interface AuthComputedState {
    isLoggedIn: boolean;
    userEmail: string | null;
}

type SetType = (
    partial: AuthState | Partial<AuthState> | ((state: AuthState) => AuthState | Partial<AuthState>),
    replace?: boolean | undefined
) => void;

// Track if this is the initial auth check to avoid calling backend on session restoration
let isInitialAuthCheck = true;

// Note: Google auth data is now handled through Firebase custom tokens
// No longer need to check Chrome storage for auth persistence
// Firebase handles all auth persistence automatically

export const useAuthStore = create<AuthState & AuthComputedState>(
    computed<AuthState, AuthComputedState>(
        (set: SetType) => ({
            auth: auth,
            user: null,
            additionalUserInfo: null,
            loading: isAuthAvailable, // Only show loading if auth is available
            error: null,
            authDisabled: !isAuthAvailable,
            actions: {
                setUser: (user: User | null) => set({ user }),
                setAdditionalUserInfo: (additionalUserInfo: AdditionalUserInfo | null) => set({ additionalUserInfo }),
                setLoading: (loading: boolean) => set({ loading }),
                setError: (error: Error | null) => set({ error }),

                signUpWithEmail: async (email: string, password: string) => {
                    if (!auth) {
                        console.warn("[EMAIL AUTH] Firebase auth not available");
                        set({ error: new Error("Authentication is not available"), loading: false });
                        return;
                    }
                    console.log("[EMAIL AUTH] Starting email signup for:", email);
                    set({ loading: true, error: null });
                    try {
                        console.log("[EMAIL AUTH] Calling Firebase createUserWithEmailAndPassword");
                        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                        // Explicitly call backend for actual signup events
                        if (userCredential.user) {
                            console.log("[EMAIL AUTH] Firebase signup successful, creating user in Convex:", userCredential.user.email);
                            await createOrUpdateUserInConvex(userCredential.user);
                            console.log("[EMAIL AUTH] Email signup flow completed successfully");
                        }
                    } catch (error) {
                        console.error("[EMAIL AUTH] Sign Up Error:", error);
                        set({ error: error as Error, loading: false });
                    } finally {
                        // Loading state might be updated by onAuthStateChanged
                    }
                },

                signInWithEmail: async (email: string, password: string) => {
                    if (!auth) {
                        console.warn("[EMAIL AUTH] Firebase auth not available");
                        set({ error: new Error("Authentication is not available"), loading: false });
                        return;
                    }
                    console.log("[EMAIL AUTH] Starting email signin for:", email);
                    set({ loading: true, error: null });
                    try {
                        console.log("[EMAIL AUTH] Calling Firebase signInWithEmailAndPassword");
                        const userCredential = await signInWithEmailAndPassword(auth, email, password);
                        // Explicitly call backend for actual login events
                        if (userCredential.user) {
                            console.log("[EMAIL AUTH] Firebase signin successful, updating user in Convex:", userCredential.user.email);
                            await createOrUpdateUserInConvex(userCredential.user);
                            console.log("[EMAIL AUTH] Email signin flow completed successfully");
                        }
                    } catch (error) {
                        console.error("[EMAIL AUTH] Sign In Error:", error);
                        set({ error: error as Error, loading: false });
                    } finally {
                        // Loading state might be updated by onAuthStateChanged
                    }
                },

                logout: async () => {
                    if (!auth) {
                        console.warn("[EMAIL AUTH] Firebase auth not available");
                        set({ user: null, loading: false });
                        return;
                    }
                    console.log("[EMAIL AUTH] [GOOGLE AUTH] Starting logout process");
                    set({ loading: true, error: null });
                    try {
                        console.log("[EMAIL AUTH] Calling Firebase signOut");
                        await signOut(auth);
                        console.log("[EMAIL AUTH] [GOOGLE AUTH] Setting user to null");
                        set({ user: null });
                        console.log("[EMAIL AUTH] [GOOGLE AUTH] Logout completed, reloading page in 1 second");
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    } catch (error) {
                        console.error("[EMAIL AUTH] [GOOGLE AUTH] Logout Error:", error);
                        set({ error: error as Error });
                    } finally {
                        set({ loading: false });
                    }
                },
            },
        }),
        (state) => ({
            isLoggedIn: !!state.user,
            userEmail: state.user ? state.user.email : null,
        })
    )
);

// Helper function to create/update user in Convex (only called on actual login/signup)
async function createOrUpdateUserInConvex(user: User) {
    if (!isConvexAvailable) {
        console.warn("[EMAIL AUTH] [GOOGLE AUTH] Convex not available - skipping user creation/update");
        return;
    }
    try {
        if (user.uid && user.email) {
            console.log("[EMAIL AUTH] [GOOGLE AUTH] Sending user data to Convex:", {
                uid: user.uid,
                email: user.email,
                verified: user.emailVerified,
            });
            await convex.mutation(api.users.handleUserCreationOrLogin, {
                auth_id: user.uid,
                email: user.email,
                email_verified: user.emailVerified,
            });
            console.log("[EMAIL AUTH] [GOOGLE AUTH] User successfully created/updated in Convex");
        }
    } catch (error) {
        console.error("[EMAIL AUTH] [GOOGLE AUTH] Error creating/updating user in Convex:", error);
    }
}

// Helper function to update user activity (for session restoration)
async function updateUserActivity(user: User) {
    if (!isConvexAvailable) {
        console.warn("[EMAIL AUTH] [GOOGLE AUTH] Convex not available - skipping activity update");
        return;
    }
    try {
        if (user.uid) {
            console.log("[EMAIL AUTH] [GOOGLE AUTH] Updating user activity in Convex for:", user.uid);
            await convex.mutation(api.users.updateUserActivity, {
                auth_id: user.uid,
            });
            console.log("[EMAIL AUTH] [GOOGLE AUTH] User activity updated successfully in Convex");
        }
    } catch (error) {
        console.error("[EMAIL AUTH] [GOOGLE AUTH] Error updating user activity in Convex:", error);
    }
}

// Listen for auth state changes (only if auth is available)
if (auth) {
    onAuthStateChanged(auth, async (user: User | null) => {
        console.log("[EMAIL AUTH] [GOOGLE AUTH] Auth state changed, user:", user ? `${user.email} (${user.uid})` : "null");
        useAuthStore.getState().actions.setUser(user);
        useAuthStore.getState().actions.setLoading(false);
        useAuthStore.getState().actions.setError(null);

        // Only call handleUserCreationOrLogin on actual login events, not auth restoration
        // For initial auth check (session restoration), just update activity
        if (user) {
            if (isInitialAuthCheck) {
                console.log("[EMAIL AUTH] [GOOGLE AUTH] Initial auth check - session restoration detected for:", user.email);
                // This is session restoration - just update activity, don't increment login count
                await updateUserActivity(user);
                // Set loading to false since we have a user
                useAuthStore.getState().actions.setLoading(false);
            }
            // Note: Actual login/signup events are handled explicitly in the action methods above
        } else if (isInitialAuthCheck) {
            console.log("[EMAIL AUTH] No Firebase user found on initial check");
            console.log("[EMAIL AUTH] Setting loading to false - Firebase handles all auth persistence");
            // No Firebase user found, set loading to false
            useAuthStore.getState().actions.setLoading(false);
        }

        // After the first auth check, subsequent changes would be actual login/logout events
        // But we handle those explicitly in the action methods, so no need to call backend here
        if (isInitialAuthCheck) {
            console.log("[EMAIL AUTH] [GOOGLE AUTH] Initial auth check completed");
            isInitialAuthCheck = false;
        }
    });
} else {
    console.warn("[EMAIL AUTH] Firebase auth not initialized - auth features disabled");
}

// Note: Google auth is now handled through Firebase custom tokens
// No longer need to listen for Chrome storage changes

// Add fallback timeout to ensure loading doesn't stay true indefinitely (only if auth is available)
if (auth) {
    setTimeout(() => {
        const currentState = useAuthStore.getState();
        if (currentState.loading && !currentState.user) {
            console.log("[EMAIL AUTH] [GOOGLE AUTH] Auth initialization timeout - setting loading to false");
            currentState.actions.setLoading(false);
        }
    }, 4000);
}

// Note: Firebase now handles all auth initialization automatically
// No longer need manual Google auth checks
