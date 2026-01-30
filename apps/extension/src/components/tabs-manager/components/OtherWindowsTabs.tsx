import { TabItem } from "@/components/tab-list-items/TabItem";
import { GroupItem } from "@/components/tab-list-items/GroupItem";
import { Separator } from "@/components/simple/Separator";
import { ItemType } from "@/types/CombinedItem";
import { Tab } from "@/types/Tab";
import { TabGroup } from "@/types/TabGroup";
import { useTabManagerStore } from "@/stores/tabManagerStore";
import React from "react";

export const OtherWindowsTabs: React.FC = () => {
    // Get values from stores
    const otherWindowsData = useTabManagerStore((s) => s.otherWindowsData);
    if (!otherWindowsData || otherWindowsData.length === 0) return null;
    return (
        <div className="mt-4">
            {otherWindowsData.map((windowData) => (
                <div key={windowData.windowId} className="mb-6">
                    <Separator className="my-4" />
                    <div className="mb-2 select-none px-2 text-xs font-semibold text-muted-foreground">{windowData.windowTitle}</div>
                    {windowData.items.map((item) => (
                        <div key={item.dndId}>
                            {item.type === ItemType.PINNED && (
                                <TabItem
                                    id={item.dndId}
                                    _className="pinned-tab"
                                    tab={item.data as Tab}
                                    showDropTarget={false}
                                    selected={false}
                                    onSelect={async (tabId, e) => {
                                        e.preventDefault();
                                        const tab = item.data as Tab;
                                        try {
                                            await chrome.windows.update(windowData.windowId, { focused: true });
                                            await chrome.tabs.update(tab.id, { active: true });
                                        } catch (err) {
                                            console.log("Failed to switch to tab:", err);
                                        }
                                    }}
                                />
                            )}
                            {item.type === ItemType.REGULAR && (
                                <TabItem
                                    id={item.dndId}
                                    _className="regular-tab"
                                    tab={item.data as Tab}
                                    showDropTarget={false}
                                    selected={false}
                                    onSelect={async (tabId, e) => {
                                        e.preventDefault();
                                        const tab = item.data as Tab;
                                        try {
                                            await chrome.windows.update(windowData.windowId, { focused: true });
                                            await chrome.tabs.update(tab.id, { active: true });
                                        } catch (err) {
                                            console.log("Failed to switch to tab:", err);
                                        }
                                    }}
                                />
                            )}
                            {item.type === ItemType.GROUP && (
                                <GroupItem
                                    id={item.dndId}
                                    group={item.data as TabGroup}
                                    showDropTarget={false}
                                    onTabSelect={async (tabId, e) => {
                                        e.preventDefault();
                                        const group = item.data as TabGroup;
                                        const tab = group.tabs.find((t) => t.id === tabId);
                                        if (tab) {
                                            try {
                                                await chrome.windows.update(windowData.windowId, { focused: true });
                                                await chrome.tabs.update(tab.id, { active: true });
                                            } catch (err) {
                                                console.log("Failed to switch to tab:", err);
                                            }
                                        }
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};
