import { WORKSPACE_ICONS } from "@/utils/workspaces/workspaceIcons";
import { cn } from "@/utils/cn";
import * as LucideIcons from "lucide-react";
import React from "react";

interface WorkspaceIconPickerProps {
    selectedIcon: string;
    onSelectIcon: (iconName: string) => void;
}

export function WorkspaceIconPicker({ selectedIcon, onSelectIcon }: WorkspaceIconPickerProps) {
    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-2 max-h-[300px] overflow-y-auto p-1">
            {WORKSPACE_ICONS.map((icon) => {
                // Dynamically get the icon component (same approach as WorkspaceBar)
                const IconComponent = (LucideIcons as any)[icon.name] || LucideIcons.Folder;

                return (
                    <button
                        key={icon.name}
                        type="button"
                        onClick={() => onSelectIcon(icon.name)}
                        className={cn(
                            "flex items-center justify-center p-3 rounded-md border-2 hover:bg-accent transition-colors",
                            selectedIcon === icon.name ? "border-primary bg-accent" : "border-transparent"
                        )}
                        title={icon.label}
                        aria-label={icon.label}
                    >
                        <IconComponent className="h-6 w-6" />
                    </button>
                );
            })}
        </div>
    );
}
