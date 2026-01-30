export function toggleGroup(groupId: number, collapsedGroups: Set<number>, setCollapsedGroups: (groups: Set<number>) => void) {
    const newSet = new Set(collapsedGroups);
    if (newSet.has(groupId)) {
        newSet.delete(groupId);
    } else {
        newSet.add(groupId);
    }
    setCollapsedGroups(newSet);
}
