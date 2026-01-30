import { CustomTooltip } from "@/components/simple/CustomTooltip";
import { Switch } from "@/components/ui/switch";
import { Settings } from "@/types/Settings";
import { HelpCircle } from "lucide-react";
import { ModifiedFeature } from "./ModifiedFeature";
import { PremiumFeature } from "./PremiumFeature";

type SettingsToggleProps = {
    label: string;
    description: string;
    settingKey: keyof Settings;
    checked: boolean;
    defaultValue?: boolean;
    updateSetting: (key: keyof Settings, value: boolean) => void;
    disabled?: boolean;
    disableHoverableDescription?: boolean;
    /** Shows premium badge - used for AI features that require premium or own API key */
    premiumFeature?: boolean;
};

const SettingsToggle: React.FC<SettingsToggleProps> = ({
    label,
    description,
    settingKey,
    checked,
    defaultValue,
    updateSetting,
    disabled = false,
    disableHoverableDescription = false,
    premiumFeature = false,
}) => {
    const handleCheckedChange = (isChecked: boolean) => {
        updateSetting(settingKey, isChecked);
    };

    const isModified = checked !== defaultValue;

    const handleContainerClick = () => {
        if (!disabled) {
            handleCheckedChange(!checked);
        }
    };

    return (
        <>
            <div
                className={`group relative mt-6 flex flex-row items-center justify-between gap-3 rounded-lg border p-3 shadow-sm ${
                    disabled ? "cursor-not-allowed" : "cursor-pointer"
                }`}
                onClick={handleContainerClick}
            >
                {premiumFeature && <PremiumFeature />}
                {isModified && defaultValue != null && <ModifiedFeature defaultValue={defaultValue} settingKey={settingKey} />}
                {disableHoverableDescription ? (
                    <div className="space-y-0.5">
                        <div className="text-sm font-semibold">{label}</div>
                        <div
                            className="text-sm text-muted-foreground"
                            dangerouslySetInnerHTML={{ __html: description.replace(/\\n/g, "\n").replace(/\n/g, "<br />") }}
                        />
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
                <div onClick={(e) => e.stopPropagation()}>
                    <Switch checked={checked} onCheckedChange={handleCheckedChange} aria-label={label} disabled={disabled} />
                </div>
            </div>
        </>
    );
};

export default SettingsToggle;
