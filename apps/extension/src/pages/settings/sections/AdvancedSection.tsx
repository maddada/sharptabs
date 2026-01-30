import { CustomCssInput } from "@/components/settings/CustomCssInput";
import { ExportImportSettings } from "@/components/settings/ExportImportSettings";
import { SettingsSyncCloud } from "@/components/settings/SettingsSyncCloud";
import SettingsToggle from "@/components/settings/SettingsToggle";
import { Button } from "@/components/ui/button";
import { defaultSettings } from "@/stores/settingsStore";
import { Settings } from "@/types/Settings";
import {
    handleExportSettings,
    handleFileChange,
    handleImportClick,
    handleLoadFromSync,
    handleSaveToSync,
} from "@/utils/settingsDataHandlers";
import { RefObject } from "react";
import { UpdateSetting, UpdateSettings } from "../types";

interface AdvancedSectionProps {
    settings: Settings;
    updateSetting: UpdateSetting;
    updateSettings: UpdateSettings;
    fileInputRef: RefObject<HTMLInputElement | null>;
}

export const AdvancedSection = ({ settings, updateSetting, updateSettings, fileInputRef }: AdvancedSectionProps) => (
    <section id="advanced" className="scroll-mt-24 rounded-2xl bg-muted/40 p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Advanced</h2>
        <div className="mt-4 items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
                <label htmlFor="newTabLink" className="text-sm font-medium">
                    New Tab Link
                </label>
                <div className="flex gap-1">
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        onClick={() => updateSetting("newTabLink", "chrome://newtab")}
                    >
                        Common
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        onClick={() => updateSetting("newTabLink", "chrome://new-tab-page")}
                    >
                        Chrome
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        onClick={() => updateSetting("newTabLink", "edge://newtab")}
                    >
                        Edge
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        onClick={() =>
                            updateSetting(
                                "newTabLink",
                                "chrome://vivaldi-webui/startpage?section=Speed-dials&background-color=#1f1f1f"
                            )
                        }
                    >
                        Vivaldi
                    </Button>
                </div>
            </div>
            <div className="mb-2 text-sm text-muted-foreground">The URL to open when creating new tabs.</div>
            <input
                id="newTabLink"
                name="newTabLink"
                type="url"
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={settings.newTabLink || ""}
                onChange={(e) => updateSetting("newTabLink", e.target.value)}
                placeholder="chrome://newtab"
            />
        </div>
        <div className="mt-6 flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
                <div className="text-sm font-semibold">When closing duplicates, keep the</div>
                <div className="text-sm text-muted-foreground">Controls which duplicate tab to keep when using "Close all duplicates"</div>
            </div>
            <div className="flex gap-2">
                {(["first", "last"] as const).map((option) => (
                    <button
                        key={option}
                        className={`px-4 py-2 rounded-md capitalize ${
                            settings.duplicateCloseKeep === option ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                        }`}
                        onClick={() => updateSetting("duplicateCloseKeep", option)}
                    >
                        {option === "first" ? "First Tab" : "Last Tab"}
                    </button>
                ))}
            </div>
        </div>
        <SettingsToggle
            label="Close window when last tab is closed"
            description="Automatically close the browser window when the last tab is closed (useful for some browsers). Needs browser restart to take effect"
            settingKey="closeWindowWhenLastTabClosed"
            checked={settings.closeWindowWhenLastTabClosed}
            defaultValue={defaultSettings.closeWindowWhenLastTabClosed}
            updateSetting={updateSetting}
        />
        <ExportImportSettings
            handleExportSettings={handleExportSettings}
            handleImportClick={handleImportClick}
            handleFileChange={handleFileChange}
            fileInputRef={fileInputRef}
            updateSettings={updateSettings}
        />
        <SettingsSyncCloud
            handleSaveToSync={handleSaveToSync}
            handleLoadFromSync={() => handleLoadFromSync(updateSetting, updateSettings)}
            updateSettings={updateSettings}
        />
        <CustomCssInput settings={settings} updateSetting={updateSetting} />
    </section>
);
