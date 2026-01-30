import { Gem } from "lucide-react";
import { CustomTooltip } from "../simple/CustomTooltip";

export function PremiumFeature() {
    return (
        <CustomTooltip content="Premium Feature">
            <Gem className="absolute right-0 top-[-2px] h-4 w-4 cursor-pointer text-cyan-500" />
        </CustomTooltip>
    );
}
