import { CustomTooltip } from "@/components/simple/CustomTooltip";
import { Slider } from "@/components/ui/slider";
import { Settings } from "@/types/Settings";
import { cn } from "@/utils/cn";
import { debounce } from "lodash-es";
import { HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { ModifiedFeature } from "./ModifiedFeature";

type SettingsSliderProps = {
    className?: string;
    label: string;
    description?: string;
    settingKey: keyof Settings;
    value: number;
    defaultValue: number;
    min: number;
    max: number;
    step: number;
    updateSetting: (key: keyof Settings, value: any) => void;
    disabled?: boolean;
    disableHoverableDescription?: boolean;
};

export function SettingsSlider({
    className,
    label,
    description,
    settingKey,
    value,
    defaultValue,
    min,
    max,
    step,
    updateSetting,
    disabled = false,
    disableHoverableDescription = false,
}: SettingsSliderProps) {
    // Local state for smooth slider dragging
    const [localValue, setLocalValue] = useState(value);

    // Debounce updateSetting to avoid UI lag, only update every 90ms
    const debouncedUpdateSetting = debounce((key: keyof Settings, val: any) => {
        updateSetting(key, val);
    }, 90);

    useEffect(() => {
        return () => {
            debouncedUpdateSetting.cancel();
        };
    }, [debouncedUpdateSetting]);

    // Sync local state if value prop changes from outside
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleValueChange = (newValue: number[]) => {
        if (disabled) return;
        setLocalValue(newValue[0]); // update UI immediately
        debouncedUpdateSetting(settingKey, newValue[0]); // update setting debounced
    };

    const isModified = localValue !== defaultValue;

    return (
        <>
            <div className={cn("group relative mt-6 flex flex-col gap-3 rounded-lg border p-3 pb-4 shadow-sm", disabled && "opacity-50", className)}>
                {isModified && <ModifiedFeature defaultValue={defaultValue} settingKey={settingKey} />}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <label className={cn("text-sm font-semibold", disabled && "text-muted-foreground")}>
                            {label}: {localValue}
                        </label>
                        {description && !disableHoverableDescription && (
                            <CustomTooltip content={description.replace(/\\n/g, "\n")} side="right" alignOffset={-9} delayDuration={0} align="start">
                                <button
                                    type="button"
                                    className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                                    aria-label="Help"
                                >
                                    <HelpCircle className="h-4 w-4" />
                                </button>
                            </CustomTooltip>
                        )}
                        {description && disableHoverableDescription && (
                            <span className={cn("text-sm text-muted-foreground whitespace-pre-line", disabled && "text-muted-foreground/50")}>
                                {description.replace(/\\n/g, "\n")}
                            </span>
                        )}
                    </div>
                </div>
                <Slider value={[localValue]} onValueChange={handleValueChange} min={min} max={max} step={step} disabled={disabled} />
            </div>
        </>
    );
}
