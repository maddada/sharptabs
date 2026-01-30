import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useTabManagerStore } from "@/stores/tabManagerStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { closeAllDuplicates } from "@/utils/tabs/closeAllDuplicates";
import { toast } from "sonner";

export function TabManagerFooter() {
    const initializeWindowFocusListeners = useTabManagerStore((state) => state.actions.initializeWindowFocusListeners);
    const cleanupWindowFocusListeners = useTabManagerStore((state) => state.actions.cleanupWindowFocusListeners);
    const isDuplicateCheckMode = useTabManagerStore((state) => state.isDuplicateCheckMode);
    const setIsDuplicateCheckMode = useTabManagerStore((state) => state.actions.setIsDuplicateCheckMode);
    const settings = useSettingsStore((state) => state.settings);
    const updateSetting = useSettingsStore((state) => state.updateSetting);
    const [isClosing, setIsClosing] = useState(false);

    // Initialize window focus listeners
    useEffect(() => {
        initializeWindowFocusListeners();
        return cleanupWindowFocusListeners;
    }, [initializeWindowFocusListeners, cleanupWindowFocusListeners]);

    const handleCloseAllDuplicates = async () => {
        setIsClosing(true);
        try {
            const closedCount = await closeAllDuplicates(settings.duplicateCloseKeep, settings.strictDuplicateChecking);
            if (closedCount > 0) {
                toast.success(`Closed ${closedCount} duplicate tab${closedCount === 1 ? "" : "s"}`);
                // Exit duplicate check mode after closing all duplicates
                setIsDuplicateCheckMode(false);
            } else {
                toast.info("No duplicate tabs to close");
            }
        } catch (error) {
            console.error("Error closing duplicate tabs:", error);
            toast.error("Failed to close duplicate tabs");
        } finally {
            setIsClosing(false);
        }
    };

    return (
        <div id="tabs-manager-footer">
            {/* Floating div when in duplicate check mode */}
            {isDuplicateCheckMode && (
                <div
                    id="duplicate-mode-indicator"
                    className="sticky bottom-0 z-10 my-1 border-t-2 border-foreground/40 p-3 dark:border-foreground/20"
                >
                    <div className="duplicate-mode-label mb-2 text-center text-sm font-bold">Showing Duplicates Only</div>
                    <div className="strict-duplicate-toggle flex items-center justify-center gap-2">
                        <label
                            htmlFor="strict-duplicate-check"
                            className="text-sm"
                            title="Strict duplicate checking shows tabs with the same URL and parameters"
                        >
                            Stricter Checking
                        </label>
                        <Switch
                            id="strict-duplicate-check"
                            checked={settings.strictDuplicateChecking}
                            onCheckedChange={(checked) => updateSetting("strictDuplicateChecking", checked)}
                        />
                    </div>
                    <div className="mt-3 flex justify-center">
                        <Button className="w-full" size="sm" onClick={handleCloseAllDuplicates} disabled={isClosing}>
                            {isClosing ? "Closing..." : "Close All Duplicates"}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
