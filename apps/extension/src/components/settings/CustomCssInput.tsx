import { Settings } from "@/types/Settings";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/utils/cn";
import { useEffect, useState, useRef } from "react";

type CustomCssInputProps = {
    settings: Settings;
    updateSetting: (key: keyof Settings, value: any) => void;
};

export function CustomCssInput({ settings, updateSetting }: CustomCssInputProps) {
    // Local state for debouncing
    const [localCssValue, setLocalCssValue] = useState(settings.customCss);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isUserEditingRef = useRef(false);

    // Sync local state when settings change externally (e.g., from storage sync)
    // Skip if user is currently editing
    useEffect(() => {
        if (!isUserEditingRef.current) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLocalCssValue(settings.customCss);
        }
    }, [settings.customCss]);

    // Debounced effect to update settings
    useEffect(() => {
        if (!isUserEditingRef.current) {
            return; // Don't create timeout if not editing
        }

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            if (localCssValue !== settings.customCss) {
                updateSetting("customCss", localCssValue);
            }
            isUserEditingRef.current = false;
        }, 1000);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [localCssValue, settings.customCss, updateSetting]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        isUserEditingRef.current = true;
        setLocalCssValue(e.target.value);
    };

    const handleBlur = () => {
        // Clear any pending timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        // Immediately update settings if there are changes
        if (localCssValue !== settings.customCss) {
            updateSetting("customCss", localCssValue);
        }
        isUserEditingRef.current = false;
    };

    return (
        <div className="relative mt-6">
            <div className="flex flex-col gap-2 rounded-lg border p-3 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <div className="text-sm font-semibold">Custom CSS</div>
                        <div className="text-sm text-muted-foreground">• Add custom CSS code to modify the appearance of the tab manager.</div>
                        <div className="text-sm text-muted-foreground">
                            • To apply any Shadcn theme from{" "}
                            <a className="underline" target="_blank" href="https://tweakcn.com/">
                                tweakcn.com
                            </a>
                            , follow the easy instructions in{" "}
                            <a className="underline" target="_blank" href="https://gist.github.com/maddada/d550020d5991c2a3f93395c33cf0b8ea">
                                this link
                            </a>
                            .
                        </div>
                        <div className="text-sm text-muted-foreground">
                            • You can get the class names and variables (on html tag) by opening the dev tools on{" "}
                            <a className="underline" href="/sb.html">
                                this page
                            </a>{" "}
                            (press F12)
                        </div>

                        <div className="text-sm text-muted-foreground">• The CSS code is applied when you stop typing for 1 second.</div>
                    </div>
                    <Switch
                        checked={settings.enableCustomCss}
                        onCheckedChange={(checked) => {
                            updateSetting("enableCustomCss", checked);
                        }}
                    />
                </div>
                <textarea
                    value={localCssValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={`.tabs-manager-container { }\n\n.group-item-container { }\n\n.group-item { }\n\n.tab-item { }`}
                    className={cn(
                        "mt-2 min-h-[200px] w-full rounded-md border bg-background px-3 py-2 text-sm",
                        "font-mono",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        "placeholder:text-muted-foreground",
                        !settings.enableCustomCss && "opacity-50 cursor-not-allowed"
                    )}
                    spellCheck="false"
                    disabled={!settings.enableCustomCss}
                />
            </div>
        </div>
    );
}
