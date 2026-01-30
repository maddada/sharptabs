import { useTabManagerStore } from "@/stores/tabManagerStore";
import { useTabsStore } from "@/stores/tabsStore";
import { callGeminiDirect } from "@/utils/geminiDirectCall";
import { getDeleteUselessTabsPrompt } from "@/utils/tabs/getGroupingPrompts";
import { toast } from "sonner";
import { loadTabs } from "./loadTabs";

export async function handleDeleteUselessTabs(isPremium: boolean, userEmail?: string | null, geminiApiKey?: string) {
    const { pinnedTabs, regularTabs, tabGroups } = useTabsStore.getState();
    const groupedTabs = tabGroups.map((group) => group.tabs).flat();
    const allTabs = [...pinnedTabs, ...regularTabs, ...groupedTabs];
    const {
        setToastDuration,
        setIsDeleteUselessTabsDialogOpen,
        setCloseUselessTabsGroups: setDeleteUselessTabsGroups,
        setIsDeleteUselessTabsLoading,
    } = useTabManagerStore.getState().actions;

    setIsDeleteUselessTabsLoading(true);

    const hasOwnApiKey = Boolean(geminiApiKey);

    try {
        if (!isPremium && !hasOwnApiKey) {
            setIsDeleteUselessTabsLoading(false);
            toast.error("You need to be on a paid plan or provide your own Gemini API key to use delete useless tabs");
            return;
        }

        if (!userEmail && !hasOwnApiKey) {
            setIsDeleteUselessTabsLoading(false);
            toast.error("Please sign in or provide your own Gemini API key to use delete useless tabs feature");
            return;
        }

        // Gather all tabs to analyze
        const tabsToAnalyze = allTabs.map((tab) => {
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
            toast.error("No tabs to analyze.");
            setIsDeleteUselessTabsLoading(false);
            return;
        }

        // Build prompt
        const prompt = getDeleteUselessTabsPrompt(tabsToAnalyze);
        console.log("prompt to delete useless tabs:", prompt);

        // Create the AI promise - use direct call for BYOK, proxy for premium
        const aiPromise = async () => {
            let responseText: string;

            if (hasOwnApiKey && geminiApiKey) {
                // BYOK: Call Gemini API directly from frontend
                responseText = await callGeminiDirect(geminiApiKey, prompt, "deleteUseless");
            } else {
                // Premium: Use backend proxy
                const convexUrl = import.meta.env.VITE_PUBLIC_CONVEX_URL;

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
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.log(`API error for delete useless tabs: ${response.status} ${response.statusText} - ${errorText}`);
                    throw new Error(`${errorText}`);
                }

                const result = await response.json();
                responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

                if (!responseText) {
                    throw new Error("AI did not return a valid response");
                }
            }

            console.log("response to delete useless tabs:", responseText);

            // Parse JSON from response
            const jsonStart = responseText.indexOf("[");
            const jsonEnd = responseText.lastIndexOf("]");
            let groups = [];
            if (jsonStart !== -1 && jsonEnd !== -1) {
                groups = JSON.parse(responseText.slice(jsonStart, jsonEnd + 1));
            } else {
                throw new Error("AI did not return a valid JSON array.");
            }

            return { groups, tabCount: tabsToAnalyze.length };
        };

        // Execute the promise and show toast feedback
        const promise = aiPromise();

        // Use toast.promise for automatic loading/success/error handling
        toast.promise(promise, {
            position: "top-center",
            loading: `Analyzing ${tabsToAnalyze.length} tabs to identify useless ones...`,
            closeButton: true,
            duration: 3000,
            success: (data) => {
                const totalUselessTabs = data.groups.reduce((sum: number, group: any) => sum + group.tabIds.length, 0);
                if (totalUselessTabs === 0) {
                    return "No useless tabs found";
                }
                return `Found ${totalUselessTabs} useless tabs across ${data.groups.length} categories`;
            },
            error: (error) => {
                const errorMessage = error instanceof Error ? error.message : "Failed to analyze tabs. Please try again.";
                return errorMessage;
            },
        });

        // Await the actual result
        const { groups } = await promise;

        setDeleteUselessTabsGroups(groups);
        setIsDeleteUselessTabsDialogOpen(true);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.log("Failed to get AI analysis: ", errorMessage);
    } finally {
        setIsDeleteUselessTabsLoading(false);
        setToastDuration(4000);
    }
}

// Handler to apply the tab deletion
export async function handleAcceptDeleteUselessTabs() {
    const { setIsDeleteUselessTabsDialogOpen, setCloseUselessTabsGroups: setDeleteUselessTabsGroups } = useTabManagerStore.getState().actions;
    const deleteUselessTabsGroups = useTabManagerStore.getState().deleteUselessTabsGroups;

    setIsDeleteUselessTabsDialogOpen(false);

    if (!deleteUselessTabsGroups || deleteUselessTabsGroups.length === 0) return;

    const tabs = await chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });

    // Get all current tab IDs for validation
    const currentTabIds = new Set(tabs.map((tab) => tab.id).filter((id) => id !== undefined));

    // Create the promise for applying deletion
    const applyDeletionPromise = async () => {
        let deletedCount = 0;

        for (let i = 0; i < deleteUselessTabsGroups.length; i++) {
            const group = deleteUselessTabsGroups[i];

            // Filter out tab IDs that don't exist in the current window
            const validTabIds = group.tabIds.filter((tabId) => currentTabIds.has(tabId));

            if (validTabIds.length === 0) {
                console.log(`Skipping group "${group.reason}" - no valid tab IDs found`);
                continue;
            }

            // Log if some tab IDs were filtered out
            if (validTabIds.length !== group.tabIds.length) {
                const invalidTabIds = group.tabIds.filter((tabId) => !currentTabIds.has(tabId));
                console.log(`Some tab IDs in group "${group.reason}" don't exist and were filtered out:`, invalidTabIds);
            }

            try {
                console.log(`Deleting ${validTabIds.length} tabs for reason: ${group.reason}`);

                // Close the tabs
                await chrome.tabs.remove(validTabIds);
                deletedCount += validTabIds.length;
            } catch (err) {
                console.log(`Failed to delete tabs for reason "${group.reason}":`, err);
            }
        }

        return { deletedCount };
    };

    try {
        // Execute the promise and show toast feedback
        const promise = applyDeletionPromise();

        // Use toast.promise for automatic loading/success/error handling
        toast.promise(promise, {
            loading: "Deleting useless tabs...",
            position: "top-center",
            success: (data) => {
                toast.dismiss();
                return `Successfully deleted ${data.deletedCount} useless tabs`;
            },
            error: (error) => {
                const errorMessage = error instanceof Error ? error.message : "Failed to delete useless tabs. Please try again.";
                return errorMessage;
            },
        });

        // Await the actual result
        await promise;
    } catch (err) {
        console.log("Failed to delete useless tabs. Please try again.", err);
    }

    setDeleteUselessTabsGroups([]);
    // Reload tabs/groups
    loadTabs("delete-useless-tabs");
}
