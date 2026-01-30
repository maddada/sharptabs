import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTabManagerStore } from "@/stores/tabManagerStore";
import { discardTabsNativelySafely } from "@/utils/tabs/discardTabsNativelySafely";
import { History, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const MAX_HISTORY_ITEMS = 6;

const WORKSPACE_PLACEHOLDER = "<workspace>";

type Preset = {
    id: string;
    label: string;
    template: string;
    needsWorkspace: boolean;
};

const PRESETS: Preset[] = [
    { id: "linear", label: "Linear", template: "https://linear.app/{workspace}/issue/", needsWorkspace: true },
    { id: "jira", label: "Jira", template: "https://{workspace}.atlassian.net/browse/", needsWorkspace: true },
    { id: "testrail", label: "TestRail", template: "https://{workspace}.testrail.io/index.php?/tests/view/", needsWorkspace: true },
];

export function BulkOpenLinksDialog() {
    const isBulkOpenLinksDialogOpen = useTabManagerStore((state) => state.isBulkOpenLinksDialogOpen);
    const { setIsBulkOpenLinksDialogOpen } = useTabManagerStore((state) => state.actions);
    const { settings, updateSettings } = useSettingsStore();

    const [baseUrl, setBaseUrl] = useState(settings.bulkOpenLinksBaseUrl || "");
    const [terms, setTerms] = useState(settings.bulkOpenLinksTerms || "");
    const [workspace, setWorkspace] = useState(settings.bulkOpenLinksWorkspace || "");
    const [isLoading, setIsLoading] = useState(false);

    const openButtonRef = useRef<HTMLButtonElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);

    // Load initial values from settings when dialog opens
    useEffect(() => {
        if (isBulkOpenLinksDialogOpen) {
            console.log("BulkOpenLinksDialog history:", settings.bulkOpenLinksHistory);
            setBaseUrl(settings.bulkOpenLinksBaseUrl || "");
            setTerms(settings.bulkOpenLinksTerms || "");
            setWorkspace(settings.bulkOpenLinksWorkspace || "");
            setTimeout(() => {
                openButtonRef.current?.focus();
            }, 50);
        }
    }, [
        isBulkOpenLinksDialogOpen,
        settings.bulkOpenLinksBaseUrl,
        settings.bulkOpenLinksTerms,
        settings.bulkOpenLinksWorkspace,
        settings.bulkOpenLinksHistory,
    ]);

    const applyPreset = (preset: Preset) => {
        const workspaceValue = workspace.trim() || WORKSPACE_PLACEHOLDER;
        const url = preset.template.replace("{workspace}", workspaceValue);
        setBaseUrl(url);
    };

    // Custom handler to prevent automatic closing
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            return;
        }
    };

    const handleClose = () => {
        setIsBulkOpenLinksDialogOpen(false);
    };

    // Parse terms by newlines, commas, or semicolons
    const parseTerms = (input: string): string[] => {
        return input
            .split(/[\n,;]+/)
            .map((term) => term.trim())
            .filter((term) => term.length > 0);
    };

    // Restore values from a history entry
    const restoreFromHistory = (entry: { workspace: string; baseUrl: string; terms: string }) => {
        setWorkspace(entry.workspace);
        setBaseUrl(entry.baseUrl);
        setTerms(entry.terms);
    };

    // Remove a history entry
    const removeHistoryEntry = (timestamp: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const newHistory = (settings.bulkOpenLinksHistory || []).filter((entry) => entry.timestamp !== timestamp);
        updateSettings({ bulkOpenLinksHistory: newHistory });
    };

    // Get a display label for a history entry
    const getHistoryLabel = (entry: { workspace: string; baseUrl: string; terms: string }) => {
        const termLines = entry.terms.split(/[\n,;]+/).filter((t) => t.trim().length > 0);
        const termCount = termLines.length;
        const firstTerm = termLines[0]?.trim().slice(0, 20) || "";

        if (entry.baseUrl) {
            try {
                const urlObj = new URL(entry.baseUrl.startsWith("http") ? entry.baseUrl : `https://${entry.baseUrl}`);
                const host = urlObj.hostname.replace(/^www\./, "");
                return `${host} (${termCount} item${termCount !== 1 ? "s" : ""})`;
            } catch {
                return `${entry.baseUrl.slice(0, 20)}... (${termCount})`;
            }
        }
        return firstTerm ? `${firstTerm}${termCount > 1 ? ` +${termCount - 1}` : ""}` : "Empty";
    };

    // Check if a term looks like a URL
    const isUrl = (term: string): boolean => {
        return term.startsWith("http://") || term.startsWith("https://") || /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+/.test(term);
    };

    // Build URL from base URL and term (only used when base URL is provided)
    const buildUrl = (base: string, term: string): string => {
        const trimmedBase = base.trim();
        if (trimmedBase.includes("%s")) {
            return trimmedBase.replace(/%s/g, encodeURIComponent(term));
        }
        // If no %s placeholder, append the term to the end
        if (trimmedBase.endsWith("/")) {
            return trimmedBase + encodeURIComponent(term);
        }
        return trimmedBase + "/" + encodeURIComponent(term);
    };

    // Normalize a URL-like term to a full URL
    const normalizeUrl = (term: string): string => {
        if (term.startsWith("http://") || term.startsWith("https://")) {
            return term;
        }
        return "https://" + term;
    };

    const handleOpenLinks = async () => {
        const parsedTerms = parseTerms(terms);

        if (parsedTerms.length === 0) {
            toast.error("Please enter at least one term or URL");
            return;
        }

        setIsLoading(true);

        try {
            // Add to history (at the beginning, limit to MAX_HISTORY_ITEMS)
            const newHistoryEntry = {
                workspace: workspace.trim(),
                baseUrl: baseUrl.trim(),
                terms: terms.trim(),
                timestamp: Date.now(),
            };
            const existingHistory = settings.bulkOpenLinksHistory || [];
            // Remove duplicate entries (same workspace, baseUrl, and terms)
            const filteredHistory = existingHistory.filter(
                (entry) =>
                    entry.workspace !== newHistoryEntry.workspace ||
                    entry.baseUrl !== newHistoryEntry.baseUrl ||
                    entry.terms !== newHistoryEntry.terms
            );
            const newHistory = [newHistoryEntry, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);

            // Save values to storage before opening links
            updateSettings({
                bulkOpenLinksBaseUrl: baseUrl,
                bulkOpenLinksTerms: terms,
                bulkOpenLinksWorkspace: workspace,
                bulkOpenLinksHistory: newHistory,
            });

            const createdTabIds: number[] = [];
            const hasBaseUrl = baseUrl.trim().length > 0;

            // Create tabs for each term
            for (const term of parsedTerms) {
                if (hasBaseUrl) {
                    // Use base URL template
                    const url = buildUrl(baseUrl, term);
                    const tab = await chrome.tabs.create({ url, active: false });
                    if (tab.id) {
                        createdTabIds.push(tab.id);
                    }
                } else if (isUrl(term)) {
                    // Term looks like a URL, open it directly
                    const url = normalizeUrl(term);
                    const tab = await chrome.tabs.create({ url, active: false });
                    if (tab.id) {
                        createdTabIds.push(tab.id);
                    }
                } else {
                    // Term is a search query, use browser's default search engine
                    await chrome.search.query({ text: term, disposition: "NEW_TAB" });
                    // chrome.search.query doesn't return the tab, so we can't track it for grouping
                }
            }

            // Group all created tabs together (only tabs we could track)
            if (createdTabIds.length > 0) {
                try {
                    const groupId = await chrome.tabs.group({ tabIds: createdTabIds });
                    // Extract a clean name from the base URL for the group title
                    let groupName: string;
                    if (hasBaseUrl) {
                        groupName = baseUrl.trim();
                        try {
                            const urlObj = new URL(groupName.startsWith("http") ? groupName : `https://${groupName}`);
                            groupName = urlObj.hostname.replace(/^www\./, "");
                        } catch {
                            groupName = groupName.slice(0, 30);
                        }
                    } else {
                        groupName = "Bulk Links";
                    }
                    await chrome.tabGroups.update(groupId, { title: groupName });
                } catch (error) {
                    console.error("Error grouping tabs:", error);
                }

                // Wait for tabs to load their favicon and title before discarding
                // Only suspend tabs after the first 20
                const tabsToSuspend = createdTabIds.slice(20);
                if (tabsToSuspend.length > 0) {
                    setTimeout(async () => {
                        try {
                            await discardTabsNativelySafely(tabsToSuspend, undefined, false);
                        } catch (error) {
                            console.error("Error discarding tabs:", error);
                        }
                    }, 6000);
                }
            }

            toast.success(`Opened ${parsedTerms.length} tab(s)`);
            handleClose();
        } catch (error) {
            console.error("Error opening links:", error);
            toast.error("Failed to open links");
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate line numbers based on the number of lines in the textarea
    const lineCount = Math.max(8, terms.split("\n").length);
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

    // Sync line numbers scroll with textarea scroll
    const handleTextareaScroll = () => {
        if (lineNumbersRef.current && textareaRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    return (
        <AlertDialog open={isBulkOpenLinksDialogOpen} onOpenChange={handleOpenChange}>
            <AlertDialogContent id="bulk-open-links-dialog" className="w-[calc(100vw-2rem)] max-w-[400px] overflow-hidden rounded-lg px-4">
                <style>{`#bulk-open-links-dialog > button:has(> svg.lucide-x) { display: none; }`}</style>
                <AlertDialogHeader>
                    <AlertDialogTitle>Bulk Open Links</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogDescription asChild>
                    <div className="text-center text-sm text-muted-foreground">
                        Enter URLs directly, or use a base URL with <code className="rounded bg-muted px-1">%s</code> as placeholder. If{" "}
                        <code className="rounded bg-muted px-1">%s</code> isn't used, terms will be appended to the end of the base URL. Separate
                        entries with new lines, commas, or semicolons.
                    </div>
                </AlertDialogDescription>

                {/* History Section */}
                {settings.bulkOpenLinksHistory && settings.bulkOpenLinksHistory.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <History className="h-3 w-3" />
                            <span>Recent</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {settings.bulkOpenLinksHistory.map((entry) => (
                                <button
                                    key={entry.timestamp}
                                    type="button"
                                    onClick={() => restoreFromHistory(entry)}
                                    className={cn(
                                        "group flex items-center gap-1 rounded-md border border-border/50 bg-muted/30 px-2 py-1 text-[11px] transition-colors",
                                        "hover:border-border hover:bg-muted/50"
                                    )}
                                >
                                    <span className="max-w-[120px] truncate">{getHistoryLabel(entry)}</span>
                                    <X
                                        className="h-3 w-3 shrink-0 text-muted-foreground/50 transition-colors hover:text-destructive"
                                        onClick={(e) => removeHistoryEntry(entry.timestamp, e)}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-4 overflow-hidden">
                    {/* Workspace Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Workspace (for presets)</label>
                        <Input
                            value={workspace}
                            onChange={(e) => setWorkspace(e.target.value)}
                            placeholder="my-workspace"
                            className="w-full font-mono text-sm focus-visible:ring-inset"
                        />
                    </div>

                    {/* Preset Buttons */}
                    <div className="flex flex-wrap gap-1.5">
                        {PRESETS.map((preset) => (
                            <Button key={preset.id} variant="outline" size="sm" className="h-7 px-2 text-[10px]" onClick={() => applyPreset(preset)}>
                                {preset.label}
                            </Button>
                        ))}
                    </div>

                    {/* Base URL Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Base URL (optional)</label>
                        <Input
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                            placeholder="https://site.com/"
                            className="w-full font-mono text-sm focus-visible:ring-inset"
                        />
                    </div>

                    {/* Terms Textarea with Line Numbers */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">URLs or terms (one per line)</label>
                        <div className="flex w-full rounded-md border border-input">
                            {/* Line numbers column */}
                            <div
                                ref={lineNumbersRef}
                                className="flex shrink-0 flex-col bg-muted/30 px-2 py-2 text-right text-muted-foreground select-none overflow-hidden"
                                style={{ maxHeight: "60vh" }}
                            >
                                {lineNumbers.map((num) => (
                                    <span key={num} className="leading-[1.5rem] text-sm font-mono">
                                        {num}
                                    </span>
                                ))}
                            </div>
                            {/* Textarea */}
                            <textarea
                                ref={textareaRef}
                                value={terms}
                                onChange={(e) => setTerms(e.target.value)}
                                onScroll={handleTextareaScroll}
                                placeholder="https://example.com&#10;github.com/user/repo&#10;search term"
                                wrap="off"
                                className="min-w-0 flex-1 resize-none bg-transparent px-3 py-2 text-sm font-mono leading-[1.5rem] placeholder:text-muted-foreground focus:outline-none overflow-auto whitespace-nowrap"
                                style={{ minHeight: `${Math.min(lineCount, 8) * 1.5}rem`, maxHeight: "60vh" }}
                            />
                        </div>
                    </div>
                </div>

                <AlertDialogFooter className="gap-1.5">
                    <Button variant="secondary" onClick={handleOpenLinks} disabled={isLoading} ref={openButtonRef}>
                        {isLoading ? "Opening..." : "Open Links"}
                    </Button>
                    <Button variant="outline" disabled={isLoading} onClick={handleClose}>
                        Cancel
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
