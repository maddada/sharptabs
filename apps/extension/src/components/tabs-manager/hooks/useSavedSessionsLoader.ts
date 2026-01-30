import { useEffect } from "react";
import { SavedSession } from "@/types/SavedSession";

export function useSavedSessionsLoader(setSavedSessions: (sessions: SavedSession[]) => void) {
    useEffect(() => {
        chrome.storage.local.get({ savedSessions: [] }, (result) => {
            // Sort sessions by timestamp descending (newest first)
            const loadedSessions = (result.savedSessions as SavedSession[]).sort((a, b) => b.timestamp - a.timestamp);
            setSavedSessions(loadedSessions);
        });

        // Listener for changes made in other windows/contexts
        const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
            if (areaName === "local" && changes.savedSessions) {
                const updatedSessions = (changes.savedSessions.newValue as SavedSession[]).sort((a, b) => b.timestamp - a.timestamp);
                setSavedSessions(updatedSessions);
            }
        };
        chrome.storage.onChanged.addListener(handleStorageChange);
        return () => chrome.storage.onChanged.removeListener(handleStorageChange);
    }, [setSavedSessions]);
}
