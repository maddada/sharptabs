import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Switch } from "@/components/ui/switch";
import { Settings, SettingsKeys } from "@/types/Settings";
import { cn } from "@/utils/cn";
import { getEffectiveBackgroundSettingKey } from "@/utils/getEffectiveBackgroundSettings";
import { Edit, HelpCircle } from "lucide-react";
import React from "react";
import { CustomTooltip } from "../simple/CustomTooltip";

type BackgroundImageType = "background" | "newTab";

type BackgroundImageSectionProps = {
    type: BackgroundImageType;
    settings: Settings;
    updateSetting: (key: keyof Settings, value: any) => void;
    disabled: boolean;
    setIsBackgroundImageDialogOpen?: (isOpen: boolean) => void;
    setIsNewTabBackgroundImageDialogOpen?: (isOpen: boolean) => void;
    disableHoverableDescription?: boolean;
};

export const BackgroundImageSection: React.FC<BackgroundImageSectionProps> = ({
    type,
    settings,
    updateSetting,
    disabled,
    setIsBackgroundImageDialogOpen,
    setIsNewTabBackgroundImageDialogOpen,
    disableHoverableDescription = false,
}) => {
    const isNewTabType = type === "newTab";

    // Get effective setting keys based on theme mode (only for non-newTab type)
    const getEffectiveKey = (
        suffix: "backgroundImageEnabled" | "backgroundImageUrl" | "backgroundImageHue" | "backgroundImageSaturation"
    ): SettingsKeys => {
        if (isNewTabType) {
            return `newTab${suffix.charAt(0).toUpperCase()}${suffix.slice(1)}` as SettingsKeys;
        }
        return getEffectiveBackgroundSettingKey(suffix, { settings, forRendering: false });
    };

    const enabledKey = getEffectiveKey("backgroundImageEnabled");
    const urlKey = getEffectiveKey("backgroundImageUrl");
    const hueKey = getEffectiveKey("backgroundImageHue");
    const saturationKey = getEffectiveKey("backgroundImageSaturation");

    const config = {
        title: isNewTabType ? "New Tab Background Image" : "Background Image",
        description: isNewTabType ? "Select a background image for new tabs" : "Select a background image from Pexels",
        enabledSettingKey: enabledKey,
        isEnabled: settings[enabledKey] as boolean,
        imageUrl: settings[urlKey] as string | null,
        hue: settings[hueKey] as number,
        saturation: settings[saturationKey] as number,
        setDialogOpen: isNewTabType ? setIsNewTabBackgroundImageDialogOpen : setIsBackgroundImageDialogOpen,
    };

    const handleContainerClick = () => {
        if (!disabled) {
            updateSetting(config.enabledSettingKey, !config.isEnabled);
        }
    };

    const isContainerDisabled = disabled;

    return (
        <div className="relative mt-6">
            <div
                className={cn(
                    "group flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm",
                    isContainerDisabled ? "cursor-not-allowed" : "cursor-pointer"
                )}
                onClick={handleContainerClick}
            >
                {disableHoverableDescription ? (
                    <div className="space-y-0.5">
                        <div className="text-sm font-semibold">{config.title}</div>
                        <div className="whitespace-pre-line text-sm text-muted-foreground">{config.description.replace(/\\n/g, "\n")}</div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold">{config.title}</div>
                        <CustomTooltip
                            content={config.description.replace(/\\n/g, "\n")}
                            side="right"
                            alignOffset={-9}
                            delayDuration={0}
                            align="start"
                        >
                            <button
                                type="button"
                                className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                                aria-label="Help"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <HelpCircle className="h-4 w-4" />
                            </button>
                        </CustomTooltip>
                    </div>
                )}
                <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                    <HoverCard openDelay={300}>
                        <HoverCardTrigger asChild>
                            <div
                                className={cn("h-10 w-20 rounded-md border bg-cover bg-center", disabled && "opacity-30 hover:cursor-not-allowed")}
                                style={{
                                    backgroundImage: `url(${config.imageUrl})`,
                                    filter: `hue-rotate(${config.hue}deg) saturate(${config.saturation})`,
                                }}
                                aria-label="Preview background image"
                            ></div>
                        </HoverCardTrigger>
                        <HoverCardContent side="bottom" className="h-[250px] p-0">
                            {config.imageUrl && (
                                <img
                                    style={{
                                        filter: `hue-rotate(${config.hue}deg) saturate(${config.saturation})`,
                                    }}
                                    src={config.imageUrl}
                                    alt="Background Preview"
                                    className="h-full w-full rounded-md object-cover"
                                />
                            )}
                        </HoverCardContent>
                    </HoverCard>
                    <div
                        className={cn(
                            "flex justify-center rounded-md border-2 px-2 py-1 align-middle hover:cursor-pointer hover:bg-neutral-500",
                            config.isEnabled && !disabled ? "" : "hover:cursor-not-allowed opacity-30 hover:bg-transparent"
                        )}
                        onClick={() => {
                            if (!config.isEnabled || disabled) return;
                            config.setDialogOpen?.(true);
                        }}
                    >
                        <Edit className="h-5 w-5" />
                    </div>
                    <Switch
                        checked={disabled ? false : config.isEnabled}
                        disabled={disabled}
                        className={cn("", disabled && " cursor-not-allowed")}
                        onCheckedChange={(checked: boolean) => {
                            if (disabled) return;
                            updateSetting(config.enabledSettingKey, checked);
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
