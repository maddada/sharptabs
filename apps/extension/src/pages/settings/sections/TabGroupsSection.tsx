import { SettingsColorPicker } from "@/components/settings/SettingsColorPicker";
import { SettingsSlider } from "@/components/settings/SettingsSlider";
import SettingsToggle from "@/components/settings/SettingsToggle";
import { defaultSettings } from "@/stores/settingsStore";
import { Settings } from "@/types/Settings";
import { Dispatch, SetStateAction } from "react";
import { UpdateSetting } from "../types";

interface TabGroupsSectionProps {
    settings: Settings;
    updateSetting: UpdateSetting;
    setIsColorDialogOpen: Dispatch<SetStateAction<boolean>>;
    setColorBeingModified: Dispatch<SetStateAction<string>>;
}

export const TabGroupsSection = ({
    settings,
    updateSetting,
    setIsColorDialogOpen,
    setColorBeingModified,
}: TabGroupsSectionProps) => (
    <section id="tab-groups" className="scroll-mt-24 rounded-2xl bg-muted/40 p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Tab Groups Settings</h2>
        <SettingsColorPicker
            label="Group Text Color"
            description="Set a custom color for Group Text"
            settingKey="groupTextColor"
            enableSettingKey="enableGroupTextColor"
            updateSetting={updateSetting}
            setIsColorDialogOpen={setIsColorDialogOpen}
            setColorBeingModified={setColorBeingModified}
            settings={settings}
        />
        <SettingsSlider
            label="Group Background Opacity"
            description="Set the opacity of group header backgrounds"
            settingKey="groupBgOpacity"
            value={settings.groupBgOpacity}
            defaultValue={defaultSettings.groupBgOpacity}
            min={0}
            max={100}
            step={10}
            updateSetting={updateSetting}
        />
        <SettingsToggle
            label="Groups Gradient Background"
            description="Makes the background of tab groups gradient"
            settingKey="groupsGradientBackground"
            checked={settings.groupsGradientBackground}
            defaultValue={defaultSettings.groupsGradientBackground}
            updateSetting={updateSetting}
        />
        <SettingsToggle
            label="Show Suspended Icon for Groups"
            description="Show a moon icon on suspended tab groups"
            settingKey="showDiscardedIconGroup"
            checked={settings.showDiscardedIconGroup}
            defaultValue={defaultSettings.showDiscardedIconGroup}
            updateSetting={updateSetting}
        />
        <SettingsToggle
            label="Outline Style"
            description="A different design for tab groups"
            settingKey="outlineGroups"
            checked={settings.outlineGroups}
            defaultValue={defaultSettings.outlineGroups}
            updateSetting={updateSetting}
        />
        <SettingsToggle
            label="Show Tooltip for Long Group Titles"
            description="Display the full group name as a tooltip when hovering over the group header"
            settingKey="showGroupTitleTooltip"
            checked={settings.showGroupTitleTooltip}
            defaultValue={defaultSettings.showGroupTitleTooltip}
            updateSetting={updateSetting}
        />
        <SettingsToggle
            label="Show Number of Tabs in a Tab Group"
            description="Display the tab count in the group header"
            settingKey="showGroupTabCount"
            checked={settings.showGroupTabCount}
            defaultValue={defaultSettings.showGroupTabCount}
            updateSetting={updateSetting}
        />
        {settings.showGroupTabCount && (
            <div className="ml-12 border-l-2 border-muted-foreground/20 pl-4">
                <SettingsToggle
                    label="Highlight High Tab Count"
                    description="Show tab count in red when a group has many tabs"
                    settingKey="highlightHighTabCountEnabled"
                    checked={settings.highlightHighTabCountEnabled}
                    defaultValue={defaultSettings.highlightHighTabCountEnabled}
                    updateSetting={updateSetting}
                />
            </div>
        )}
        {settings.highlightHighTabCountEnabled && settings.showGroupTabCount && (
            <div className="ml-12 border-l-2 border-muted-foreground/20 pl-4">
                <SettingsSlider
                    label="Tab Count Threshold"
                    description="Number of tabs to show red color in the group title"
                    settingKey="highlightHighTabCountThreshold"
                    value={settings.highlightHighTabCountThreshold}
                    defaultValue={defaultSettings.highlightHighTabCountThreshold}
                    min={5}
                    max={30}
                    step={1}
                    updateSetting={updateSetting}
                    disabled={!settings.highlightHighTabCountEnabled}
                />
            </div>
        )}
        <SettingsToggle
            label="Automatically collapse original browser tab groups"
            description="Chrome/Edge groups are collapsed every 5 seconds to maintain a clean browser interface.\nOnly happens when the sidebar is open."
            disableHoverableDescription={true}
            settingKey="keepChromeTabGroupsCollapsed"
            checked={settings.keepChromeTabGroupsCollapsed}
            defaultValue={defaultSettings.keepChromeTabGroupsCollapsed}
            updateSetting={updateSetting}
        />
    </section>
);
