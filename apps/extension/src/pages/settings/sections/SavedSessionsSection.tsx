import { Button } from "@/components/ui/button";
import SettingsToggle from "@/components/settings/SettingsToggle";
import { defaultSettings } from "@/stores/settingsStore";
import { Settings } from "@/types/Settings";
import {
    handleExportSessions,
    handleImportSessionsClick,
    handleSessionsFileChange,
} from "@/utils/settingsDataHandlers";
import { RefObject } from "react";
import { UpdateSetting } from "../types";

interface SavedSessionsSectionProps {
    settings: Settings;
    updateSetting: UpdateSetting;
    sessionsFileInputRef: RefObject<HTMLInputElement | null>;
}

export const SavedSessionsSection = ({ settings, updateSetting, sessionsFileInputRef }: SavedSessionsSectionProps) => (
    <section id="saved-sessions" className="scroll-mt-24 rounded-2xl bg-muted/40 p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Saved Sessions</h2>
        <div className="mb-2 text-sm text-muted-foreground">
            Sharp Tabs automatically saves all of the tabs and tab groups that you have in each window.
            <br />
            This will save you from losing your important tabs due to crashes or other circumstances.
            <br />
            You can also import & export sessions to easily transfer your tabs/groups between browsers.
        </div>
        <SettingsToggle
            label="Auto-save sessions every 10 minutes"
            description="Automatically save your current session every 10 minutes to prevent data loss"
            settingKey="autoSaveSessionsEnabled"
            checked={settings.autoSaveSessionsEnabled}
            defaultValue={defaultSettings.autoSaveSessionsEnabled}
            updateSetting={updateSetting}
        />
        <div className="mt-6 flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
                <div className="text-sm font-semibold">Export Sessions</div>
                <div className="text-sm text-muted-foreground">Save your saved sessions to a JSON file</div>
            </div>
            <Button className="min-w-20" onClick={handleExportSessions}>
                Export
            </Button>
        </div>
        <div className="mt-6 flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
                <div className="text-sm font-semibold">Import Sessions</div>
                <div className="text-sm text-muted-foreground">Load sessions from a JSON file, will merge with existing sessions</div>
            </div>
            <Button
                className="min-w-20"
                onClick={() => {
                    handleImportSessionsClick(sessionsFileInputRef);
                }}
            >
                Import
            </Button>
            <input
                type="file"
                ref={sessionsFileInputRef}
                onChange={(e) => {
                    handleSessionsFileChange(e, sessionsFileInputRef, updateSetting);
                }}
                accept=".json"
                className="hidden"
                aria-hidden="true"
                tabIndex={-1}
            />
        </div>
    </section>
);
