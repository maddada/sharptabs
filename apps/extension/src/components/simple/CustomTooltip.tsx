import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import * as React from "react";

interface CustomTooltipProps {
    children: React.ReactNode;
    content: React.ReactNode;
    side?: "top" | "right" | "bottom" | "left";
    sideOffset?: number;
    delayDuration?: number;
    disableHoverableContent?: boolean;
    align?: "start" | "center" | "end";
    alignOffset?: number;
    disabled?: boolean;
}

export function CustomTooltip({
    children,
    content,
    side = "bottom",
    sideOffset = 10,
    delayDuration = 500,
    disableHoverableContent = true,
    align = "center",
    alignOffset = 0,
    disabled = false,
}: CustomTooltipProps) {
    return (
        <Tooltip delayDuration={delayDuration} disableHoverableContent={disableHoverableContent}>
            <TooltipTrigger disabled={disabled} asChild>
                {children}
            </TooltipTrigger>
            <TooltipContent
                side={side}
                sideOffset={sideOffset}
                align={align}
                alignOffset={alignOffset}
                sticky="always"
                className="TooltipContent max-w-[450px] cursor-default select-none whitespace-pre-wrap break-words bg-background text-foreground dark:bg-neutral-400 dark:text-stone-900"
            >
                {content}
            </TooltipContent>
        </Tooltip>
    );
}
