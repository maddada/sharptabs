import { Button } from "@/components/ui/button";
import { Tab } from "@/types/Tab";
import { Volume2, VolumeX } from "lucide-react";
import { TabItemState } from "./TabItem";
import { toggleMute } from "./TabItemHandlers";

export const TabMediaButton = ({ tabState, tab }: { tabState: TabItemState; tab: Tab }) => {
    if (!tab || !tabState.isAudible) return null;
    return (
        <Button
            variant="ghost"
            size="icon"
            className="tab-mute-button pointer-events-auto mt-0.5 h-6 w-6 select-none justify-self-center p-0 opacity-75 hover:bg-white hover:text-neutral-800"
            onClick={(e) => {
                e.stopPropagation();
                toggleMute(e, tab, tabState);
            }}
            tabIndex={-1}
        >
            {tabState.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
    );
};
