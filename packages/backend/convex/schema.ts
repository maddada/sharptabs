import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
    meta: defineTable({
        key: v.string(),
        value: v.string(),
        type: v.string(),
    }).index("by_key", ["key"]),

    users: defineTable({
        auth_id: v.string(),
        email: v.string(),
        creation_date: v.number(),

        // moved to stripeCustomers table
        // has_lifetime_license: v.optional(v.boolean()),
        // lifetime_license_platform: v.optional(v.string()),
        // lifetime_license_purchase_date: v.optional(v.number()),
        // lifetime_license_order_id: v.optional(v.string()),

        is_active: v.boolean(),
        email_verified: v.boolean(),
        email_verified_at: v.optional(v.number()),
        last_login: v.optional(v.number()),

        login_count: v.optional(v.number()),
        trial_ends_at: v.optional(v.number()),

        onboarding_completed: v.boolean(),
        onboarding_step: v.optional(v.string()),

        last_active: v.optional(v.number()),

        // Profile fields for Google Auth
        display_name: v.optional(v.string()),
        photo_url: v.optional(v.string()),
        auth_provider: v.optional(v.string()), // "email" or "google"

        referral_source: v.optional(v.string()),
        utm_campaign: v.optional(v.string()),

        timezone: v.optional(v.string()),
        preferred_language: v.optional(v.string()),

        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_auth_id", ["auth_id"])
        .index("by_email", ["email"])
        .index("by_creation_date", ["creation_date"]),

    stripeCustomers: defineTable({
        userId: v.id("users"),
        email: v.optional(v.string()),
        subscriptionPeriod: v.optional(v.string()), // "3months", "6months", "1year", "lifetime"
        stripeCustomerId: v.string(),
        subscriptionId: v.optional(v.string()),
        status: v.optional(v.string()), // e.g., "active", "canceled", "past_due", "lifetime"
        priceId: v.optional(v.string()),
        currentPeriodStart: v.optional(v.number()),
        currentPeriodEnd: v.optional(v.number()),
        cancelAtPeriodEnd: v.optional(v.boolean()),
        paymentMethod: v.optional(
            v.object({
                brand: v.optional(v.string()),
                last4: v.optional(v.string()),
            }),
        ),

        // Lifetime license fields moved from users table
        has_lifetime_license: v.optional(v.boolean()),
        lifetime_license_platform: v.optional(v.string()),
        lifetime_license_purchase_date: v.optional(v.number()),
        lifetime_license_order_id: v.optional(v.string()),
    })
        .index("by_userId", ["userId"])
        .index("by_stripeCustomerId", ["stripeCustomerId"])
        .index("by_lifetime_license", ["has_lifetime_license"]),

    dailyUsageTracking: defineTable({
        email: v.string(),
        date: v.string(), // Format: YYYY-MM-DD
        count: v.number(),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_email_date", ["email", "date"]),
});

export default schema;
