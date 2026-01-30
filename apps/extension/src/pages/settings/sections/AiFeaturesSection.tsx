import SettingsToggle from "@/components/settings/SettingsToggle";
import { defaultSettings } from "@/stores/settingsStore";
import { Settings } from "@/types/Settings";
import { UpdateSetting } from "../types";

interface AiFeaturesSectionProps {
    settings: Settings;
    updateSetting: UpdateSetting;
    isPremium: boolean;
    debouncedUpdateAutoOrganizePrompt: (value: string) => void;
}

export const AiFeaturesSection = ({
    settings,
    updateSetting,
    isPremium,
    debouncedUpdateAutoOrganizePrompt,
}: AiFeaturesSectionProps) => (
    <section id="ai-features" className="scroll-mt-24 rounded-2xl bg-muted/40 p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">AI Features</h2>
        <div className="mb-2 text-sm text-muted-foreground">
            AI features require either a premium subscription or your own Gemini API key.
            <br />
            Only the names of the tabs and the beginning of their URLs are sent to Gemini's API with a prompt to organize the tabs or name the
            group.
            <br />
            <br />
            <b>Nothing else is sent to Gemini. Nothing is logged or stored at all. Nothing is ever sent to the developer.</b>
            <br />
            You're always free to toggle off all AI features from here as they're completely optional.
        </div>

        <div className="relative mt-4 mb-4 items-center justify-between rounded-lg border p-3 shadow-sm">
            <label htmlFor="geminiApiKey" className="mb-2 block text-sm font-medium">
                Your Gemini API Key (Bring Your Own Key)
            </label>
            <div className="mb-2 text-sm text-muted-foreground">
                Get a free API key from{" "}
                <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                >
                    Google AI Studio
                </a>
                . With your own key, AI features work without a premium subscription.
            </div>
            <input
                id="geminiApiKey"
                name="geminiApiKey"
                type="password"
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={settings.geminiApiKey || ""}
                onChange={(e) => updateSetting("geminiApiKey", e.target.value)}
                placeholder="AIza..."
            />
            {settings.geminiApiKey && <div className="mt-2 text-xs text-green-600">API key saved. AI features are now available.</div>}
        </div>

        <SettingsToggle
            label="Auto Cleaner"
            description="Suggest tabs to be closed using AI"
            settingKey="aiAutoCleaner"
            checked={settings.aiAutoCleaner}
            defaultValue={defaultSettings.aiAutoCleaner}
            updateSetting={updateSetting}
            premiumFeature={!settings.geminiApiKey}
            disabled={!isPremium && !settings.geminiApiKey}
        />
        <SettingsToggle
            label="Auto Name Groups"
            description="Automatically name your tab groups using AI"
            settingKey="aiAutoGroupNaming"
            checked={settings.aiAutoGroupNaming}
            defaultValue={defaultSettings.aiAutoGroupNaming}
            updateSetting={updateSetting}
            premiumFeature={!settings.geminiApiKey}
            disabled={!isPremium && !settings.geminiApiKey}
        />
        <SettingsToggle
            label="Auto Group"
            description="Automatically organize your tabs using AI"
            settingKey="aiAutoOrganizeTabs"
            checked={settings.aiAutoOrganizeTabs}
            defaultValue={defaultSettings.aiAutoOrganizeTabs}
            updateSetting={updateSetting}
            premiumFeature={!settings.geminiApiKey}
            disabled={!isPremium && !settings.geminiApiKey}
        />
        <div className="relative mt-6 items-center justify-between rounded-lg border p-3 shadow-sm">
            <label htmlFor="autoOrganizePrompt" className="mb-2 block text-sm font-medium">
                Adjust Auto Organizing Prompt
            </label>
            <div className="mb-2 text-sm text-muted-foreground">
                You can customize the prompt for AI auto-organizing (max 200 characters) -{" "}
                <a href="https://gist.github.com/maddada/865364f5be840a20311f88ba43d84fd2" target="_blank" rel="noopener noreferrer">
                    Full prompt structure
                </a>
            </div>
            <textarea
                id="autoOrganizePrompt"
                name="autoOrganizePrompt"
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                maxLength={200}
                rows={3}
                defaultValue={settings.autoOrganizePrompt ?? ""}
                onChange={(e) => debouncedUpdateAutoOrganizePrompt(e.target.value)}
                disabled={!settings.aiAutoOrganizeTabs || (!isPremium && !settings.geminiApiKey)}
                placeholder="Enter your custom prompt here"
            />
            <div className="mt-2 flex justify-end">
                <div className="mt-1 text-right text-xs text-muted-foreground">{settings.autoOrganizePrompt?.length ?? 0}/200</div>
            </div>
        </div>
    </section>
);
