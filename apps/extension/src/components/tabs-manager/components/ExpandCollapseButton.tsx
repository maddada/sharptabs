import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { CustomTooltip } from "@/components/simple/CustomTooltip";
import { Button } from "@/components/ui/button";
import { useTabsStore } from "@/stores/tabsStore";

export function ExpandCollapseAllButton({
    setSkipAnimation,
    opacityClass,
}: {
    setSkipAnimation: (skipAnimation: boolean) => void;
    opacityClass: string;
}) {
    const activeTabId = useTabsStore((s) => s.activeTabId);
    const tabGroups = useTabsStore((s) => s.tabGroups);
    const collapsedGroups = useTabsStore((s) => s.collapsedGroups);
    const { setCollapsedGroups } = useTabsStore((s) => s.actions);

    const allGroupIds = tabGroups.map((group) => group.id);
    const activeTabGroupId = tabGroups.find((group) => group.tabs.some((tab) => tab.id === activeTabId))?.id;
    const collapsibleGroupIds = allGroupIds.filter((id) => id !== activeTabGroupId);
    const areAllCollapsed = collapsibleGroupIds.length > 0 && collapsibleGroupIds.every((id) => collapsedGroups.has(id));
    return (
        <CustomTooltip content={areAllCollapsed ? "Expand All" : "Collapse All"}>
            <div className={opacityClass}>
                <Button
                    variant="outline"
                    className="px-3"
                    onClick={() => {
                        setSkipAnimation(true);
                        if (areAllCollapsed) {
                            setCollapsedGroups(new Set());
                        } else {
                            setCollapsedGroups(new Set(collapsibleGroupIds));
                        }
                    }}
                    disabled={collapsibleGroupIds.length === 0}
                    tabIndex={-1}
                >
                    {areAllCollapsed ? <ChevronsUpDown className="h-4 w-4" /> : <ChevronsDownUp className="h-4 w-4" />}
                </Button>
            </div>
        </CustomTooltip>
    );
}
