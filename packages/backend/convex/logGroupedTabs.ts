import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import dedent from "dedent";

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

export const logGroupedTabs = httpAction(async (ctx, request) => {
    let body: { text: string };

    console.log("[/api/log-grouped-tabs] Request received");
    try {
        body = await request.json();
    } catch {
        return new Response("Invalid JSON body", {
            status: 400,
            headers: corsHeaders(request),
        });
    }
    if (body.text) {
        console.log(body.text);
    }

    return new Response("OK", {
        status: 200,
        headers: corsHeaders(request),
    });
});
