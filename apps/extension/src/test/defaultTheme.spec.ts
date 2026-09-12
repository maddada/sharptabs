import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { defaultSettings } from "@/stores/settingsStore";
import { getEffectiveBackgroundSetting } from "@/utils/getEffectiveBackgroundSettings";
import { applyTheme } from "@/utils/applyTheme";

beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
    });
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("style");
});

describe("default appearance", () => {
    it.each(["light", "dark"] as const)("uses a plain %s background with the system preference", (currentSystemTheme) => {
        const options = { settings: defaultSettings, currentSystemTheme };
        expect(defaultSettings.themeType).toBe("system");
        expect(getEffectiveBackgroundSetting("backgroundImageEnabled", options)).toBe(false);
        expect(getEffectiveBackgroundSetting("backgroundImageUrl", options)).toBeNull();
        expect(getEffectiveBackgroundSetting("backgroundColor", options)).toBe(currentSystemTheme === "dark" ? "#0d0d0d" : "#fafafa");
    });

    it("resolves the current OS preference before React starts, without cached settings", () => {
        vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
        const onload = readFileSync("public/assets/onload.js", "utf8");
        runInNewContext(onload, { window, document, localStorage });
        expect(document.documentElement).toHaveClass("dark", "gray");
        expect(document.documentElement.style.backgroundColor).toBe("rgb(13, 13, 13)");
    });

    it("retains system mode in the startup cache as the OS preference changes", () => {
        const matchMedia = vi.spyOn(window, "matchMedia");
        matchMedia.mockReturnValue({ matches: true } as MediaQueryList);
        applyTheme("system", "gray");
        expect(document.documentElement).toHaveClass("dark");
        expect(localStorage.getItem("themeType")).toBe("system");
        matchMedia.mockReturnValue({ matches: false } as MediaQueryList);
        applyTheme("system", "gray");
        expect(document.documentElement).toHaveClass("light");
        expect(document.documentElement).not.toHaveClass("dark");
        expect(localStorage.getItem("themeType")).toBe("system");
    });
});
