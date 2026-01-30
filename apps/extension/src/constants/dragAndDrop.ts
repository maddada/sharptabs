import { cn } from "@/utils/cn";

export const dropTargetClass = (className?: string) =>
    cn(
        "relative opacity-100 after:absolute after:bottom-[-10px] after:left-0 after:h-1 after:w-full after:bg-black/50 after:content-[''] after:dark:bg-white",
        className
    );
