import SettingsToggle from "./SettingsToggle";
import { useSettingsStore } from "@/stores/settingsStore";
import { Settings } from "@/types/Settings";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";

export function WorkspacesSection() {
    const { settings, updateSetting } = useSettingsStore();
    const [isExporting, setIsExporting] = useState(false);

    const handleExportDiagnostics = async () => {
        setIsExporting(true);
        try {
            const response = await chrome.runtime.sendMessage({
                type: "EXPORT_WORKSPACE_DIAGNOSTICS",
            });

            if (response.success && response.diagnostics) {
                // Create a blob and download the file using anchor tag approach
                const blob = new Blob([JSON.stringify(response.diagnostics, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                const filename = `workspace-diagnostics-${timestamp}.json`;

                // Create a temporary anchor element and trigger download
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();

                // Clean up
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            } else {
                console.error("Failed to export diagnostics:", response.error);
                alert("Failed to export diagnostics. Check console for details.");
            }
        } catch (error) {
            console.error("Error exporting diagnostics:", error);
            alert("Error exporting diagnostics. Check console for details.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <h3 className="text-lg font-medium">Workspaces</h3>
                <p className="text-sm text-muted-foreground">
                    Organize your tabs into separate workspaces. Each workspace acts as a filter to show only relevant tabs, while all tabs remain
                    open and maintain their state.
                </p>
            </div>

            <SettingsToggle
                settingKey="enableWorkspaces"
                label="Enable Workspaces"
                description="Show the workspace bar in the tab manager to organize tabs by workspace. The 'General' workspace shows all unassigned tabs."
                checked={settings.enableWorkspaces}
                defaultValue={settings.enableWorkspaces}
                updateSetting={(key: keyof Settings, value: boolean) => updateSetting(key, value)}
            />

            {settings.enableWorkspaces && (
                <SettingsToggle
                    settingKey="searchInAllWorkspaces"
                    label="Search In All Workspaces"
                    description="When searching, show tabs from all workspaces instead of only the active workspace."
                    checked={settings.searchInAllWorkspaces}
                    defaultValue={true}
                    updateSetting={(key: keyof Settings, value: boolean) => updateSetting(key, value)}
                />
            )}

            {settings.enableWorkspaces && (
                <SettingsToggle
                    settingKey="sharePinnedTabsBetweenWorkspaces"
                    label="Share Pinned Tabs Between All Workspaces"
                    description="When enabled, pinned tabs will be visible in all workspaces. They remain assigned to their original workspace, so disabling this won't lose workspace data."
                    checked={settings.sharePinnedTabsBetweenWorkspaces}
                    defaultValue={false}
                    updateSetting={(key: keyof Settings, value: boolean) => updateSetting(key, value)}
                />
            )}

            {settings.enableWorkspaces && (
                <SettingsToggle
                    settingKey="separateActiveTabPerWorkspace"
                    label="Separate Active Tab in Each Workspace"
                    description="Remember the last selected tab in each workspace and automatically activate it when switching workspaces."
                    checked={settings.separateActiveTabPerWorkspace}
                    defaultValue={false}
                    updateSetting={(key: keyof Settings, value: boolean) => updateSetting(key, value)}
                />
            )}

            {settings.enableWorkspaces && (
                <div className="space-y-2 rounded-lg border p-4 text-sm text-muted-foreground">
                    <p className="font-medium">How Workspaces Work:</p>
                    <ul className="ml-2 list-inside list-disc space-y-1">
                        <li>
                            <strong>General workspace:</strong> Always visible and shows all tabs not assigned to other workspaces
                        </li>
                        <li>
                            <strong>Custom workspaces:</strong> Create workspaces for different contexts (Work, Personal, Project, etc.)
                        </li>
                        <li>
                            <strong>All tabs stay open:</strong> Switching workspaces only filters the view - your tabs remain active with their
                            scroll position and form data intact
                        </li>
                        <li>
                            <strong>Persistent:</strong> Workspace definitions and assignments survive browser restarts
                        </li>
                        <li>
                            <strong>Context menu:</strong> Right-click workspace icons to create new workspaces, rename, change icon, or delete
                        </li>
                    </ul>
                </div>
            )}

            {settings.enableWorkspaces && process.env.NODE_ENV === "development" && (
                <div className="space-y-2 rounded-lg border border-orange-300 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
                    <p className="text-sm font-medium">Debug & Troubleshooting</p>
                    <p className="text-sm text-muted-foreground">
                        Export diagnostic data to help troubleshoot workspace issues. This includes all workspace definitions, assignments, and
                        current Chrome tab/group states.
                    </p>
                    <Button onClick={handleExportDiagnostics} disabled={isExporting} variant="outline" size="sm" className="mt-2">
                        <Download className="mr-2 h-4 w-4" />
                        {isExporting ? "Exporting..." : "Export Workspace Diagnostics"}
                    </Button>
                </div>
            )}
        </div>
    );
}
