import SettingsToggle from "@/components/settings/SettingsToggle";
import { defaultSettings } from "@/stores/settingsStore";
import { Settings } from "@/types/Settings";
import { cn } from "@/utils/cn";
import { UpdateSetting } from "./types";

interface SettingsSidebarProps {
    sections: readonly { readonly id: string; readonly label: string }[];
    centeredSection: string;
    onSectionClick: (id: string) => void;
    settings: Settings;
    updateSetting: UpdateSetting;
}

export const SettingsSidebar = ({ sections, centeredSection, onSectionClick, settings, updateSetting }: SettingsSidebarProps) => (
    <nav className="sticky top-0 z-10 flex h-screen w-56 min-w-56 max-w-56 flex-col gap-2 border-r bg-muted/40 px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold">Sharp Tabs Settings</h1>
        <div className="flex-grow space-y-2">
            {sections.map((section) => (
                <button
                    key={section.id}
                    className={cn(
                        "rounded px-3 py-2 text-left font-medium transition-colors hover:bg-white/40 w-full",
                        centeredSection === section.id
                            ? "bg-primary text-primary-foreground hover:bg-primary/80 hover:text-neutral-700"
                            : ""
                    )}
                    onClick={() => onSectionClick(section.id)}
                >
                    {section.label}
                </button>
            ))}
        </div>

        <div className="mt-auto space-y-2 border-t border-muted-foreground/20 pt-4">
            {process.env.NODE_ENV === "development" && (
                <SettingsToggle
                    label="Enable logging"
                    description="Enable this setting in case you have any issues with Sharp Tabs"
                    settingKey="enableConsoleLogging"
                    checked={settings.enableConsoleLogging}
                    defaultValue={defaultSettings.enableConsoleLogging}
                    updateSetting={updateSetting}
                />
            )}
            <a
                href="https://sharptabs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/20 hover:text-foreground"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor" />
                </svg>
                <span>Visit our Website</span>
            </a>

            <a
                href="https://reddit.com/r/SharpTabs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/20 hover:text-foreground"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"
                        fill="currentColor"
                    />
                </svg>
                <span>Discuss on Reddit</span>
            </a>

            <a
                href="mailto:support@sharptabs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/20 hover:text-foreground"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
                        fill="currentColor"
                    />
                </svg>
                <span>Contact Us</span>
            </a>

            <div className="mt-2 border-t border-muted-foreground/20 pt-2 text-center text-xs text-muted-foreground">
                Version {chrome.runtime.getManifest().version}
            </div>
        </div>
    </nav>
);
