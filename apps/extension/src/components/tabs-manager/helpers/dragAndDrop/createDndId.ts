import { ItemTypeEnum } from "@/types/CombinedItem";

/**
 * Creates a unique string ID for use with dnd-kit, combining item type and ID.
 * @param type The type of the item (e.g., Pinned, Regular, Group, GTab).
 * @param id The numerical ID of the item (Tab ID or Group ID).
 * @returns A formatted string identifier (e.g., "regular-123").
 */
export function createDndId(type: ItemTypeEnum, id: number): string {
    return `${type}-${id}`;
}
