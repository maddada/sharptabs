import { AutoSuspendExcludedDomains } from "@/components/settings/AutoSuspendExcludedDomains";
import { SettingsSlider } from "@/components/settings/SettingsSlider";
import SettingsToggle from "@/components/settings/SettingsToggle";
import { defaultSettings } from "@/stores/settingsStore";
import { Settings } from "@/types/Settings";
import { UpdateSetting } from "../types";

interface TabSuspendingSectionProps {
    settings: Settings;
    updateSetting: UpdateSetting;
}

export const TabSuspendingSection = ({ settings, updateSetting }: TabSuspendingSectionProps) => (
    <section id="tab-suspending" className="scroll-mt-24 rounded-2xl bg-muted/40 p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Tab Suspending</h2>
        <div className="mb-4 text-sm text-muted-foreground">
            Sharp Tabs uses Chrome's native tab discarding to suspend tabs. Suspended tabs automatically reload when you click on them. Tabs playing
            audio are never automatically suspended.
        </div>
        <SettingsToggle
            label="Enable auto suspending"
            description="Automatically suspend inactive tabs to save memory. Tabs playing media or already put to sleep by the browser are not auto suspended. You can also suspend tabs manually from the context menu or using a keyboard shortcut"
            settingKey="autoSuspendEnabled"
            checked={settings.autoSuspendEnabled}
            updateSetting={updateSetting}
        />
        {settings.autoSuspendEnabled && (
            <div className="ml-12 border-l-2 border-muted-foreground/20 pl-4">
                <SettingsSlider
                    label="Auto suspend delay (minutes)"
                    description="How long to wait before suspending inactive tabs"
                    settingKey="autoSuspendMinutes"
                    value={settings.autoSuspendMinutes}
                    defaultValue={defaultSettings.autoSuspendMinutes}
                    min={1}
                    max={120}
                    step={1}
                    updateSetting={updateSetting}
                />
                <AutoSuspendExcludedDomains settings={settings} updateSetting={updateSetting} />
                <SettingsToggle
                    label="Auto suspend pinned tabs"
                    description="Allow pinned tabs to be automatically suspended when inactive"
                    settingKey="autoSuspendPinnedTabs"
                    checked={settings.autoSuspendPinnedTabs}
                    defaultValue={defaultSettings.autoSuspendPinnedTabs}
                    updateSetting={updateSetting}
                />
                <SettingsToggle
                    label="Auto suspend side panel pages"
                    description="Allow sidebar pages to be automatically suspended when inactive"
                    settingKey="autoSuspendPanelPages"
                    checked={settings.autoSuspendPanelPages}
                    defaultValue={defaultSettings.autoSuspendPanelPages}
                    updateSetting={updateSetting}
                />
                <SettingsToggle
                    label="Auto suspend grouped tabs"
                    description="Allow grouped tabs to be automatically suspended when inactive"
                    settingKey="enableSuspendingGroupedTabs"
                    checked={settings.enableSuspendingGroupedTabs}
                    defaultValue={defaultSettings.enableSuspendingGroupedTabs}
                    updateSetting={updateSetting}
                />
            </div>
        )}
    </section>
);
