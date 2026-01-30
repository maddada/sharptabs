import { TabsManager } from "@/components/tabs-manager/TabsManager";
import { SettingsProvider } from "@/providers/SettingsProvider";
import "@/styles/globals.css";
import { convex } from "@/utils/convex";
import { ConvexProvider } from "convex/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const container = document.getElementById("root");
if (container) {
    const root = createRoot(container);
    root.render(
        <StrictMode>
            <ConvexProvider client={convex}>
                <SettingsProvider>
                    <TabsManager initialContainerHeight="100%" initialInSidepanel={true} />
                </SettingsProvider>
            </ConvexProvider>
        </StrictMode>
    );
}
