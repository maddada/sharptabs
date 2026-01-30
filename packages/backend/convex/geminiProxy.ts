import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import {
    GEMINI_MODELS,
    organizeTabsSchema,
    nameGroupSchema,
    deleteUselessTabsSchema,
    getSchemaAndPromptSuffix,
    buildGenerationConfig,
} from "@packages/shared/gemini-config";

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

// Helper function to delay execution
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const geminiProxy = httpAction(async (ctx, request) => {
    // Parse prompt from request
    let body: { email: string; prompt: string };
    try {
        body = await request.json();
    } catch {
        return new Response("Invalid JSON body", {
            status: 400,
            headers: corsHeaders(request),
        });
    }
    if (!body.prompt) {
        return new Response("Missing prompt", {
            status: 400,
            headers: corsHeaders(request),
        });
    }

    // Check if user is premium (use a query, not ctx.db)
    // Note: BYOK users call Gemini directly from frontend, they don't use this proxy
    const isPremium = await ctx.runQuery(api.stripe.isPremiumByEmail, {
        email: body.email,
    });

    if (!isPremium) {
        return new Response("A premium plan is required for AI features", {
            status: 403,
            headers: corsHeaders(request),
        });
    }

    // Check rate limit for premium users
    const rateLimitCheck = await ctx.runQuery(api.rateLimit.checkRateLimit, {
        email: body.email,
    });

    if (rateLimitCheck.hasExceededLimit) {
        return new Response(
            JSON.stringify({
                error: `Daily limit of ${rateLimitCheck.dailyLimit} requests exceeded. Please try again tomorrow.`,
                currentUsage: rateLimitCheck.currentUsage,
                dailyLimit: rateLimitCheck.dailyLimit,
            }),
            {
                status: 429,
                headers: {
                    "Content-Type": "application/json",
                    ...corsHeaders(request),
                },
            },
        );
    }

    // Determine the response schema and prompt suffix based on prompt content
    const { schema: responseSchema, promptSuffix } = getSchemaAndPromptSuffix(null, body.prompt);

    if (promptSuffix) {
        body.prompt = body.prompt + "\n\n" + promptSuffix;
    }

    // Check if API key is available
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY environment variable is not set");
        return new Response("Gemini API key is not configured", {
            status: 500,
            headers: corsHeaders(request),
        });
    }

    // Helper function to call Gemini API with structured output
    const callGeminiAPI = async (model: string) => {
        const generationConfig = buildGenerationConfig(responseSchema);

        return await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: body.prompt }] }],
                    generationConfig,
                }),
            },
        );
    };

    // Call Gemini AI with retry logic - first attempt with primary model
    let res = await callGeminiAPI(GEMINI_MODELS.primary);

    // If first attempt fails, retry once after 3 seconds with fallback model
    if (!res.ok) {
        console.error(
            "First Gemini API call failed, retrying in 3 seconds with fallback model...",
            res,
        );
        await sleep(3000);
        res = await callGeminiAPI(GEMINI_MODELS.fallback);
    }

    if (!res.ok) {
        console.error("Gemini API error after retry", res);

        // Try to get the actual error message from the response
        let errorMessage = "Gemini API error";
        try {
            const errorBody = await res.json();
            if (errorBody.error && errorBody.error.message) {
                errorMessage = errorBody.error.message;
            } else if (errorBody.error) {
                errorMessage = JSON.stringify(errorBody.error);
            }
        } catch {
            // If we can't parse the error, include status info
            errorMessage = `Gemini API error: ${res.status} ${res.statusText}`;
        }

        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                ...corsHeaders(request),
            },
        });
    }

    const gemini = await res.json();

    // Transform structured output to match the format frontend expects
    if (responseSchema && gemini.candidates?.[0]?.content?.parts?.[0]?.text) {
        try {
            const structuredText = gemini.candidates[0].content.parts[0].text;
            const parsed = JSON.parse(structuredText);

            let transformedText: string;

            if (responseSchema === nameGroupSchema) {
                // Frontend expects "name|color" format
                transformedText = `${parsed.name}|${parsed.color}`;
            } else if (responseSchema === organizeTabsSchema || responseSchema === deleteUselessTabsSchema) {
                // Frontend expects a JSON array, extract groups array from { groups: [...] }
                transformedText = JSON.stringify(parsed.groups);
            } else {
                transformedText = structuredText;
            }

            // Update the response text to match frontend expectations
            gemini.candidates[0].content.parts[0].text = transformedText;
        } catch (e) {
            console.error("Failed to transform structured output:", e);
            // If transformation fails, return original response
        }
    }

    return new Response(JSON.stringify(gemini), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            ...corsHeaders(request),
        },
    });
});
