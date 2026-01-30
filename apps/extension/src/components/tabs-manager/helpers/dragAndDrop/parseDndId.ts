import { ItemType, ItemTypeEnum } from "@/types/CombinedItem";

// Helper function to parse dnd-kit IDs
export const parseDndId = (id: string): { type: ItemTypeEnum; id: number } | null => {
    const parts = String(id).split("-");

    // Handle regular formats (2 parts)
    if (parts.length !== 2) return null;
    const type = parts[0] as ItemTypeEnum;
    const numId = parseInt(parts[1], 10);
    if (isNaN(numId)) return null;
    if (
        ![
            ItemType.PINNED,
            ItemType.REGULAR,
            ItemType.GROUP,
            ItemType.GTAB,
            ItemType.PSEPARATOR,
            ItemType.GSEPARATOR,
            ItemType.ESEPARATOR,
            ItemType.CPINNED,
        ].includes(type)
    )
        return null;
    return { type, id: numId };
};
