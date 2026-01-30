import { Tab } from "./Tab";

export type ColorEnum = "grey" | "blue" | "red" | "yellow" | "green" | "pink" | "purple" | "cyan" | "orange";

export type TabGroup = {
    id: number;
    title: string;
    color: ColorEnum;
    tabs: Tab[];
    index: number;
};
