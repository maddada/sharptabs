import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { QueryCtx } from "./_generated/server";

const DAILY_LIMIT = 80;

// Helper function to get current daily usage
async function getDailyUsageCount(ctx: QueryCtx, email: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const usage = await ctx.db
        .query("dailyUsageTracking")
        .withIndex("by_email_date", (q) => 
            q.eq("email", email).eq("date", today)
        )
        .first();
        
    return usage ? usage.count : 0;
}

export const getCurrentDailyUsage = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        return await getDailyUsageCount(ctx, args.email);
    },
});

export const incrementDailyUsage = mutation({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const now = Date.now();
        
        const existingUsage = await ctx.db
            .query("dailyUsageTracking")
            .withIndex("by_email_date", (q) => 
                q.eq("email", args.email).eq("date", today)
            )
            .first();
            
        if (existingUsage) {
            await ctx.db.patch(existingUsage._id, {
                count: existingUsage.count + 1,
                updatedAt: now,
            });
            return existingUsage.count + 1;
        } else {
            await ctx.db.insert("dailyUsageTracking", {
                email: args.email,
                date: today,
                count: 1,
                createdAt: now,
                updatedAt: now,
            });
            return 1;
        }
    },
});

export const checkRateLimit = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const currentUsage = await getDailyUsageCount(ctx, args.email);
        return {
            currentUsage,
            dailyLimit: DAILY_LIMIT,
            hasExceededLimit: currentUsage >= DAILY_LIMIT,
            remainingUsage: Math.max(0, DAILY_LIMIT - currentUsage),
        };
    },
});