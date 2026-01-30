import { Tab } from "@/types/Tab";
import { TabGroup } from "@/types/TabGroup";

export function collapseAllGroupsExceptActive(groups: TabGroup[], activeTab: Tab | undefined, setCollapsedGroups: (groups: Set<number>) => void) {
    const allGroupIds = groups.map((group) => group.id);
    const groupsToCollapse = new Set(allGroupIds);
    groupsToCollapse.delete(activeTab?.groupId ?? -1);
    setCollapsedGroups(groupsToCollapse);
}
