import { Settings, SettingsKeys } from "@/types/Settings";

/**
 * Gets the system's current theme preference using matchMedia
 */
export const getSystemTheme = (): "light" | "dark" => {
    if (typeof window !== "undefined" && window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "dark";
};

type BackgroundSettingSuffix =
    | "backgroundEnabled"
    | "backgroundColor"
    | "backgroundImageEnabled"
    | "backgroundImageUrl"
    | "backgroundImageOpacity"
    | "backgroundImageSaturation"
    | "backgroundImageBlur"
    | "backgroundImageHue"
    | "backgroundImageContrast"
    | "backgroundImageSize"
    | "backgroundImagePositionX"
    | "backgroundImagePositionY";

type EffectiveBackgroundSettingsOptions = {
    settings: Settings;
    forRendering?: boolean; // If true, uses actual system theme for system mode
    currentSystemTheme?: "light" | "dark"; // Optional override for system theme (for React state reactivity)
};

/**
 * Returns the correct setting key based on theme mode.
 * Always uses prefixed settings (light_* or dark_*) based on the resolved theme:
 * - If themeType is "system": uses light_* or dark_* based on OS preference
 * - If themeType is "light": uses light_* settings
 * - If themeType is "dark": uses dark_* settings
 */
export const getEffectiveBackgroundSettingKey = (suffix: BackgroundSettingSuffix, options: EffectiveBackgroundSettingsOptions): SettingsKeys => {
    const { settings, forRendering = false, currentSystemTheme } = options;

    // Determine which theme to use
    let activeTheme: "light" | "dark";
    if (settings.themeType === "system") {
        activeTheme = currentSystemTheme ?? getSystemTheme();
    } else {
        activeTheme = settings.themeType; // "light" or "dark"
    }

    return `${activeTheme}_${suffix}` as SettingsKeys;
};

/**
 * Gets the value of a background setting, accounting for system theme mode.
 */
export const getEffectiveBackgroundSetting = <T>(suffix: BackgroundSettingSuffix, options: EffectiveBackgroundSettingsOptions): T => {
    const key = getEffectiveBackgroundSettingKey(suffix, options);
    return options.settings[key] as T;
};

/**
 * Returns all effective background setting keys for the current mode.
 */
export const getEffectiveBackgroundSettingKeys = (options: EffectiveBackgroundSettingsOptions) => {
    const suffixes: BackgroundSettingSuffix[] = [
        "backgroundEnabled",
        "backgroundColor",
        "backgroundImageEnabled",
        "backgroundImageUrl",
        "backgroundImageOpacity",
        "backgroundImageSaturation",
        "backgroundImageBlur",
        "backgroundImageHue",
        "backgroundImageContrast",
        "backgroundImageSize",
        "backgroundImagePositionX",
        "backgroundImagePositionY",
    ];

    return suffixes.reduce(
        (acc, suffix) => {
            acc[suffix] = getEffectiveBackgroundSettingKey(suffix, options);
            return acc;
        },
        {} as Record<BackgroundSettingSuffix, SettingsKeys>
    );
};
