import { BackgroundImageSection } from "@/components/settings/BackgroundImageSection";
import { SettingsColorPicker } from "@/components/settings/SettingsColorPicker";
import { SettingsSlider } from "@/components/settings/SettingsSlider";
import SettingsToggle from "@/components/settings/SettingsToggle";
import { ThemePicker } from "@/components/settings/ThemePicker";
import { defaultSettings } from "@/stores/settingsStore";
import { Settings } from "@/types/Settings";
import { getEffectiveBackgroundSettingKey } from "@/utils/getEffectiveBackgroundSettings";
import { Dispatch, SetStateAction } from "react";
import { UpdateSetting } from "../types";

interface DesignSectionProps {
    settings: Settings;
    updateSetting: UpdateSetting;
    setIsColorDialogOpen: Dispatch<SetStateAction<boolean>>;
    setColorBeingModified: Dispatch<SetStateAction<string>>;
    setIsBackgroundImageDialogOpen: Dispatch<SetStateAction<boolean>>;
}

export const DesignSection = ({
    settings,
    updateSetting,
    setIsColorDialogOpen,
    setColorBeingModified,
    setIsBackgroundImageDialogOpen,
}: DesignSectionProps) => (
    <section id="design" className="scroll-mt-24 rounded-2xl bg-muted/40 p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Design</h2>
        <ThemePicker />
        <SettingsToggle
            label="Show Search Bar"
            description="Show the search bar in the header.\nYou can still search by typing when it's hidden."
            settingKey="showSearchBar"
            checked={settings.showSearchBar}
            defaultValue={defaultSettings.showSearchBar}
            updateSetting={updateSetting}
        />
        <SettingsToggle
            label="Show New Tab Button"
            description="Show the floating new tab button in the bottom-right corner."
            settingKey="showNewTabButton"
            checked={settings.showNewTabButton}
            defaultValue={defaultSettings.showNewTabButton}
            updateSetting={updateSetting}
        />
        <SettingsSlider
            label="Tabs & Groups Animations Speed"
            description="Lower is faster. 0 means no animations."
            settingKey="animationSpeed"
            value={settings.animationSpeed}
            defaultValue={defaultSettings.animationSpeed}
            min={0}
            max={2}
            step={0.1}
            updateSetting={updateSetting}
        />
        <SettingsSlider
            label="Tab & Group Roundness"
            description="Control the roundness of tab items and tab groups"
            settingKey="tabRoundness"
            value={settings.tabRoundness}
            defaultValue={defaultSettings.tabRoundness}
            min={0}
            max={35}
            step={1}
            updateSetting={updateSetting}
        />
        <SettingsToggle
            label="Show Scrollbar"
            description="Show the scrollbar when hovering over the tabs list"
            settingKey="showScrollbar"
            checked={settings.showScrollbar}
            defaultValue={defaultSettings.showScrollbar}
            updateSetting={updateSetting}
        />
        {settings.showScrollbar && (
            <div className="ml-12 border-l-2 border-muted-foreground/20 pl-4">
                <SettingsToggle
                    label="Always Show Scrollbar"
                    description="Always show the scrollbar when there's overflow instead of\nonly showing when hovering over the extension"
                    settingKey="alwaysShowScrollbar"
                    checked={settings.alwaysShowScrollbar && settings.showScrollbar}
                    defaultValue={defaultSettings.alwaysShowScrollbar}
                    updateSetting={updateSetting}
                    disabled={!settings.showScrollbar}
                />
            </div>
        )}
        <SettingsToggle
            label="Compact Pinned Tabs"
            description="Show pinned tabs as buttons that always stay at the top of the tab list and hide the title"
            settingKey="compactPinnedTabs"
            checked={settings.compactPinnedTabs}
            defaultValue={defaultSettings.compactPinnedTabs}
            updateSetting={updateSetting}
        />
        <SettingsColorPicker
            label="Background Color"
            description="Set a custom color or gradient"
            settingKey={getEffectiveBackgroundSettingKey("backgroundColor", { settings, forRendering: false })}
            enableSettingKey={getEffectiveBackgroundSettingKey("backgroundEnabled", { settings, forRendering: false })}
            updateSetting={updateSetting}
            setIsColorDialogOpen={setIsColorDialogOpen}
            setColorBeingModified={setColorBeingModified}
            settings={settings}
        />
        <BackgroundImageSection
            type="background"
            settings={settings}
            updateSetting={updateSetting}
            setIsBackgroundImageDialogOpen={setIsBackgroundImageDialogOpen}
            disabled={false}
        />
    </section>
);
