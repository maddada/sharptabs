import { useEffect } from "react";

export function useSkipAnimationsOnFirstLoad(setSkipAnimation: (skip: boolean) => void) {
    useEffect(() => {
        const timer = setTimeout(() => setSkipAnimation(false), 1000);
        return () => clearTimeout(timer);
    }, [setSkipAnimation]);
}
