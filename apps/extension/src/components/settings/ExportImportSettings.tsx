import { Button } from "@/components/ui/button";
import React, { RefObject } from "react";

interface ExportImportSettingsProps {
    handleExportSettings: () => void;
    handleImportClick: (fileInputRef: RefObject<HTMLInputElement | null>) => void;
    handleFileChange: (
        e: React.ChangeEvent<HTMLInputElement>,
        fileInputRef: RefObject<HTMLInputElement | null>,
        updateSettings: (newSettings: any) => void
    ) => void;
    fileInputRef: RefObject<HTMLInputElement | null>;
    updateSettings: (newSettings: any) => void;
}

export const ExportImportSettings: React.FC<ExportImportSettingsProps> = ({
    handleExportSettings,
    handleImportClick,
    handleFileChange,
    fileInputRef,
    updateSettings,
}) => {
    return (
        <>
            <div className="mt-6 flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                    <div className="text-sm font-semibold">Export Settings</div>
                    <div className="text-sm text-muted-foreground">Save your current settings to a JSON file</div>
                </div>
                <Button className="min-w-20" onClick={handleExportSettings}>
                    Export
                </Button>
            </div>
            <div className="mt-6 flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                    <div className="text-sm font-semibold">Import Settings</div>
                    <div className="text-sm text-muted-foreground">Load settings from a JSON file, this will overwrite current settings</div>
                </div>
                <Button
                    className="min-w-20"
                    onClick={() => {
                        handleImportClick(fileInputRef);
                    }}
                >
                    Import
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                        handleFileChange(e, fileInputRef, updateSettings);
                    }}
                    accept=".json"
                    className="hidden"
                    aria-hidden="true"
                    tabIndex={-1}
                />
            </div>
        </>
    );
};
