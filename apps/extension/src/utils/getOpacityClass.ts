// Convert opacity percentage to Tailwind class
export const getOpacityClass = (opacity: number) => {
    if (opacity >= 95) return "opacity-100";
    if (opacity >= 90) return "opacity-95";
    if (opacity >= 85) return "opacity-90";
    if (opacity >= 80) return "opacity-80";
    if (opacity >= 75) return "opacity-75";
    if (opacity >= 70) return "opacity-70";
    if (opacity >= 65) return "opacity-65";
    if (opacity >= 60) return "opacity-60";
    if (opacity >= 55) return "opacity-55";
    if (opacity >= 50) return "opacity-50";
    if (opacity >= 45) return "opacity-45";
    if (opacity >= 40) return "opacity-40";
    if (opacity >= 35) return "opacity-35";
    if (opacity >= 30) return "opacity-30";
    if (opacity >= 25) return "opacity-25";
    if (opacity >= 20) return "opacity-20";
    if (opacity >= 15) return "opacity-15";
    if (opacity >= 10) return "opacity-10";
    return "opacity-5";
};
