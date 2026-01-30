import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/icons/LoadingSpinner";
import { useAuthStore } from "@/stores/authStore";
import { usePremiumStatus } from "@/stores/premiumStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTabManagerStore } from "@/stores/tabManagerStore";
import { TabGroup } from "@/types/TabGroup";
import { cn } from "@/utils/cn";
import { callGeminiDirect } from "@/utils/geminiDirectCall";
import { getGenerateGroupNamePrompt } from "@/utils/tabs/getGroupingPrompts";
import { Check, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

async function generateNewAiName(
    e: React.MouseEvent,
    group: TabGroup,
    isPremium: boolean,
    userEmail: string | null | undefined,
    geminiApiKey: string | undefined,
    setNewGroupName: (name: string) => void,
    setDisableGenerateNewAiName: (disable: boolean) => void,
    setIsGenerating: (generating: boolean) => void
) {
    const hasOwnApiKey = Boolean(geminiApiKey);

    if (!isPremium && !hasOwnApiKey) {
        toast.error("This feature requires a premium subscription or your own Gemini API key");
        return;
    }

    if (!userEmail && !hasOwnApiKey) {
        toast.error("Please sign in or provide your own Gemini API key to use AI group naming");
        return;
    }

    e.preventDefault();
    setDisableGenerateNewAiName(true);
    setIsGenerating(true);

    try {
        const prompt = getGenerateGroupNamePrompt(group.tabs);
        console.log(prompt);

        let responseText: string;

        if (hasOwnApiKey && geminiApiKey) {
            // BYOK: Call Gemini API directly from frontend
            responseText = await callGeminiDirect(geminiApiKey, prompt, "nameGroup");
        } else {
            // Premium: Use backend proxy
            const convexUrl = import.meta.env.VITE_PUBLIC_CONVEX_URL;

            if (!convexUrl) {
                toast.error("Configuration error: Convex URL not available");
                setIsGenerating(false);
                return;
            }

            const response = await fetch(`${convexUrl}/gemini-proxy`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: userEmail,
                    prompt: prompt,
                }),
            });

            if (!response.ok) {
                toast.error("Failed to generate group name");
                setIsGenerating(false);
                return;
            }

            const result = await response.json();
            responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

            if (!responseText) {
                toast.error("AI did not return a valid response");
                setIsGenerating(false);
                return;
            }
        }

        console.log(responseText);
        const [groupName, color] = responseText.split("|");
        console.log(color);
        setNewGroupName(groupName);
        setIsGenerating(false);
    } catch (error) {
        console.log("Error generating group name:", error);
        toast.error("Failed to generate group name");
        setIsGenerating(false);
    }
    // Note: Button remains disabled after generation (success or failure)
}

export function RenameGroupDialog() {
    const isRenameModalOpen = useTabManagerStore((state) => state.isRenameModalOpen);
    const setIsRenameModalOpen = useTabManagerStore((state) => state.actions.setIsRenameModalOpen);
    const group = useTabManagerStore((state) => state.activeTabGroup);

    const [newGroupName, setNewGroupName] = useState(group?.title || "");
    const [disableGenerateNewAiName, setDisableGenerateNewAiName] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const { isPremium } = usePremiumStatus();
    const user = useAuthStore((state) => state.user);
    const aiAutoGroupNaming = useSettingsStore((state) => state.settings.aiAutoGroupNaming);
    const geminiApiKey = useSettingsStore((state) => state.settings.geminiApiKey);
    const hasOwnApiKey = Boolean(geminiApiKey);
    const canUseAI = (isPremium || hasOwnApiKey) && aiAutoGroupNaming;

    useEffect(() => {
        if (isRenameModalOpen === true) {
            // Reset the disabled state only when opening a new rename session
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDisableGenerateNewAiName(false);
            setIsGenerating(false);
            setNewGroupName(group?.title || "");
        }
    }, [isRenameModalOpen, group?.title]);

    async function handleRename() {
        try {
            if (!group) return;
            await chrome.tabGroups.update(group.id, { title: newGroupName });
            setIsRenameModalOpen(false);
        } catch (error) {
            console.log("Error renaming group:", error);
        }
    }

    return (
        <Dialog
            modal={true}
            open={isRenameModalOpen}
            aria-describedby={undefined}
            onOpenChange={(newOpen) => {
                if (!newOpen) {
                    return;
                }
            }}
        >
            <DialogContent
                id="rename-group-dialog"
                aria-describedby={undefined}
                className="max-w-[calc(100vw-2rem)] rounded-lg px-4 sm:w-[400px] sm:max-w-[calc(100vw-2rem)] sm:px-6"
                onInteractOutside={(e) => {
                    e.preventDefault();
                }}
                onKeyDown={(e) => {
                    if (e.key === "Escape") {
                        setIsRenameModalOpen(false);
                    }
                }}
            >
                <style>{`button:has(> svg.lucide-x) { display: none; }`}</style>
                <DialogHeader>
                    <DialogTitle>Rename</DialogTitle>
                </DialogHeader>
                <div className="relative">
                    <Input
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Enter group name"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleRename();
                            }

                            if (e.key === "Escape") {
                                setNewGroupName(group?.title || "");
                                setIsRenameModalOpen(false);
                            }
                        }}
                        autoFocus
                    />
                    {canUseAI && (
                        <Button
                            type="button"
                            variant="link"
                            onClick={(e) => {
                                if (!group || isGenerating || disableGenerateNewAiName) return;
                                generateNewAiName(
                                    e,
                                    group,
                                    isPremium,
                                    user?.email,
                                    geminiApiKey,
                                    setNewGroupName,
                                    setDisableGenerateNewAiName,
                                    setIsGenerating
                                );
                            }}
                            className={cn(
                                "absolute right-[-7px] top-[-40px] h-fit transform rounded-full px-1.5 py-1.5 text-foreground focus:outline-none [&_svg]:size-4",
                                (disableGenerateNewAiName || isGenerating) && "opacity-80 cursor-default"
                            )}
                            title={(() => {
                                if (isGenerating) {
                                    return "Generating group name...";
                                }

                                if (disableGenerateNewAiName) {
                                    return "Finished generating group name";
                                }

                                return "Generate group name";
                            })()}
                            tabIndex={-1}
                        >
                            {isGenerating ? <LoadingSpinner /> : disableGenerateNewAiName ? <Check /> : <Sparkles />}
                        </Button>
                    )}
                </div>
                <DialogFooter className="gap-1.5">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setIsRenameModalOpen(false);
                            handleRename();
                        }}
                    >
                        Save
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setIsRenameModalOpen(false);
                        }}
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
