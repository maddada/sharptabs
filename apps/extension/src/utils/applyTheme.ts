import { useSettingsStore } from "@/stores/settingsStore";
import { resetThemeClasses } from "./resetThemeClasses";
import { Theme, ThemeType } from "@/types/Theme";
import { getSystemTheme } from "./getEffectiveBackgroundSettings";

/**
 * Resolves the effective theme type, converting "system" to actual light/dark
 */
export const resolveThemeType = (themeType: ThemeType): "light" | "dark" => {
    if (themeType === "system") {
        return getSystemTheme();
    }
    return themeType;
};

export const applyTheme = (themeType: ThemeType | null, theme: Theme | null) => {
    const { settings } = useSettingsStore.getState();

    const rawThemeType = themeType || settings.themeType;
    const activeThemeType = window.location.href.includes("settings.html") ? "dark" : resolveThemeType(rawThemeType);
    const activeTheme = theme || settings.theme;

    if (!document.documentElement.classList.contains(activeThemeType) || !document.documentElement.classList.contains(activeTheme)) {
        resetThemeClasses();

        document.documentElement.classList.add(activeThemeType, activeTheme);
    }

    document.documentElement.style.colorScheme = activeThemeType;
    document.documentElement.style.backgroundColor = activeThemeType === "dark" ? "#0d0d0d" : "#fafafa";
    localStorage.setItem("themeType", rawThemeType);
    localStorage.setItem("theme", activeTheme);
};
