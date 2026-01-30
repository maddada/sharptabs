import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { colorMap } from "@/constants/colorMap";
import { useAuthStore } from "@/stores/authStore";
import { usePremiumStatus } from "@/stores/premiumStore";
import { useSelectionStore } from "@/stores/selectionStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { ColorEnum } from "@/types/TabGroup";
import { callGeminiDirect } from "@/utils/geminiDirectCall";
import { getGenerateGroupNamePrompt } from "@/utils/tabs/getGroupingPrompts";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { CustomTooltip } from "../simple/CustomTooltip";
import { handleAddToExistingGroup, handleAddToNewGroup } from "../tab-list-items/TabItemHandlers";

interface WindowGroups {
    windowId: number;
    isCurrent: boolean;
    groups: chrome.tabGroups.TabGroup[];
}

interface AddToGroupDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddToGroupDialog({ isOpen, onClose }: AddToGroupDialogProps) {
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupNamePlaceholder, setNewGroupNamePlaceholder] = useState<string>();
    const [selectedColor, setSelectedColor] = useState<ColorEnum>("grey");
    const [windowGroups, setWindowGroups] = useState<WindowGroups[]>([]);

    const selectedTabIds = useSelectionStore((s) => s.selectedTabIds);
    const selectedTabs = useSelectionStore((s) => s.selectedTabs);
    const aiAutoGroupNaming = useSettingsStore((state) => state.settings.aiAutoGroupNaming);
    const geminiApiKey = useSettingsStore((state) => state.settings.geminiApiKey);

    const { isPremium } = usePremiumStatus();
    const user = useAuthStore((state) => state.user);

    const hasOwnApiKey = Boolean(geminiApiKey);
    const canUseAI = (isPremium || hasOwnApiKey) && aiAutoGroupNaming;

    useEffect(() => {
        if (!isOpen) return;
        if (!canUseAI) {
            // AI group naming not available
            return;
        }

        if (!user?.email && !hasOwnApiKey) {
            console.log("User email or API key not available for AI group naming");
            return;
        }

        async function run() {
            try {
                const prompt = getGenerateGroupNamePrompt(selectedTabs);
                let responseText: string;

                if (hasOwnApiKey && geminiApiKey) {
                    // BYOK: Call Gemini API directly from frontend
                    responseText = await callGeminiDirect(geminiApiKey, prompt, "nameGroup");
                } else {
                    // Premium: Use backend proxy
                    const convexUrl = import.meta.env.VITE_PUBLIC_CONVEX_URL;

                    if (!convexUrl) {
                        console.log("Convex URL not configured");
                        return;
                    }

                    const response = await fetch(`${convexUrl}/gemini-proxy`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            email: user?.email,
                            prompt: prompt,
                        }),
                    });

                    if (!response.ok) {
                        console.log("Failed to generate group name:", response.status);
                        return;
                    }

                    const result = await response.json();
                    responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

                    if (!responseText) {
                        console.log("AI did not return a valid response");
                        return;
                    }
                }

                console.log(responseText);

                const [groupName, color] = responseText.split("|");

                if (groupName.toLowerCase().includes("list of tabs")) {
                    return;
                }

                // setNewGroupName(groupName);
                setNewGroupNamePlaceholder(groupName);
                setSelectedColor(color.replaceAll(" ", "").replaceAll("\n", "").replaceAll("\r", "").replaceAll("\t", "") as ColorEnum);
            } catch (error) {
                console.log("Error generating group name:", error);
            }
        }

        run();
    }, [isOpen, canUseAI, hasOwnApiKey, geminiApiKey, user, selectedTabs]);

    useEffect(() => {
        const loadGroups = async () => {
            const currentWindow = await chrome.windows.getCurrent();
            const windows = await chrome.windows.getAll();

            const groupsPromises = windows.map(async (window) => {
                const groups = await chrome.tabGroups.query({ windowId: window.id });
                return {
                    windowId: window.id ?? 0,
                    isCurrent: window.id === currentWindow.id,
                    groups,
                };
            });

            const allWindowGroups = await Promise.all(groupsPromises);
            allWindowGroups.sort((a, b) => {
                if (a.isCurrent) return -1;
                if (b.isCurrent) return 1;
                return 0;
            });

            setWindowGroups(allWindowGroups);
        };

        if (isOpen) {
            loadGroups();
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Set the new group's name to the one from placeholder (AI generated) if the name is empty
        let name = "";
        if (newGroupName.trim() !== "") name = newGroupName;
        else if (newGroupName.trim() === "" && newGroupNamePlaceholder !== null) name = newGroupNamePlaceholder || "";
        else name = "Group";

        onAddToNewGroup(selectedTabIds, name, selectedColor);

        setTimeout(() => {
            setNewGroupName("");
            setNewGroupNamePlaceholder("");
            setSelectedColor("grey");
        }, 1000);

        onClose();
    };

    const allGroups = windowGroups.flatMap((windowGroup) => windowGroup.groups);

    return (
        <Dialog
            modal={true}
            open={isOpen}
            onOpenChange={(newOpen) => {
                if (!newOpen) {
                    return;
                }
            }}
        >
            <DialogContent
                id="add-to-group-dialog"
                aria-describedby={undefined}
                className="max-w-[calc(100vw-2rem)] gap-1.5 rounded-lg px-4 sm:w-[400px] sm:max-w-[calc(100vw-2rem)] sm:px-6"
                onInteractOutside={(e) => {
                    e.preventDefault();
                }}
                onKeyDown={(e) => {
                    if (e.key === "Escape") {
                        onClose();
                    }
                }}
            >
                <style>{`button:has(> svg.lucide-x) { display: none; }`}</style>
                <DialogHeader>
                    <DialogTitle>Add to Group</DialogTitle>
                </DialogHeader>

                <div className="pt-4">
                    {/* New Group Section */}
                    <div className="space-y-4">
                        <div className="flex select-none items-center justify-between text-sm font-semibold">
                            Create New Group
                            {canUseAI && (
                                <CustomTooltip content="AI group name" side={"left"} sideOffset={5}>
                                    <Sparkles
                                        width={16}
                                        style={{ cursor: "pointer" }}
                                        onClick={() => {
                                            setNewGroupName(newGroupNamePlaceholder ?? "Group");
                                        }}
                                    />
                                </CustomTooltip>
                            )}
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                placeholder={newGroupNamePlaceholder ? newGroupNamePlaceholder : canUseAI ? "Generating name..." : "Group Name"}
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                            />
                            <div className="mx-auto flex max-w-[200px] flex-row flex-wrap justify-center gap-2">
                                {Object.keys(colorMap).map((color) => (
                                    <div
                                        key={color}
                                        className={`${colorMap[color as ColorEnum]} hover:cursor-pointer h-7 w-7 rounded-full ${selectedColor === color ? "ring-2 ring-white" : ""}`}
                                        onClick={() => setSelectedColor(color as ColorEnum)}
                                    ></div>
                                ))}
                            </div>
                            <Button variant="secondary" className="w-full dark:bg-zinc-600" type="submit">
                                Create Group
                            </Button>
                        </form>
                    </div>

                    {allGroups.length > 0 && allGroups.some((group) => group.id !== selectedTabs[0]?.groupId) && (
                        <div className="max-h-[240px] space-y-4 overflow-y-auto pb-4 pt-2">
                            <div className="space-y-4">
                                {windowGroups.map((windowGroup, idx) => {
                                    const filteredGroups = windowGroup.groups; //.filter((group) => group.id !== selectedTabs[0]?.groupId);
                                    if (filteredGroups.length === 0) return null;

                                    return (
                                        <div key={windowGroup.windowId} className="space-y-2 pt-4">
                                            <div className="select-none text-sm font-semibold text-muted-foreground">
                                                {windowGroup.isCurrent ? "Groups in Current Window" : `Groups in Window ${idx + 1}`}
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {filteredGroups.map((group) => (
                                                    <button
                                                        key={group.id}
                                                        className={`${colorMap[group.color]} text-sm text-left font-semibold text-white truncate py-2 px-3 rounded-md max-w-[calc(99vw-66px)]`}
                                                        onClick={() => {
                                                            onAddToExistingGroup(selectedTabIds, group.id);
                                                            onClose();
                                                        }}
                                                    >
                                                        {group?.title || "Unnamed Group"}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function onAddToNewGroup(selectedTabIds: Set<number>, title: string, color: ColorEnum) {
    const ids = Array.from(selectedTabIds);
    handleAddToNewGroup(title, color, ids);
}

function onAddToExistingGroup(selectedTabIds: Set<number>, groupId: number) {
    const ids = Array.from(selectedTabIds);
    handleAddToExistingGroup(groupId, ids);
}
