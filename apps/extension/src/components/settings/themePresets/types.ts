import { Settings } from "@/types/Settings";

export interface ThemePreset {
    name: string;
    configuration: Partial<Settings>;
}
