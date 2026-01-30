import { useSettingsStore } from "@/stores/settingsStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { createNewTab } from "./createNewTab";

export function middleClickOpensNewTab(e: React.MouseEvent) {
    if (useSettingsStore.getState().settings.middleClickOpensNewTab) {
        e.preventDefault();
        e.stopPropagation();
        if (e.button === 1) {
            const activeWorkspaceId = useWorkspaceStore.getState().activeWorkspaceId;
            createNewTab({ active: true }, { workspaceId: activeWorkspaceId ?? undefined });
        }
    }
}
