import { CustomTooltip } from "@/components/simple/CustomTooltip";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import { getOpacityClass } from "@/utils/getOpacityClass";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { findWorkspaceContainingTabById } from "@/utils/workspaces/workspaceFilter";

export function ScrollToCurrentTabButton({
    expandAndScrollToActiveTab,
}: {
    expandAndScrollToActiveTab: (fromButton?: boolean, tabId?: number) => void;
}) {
    const headerFooterOpacity = useSettingsStore((s) => s.settings.headerFooterOpacity);
    const settings = useSettingsStore((s) => s.settings);
    const opacityClass = getOpacityClass(headerFooterOpacity);
    const { workspaces, actions } = useWorkspaceStore();

    const handleClick = async () => {
        // If workspaces are enabled, find and switch to the workspace containing the active tab
        if (settings.enableWorkspaces) {
            try {
                // Get active tab
                const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (activeTab?.id) {
                    // Get current window ID
                    const currentWindow = await chrome.windows.getCurrent();
                    if (currentWindow.id) {
                        // Load workspace assignments
                        const result = await chrome.storage.local.get("workspaceAssignments");
                        const workspaceAssignments = result.workspaceAssignments?.[currentWindow.id] || {};

                        // Find which workspace contains this tab
                        const workspace = await findWorkspaceContainingTabById(activeTab.id, workspaceAssignments, workspaces);

                        // Switch to that workspace if found
                        if (workspace) {
                            actions.setActiveWorkspaceId(workspace.id);
                            // Small delay to allow UI to update before scrolling
                            setTimeout(() => {
                                expandAndScrollToActiveTab(true, activeTab.id);
                            }, 100);
                            return;
                        }
                    }
                }
            } catch (error) {
                console.error("Error switching workspace:", error);
            }
        }

        // Fallback to just scrolling
        expandAndScrollToActiveTab(true);
    };

    return (
        <CustomTooltip content="Scroll to Current Tab">
            <div className={opacityClass}>
                <Button variant="outline" className={`px-3`} onClick={handleClick} tabIndex={-1}>
                    <MapPin className="h-4 w-4" />
                </Button>
            </div>
        </CustomTooltip>
    );
}
