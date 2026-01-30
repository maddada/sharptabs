import { CustomTooltip } from "@/components/simple/CustomTooltip";
import { handleAcceptAutoOrganize } from "@/components/tabs-manager/helpers/handleAutoOrganize";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { colorMap } from "@/constants/colorMap";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTabManagerStore } from "@/stores/tabManagerStore";
import { Tab } from "@/types/Tab";
import { ColorEnum } from "@/types/TabGroup";
import { createTooltipString } from "@/utils/tabs/createTooltip";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TabFavicon } from "../tab-list-items/TabFavicon";
import { Button } from "../ui/button";

interface AutoOrganizeDialogProps {
    open: boolean;
    onClose: () => void;
    tabsById: Record<number, Tab>;
    loading: boolean;
}

export function AutoOrganizeDialog({ open, onClose, tabsById, loading }: AutoOrganizeDialogProps) {
    const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
    const [selectedColor, setSelectedColor] = useState<ColorEnum | "auto">("grey");
    const acceptButtonRef = useRef<HTMLButtonElement>(null);
    const { settings } = useSettingsStore();

    const toggleCollapse = (idx: number) => setCollapsed((prev) => ({ ...prev, [idx]: !prev[idx] }));
    const groups = useTabManagerStore((state) => state.autoOrganizeGroups);

    // Custom handler to prevent all automatic closing - dialog should only close via Cancel/Accept buttons
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            return;
        }
    };

    // Helper function to get color name for tooltip
    const getColorName = (color: string) => {
        const colorNames: Record<string, string> = {
            grey: "Grey",
            blue: "Blue",
            red: "Red",
            yellow: "Yellow",
            green: "Green",
            pink: "Pink",
            purple: "Purple",
            cyan: "Cyan",
            orange: "Orange",
        };
        return colorNames[color] || color;
    };

    const handleAccept = () => {
        handleAcceptAutoOrganize(selectedColor === "auto" ? undefined : selectedColor);
        onClose();
    };

    useEffect(() => {
        setTimeout(() => {
            if (open) {
                acceptButtonRef.current?.focus();
            }
        }, 50);
    }, [open]);

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent
                id="auto-organize-dialog"
                className="max-w-[calc(100vw-2rem)] rounded-lg px-4 sm:w-[400px] sm:max-w-[calc(100vw-2rem)] sm:px-6"
            >
                <style>{`button:has(> svg.lucide-x) { display: none; }`}</style>
                <AlertDialogHeader>
                    <AlertDialogTitle>Auto Organize Tabs</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogDescription>
                    <span className="text-sm text-muted-foreground">Select a tab group colors and accept to apply the organization!</span>
                </AlertDialogDescription>
                {loading ? (
                    <div className="py-8 text-center text-muted-foreground">Analyzing tabs and generating groups...</div>
                ) : (
                    <div className="max-h-[50vh] space-y-4 overflow-y-auto">
                        {groups.length === 0 ? (
                            <div className="text-center text-muted-foreground">No groups suggested.</div>
                        ) : (
                            groups.map((group, i) => {
                                const isCollapsed = collapsed[i];
                                // Use selected color if not "auto", otherwise use AI-suggested color
                                const colorToShow = selectedColor === "auto" ? group.color : selectedColor;
                                const bg = colorMap[colorToShow as keyof typeof colorMap] || "bg-gray-400";

                                return (
                                    <div key={i} className={`overflow-hidden rounded border p-0`}>
                                        <button
                                            type="button"
                                            className={`w-full text-base cursor-pointer flex items-center justify-between gap-2 px-3 py-2 font-semibold select-none ${bg}`}
                                            style={{ background: undefined }}
                                            onClick={() => toggleCollapse(i)}
                                            tabIndex={-1}
                                        >
                                            <div className="flex w-full items-center gap-2 text-left">
                                                <div className="flex-shrink-0">
                                                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                                                </div>
                                                <span className="min-w-0 flex-1 truncate">{group.name}</span>
                                                <span className="ml-2 flex-shrink-0 text-base opacity-80">{group.tabIds.length}</span>
                                            </div>
                                        </button>
                                        {!isCollapsed && (
                                            <div className="space-y-1 bg-muted/20 py-2 pl-1 pr-1">
                                                {group.tabIds.map((tabId) => {
                                                    const tab = tabsById[tabId];
                                                    const tooltipString = createTooltipString(tab, {
                                                        showTitleInTooltips: true,
                                                        showUrlInTooltips: true,
                                                        isDuplicateCheckMode: false,
                                                    });
                                                    return (
                                                        <button
                                                            key={tabId}
                                                            type="button"
                                                            className="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-accent"
                                                            title={tooltipString}
                                                            onClick={async () => {
                                                                await chrome.tabs.update(tabId, { active: true });
                                                            }}
                                                        >
                                                            <div className="max-h-4 min-h-4 min-w-4 max-w-4">
                                                                <TabFavicon
                                                                    tab={tab}
                                                                    tabState={{
                                                                        iconError: false,
                                                                        isLoading: false,
                                                                        isMuted: false,
                                                                        isAudible: false,
                                                                        isDiscarded: false,
                                                                        isActive: false,
                                                                        isSuspendedByChrome: false,
                                                                    }}
                                                                    settings={settings}
                                                                />
                                                            </div>
                                                            <span className="truncate text-base">{tab?.title || `Tab ${tabId}`}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {!loading && groups.length > 0 && (
                    <div className="space-y-3">
                        <div className="select-none text-sm font-semibold">Group Colors</div>
                        <div className="flex max-w-[200px] flex-row flex-wrap justify-center gap-2 justify-self-center">
                            {/* Auto Colors option */}
                            <CustomTooltip content="Auto Colors" side="top">
                                <div
                                    className={`hover:cursor-pointer h-7 w-7 rounded-full border-2 border-gray-300 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 ${selectedColor === "auto" ? "ring-2 ring-white" : ""}`}
                                    onClick={() => setSelectedColor("auto")}
                                />
                            </CustomTooltip>

                            {/* Regular color options */}
                            {Object.keys(colorMap).map((color) => (
                                <CustomTooltip key={color} content={getColorName(color)} side="top">
                                    <div
                                        className={`${colorMap[color as ColorEnum]} hover:cursor-pointer h-7 w-7 rounded-full ${selectedColor === color ? "ring-2 ring-white" : ""}`}
                                        onClick={() => setSelectedColor(color as ColorEnum)}
                                    />
                                </CustomTooltip>
                            ))}
                        </div>
                    </div>
                )}

                <AlertDialogFooter className="gap-1.5">
                    <Button variant="secondary" onClick={handleAccept} disabled={loading} ref={acceptButtonRef}>
                        Accept & Organize
                    </Button>
                    <Button variant="outline" disabled={loading} onClick={onClose}>
                        Cancel
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
