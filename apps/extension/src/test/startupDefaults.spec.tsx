import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { useResetPremiumFeatures } from "@/components/tabs-manager/hooks/useResetPremiumFeatures";
import { defaultSettings, useSettingsStore } from "@/stores/settingsStore";

const authState = vi.hoisted(() => ({ user: null, loading: false }));
vi.mock("@/stores/authStore", () => ({
    useAuthStore: (selector: (state: typeof authState) => unknown) => selector(authState),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.stubGlobal("chrome", { storage: { local: { set: vi.fn() } } });
    authState.loading = false;
    useSettingsStore.setState({ settings: { ...defaultSettings } });
});

afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe("new-user defaults", () => {
    it("initializes strict duplicate checking on in storage", () => {
        expect(defaultSettings.strictDuplicateChecking).toBe(true);
        useSettingsStore.getState().initChromeStoreToDefault();
        expect(chrome.storage.local.set).toHaveBeenCalledWith(
            expect.objectContaining({ strictDuplicateChecking: true }),
            expect.any(Function),
        );
    });

    it("preserves an existing user's explicit non-strict preference", () => {
        useSettingsStore.getState().setSettings({ ...defaultSettings, strictDuplicateChecking: false });
        expect(useSettingsStore.getState().settings.strictDuplicateChecking).toBe(false);
    });

    it("silently resets unavailable AI features on startup and subsequent checks", () => {
        renderHook(() => {
            const { settings } = useSettingsStore();
            useResetPremiumFeatures(false, false, settings);
        });
        act(() => vi.advanceTimersByTime(60_000));
        expect(useSettingsStore.getState().settings).toMatchObject({
            aiAutoOrganizeTabs: false,
            aiPromptToOrganize: false,
            aiAutoGroupNaming: false,
            aiAutoCleaner: false,
            strictDuplicateChecking: true,
        });
        expect(toast.error).not.toHaveBeenCalled();
    });

    it.each(["premium", "own key", "subscription loading", "auth loading"])("does not disable AI for %s", (scenario) => {
        authState.loading = scenario === "auth loading";
        const settings = { ...defaultSettings, geminiApiKey: scenario === "own key" ? "test-key" : "" };
        useSettingsStore.setState({ settings });
        renderHook(() => useResetPremiumFeatures(scenario === "subscription loading", scenario === "premium", settings));
        expect(chrome.storage.local.set).not.toHaveBeenCalled();
        expect(useSettingsStore.getState().settings.aiPromptToOrganize).toBe(true);
        expect(toast.error).not.toHaveBeenCalled();
    });
});
