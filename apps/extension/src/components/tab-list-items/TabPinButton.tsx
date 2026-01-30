import { Button } from "@/components/ui/button";
import { Tab } from "@/types/Tab";
import { Pin } from "lucide-react";
import { handleUnpinTab } from "./TabItemHandlers";

export const TabPinButton = ({ tab }: { tab: Tab }) => {
    if (!tab || !tab.pinned) return null;
    return (
        <Button
            variant="ghost"
            size="icon"
            className="tab-pin-button pointer-events-auto h-6 w-6 select-none justify-self-start p-0 opacity-75 hover:bg-white hover:text-neutral-800"
            onClick={(e) => {
                e.stopPropagation();
                handleUnpinTab(e, tab);
            }}
            tabIndex={-1}
        >
            <Pin className="h-4 w-4 rotate-45 fill-current" />
        </Button>
    );
};
