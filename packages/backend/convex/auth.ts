"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin (singleton pattern)
function getFirebaseAdmin() {
    const apps = getApps();
    if (apps.length > 0) {
        return apps[0];
    }

    const privateKeyContent = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

    if (!privateKeyContent || !projectId || !clientEmail) {
        throw new Error("Firebase Admin environment variables not configured");
    }

    // Construct the full private key with proper PEM format
    const formattedPrivateKey = `-----BEGIN PRIVATE KEY-----\n${privateKeyContent}\n-----END PRIVATE KEY-----\n`;

    return initializeApp({
        credential: cert({
            projectId,
            clientEmail,
            privateKey: formattedPrivateKey,
        }),
    });
}

export const generateCustomToken = action({
    args: { idToken: v.string() },
    handler: async (ctx, { idToken }) => {
        console.log("[/api/generate-custom-token] Request received");

        try {
            if (!idToken) {
                throw new Error("idToken is required");
            }

            // Initialize Firebase Admin
            const app = getFirebaseAdmin();
            const auth = getAuth(app);

            // Verify the ID token
            const decodedToken = await auth.verifyIdToken(idToken);
            console.log("[/api/generate-custom-token] ID token verified for user:", decodedToken.uid);

            // Generate custom token
            const customToken = await auth.createCustomToken(decodedToken.uid);
            console.log("[/api/generate-custom-token] Custom token generated successfully");

            return { customToken };
        } catch (error) {
            console.error("[/api/generate-custom-token] Error:", error);
            throw new Error(error instanceof Error ? error.message : "Failed to generate custom token");
        }
    },
});