import { Tab } from "./Tab";
import { TabGroup } from "./TabGroup";

export type ItemTypeEnum = (typeof ItemType)[keyof typeof ItemType];

export const ItemType = {
    PINNED: "pinned", // Pinned Tab
    REGULAR: "regular", // Regular Tab
    GROUP: "group", // Group
    GTAB: "gtab", // Group Tab
    PSEPARATOR: "pseparator", // Pinned Separator
    GSEPARATOR: "gseparator", // Group Separator
    ESEPARATOR: "eseparator", // End Separator
    CPINNED: "cpinned", // Compact Pinned
} as const;

export type CombinedItem = {
    type: ItemTypeEnum;
    data: Tab | TabGroup;
    index: number;
    dndId: string;
};
