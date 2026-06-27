export const OTHER_WINDOW_DND_PREFIX = "otherWindow";

export type OtherWindowDndType = "window" | "end" | "tab" | "group";

export type ParsedOtherWindowDndId = {
    type: OtherWindowDndType;
    windowId: number;
    id: number | null;
};

export function createOtherWindowWindowDndId(windowId: number): string {
    return `${OTHER_WINDOW_DND_PREFIX}:window:${windowId}`;
}

export function createOtherWindowEndDndId(windowId: number): string {
    return `${OTHER_WINDOW_DND_PREFIX}:end:${windowId}`;
}

export function createOtherWindowTabDndId(windowId: number, tabId: number): string {
    return `${OTHER_WINDOW_DND_PREFIX}:tab:${windowId}:${tabId}`;
}

export function createOtherWindowGroupDndId(windowId: number, groupId: number): string {
    return `${OTHER_WINDOW_DND_PREFIX}:group:${windowId}:${groupId}`;
}

export function parseOtherWindowDndId(id: string): ParsedOtherWindowDndId | null {
    const [prefix, type, windowIdString, itemIdString] = id.split(":");
    if (prefix !== OTHER_WINDOW_DND_PREFIX) return null;
    if (type !== "window" && type !== "end" && type !== "tab" && type !== "group") return null;

    const windowId = Number(windowIdString);
    if (!Number.isFinite(windowId)) return null;

    if (type === "window" || type === "end") {
        return { type, windowId, id: null };
    }

    const itemId = Number(itemIdString);
    if (!Number.isFinite(itemId)) return null;

    return { type, windowId, id: itemId };
}
