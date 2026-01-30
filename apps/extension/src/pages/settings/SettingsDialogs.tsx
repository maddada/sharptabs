import { BackgroundImageDialog } from "@/components/settings/BackgroundImageDialog";
import { ColorDialog } from "@/components/settings/ColorDialog";
import { Settings } from "@/types/Settings";
import { getEffectiveBackgroundSettingKey } from "@/utils/getEffectiveBackgroundSettings";
import { Dispatch, SetStateAction } from "react";
import { UpdateSetting } from "./types";

interface SettingsDialogsProps {
    settings: Settings;
    updateSetting: UpdateSetting;
    isColorDialogOpen: boolean;
    setIsColorDialogOpen: Dispatch<SetStateAction<boolean>>;
    colorBeingModified: string;
    isBackgroundImageDialogOpen: boolean;
    setIsBackgroundImageDialogOpen: Dispatch<SetStateAction<boolean>>;
    isNewTabBackgroundImageDialogOpen: boolean;
    setIsNewTabBackgroundImageDialogOpen: Dispatch<SetStateAction<boolean>>;
}

export const SettingsDialogs = ({
    settings,
    updateSetting,
    isColorDialogOpen,
    setIsColorDialogOpen,
    colorBeingModified,
    isBackgroundImageDialogOpen,
    setIsBackgroundImageDialogOpen,
    isNewTabBackgroundImageDialogOpen,
    setIsNewTabBackgroundImageDialogOpen,
}: SettingsDialogsProps) => (
    <>
        <ColorDialog
            settings={settings}
            className="w-fit"
            updateSetting={updateSetting}
            isColorDialogOpen={isColorDialogOpen}
            setIsColorDialogOpen={setIsColorDialogOpen}
            colorBeingModified={colorBeingModified}
        />
        <BackgroundImageDialog
            settings={settings}
            className="min-h-[852px] w-[627px]"
            updateSetting={updateSetting}
            isOpen={isBackgroundImageDialogOpen}
            setIsOpen={setIsBackgroundImageDialogOpen}
            settingPrefix="backgroundImage"
            handleImageSelect={(imageUrl: string) => {
                const effectiveKey = getEffectiveBackgroundSettingKey("backgroundImageUrl", { settings, forRendering: false });
                console.log("Picked new backgroundImageUrl, updating key:", effectiveKey);
                updateSetting(effectiveKey, imageUrl);
            }}
        />
        <BackgroundImageDialog
            settings={settings}
            className="min-h-[852px] w-[627px]"
            updateSetting={updateSetting}
            isOpen={isNewTabBackgroundImageDialogOpen}
            setIsOpen={setIsNewTabBackgroundImageDialogOpen}
            settingPrefix="newTabBackgroundImage"
            handleImageSelect={(imageUrl: string) => {
                console.log("Picked new newTabBackgroundImageUrl:", imageUrl);
                updateSetting("newTabBackgroundImageUrl", imageUrl);
            }}
        />
    </>
);
