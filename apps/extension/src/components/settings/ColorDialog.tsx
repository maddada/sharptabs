import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Settings } from "@/types/Settings";
import { debounce } from "lodash-es";
import { useEffect, useRef } from "react";
import ColorPicker from "react-best-gradient-color-picker";

type ColorDialogProps = {
    settings: Settings;
    updateSetting: any;
    isColorDialogOpen: boolean;
    setIsColorDialogOpen: (isOpen: boolean) => void;
    colorBeingModified: string;
    className: string;
};

const solidColorOnly = ["tabTextColor", "groupTextColor", "faviconBackgroundColor", "shadowColor"];

export function ColorDialog({ settings, updateSetting, isColorDialogOpen, setIsColorDialogOpen, colorBeingModified, className }: ColorDialogProps) {
    // Local state for immediate UI updates (similar to SettingsSlider)
    let localColor = (settings as any)[colorBeingModified] || "";
    const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Optimize debounced function - reduce delay and memoize properly
    const debouncedUpdateSettingRef = useRef(
        debounce((key: string, value: any) => {
            updateSetting(key, value);
        }, 100)
    );

    // Update the debounced function when updateSetting changes
    useEffect(() => {
        debouncedUpdateSettingRef.current = debounce((key: string, value: any) => {
            updateSetting(key, value);
        }, 100);
    }, [updateSetting]);

    // Cleanup debounced function
    useEffect(() => {
        return () => {
            debouncedUpdateSettingRef.current.cancel();
            if (dragTimeoutRef.current) {
                clearTimeout(dragTimeoutRef.current);
            }
        };
    }, []);

    // Custom handler to prevent all automatic closing - dialog should only close via explicit close actions
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            return;
        }
    };

    // Only update Chrome storage when dragging stops
    const handleColorChange = (value: string) => {
        // Update local state immediately for smooth UI
        localColor = value;

        // Clear existing timeout
        if (dragTimeoutRef.current) {
            clearTimeout(dragTimeoutRef.current);
        }

        // Set new timeout - only update Chrome storage after user stops dragging for 300ms
        dragTimeoutRef.current = setTimeout(() => {
            updateSetting(colorBeingModified, value);
        }, 300);
    };

    const handleClose = () => {
        // Ensure final value is saved immediately when closing
        debouncedUpdateSettingRef.current.cancel(); // Cancel any pending debounced calls
        if (dragTimeoutRef.current) {
            clearTimeout(dragTimeoutRef.current);
        }
        updateSetting(colorBeingModified, localColor); // Save current local value immediately
        setIsColorDialogOpen(false);
    };

    return (
        <Dialog modal={true} open={isColorDialogOpen} onOpenChange={handleOpenChange}>
            <DialogContent aria-describedby={undefined} className={className}>
                <style>{`button:has(> svg.lucide-x) { display: none; }`}</style>
                <DialogHeader>
                    <DialogTitle>Pick Color</DialogTitle>
                </DialogHeader>
                <ColorPicker
                    value={localColor} // Use local state for immediate updates
                    onChange={handleColorChange} // Use optimized handler
                    hidePresets
                    hideColorGuide
                    hideInputType
                    hideGradientStop
                    hideGradientControls={solidColorOnly.includes(colorBeingModified) ? true : false}
                    hideGradientAngle={solidColorOnly.includes(colorBeingModified) ? true : false}
                    hideGradientType={solidColorOnly.includes(colorBeingModified) ? true : false}
                    hideColorTypeBtns={solidColorOnly.includes(colorBeingModified) ? true : false}
                />
                <DialogFooter>
                    <Button onClick={handleClose}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
