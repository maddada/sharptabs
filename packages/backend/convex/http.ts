import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { geminiProxy } from "./geminiProxy";
import { missingEnvVariableUrl } from "./utils";
import Stripe from "stripe";
import { logGroupedTabs } from "./logGroupedTabs";

// Helper function to create CORS headers
function corsHeaders(request?: Request) {
    const allowedOrigins = [
        "https://sharptabs.com",
        "https://www.sharptabs.com",
        "http://localhost:4321",
        "https://localhost:4321",
    ];

    const origin = request?.headers.get("origin");
    let allowedOrigin = allowedOrigins[0]; // default fallback

    if (origin) {
        // Check for exact matches first
        if (allowedOrigins.includes(origin)) {
            allowedOrigin = origin;
        }
        // Check for chrome extension origins
        else if (origin.startsWith("chrome-extension://")) {
            allowedOrigin = origin;
        }
    }

    return {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
        "Access-Control-Allow-Credentials": "true",
    };
}

const handleStripeWebhook = httpAction(async (ctx, request) => {
    console.log("[/api/stripe] Received webhook request");

    const signature = request.headers.get("stripe-signature") as string;
    console.log("[/api/stripe] Signature present:", !!signature);

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    console.log("[/api/stripe] Webhook secret present:", !!webhookSecret);

    if (!webhookSecret) {
        const errorMessage = missingEnvVariableUrl(
            "STRIPE_WEBHOOK_SECRET",
            "https://dashboard.stripe.com/webhooks",
        );
        console.error("[/api/stripe] STRIPE_WEBHOOK_SECRET is not set");
        console.error(errorMessage);
        return new Response("Webhook secret not configured", { status: 500 });
    }

    const event = await Stripe.webhooks.constructEventAsync(
        await request.text(),
        signature,
        webhookSecret,
    );

    console.log(
        "[/api/stripe] Event constructed successfully:",
        event.type,
        "ID:",
        event.id,
    );

    const allowedEvents: string[] = [
        "checkout.session.completed",
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
        "customer.subscription.paused",
        "customer.subscription.resumed",
        "customer.subscription.pending_update_applied",
        "customer.subscription.pending_update_expired",
        "customer.subscription.trial_will_end",
        "invoice.paid",
        "invoice.payment_failed",
        "invoice.payment_action_required",
        "invoice.upcoming",
        "invoice.marked_uncollectible",
        "invoice.payment_succeeded",
        "payment_intent.succeeded",
        "payment_intent.payment_failed",
        "payment_intent.canceled",
    ];

    if (allowedEvents.includes(event.type)) {
        const customerId = (event.data.object as { customer: string }).customer;
        console.log(
            "[/api/stripe] Processing allowed event:",
            event.type,
            "for customer:",
            customerId,
        );

        await ctx.scheduler.runAfter(0, internal.stripe.syncStripeDataToDb, {
            stripeCustomerId: customerId,
        });

        console.log("[/api/stripe] Scheduled sync for customer:", customerId);
    } else {
        console.log(
            "[/api/stripe] Event type not in allowed list:",
            event.type,
        );
    }

    console.log("[/api/stripe] Webhook processed successfully");
    return new Response(null, {
        status: 200,
    });
});

const http = httpRouter();

http.route({
    path: "/stripe",
    method: "POST",
    handler: handleStripeWebhook,
});

http.route({
    path: "/stripe-test",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        console.log("[/api/stripe-test] Test endpoint called");
        return new Response("Hello, world!", {
            status: 200,
            headers: corsHeaders(request),
        });
    }),
});

// Handle OPTIONS requests for CORS preflight
http.route({
    path: "/generate-stripe-checkout",
    method: "OPTIONS",
    handler: httpAction(async (ctx, request) => {
        return new Response(null, {
            status: 200,
            headers: corsHeaders(request),
        });
    }),
});

http.route({
    path: "/generate-stripe-checkout",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        console.log("[/api/generate-stripe-checkout] Request received");

        try {
            const body = await request.json();
            const { email, firebaseUserId, plan } = body;

            if (!email || !firebaseUserId || !plan) {
                return new Response(
                    JSON.stringify({
                        error: "Email, firebaseUserId, and plan are required",
                    }),
                    {
                        status: 400,
                        headers: {
                            "Content-Type": "application/json",
                            ...corsHeaders(request),
                        },
                    },
                );
            }

            const checkoutUrl = await ctx.runAction(
                api.stripe.generateStripeCheckoutUrlByAuthId,
                {
                    authId: firebaseUserId,
                    plan: plan,
                },
            );

            console.log(
                "[/api/generate-stripe-checkout] Checkout URL generated successfully",
            );

            return new Response(JSON.stringify({ checkoutUrl }), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    ...corsHeaders(request),
                },
            });
        } catch (error) {
            console.error("[/api/generate-stripe-checkout] Error:", error);

            return new Response(
                JSON.stringify({
                    error:
                        error instanceof Error
                            ? error.message
                            : "Failed to generate checkout URL",
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                        ...corsHeaders(request),
                    },
                },
            );
        }
    }),
});

// Handle OPTIONS requests for CORS preflight
http.route({
    path: "/sync-after-success",
    method: "OPTIONS",
    handler: httpAction(async (ctx, request) => {
        return new Response(null, {
            status: 200,
            headers: corsHeaders(request),
        });
    }),
});

http.route({
    path: "/sync-after-success",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        console.log("[/api/sync-after-success] Request received");

        try {
            const body = await request.json();
            const { email, firebaseUserId } = body;

            if (!email || !firebaseUserId) {
                return new Response(
                    JSON.stringify({
                        error: "Email and firebaseUserId are required",
                    }),
                    {
                        status: 400,
                        headers: {
                            "Content-Type": "application/json",
                            ...corsHeaders(request),
                        },
                    },
                );
            }

            await ctx.runMutation(api.stripe.syncStripeDataByAuthId, {
                authId: firebaseUserId,
            });

            console.log(
                "[/api/sync-after-success] Subscription sync completed successfully",
            );

            return new Response(
                JSON.stringify({ success: true, message: "Sync completed" }),
                {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                        ...corsHeaders(request),
                    },
                },
            );
        } catch (error) {
            console.error("[/api/sync-after-success] Error:", error);

            return new Response(
                JSON.stringify({
                    error:
                        error instanceof Error
                            ? error.message
                            : "Failed to sync subscription data",
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                        ...corsHeaders(request),
                    },
                },
            );
        }
    }),
});

// Handle OPTIONS requests for CORS preflight
http.route({
    path: "/create-user",
    method: "OPTIONS",
    handler: httpAction(async (ctx, request) => {
        return new Response(null, {
            status: 200,
            headers: corsHeaders(request),
        });
    }),
});

http.route({
    path: "/create-user",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        console.log("[/api/create-user] Request received");

        try {
            const body = await request.json();
            const { auth_id, email, email_verified } = body;

            if (!auth_id || !email) {
                return new Response(
                    JSON.stringify({ error: "auth_id and email are required" }),
                    {
                        status: 400,
                        headers: {
                            "Content-Type": "application/json",
                            ...corsHeaders(request),
                        },
                    },
                );
            }

            const userId = await ctx.runMutation(
                api.users.handleUserCreationOrLogin,
                {
                    auth_id,
                    email,
                    email_verified: email_verified || false,
                },
            );

            console.log(
                "[/api/create-user] User created/updated successfully",
                userId,
            );

            return new Response(JSON.stringify({ success: true, userId }), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    ...corsHeaders(request),
                },
            });
        } catch (error) {
            console.error("[/api/create-user] Error:", error);

            return new Response(
                JSON.stringify({
                    error:
                        error instanceof Error
                            ? error.message
                            : "Failed to create/update user",
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                        ...corsHeaders(request),
                    },
                },
            );
        }
    }),
});

// Handle OPTIONS requests for CORS preflight
http.route({
    path: "/get-subscription-status",
    method: "OPTIONS",
    handler: httpAction(async (ctx, request) => {
        return new Response(null, {
            status: 200,
            headers: corsHeaders(request),
        });
    }),
});

http.route({
    path: "/get-subscription-status",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        console.log("[/api/get-subscription-status] Request received");

        try {
            const body = await request.json();
            const { email, firebaseUserId } = body;

            if (!email || !firebaseUserId) {
                return new Response(
                    JSON.stringify({
                        error: "Email and firebaseUserId are required",
                    }),
                    {
                        status: 400,
                        headers: {
                            "Content-Type": "application/json",
                            ...corsHeaders(request),
                        },
                    },
                );
            }

            const subscriptionStatus = await ctx.runQuery(
                api.stripe.getSubscriptionStatusByAuthId,
                {
                    authId: firebaseUserId,
                },
            );

            console.log(
                "[/api/get-subscription-status] Subscription status retrieved successfully",
            );

            return new Response(JSON.stringify(subscriptionStatus), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    ...corsHeaders(request),
                },
            });
        } catch (error) {
            console.error("[/api/get-subscription-status] Error:", error);

            return new Response(
                JSON.stringify({
                    error:
                        error instanceof Error
                            ? error.message
                            : "Failed to get subscription status",
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                        ...corsHeaders(request),
                    },
                },
            );
        }
    }),
});

http.route({
    path: "/log-grouped-tabs",
    method: "OPTIONS",
    handler: httpAction(async (ctx, request) => {
        return new Response(null, {
            status: 200,
            headers: corsHeaders(request),
        });
    }),
});

http.route({
    path: "/log-grouped-tabs",
    method: "POST",
    handler: logGroupedTabs,
});

http.route({
    path: "/gemini-proxy",
    method: "OPTIONS",
    handler: httpAction(async (ctx, request) => {
        console.log("[/api/gemini-proxy] OPTIONS request received");
        return new Response(null, {
            status: 200,
            headers: corsHeaders(request),
        });
    }),
});

http.route({
    path: "/gemini-proxy",
    method: "POST",
    handler: geminiProxy,
});

// Handle OPTIONS requests for CORS preflight
http.route({
    path: "/generate-custom-token",
    method: "OPTIONS",
    handler: httpAction(async (ctx, request) => {
        return new Response(null, {
            status: 200,
            headers: corsHeaders(request),
        });
    }),
});

http.route({
    path: "/generate-custom-token",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        console.log("[/api/generate-custom-token] Request received");

        try {
            const body = await request.json();
            const { idToken } = body;

            if (!idToken) {
                return new Response(
                    JSON.stringify({ error: "idToken is required" }),
                    {
                        status: 400,
                        headers: {
                            "Content-Type": "application/json",
                            ...corsHeaders(request),
                        },
                    },
                );
            }

            // Call the Node.js action to generate custom token
            const result = await ctx.runAction(api.auth.generateCustomToken, { idToken });

            return new Response(JSON.stringify(result), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    ...corsHeaders(request),
                },
            });
        } catch (error) {
            console.error("[/api/generate-custom-token] Error:", error);

            return new Response(
                JSON.stringify({
                    error: error instanceof Error ? error.message : "Failed to generate custom token",
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                        ...corsHeaders(request),
                    },
                },
            );
        }
    }),
});

export default http;
