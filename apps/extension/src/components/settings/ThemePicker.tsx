import { useSettingsStore } from "@/stores/settingsStore";
import { Theme, ThemeType } from "@/types/Theme";

const MODE_OPTIONS: { id: ThemeType; label: string }[] = [
    { id: "system", label: "System" },
    { id: "light", label: "Light" },
    { id: "dark", label: "Dark" },
];

const THEME_OPTIONS: { id: Theme; label: string }[] = [
    { id: "blue", label: "Blue" },
    { id: "gray", label: "Gray" },
    { id: "red", label: "Red" },
    { id: "rose", label: "Rose" },
    { id: "orange", label: "Orange" },
    { id: "green", label: "Green" },
    { id: "yellow", label: "Yellow" },
    { id: "violet", label: "Violet" },
];

export function ThemePicker() {
    const { settings, updateSetting } = useSettingsStore();

    const handleThemeTypeChange = (newThemeType: ThemeType) => {
        updateSetting("themeType", newThemeType);
    };

    const handleThemeChange = (newTheme: Theme) => {
        updateSetting("theme", newTheme);
    };

    return (
        <div className="p-y-2 flex flex-col gap-4">
            <label className="text-sm font-medium" id="theme-group-label">
                Scheme
            </label>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="theme-group-label">
                {MODE_OPTIONS.map((themeTypeOption) => (
                    <button
                        key={themeTypeOption.id}
                        className={`px-4 py-2 rounded-md capitalize ${
                            settings.themeType === themeTypeOption.id ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                        }`}
                        onClick={() => handleThemeTypeChange(themeTypeOption.id)}
                        role="radio"
                        aria-checked={settings.themeType === themeTypeOption.id}
                        aria-label={`Set theme to ${themeTypeOption.label}`}
                        tabIndex={0}
                    >
                        {themeTypeOption.label}
                    </button>
                ))}
            </div>
            <p className="text-sm text-muted-foreground">
                Configure your Light and Dark backgrounds below. System mode automatically switches between them based on your OS preference.
                <br />
                <span className="text-xs">Tip: Ensure your browser is set to follow your OS theme for automatic switching.</span>
            </p>
            <label className="text-sm font-medium" id="theme-group-label">
                Color
            </label>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="theme-group-label">
                {THEME_OPTIONS.map((themeOption) => (
                    <button
                        key={themeOption.id}
                        className={`px-4 py-2 rounded-md capitalize ${
                            settings.theme === themeOption.id ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                        }`}
                        onClick={() => handleThemeChange(themeOption.id)}
                        role="radio"
                        aria-checked={settings.theme === themeOption.id}
                        aria-label={`Set theme to ${themeOption.label}`}
                        tabIndex={0}
                    >
                        {themeOption.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
