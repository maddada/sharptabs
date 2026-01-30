import { TabsManager } from "@/components/tabs-manager/TabsManager";
import "@/styles/globals.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SettingsProvider } from "@/providers/SettingsProvider";
import { convex } from "@/utils/convex";
import { ConvexProvider } from "convex/react";

const container = document.getElementById("root");
if (container) {
    const root = createRoot(container);
    root.render(
        <StrictMode>
            <ConvexProvider client={convex}>
                <SettingsProvider>
                    <TabsManager initialContainerHeight="600px" initialInPopup={true} />
                </SettingsProvider>
            </ConvexProvider>
        </StrictMode>
    );
}
