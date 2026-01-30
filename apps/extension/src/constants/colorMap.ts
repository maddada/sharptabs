import { ColorEnum } from "@/types/TabGroup";

export const colorMap: Record<ColorEnum, string> = {
    grey: "bg-zinc-500/40 dark:bg-zinc-500/40 hover:bg-zinc-500/50 hover:dark:bg-zinc-500/50",
    blue: "bg-sky-400/40 dark:bg-sky-400/40 hover:bg-sky-400/50 hover:dark:bg-sky-400/50",
    red: "bg-red-500/40 dark:bg-red-500/40 hover:bg-red-500/50 hover:dark:bg-red-500/50",
    yellow: "bg-yellow-500/40 dark:bg-yellow-500/40 hover:bg-yellow-500/50 hover:dark:bg-yellow-500/50",
    green: "bg-green-500/40 dark:bg-green-500/40 hover:bg-green-500/50 hover:dark:bg-green-500/50",
    pink: "bg-pink-500/40 dark:bg-pink-500/40 hover:bg-pink-500/50 hover:dark:bg-pink-500/50",
    purple: "bg-purple-500/40 dark:bg-purple-500/40 hover:bg-purple-500/50 hover:dark:bg-purple-500/50",
    cyan: "bg-teal-500/40 dark:bg-teal-500/40 hover:bg-teal-500/50 hover:dark:bg-teal-500/50",
    orange: "bg-orange-500/40 dark:bg-orange-500/40 hover:bg-orange-500/50 hover:dark:bg-orange-500/50",
};

export const colorMapGradient: Record<ColorEnum, string> = {
    grey: "bg-transparent dark:bg-transparent hover:bg-transparent hover:dark:bg-transparent bg-gradient-to-b from-zinc-400/40 to-zinc-500/40 dark:from-zinc-400/40 dark:to-zinc-500/40 hover:from-zinc-400/50 hover:to-zinc-500/50 hover:dark:from-zinc-400/50 hover:dark:to-zinc-500/50",
    blue: "bg-transparent dark:bg-transparent hover:bg-transparent hover:dark:bg-transparent bg-gradient-to-b from-sky-300/40 to-sky-500/40 dark:from-sky-300/40 dark:to-sky-500/40 hover:from-sky-300/50 hover:to-sky-500/50 hover:dark:from-sky-300/50 hover:dark:to-sky-500/50",
    red: "bg-transparent dark:bg-transparent hover:bg-transparent hover:dark:bg-transparent bg-gradient-to-b from-red-400/40 to-red-600/40 dark:from-red-400/40 dark:to-red-600/40 hover:from-red-400/50 hover:to-red-600/50 hover:dark:from-red-400/50 hover:dark:to-red-600/50",
    yellow: "bg-transparent dark:bg-transparent hover:bg-transparent hover:dark:bg-transparent bg-gradient-to-b from-yellow-400/40 to-yellow-600/40 dark:from-yellow-400/40 dark:to-yellow-600/40 hover:from-yellow-400/50 hover:to-yellow-600/50 hover:dark:from-yellow-400/50 hover:dark:to-yellow-600/50",
    green: "bg-transparent dark:bg-transparent hover:bg-transparent hover:dark:bg-transparent bg-gradient-to-b from-green-400/40 to-green-600/40 dark:from-green-400/40 dark:to-green-600/40 hover:from-green-400/50 hover:to-green-600/50 hover:dark:from-green-400/50 hover:dark:to-green-600/50",
    pink: "bg-transparent dark:bg-transparent hover:bg-transparent hover:dark:bg-transparent bg-gradient-to-b from-pink-400/40 to-pink-600/40 dark:from-pink-400/40 dark:to-pink-600/40 hover:from-pink-400/50 hover:to-pink-600/50 hover:dark:from-pink-400/50 hover:dark:to-pink-600/50",
    purple: "bg-transparent dark:bg-transparent hover:bg-transparent hover:dark:bg-transparent bg-gradient-to-b from-purple-400/40 to-purple-600/40 dark:from-purple-400/40 dark:to-purple-600/40 hover:from-purple-400/50 hover:to-purple-600/50 hover:dark:from-purple-400/50 hover:dark:to-purple-600/50",
    cyan: "bg-transparent dark:bg-transparent hover:bg-transparent hover:dark:bg-transparent bg-gradient-to-b from-teal-400/40 to-teal-600/40 dark:from-teal-400/40 dark:to-teal-600/40 hover:from-teal-400/50 hover:to-teal-600/50 hover:dark:from-teal-400/50 hover:dark:to-teal-600/50",
    orange: "bg-transparent dark:bg-transparent hover:bg-transparent hover:dark:bg-transparent bg-gradient-to-b from-orange-400/40 to-orange-500/40 dark:from-orange-400/40 dark:to-orange-500/40 hover:from-orange-400/50 hover:to-orange-500/50 hover:dark:from-orange-400/50 hover:dark:to-orange-500/50",
};

export const colorMapBorder: Record<ColorEnum, string> = {
    grey: "border-zinc-500 hover:border-zinc-500 dark:opacity-80",
    blue: "border-blue-500 hover:border-blue-500 dark:opacity-80",
    red: "border-red-500 hover:border-red-500 dark:opacity-80",
    yellow: "border-yellow-500 hover:border-yellow-500 dark:opacity-80",
    green: "border-green-500 hover:border-green-500 dark:opacity-80",
    pink: "border-pink-500 hover:border-pink-500 dark:opacity-80",
    purple: "border-purple-500 hover:border-purple-500 dark:opacity-80",
    cyan: "border-teal-500 hover:border-teal-500 dark:opacity-80",
    orange: "border-orange-500 hover:border-orange-500 dark:opacity-80",
};

export const borderColorMap: Record<ColorEnum, string> = {
    grey: "border-zinc-500",
    blue: "border-blue-500",
    red: "border-red-500",
    yellow: "border-yellow-500",
    green: "border-green-500",
    pink: "border-pink-500",
    purple: "border-purple-500",
    cyan: "border-teal-500",
    orange: "border-orange-500",
};

// Just for tailwind to include all of these opacities (using safelist in config added unnecessary ones):
export const colorMapOpacitiesLight: Record<ColorEnum, string> = {
    grey: "bg-zinc-500/0 bg-zinc-500/10 bg-zinc-500/20 bg-zinc-500/30 bg-zinc-500/40 bg-zinc-500/50 bg-zinc-500/60 bg-zinc-500/70 bg-zinc-500/80 bg-zinc-500/90 bg-zinc-500/100",
    blue: "bg-sky-400/0 bg-sky-400/10 bg-sky-400/20 bg-sky-400/30 bg-sky-400/40 bg-sky-400/50 bg-sky-400/60 bg-sky-400/70 bg-sky-400/80 bg-sky-400/90 bg-sky-400/100",
    red: "bg-red-500/0 bg-red-500/10 bg-red-500/20 bg-red-500/30 bg-red-500/40 bg-red-500/50 bg-red-500/60 bg-red-500/70 bg-red-500/80 bg-red-500/90 bg-red-500/100",
    yellow: "bg-yellow-500/0 bg-yellow-500/10 bg-yellow-500/20 bg-yellow-500/30 bg-yellow-500/40 bg-yellow-500/50 bg-yellow-500/60 bg-yellow-500/70 bg-yellow-500/80 bg-yellow-500/90 bg-yellow-500/100",
    green: "bg-green-500/0 bg-green-500/10 bg-green-500/20 bg-green-500/30 bg-green-500/40 bg-green-500/50 bg-green-500/60 bg-green-500/70 bg-green-500/80 bg-green-500/90 bg-green-500/100",
    pink: "bg-pink-500/0 bg-pink-500/10 bg-pink-500/20 bg-pink-500/30 bg-pink-500/40 bg-pink-500/50 bg-pink-500/60 bg-pink-500/70 bg-pink-500/80 bg-pink-500/90 bg-pink-500/100",
    purple: "bg-purple-500/0 bg-purple-500/10 bg-purple-500/20 bg-purple-500/30 bg-purple-500/40 bg-purple-500/50 bg-purple-500/60 bg-purple-500/70 bg-purple-500/80 bg-purple-500/90 bg-purple-500/100",
    cyan: "bg-teal-500/0 bg-teal-500/10 bg-teal-500/20 bg-teal-500/30 bg-teal-500/40 bg-teal-500/50 bg-teal-500/60 bg-teal-500/70 bg-teal-500/80 bg-teal-500/90 bg-teal-500/100",
    orange: "bg-orange-500/0 bg-orange-500/10 bg-orange-500/20 bg-orange-500/30 bg-orange-500/40 bg-orange-500/50 bg-orange-500/60 bg-orange-500/70 bg-orange-500/80 bg-orange-500/90 bg-orange-500/100",
};

export const colorMapOpacitiesDark: Record<string, string> = {
    grey: "dark:bg-zinc-500/0 dark:bg-zinc-500/10 dark:bg-zinc-500/20 dark:bg-zinc-500/30 dark:bg-zinc-500/40 dark:bg-zinc-500/50 dark:bg-zinc-500/60 dark:bg-zinc-500/70 dark:bg-zinc-500/80 dark:bg-zinc-500/90 dark:bg-zinc-500/100",
    blue: "dark:bg-sky-400/0 dark:bg-sky-400/10 dark:bg-sky-400/20 dark:bg-sky-400/30 dark:bg-sky-400/40 dark:bg-sky-400/50 dark:bg-sky-400/60 dark:bg-sky-400/70 dark:bg-sky-400/80 dark:bg-sky-400/90 dark:bg-sky-400/100",
    red: "dark:bg-red-500/0 dark:bg-red-500/10 dark:bg-red-500/20 dark:bg-red-500/30 dark:bg-red-500/40 dark:bg-red-500/50 dark:bg-red-500/60 dark:bg-red-500/70 dark:bg-red-500/80 dark:bg-red-500/90 dark:bg-red-500/100",
    yellow: "dark:bg-yellow-500/0 dark:bg-yellow-500/10 dark:bg-yellow-500/20 dark:bg-yellow-500/30 dark:bg-yellow-500/40 dark:bg-yellow-500/50 dark:bg-yellow-500/60 dark:bg-yellow-500/70 dark:bg-yellow-500/80 dark:bg-yellow-500/90 dark:bg-yellow-500/100",
    green: "dark:bg-green-500/0 dark:bg-green-500/10 dark:bg-green-500/20 dark:bg-green-500/30 dark:bg-green-500/40 dark:bg-green-500/50 dark:bg-green-500/60 dark:bg-green-500/70 dark:bg-green-500/80 dark:bg-green-500/90 dark:bg-green-500/100",
    pink: "dark:bg-pink-500/0 dark:bg-pink-500/10 dark:bg-pink-500/20 dark:bg-pink-500/30 dark:bg-pink-500/40 dark:bg-pink-500/50 dark:bg-pink-500/60 dark:bg-pink-500/70 dark:bg-pink-500/80 dark:bg-pink-500/90 dark:bg-pink-500/100",
    purple: "dark:bg-purple-500/0 dark:bg-purple-500/10 dark:bg-purple-500/20 dark:bg-purple-500/30 dark:bg-purple-500/40 dark:bg-purple-500/50 dark:bg-purple-500/60 dark:bg-purple-500/70 dark:bg-purple-500/80 dark:bg-purple-500/90 dark:bg-purple-500/100",
    cyan: "dark:bg-teal-500/0 dark:bg-teal-500/10 dark:bg-teal-500/20 dark:bg-teal-500/30 dark:bg-teal-500/40 dark:bg-teal-500/50 dark:bg-teal-500/60 dark:bg-teal-500/70 dark:bg-teal-500/80 dark:bg-teal-500/90 dark:bg-teal-500/100",
    orange: "dark:bg-orange-500/0 dark:bg-orange-500/10 dark:bg-orange-500/20 dark:bg-orange-500/30 dark:bg-orange-500/40 dark:bg-orange-500/50 dark:bg-orange-500/60 dark:bg-orange-500/70 dark:bg-orange-500/80 dark:bg-orange-500/90 dark:bg-orange-500/100",
};
export const colorMapGradient0: Record<ColorEnum, string> = {
    grey: "bg-zinc-500/0 dark:bg-zinc-500/0 bg-gradient-to-b from-zinc-400/0 to-zinc-500/0 dark:from-zinc-400/0 dark:to-zinc-500/0 hover:from-zinc-400/10 hover:to-zinc-500/10 hover:dark:from-zinc-400/10 hover:dark:to-zinc-500/10",
    blue: "bg-sky-400/0 dark:bg-sky-400/0 bg-gradient-to-b from-sky-300/0 to-sky-500/0 dark:from-sky-300/0 dark:to-sky-500/0 hover:from-sky-300/10 hover:to-sky-500/10 hover:dark:from-sky-300/10 hover:dark:to-sky-500/10",
    red: "bg-red-500/0 dark:bg-red-500/0 bg-gradient-to-b from-red-400/0 to-red-600/0 dark:from-red-400/0 dark:to-red-600/0 hover:from-red-400/10 hover:to-red-600/10 hover:dark:from-red-400/10 hover:dark:to-red-600/10",
    yellow: "bg-yellow-500/0 dark:bg-yellow-500/0 bg-gradient-to-b from-yellow-400/0 to-yellow-600/0 dark:from-yellow-400/0 dark:to-yellow-600/0 hover:from-yellow-400/10 hover:to-yellow-600/10 hover:dark:from-yellow-400/10 hover:dark:to-yellow-600/10",
    green: "bg-green-500/0 dark:bg-green-500/0 bg-gradient-to-b from-green-400/0 to-green-600/0 dark:from-green-400/0 dark:to-green-600/0 hover:from-green-400/10 hover:to-green-600/10 hover:dark:from-green-400/10 hover:dark:to-green-600/10",
    pink: "bg-pink-500/0 dark:bg-pink-500/0 bg-gradient-to-b from-pink-400/0 to-pink-600/0 dark:from-pink-400/0 dark:to-pink-600/0 hover:from-pink-400/10 hover:to-pink-600/10 hover:dark:from-pink-400/10 hover:dark:to-pink-600/10",
    purple: "bg-purple-500/0 dark:bg-purple-500/0 bg-gradient-to-b from-purple-400/0 to-purple-600/0 dark:from-purple-400/0 dark:to-purple-600/0 hover:from-purple-400/10 hover:to-purple-600/10 hover:dark:from-purple-400/10 hover:dark:to-purple-600/10",
    cyan: "bg-teal-500/0 dark:bg-teal-500/0 bg-gradient-to-b from-teal-400/0 to-teal-600/0 dark:from-teal-400/0 dark:to-teal-600/0 hover:from-teal-400/10 hover:to-teal-600/10 hover:dark:from-teal-400/10 hover:dark:to-teal-600/10",
    orange: "bg-orange-400/0 dark:bg-orange-400/0 bg-gradient-to-b from-orange-400/0 to-orange-500/0 dark:from-orange-400/0 dark:to-orange-500/0 hover:from-orange-400/10 hover:to-orange-500/10 hover:dark:from-orange-400/10 hover:dark:to-orange-500/10",
};
export const colorMapGradient10: Record<ColorEnum, string> = {
    grey: "bg-zinc-500/10 dark:bg-zinc-500/10 bg-gradient-to-b from-zinc-400/10 to-zinc-500/10 dark:from-zinc-400/10 dark:to-zinc-500/10 hover:from-zinc-400/20 hover:to-zinc-500/20 hover:dark:from-zinc-400/20 hover:dark:to-zinc-500/20",
    blue: "bg-sky-400/10 dark:bg-sky-400/10 bg-gradient-to-b from-sky-300/10 to-sky-500/10 dark:from-sky-300/10 dark:to-sky-500/10 hover:from-sky-300/20 hover:to-sky-500/20 hover:dark:from-sky-300/20 hover:dark:to-sky-500/20",
    red: "bg-red-500/10 dark:bg-red-500/10 bg-gradient-to-b from-red-400/10 to-red-600/10 dark:from-red-400/10 dark:to-red-600/10 hover:from-red-400/20 hover:to-red-600/20 hover:dark:from-red-400/20 hover:dark:to-red-600/20",
    yellow: "bg-yellow-500/10 dark:bg-yellow-500/10 bg-gradient-to-b from-yellow-400/10 to-yellow-600/10 dark:from-yellow-400/10 dark:to-yellow-600/10 hover:from-yellow-400/20 hover:to-yellow-600/20 hover:dark:from-yellow-400/20 hover:dark:to-yellow-600/20",
    green: "bg-green-500/10 dark:bg-green-500/10 bg-gradient-to-b from-green-400/10 to-green-600/10 dark:from-green-400/10 dark:to-green-600/10 hover:from-green-400/20 hover:to-green-600/20 hover:dark:from-green-400/20 hover:dark:to-green-600/20",
    pink: "bg-pink-500/10 dark:bg-pink-500/10 bg-gradient-to-b from-pink-400/10 to-pink-600/10 dark:from-pink-400/10 dark:to-pink-600/10 hover:from-pink-400/20 hover:to-pink-600/20 hover:dark:from-pink-400/20 hover:dark:to-pink-600/20",
    purple: "bg-purple-500/10 dark:bg-purple-500/10 bg-gradient-to-b from-purple-400/10 to-purple-600/10 dark:from-purple-400/10 dark:to-purple-600/10 hover:from-purple-400/20 hover:to-purple-600/20 hover:dark:from-purple-400/20 hover:dark:to-purple-600/20",
    cyan: "bg-teal-500/10 dark:bg-teal-500/10 bg-gradient-to-b from-teal-400/10 to-teal-600/10 dark:from-teal-400/10 dark:to-teal-600/10 hover:from-teal-400/20 hover:to-teal-600/20 hover:dark:from-teal-400/20 hover:dark:to-teal-600/20",
    orange: "bg-orange-400/10 dark:bg-orange-400/10 bg-gradient-to-b from-orange-400/10 to-orange-500/10 dark:from-orange-400/10 dark:to-orange-500/10 hover:from-orange-400/20 hover:to-orange-500/20 hover:dark:from-orange-400/20 hover:dark:to-orange-500/20",
};
export const colorMapGradient20: Record<ColorEnum, string> = {
    grey: "bg-zinc-500/20 dark:bg-zinc-500/20 bg-gradient-to-b from-zinc-400/20 to-zinc-500/20 dark:from-zinc-400/20 dark:to-zinc-500/20 hover:from-zinc-400/30 hover:to-zinc-500/30 hover:dark:from-zinc-400/30 hover:dark:to-zinc-500/30",
    blue: "bg-sky-400/20 dark:bg-sky-400/20 bg-gradient-to-b from-sky-300/20 to-sky-500/20 dark:from-sky-300/20 dark:to-sky-500/20 hover:from-sky-300/30 hover:to-sky-500/30 hover:dark:from-sky-300/30 hover:dark:to-sky-500/30",
    red: "bg-red-500/20 dark:bg-red-500/20 bg-gradient-to-b from-red-400/20 to-red-600/20 dark:from-red-400/20 dark:to-red-600/20 hover:from-red-400/30 hover:to-red-600/30 hover:dark:from-red-400/30 hover:dark:to-red-600/30",
    yellow: "bg-yellow-500/20 dark:bg-yellow-500/20 bg-gradient-to-b from-yellow-400/20 to-yellow-600/20 dark:from-yellow-400/20 dark:to-yellow-600/20 hover:from-yellow-400/30 hover:to-yellow-600/30 hover:dark:from-yellow-400/30 hover:dark:to-yellow-600/30",
    green: "bg-green-500/20 dark:bg-green-500/20 bg-gradient-to-b from-green-400/20 to-green-600/20 dark:from-green-400/20 dark:to-green-600/20 hover:from-green-400/30 hover:to-green-600/30 hover:dark:from-green-400/30 hover:dark:to-green-600/30",
    pink: "bg-pink-500/20 dark:bg-pink-500/20 bg-gradient-to-b from-pink-400/20 to-pink-600/20 dark:from-pink-400/20 dark:to-pink-600/20 hover:from-pink-400/30 hover:to-pink-600/30 hover:dark:from-pink-400/30 hover:dark:to-pink-600/30",
    purple: "bg-purple-500/20 dark:bg-purple-500/20 bg-gradient-to-b from-purple-400/20 to-purple-600/20 dark:from-purple-400/20 dark:to-purple-600/20 hover:from-purple-400/30 hover:to-purple-600/30 hover:dark:from-purple-400/30 hover:dark:to-purple-600/30",
    cyan: "bg-teal-500/20 dark:bg-teal-500/20 bg-gradient-to-b from-teal-400/20 to-teal-600/20 dark:from-teal-400/20 dark:to-teal-600/20 hover:from-teal-400/30 hover:to-teal-600/30 hover:dark:from-teal-400/30 hover:dark:to-teal-600/30",
    orange: "bg-orange-400/20 dark:bg-orange-400/20 bg-gradient-to-b from-orange-400/20 to-orange-500/20 dark:from-orange-400/20 dark:to-orange-500/20 hover:from-orange-400/30 hover:to-orange-500/30 hover:dark:from-orange-400/30 hover:dark:to-orange-500/30",
};
export const colorMapGradient30: Record<ColorEnum, string> = {
    grey: "bg-zinc-500/30 dark:bg-zinc-500/30 bg-gradient-to-b from-zinc-400/30 to-zinc-500/30 dark:from-zinc-400/30 dark:to-zinc-500/30 hover:from-zinc-400/40 hover:to-zinc-500/40 hover:dark:from-zinc-400/40 hover:dark:to-zinc-500/40",
    blue: "bg-sky-400/30 dark:bg-sky-400/30 bg-gradient-to-b from-sky-300/30 to-sky-500/30 dark:from-sky-300/30 dark:to-sky-500/30 hover:from-sky-300/40 hover:to-sky-500/40 hover:dark:from-sky-300/40 hover:dark:to-sky-500/40",
    red: "bg-red-500/30 dark:bg-red-500/30 bg-gradient-to-b from-red-400/30 to-red-600/30 dark:from-red-400/30 dark:to-red-600/30 hover:from-red-400/40 hover:to-red-600/40 hover:dark:from-red-400/40 hover:dark:to-red-600/40",
    yellow: "bg-yellow-500/30 dark:bg-yellow-500/30 bg-gradient-to-b from-yellow-400/30 to-yellow-600/30 dark:from-yellow-400/30 dark:to-yellow-600/30 hover:from-yellow-400/40 hover:to-yellow-600/40 hover:dark:from-yellow-400/40 hover:dark:to-yellow-600/40",
    green: "bg-green-500/30 dark:bg-green-500/30 bg-gradient-to-b from-green-400/30 to-green-600/30 dark:from-green-400/30 dark:to-green-600/30 hover:from-green-400/40 hover:to-green-600/40 hover:dark:from-green-400/40 hover:dark:to-green-600/40",
    pink: "bg-pink-500/30 dark:bg-pink-500/30 bg-gradient-to-b from-pink-400/30 to-pink-600/30 dark:from-pink-400/30 dark:to-pink-600/30 hover:from-pink-400/40 hover:to-pink-600/40 hover:dark:from-pink-400/40 hover:dark:to-pink-600/40",
    purple: "bg-purple-500/30 dark:bg-purple-500/30 bg-gradient-to-b from-purple-400/30 to-purple-600/30 dark:from-purple-400/30 dark:to-purple-600/30 hover:from-purple-400/40 hover:to-purple-600/40 hover:dark:from-purple-400/40 hover:dark:to-purple-600/40",
    cyan: "bg-teal-500/30 dark:bg-teal-500/30 bg-gradient-to-b from-teal-400/30 to-teal-600/30 dark:from-teal-400/30 dark:to-teal-600/30 hover:from-teal-400/40 hover:to-teal-600/40 hover:dark:from-teal-400/40 hover:dark:to-teal-600/40",
    orange: "bg-orange-400/30 dark:bg-orange-400/30 bg-gradient-to-b from-orange-400/30 to-orange-500/30 dark:from-orange-400/30 dark:to-orange-500/30 hover:from-orange-400/40 hover:to-orange-500/40 hover:dark:from-orange-400/40 hover:dark:to-orange-500/40",
};
export const colorMapGradient50: Record<ColorEnum, string> = {
    grey: "bg-zinc-500/50 dark:bg-zinc-500/50 bg-gradient-to-b from-zinc-400/50 to-zinc-500/50 dark:from-zinc-400/50 dark:to-zinc-500/50 hover:from-zinc-400/60 hover:to-zinc-500/60 hover:dark:from-zinc-400/60 hover:dark:to-zinc-500/60",
    blue: "bg-sky-400/50 dark:bg-sky-400/50 bg-gradient-to-b from-sky-300/50 to-sky-500/50 dark:from-sky-300/50 dark:to-sky-500/50 hover:from-sky-300/60 hover:to-sky-500/60 hover:dark:from-sky-300/60 hover:dark:to-sky-500/60",
    red: "bg-red-500/50 dark:bg-red-500/50 bg-gradient-to-b from-red-400/50 to-red-600/50 dark:from-red-400/50 dark:to-red-600/50 hover:from-red-400/60 hover:to-red-600/60 hover:dark:from-red-400/60 hover:dark:to-red-600/60",
    yellow: "bg-yellow-500/50 dark:bg-yellow-500/50 bg-gradient-to-b from-yellow-400/50 to-yellow-600/50 dark:from-yellow-400/50 dark:to-yellow-600/50 hover:from-yellow-400/60 hover:to-yellow-600/60 hover:dark:from-yellow-400/60 hover:dark:to-yellow-600/60",
    green: "bg-green-500/50 dark:bg-green-500/50 bg-gradient-to-b from-green-400/50 to-green-600/50 dark:from-green-400/50 dark:to-green-600/50 hover:from-green-400/60 hover:to-green-600/60 hover:dark:from-green-400/60 hover:dark:to-green-600/60",
    pink: "bg-pink-500/50 dark:bg-pink-500/50 bg-gradient-to-b from-pink-400/50 to-pink-600/50 dark:from-pink-400/50 dark:to-pink-600/50 hover:from-pink-400/60 hover:to-pink-600/60 hover:dark:from-pink-400/60 hover:dark:to-pink-600/60",
    purple: "bg-purple-500/50 dark:bg-purple-500/50 bg-gradient-to-b from-purple-400/50 to-purple-600/50 dark:from-purple-400/50 dark:to-purple-600/50 hover:from-purple-400/60 hover:to-purple-600/60 hover:dark:from-purple-400/60 hover:dark:to-purple-600/60",
    cyan: "bg-teal-500/50 dark:bg-teal-500/50 bg-gradient-to-b from-teal-400/50 to-teal-600/50 dark:from-teal-400/50 dark:to-teal-600/50 hover:from-teal-400/60 hover:to-teal-600/60 hover:dark:from-teal-400/60 hover:dark:to-teal-600/60",
    orange: "bg-orange-400/50 dark:bg-orange-400/50 bg-gradient-to-b from-orange-400/50 to-orange-500/50 dark:from-orange-400/50 dark:to-orange-500/50 hover:from-orange-400/60 hover:to-orange-500/60 hover:dark:from-orange-400/60 hover:dark:to-orange-500/60",
};
export const colorMapGradient60: Record<ColorEnum, string> = {
    grey: "bg-zinc-500/60 dark:bg-zinc-500/60 bg-gradient-to-b from-zinc-400/60 to-zinc-500/60 dark:from-zinc-400/60 dark:to-zinc-500/60 hover:from-zinc-400/70 hover:to-zinc-500/70 hover:dark:from-zinc-400/70 hover:dark:to-zinc-500/70",
    blue: "bg-sky-400/60 dark:bg-sky-400/60 bg-gradient-to-b from-sky-300/60 to-sky-500/60 dark:from-sky-300/60 dark:to-sky-500/60 hover:from-sky-300/70 hover:to-sky-500/70 hover:dark:from-sky-300/70 hover:dark:to-sky-500/70",
    red: "bg-red-500/60 dark:bg-red-500/60 bg-gradient-to-b from-red-400/60 to-red-600/60 dark:from-red-400/60 dark:to-red-600/60 hover:from-red-400/70 hover:to-red-600/70 hover:dark:from-red-400/70 hover:dark:to-red-600/70",
    yellow: "bg-yellow-500/60 dark:bg-yellow-500/60 bg-gradient-to-b from-yellow-400/60 to-yellow-600/60 dark:from-yellow-400/60 dark:to-yellow-600/60 hover:from-yellow-400/70 hover:to-yellow-600/70 hover:dark:from-yellow-400/70 hover:dark:to-yellow-600/70",
    green: "bg-green-500/60 dark:bg-green-500/60 bg-gradient-to-b from-green-400/60 to-green-600/60 dark:from-green-400/60 dark:to-green-600/60 hover:from-green-400/70 hover:to-green-600/70 hover:dark:from-green-400/70 hover:dark:to-green-600/70",
    pink: "bg-pink-500/60 dark:bg-pink-500/60 bg-gradient-to-b from-pink-400/60 to-pink-600/60 dark:from-pink-400/60 dark:to-pink-600/60 hover:from-pink-400/70 hover:to-pink-600/70 hover:dark:from-pink-400/70 hover:dark:to-pink-600/70",
    purple: "bg-purple-500/60 dark:bg-purple-500/60 bg-gradient-to-b from-purple-400/60 to-purple-600/60 dark:from-purple-400/60 dark:to-purple-600/60 hover:from-purple-400/70 hover:to-purple-600/70 hover:dark:from-purple-400/70 hover:dark:to-purple-600/70",
    cyan: "bg-teal-500/60 dark:bg-teal-500/60 bg-gradient-to-b from-teal-400/60 to-teal-600/60 dark:from-teal-400/60 dark:to-teal-600/60 hover:from-teal-400/70 hover:to-teal-600/70 hover:dark:from-teal-400/70 hover:dark:to-teal-600/70",
    orange: "bg-orange-400/60 dark:bg-orange-400/60 bg-gradient-to-b from-orange-400/60 to-orange-500/60 dark:from-orange-400/60 dark:to-orange-500/60 hover:from-orange-400/70 hover:to-orange-500/70 hover:dark:from-orange-400/70 hover:dark:to-orange-500/70",
};
export const colorMapGradient70: Record<ColorEnum, string> = {
    grey: "bg-zinc-500/70 dark:bg-zinc-500/70 bg-gradient-to-b from-zinc-400/70 to-zinc-500/70 dark:from-zinc-400/70 dark:to-zinc-500/70 hover:from-zinc-400/80 hover:to-zinc-500/80 hover:dark:from-zinc-400/80 hover:dark:to-zinc-500/80",
    blue: "bg-sky-400/70 dark:bg-sky-400/70 bg-gradient-to-b from-sky-300/70 to-sky-500/70 dark:from-sky-300/70 dark:to-sky-500/70 hover:from-sky-300/80 hover:to-sky-500/80 hover:dark:from-sky-300/80 hover:dark:to-sky-500/80",
    red: "bg-red-500/70 dark:bg-red-500/70 bg-gradient-to-b from-red-400/70 to-red-600/70 dark:from-red-400/70 dark:to-red-600/70 hover:from-red-400/80 hover:to-red-600/80 hover:dark:from-red-400/80 hover:dark:to-red-600/80",
    yellow: "bg-yellow-500/70 dark:bg-yellow-500/70 bg-gradient-to-b from-yellow-400/70 to-yellow-600/70 dark:from-yellow-400/70 dark:to-yellow-600/70 hover:from-yellow-400/80 hover:to-yellow-600/80 hover:dark:from-yellow-400/80 hover:dark:to-yellow-600/80",
    green: "bg-green-500/70 dark:bg-green-500/70 bg-gradient-to-b from-green-400/70 to-green-600/70 dark:from-green-400/70 dark:to-green-600/70 hover:from-green-400/80 hover:to-green-600/80 hover:dark:from-green-400/80 hover:dark:to-green-600/80",
    pink: "bg-pink-500/70 dark:bg-pink-500/70 bg-gradient-to-b from-pink-400/70 to-pink-600/70 dark:from-pink-400/70 dark:to-pink-600/70 hover:from-pink-400/80 hover:to-pink-600/80 hover:dark:from-pink-400/80 hover:dark:to-pink-600/80",
    purple: "bg-purple-500/70 dark:bg-purple-500/70 bg-gradient-to-b from-purple-400/70 to-purple-600/70 dark:from-purple-400/70 dark:to-purple-600/70 hover:from-purple-400/80 hover:to-purple-600/80 hover:dark:from-purple-400/80 hover:dark:to-purple-600/80",
    cyan: "bg-teal-500/70 dark:bg-teal-500/70 bg-gradient-to-b from-teal-400/70 to-teal-600/70 dark:from-teal-400/70 dark:to-teal-600/70 hover:from-teal-400/80 hover:to-teal-600/80 hover:dark:from-teal-400/80 hover:dark:to-teal-600/80",
    orange: "bg-orange-400/70 dark:bg-orange-400/70 bg-gradient-to-b from-orange-400/70 to-orange-500/70 dark:from-orange-400/70 dark:to-orange-500/70 hover:from-orange-400/80 hover:to-orange-500/80 hover:dark:from-orange-400/80 hover:dark:to-orange-500/80",
};
export const colorMapGradient80: Record<ColorEnum, string> = {
    grey: "bg-zinc-500/80 dark:bg-zinc-500/80 bg-gradient-to-b from-zinc-400/80 to-zinc-500/80 dark:from-zinc-400/80 dark:to-zinc-500/80 hover:from-zinc-400/90 hover:to-zinc-500/90 hover:dark:from-zinc-400/90 hover:dark:to-zinc-500/90",
    blue: "bg-sky-400/80 dark:bg-sky-400/80 bg-gradient-to-b from-sky-300/80 to-sky-500/80 dark:from-sky-300/80 dark:to-sky-500/80 hover:from-sky-300/90 hover:to-sky-500/90 hover:dark:from-sky-300/90 hover:dark:to-sky-500/90",
    red: "bg-red-500/80 dark:bg-red-500/80 bg-gradient-to-b from-red-400/80 to-red-600/80 dark:from-red-400/80 dark:to-red-600/80 hover:from-red-400/90 hover:to-red-600/90 hover:dark:from-red-400/90 hover:dark:to-red-600/90",
    yellow: "bg-yellow-500/80 dark:bg-yellow-500/80 bg-gradient-to-b from-yellow-400/80 to-yellow-600/80 dark:from-yellow-400/80 dark:to-yellow-600/80 hover:from-yellow-400/90 hover:to-yellow-600/90 hover:dark:from-yellow-400/90 hover:dark:to-yellow-600/90",
    green: "bg-green-500/80 dark:bg-green-500/80 bg-gradient-to-b from-green-400/80 to-green-600/80 dark:from-green-400/80 dark:to-green-600/80 hover:from-green-400/90 hover:to-green-600/90 hover:dark:from-green-400/90 hover:dark:to-green-600/90",
    pink: "bg-pink-500/80 dark:bg-pink-500/80 bg-gradient-to-b from-pink-400/80 to-pink-600/80 dark:from-pink-400/80 dark:to-pink-600/80 hover:from-pink-400/90 hover:to-pink-600/90 hover:dark:from-pink-400/90 hover:dark:to-pink-600/90",
    purple: "bg-purple-500/80 dark:bg-purple-500/80 bg-gradient-to-b from-purple-400/80 to-purple-600/80 dark:from-purple-400/80 dark:to-purple-600/80 hover:from-purple-400/90 hover:to-purple-600/90 hover:dark:from-purple-400/90 hover:dark:to-purple-600/90",
    cyan: "bg-teal-500/80 dark:bg-teal-500/80 bg-gradient-to-b from-teal-400/80 to-teal-600/80 dark:from-teal-400/80 dark:to-teal-600/80 hover:from-teal-400/90 hover:to-teal-600/90 hover:dark:from-teal-400/90 hover:dark:to-teal-600/90",
    orange: "bg-orange-400/80 dark:bg-orange-400/80 bg-gradient-to-b from-orange-400/80 to-orange-500/80 dark:from-orange-400/80 dark:to-orange-500/80 hover:from-orange-400/90 hover:to-orange-500/90 hover:dark:from-orange-400/90 hover:dark:to-orange-500/90",
};
export const colorMapGradient90: Record<ColorEnum, string> = {
    grey: "bg-zinc-500/90 dark:bg-zinc-500/90 bg-gradient-to-b from-zinc-400/90 to-zinc-500/90 dark:from-zinc-400/90 dark:to-zinc-500/90 hover:from-zinc-400/100 hover:to-zinc-500/100 hover:dark:from-zinc-400/100 hover:dark:to-zinc-500/100",
    blue: "bg-sky-400/90 dark:bg-sky-400/90 bg-gradient-to-b from-sky-300/90 to-sky-500/90 dark:from-sky-300/90 dark:to-sky-500/90 hover:from-sky-300/100 hover:to-sky-500/100 hover:dark:from-sky-300/100 hover:dark:to-sky-500/100",
    red: "bg-red-500/90 dark:bg-red-500/90 bg-gradient-to-b from-red-400/90 to-red-600/90 dark:from-red-400/90 dark:to-red-600/90 hover:from-red-400/100 hover:to-red-600/100 hover:dark:from-red-400/100 hover:dark:to-red-600/100",
    yellow: "bg-yellow-500/90 dark:bg-yellow-500/90 bg-gradient-to-b from-yellow-400/90 to-yellow-600/90 dark:from-yellow-400/90 dark:to-yellow-600/90 hover:from-yellow-400/100 hover:to-yellow-600/100 hover:dark:from-yellow-400/100 hover:dark:to-yellow-600/100",
    green: "bg-green-500/90 dark:bg-green-500/90 bg-gradient-to-b from-green-400/90 to-green-600/90 dark:from-green-400/90 dark:to-green-600/90 hover:from-green-400/100 hover:to-green-600/100 hover:dark:from-green-400/100 hover:dark:to-green-600/100",
    pink: "bg-pink-500/90 dark:bg-pink-500/90 bg-gradient-to-b from-pink-400/90 to-pink-600/90 dark:from-pink-400/90 dark:to-pink-600/90 hover:from-pink-400/100 hover:to-pink-600/100 hover:dark:from-pink-400/100 hover:dark:to-pink-600/100",
    purple: "bg-purple-500/90 dark:bg-purple-500/90 bg-gradient-to-b from-purple-400/90 to-purple-600/90 dark:from-purple-400/90 dark:to-purple-600/90 hover:from-purple-400/100 hover:to-purple-600/100 hover:dark:from-purple-400/100 hover:dark:to-purple-600/100",
    cyan: "bg-teal-500/90 dark:bg-teal-500/90 bg-gradient-to-b from-teal-400/90 to-teal-600/90 dark:from-teal-400/90 dark:to-teal-600/90 hover:from-teal-400/100 hover:to-teal-600/100 hover:dark:from-teal-400/100 hover:dark:to-teal-600/100",
    orange: "bg-orange-400/90 dark:bg-orange-400/90 bg-gradient-to-b from-orange-400/90 to-orange-500/90 dark:from-orange-400/90 dark:to-orange-500/90 hover:from-orange-400/100 hover:to-orange-500/100 hover:dark:from-orange-400/100 hover:dark:to-orange-500/100",
};
export const colorMapGradient100: Record<ColorEnum, string> = {
    grey: "bg-zinc-500/100 dark:bg-zinc-500/100 bg-gradient-to-b from-zinc-400/100 to-zinc-500/100 dark:from-zinc-400/100 dark:to-zinc-500/100 hover:from-zinc-400/100 hover:to-zinc-500/100 hover:dark:from-zinc-400/100 hover:dark:to-zinc-500/100",
    blue: "bg-sky-400/100 dark:bg-sky-400/100 bg-gradient-to-b from-sky-300/100 to-sky-500/100 dark:from-sky-300/100 dark:to-sky-500/100 hover:from-sky-300/100 hover:to-sky-500/100 hover:dark:from-sky-300/100 hover:dark:to-sky-500/100",
    red: "bg-red-500/100 dark:bg-red-500/100 bg-gradient-to-b from-red-400/100 to-red-600/100 dark:from-red-400/100 dark:to-red-600/100 hover:from-red-400/100 hover:to-red-600/100 hover:dark:from-red-400/100 hover:dark:to-red-600/100",
    yellow: "bg-yellow-500/100 dark:bg-yellow-500/100 bg-gradient-to-b from-yellow-400/100 to-yellow-600/100 dark:from-yellow-400/100 dark:to-yellow-600/100 hover:from-yellow-400/100 hover:to-yellow-600/100 hover:dark:from-yellow-400/100 hover:dark:to-yellow-600/100",
    green: "bg-green-500/100 dark:bg-green-500/100 bg-gradient-to-b from-green-400/100 to-green-600/100 dark:from-green-400/100 dark:to-green-600/100 hover:from-green-400/100 hover:to-green-600/100 hover:dark:from-green-400/100 hover:dark:to-green-600/100",
    pink: "bg-pink-500/100 dark:bg-pink-500/100 bg-gradient-to-b from-pink-400/100 to-pink-600/100 dark:from-pink-400/100 dark:to-pink-600/100 hover:from-pink-400/100 hover:to-pink-600/100 hover:dark:from-pink-400/100 hover:dark:to-pink-600/100",
    purple: "bg-purple-500/100 dark:bg-purple-500/100 bg-gradient-to-b from-purple-400/100 to-purple-600/100 dark:from-purple-400/100 dark:to-purple-600/100 hover:from-purple-400/100 hover:to-purple-600/100 hover:dark:from-purple-400/100 hover:dark:to-purple-600/100",
    cyan: "bg-teal-500/100 dark:bg-teal-500/100 bg-gradient-to-b from-teal-400/100 to-teal-600/100 dark:from-teal-400/100 dark:to-teal-600/100 hover:from-teal-400/100 hover:to-teal-600/100 hover:dark:from-teal-400/100 hover:dark:to-teal-600/100",
    orange: "bg-orange-400/100 dark:bg-orange-400/100 bg-gradient-to-b from-orange-400/100 to-orange-500/100 dark:from-orange-400/100 dark:to-orange-500/100 hover:from-orange-400/100 hover:to-orange-500/100 hover:dark:from-orange-400/100 hover:dark:to-orange-500/100",
};
