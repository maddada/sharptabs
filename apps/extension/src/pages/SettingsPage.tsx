import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "@/providers/SettingsProvider";
import { convex } from "@/utils/convex";
import { ConvexProvider } from "convex/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SettingsPage } from "./settings/SettingsPage";

const container = document.getElementById("root");
if (container) {
    const root = createRoot(container);
    root.render(
        <StrictMode>
            <ConvexProvider client={convex}>
                <SettingsProvider>
                    <TooltipProvider delayDuration={500} disableHoverableContent={true} skipDelayDuration={500}>
                        <SettingsPage />
                    </TooltipProvider>
                </SettingsProvider>
            </ConvexProvider>
        </StrictMode>
    );
}
