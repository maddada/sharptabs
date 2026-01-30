import { Asterisk } from "lucide-react";
import { CustomTooltip } from "../simple/CustomTooltip";
import { useSettingsStore } from "@/stores/settingsStore";
import { Settings } from "@/types/Settings";

export function ModifiedFeature({ defaultValue, settingKey }: { defaultValue: number | boolean | null; settingKey: keyof Settings }) {
    const updateSetting = useSettingsStore((state) => state.updateSetting);
    return (
        <CustomTooltip content={`Default is ${defaultValue}`}>
            <Asterisk
                className="text-foreground-muted absolute left-[-2px] top-[-2px] h-4 w-4 cursor-pointer"
                onClick={() => {
                    updateSetting(settingKey, defaultValue);
                }}
            />
        </CustomTooltip>
    );
}
