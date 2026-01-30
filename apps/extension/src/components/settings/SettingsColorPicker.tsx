import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Switch } from "@/components/ui/switch";
import { Settings, SettingsKeys } from "@/types/Settings";
import { cn } from "@/utils/cn";
import { Palette, HelpCircle } from "lucide-react";
import { CustomTooltip } from "@/components/simple/CustomTooltip";

type SettingsColorPickerProps = {
    label: string;
    description: string;
    setIsColorDialogOpen: (isOpen: boolean) => void;
    setColorBeingModified: (colorKey: string) => void;
    settingKey: SettingsKeys;
    enableSettingKey: SettingsKeys | null;
    disabled?: boolean;
    settings: Settings;
    updateSetting: (key: keyof Settings, value: any) => void;
    disableHoverableDescription?: boolean;
};

export function SettingsColorPicker({
    label,
    description,
    setIsColorDialogOpen,
    setColorBeingModified,
    settingKey,
    enableSettingKey,
    settings,
    disabled = false,
    updateSetting,
    disableHoverableDescription = false,
}: SettingsColorPickerProps) {
    const isEnabled = enableSettingKey ? Boolean(settings[enableSettingKey]) : true;

    const handleContainerClick = () => {
        if (!disabled && enableSettingKey) {
            updateSetting(enableSettingKey, !isEnabled);
        }
    };

    return (
        <div className="mt-6">
            <div
                className={cn(
                    "group relative flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm",
                    disabled ? "cursor-not-allowed" : "cursor-pointer"
                )}
                onClick={handleContainerClick}
            >
                {disableHoverableDescription ? (
                    <div className="space-y-0.5">
                        <div className="text-sm font-semibold">{label}</div>
                        <div className="text-sm text-muted-foreground whitespace-pre-line">{description.replace(/\\n/g, "\n")}</div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold">{label}</div>
                        <CustomTooltip content={description.replace(/\\n/g, "\n")} side="right" alignOffset={-9} delayDuration={0} align="start">
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
                                className="h-10 w-20 rounded-md border"
                                style={{
                                    background: String(settings[settingKey]),
                                }}
                            ></div>
                        </HoverCardTrigger>
                        <HoverCardContent side="bottom" className="h-[250px] p-0">
                            <div style={{ background: String(settings[settingKey]) }} className="h-full rounded-md" />
                        </HoverCardContent>
                    </HoverCard>
                    <div
                        className={cn(
                            "flex justify-center rounded-md border-2 px-2 py-1 align-middle",
                            disabled || !isEnabled
                                ? "hover:cursor-not-allowed opacity-30 hover:bg-transparent"
                                : "hover:cursor-pointer hover:bg-neutral-500"
                        )}
                        onClick={() => {
                            if (disabled || !isEnabled) return;
                            setColorBeingModified(settingKey);
                            setIsColorDialogOpen(true);
                        }}
                    >
                        <Palette className="h-5 w-5" />
                    </div>
                    {enableSettingKey && (
                        <Switch
                            checked={disabled ? false : isEnabled}
                            disabled={disabled}
                            onCheckedChange={(checked: boolean) => {
                                if (disabled) return;
                                updateSetting(enableSettingKey, checked);
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
