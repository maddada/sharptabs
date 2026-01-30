import { BackgroundImageSection } from "@/components/settings/BackgroundImageSection";
import { SettingsColorPicker } from "@/components/settings/SettingsColorPicker";
import SettingsToggle from "@/components/settings/SettingsToggle";
import { defaultSettings } from "@/stores/settingsStore";
import { Settings } from "@/types/Settings";
import { Dispatch, SetStateAction } from "react";
import { UpdateSetting } from "../types";

interface DisabledNewTabSectionProps {
    settings: Settings;
    updateSetting: UpdateSetting;
    setIsColorDialogOpen: Dispatch<SetStateAction<boolean>>;
    setColorBeingModified: Dispatch<SetStateAction<string>>;
    setIsNewTabBackgroundImageDialogOpen: Dispatch<SetStateAction<boolean>>;
}

export const DisabledNewTabSection = ({
    settings,
    updateSetting,
    setIsColorDialogOpen,
    setColorBeingModified,
    setIsNewTabBackgroundImageDialogOpen,
}: DisabledNewTabSectionProps) => (
    <section id="new-tab-page" className="scroll-mt-24 rounded-2xl bg-muted/40 p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">New Page</h2>
        <SettingsToggle
            label="Enable Sharp Tabs New Tab Page"
            description="When enabled, Sharp Tabs will show a different new tab page that allows super fast tab search and management. (highly customizable theme)"
            settingKey="enableSharpTabsNewTabPage"
            checked={settings.enableSharpTabsNewTabPage}
            defaultValue={defaultSettings.enableSharpTabsNewTabPage}
            updateSetting={updateSetting}
        />
        {settings.enableSharpTabsNewTabPage && (
            <SettingsToggle
                label="Minimal New Tabs Page"
                description="If this is enabled then when you create a new tab using sharp tabs you'll see all of the open tabs in the current window. If it's disabled you get a minimal new tabs page instead.<br />Tips: Hit Ctrl+T then escape to directly go to the search field in the new tabs page. Type ':' to see all tabs, or type to find a tab. Ctrl+L to focus the address bar"
                settingKey="minimalNewTabsPage"
                checked={settings.minimalNewTabsPage && settings.enableSharpTabsNewTabPage}
                defaultValue={defaultSettings.minimalNewTabsPage && settings.enableSharpTabsNewTabPage}
                updateSetting={updateSetting}
                disabled={!settings.enableSharpTabsNewTabPage}
            />
        )}
        {settings.enableSharpTabsNewTabPage && (
            <SettingsColorPicker
                label="New Tab Background Color"
                description="Set a custom color or gradient for new tabs"
                settingKey="newTabBackgroundColor"
                enableSettingKey="newTabBackgroundEnabled"
                updateSetting={updateSetting}
                setIsColorDialogOpen={setIsColorDialogOpen}
                setColorBeingModified={setColorBeingModified}
                settings={settings}
                disabled={!settings.enableSharpTabsNewTabPage}
            />
        )}
        {settings.enableSharpTabsNewTabPage && (
            <BackgroundImageSection
                type="newTab"
                settings={settings}
                updateSetting={updateSetting}
                setIsNewTabBackgroundImageDialogOpen={setIsNewTabBackgroundImageDialogOpen}
                disabled={!settings.enableSharpTabsNewTabPage}
            />
        )}
    </section>
);
