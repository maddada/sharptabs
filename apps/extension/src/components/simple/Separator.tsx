import { cn } from "@/utils/cn";
import { middleClickOpensNewTab } from "@/utils/tabs/middleClickOpensNewTab";

export function Separator({ className, classNameInner }: { className?: string; classNameInner?: string }) {
    return (
        <div className={cn("separator", `mb-2 mt-2`, className)} onAuxClick={middleClickOpensNewTab}>
            <div className={cn("h-0.5 w-full bg-foreground/40 dark:bg-foreground/20", classNameInner)} />
        </div>
    );
}
