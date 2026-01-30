import { useSettingsStore } from "@/stores/settingsStore";

export function OpenPreferenceToggle() {
    const { settings, updateSetting } = useSettingsStore();

    const handlePreferenceChange = (newPreference: "popup" | "sidepanel") => {
        updateSetting("openPreference", newPreference);
    };

    return (
        <div className="mt-6 flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
                <div className="text-sm font-semibold">Toolbar icon opens the extension as a</div>
                <div className="text-sm text-muted-foreground">(You can pin it or set a hotkey for easier access)</div>
            </div>
            <div className="flex gap-2">
                {(["popup", "sidepanel"] as const).map((p) => (
                    <button
                        key={p}
                        className={`px-4 py-2 rounded-md capitalize ${settings.openPreference === p ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"}`}
                        onClick={() => handlePreferenceChange(p)}
                    >
                        {p}
                    </button>
                ))}
            </div>
        </div>
    );
}
