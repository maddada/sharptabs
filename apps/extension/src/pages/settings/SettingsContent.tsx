import { HotkeysSection } from "@/components/settings/HotkeysSection";
import { ProfileSection } from "@/components/settings/ProfileSection";
import ContextMenuSection from "@/components/settings/ContextMenuSection";
import HeaderButtonsSection from "@/components/settings/HeaderButtonsSection";
import { WorkspacesSection } from "@/components/settings/WorkspacesSection";
import { defaultSettings } from "@/stores/settingsStore";
import { Settings } from "@/types/Settings";
import { Dispatch, RefObject, SetStateAction } from "react";
import { UpdateSetting, UpdateSettings } from "./types";
import { AiFeaturesSection } from "./sections/AiFeaturesSection";
import { AdvancedSection } from "./sections/AdvancedSection";
import { DesignSection } from "./sections/DesignSection";
import { DisabledNewTabSection } from "./sections/DisabledNewTabSection";
import { MessagesTipsSection } from "./sections/MessagesTipsSection";
import { NewsHelpSection } from "./sections/NewsHelpSection";
import { SavedSessionsSection } from "./sections/SavedSessionsSection";
import { TabGroupsSection } from "./sections/TabGroupsSection";
import { TabsSettingsSection } from "./sections/TabsSettingsSection";
import { TabSuspendingSection } from "./sections/TabSuspendingSection";
import { ThemesSection } from "./sections/ThemesSection";

type SettingsContentProps = {
    settings: Settings;
    updateSetting: UpdateSetting;
    updateSettings: UpdateSettings;
    user: any;
    loading: boolean;
    error: any;
    isPremium: boolean;
    currentHotKeys: chrome.commands.Command[];
    debouncedUpdateAutoOrganizePrompt: (value: string) => void;
    fileInputRef: RefObject<HTMLInputElement | null>;
    sessionsFileInputRef: RefObject<HTMLInputElement | null>;
    setIsColorDialogOpen: Dispatch<SetStateAction<boolean>>;
    setColorBeingModified: Dispatch<SetStateAction<string>>;
    setIsBackgroundImageDialogOpen: Dispatch<SetStateAction<boolean>>;
    setIsNewTabBackgroundImageDialogOpen: Dispatch<SetStateAction<boolean>>;
};

export const SettingsContent = ({
    settings,
    updateSetting,
    updateSettings,
    user,
    loading,
    error,
    isPremium,
    currentHotKeys,
    debouncedUpdateAutoOrganizePrompt,
    fileInputRef,
    sessionsFileInputRef,
    setIsColorDialogOpen,
    setColorBeingModified,
    setIsBackgroundImageDialogOpen,
    setIsNewTabBackgroundImageDialogOpen,
}: SettingsContentProps) => (
    <>
        <ProfileSection user={user} loading={loading} error={error} />
        <MessagesTipsSection settings={settings} />
        <HotkeysSection currentHotKeys={currentHotKeys} />
        <ThemesSection settings={settings} updateSetting={updateSetting} />
        <DesignSection
            settings={settings}
            updateSetting={updateSetting}
            setIsColorDialogOpen={setIsColorDialogOpen}
            setColorBeingModified={setColorBeingModified}
            setIsBackgroundImageDialogOpen={setIsBackgroundImageDialogOpen}
        />
        <section id="workspaces" className="scroll-mt-24 rounded-2xl bg-muted/40 p-6 shadow">
            <WorkspacesSection />
        </section>
        <AiFeaturesSection
            settings={settings}
            updateSetting={updateSetting}
            isPremium={isPremium}
            debouncedUpdateAutoOrganizePrompt={debouncedUpdateAutoOrganizePrompt}
        />
        <TabsSettingsSection
            settings={settings}
            updateSetting={updateSetting}
            setIsColorDialogOpen={setIsColorDialogOpen}
            setColorBeingModified={setColorBeingModified}
        />
        <TabGroupsSection
            settings={settings}
            updateSetting={updateSetting}
            setIsColorDialogOpen={setIsColorDialogOpen}
            setColorBeingModified={setColorBeingModified}
        />
        <HeaderButtonsSection settings={settings} updateSetting={updateSetting} />
        <ContextMenuSection settings={settings} updateSetting={updateSetting} defaultSettings={defaultSettings} />
        <TabSuspendingSection settings={settings} updateSetting={updateSetting} />
        {false && (
            <DisabledNewTabSection
                settings={settings}
                updateSetting={updateSetting}
                setIsColorDialogOpen={setIsColorDialogOpen}
                setColorBeingModified={setColorBeingModified}
                setIsNewTabBackgroundImageDialogOpen={setIsNewTabBackgroundImageDialogOpen}
            />
        )}
        <SavedSessionsSection settings={settings} updateSetting={updateSetting} sessionsFileInputRef={sessionsFileInputRef} />
        <AdvancedSection settings={settings} updateSetting={updateSetting} updateSettings={updateSettings} fileInputRef={fileInputRef} />
        <NewsHelpSection />
        <div className="h-[200px]" />
    </>
);
