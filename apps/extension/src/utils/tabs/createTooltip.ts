import { Tab } from "@/types/Tab";
import { getTabTitle } from "./getTabTitle";

type CreateTooltipOptions = {
    showTitleInTooltips: boolean;
    showUrlInTooltips: boolean;
    isDuplicateCheckMode?: boolean;
    isTitleTruncated?: boolean;
};

/**
 * Creates formatted tooltip title and URL for a tab
 * @param tab The tab object
 * @param options Configuration options for tooltip display
 * @returns Tuple containing [formattedTitle, formattedUrl]
 */
export const createTooltip = (tab: Tab, options: CreateTooltipOptions): [string, string] => {
    const { showTitleInTooltips, showUrlInTooltips, isDuplicateCheckMode = false, isTitleTruncated = true } = options;

    // Create the tooltip title (break up the tab title into 45 char lines)
    // Only show title if setting is enabled AND title is truncated
    const tabTitle = getTabTitle(tab);
    const tooltipTabTitle = showTitleInTooltips && isTitleTruncated ? `${tabTitle?.match(/.{1,45}(\s|$)/g)?.join("\n")}` : "";

    // Get the URL for the tooltip
    const tempUrl = tab?.url || "";

    // Create the tooltip URL (break up the URL into 40 char lines)
    let tooltipTabUrl = tempUrl?.match(/.{1,40}/g)?.join("\n") || "";
    tooltipTabUrl = tooltipTabUrl.length > 120 ? tooltipTabUrl.substring(0, 120) + "..." : tooltipTabUrl;
    tooltipTabUrl = showUrlInTooltips || isDuplicateCheckMode ? tooltipTabUrl : "";

    return [tooltipTabTitle, tooltipTabUrl];
};

/**
 * Creates a complete tooltip string with title and URL separated by a divider
 * @param tab The tab object
 * @param options Configuration options for tooltip display
 * @returns Complete tooltip string
 */
export const createTooltipString = (tab: Tab, options: CreateTooltipOptions): string => {
    const { showTitleInTooltips, showUrlInTooltips, isDuplicateCheckMode = false, isTitleTruncated = true } = options;
    const [tooltipTabTitle, tooltipTabUrl] = createTooltip(tab, options);

    // Create separator if title is actually shown (enabled AND truncated) AND (URL is shown OR duplicate check mode)
    const showTitle = showTitleInTooltips && isTitleTruncated;
    const tooltipSeparator = showTitle && (showUrlInTooltips || isDuplicateCheckMode) ? `\n\n` : ""; //${"⎯".repeat(Math.max(tab.title.length, 20))}

    return tooltipTabTitle + tooltipSeparator + tooltipTabUrl;
};
