import {
    mutation,
    action,
    query,
    internalQuery,
    internalMutation,
    internalAction,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Stripe } from "stripe";
import { v } from "convex/values";
import { missingEnvVariableUrl } from "./utils";

// Helper function to get Stripe instance
const getStripe = () => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error(
            missingEnvVariableUrl(
                "STRIPE_SECRET_KEY",
                "https://dashboard.stripe.com/apikeys",
            ),
        );
    }
    return new Stripe(secretKey);
};

// Helper function to get price ID based on plan
const getPriceIdForPlan = (plan: string): string => {
    const priceIds = {
        "3months": process.env.STRIPE_PRICE_ID_3MONTHS,
        "6months": process.env.STRIPE_PRICE_ID_6MONTHS,
        "12months": process.env.STRIPE_PRICE_ID_12MONTHS,
        lifetime: process.env.STRIPE_PRICE_ID_LIFETIME,
    };

    const priceId = priceIds[plan as keyof typeof priceIds];
    if (!priceId) {
        throw new Error(
            `Invalid plan: ${plan}. Available plans: ${Object.keys(priceIds).join(", ")}`,
        );
    }

    return priceId;
};

// Helper function to get subscription period from price ID
const getSubscriptionPeriodFromPriceId = (priceId: string): string => {
    const priceToPeriod = {
        [process.env.STRIPE_PRICE_ID_3MONTHS!]: "3months",
        [process.env.STRIPE_PRICE_ID_6MONTHS!]: "6months", 
        [process.env.STRIPE_PRICE_ID_12MONTHS!]: "1year",
        [process.env.STRIPE_PRICE_ID_LIFETIME!]: "lifetime",
    };

    return priceToPeriod[priceId] || "unknown";
};

export const generateStripeCheckoutUrlByAuthId = action({
    args: { authId: v.string(), plan: v.string() },
    handler: async (ctx, { authId, plan }): Promise<string | null> => {
        const stripe = getStripe();

        const user: any = await ctx.runQuery(internal.stripe.getUserByAuthId, {
            authId: authId,
        });

        if (!user) {
            throw new Error("User not found.");
        }

        let stripeCustomer: any = await ctx.runQuery(
            internal.stripe.getStripeCustomerByUserId,
            {
                userId: user._id,
            },
        );

        if (!stripeCustomer) {
            const newStripeCustomer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    userId: user._id,
                },
            });

            await ctx.runMutation(internal.stripe.createStripeCustomer, {
                userId: user._id,
                stripeCustomerId: newStripeCustomer.id,
                email: user.email,
                subscriptionPeriod: plan,
            });

            stripeCustomer = await ctx.runQuery(
                internal.stripe.getStripeCustomerByUserId,
                {
                    userId: user._id,
                },
            );
        }

        const priceId = getPriceIdForPlan(plan);
        const appUrl = process.env.APP_URL;

        if (!appUrl) {
            throw new Error(missingEnvVariableUrl("APP_URL", "your app's URL"));
        }

        // Determine if this is a one-time payment or recurring subscription
        const isOneTimePayment = plan === "lifetime";
        const mode = isOneTimePayment ? "payment" : "subscription";

        const sessionConfig: any = {
            customer: stripeCustomer!.stripeCustomerId,
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode,
            success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/`,
            metadata: {
                plan,
                userId: user._id,
            },
        };

        // For payment mode, we also need to add metadata to the payment intent
        if (isOneTimePayment) {
            sessionConfig.payment_intent_data = {
                metadata: {
                    plan,
                    userId: user._id,
                },
            };
        }

        const checkoutSession: any =
            await stripe.checkout.sessions.create(sessionConfig);

        return checkoutSession.url;
    },
});

export const syncStripeData = mutation({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("You must be logged in.");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_auth_id", (q) => q.eq("auth_id", identity.subject))
            .unique();

        if (!user) {
            throw new Error("User not found.");
        }

        const stripeCustomer = await ctx.db
            .query("stripeCustomers")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .unique();

        if (!stripeCustomer) {
            throw new Error("Stripe customer not found for this user.");
        }

        await ctx.scheduler.runAfter(0, internal.stripe.syncStripeDataToDb, {
            stripeCustomerId: stripeCustomer.stripeCustomerId,
        });
    },
});

export const syncStripeDataByAuthId = mutation({
    args: { authId: v.string() },
    handler: async (ctx, { authId }) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_auth_id", (q) => q.eq("auth_id", authId))
            .unique();

        if (!user) {
            throw new Error("User not found.");
        }

        const stripeCustomer = await ctx.db
            .query("stripeCustomers")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .unique();

        if (!stripeCustomer) {
            throw new Error("Stripe customer not found for this user.");
        }

        await ctx.scheduler.runAfter(0, internal.stripe.syncStripeDataToDb, {
            stripeCustomerId: stripeCustomer.stripeCustomerId,
        });
    },
});

export const syncStripeDataToDb = internalAction({
    args: { stripeCustomerId: v.string() },
    handler: async (ctx, { stripeCustomerId }) => {
        const stripe = getStripe();
        const subscriptions = await stripe.subscriptions.list({
            customer: stripeCustomerId,
            limit: 1,
            status: "all",
            expand: ["data.default_payment_method"],
        });

        const stripeCustomer = await ctx.runQuery(
            internal.stripe.getStripeCustomer,
            {
                stripeCustomerId,
            },
        );

        if (!stripeCustomer) {
            console.warn(
                `Stripe customer ${stripeCustomerId} not found in database. Skipping sync. This can happen if the customer was created directly in Stripe or if there was an error during customer creation.`,
            );
            return;
        }

        // Get user data to fetch email if not already in stripeCustomer
        const user = await ctx.runQuery(internal.users.getUserById, {
            userId: stripeCustomer.userId,
        });

        if (subscriptions.data.length === 0) {
            // Check for successful one-time payments (like lifetime purchases)
            const payments = await stripe.paymentIntents.list({
                customer: stripeCustomerId,
                limit: 10,
            });

            const successfulLifetimePayment = payments.data.find((payment) => {
                // Check if this is a successful payment for a lifetime plan
                return (
                    payment.status === "succeeded" &&
                    payment.metadata?.plan === "lifetime"
                );
            });

            if (successfulLifetimePayment) {
                // Update stripeCustomer with lifetime license info
                await ctx.runMutation(internal.stripe.updateStripeCustomer, {
                    _id: stripeCustomer._id,
                    data: {
                        email: user?.email || stripeCustomer.email,
                        subscriptionPeriod: "lifetime",
                        status: "lifetime",
                        has_lifetime_license: true,
                        lifetime_license_platform: "stripe",
                        lifetime_license_purchase_date:
                            successfulLifetimePayment.created,
                        lifetime_license_order_id: successfulLifetimePayment.id,
                    },
                });
            } else {
                await ctx.runMutation(internal.stripe.updateStripeCustomer, {
                    _id: stripeCustomer._id,
                    data: { 
                        email: user?.email || stripeCustomer.email,
                        status: "none" 
                    },
                });
            }
            return;
        }

        const subscription = subscriptions.data[0];

        // Get billing period information from the first subscription item
        const subscriptionItem = subscription.items.data[0];
        const priceId = subscription.items.data[0].price.id;
        const subscriptionPeriod = getSubscriptionPeriodFromPriceId(priceId);

        const subData = {
            email: user?.email || stripeCustomer.email,
            subscriptionPeriod: subscriptionPeriod,
            subscriptionId: subscription.id,
            status: subscription.status,
            priceId: priceId,
            currentPeriodEnd: subscriptionItem.current_period_end,
            currentPeriodStart: subscriptionItem.current_period_start,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            paymentMethod:
                subscription.default_payment_method &&
                typeof subscription.default_payment_method !== "string"
                    ? {
                          brand:
                              subscription.default_payment_method.card?.brand ??
                              undefined,
                          last4:
                              subscription.default_payment_method.card?.last4 ??
                              undefined,
                      }
                    : undefined,
        };

        await ctx.runMutation(internal.stripe.updateStripeCustomer, {
            _id: stripeCustomer._id,
            data: subData,
        });
    },
});

export const getStripeCustomer = internalQuery({
    args: { stripeCustomerId: v.string() },
    handler: async (ctx, { stripeCustomerId }) => {
        return await ctx.db
            .query("stripeCustomers")
            .withIndex("by_stripeCustomerId", (q) =>
                q.eq("stripeCustomerId", stripeCustomerId),
            )
            .unique();
    },
});

export const updateStripeCustomer = internalMutation({
    args: {
        _id: v.id("stripeCustomers"),
        data: v.object({
            email: v.optional(v.string()),
            subscriptionPeriod: v.optional(v.string()),
            subscriptionId: v.optional(v.string()),
            status: v.optional(v.string()),
            priceId: v.optional(v.string()),
            currentPeriodEnd: v.optional(v.number()),
            currentPeriodStart: v.optional(v.number()),
            cancelAtPeriodEnd: v.optional(v.boolean()),
            paymentMethod: v.optional(
                v.object({
                    brand: v.optional(v.string()),
                    last4: v.optional(v.string()),
                }),
            ),
            // Added lifetime license fields
            has_lifetime_license: v.optional(v.boolean()),
            lifetime_license_platform: v.optional(v.string()),
            lifetime_license_purchase_date: v.optional(v.number()),
            lifetime_license_order_id: v.optional(v.string()),
        }),
    },
    handler: async (ctx, { _id, data }) => {
        await ctx.db.patch(_id, data);
    },
});

export const getUserByAuthId = internalQuery({
    args: { authId: v.string() },
    handler: async (ctx, { authId }) => {
        return await ctx.db
            .query("users")
            .withIndex("by_auth_id", (q) => q.eq("auth_id", authId))
            .unique();
    },
});

export const getStripeCustomerByUserId = internalQuery({
    args: { userId: v.id("users") },
    handler: async (ctx, { userId }) => {
        return await ctx.db
            .query("stripeCustomers")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .unique();
    },
});

export const createStripeCustomer = internalMutation({
    args: {
        userId: v.id("users"),
        stripeCustomerId: v.string(),
        email: v.string(),
        subscriptionPeriod: v.optional(v.string()),
    },
    handler: async (ctx, { userId, stripeCustomerId, email, subscriptionPeriod }) => {
        await ctx.db.insert("stripeCustomers", {
            userId,
            stripeCustomerId,
            email,
            subscriptionPeriod,
        });
    },
});

export const updateUserLifetimeLicense = internalMutation({
    args: {
        stripeCustomerId: v.string(),
        paymentIntentId: v.string(),
        purchaseDate: v.number(),
    },
    handler: async (
        ctx,
        { stripeCustomerId, paymentIntentId, purchaseDate },
    ) => {
        // Find the stripe customer record
        const stripeCustomer = await ctx.db
            .query("stripeCustomers")
            .withIndex("by_stripeCustomerId", (q) =>
                q.eq("stripeCustomerId", stripeCustomerId),
            )
            .unique();

        if (!stripeCustomer) {
            throw new Error("Stripe customer not found");
        }

        // Update the stripeCustomer's lifetime license fields instead of user
        await ctx.db.patch(stripeCustomer._id, {
            has_lifetime_license: true,
            lifetime_license_platform: "stripe",
            lifetime_license_purchase_date: purchaseDate,
            lifetime_license_order_id: paymentIntentId,
        });
    },
});

export const getSubscriptionStatus = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error(
                "You must be logged in to get subscription status.",
            );
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_auth_id", (q) => q.eq("auth_id", identity.subject))
            .unique();

        if (!user) {
            throw new Error("User not found.");
        }

        const stripeCustomer = await ctx.db
            .query("stripeCustomers")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .unique();

        if (!stripeCustomer) {
            return {
                hasSubscription: false,
                hasLifetimeLicense: false,
                status: "none",
                user: {
                    email: user.email,
                    id: user._id,
                },
            };
        }

        // Check for lifetime license in stripeCustomers table
        if (stripeCustomer.has_lifetime_license) {
            return {
                hasSubscription: false,
                hasLifetimeLicense: true,
                status: "lifetime",
                lifetimeLicense: {
                    platform: stripeCustomer.lifetime_license_platform,
                    purchaseDate: stripeCustomer.lifetime_license_purchase_date,
                    orderId: stripeCustomer.lifetime_license_order_id,
                },
                user: {
                    email: user.email,
                    id: user._id,
                },
            };
        }

        return {
            hasSubscription: !!stripeCustomer.subscriptionId,
            hasLifetimeLicense: false,
            status: stripeCustomer.status || "none",
            subscriptionId: stripeCustomer.subscriptionId,
            priceId: stripeCustomer.priceId,
            currentPeriodStart: stripeCustomer.currentPeriodStart,
            currentPeriodEnd: stripeCustomer.currentPeriodEnd,
            cancelAtPeriodEnd: stripeCustomer.cancelAtPeriodEnd,
            paymentMethod: stripeCustomer.paymentMethod,
            user: {
                email: user.email,
                id: user._id,
            },
        };
    },
});

export const getSubscriptionStatusByAuthId = query({
    args: { authId: v.string() },
    handler: async (ctx, { authId }) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_auth_id", (q) => q.eq("auth_id", authId))
            .unique();

        if (!user) {
            throw new Error("User not found.");
        }

        const stripeCustomer = await ctx.db
            .query("stripeCustomers")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .unique();

        if (!stripeCustomer) {
            return {
                hasSubscription: false,
                hasLifetimeLicense: false,
                status: "none",
                user: {
                    email: user.email,
                    id: user._id,
                },
            };
        }

        // Check for lifetime license in stripeCustomers table
        if (stripeCustomer.has_lifetime_license) {
            return {
                hasSubscription: false,
                hasLifetimeLicense: true,
                status: "lifetime",
                lifetimeLicense: {
                    platform: stripeCustomer.lifetime_license_platform,
                    purchaseDate: stripeCustomer.lifetime_license_purchase_date,
                    orderId: stripeCustomer.lifetime_license_order_id,
                },
                user: {
                    email: user.email,
                    id: user._id,
                },
            };
        }

        return {
            hasSubscription: !!stripeCustomer.subscriptionId,
            hasLifetimeLicense: false,
            status: stripeCustomer.status || "none",
            subscriptionId: stripeCustomer.subscriptionId,
            priceId: stripeCustomer.priceId,
            currentPeriodStart: stripeCustomer.currentPeriodStart,
            currentPeriodEnd: stripeCustomer.currentPeriodEnd,
            cancelAtPeriodEnd: stripeCustomer.cancelAtPeriodEnd,
            paymentMethod: stripeCustomer.paymentMethod,
            user: {
                email: user.email,
                id: user._id,
            },
        };
    },
});

export const isPremiumByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        // First find the user by email
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (!user) {
            return false;
        }

        // Then find the stripe customer record for this user
        const stripeCustomer = await ctx.db
            .query("stripeCustomers")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .first();

        if (!stripeCustomer) {
            return false;
        }

        // Check if they have a lifetime license in stripeCustomers table
        if (stripeCustomer.has_lifetime_license) {
            return true;
        }

        // Check if they have an active subscription
        // Must have active status AND current period end must be in the future
        if (stripeCustomer.status !== "active") {
            return false;
        }

        // Check if subscription hasn't expired
        const now = Date.now() / 1000; // Convert to seconds to match currentPeriodEnd
        return (stripeCustomer.currentPeriodEnd || 0) > now;
    },
});
