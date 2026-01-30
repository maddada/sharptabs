import {
    GEMINI_MODELS,
    organizeTabsSchema,
    nameGroupSchema,
    getSchemaAndPromptSuffix,
    buildGenerationConfig,
    type PromptType,
} from "@packages/shared/gemini-config";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Call Gemini API directly using user's own API key (BYOK)
 * This bypasses our backend proxy entirely
 */
export async function callGeminiDirect(apiKey: string, prompt: string, promptType: PromptType): Promise<string> {
    // Get schema and prompt suffix from shared config
    const { schema: responseSchema, promptSuffix } = getSchemaAndPromptSuffix(promptType, prompt);
    const fullPrompt = promptSuffix ? prompt + "\n\n" + promptSuffix : prompt;

    const callAPI = async (model: string) => {
        const generationConfig = buildGenerationConfig(responseSchema);

        return await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
                generationConfig,
            }),
        });
    };

    // Try primary model first (same as backend)
    let res = await callAPI(GEMINI_MODELS.primary);

    // Fallback to secondary model if first fails (same as backend)
    if (!res.ok) {
        console.log("First Gemini API call failed, retrying with fallback model...");
        await sleep(1000);
        res = await callAPI(GEMINI_MODELS.fallback);
    }

    if (!res.ok) {
        let errorMessage = "Gemini API error";
        try {
            const errorBody = await res.json();
            if (errorBody.error?.message) {
                errorMessage = errorBody.error.message;
            } else if (errorBody.error) {
                errorMessage = JSON.stringify(errorBody.error);
            }
        } catch {
            errorMessage = `Gemini API error: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMessage);
    }

    const gemini = await res.json();
    const responseText = gemini.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!responseText) {
        throw new Error("AI did not return a valid response");
    }

    // Transform structured output to match frontend expectations (same as backend)
    if (responseSchema) {
        try {
            const parsed = JSON.parse(responseText);

            if (responseSchema === nameGroupSchema) {
                // Frontend expects "name|color" format
                return `${parsed.name}|${parsed.color}`;
            } else if (responseSchema === organizeTabsSchema) {
                // Frontend expects a JSON array
                return JSON.stringify(parsed.groups);
            } else {
                // deleteUselessTabsSchema - Frontend expects a JSON array
                return JSON.stringify(parsed.groups);
            }
        } catch {
            // If parsing fails, return original response
            console.error("Failed to parse structured output");
        }
    }

    return responseText;
}
