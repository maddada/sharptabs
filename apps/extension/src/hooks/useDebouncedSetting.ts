import { useCallback, useRef } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { Settings } from "@/types/Settings";

export function useDebouncedSetting<K extends keyof Settings>(key: K, delay: number = 500) {
    const { updateSetting } = useSettingsStore();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const debouncedUpdateSetting = useCallback(
        (value: Settings[K]) => {
            // Clear any existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Set a new timeout
            timeoutRef.current = setTimeout(() => {
                updateSetting(key, value);
            }, delay);
        },
        [key, delay, updateSetting]
    );

    return debouncedUpdateSetting;
}
