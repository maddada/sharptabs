import { Button } from "@/components/ui/button";
import React from "react";

interface SettingsSyncCloudProps {
    handleSaveToSync: () => void;
    handleLoadFromSync: (updateSettings: (settings: any) => void) => void;
    updateSettings: (settings: any) => void;
}

export const SettingsSyncCloud: React.FC<SettingsSyncCloudProps> = ({ handleSaveToSync, handleLoadFromSync, updateSettings }) => (
    <>
        <div className="mt-6 flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
                <div className="text-sm font-semibold">Save Settings to Browser Cloud Storage</div>
                <div className="text-sm text-muted-foreground">
                    Sync your settings across devices using browser cloud storage (requires being logged in on browser profile)
                </div>
            </div>
            <Button className="min-w-20" onClick={handleSaveToSync}>
                Save
            </Button>
        </div>
        <div className="mt-6 flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
                <div className="text-sm font-semibold">Load Settings from Browser Cloud Storage</div>
                <div className="text-sm text-muted-foreground">
                    Overwrite current settings with those synced to browser cloud storage (requires being logged in on browser profile)
                </div>
            </div>
            <Button className="min-w-20" onClick={() => handleLoadFromSync(updateSettings)}>
                Load
            </Button>
        </div>
    </>
);
