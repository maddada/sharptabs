import { SettingsColorPicker } from "@/components/settings/SettingsColorPicker";
import { SettingsSlider } from "@/components/settings/SettingsSlider";
import SettingsToggle from "@/components/settings/SettingsToggle";
import { defaultSettings } from "@/stores/settingsStore";
import { Settings } from "@/types/Settings";
import { Dispatch, SetStateAction } from "react";
import { UpdateSetting } from "../types";

interface TabsSettingsSectionProps {
    settings: Settings;
    updateSetting: UpdateSetting;
    setIsColorDialogOpen: Dispatch<SetStateAction<boolean>>;
    setColorBeingModified: Dispatch<SetStateAction<string>>;
}

export const TabsSettingsSection = ({
    settings,
    updateSetting,
    setIsColorDialogOpen,
    setColorBeingModified,
}: TabsSettingsSectionProps) => (
    <section id="tabs" className="scroll-mt-24 rounded-2xl bg-muted/40 p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Tabs Settings</h2>
        <SettingsColorPicker
            label="Tab Text Color"
            description="Set a custom color for Tab Text"
            settingKey="tabTextColor"
            enableSettingKey="enableTabTextColor"
            updateSetting={updateSetting}
            setIsColorDialogOpen={setIsColorDialogOpen}
            setColorBeingModified={setColorBeingModified}
            settings={settings}
        />
        <SettingsSlider
            label="Font Size"
            description="Set the font size of the tabs and tab group headers"
            settingKey="fontSize"
            value={settings.fontSize}
            defaultValue={defaultSettings.fontSize}
            min={1}
            max={24}
            step={1}
            updateSetting={updateSetting}
        />

        <SettingsSlider
            label="Tab Height"
            description="Set the height of tabs and tab group headers"
            settingKey="tabHeight"
            value={settings.tabHeight}
            defaultValue={defaultSettings.tabHeight}
            min={16}
            max={70}
            step={1}
            updateSetting={updateSetting}
        />
        <SettingsToggle
            label="Show Close Button on Hover"
            description="You can close with the middle mouse button"
            settingKey="showCloseButton"
            checked={settings.showCloseButton}
            defaultValue={defaultSettings.showCloseButton}
            updateSetting={updateSetting}
        />
        <SettingsToggle
            label="Disable middle click and close button on pinned tabs"
            description="Prevent accidental closing of pinned tabs by disabling middle click and hiding the close button.\nPinned tabs can still be closed via the context menu or by unpinning first."
            settingKey="disableMiddleClickAndCloseButtonOnPinnedTabs"
            checked={settings.disableMiddleClickAndCloseButtonOnPinnedTabs}
            defaultValue={defaultSettings.disableMiddleClickAndCloseButtonOnPinnedTabs}
            updateSetting={updateSetting}
        />
        <SettingsToggle
            label="Hide pin button on pinned tabs"
            description="Hide the pin icon that appears on pinned tabs.\nTabs can still be unpinned via the context menu."
            settingKey="hidePinButtonOnPinnedTabs"
            checked={settings.hidePinButtonOnPinnedTabs}
            defaultValue={defaultSettings.hidePinButtonOnPinnedTabs}
            updateSetting={updateSetting}
        />
        <SettingsToggle
            label="Show Suspended Icon for Tabs"
            description="Show a moon icon on suspended tabs"
            settingKey="showDiscardedIcon"
            checked={settings.showDiscardedIcon}
            defaultValue={defaultSettings.showDiscardedIcon}
            updateSetting={updateSetting}
        />
        <SettingsToggle
            label="Fade Suspended Tab Text"
            description="Reduce opacity of suspended tab text to make them less prominent"
            settingKey="fadeSuspendedTabText"
            checked={settings.fadeSuspendedTabText}
            defaultValue={defaultSettings.fadeSuspendedTabText}
            updateSetting={updateSetting}
        />
        <SettingsToggle
            label="Show title tooltips when hovering over tabs"
            description="Allows you to read the full title by hovering"
            settingKey="showTitleInTooltips"
            checked={settings.showTitleInTooltips}
            defaultValue={defaultSettings.showTitleInTooltips}
            updateSetting={updateSetting}
        />
        <SettingsToggle
            label="Show URL in tooltips when hovering over tabs"
            description="Allows you to read the full URL by hovering"
            settingKey="showUrlInTooltips"
            checked={settings.showUrlInTooltips}
            defaultValue={defaultSettings.showUrlInTooltips}
            updateSetting={updateSetting}
        />
        <SettingsToggle
            label="Middle click on sidebar/group titles opens new tab"
            description="Allows you to quickly open a new tab by middle clicking on a the sidebar or a group's title"
            settingKey="middleClickOpensNewTab"
            checked={settings.middleClickOpensNewTab}
            defaultValue={defaultSettings.middleClickOpensNewTab}
            updateSetting={updateSetting}
        />
        <SettingsToggle
            label="Show tab notification indicators on the favicon"
            description="Display notification badges and indicators on tab favicons"
            settingKey="showFaviconNotifications"
            checked={settings.showFaviconNotifications}
            defaultValue={defaultSettings.showFaviconNotifications}
            updateSetting={updateSetting}
        />
        <SettingsColorPicker
            label="Shadow Behind Tab Favicons"
            description="Make Favicons easier to see"
            settingKey="shadowColor"
            enableSettingKey="shadowForTabFavicon"
            updateSetting={updateSetting}
            setIsColorDialogOpen={setIsColorDialogOpen}
            setColorBeingModified={setColorBeingModified}
            settings={settings}
        />
        {settings.backgroundForTabFavicon === true && (
            <SettingsColorPicker
                label="Background Behind Tab Favicons"
                description="Makes Tab Favicons have a background"
                settingKey="faviconBackgroundColor"
                enableSettingKey="backgroundForTabFavicon"
                updateSetting={updateSetting}
                setIsColorDialogOpen={setIsColorDialogOpen}
                setColorBeingModified={setColorBeingModified}
                settings={settings}
            />
        )}
    </section>
);
