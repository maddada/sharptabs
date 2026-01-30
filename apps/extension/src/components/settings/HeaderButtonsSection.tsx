import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { Settings } from "@/types/Settings";
import React from "react";
import { ContextMenuEditor } from "./ContextMenuEditor";
import SettingsToggle from "./SettingsToggle";
import { defaultSettings } from "@/stores/settingsStore";

interface HeaderButtonsSectionProps {
    settings: any;
    updateSetting: (key: keyof Settings, value: any) => void;
}

const HeaderButtonsSection: React.FC<HeaderButtonsSectionProps> = ({ settings, updateSetting }) => {
    return (
        <section id="header" className="scroll-mt-24 rounded-2xl bg-muted/40 p-6 shadow">
            <h2 className="mb-4 text-xl font-bold">Header</h2>
            <p className="mb-4 text-sm text-muted-foreground">Customize which buttons appear in the tab manager header and dropdown menu.</p>

            <SettingsToggle
                label="Automatically collapse header buttons"
                description="When enabled, the header buttons will be hidden by default and only show when you hover over them."
                settingKey="autoCollapseHeaderButtons"
                checked={settings.autoCollapseHeaderButtons}
                defaultValue={defaultSettings.autoCollapseHeaderButtons}
                updateSetting={updateSetting}
            />

            <SettingsToggle
                label="Show Navigation Buttons"
                description="Show the back and forward navigation buttons in the header (let you navigate back and forward between recently active tabs)"
                settingKey="showNavigationButtons"
                checked={settings.showNavigationButtons}
                defaultValue={defaultSettings.showNavigationButtons}
                updateSetting={updateSetting}
            />

            <SettingsToggle
                label="Show Duplicate Tabs Cleanup Button"
                description="Only appears when there are duplicate tabs. Click to show only duplicate tabs and close them."
                settingKey="showDuplicateTabsButton"
                checked={settings.showDuplicateTabsButton}
                defaultValue={defaultSettings.showDuplicateTabsButton}
                updateSetting={updateSetting}
            />

            <Accordion type="multiple" defaultValue={[]} className="mt-4">
                <AccordionItem value="dropdown-menu">
                    <AccordionTrigger>
                        <span className="text-lg font-semibold">Dropdown Menu Items</span>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="mb-6">
                            <div className="mb-2 flex items-center justify-between">
                                <span />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        if (
                                            window.confirm(
                                                "Are you sure you want to reset the Header Dropdown Menu to default? This will overwrite your current customizations."
                                            )
                                        ) {
                                            updateSetting("headerDropdownMenu", defaultSettings.headerDropdownMenu);
                                        }
                                    }}
                                >
                                    Reset to Default
                                </Button>
                            </div>
                            <ContextMenuEditor
                                title=""
                                items={settings.headerDropdownMenu}
                                onChange={(items) => updateSetting("headerDropdownMenu", items)}
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </section>
    );
};

export default HeaderButtonsSection;
