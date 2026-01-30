import { Toaster } from "@/components/ui/sonner";
import { useConsoleLoggingDisabler } from "@/hooks/useConsoleLoggingDisabler";
import { useDebouncedSetting } from "@/hooks/useDebouncedSetting";
import { useAuthStore } from "@/stores/authStore";
import { usePremiumStatus } from "@/stores/premiumStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useEffect, useRef, useState } from "react";
import { SettingsContent } from "./SettingsContent";
import { SettingsDialogs } from "./SettingsDialogs";
import { SettingsSidebar } from "./SettingsSidebar";
import { SETTINGS_SECTIONS } from "./sections";
import { useSettingsScrollSpy } from "./useSettingsScrollSpy";

export const SettingsPage = () => {
    const { settings, updateSetting, updateSettings } = useSettingsStore();
    const { user, loading, error } = useAuthStore();
    const { isPremium } = usePremiumStatus();
    const debouncedUpdateAutoOrganizePrompt = useDebouncedSetting("autoOrganizePrompt", 500);
    const [isColorDialogOpen, setIsColorDialogOpen] = useState(false);
    const [colorBeingModified, setColorBeingModified] = useState("backgroundColor");
    const [isBackgroundImageDialogOpen, setIsBackgroundImageDialogOpen] = useState(false);
    const [isNewTabBackgroundImageDialogOpen, setIsNewTabBackgroundImageDialogOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const sessionsFileInputRef = useRef<HTMLInputElement>(null);
    const [currentHotKeys, setCurrentHotKeys] = useState<chrome.commands.Command[]>([]);
    const { centeredSection, contentRef, handleSidebarClick } = useSettingsScrollSpy(SETTINGS_SECTIONS);

    useConsoleLoggingDisabler();

    useEffect(() => {
        chrome.commands.getAll((hotkeys) => {
            setCurrentHotKeys(hotkeys);
        });
    }, [settings]);

    return (
        <>
            <div className="flex h-screen w-full select-none">
                {settings.enableCustomCss && <style>{settings.customCss}</style>}

                <SettingsSidebar
                    sections={SETTINGS_SECTIONS}
                    centeredSection={centeredSection}
                    onSectionClick={handleSidebarClick}
                    settings={settings}
                    updateSetting={updateSetting}
                />

                <div ref={contentRef} className="flex-1 space-y-8 overflow-y-auto p-8">
                    <SettingsContent
                        settings={settings}
                        updateSetting={updateSetting}
                        updateSettings={updateSettings}
                        user={user}
                        loading={loading}
                        error={error}
                        isPremium={isPremium}
                        currentHotKeys={currentHotKeys}
                        debouncedUpdateAutoOrganizePrompt={debouncedUpdateAutoOrganizePrompt}
                        fileInputRef={fileInputRef}
                        sessionsFileInputRef={sessionsFileInputRef}
                        setIsColorDialogOpen={setIsColorDialogOpen}
                        setColorBeingModified={setColorBeingModified}
                        setIsBackgroundImageDialogOpen={setIsBackgroundImageDialogOpen}
                        setIsNewTabBackgroundImageDialogOpen={setIsNewTabBackgroundImageDialogOpen}
                    />
                </div>
            </div>

            <SettingsDialogs
                settings={settings}
                updateSetting={updateSetting}
                isColorDialogOpen={isColorDialogOpen}
                setIsColorDialogOpen={setIsColorDialogOpen}
                colorBeingModified={colorBeingModified}
                isBackgroundImageDialogOpen={isBackgroundImageDialogOpen}
                setIsBackgroundImageDialogOpen={setIsBackgroundImageDialogOpen}
                isNewTabBackgroundImageDialogOpen={isNewTabBackgroundImageDialogOpen}
                setIsNewTabBackgroundImageDialogOpen={setIsNewTabBackgroundImageDialogOpen}
            />

            <Toaster
                duration={4000}
                position="bottom-center"
                richColors
                toastOptions={{
                    style: {
                        userSelect: "none",
                    },
                }}
            />
        </>
    );
};
