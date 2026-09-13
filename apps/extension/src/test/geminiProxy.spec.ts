import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { geminiProxy } from "@packages/backend/convex/geminiProxy";
import { GEMINI_MODELS } from "@packages/shared/gemini-config";

vi.mock("@packages/backend/convex/_generated/server", () => ({
    httpAction: (handler: unknown) => handler,
}));

const handler = geminiProxy as unknown as (
    ctx: { runQuery: ReturnType<typeof vi.fn> },
    request: Request,
) => Promise<Response>;
const groups = [{ name: "YouTube", color: "red", tabIds: [1, 2] }];

function successResponse() {
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ groups }) }] } }] });
}

function request() {
    return new Request("https://example.convex.site/gemini-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com", prompt: "Group YouTube tabs", promptType: "promptOrganize", userInstruction: "Group YouTube tabs" }),
    });
}

beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv("GEMINI_API_KEY", "test-key");
});

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
});

describe("Gemini proxy model routing", () => {
    it("uses 3.5 Flash-Lite with structured output and minimal thinking", async () => {
        expect(GEMINI_MODELS).toEqual({ primary: "gemini-3.5-flash-lite", fallback: "gemini-3.1-flash-lite" });
        const fetchMock = vi.fn().mockResolvedValue(successResponse());
        vi.stubGlobal("fetch", fetchMock);
        const runQuery = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce({ hasExceededLimit: false });
        const response = await handler({ runQuery }, request());
        expect(response.status).toBe(200);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toContain("/models/gemini-3.5-flash-lite:generateContent");
        expect(JSON.parse(fetchMock.mock.calls[0][1].body).generationConfig).toMatchObject({
            thinkingConfig: { thinkingLevel: "MINIMAL" },
            responseMimeType: "application/json",
            responseSchema: { required: ["groups"] },
        });
        expect(JSON.parse((await response.json()).candidates[0].content.parts[0].text)).toEqual(groups);
    });

    it("retries with 3.1 Flash-Lite if the primary fails", async () => {
        const fetchMock = vi.fn().mockResolvedValueOnce(new Response("Unavailable", { status: 503 })).mockResolvedValueOnce(successResponse());
        vi.stubGlobal("fetch", fetchMock);
        const runQuery = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce({ hasExceededLimit: false });
        const responsePromise = handler({ runQuery }, request());
        await vi.advanceTimersByTimeAsync(3000);
        const response = await responsePromise;
        expect(response.status).toBe(200);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(fetchMock.mock.calls[0][0]).toContain("/models/gemini-3.5-flash-lite:generateContent");
        expect(fetchMock.mock.calls[1][0]).toContain("/models/gemini-3.1-flash-lite:generateContent");
        expect(JSON.parse((await response.json()).candidates[0].content.parts[0].text)).toEqual(groups);
    });
});
