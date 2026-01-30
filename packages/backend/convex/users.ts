import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const handleUserCreationOrLogin = mutation({
    args: {
        auth_id: v.string(),
        email: v.string(),
        email_verified: v.optional(v.boolean()),
        display_name: v.optional(v.string()),
        photo_url: v.optional(v.string()),
        auth_provider: v.optional(v.string()), // "email" or "google"
        referral_source: v.optional(v.string()),
        utm_campaign: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check if user already exists
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_auth_id", (q) => q.eq("auth_id", args.auth_id))
            .first();

        if (existingUser) {
            // Update last_login and login_count for existing user, and update profile info if provided
            const updates: any = {
                last_login: Date.now(),
                login_count: (existingUser.login_count || 0) + 1,
                updatedAt: Date.now(),
            };

            // Update display name and photo if provided (from Google auth)
            if (args.display_name) {
                updates.display_name = args.display_name;
            }
            if (args.photo_url) {
                updates.photo_url = args.photo_url;
            }
            if (args.auth_provider) {
                updates.auth_provider = args.auth_provider;
            }

            await ctx.db.patch(existingUser._id, updates);
            return existingUser._id;
        }

        // Create new user
        const now = Date.now();
        const trialEndTime = now + 10 * 24 * 60 * 60 * 1000; // 10 days trial

        const userId = await ctx.db.insert("users", {
            auth_id: args.auth_id,
            email: args.email,
            creation_date: now,

            is_active: true,
            email_verified: args.email_verified || false,
            email_verified_at: args.email_verified ? now : undefined,
            last_login: now,

            login_count: 1,
            trial_ends_at: trialEndTime,

            onboarding_completed: false,
            onboarding_step: "welcome",

            last_active: now,

            display_name: args.display_name,
            photo_url: args.photo_url,
            auth_provider: args.auth_provider || "email",

            referral_source: args.referral_source,
            utm_campaign: args.utm_campaign,

            createdAt: now,
            updatedAt: now,
        });

        return userId;
    },
});

export const getUserByAuthId = query({
    args: { auth_id: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_auth_id", (q) => q.eq("auth_id", args.auth_id))
            .first();
    },
});

export const getUserByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();
    },
});

export const getUserById = internalQuery({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.userId);
    },
});

export const updateUser = mutation({
    args: {
        auth_id: v.string(),
        updates: v.object({
            email_verified: v.optional(v.boolean()),
            email_verified_at: v.optional(v.number()),
            last_login: v.optional(v.number()),
            login_count: v.optional(v.number()),
            last_active: v.optional(v.number()),
            onboarding_completed: v.optional(v.boolean()),
            onboarding_step: v.optional(v.string()),
            timezone: v.optional(v.string()),
            preferred_language: v.optional(v.string()),
        }),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_auth_id", (q) => q.eq("auth_id", args.auth_id))
            .first();

        if (!user) {
            throw new Error("User not found");
        }

        await ctx.db.patch(user._id, {
            ...args.updates,
            updatedAt: Date.now(),
        });

        return user._id;
    },
});

export const updateUserActivity = mutation({
    args: {
        auth_id: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_auth_id", (q) => q.eq("auth_id", args.auth_id))
            .first();

        if (!user) {
            return null;
        }

        await ctx.db.patch(user._id, {
            last_active: Date.now(),
            updatedAt: Date.now(),
        });

        return user._id;
    },
});
