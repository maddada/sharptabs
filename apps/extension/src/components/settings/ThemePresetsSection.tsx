import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Settings } from "@/types/Settings";
import { cn } from "@/utils/cn";
import { getSystemTheme } from "@/utils/getEffectiveBackgroundSettings";
import { THEME_PRESETS } from "./themePresets/themePresets";
import { capitalize } from "lodash-es";
import { Moon, Save, Sun } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface ThemePresetsSectionProps {
    settings: Settings;
    updateSetting: (key: keyof Settings, value: any) => void;
}
// Built-in presets apply to the mode-prefixed keys based on the preset's themeType.
const applyConfiguration = (configuration: Partial<Settings>, updateSetting: (key: keyof Settings, value: any) => void) => {
    // Determine which mode's prefixed settings to update based on the preset's themeType
    const targetMode = configuration.themeType === "light" ? "light" : "dark";
    const prefix = `${targetMode}_`;

    // Apply non-background settings
    if (configuration.theme !== undefined) updateSetting("theme", configuration.theme);
    if (configuration.groupBgOpacity !== undefined) updateSetting("groupBgOpacity", configuration.groupBgOpacity);

    // Apply background settings to the appropriate prefixed keys
    const bgSettingKeys = [
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

    bgSettingKeys.forEach((key) => {
        if (configuration[key as keyof Settings] !== undefined) {
            updateSetting(`${prefix}${key}` as keyof Settings, configuration[key as keyof Settings]);
        }
    });

    // Apply new tab background settings (these are not mode-specific)
    const newTabBgKeys = [
        "newTabBackgroundImageEnabled",
        "newTabBackgroundImageUrl",
        "newTabBackgroundImageOpacity",
        "newTabBackgroundImageSaturation",
        "newTabBackgroundImageBlur",
        "newTabBackgroundImageHue",
        "newTabBackgroundImageContrast",
        "newTabBackgroundImageSize",
        "newTabBackgroundImagePositionX",
        "newTabBackgroundImagePositionY",
    ];

    newTabBgKeys.forEach((key) => {
        if (configuration[key as keyof Settings] !== undefined) {
            updateSetting(key as keyof Settings, configuration[key as keyof Settings]);
        }
    });

    // Apply themeType separately to avoid a race condition bug
    setTimeout(() => {
        updateSetting("themeType", configuration.themeType);
    }, 300);
};

// Helper function to render configuration details
const renderConfigurationDetails = (config: Partial<Settings>) => (
    <table className="w-full text-base drop-shadow-md">
        <tbody>
            <tr>
                <td className="pr-2 font-medium">Theme Type:</td>
                <td>{capitalize(config.themeType)}</td>
            </tr>
            <tr>
                <td className="pr-2 font-medium">Color:</td>
                <td>{capitalize(config.theme)}</td>
            </tr>
            <tr>
                <td className="pr-2 font-medium">Group BG Opacity:</td>
                <td>{config.groupBgOpacity ?? 0}%</td>
            </tr>
            <tr>
                <td className="pr-2 font-medium">BG Image Enabled:</td>
                <td>{config.backgroundImageEnabled ? "Yes" : "No"}</td>
            </tr>
            <tr>
                <td className="pr-2 font-medium">BG Image Opacity:</td>
                <td>{config.backgroundImageOpacity ? config.backgroundImageOpacity * 100 : 0}%</td>
            </tr>
            <tr>
                <td className="pr-2 font-medium">BG Image Saturation:</td>
                <td>{config.backgroundImageSaturation ? config.backgroundImageSaturation * 100 : 0}%</td>
            </tr>
            <tr>
                <td className="pr-2 font-medium">BG Image Blur:</td>
                <td>{config.backgroundImageBlur}</td>
            </tr>
        </tbody>
    </table>
);

// Reusable PresetCard component
interface PresetCardProps {
    configuration: Partial<Settings>;
    title?: string;
    isUserSaved?: boolean;
    onClick: () => void;
}

const PresetCard: React.FC<PresetCardProps> = ({ configuration, title, isUserSaved = false, onClick }) => (
    <HoverCard openDelay={300}>
        <HoverCardTrigger asChild className="cursor-pointer" onClick={onClick}>
            <div
                className={cn("h-10 w-20 rounded-md border bg-cover bg-center", isUserSaved && "ring-2 ring-blue-500")}
                style={{
                    overflow: "hidden",
                    backgroundImage: `url(${configuration.backgroundImageUrl}?h=300&w=432)`,
                    filter: `hue-rotate(${configuration.backgroundImageHue}deg) saturate(${configuration.backgroundImageSaturation})`,
                }}
                aria-label={title}
            />
        </HoverCardTrigger>
        <HoverCardContent
            side="bottom"
            className="h-fit p-0"
            style={{
                overflow: "hidden",
                backgroundImage: `url(${configuration.backgroundImageUrl}?h=300&w=432)`,
                filter: `hue-rotate(${configuration.backgroundImageHue}deg) saturate(${configuration.backgroundImageSaturation})`,
            }}
        >
            <div className={cn("p-4 text-base font-semibold drop-shadow-md", configuration.themeType === "light" ? "text-black" : "text-white")}>
                {title && <div className="mb-2 text-base font-bold">{title}</div>}
                {renderConfigurationDetails(configuration)}
            </div>
        </HoverCardContent>
    </HoverCard>
);

// Helper to get the current effective mode (light or dark)
const getCurrentMode = (settings: Settings): "light" | "dark" => {
    if (settings.themeType === "system") {
        return getSystemTheme();
    }
    return settings.themeType;
};

export const ThemePresetsSection: React.FC<ThemePresetsSectionProps> = ({ settings, updateSetting }) => {
    const currentMode = getCurrentMode(settings);
    const isLightMode = currentMode === "light";

    const saveCurrentPreset = () => {
        // Save the prefixed settings for the current mode
        const prefix = currentMode === "light" ? "light_" : "dark_";

        const currentPreset = {
            themeType: currentMode,
            theme: settings.theme,
            groupBgOpacity: settings.groupBgOpacity,

            backgroundEnabled: settings[`${prefix}backgroundEnabled` as keyof Settings],
            backgroundColor: settings[`${prefix}backgroundColor` as keyof Settings],
            backgroundImageEnabled: settings[`${prefix}backgroundImageEnabled` as keyof Settings],
            backgroundImageUrl: settings[`${prefix}backgroundImageUrl` as keyof Settings],
            backgroundImageOpacity: settings[`${prefix}backgroundImageOpacity` as keyof Settings],
            backgroundImageSaturation: settings[`${prefix}backgroundImageSaturation` as keyof Settings],
            backgroundImageBlur: settings[`${prefix}backgroundImageBlur` as keyof Settings],
            backgroundImageHue: settings[`${prefix}backgroundImageHue` as keyof Settings],
            backgroundImageContrast: settings[`${prefix}backgroundImageContrast` as keyof Settings],
            backgroundImageSize: settings[`${prefix}backgroundImageSize` as keyof Settings],
            backgroundImagePositionX: settings[`${prefix}backgroundImagePositionX` as keyof Settings],
            backgroundImagePositionY: settings[`${prefix}backgroundImagePositionY` as keyof Settings],

            newTabBackgroundImageEnabled: settings.newTabBackgroundImageEnabled,
            newTabBackgroundImageUrl: settings.newTabBackgroundImageUrl,
            newTabBackgroundImageOpacity: settings.newTabBackgroundImageOpacity,
            newTabBackgroundImageSaturation: settings.newTabBackgroundImageSaturation,
            newTabBackgroundImageBlur: settings.newTabBackgroundImageBlur,
            newTabBackgroundImageHue: settings.newTabBackgroundImageHue,
            newTabBackgroundImageContrast: settings.newTabBackgroundImageContrast,
            newTabBackgroundImageSize: settings.newTabBackgroundImageSize,
            newTabBackgroundImagePositionX: settings.newTabBackgroundImagePositionX,
            newTabBackgroundImagePositionY: settings.newTabBackgroundImagePositionY,
        };

        const presetKey = isLightMode ? "savedThemePresetLight" : "savedThemePresetDark";
        updateSetting(presetKey, JSON.stringify(currentPreset));
        toast.success(`${isLightMode ? "Light" : "Dark"} theme preset saved!`);
    };

    const applySavedPreset = (mode: "light" | "dark") => {
        const presetKey = mode === "light" ? "savedThemePresetLight" : "savedThemePresetDark";
        const presetJson = settings[presetKey];
        if (!presetJson) return;

        try {
            const savedPreset = JSON.parse(presetJson);
            applyConfigurationForMode(savedPreset, updateSetting, mode);
            toast.success(`${mode === "light" ? "Light" : "Dark"} theme preset applied!`);
        } catch (error) {
            toast.error("Error applying saved preset");
            console.log("Error parsing saved preset:", error);
        }
    };

    // Apply configuration to the specific mode's prefixed settings
    const applyConfigurationForMode = (
        configuration: Partial<Settings>,
        updateSetting: (key: keyof Settings, value: any) => void,
        mode: "light" | "dark"
    ) => {
        const prefix = `${mode}_`;

        // Apply non-background settings
        if (configuration.theme !== undefined) updateSetting("theme", configuration.theme);
        if (configuration.groupBgOpacity !== undefined) updateSetting("groupBgOpacity", configuration.groupBgOpacity);

        // Apply background settings to the appropriate prefixed keys
        const bgSettingKeys = [
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

        bgSettingKeys.forEach((key) => {
            if (configuration[key as keyof Settings] !== undefined) {
                updateSetting(`${prefix}${key}` as keyof Settings, configuration[key as keyof Settings]);
            }
        });

        // Apply new tab background settings (these are not mode-specific)
        const newTabBgKeys = [
            "newTabBackgroundImageEnabled",
            "newTabBackgroundImageUrl",
            "newTabBackgroundImageOpacity",
            "newTabBackgroundImageSaturation",
            "newTabBackgroundImageBlur",
            "newTabBackgroundImageHue",
            "newTabBackgroundImageContrast",
            "newTabBackgroundImageSize",
            "newTabBackgroundImagePositionX",
            "newTabBackgroundImagePositionY",
        ];

        newTabBgKeys.forEach((key) => {
            if (configuration[key as keyof Settings] !== undefined) {
                updateSetting(key as keyof Settings, configuration[key as keyof Settings]);
            }
        });

        // Apply themeType separately to avoid a race condition bug
        setTimeout(() => {
            updateSetting("themeType", mode);
        }, 300);
    };

    const parsedSavedPresetLight = settings.savedThemePresetLight
        ? (() => {
              try {
                  return JSON.parse(settings.savedThemePresetLight);
              } catch {
                  return null;
              }
          })()
        : null;

    const parsedSavedPresetDark = settings.savedThemePresetDark
        ? (() => {
              try {
                  return JSON.parse(settings.savedThemePresetDark);
              } catch {
                  return null;
              }
          })()
        : null;

    return (
        <div className="relative mt-6">
            <div className="flex flex-row items-center gap-4 rounded-lg border p-3 shadow-sm">
                <div className="flex basis-auto flex-col items-center gap-2">
                    <Button variant="outline" size="sm" onClick={saveCurrentPreset} className="flex h-10 items-center gap-2">
                        <Save className="h-4 w-4" />
                        {isLightMode ? (
                            <>
                                <Sun className="h-3 w-3" /> Save Light
                            </>
                        ) : (
                            <>
                                <Moon className="h-3 w-3" /> Save Dark
                            </>
                        )}
                    </Button>
                    <div className="flex gap-2">
                        {parsedSavedPresetLight && (
                            <div className="flex flex-col items-center gap-1">
                                <PresetCard
                                    configuration={parsedSavedPresetLight}
                                    title="Light Preset"
                                    isUserSaved={true}
                                    onClick={() => applySavedPreset("light")}
                                />
                                <Sun className="h-3 w-3 text-muted-foreground" />
                            </div>
                        )}
                        {parsedSavedPresetDark && (
                            <div className="flex flex-col items-center gap-1">
                                <PresetCard
                                    configuration={parsedSavedPresetDark}
                                    title="Dark Preset"
                                    isUserSaved={true}
                                    onClick={() => applySavedPreset("dark")}
                                />
                                <Moon className="h-3 w-3 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-row flex-wrap gap-2">
                    {THEME_PRESETS.map((configuration, index) => (
                        <PresetCard
                            key={index}
                            configuration={configuration.configuration}
                            title={configuration.name}
                            onClick={() => applyConfiguration(configuration.configuration, updateSetting)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
