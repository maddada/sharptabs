import React, { useState, useCallback } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";

export const HOTKEYS_UI_MAP: { [key: string]: { label: string; description: string } } = {
    _execute_action: {
        label: "Activate the extension",
        description: "Open the popup to search quickly",
    },
    "duplicate-tab": {
        label: "Duplicate the current tab",
        description: "Creates a copy of the current tab",
    },
    "new-tab-current-group": {
        label: "Create a new tab in the current group",
        description: "Adds a new tab to the current group",
    },
    "open-popup": {
        label: "Open the popup",
        description: "Open the popup to search quickly",
    },
    "open-sidepanel": {
        label: "Open the side panel",
        description: "Opens the extension side panel",
    },
    "suspend-current-tab": {
        label: "Suspend the current tab",
        description: "Suspends the currently active tab",
    },
    "suspend-group-tabs": {
        label: "Suspend all tabs in the current group",
        description: "Suspends all tabs in the current group",
    },
    "suspend-window-tabs": {
        label: "Suspend all tabs in the current window",
        description: "Suspends all tabs in the current window",
    },
    "go-to-tab-1": {
        label: "Go to tab X",
        description: "You can define hotkeys for the 1st to 9th tabs and the last tab",
    },
    "switch-to-last-tab": {
        label: "Switch to the last tab",
        description: "Like alt tabbing, switches between the last tab and the current tab",
    },
    "navigate-back": {
        label: "Navigate back",
        description: "Navigate forward to the previous active tab in the current window",
    },
    "navigate-forward": {
        label: "Navigate forward",
        description: "Navigate forward to the next active tab in the current window",
    },
};

interface ShortcutsSectionProps {
    currentHotKeys: chrome.commands.Command[];
}

export const HotkeysSection: React.FC<ShortcutsSectionProps> = ({ currentHotKeys }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpanded = useCallback(() => {
        setIsExpanded(!isExpanded);
    }, [isExpanded]);

    return (
        <section id="hotkeys" className="mb-4 scroll-mt-24 rounded-2xl bg-muted/40 p-6 shadow">
            <div
                className="flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
                onClick={toggleExpanded}
            >
                <div className="flex-1">
                    <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
                </div>
                <div className="flex h-8 w-8 items-center justify-center">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
            </div>

            <div className={cn("overflow-hidden transition-all duration-300 ease-in-out", isExpanded ? "mt-4 opacity-100" : "max-h-0 opacity-0")}>
                <div className="mb-4 text-sm text-muted-foreground">
                    You can customize these shortcuts in your browser's extension settings. &nbsp;&nbsp;
                    <button
                        className="text-primary underline"
                        onClick={() => {
                            chrome.tabs.getCurrent((tab) => {
                                chrome.tabs.create({
                                    url: "chrome://extensions/shortcuts",
                                    index: (tab?.index ?? -2) + 1,
                                    active: true,
                                });
                            });
                        }}
                    >
                        Open Keyboard Shortcuts Page
                    </button>
                </div>
                <div className="w-4/6 space-y-4">
                    {Object.entries(HOTKEYS_UI_MAP).map(([name, { label, description }]) => {
                        const hotkey = currentHotKeys.find((cmd) => cmd.name === name);
                        return (
                            <div key={name} className="flex items-start justify-start border-b border-muted/30 py-2 last:border-b-0">
                                <div className="flex w-[390px] flex-col">
                                    <div className="text-sm font-semibold">{label}</div>
                                    <div className="w-[340px] text-sm text-muted-foreground">{description}</div>
                                </div>
                                <div className="min-w-[120px] font-mono text-base font-semibold">
                                    {hotkey && hotkey.shortcut ? hotkey.shortcut.replace(/\+/g, " + ") : ""}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
