import { DragContext, DragOperationResult } from "../types/dragDrop";
import { ItemType } from "@/types/CombinedItem";
import { Tab } from "@/types/Tab";
import { TabGroup } from "@/types/TabGroup";

const logDragOperation = (phase: string, data: any) => {
    console.log(`[DRAG-${phase}]`, data);
};

export function shouldSkipOperation(context: DragContext): DragOperationResult {
    const { activeParsed, overParsed, activeItemData, overItemData, overGroupItemData, pinnedTabs, regularTabs, tabGroups, up, oneIfUp } = context;

    if (!overParsed) {
        return { shouldSkip: false };
    }

    try {
        // 1) Pinned → Pinned reorder to same index
        if (overParsed.type === ItemType.PINNED && activeParsed.type === ItemType.PINNED && overItemData) {
            const targetIndex = overItemData.index + oneIfUp;
            if (targetIndex === (activeItemData as Tab).index) {
                logDragOperation("SKIP", { message: "Pinned to pinned no-op (same index)", targetIndex });
                return { shouldSkip: true, reason: "Pinned to pinned no-op (same index)", targetIndex };
            }
        }

        // 2) Regular → Regular reorder to same index
        if (overParsed.type === ItemType.REGULAR && activeParsed.type === ItemType.REGULAR && overItemData) {
            const targetIndex = overItemData.index + oneIfUp;
            if (targetIndex === (activeItemData as Tab).index) {
                logDragOperation("SKIP", { message: "Regular to regular no-op (same index)", targetIndex });
                return { shouldSkip: true, reason: "Regular to regular no-op (same index)", targetIndex };
            }
        }

        // 3) GTAB → GTAB within same group to same index
        if (overParsed.type === ItemType.GTAB && activeParsed.type === ItemType.GTAB && overItemData) {
            const overGroupId = tabGroups.find((g: TabGroup) => g.tabs.find((t: Tab) => t.id === overParsed.id))?.id ?? null;
            const activeGroupId = tabGroups.find((g: TabGroup) => g.tabs.find((t: Tab) => t.id === activeParsed.id))?.id ?? null;
            if (overGroupId !== null && overGroupId === activeGroupId) {
                const targetIndex = overItemData.index + oneIfUp;
                if (targetIndex === (activeItemData as Tab).index) {
                    logDragOperation("SKIP", { message: "Gtab to gtab same-group no-op (same index)", targetIndex });
                    return { shouldSkip: true, reason: "Gtab to gtab same-group no-op (same index)", targetIndex };
                }
            }
        }

        // 4) REGULAR → GSEPARATOR (relative to a group) to same index
        if (overParsed.type === ItemType.GSEPARATOR && activeParsed.type === ItemType.REGULAR && overGroupItemData) {
            const group = overGroupItemData as TabGroup;
            const targetIndex = up ? group.index + group.tabs.length : group.index + group.tabs.length - 1;
            if (targetIndex === (activeItemData as Tab).index) {
                logDragOperation("SKIP", { message: "Regular to gseparator no-op (same index)", targetIndex });
                return { shouldSkip: true, reason: "Regular to gseparator no-op (same index)", targetIndex };
            }
        }

        // 5) GTAB → GROUP (same group) move-to-top but already at same index
        if (overParsed.type === ItemType.GROUP && activeParsed.type === ItemType.GTAB && overItemData) {
            const activeGroupId = tabGroups.find((g: TabGroup) => g.tabs.find((t: Tab) => t.id === activeParsed.id))?.id ?? null;
            if (activeGroupId === overParsed.id) {
                const targetIndex = overItemData.index;
                if (targetIndex === (activeItemData as Tab).index) {
                    logDragOperation("SKIP", { message: "Gtab to group (same group) no-op (same index)", targetIndex });
                    return { shouldSkip: true, reason: "Gtab to group (same group) no-op (same index)", targetIndex };
                }
            }
        }

        // 6) REGULAR → ESEPARATOR to same end index
        if (overParsed.type === ItemType.ESEPARATOR && activeParsed.type === ItemType.REGULAR) {
            const lastTabIndex = tabGroups.reduce((acc: number, group: TabGroup) => acc + group.tabs.length, 0) + regularTabs.length;
            if ((activeItemData as Tab).index === lastTabIndex) {
                logDragOperation("SKIP", { message: "Regular to end separator no-op (already at end)", lastTabIndex });
                return { shouldSkip: true, reason: "Regular to end separator no-op (already at end)", targetIndex: lastTabIndex };
            }
        }

        // 7) GROUP → ESEPARATOR to same target group index
        if (overParsed.type === ItemType.ESEPARATOR && activeParsed.type === ItemType.GROUP) {
            const lastTabIndex = tabGroups.reduce((acc: number, group: TabGroup) => acc + group.tabs.length, 0) + regularTabs.length;
            const group = tabGroups.find((g: TabGroup) => g.id === activeParsed.id);
            const targetIndex = lastTabIndex + 1 - (group?.tabs.length || 0);
            if ((activeItemData as TabGroup).index === targetIndex) {
                logDragOperation("SKIP", { message: "Group to end separator no-op (already at target index)", targetIndex });
                return { shouldSkip: true, reason: "Group to end separator no-op (already at target index)", targetIndex };
            }
        }

        // 8) GROUP → REGULAR relative move results in same index
        if (overParsed.type === ItemType.REGULAR && activeParsed.type === ItemType.GROUP && overItemData) {
            const activeGroup = activeItemData as TabGroup;
            const targetIndex = up ? overItemData.index + 1 : overItemData.index - activeGroup.tabs.length + 1;
            if (targetIndex === activeGroup.index) {
                logDragOperation("SKIP", { message: "Group relative to regular no-op (same index)", targetIndex });
                return { shouldSkip: true, reason: "Group relative to regular no-op (same index)", targetIndex };
            }
            // Handle case: moving group onto a gtab from the group right above such that the computed target is the same as current
            const overTab = overItemData as Tab;
            const overTabGroup = tabGroups.find((g: TabGroup) => g.id === overTab.groupId);
            if (overTabGroup) {
                const lastIndexOfOverGroup = overTabGroup.index + overTabGroup.tabs.length - 1;
                const isOverTabLastInItsGroup = overTab.index === lastIndexOfOverGroup;
                const isOverGroupImmediatelyAbove = lastIndexOfOverGroup + 1 === activeGroup.index;
                if (isOverTabLastInItsGroup && isOverGroupImmediatelyAbove) {
                    const computedIndex = up ? overTab.index + 1 : overTab.index - activeGroup.tabs.length + 1;
                    if (computedIndex === activeGroup.index) {
                        logDragOperation("SKIP", { message: "Group dragged onto gtab just above results in same position — no-op", computedIndex });
                        return {
                            shouldSkip: true,
                            reason: "Group dragged onto gtab just above results in same position — no-op",
                            targetIndex: computedIndex,
                        };
                    }
                }
            }
        }

        // 9) GROUP → GTAB (tab within some group). If target equals current index, skip
        if (overParsed.type === ItemType.GTAB && activeParsed.type === ItemType.GROUP) {
            const activeGroup = activeItemData as TabGroup;
            const overGroup = tabGroups.find((g: TabGroup) => g.tabs.some((t: Tab) => t.id === overParsed.id));
            if (overGroup) {
                let targetIndex = overGroup.index + overGroup.tabs.length; // after over group
                if (targetIndex > activeGroup.index) targetIndex = Math.max(targetIndex - activeGroup.tabs.length, 0);
                if (targetIndex === activeGroup.index) {
                    logDragOperation("SKIP", {
                        message: "Group to gtab no-op (target equals current index)",
                        targetIndex,
                        overGroupId: overGroup.id,
                    });
                    return { shouldSkip: true, reason: "Group to gtab no-op (target equals current index)", targetIndex };
                }
            }
        }

        // 10) GROUP → GROUP (onto another group). If computed target equals current index, skip
        if (overParsed.type === ItemType.GROUP && activeParsed.type === ItemType.GROUP && overItemData) {
            const activeGroup = activeItemData as TabGroup;
            const overGroup = tabGroups.find((g: TabGroup) => g.id === overParsed.id);
            if (overGroup) {
                let targetIndex = overGroup.index + overGroup.tabs.length; // after over group
                if (targetIndex > activeGroup.index) targetIndex = Math.max(targetIndex - activeGroup.tabs.length, 0);
                if (targetIndex === activeGroup.index) {
                    logDragOperation("SKIP", {
                        message: "Group to group no-op (target equals current index)",
                        targetIndex,
                        overGroupId: overGroup.id,
                    });
                    return { shouldSkip: true, reason: "Group to group no-op (target equals current index)", targetIndex };
                }
            }
        }

        // 11) PSEPARATOR targets where the index would be unchanged
        if (overParsed.type === ItemType.PSEPARATOR) {
            if (activeParsed.type === ItemType.PINNED) {
                const targetIndex = overParsed.id === 1 ? 0 : pinnedTabs.length;
                if (targetIndex === (activeItemData as Tab).index) {
                    logDragOperation("SKIP", { message: "Pinned to pseparator no-op (same index)", targetIndex });
                    return { shouldSkip: true, reason: "Pinned to pseparator no-op (same index)", targetIndex };
                }
            }
            if (activeParsed.type === ItemType.REGULAR) {
                const targetIndex = pinnedTabs.length;
                if (targetIndex === (activeItemData as Tab).index) {
                    logDragOperation("SKIP", { message: "Regular to pseparator no-op (same index)", targetIndex });
                    return { shouldSkip: true, reason: "Regular to pseparator no-op (same index)", targetIndex };
                }
            }
        }
    } catch (noopCheckError) {
        // If any no-op calculation fails, we don't block the operation; proceed normally
        logDragOperation("NO-OP-CHECK-ERROR", { error: noopCheckError });
    }

    return { shouldSkip: false };
}
