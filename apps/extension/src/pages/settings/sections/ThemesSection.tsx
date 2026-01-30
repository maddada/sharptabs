import { ThemePresetsSection } from "@/components/settings/ThemePresetsSection";
import { Settings } from "@/types/Settings";
import { UpdateSetting } from "../types";

interface ThemesSectionProps {
    settings: Settings;
    updateSetting: UpdateSetting;
}

export const ThemesSection = ({ settings, updateSetting }: ThemesSectionProps) => (
    <section id="themes" className="scroll-mt-24 rounded-2xl bg-muted/40 p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Themes</h2>
        <div className="mb-2 text-sm text-muted-foreground">Save Your Theme or Apply a Preset</div>
        <ThemePresetsSection settings={settings} updateSetting={updateSetting} />
    </section>
);
