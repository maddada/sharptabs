import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings } from "@/types/Settings";
import { cn } from "@/utils/cn";
import { Plus, X, HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { CustomTooltip } from "@/components/simple/CustomTooltip";

type AutoSuspendExcludedDomainsProps = {
    className?: string;
    settings: Settings;
    updateSetting: (key: keyof Settings, value: any) => void;
    disabled?: boolean;
    disableHoverableDescription?: boolean;
};

export function AutoSuspendExcludedDomains({
    className,
    settings,
    updateSetting,
    disabled = false,
    disableHoverableDescription = false,
}: AutoSuspendExcludedDomainsProps) {
    const [localDomains, setLocalDomains] = useState<string[]>([...settings.autoSuspendExcludedDomains]);
    const [hasChanges, setHasChanges] = useState(false);

    // Sync local state when settings change from outside
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocalDomains([...settings.autoSuspendExcludedDomains]);
        setHasChanges(false);
    }, [settings.autoSuspendExcludedDomains]);

    const handleDomainChange = (index: number, value: string) => {
        if (disabled) return;

        const newDomains = [...localDomains];
        newDomains[index] = value;
        setLocalDomains(newDomains);
        setHasChanges(true);
    };

    const addDomain = () => {
        if (disabled) return;

        setLocalDomains([...localDomains, ""]);
        setHasChanges(true);
    };

    const removeDomain = (index: number) => {
        if (disabled) return;

        const newDomains = localDomains.filter((_, i) => i !== index);
        setLocalDomains(newDomains);
        setHasChanges(true);
    };

    const saveChanges = () => {
        if (disabled) return;

        // Remove empty domains
        const cleanedDomains = localDomains.filter((domain) => domain.trim() !== "");
        updateSetting("autoSuspendExcludedDomains", cleanedDomains);
        setHasChanges(false);
        toast.success("Excluded domains saved successfully");
    };

    const resetChanges = () => {
        setLocalDomains([...settings.autoSuspendExcludedDomains]);
        setHasChanges(false);
    };

    return (
        <div className={cn("group relative mt-6 flex flex-col gap-3 rounded-lg border p-3 shadow-sm", disabled && "opacity-50", className)}>
            <div className="flex items-center justify-between">
                {disableHoverableDescription ? (
                    <div className="space-y-0.5">
                        <label className={cn("text-sm font-semibold", disabled && "text-muted-foreground")}>Domains to Never Auto Suspend</label>
                        <div className={cn("text-sm text-muted-foreground whitespace-pre-line", disabled && "text-muted-foreground/50")}>
                            Domains that should never be auto-suspended. Use *.domain.com to match all subdomains.
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <label className={cn("text-sm font-semibold", disabled && "text-muted-foreground")}>Domains to Never Auto Suspend</label>
                        <CustomTooltip
                            content={"Domains that should never be auto-suspended.\nUse *.domain.com to match all subdomains.".replace(/\\n/g, "\n")}
                            side="right"
                            alignOffset={-9}
                            delayDuration={0}
                            align="start"
                        >
                            <button
                                type="button"
                                className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                                aria-label="Help"
                            >
                                <HelpCircle className="h-4 w-4" />
                            </button>
                        </CustomTooltip>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                {localDomains.map((domain, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Input
                            value={domain}
                            onChange={(e) => handleDomainChange(index, e.target.value)}
                            placeholder="Enter domain (e.g. website.com or *.website.com)"
                            disabled={disabled}
                            className="flex-1"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeDomain(index)}
                            disabled={disabled}
                            className="h-9 w-9 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between">
                <Button type="button" variant="outline" size="sm" onClick={addDomain} disabled={disabled} className="flex items-center gap-1">
                    <Plus className="h-4 w-4" />
                    Add Domain
                </Button>

                <div className="flex gap-2">
                    {hasChanges && (
                        <Button type="button" variant="outline" size="sm" onClick={resetChanges} disabled={disabled}>
                            Cancel
                        </Button>
                    )}
                    <Button type="button" size="sm" onClick={saveChanges} disabled={disabled || !hasChanges}>
                        Save Domains
                    </Button>
                </div>
            </div>
        </div>
    );
}
