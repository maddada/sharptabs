import dedent from "dedent";

// ============================================================================
// Models Configuration
// ============================================================================

export const GEMINI_MODELS = {
    primary: "gemini-3-flash-preview",
    fallback: "gemini-2.5-flash-lite-preview-06-17",
} as const;

// ============================================================================
// Response Schemas for Structured Output
// ============================================================================

/** Schema for organizing tabs into groups */
export const organizeTabsSchema = {
    type: "object",
    properties: {
        groups: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    color: {
                        type: "string",
                        enum: ["blue", "cyan", "green", "orange", "pink", "purple", "red", "yellow", "grey"],
                    },
                    tabIds: {
                        type: "array",
                        items: { type: "number" },
                    },
                },
                required: ["name", "color", "tabIds"],
                propertyOrdering: ["name", "color", "tabIds"],
            },
        },
    },
    required: ["groups"],
    propertyOrdering: ["groups"],
} as const;

/** Schema for naming a single group */
export const nameGroupSchema = {
    type: "object",
    properties: {
        name: { type: "string" },
        color: {
            type: "string",
            enum: ["blue", "cyan", "green", "orange", "pink", "purple", "red", "yellow", "grey"],
        },
    },
    required: ["name", "color"],
    propertyOrdering: ["name", "color"],
} as const;

/** Schema for deleting useless tabs */
export const deleteUselessTabsSchema = {
    type: "object",
    properties: {
        groups: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    reason: { type: "string" },
                    tabIds: {
                        type: "array",
                        items: { type: "number" },
                    },
                },
                required: ["reason", "tabIds"],
                propertyOrdering: ["reason", "tabIds"],
            },
        },
    },
    required: ["groups"],
    propertyOrdering: ["groups"],
} as const;

// ============================================================================
// Prompts
// ============================================================================

/** Prompt suffix for naming a group of tabs */
export const groupingPrompt = dedent`
    Suggest a name and color for this tab group.

    Rules:
    - Group name should be 1-3 words, max 14 characters
    - Color should match the branding of the main website (e.g., Asana=red, Cloudflare/Reddit=orange, Facebook/Google=blue, Shopify=green, Figma=purple)
    - If unsure about color, pick from: yellow, pink, cyan, green
`;

/** Prompt suffix for organizing tabs into groups */
export const organizingPrompt = dedent`
    Group these tabs into logical groups.

    Rules:
    - Max 14 characters per group name
    - Keep groups small: ideally 4-6 tabs, max 7 tabs per group
    - Prefer creating more specific groups over fewer large ones (e.g., "Youtube Gaming", "Youtube Music" instead of one "Youtube" group)
    - Each tab ID must appear in exactly one group
    - Sort groups alphabetically by name
    - Place ungroupable tabs in "Other" group
    - Color should match website branding (Asana=red, Reddit/Cloudflare=orange, Facebook/Google=blue, Shopify=green, Figma=purple)
    - If unsure about color, pick from: yellow, pink, cyan, green
    - ALL given tab IDs must be included, no extras
`;

/** Prompt suffix for identifying useless tabs to delete */
export const deleteUselessTabsPrompt = dedent`
    Identify useless tabs that should be deleted.

    Group by deletion reason in this order:
    1. "Error pages" - 404 errors, connection timeouts, error pages
    2. "Temporary pages" - Password reset, email verification, one-time use
    3. "Old search results" - Search engine result pages
    4. "Login pages" - Pages with /login, /signin, /signup in URL
    5. "Other" - New tab pages, blank pages, failed loads

    Rules:
    - Be conservative - only include tabs clearly matching above categories
    - ONLY use given tab IDs, no extras
    - Return empty groups array if no useless tabs found
`;

// ============================================================================
// Generation Config
// ============================================================================

/** Base generation config for Gemini API calls */
export const baseGenerationConfig = {
    thinkingConfig: {
        thinkingLevel: "MINIMAL",
    },
    mediaResolution: "MEDIA_RESOLUTION_LOW",
} as const;

// ============================================================================
// Types
// ============================================================================

export type PromptType = "organize" | "nameGroup" | "deleteUseless";

export type GeminiSchema = typeof organizeTabsSchema | typeof nameGroupSchema | typeof deleteUselessTabsSchema;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the appropriate schema and prompt suffix based on the prompt type or content
 */
export function getSchemaAndPromptSuffix(promptType: PromptType | null, promptContent: string): {
    schema: GeminiSchema | null;
    promptSuffix: string;
} {
    // Determine by explicit type first
    if (promptType === "nameGroup") {
        return { schema: nameGroupSchema, promptSuffix: groupingPrompt };
    }
    if (promptType === "organize") {
        return { schema: organizeTabsSchema, promptSuffix: organizingPrompt };
    }
    if (promptType === "deleteUseless") {
        return { schema: deleteUselessTabsSchema, promptSuffix: deleteUselessTabsPrompt };
    }

    // Fall back to detecting by prompt content
    if (promptContent.startsWith("Goal: Name and color a group of tabs")) {
        return { schema: nameGroupSchema, promptSuffix: groupingPrompt };
    }
    if (promptContent.startsWith("Goal: Organize my tabs into groups")) {
        return { schema: organizeTabsSchema, promptSuffix: organizingPrompt };
    }
    if (promptContent.startsWith("Goal: Suggest tabs that could be removed")) {
        return { schema: deleteUselessTabsSchema, promptSuffix: deleteUselessTabsPrompt };
    }

    return { schema: null, promptSuffix: "" };
}

/**
 * Build the full generation config with optional schema for structured output
 */
export function buildGenerationConfig(schema: GeminiSchema | null): Record<string, unknown> {
    const config: Record<string, unknown> = { ...baseGenerationConfig };

    if (schema) {
        config.responseMimeType = "application/json";
        config.responseSchema = schema;
    }

    return config;
}
