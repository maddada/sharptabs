import { Settings } from "@/types/Settings";

export type UpdateSetting = (key: keyof Settings, value: any) => void;
export type UpdateSettings = (settings: Partial<Settings>) => void;
