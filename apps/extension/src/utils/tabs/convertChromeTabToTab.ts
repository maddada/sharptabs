import { Tab } from "@/types/Tab";
import { createDndId } from "@/components/tabs-manager/helpers/dragAndDrop/createDndId";
import { ItemType, ItemTypeEnum } from "@/types/CombinedItem";

export const convertChromeTabToTab = (tab: chrome.tabs.Tab): Tab => {
    let itemType: ItemTypeEnum;
    if (tab.pinned) {
        itemType = ItemType.PINNED;
    } else if (tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
        itemType = ItemType.REGULAR;
    } else {
        itemType = ItemType.GTAB;
    }

    return {
        id: tab.id ?? 0,
        url: tab.url ?? "",
        title: tab.title ?? "",
        pinned: tab.pinned ?? false,
        groupId: tab.groupId ?? -1,
        index: tab.index ?? 0,
        audible: tab.audible ?? false,
        mutedInfo: tab.mutedInfo ?? { muted: false },
        discarded: tab.discarded ?? false,
        frozen: tab.frozen ?? false,
        status: tab.status ?? "complete",
        favIconUrl: tab.favIconUrl ?? "",
        active: tab.active ?? false,
        autoDiscardable: tab.autoDiscardable ?? false,
        dndId: createDndId(itemType, tab.id ?? 0),
    };
};
