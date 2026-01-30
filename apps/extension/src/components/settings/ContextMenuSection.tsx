import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { Settings } from "@/types/Settings";
import React from "react";
import { ContextMenuEditor } from "./ContextMenuEditor";

interface ContextMenuSectionProps {
    settings: any;
    updateSetting: (key: keyof Settings, value: any) => void;
    defaultSettings: any;
}

const ContextMenuSection: React.FC<ContextMenuSectionProps> = ({ settings, updateSetting, defaultSettings }) => {
    return (
        <section id="context-menu" className="scroll-mt-24 rounded-2xl bg-muted/40 p-6 shadow">
            <h2 className="mb-4 text-xl font-bold">Context Menu Customization</h2>
            <Accordion type="multiple" defaultValue={[]}>
                <AccordionItem value="tab-context-menu">
                    <AccordionTrigger>
                        <span className="text-lg font-semibold">Tab Context Menu Items</span>
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
                                                "Are you sure you want to reset the Tab Context Menu to default? This will overwrite your current customizations."
                                            )
                                        ) {
                                            updateSetting("tabItemContextMenu", defaultSettings.tabItemContextMenu);
                                        }
                                    }}
                                >
                                    Reset to Default
                                </Button>
                            </div>
                            <ContextMenuEditor
                                title=""
                                items={settings.tabItemContextMenu}
                                onChange={(items) => updateSetting("tabItemContextMenu", items)}
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="group-context-menu">
                    <AccordionTrigger>
                        <span className="text-lg font-semibold">Group Context Menu Items</span>
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
                                                "Are you sure you want to reset the Group Context Menu to default? This will overwrite your current customizations."
                                            )
                                        ) {
                                            updateSetting("groupItemContextMenu", defaultSettings.groupItemContextMenu);
                                        }
                                    }}
                                >
                                    Reset to Default
                                </Button>
                            </div>
                            <ContextMenuEditor
                                title=""
                                items={settings.groupItemContextMenu}
                                onChange={(items) => updateSetting("groupItemContextMenu", items)}
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </section>
    );
};

export default ContextMenuSection;
