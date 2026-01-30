import { useSettingsStore } from "@/stores/settingsStore";
import { Tab } from "@/types/Tab";
import dedent from "dedent";

// For generating a group name and color (gives back 1 group name and color)
export function getGenerateGroupNamePrompt(tabs: Tab[]) {
    return dedent`
        Goal: Name and color a group of tabs

        Here is a list of tabs provided in the following format:
        title ||| url

        <tabs_list>
        ${tabs.map((tab) => `${tab.title} ||| ${tab.url}`).join("\n")}.
        </tabs_list>
    `;
}

// For auto organizing ungrouped tabs into groups (gives back a list of groups with name, color and tab ids)
export function getAutoOrganizePrompt(tabs: { id: number; title: string; url: string }[]) {
    return dedent`
Goal: Organize my tabs into groups

Here's the list of tabs provided in JSON format:

[${tabs
        .map(
            (t, i) => `{
        "id": ${t.id},
        "title": "${t.title}",
        "url": "${t.url}"
    }${i < tabs.length - 1 ? "," : ""}`
        )
        .join("\n")}]

${useSettingsStore.getState().settings.autoOrganizePrompt?.trim().substring(0, 200)}`;

    // 11 - Add a number and space infront of each group name to indicate the order of the groups. (1- 2- 3- etc.)
}

// For identifying useless tabs to delete (gives back a list of groups with reason and tab ids)
export function getDeleteUselessTabsPrompt(tabs: { id: number; title: string; url: string }[]) {
    return dedent`
        Goal: Suggest tabs that could be removed

        Here is a list of tabs provided in the following format:
        id ||| title ||| url

        <tabs_list>
        ${tabs.map((t) => `${t.id} ||| ${t.title} ||| ${t.url}`).join("\n")}
        </tabs_list>
    `;
}
