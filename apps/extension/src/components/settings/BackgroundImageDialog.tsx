import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultSettings } from "@/stores/settingsStore";
import { Settings, SettingsKeys } from "@/types/Settings";
import { getEffectiveBackgroundSettingKey } from "@/utils/getEffectiveBackgroundSettings";
import PexelsImagePicker from "./PexelsImagePicker";
import { SettingsSlider } from "./SettingsSlider";

type BackgroundImageDialogProps = {
    settings: Settings;
    updateSetting: any;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    handleImageSelect: (imageUrl: string) => void;
    settingPrefix: "backgroundImage" | "newTabBackgroundImage";
    className?: string;
};

export function BackgroundImageDialog({
    settings,
    updateSetting,
    handleImageSelect,
    isOpen,
    setIsOpen,
    settingPrefix,
    className,
}: BackgroundImageDialogProps) {
    const isNewTabPrefix = settingPrefix === "newTabBackgroundImage";

    // Helper to get the effective setting key based on theme mode
    const getEffectiveKey = (suffix: string): SettingsKeys => {
        if (isNewTabPrefix) {
            return `${settingPrefix}${suffix}` as SettingsKeys;
        }
        // For regular background, use the effective key helper
        const baseSuffix = `backgroundImage${suffix}` as any;
        return getEffectiveBackgroundSettingKey(baseSuffix, { settings, forRendering: false });
    };

    // Custom handler to prevent all automatic closing - dialog should only close via explicit close actions
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            return;
        }
    };

    const handleClose = () => {
        const urlKey = getEffectiveKey("Url");
        updateSetting(urlKey, settings[urlKey] || "");
        setIsOpen(false);
    };

    // Generate setting keys based on prefix (with system theme support for non-newTab)
    const opacityKey = getEffectiveKey("Opacity");
    const saturationKey = getEffectiveKey("Saturation");
    const blurKey = getEffectiveKey("Blur");
    const hueKey = getEffectiveKey("Hue");
    const contrastKey = getEffectiveKey("Contrast");
    const sizeKey = getEffectiveKey("Size");
    const positionXKey = getEffectiveKey("PositionX");
    const positionYKey = getEffectiveKey("PositionY");
    const urlKey = getEffectiveKey("Url");

    const handleUrlChange = (value: string) => {
        updateSetting(urlKey, value);
        if (value.trim()) {
            handleImageSelect(value.trim());
        }
    };

    const handleCopyUrl = async () => {
        const currentUrl = settings[urlKey] as string;
        if (currentUrl) {
            try {
                await navigator.clipboard.writeText(currentUrl);
            } catch (error) {
                console.log("Failed to copy URL:", error);
            }
        }
    };

    const handleCopyTheme = async () => {
        const themeSettings = {
            [opacityKey]: settings[opacityKey],
            [saturationKey]: settings[saturationKey],
            [blurKey]: settings[blurKey],
            [hueKey]: settings[hueKey],
            [contrastKey]: settings[contrastKey],
            [sizeKey]: settings[sizeKey],
            [positionXKey]: settings[positionXKey],
            [positionYKey]: settings[positionYKey],
            [urlKey]: settings[urlKey],
        };

        try {
            const jsonString = JSON.stringify(themeSettings, null, 4);
            await navigator.clipboard.writeText(jsonString);
            console.log("Theme settings copied to clipboard");
        } catch (error) {
            console.log("Failed to copy theme settings:", error);
        }
    };

    const handlePasteTheme = async () => {
        try {
            const clipboardText = await navigator.clipboard.readText();
            const themeSettings = JSON.parse(clipboardText);

            // Helper function to extract the setting type from any key
            const getSettingType = (key: string): string | null => {
                const settingTypes = ["Opacity", "Saturation", "Blur", "Hue", "Contrast", "Size", "PositionX", "PositionY", "Url"];

                for (const type of settingTypes) {
                    if (key.endsWith(type)) {
                        return type;
                    }
                }
                return null;
            };

            // Apply each setting by converting to current dialog's effective key
            Object.keys(themeSettings).forEach((clipboardKey) => {
                const settingType = getSettingType(clipboardKey);

                if (settingType) {
                    // Use effective key for backgroundImage prefix (respects theme mode)
                    const targetKey = getEffectiveKey(settingType);

                    if (targetKey in settings) {
                        updateSetting(targetKey, themeSettings[clipboardKey]);
                    }
                }
            });

            console.log("Theme settings applied from clipboard");
        } catch (error) {
            console.log("Failed to paste theme settings:", error);
        }
    };

    return (
        <Dialog modal={true} open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent aria-describedby={undefined} className={`w-[80%] max-w-[800px] ${className || ""}`}>
                <style>{`button:has(> svg.lucide-x) { display: none; }`}</style>
                <DialogHeader>
                    <VisuallyHidden>
                        <DialogTitle>Select a Background Image</DialogTitle>
                    </VisuallyHidden>
                </DialogHeader>

                <div className="grid grid-cols-3 gap-4">
                    <SettingsSlider
                        label="Image Opacity"
                        settingKey={opacityKey}
                        value={settings[opacityKey] as number}
                        defaultValue={defaultSettings[opacityKey] as number}
                        min={0}
                        max={1}
                        step={0.05}
                        updateSetting={updateSetting}
                    />
                    <SettingsSlider
                        label="Image Saturation"
                        settingKey={saturationKey}
                        value={settings[saturationKey] as number}
                        defaultValue={defaultSettings[saturationKey] as number}
                        min={0}
                        max={1}
                        step={0.05}
                        updateSetting={updateSetting}
                    />
                    <SettingsSlider
                        label="Image Blur"
                        settingKey={blurKey}
                        value={settings[blurKey] as number}
                        defaultValue={defaultSettings[blurKey] as number}
                        min={0}
                        max={50}
                        step={1}
                        updateSetting={updateSetting}
                    />
                    <SettingsSlider
                        label="Image Hue"
                        settingKey={hueKey}
                        value={settings[hueKey] as number}
                        defaultValue={defaultSettings[hueKey] as number}
                        min={0}
                        max={360}
                        step={1}
                        updateSetting={updateSetting}
                    />
                    {/* <SettingsSlider
                        label="Image Rotation"
                        settingKey={rotationKey}
                        value={settings[rotationKey] as number}
                        defaultValue={defaultSettings[rotationKey] as number}
                        min={0}
                        max={360}
                        step={1}
                        updateSetting={updateSetting}
                    /> */}
                    <SettingsSlider
                        label="Image Contrast"
                        settingKey={contrastKey}
                        value={settings[contrastKey] as number}
                        defaultValue={defaultSettings[contrastKey] as number}
                        min={0}
                        max={3}
                        step={0.1}
                        updateSetting={updateSetting}
                    />
                    <SettingsSlider
                        label="Image Size"
                        settingKey={sizeKey}
                        value={settings[sizeKey] as number}
                        defaultValue={defaultSettings[sizeKey] as number}
                        min={50}
                        max={2000}
                        step={5}
                        updateSetting={updateSetting}
                    />
                    <SettingsSlider
                        label="X Position"
                        settingKey={positionXKey}
                        value={settings[positionXKey] as number}
                        defaultValue={defaultSettings[positionXKey] as number}
                        min={0}
                        max={100}
                        step={1}
                        updateSetting={updateSetting}
                    />
                    <SettingsSlider
                        label="Y Position"
                        settingKey={positionYKey}
                        value={settings[positionYKey] as number}
                        defaultValue={defaultSettings[positionYKey] as number}
                        min={0}
                        max={100}
                        step={1}
                        updateSetting={updateSetting}
                    />

                    {/* Copy/Paste buttons in the last row */}
                    <div className="flex flex-col justify-end gap-2 align-bottom">
                        <Button type="button" variant="outline" size="sm" onClick={handleCopyTheme} className="h-8 text-xs">
                            Copy Theme
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={handlePasteTheme} className="h-8 text-xs">
                            Paste Theme
                        </Button>
                    </div>
                </div>

                <div className="mt-4 space-y-2">
                    <Label htmlFor="background-image-url">Background Image URL (You can paste any image URL)</Label>
                    <div className="flex gap-2">
                        <Input
                            id="background-image-url"
                            type="url"
                            placeholder="Enter image URL..."
                            value={(settings[urlKey] as string) || ""}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            className="flex-1"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={handleCopyUrl} disabled={!settings[urlKey]} className="px-3">
                            Copy
                        </Button>
                    </div>
                </div>

                <PexelsImagePicker onImageSelect={handleImageSelect} />
                <DialogFooter className="justify-end sm:justify-end">
                    <Button onClick={handleClose}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
