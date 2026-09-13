import { ColorEnum } from "@/types/TabGroup";

export const colorMap: Record<ColorEnum, string> = {
    grey: "bg-group-grey/40 dark:bg-group-grey/40 hover:bg-group-grey/50 hover:dark:bg-group-grey/50",
    blue: "bg-group-blue/40 dark:bg-group-blue/40 hover:bg-group-blue/50 hover:dark:bg-group-blue/50",
    red: "bg-group-red/40 dark:bg-group-red/40 hover:bg-group-red/50 hover:dark:bg-group-red/50",
    yellow: "bg-group-yellow/40 dark:bg-group-yellow/40 hover:bg-group-yellow/50 hover:dark:bg-group-yellow/50",
    green: "bg-group-green/40 dark:bg-group-green/40 hover:bg-group-green/50 hover:dark:bg-group-green/50",
    pink: "bg-group-pink/40 dark:bg-group-pink/40 hover:bg-group-pink/50 hover:dark:bg-group-pink/50",
    purple: "bg-group-purple/40 dark:bg-group-purple/40 hover:bg-group-purple/50 hover:dark:bg-group-purple/50",
    cyan: "bg-group-cyan/40 dark:bg-group-cyan/40 hover:bg-group-cyan/50 hover:dark:bg-group-cyan/50",
    orange: "bg-group-orange/40 dark:bg-group-orange/40 hover:bg-group-orange/50 hover:dark:bg-group-orange/50",
};

export const colorMapGradient: Record<ColorEnum, string> = {
    grey: "bg-transparent dark:bg-transparent hover:bg-transparent hover:dark:bg-transparent bg-gradient-to-b from-group-grey/40 to-group-grey-deep/40 dark:from-group-grey/40 dark:to-group-grey-deep/40 hover:from-group-grey/50 hover:to-group-grey-deep/50 hover:dark:from-group-grey/50 hover:dark:to-group-grey-deep/50",
    blue: "bg-transparent dark:bg-transparent hover:bg-transparent hover:dark:bg-transparent bg-gradient-to-b from-group-blue/40 to-group-blue-deep/40 dark:from-group-blue/40 dark:to-group-blue-deep/40 hover:from-group-blue/50 hover:to-group-blue-deep/50 hover:dark:from-group-blue/50 hover:dark:to-group-blue-deep/50",
    red: "bg-transparent dark:bg-transparent hover:bg-transparent hover:dark:bg-transparent bg-gradient-to-b from-group-red/40 to-group-red-deep/40 dark:from-group-red/40 dark:to-group-red-deep/40 hover:from-group-red/50 hover:to-group-red-deep/50 hover:dark:from-group-red/50 hover:dark:to-group-red-deep/50",
    yellow: "bg-transparent dark:bg-transparent hover:bg-transparent hover:dark:bg-transparent bg-gradient-to-b from-group-yellow/40 to-group-yellow-deep/40 dark:from-group-yellow/40 dark:to-group-yellow-deep/40 hover:from-group-yellow/50 hover:to-group-yellow-deep/50 hover:dark:from-group-yellow/50 hover:dark:to-group-yellow-deep/50",
    green: "bg-transparent dark:bg-transparent hover:bg-transparent hover:dark:bg-transparent bg-gradient-to-b from-group-green/40 to-group-green-deep/40 dark:from-group-green/40 dark:to-group-green-deep/40 hover:from-group-green/50 hover:to-group-green-deep/50 hover:dark:from-group-green/50 hover:dark:to-group-green-deep/50",
    pink: "bg-transparent dark:bg-transparent hover:bg-transparent hover:dark:bg-transparent bg-gradient-to-b from-group-pink/40 to-group-pink-deep/40 dark:from-group-pink/40 dark:to-group-pink-deep/40 hover:from-group-pink/50 hover:to-group-pink-deep/50 hover:dark:from-group-pink/50 hover:dark:to-group-pink-deep/50",
    purple: "bg-transparent dark:bg-transparent hover:bg-transparent hover:dark:bg-transparent bg-gradient-to-b from-group-purple/40 to-group-purple-deep/40 dark:from-group-purple/40 dark:to-group-purple-deep/40 hover:from-group-purple/50 hover:to-group-purple-deep/50 hover:dark:from-group-purple/50 hover:dark:to-group-purple-deep/50",
    cyan: "bg-transparent dark:bg-transparent hover:bg-transparent hover:dark:bg-transparent bg-gradient-to-b from-group-cyan/40 to-group-cyan-deep/40 dark:from-group-cyan/40 dark:to-group-cyan-deep/40 hover:from-group-cyan/50 hover:to-group-cyan-deep/50 hover:dark:from-group-cyan/50 hover:dark:to-group-cyan-deep/50",
    orange: "bg-transparent dark:bg-transparent hover:bg-transparent hover:dark:bg-transparent bg-gradient-to-b from-group-orange/40 to-group-orange-deep/40 dark:from-group-orange/40 dark:to-group-orange-deep/40 hover:from-group-orange/50 hover:to-group-orange-deep/50 hover:dark:from-group-orange/50 hover:dark:to-group-orange-deep/50",
};

export const colorMapBorder: Record<ColorEnum, string> = {
    grey: "border-group-grey hover:border-group-grey dark:opacity-80",
    blue: "border-group-blue hover:border-group-blue dark:opacity-80",
    red: "border-group-red hover:border-group-red dark:opacity-80",
    yellow: "border-group-yellow hover:border-group-yellow dark:opacity-80",
    green: "border-group-green hover:border-group-green dark:opacity-80",
    pink: "border-group-pink hover:border-group-pink dark:opacity-80",
    purple: "border-group-purple hover:border-group-purple dark:opacity-80",
    cyan: "border-group-cyan hover:border-group-cyan dark:opacity-80",
    orange: "border-group-orange hover:border-group-orange dark:opacity-80",
};

export const borderColorMap: Record<ColorEnum, string> = {
    grey: "border-group-grey",
    blue: "border-group-blue",
    red: "border-group-red",
    yellow: "border-group-yellow",
    green: "border-group-green",
    pink: "border-group-pink",
    purple: "border-group-purple",
    cyan: "border-group-cyan",
    orange: "border-group-orange",
};

// Just for tailwind to include all of these opacities (using safelist in config added unnecessary ones):
export const colorMapOpacitiesLight: Record<ColorEnum, string> = {
    grey: "bg-group-grey/0 bg-group-grey/10 bg-group-grey/20 bg-group-grey/30 bg-group-grey/40 bg-group-grey/50 bg-group-grey/60 bg-group-grey/70 bg-group-grey/80 bg-group-grey/90 bg-group-grey/100",
    blue: "bg-group-blue/0 bg-group-blue/10 bg-group-blue/20 bg-group-blue/30 bg-group-blue/40 bg-group-blue/50 bg-group-blue/60 bg-group-blue/70 bg-group-blue/80 bg-group-blue/90 bg-group-blue/100",
    red: "bg-group-red/0 bg-group-red/10 bg-group-red/20 bg-group-red/30 bg-group-red/40 bg-group-red/50 bg-group-red/60 bg-group-red/70 bg-group-red/80 bg-group-red/90 bg-group-red/100",
    yellow: "bg-group-yellow/0 bg-group-yellow/10 bg-group-yellow/20 bg-group-yellow/30 bg-group-yellow/40 bg-group-yellow/50 bg-group-yellow/60 bg-group-yellow/70 bg-group-yellow/80 bg-group-yellow/90 bg-group-yellow/100",
    green: "bg-group-green/0 bg-group-green/10 bg-group-green/20 bg-group-green/30 bg-group-green/40 bg-group-green/50 bg-group-green/60 bg-group-green/70 bg-group-green/80 bg-group-green/90 bg-group-green/100",
    pink: "bg-group-pink/0 bg-group-pink/10 bg-group-pink/20 bg-group-pink/30 bg-group-pink/40 bg-group-pink/50 bg-group-pink/60 bg-group-pink/70 bg-group-pink/80 bg-group-pink/90 bg-group-pink/100",
    purple: "bg-group-purple/0 bg-group-purple/10 bg-group-purple/20 bg-group-purple/30 bg-group-purple/40 bg-group-purple/50 bg-group-purple/60 bg-group-purple/70 bg-group-purple/80 bg-group-purple/90 bg-group-purple/100",
    cyan: "bg-group-cyan/0 bg-group-cyan/10 bg-group-cyan/20 bg-group-cyan/30 bg-group-cyan/40 bg-group-cyan/50 bg-group-cyan/60 bg-group-cyan/70 bg-group-cyan/80 bg-group-cyan/90 bg-group-cyan/100",
    orange: "bg-group-orange/0 bg-group-orange/10 bg-group-orange/20 bg-group-orange/30 bg-group-orange/40 bg-group-orange/50 bg-group-orange/60 bg-group-orange/70 bg-group-orange/80 bg-group-orange/90 bg-group-orange/100",
};

export const colorMapOpacitiesDark: Record<string, string> = {
    grey: "dark:bg-group-grey/0 dark:bg-group-grey/10 dark:bg-group-grey/20 dark:bg-group-grey/30 dark:bg-group-grey/40 dark:bg-group-grey/50 dark:bg-group-grey/60 dark:bg-group-grey/70 dark:bg-group-grey/80 dark:bg-group-grey/90 dark:bg-group-grey/100",
    blue: "dark:bg-group-blue/0 dark:bg-group-blue/10 dark:bg-group-blue/20 dark:bg-group-blue/30 dark:bg-group-blue/40 dark:bg-group-blue/50 dark:bg-group-blue/60 dark:bg-group-blue/70 dark:bg-group-blue/80 dark:bg-group-blue/90 dark:bg-group-blue/100",
    red: "dark:bg-group-red/0 dark:bg-group-red/10 dark:bg-group-red/20 dark:bg-group-red/30 dark:bg-group-red/40 dark:bg-group-red/50 dark:bg-group-red/60 dark:bg-group-red/70 dark:bg-group-red/80 dark:bg-group-red/90 dark:bg-group-red/100",
    yellow: "dark:bg-group-yellow/0 dark:bg-group-yellow/10 dark:bg-group-yellow/20 dark:bg-group-yellow/30 dark:bg-group-yellow/40 dark:bg-group-yellow/50 dark:bg-group-yellow/60 dark:bg-group-yellow/70 dark:bg-group-yellow/80 dark:bg-group-yellow/90 dark:bg-group-yellow/100",
    green: "dark:bg-group-green/0 dark:bg-group-green/10 dark:bg-group-green/20 dark:bg-group-green/30 dark:bg-group-green/40 dark:bg-group-green/50 dark:bg-group-green/60 dark:bg-group-green/70 dark:bg-group-green/80 dark:bg-group-green/90 dark:bg-group-green/100",
    pink: "dark:bg-group-pink/0 dark:bg-group-pink/10 dark:bg-group-pink/20 dark:bg-group-pink/30 dark:bg-group-pink/40 dark:bg-group-pink/50 dark:bg-group-pink/60 dark:bg-group-pink/70 dark:bg-group-pink/80 dark:bg-group-pink/90 dark:bg-group-pink/100",
    purple: "dark:bg-group-purple/0 dark:bg-group-purple/10 dark:bg-group-purple/20 dark:bg-group-purple/30 dark:bg-group-purple/40 dark:bg-group-purple/50 dark:bg-group-purple/60 dark:bg-group-purple/70 dark:bg-group-purple/80 dark:bg-group-purple/90 dark:bg-group-purple/100",
    cyan: "dark:bg-group-cyan/0 dark:bg-group-cyan/10 dark:bg-group-cyan/20 dark:bg-group-cyan/30 dark:bg-group-cyan/40 dark:bg-group-cyan/50 dark:bg-group-cyan/60 dark:bg-group-cyan/70 dark:bg-group-cyan/80 dark:bg-group-cyan/90 dark:bg-group-cyan/100",
    orange: "dark:bg-group-orange/0 dark:bg-group-orange/10 dark:bg-group-orange/20 dark:bg-group-orange/30 dark:bg-group-orange/40 dark:bg-group-orange/50 dark:bg-group-orange/60 dark:bg-group-orange/70 dark:bg-group-orange/80 dark:bg-group-orange/90 dark:bg-group-orange/100",
};
export const colorMapGradient0: Record<ColorEnum, string> = {
    grey: "bg-group-grey/0 dark:bg-group-grey/0 bg-gradient-to-b from-group-grey/0 to-group-grey-deep/0 dark:from-group-grey/0 dark:to-group-grey-deep/0 hover:from-group-grey/10 hover:to-group-grey-deep/10 hover:dark:from-group-grey/10 hover:dark:to-group-grey-deep/10",
    blue: "bg-group-blue/0 dark:bg-group-blue/0 bg-gradient-to-b from-group-blue/0 to-group-blue-deep/0 dark:from-group-blue/0 dark:to-group-blue-deep/0 hover:from-group-blue/10 hover:to-group-blue-deep/10 hover:dark:from-group-blue/10 hover:dark:to-group-blue-deep/10",
    red: "bg-group-red/0 dark:bg-group-red/0 bg-gradient-to-b from-group-red/0 to-group-red-deep/0 dark:from-group-red/0 dark:to-group-red-deep/0 hover:from-group-red/10 hover:to-group-red-deep/10 hover:dark:from-group-red/10 hover:dark:to-group-red-deep/10",
    yellow: "bg-group-yellow/0 dark:bg-group-yellow/0 bg-gradient-to-b from-group-yellow/0 to-group-yellow-deep/0 dark:from-group-yellow/0 dark:to-group-yellow-deep/0 hover:from-group-yellow/10 hover:to-group-yellow-deep/10 hover:dark:from-group-yellow/10 hover:dark:to-group-yellow-deep/10",
    green: "bg-group-green/0 dark:bg-group-green/0 bg-gradient-to-b from-group-green/0 to-group-green-deep/0 dark:from-group-green/0 dark:to-group-green-deep/0 hover:from-group-green/10 hover:to-group-green-deep/10 hover:dark:from-group-green/10 hover:dark:to-group-green-deep/10",
    pink: "bg-group-pink/0 dark:bg-group-pink/0 bg-gradient-to-b from-group-pink/0 to-group-pink-deep/0 dark:from-group-pink/0 dark:to-group-pink-deep/0 hover:from-group-pink/10 hover:to-group-pink-deep/10 hover:dark:from-group-pink/10 hover:dark:to-group-pink-deep/10",
    purple: "bg-group-purple/0 dark:bg-group-purple/0 bg-gradient-to-b from-group-purple/0 to-group-purple-deep/0 dark:from-group-purple/0 dark:to-group-purple-deep/0 hover:from-group-purple/10 hover:to-group-purple-deep/10 hover:dark:from-group-purple/10 hover:dark:to-group-purple-deep/10",
    cyan: "bg-group-cyan/0 dark:bg-group-cyan/0 bg-gradient-to-b from-group-cyan/0 to-group-cyan-deep/0 dark:from-group-cyan/0 dark:to-group-cyan-deep/0 hover:from-group-cyan/10 hover:to-group-cyan-deep/10 hover:dark:from-group-cyan/10 hover:dark:to-group-cyan-deep/10",
    orange: "bg-group-orange/0 dark:bg-group-orange/0 bg-gradient-to-b from-group-orange/0 to-group-orange-deep/0 dark:from-group-orange/0 dark:to-group-orange-deep/0 hover:from-group-orange/10 hover:to-group-orange-deep/10 hover:dark:from-group-orange/10 hover:dark:to-group-orange-deep/10",
};
export const colorMapGradient10: Record<ColorEnum, string> = {
    grey: "bg-group-grey/10 dark:bg-group-grey/10 bg-gradient-to-b from-group-grey/10 to-group-grey-deep/10 dark:from-group-grey/10 dark:to-group-grey-deep/10 hover:from-group-grey/20 hover:to-group-grey-deep/20 hover:dark:from-group-grey/20 hover:dark:to-group-grey-deep/20",
    blue: "bg-group-blue/10 dark:bg-group-blue/10 bg-gradient-to-b from-group-blue/10 to-group-blue-deep/10 dark:from-group-blue/10 dark:to-group-blue-deep/10 hover:from-group-blue/20 hover:to-group-blue-deep/20 hover:dark:from-group-blue/20 hover:dark:to-group-blue-deep/20",
    red: "bg-group-red/10 dark:bg-group-red/10 bg-gradient-to-b from-group-red/10 to-group-red-deep/10 dark:from-group-red/10 dark:to-group-red-deep/10 hover:from-group-red/20 hover:to-group-red-deep/20 hover:dark:from-group-red/20 hover:dark:to-group-red-deep/20",
    yellow: "bg-group-yellow/10 dark:bg-group-yellow/10 bg-gradient-to-b from-group-yellow/10 to-group-yellow-deep/10 dark:from-group-yellow/10 dark:to-group-yellow-deep/10 hover:from-group-yellow/20 hover:to-group-yellow-deep/20 hover:dark:from-group-yellow/20 hover:dark:to-group-yellow-deep/20",
    green: "bg-group-green/10 dark:bg-group-green/10 bg-gradient-to-b from-group-green/10 to-group-green-deep/10 dark:from-group-green/10 dark:to-group-green-deep/10 hover:from-group-green/20 hover:to-group-green-deep/20 hover:dark:from-group-green/20 hover:dark:to-group-green-deep/20",
    pink: "bg-group-pink/10 dark:bg-group-pink/10 bg-gradient-to-b from-group-pink/10 to-group-pink-deep/10 dark:from-group-pink/10 dark:to-group-pink-deep/10 hover:from-group-pink/20 hover:to-group-pink-deep/20 hover:dark:from-group-pink/20 hover:dark:to-group-pink-deep/20",
    purple: "bg-group-purple/10 dark:bg-group-purple/10 bg-gradient-to-b from-group-purple/10 to-group-purple-deep/10 dark:from-group-purple/10 dark:to-group-purple-deep/10 hover:from-group-purple/20 hover:to-group-purple-deep/20 hover:dark:from-group-purple/20 hover:dark:to-group-purple-deep/20",
    cyan: "bg-group-cyan/10 dark:bg-group-cyan/10 bg-gradient-to-b from-group-cyan/10 to-group-cyan-deep/10 dark:from-group-cyan/10 dark:to-group-cyan-deep/10 hover:from-group-cyan/20 hover:to-group-cyan-deep/20 hover:dark:from-group-cyan/20 hover:dark:to-group-cyan-deep/20",
    orange: "bg-group-orange/10 dark:bg-group-orange/10 bg-gradient-to-b from-group-orange/10 to-group-orange-deep/10 dark:from-group-orange/10 dark:to-group-orange-deep/10 hover:from-group-orange/20 hover:to-group-orange-deep/20 hover:dark:from-group-orange/20 hover:dark:to-group-orange-deep/20",
};
export const colorMapGradient20: Record<ColorEnum, string> = {
    grey: "bg-group-grey/20 dark:bg-group-grey/20 bg-gradient-to-b from-group-grey/20 to-group-grey-deep/20 dark:from-group-grey/20 dark:to-group-grey-deep/20 hover:from-group-grey/30 hover:to-group-grey-deep/30 hover:dark:from-group-grey/30 hover:dark:to-group-grey-deep/30",
    blue: "bg-group-blue/20 dark:bg-group-blue/20 bg-gradient-to-b from-group-blue/20 to-group-blue-deep/20 dark:from-group-blue/20 dark:to-group-blue-deep/20 hover:from-group-blue/30 hover:to-group-blue-deep/30 hover:dark:from-group-blue/30 hover:dark:to-group-blue-deep/30",
    red: "bg-group-red/20 dark:bg-group-red/20 bg-gradient-to-b from-group-red/20 to-group-red-deep/20 dark:from-group-red/20 dark:to-group-red-deep/20 hover:from-group-red/30 hover:to-group-red-deep/30 hover:dark:from-group-red/30 hover:dark:to-group-red-deep/30",
    yellow: "bg-group-yellow/20 dark:bg-group-yellow/20 bg-gradient-to-b from-group-yellow/20 to-group-yellow-deep/20 dark:from-group-yellow/20 dark:to-group-yellow-deep/20 hover:from-group-yellow/30 hover:to-group-yellow-deep/30 hover:dark:from-group-yellow/30 hover:dark:to-group-yellow-deep/30",
    green: "bg-group-green/20 dark:bg-group-green/20 bg-gradient-to-b from-group-green/20 to-group-green-deep/20 dark:from-group-green/20 dark:to-group-green-deep/20 hover:from-group-green/30 hover:to-group-green-deep/30 hover:dark:from-group-green/30 hover:dark:to-group-green-deep/30",
    pink: "bg-group-pink/20 dark:bg-group-pink/20 bg-gradient-to-b from-group-pink/20 to-group-pink-deep/20 dark:from-group-pink/20 dark:to-group-pink-deep/20 hover:from-group-pink/30 hover:to-group-pink-deep/30 hover:dark:from-group-pink/30 hover:dark:to-group-pink-deep/30",
    purple: "bg-group-purple/20 dark:bg-group-purple/20 bg-gradient-to-b from-group-purple/20 to-group-purple-deep/20 dark:from-group-purple/20 dark:to-group-purple-deep/20 hover:from-group-purple/30 hover:to-group-purple-deep/30 hover:dark:from-group-purple/30 hover:dark:to-group-purple-deep/30",
    cyan: "bg-group-cyan/20 dark:bg-group-cyan/20 bg-gradient-to-b from-group-cyan/20 to-group-cyan-deep/20 dark:from-group-cyan/20 dark:to-group-cyan-deep/20 hover:from-group-cyan/30 hover:to-group-cyan-deep/30 hover:dark:from-group-cyan/30 hover:dark:to-group-cyan-deep/30",
    orange: "bg-group-orange/20 dark:bg-group-orange/20 bg-gradient-to-b from-group-orange/20 to-group-orange-deep/20 dark:from-group-orange/20 dark:to-group-orange-deep/20 hover:from-group-orange/30 hover:to-group-orange-deep/30 hover:dark:from-group-orange/30 hover:dark:to-group-orange-deep/30",
};
export const colorMapGradient30: Record<ColorEnum, string> = {
    grey: "bg-group-grey/30 dark:bg-group-grey/30 bg-gradient-to-b from-group-grey/30 to-group-grey-deep/30 dark:from-group-grey/30 dark:to-group-grey-deep/30 hover:from-group-grey/40 hover:to-group-grey-deep/40 hover:dark:from-group-grey/40 hover:dark:to-group-grey-deep/40",
    blue: "bg-group-blue/30 dark:bg-group-blue/30 bg-gradient-to-b from-group-blue/30 to-group-blue-deep/30 dark:from-group-blue/30 dark:to-group-blue-deep/30 hover:from-group-blue/40 hover:to-group-blue-deep/40 hover:dark:from-group-blue/40 hover:dark:to-group-blue-deep/40",
    red: "bg-group-red/30 dark:bg-group-red/30 bg-gradient-to-b from-group-red/30 to-group-red-deep/30 dark:from-group-red/30 dark:to-group-red-deep/30 hover:from-group-red/40 hover:to-group-red-deep/40 hover:dark:from-group-red/40 hover:dark:to-group-red-deep/40",
    yellow: "bg-group-yellow/30 dark:bg-group-yellow/30 bg-gradient-to-b from-group-yellow/30 to-group-yellow-deep/30 dark:from-group-yellow/30 dark:to-group-yellow-deep/30 hover:from-group-yellow/40 hover:to-group-yellow-deep/40 hover:dark:from-group-yellow/40 hover:dark:to-group-yellow-deep/40",
    green: "bg-group-green/30 dark:bg-group-green/30 bg-gradient-to-b from-group-green/30 to-group-green-deep/30 dark:from-group-green/30 dark:to-group-green-deep/30 hover:from-group-green/40 hover:to-group-green-deep/40 hover:dark:from-group-green/40 hover:dark:to-group-green-deep/40",
    pink: "bg-group-pink/30 dark:bg-group-pink/30 bg-gradient-to-b from-group-pink/30 to-group-pink-deep/30 dark:from-group-pink/30 dark:to-group-pink-deep/30 hover:from-group-pink/40 hover:to-group-pink-deep/40 hover:dark:from-group-pink/40 hover:dark:to-group-pink-deep/40",
    purple: "bg-group-purple/30 dark:bg-group-purple/30 bg-gradient-to-b from-group-purple/30 to-group-purple-deep/30 dark:from-group-purple/30 dark:to-group-purple-deep/30 hover:from-group-purple/40 hover:to-group-purple-deep/40 hover:dark:from-group-purple/40 hover:dark:to-group-purple-deep/40",
    cyan: "bg-group-cyan/30 dark:bg-group-cyan/30 bg-gradient-to-b from-group-cyan/30 to-group-cyan-deep/30 dark:from-group-cyan/30 dark:to-group-cyan-deep/30 hover:from-group-cyan/40 hover:to-group-cyan-deep/40 hover:dark:from-group-cyan/40 hover:dark:to-group-cyan-deep/40",
    orange: "bg-group-orange/30 dark:bg-group-orange/30 bg-gradient-to-b from-group-orange/30 to-group-orange-deep/30 dark:from-group-orange/30 dark:to-group-orange-deep/30 hover:from-group-orange/40 hover:to-group-orange-deep/40 hover:dark:from-group-orange/40 hover:dark:to-group-orange-deep/40",
};
export const colorMapGradient50: Record<ColorEnum, string> = {
    grey: "bg-group-grey/50 dark:bg-group-grey/50 bg-gradient-to-b from-group-grey/50 to-group-grey-deep/50 dark:from-group-grey/50 dark:to-group-grey-deep/50 hover:from-group-grey/60 hover:to-group-grey-deep/60 hover:dark:from-group-grey/60 hover:dark:to-group-grey-deep/60",
    blue: "bg-group-blue/50 dark:bg-group-blue/50 bg-gradient-to-b from-group-blue/50 to-group-blue-deep/50 dark:from-group-blue/50 dark:to-group-blue-deep/50 hover:from-group-blue/60 hover:to-group-blue-deep/60 hover:dark:from-group-blue/60 hover:dark:to-group-blue-deep/60",
    red: "bg-group-red/50 dark:bg-group-red/50 bg-gradient-to-b from-group-red/50 to-group-red-deep/50 dark:from-group-red/50 dark:to-group-red-deep/50 hover:from-group-red/60 hover:to-group-red-deep/60 hover:dark:from-group-red/60 hover:dark:to-group-red-deep/60",
    yellow: "bg-group-yellow/50 dark:bg-group-yellow/50 bg-gradient-to-b from-group-yellow/50 to-group-yellow-deep/50 dark:from-group-yellow/50 dark:to-group-yellow-deep/50 hover:from-group-yellow/60 hover:to-group-yellow-deep/60 hover:dark:from-group-yellow/60 hover:dark:to-group-yellow-deep/60",
    green: "bg-group-green/50 dark:bg-group-green/50 bg-gradient-to-b from-group-green/50 to-group-green-deep/50 dark:from-group-green/50 dark:to-group-green-deep/50 hover:from-group-green/60 hover:to-group-green-deep/60 hover:dark:from-group-green/60 hover:dark:to-group-green-deep/60",
    pink: "bg-group-pink/50 dark:bg-group-pink/50 bg-gradient-to-b from-group-pink/50 to-group-pink-deep/50 dark:from-group-pink/50 dark:to-group-pink-deep/50 hover:from-group-pink/60 hover:to-group-pink-deep/60 hover:dark:from-group-pink/60 hover:dark:to-group-pink-deep/60",
    purple: "bg-group-purple/50 dark:bg-group-purple/50 bg-gradient-to-b from-group-purple/50 to-group-purple-deep/50 dark:from-group-purple/50 dark:to-group-purple-deep/50 hover:from-group-purple/60 hover:to-group-purple-deep/60 hover:dark:from-group-purple/60 hover:dark:to-group-purple-deep/60",
    cyan: "bg-group-cyan/50 dark:bg-group-cyan/50 bg-gradient-to-b from-group-cyan/50 to-group-cyan-deep/50 dark:from-group-cyan/50 dark:to-group-cyan-deep/50 hover:from-group-cyan/60 hover:to-group-cyan-deep/60 hover:dark:from-group-cyan/60 hover:dark:to-group-cyan-deep/60",
    orange: "bg-group-orange/50 dark:bg-group-orange/50 bg-gradient-to-b from-group-orange/50 to-group-orange-deep/50 dark:from-group-orange/50 dark:to-group-orange-deep/50 hover:from-group-orange/60 hover:to-group-orange-deep/60 hover:dark:from-group-orange/60 hover:dark:to-group-orange-deep/60",
};
export const colorMapGradient60: Record<ColorEnum, string> = {
    grey: "bg-group-grey/60 dark:bg-group-grey/60 bg-gradient-to-b from-group-grey/60 to-group-grey-deep/60 dark:from-group-grey/60 dark:to-group-grey-deep/60 hover:from-group-grey/70 hover:to-group-grey-deep/70 hover:dark:from-group-grey/70 hover:dark:to-group-grey-deep/70",
    blue: "bg-group-blue/60 dark:bg-group-blue/60 bg-gradient-to-b from-group-blue/60 to-group-blue-deep/60 dark:from-group-blue/60 dark:to-group-blue-deep/60 hover:from-group-blue/70 hover:to-group-blue-deep/70 hover:dark:from-group-blue/70 hover:dark:to-group-blue-deep/70",
    red: "bg-group-red/60 dark:bg-group-red/60 bg-gradient-to-b from-group-red/60 to-group-red-deep/60 dark:from-group-red/60 dark:to-group-red-deep/60 hover:from-group-red/70 hover:to-group-red-deep/70 hover:dark:from-group-red/70 hover:dark:to-group-red-deep/70",
    yellow: "bg-group-yellow/60 dark:bg-group-yellow/60 bg-gradient-to-b from-group-yellow/60 to-group-yellow-deep/60 dark:from-group-yellow/60 dark:to-group-yellow-deep/60 hover:from-group-yellow/70 hover:to-group-yellow-deep/70 hover:dark:from-group-yellow/70 hover:dark:to-group-yellow-deep/70",
    green: "bg-group-green/60 dark:bg-group-green/60 bg-gradient-to-b from-group-green/60 to-group-green-deep/60 dark:from-group-green/60 dark:to-group-green-deep/60 hover:from-group-green/70 hover:to-group-green-deep/70 hover:dark:from-group-green/70 hover:dark:to-group-green-deep/70",
    pink: "bg-group-pink/60 dark:bg-group-pink/60 bg-gradient-to-b from-group-pink/60 to-group-pink-deep/60 dark:from-group-pink/60 dark:to-group-pink-deep/60 hover:from-group-pink/70 hover:to-group-pink-deep/70 hover:dark:from-group-pink/70 hover:dark:to-group-pink-deep/70",
    purple: "bg-group-purple/60 dark:bg-group-purple/60 bg-gradient-to-b from-group-purple/60 to-group-purple-deep/60 dark:from-group-purple/60 dark:to-group-purple-deep/60 hover:from-group-purple/70 hover:to-group-purple-deep/70 hover:dark:from-group-purple/70 hover:dark:to-group-purple-deep/70",
    cyan: "bg-group-cyan/60 dark:bg-group-cyan/60 bg-gradient-to-b from-group-cyan/60 to-group-cyan-deep/60 dark:from-group-cyan/60 dark:to-group-cyan-deep/60 hover:from-group-cyan/70 hover:to-group-cyan-deep/70 hover:dark:from-group-cyan/70 hover:dark:to-group-cyan-deep/70",
    orange: "bg-group-orange/60 dark:bg-group-orange/60 bg-gradient-to-b from-group-orange/60 to-group-orange-deep/60 dark:from-group-orange/60 dark:to-group-orange-deep/60 hover:from-group-orange/70 hover:to-group-orange-deep/70 hover:dark:from-group-orange/70 hover:dark:to-group-orange-deep/70",
};
export const colorMapGradient70: Record<ColorEnum, string> = {
    grey: "bg-group-grey/70 dark:bg-group-grey/70 bg-gradient-to-b from-group-grey/70 to-group-grey-deep/70 dark:from-group-grey/70 dark:to-group-grey-deep/70 hover:from-group-grey/80 hover:to-group-grey-deep/80 hover:dark:from-group-grey/80 hover:dark:to-group-grey-deep/80",
    blue: "bg-group-blue/70 dark:bg-group-blue/70 bg-gradient-to-b from-group-blue/70 to-group-blue-deep/70 dark:from-group-blue/70 dark:to-group-blue-deep/70 hover:from-group-blue/80 hover:to-group-blue-deep/80 hover:dark:from-group-blue/80 hover:dark:to-group-blue-deep/80",
    red: "bg-group-red/70 dark:bg-group-red/70 bg-gradient-to-b from-group-red/70 to-group-red-deep/70 dark:from-group-red/70 dark:to-group-red-deep/70 hover:from-group-red/80 hover:to-group-red-deep/80 hover:dark:from-group-red/80 hover:dark:to-group-red-deep/80",
    yellow: "bg-group-yellow/70 dark:bg-group-yellow/70 bg-gradient-to-b from-group-yellow/70 to-group-yellow-deep/70 dark:from-group-yellow/70 dark:to-group-yellow-deep/70 hover:from-group-yellow/80 hover:to-group-yellow-deep/80 hover:dark:from-group-yellow/80 hover:dark:to-group-yellow-deep/80",
    green: "bg-group-green/70 dark:bg-group-green/70 bg-gradient-to-b from-group-green/70 to-group-green-deep/70 dark:from-group-green/70 dark:to-group-green-deep/70 hover:from-group-green/80 hover:to-group-green-deep/80 hover:dark:from-group-green/80 hover:dark:to-group-green-deep/80",
    pink: "bg-group-pink/70 dark:bg-group-pink/70 bg-gradient-to-b from-group-pink/70 to-group-pink-deep/70 dark:from-group-pink/70 dark:to-group-pink-deep/70 hover:from-group-pink/80 hover:to-group-pink-deep/80 hover:dark:from-group-pink/80 hover:dark:to-group-pink-deep/80",
    purple: "bg-group-purple/70 dark:bg-group-purple/70 bg-gradient-to-b from-group-purple/70 to-group-purple-deep/70 dark:from-group-purple/70 dark:to-group-purple-deep/70 hover:from-group-purple/80 hover:to-group-purple-deep/80 hover:dark:from-group-purple/80 hover:dark:to-group-purple-deep/80",
    cyan: "bg-group-cyan/70 dark:bg-group-cyan/70 bg-gradient-to-b from-group-cyan/70 to-group-cyan-deep/70 dark:from-group-cyan/70 dark:to-group-cyan-deep/70 hover:from-group-cyan/80 hover:to-group-cyan-deep/80 hover:dark:from-group-cyan/80 hover:dark:to-group-cyan-deep/80",
    orange: "bg-group-orange/70 dark:bg-group-orange/70 bg-gradient-to-b from-group-orange/70 to-group-orange-deep/70 dark:from-group-orange/70 dark:to-group-orange-deep/70 hover:from-group-orange/80 hover:to-group-orange-deep/80 hover:dark:from-group-orange/80 hover:dark:to-group-orange-deep/80",
};
export const colorMapGradient80: Record<ColorEnum, string> = {
    grey: "bg-group-grey/80 dark:bg-group-grey/80 bg-gradient-to-b from-group-grey/80 to-group-grey-deep/80 dark:from-group-grey/80 dark:to-group-grey-deep/80 hover:from-group-grey/90 hover:to-group-grey-deep/90 hover:dark:from-group-grey/90 hover:dark:to-group-grey-deep/90",
    blue: "bg-group-blue/80 dark:bg-group-blue/80 bg-gradient-to-b from-group-blue/80 to-group-blue-deep/80 dark:from-group-blue/80 dark:to-group-blue-deep/80 hover:from-group-blue/90 hover:to-group-blue-deep/90 hover:dark:from-group-blue/90 hover:dark:to-group-blue-deep/90",
    red: "bg-group-red/80 dark:bg-group-red/80 bg-gradient-to-b from-group-red/80 to-group-red-deep/80 dark:from-group-red/80 dark:to-group-red-deep/80 hover:from-group-red/90 hover:to-group-red-deep/90 hover:dark:from-group-red/90 hover:dark:to-group-red-deep/90",
    yellow: "bg-group-yellow/80 dark:bg-group-yellow/80 bg-gradient-to-b from-group-yellow/80 to-group-yellow-deep/80 dark:from-group-yellow/80 dark:to-group-yellow-deep/80 hover:from-group-yellow/90 hover:to-group-yellow-deep/90 hover:dark:from-group-yellow/90 hover:dark:to-group-yellow-deep/90",
    green: "bg-group-green/80 dark:bg-group-green/80 bg-gradient-to-b from-group-green/80 to-group-green-deep/80 dark:from-group-green/80 dark:to-group-green-deep/80 hover:from-group-green/90 hover:to-group-green-deep/90 hover:dark:from-group-green/90 hover:dark:to-group-green-deep/90",
    pink: "bg-group-pink/80 dark:bg-group-pink/80 bg-gradient-to-b from-group-pink/80 to-group-pink-deep/80 dark:from-group-pink/80 dark:to-group-pink-deep/80 hover:from-group-pink/90 hover:to-group-pink-deep/90 hover:dark:from-group-pink/90 hover:dark:to-group-pink-deep/90",
    purple: "bg-group-purple/80 dark:bg-group-purple/80 bg-gradient-to-b from-group-purple/80 to-group-purple-deep/80 dark:from-group-purple/80 dark:to-group-purple-deep/80 hover:from-group-purple/90 hover:to-group-purple-deep/90 hover:dark:from-group-purple/90 hover:dark:to-group-purple-deep/90",
    cyan: "bg-group-cyan/80 dark:bg-group-cyan/80 bg-gradient-to-b from-group-cyan/80 to-group-cyan-deep/80 dark:from-group-cyan/80 dark:to-group-cyan-deep/80 hover:from-group-cyan/90 hover:to-group-cyan-deep/90 hover:dark:from-group-cyan/90 hover:dark:to-group-cyan-deep/90",
    orange: "bg-group-orange/80 dark:bg-group-orange/80 bg-gradient-to-b from-group-orange/80 to-group-orange-deep/80 dark:from-group-orange/80 dark:to-group-orange-deep/80 hover:from-group-orange/90 hover:to-group-orange-deep/90 hover:dark:from-group-orange/90 hover:dark:to-group-orange-deep/90",
};
export const colorMapGradient90: Record<ColorEnum, string> = {
    grey: "bg-group-grey/90 dark:bg-group-grey/90 bg-gradient-to-b from-group-grey/90 to-group-grey-deep/90 dark:from-group-grey/90 dark:to-group-grey-deep/90 hover:from-group-grey/100 hover:to-group-grey-deep/100 hover:dark:from-group-grey/100 hover:dark:to-group-grey-deep/100",
    blue: "bg-group-blue/90 dark:bg-group-blue/90 bg-gradient-to-b from-group-blue/90 to-group-blue-deep/90 dark:from-group-blue/90 dark:to-group-blue-deep/90 hover:from-group-blue/100 hover:to-group-blue-deep/100 hover:dark:from-group-blue/100 hover:dark:to-group-blue-deep/100",
    red: "bg-group-red/90 dark:bg-group-red/90 bg-gradient-to-b from-group-red/90 to-group-red-deep/90 dark:from-group-red/90 dark:to-group-red-deep/90 hover:from-group-red/100 hover:to-group-red-deep/100 hover:dark:from-group-red/100 hover:dark:to-group-red-deep/100",
    yellow: "bg-group-yellow/90 dark:bg-group-yellow/90 bg-gradient-to-b from-group-yellow/90 to-group-yellow-deep/90 dark:from-group-yellow/90 dark:to-group-yellow-deep/90 hover:from-group-yellow/100 hover:to-group-yellow-deep/100 hover:dark:from-group-yellow/100 hover:dark:to-group-yellow-deep/100",
    green: "bg-group-green/90 dark:bg-group-green/90 bg-gradient-to-b from-group-green/90 to-group-green-deep/90 dark:from-group-green/90 dark:to-group-green-deep/90 hover:from-group-green/100 hover:to-group-green-deep/100 hover:dark:from-group-green/100 hover:dark:to-group-green-deep/100",
    pink: "bg-group-pink/90 dark:bg-group-pink/90 bg-gradient-to-b from-group-pink/90 to-group-pink-deep/90 dark:from-group-pink/90 dark:to-group-pink-deep/90 hover:from-group-pink/100 hover:to-group-pink-deep/100 hover:dark:from-group-pink/100 hover:dark:to-group-pink-deep/100",
    purple: "bg-group-purple/90 dark:bg-group-purple/90 bg-gradient-to-b from-group-purple/90 to-group-purple-deep/90 dark:from-group-purple/90 dark:to-group-purple-deep/90 hover:from-group-purple/100 hover:to-group-purple-deep/100 hover:dark:from-group-purple/100 hover:dark:to-group-purple-deep/100",
    cyan: "bg-group-cyan/90 dark:bg-group-cyan/90 bg-gradient-to-b from-group-cyan/90 to-group-cyan-deep/90 dark:from-group-cyan/90 dark:to-group-cyan-deep/90 hover:from-group-cyan/100 hover:to-group-cyan-deep/100 hover:dark:from-group-cyan/100 hover:dark:to-group-cyan-deep/100",
    orange: "bg-group-orange/90 dark:bg-group-orange/90 bg-gradient-to-b from-group-orange/90 to-group-orange-deep/90 dark:from-group-orange/90 dark:to-group-orange-deep/90 hover:from-group-orange/100 hover:to-group-orange-deep/100 hover:dark:from-group-orange/100 hover:dark:to-group-orange-deep/100",
};
export const colorMapGradient100: Record<ColorEnum, string> = {
    grey: "bg-group-grey/100 dark:bg-group-grey/100 bg-gradient-to-b from-group-grey/100 to-group-grey-deep/100 dark:from-group-grey/100 dark:to-group-grey-deep/100 hover:from-group-grey/100 hover:to-group-grey-deep/100 hover:dark:from-group-grey/100 hover:dark:to-group-grey-deep/100",
    blue: "bg-group-blue/100 dark:bg-group-blue/100 bg-gradient-to-b from-group-blue/100 to-group-blue-deep/100 dark:from-group-blue/100 dark:to-group-blue-deep/100 hover:from-group-blue/100 hover:to-group-blue-deep/100 hover:dark:from-group-blue/100 hover:dark:to-group-blue-deep/100",
    red: "bg-group-red/100 dark:bg-group-red/100 bg-gradient-to-b from-group-red/100 to-group-red-deep/100 dark:from-group-red/100 dark:to-group-red-deep/100 hover:from-group-red/100 hover:to-group-red-deep/100 hover:dark:from-group-red/100 hover:dark:to-group-red-deep/100",
    yellow: "bg-group-yellow/100 dark:bg-group-yellow/100 bg-gradient-to-b from-group-yellow/100 to-group-yellow-deep/100 dark:from-group-yellow/100 dark:to-group-yellow-deep/100 hover:from-group-yellow/100 hover:to-group-yellow-deep/100 hover:dark:from-group-yellow/100 hover:dark:to-group-yellow-deep/100",
    green: "bg-group-green/100 dark:bg-group-green/100 bg-gradient-to-b from-group-green/100 to-group-green-deep/100 dark:from-group-green/100 dark:to-group-green-deep/100 hover:from-group-green/100 hover:to-group-green-deep/100 hover:dark:from-group-green/100 hover:dark:to-group-green-deep/100",
    pink: "bg-group-pink/100 dark:bg-group-pink/100 bg-gradient-to-b from-group-pink/100 to-group-pink-deep/100 dark:from-group-pink/100 dark:to-group-pink-deep/100 hover:from-group-pink/100 hover:to-group-pink-deep/100 hover:dark:from-group-pink/100 hover:dark:to-group-pink-deep/100",
    purple: "bg-group-purple/100 dark:bg-group-purple/100 bg-gradient-to-b from-group-purple/100 to-group-purple-deep/100 dark:from-group-purple/100 dark:to-group-purple-deep/100 hover:from-group-purple/100 hover:to-group-purple-deep/100 hover:dark:from-group-purple/100 hover:dark:to-group-purple-deep/100",
    cyan: "bg-group-cyan/100 dark:bg-group-cyan/100 bg-gradient-to-b from-group-cyan/100 to-group-cyan-deep/100 dark:from-group-cyan/100 dark:to-group-cyan-deep/100 hover:from-group-cyan/100 hover:to-group-cyan-deep/100 hover:dark:from-group-cyan/100 hover:dark:to-group-cyan-deep/100",
    orange: "bg-group-orange/100 dark:bg-group-orange/100 bg-gradient-to-b from-group-orange/100 to-group-orange-deep/100 dark:from-group-orange/100 dark:to-group-orange-deep/100 hover:from-group-orange/100 hover:to-group-orange-deep/100 hover:dark:from-group-orange/100 hover:dark:to-group-orange-deep/100",
};
