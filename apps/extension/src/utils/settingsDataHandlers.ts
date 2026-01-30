import { defaultSettings, useSettingsStore } from "@/stores/settingsStore"; // Added useSettingsStore
import { Settings } from "@/types/Settings";
import { omit } from "lodash-es";
import { toast } from "sonner";

export const handleExportSettings = () => {
    try {
        // Use chrome.storage.local.get to ensure we export the *saved* settings
        chrome.storage.local.get(defaultSettings, (savedSettings) => {
            // Exclude savedSessions from export
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { savedSessions, ...settingsToExport } = savedSettings;

            const settingsJson = JSON.stringify(settingsToExport, null, 2);
            const blob = new Blob([settingsJson], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "sharp-tabs-settings.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    } catch (error) {
        console.log("Failed to export settings:", error);
        toast.error("Failed to export settings. Please try again.");
    }
};

export const handleImportClick = (fileInputRef: React.RefObject<HTMLInputElement | null>) => {
    fileInputRef.current?.click();
};

export const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    fileInputRef: React.RefObject<HTMLInputElement | null>,
    updateSettings: (settings: Settings) => void
) => {
    const file = event.target.files?.[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== "string") {
                throw new Error("Failed to read file content.");
            }
            const importedSettings = JSON.parse(text);

            if (typeof importedSettings === "object" && importedSettings !== null) {
                // Exclude savedSessions from import - preserve existing saved sessions
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { savedSessions, ...settingsToImport } = importedSettings;

                updateSettings(settingsToImport as Settings);
                // chrome.storage.local.set(settingsToImport);
                toast.success("Settings imported successfully!");
            } else {
                throw new Error("Invalid settings file format.");
            }
        } catch (error) {
            console.log("Failed to import settings:", error);
            toast.error("Failed to import settings. Please check the file format and try again.\n" + error);
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };
    reader.onerror = (error) => {
        console.log("Failed to read file:", error);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    reader.readAsText(file);
};

export const handleSaveToSync = () => {
    const currentSettings = useSettingsStore.getState().settings;
    chrome.storage.sync.set(omit(currentSettings, "savedSessions"), () => {
        if (chrome.runtime.lastError) {
            console.log("Error saving settings to sync storage:", chrome.runtime.lastError.message);
            toast.error("Error saving settings to Google Account: " + chrome.runtime.lastError.message);
        } else {
            console.log("Settings successfully saved to sync storage.");
            toast.success("Settings successfully saved to your Google Account.");
            // Also update local storage to keep them in sync immediately
            chrome.storage.local.set(currentSettings);
        }
    });
};

export const handleLoadFromSync = (updateSetting: (key: keyof Settings, value: any) => void, updateSettings: (settings: Settings) => void) => {
    chrome.storage.sync.get(defaultSettings, (syncItems) => {
        if (chrome.runtime.lastError) {
            console.log("Error loading settings from sync storage:", chrome.runtime.lastError.message);
            toast.error("Error loading settings from Google Account: " + chrome.runtime.lastError.message);
            return;
        }

        // Basic check if sync storage actually has data different from defaults
        const syncHasData = Object.keys(syncItems).length > 0 && JSON.stringify(syncItems) !== JSON.stringify(defaultSettings);

        delete syncItems.savedSessions;

        if (syncHasData) {
            console.log("Settings successfully loaded from sync storage.");
            updateSettings(omit(syncItems, "themeType") as Settings); // Update the Zustand store
            // Also update local storage to keep them in sync immediately
            // chrome.storage.local.set(syncItems);

            setTimeout(() => {
                updateSetting("themeType", syncItems.themeType);
            }, 500);

            toast.success("Settings successfully loaded from your Google Account.");
        } else {
            console.log("No settings found in sync storage or settings match defaults.");
            toast.error("No specific settings found in your Google Account sync storage.");
        }
    });
};

export const handleExportSessions = () => {
    try {
        chrome.storage.local.get({ savedSessions: [] }, (result) => {
            const sessions = result.savedSessions;
            const sessionsJson = JSON.stringify(sessions, null, 2);
            const blob = new Blob([sessionsJson], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "sharp-tabs-sessions.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success("Sessions exported successfully!");
        });
    } catch (error) {
        console.log("Failed to export sessions:", error);
        toast.error("Failed to export sessions. Please try again.");
    }
};

export const handleImportSessionsClick = (fileInputRef: React.RefObject<HTMLInputElement | null>) => {
    fileInputRef.current?.click();
};

export const handleSessionsFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    fileInputRef: React.RefObject<HTMLInputElement | null>,
    updateSetting: (key: keyof Settings, value: any) => void
) => {
    const file = event.target.files?.[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== "string") {
                throw new Error("Failed to read file content.");
            }
            const importedSessions = JSON.parse(text);

            if (Array.isArray(importedSessions)) {
                // Get existing sessions and merge with imported ones
                chrome.storage.local.get({ savedSessions: [] }, (result) => {
                    const existingSessions = result.savedSessions || [];
                    const mergedSessions = [...existingSessions, ...importedSessions];

                    // Remove duplicates based on timestamp
                    const uniqueSessions = mergedSessions.filter(
                        (session, index, arr) => arr.findIndex((s) => s.timestamp === session.timestamp) === index
                    );

                    updateSetting("savedSessions", uniqueSessions);
                    toast.success(`Successfully imported ${importedSessions.length} sessions!`);
                });
            } else {
                throw new Error("Invalid sessions file format. Expected an array of sessions.");
            }
        } catch (error) {
            console.log("Failed to import sessions:", error);
            toast.error("Failed to import sessions. Please check the file format and try again.\n" + error);
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };
    reader.onerror = (error) => {
        console.log("Failed to read file:", error);
        toast.error("Failed to read file.");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    reader.readAsText(file);
};
