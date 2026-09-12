import { useTabManagerStore } from "@/stores/tabManagerStore";
import { useTabsStore } from "@/stores/tabsStore";
import { ColorEnum } from "@/types/TabGroup";
import { callGeminiDirect } from "@/utils/geminiDirectCall";
import { getAutoOrganizePrompt, getPromptToOrganizePrompt } from "@/utils/tabs/getGroupingPrompts";
import { getPromptOrganizationFallback } from "@/utils/tabs/getPromptOrganizationFallback";
import type { PromptType } from "@packages/shared/gemini-config";
import { toast } from "sonner";
import { loadTabs } from "./loadTabs";
import { chromeTabsGroup } from "@/utils/tabs/chromeTabsGroup";
import { getConvexProxyUrl } from "@/utils/getConvexProxyUrl";

interface SuggestedGroup {
    name: string;
    color: ColorEnum;
    tabIds: number[];
}

export async function handleAutoOrganize(isPremium: boolean, userEmail?: string | null, geminiApiKey?: string, organizationInstruction?: string) {
    const { regularTabs, tabGroups } = useTabsStore.getState();
    const { setToastDuration, setIsAutoOrganizeDialogOpen, setAutoOrganizeGroups, setIsAutoOrganizeLoading } = useTabManagerStore.getState().actions;
    const normalizedInstruction = organizationInstruction?.trim();
    const isPromptOrganize = Boolean(normalizedInstruction);

    setIsAutoOrganizeLoading(true);

    const normalizedGeminiApiKey = geminiApiKey?.trim();
    const hasOwnApiKey = Boolean(normalizedGeminiApiKey);
    const shouldUseDirectByok = hasOwnApiKey && (!isPremium || !userEmail);

    try {
        if (!isPremium && !hasOwnApiKey) {
            setIsAutoOrganizeLoading(false);
            toast.error("You need to be on a paid plan or provide your own Gemini API key to auto organize tabs");
            return;
        }

        if (!userEmail && !hasOwnApiKey) {
            setIsAutoOrganizeLoading(false);
            toast.error("Please sign in or provide your own Gemini API key to use auto organize feature");
            return;
        }

        // Auto Group works on ungrouped tabs. A user prompt may also move tabs
        // out of existing groups, so make all non-pinned tabs available to it.
        const tabsToAnalyze = (isPromptOrganize ? [...regularTabs, ...tabGroups.flatMap((group) => group.tabs)] : regularTabs).map((tab) => {
            let url = tab.url;
            let title = tab.title;

            // Skip extension URLs
            if (url.startsWith("chrome-extension://") || url.startsWith("extension://")) {
                if (url.includes("&url=")) {
                    // Extract the substring between "&url=" and the next "&" (or end of string), then decode it
                    const urlMatch = url.match(/&url=([^&]*)/);
                    url = urlMatch ? decodeURIComponent(urlMatch[1]) : "No URL";
                } else {
                    url = "No URL";
                }
            }

            url = url.length > 50 ? url.slice(0, 50) : url;
            title = tab.title.slice(0, 40);

            return {
                id: tab.id,
                title: title,
                url: url,
            };
        });

        if (tabsToAnalyze.length === 0) {
            toast.error(isPromptOrganize ? "No tabs to organize." : "No ungrouped tabs to organize.");
            setIsAutoOrganizeLoading(false);
            return;
        }

        // Build prompt
        const prompt = isPromptOrganize
            ? getPromptToOrganizePrompt(tabsToAnalyze, normalizedInstruction ?? "")
            : getAutoOrganizePrompt(tabsToAnalyze);
        const promptType: PromptType = isPromptOrganize ? "promptOrganize" : "organize";
        console.log("prompt to organize:", prompt);

        // Create the AI promise - use direct call for BYOK, proxy for premium
        const aiPromise = async () => {
            let responseText: string;

            if (shouldUseDirectByok && normalizedGeminiApiKey) {
                // BYOK: Call Gemini API directly from frontend
                responseText = await callGeminiDirect(normalizedGeminiApiKey, prompt, promptType);
            } else {
                // Premium: Use backend proxy
                const convexUrl = getConvexProxyUrl();

                if (!convexUrl) {
                    throw new Error("Convex URL not configured");
                }

                const response = await fetch(`${convexUrl}/gemini-proxy`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: userEmail,
                        prompt: prompt,
                        promptType,
                        ...(isPromptOrganize ? { userInstruction: normalizedInstruction } : {}),
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.log(`API error for auto organize: ${response.status} ${response.statusText} - ${errorText}`);
                    throw new Error(`${errorText}`);
                }

                const result = await response.json();
                responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

                if (!responseText) {
                    throw new Error("AI did not return a valid response");
                }
            }

            console.log("response to auto organize:", responseText);

            // Parse JSON from response
            const jsonStart = responseText.indexOf("[");
            const jsonEnd = responseText.lastIndexOf("]");
            const fallbackGroup =
                isPromptOrganize && normalizedInstruction ? getPromptOrganizationFallback(tabsToAnalyze, normalizedInstruction) : null;
            let groups: SuggestedGroup[] = [];
            if (jsonStart !== -1 && jsonEnd !== -1) {
                try {
                    const parsedGroups: unknown = JSON.parse(responseText.slice(jsonStart, jsonEnd + 1));
                    groups = validateSuggestedGroups(parsedGroups, new Set(tabsToAnalyze.map((tab) => tab.id)));
                } catch (error) {
                    if (!fallbackGroup) throw error;
                }
            } else if (!fallbackGroup) {
                throw new Error("AI did not return a valid JSON array.");
            }

            if (groups.length === 0 && fallbackGroup) {
                console.log("AI returned no usable matching tabs, using local prompt matching:", fallbackGroup);
                groups = [fallbackGroup];
            }

            return {
                groups,
                analyzedTabCount: tabsToAnalyze.length,
                matchedTabCount: groups.reduce((total, group) => total + group.tabIds.length, 0),
            };
        };

        // Execute the promise and show toast feedback
        const promise = aiPromise();

        // Use toast.promise for automatic loading/success/error handling
        toast.promise(promise, {
            position: "top-center",
            loading: isPromptOrganize
                ? `Finding tabs that match your prompt (${tabsToAnalyze.length})...`
                : `Analyzing ungrouped tabs (${tabsToAnalyze.length}) and organizing them by topic...`,
            closeButton: true,
            duration: 3000,
            success: (data) => {
                if (isPromptOrganize) {
                    if (data.groups.length === 0) return "No tabs matched your prompt";
                    return `Found ${data.matchedTabCount} tabs for ${data.groups.length} ${data.groups.length === 1 ? "group" : "groups"}`;
                }
                return `Successfully organized ${data.analyzedTabCount} tabs into ${data.groups.length} groups`;
            },
            error: (error) => {
                // Don't show error if it's because the tab is in the middle of another group
                if (error.message.includes("in the middle of another group")) {
                    return null;
                }

                const errorMessage = error instanceof Error ? error.message : "Failed to organize tabs. Please try again.";
                return errorMessage;
            },
        });

        // Await the actual result
        const { groups } = await promise;

        setAutoOrganizeGroups(groups);
        if (groups.length > 0) setIsAutoOrganizeDialogOpen(true);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.log("Failed to get AI grouping: ", errorMessage);
    } finally {
        setIsAutoOrganizeLoading(false);
        setToastDuration(4000);
    }
}

function validateSuggestedGroups(value: unknown, availableTabIds: Set<number>): SuggestedGroup[] {
    if (!Array.isArray(value)) throw new Error("AI did not return a valid list of groups.");

    const seenTabIds = new Set<number>();

    return value
        .map((group): SuggestedGroup | null => {
            if (!group || typeof group !== "object") return null;

            const candidate = group as { name?: unknown; color?: unknown; tabIds?: unknown };
            if (typeof candidate.name !== "string" || !Array.isArray(candidate.tabIds)) return null;

            const tabIds = candidate.tabIds.filter((tabId): tabId is number => {
                if (typeof tabId !== "number" || !availableTabIds.has(tabId) || seenTabIds.has(tabId)) return false;
                seenTabIds.add(tabId);
                return true;
            });

            if (tabIds.length === 0) return null;

            return {
                name: candidate.name.trim().slice(0, 14) || "Organized",
                color: verifyAllowedColor(typeof candidate.color === "string" ? candidate.color : "blue"),
                tabIds,
            };
        })
        .filter((group): group is SuggestedGroup => group !== null);
}

const sleep = async (ms: number) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
};

// Handler to apply the AI grouping
export async function handleAcceptAutoOrganize(selectedColor?: ColorEnum) {
    const { setIsAutoOrganizeDialogOpen, setAutoOrganizeGroups } = useTabManagerStore.getState().actions;
    const autoOrganizeGroups = useTabManagerStore.getState().autoOrganizeGroups;

    setIsAutoOrganizeDialogOpen(false);

    if (!autoOrganizeGroups || autoOrganizeGroups.length === 0) return;

    const tabs = await chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });

    // Get all current tab IDs for validation
    const currentTabIds = new Set(tabs.map((tab) => tab.id).filter((id) => id !== undefined));

    // Create the promise for applying organization
    const applyOrganizationPromise = async () => {
        let successfulGroupCount = 0;
        const newGroupIds = new Set<number>();

        const lastTabIndex = (await chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT })).length;
        let otherGroupExists = false;
        let otherGroupTabGroupId: number | null = null;
        let otherGroupTabIds: number[] = [];

        for (let i = 0; i < autoOrganizeGroups.length; i++) {
            const group = autoOrganizeGroups[i];

            // Filter out tab IDs that don't exist in the current window
            const validTabIds = group.tabIds.filter((tabId) => currentTabIds.has(tabId));

            if (validTabIds.length === 0) {
                console.log(`Skipping group "${group.name}" - no valid tab IDs found`);
                continue;
            }

            // Log if some tab IDs were filtered out
            if (validTabIds.length !== group.tabIds.length) {
                const invalidTabIds = group.tabIds.filter((tabId) => !currentTabIds.has(tabId));
                console.log(`Some tab IDs in group "${group.name}" don't exist and were filtered out:`, invalidTabIds);
            }

            try {
                (window as any).isAutoOrganizing = true;

                await chromeTabsGroup(validTabIds, { windowId: chrome.windows.WINDOW_ID_CURRENT });
                // Get the new group id
                const tab = await chrome.tabs.get(validTabIds[0]);
                const tabGroupId = tab.groupId;

                try {
                    if (group.name !== "Other") {
                        await chrome.tabGroups.move(tabGroupId, { index: lastTabIndex - validTabIds.length }); // -1
                    } else {
                        otherGroupExists = true;
                        otherGroupTabGroupId = tabGroupId;
                        otherGroupTabIds = validTabIds;
                    }
                } catch (err) {
                    console.log(`1st time Failed to move tab group ${group.name} to index {end of window} while auto organizing. ${err}`);
                }

                // Set group color and title - use selectedColor if provided, otherwise use group.color
                const colorToUse = selectedColor || (verifyAllowedColor(group.color || "blue") as chrome.tabGroups.ColorEnum);

                chrome.tabGroups.update(tabGroupId, { title: group.name, color: colorToUse });

                // Save the newly created group ID
                newGroupIds.add(tabGroupId);
                successfulGroupCount++;

                await sleep(300);
            } catch (err) {
                console.log(`Failed to create group "${group.name}":`, err);
            }
        }

        if (otherGroupExists && otherGroupTabGroupId && otherGroupTabIds.length > 0) {
            await chrome.tabGroups.move(otherGroupTabGroupId, { index: lastTabIndex - otherGroupTabIds.length }); // -1
        }

        // After all groups are created, collapse them
        const setCollapsedGroups = useTabsStore.getState().actions.setCollapsedGroups;
        const collapsedGroups = useTabsStore.getState().collapsedGroups;
        setCollapsedGroups(new Set([...collapsedGroups, ...newGroupIds]));

        (window as any).isAutoOrganizing = false;

        return { groupCount: successfulGroupCount };
    };

    try {
        // Execute the promise and show toast feedback
        const promise = applyOrganizationPromise();

        // Use toast.promise for automatic loading/success/error handling
        toast.promise(promise, {
            loading: "Applying auto organization...",
            position: "top-center",
            success: (data) => {
                toast.dismiss();
                return `Successfully created ${data.groupCount} tab groups`;
            },
            error: (error) => {
                const errorMessage = error instanceof Error ? error.message : "Failed to apply auto organization. Please try again.";
                return errorMessage;
            },
        });

        // Await the actual result
        await promise;
    } catch (err) {
        console.log("Failed to apply auto organization. Please try again.", err);
    }

    setAutoOrganizeGroups([]);
    // Reload tabs/groups
    loadTabs("auto-organize");
}

function verifyAllowedColor(color: string): ColorEnum {
    const allowedColors = ["blue", "cyan", "green", "orange", "pink", "purple", "red", "yellow", "grey"];

    if (allowedColors.includes(color)) {
        return color as ColorEnum;
    }

    return "blue" as ColorEnum;
}
