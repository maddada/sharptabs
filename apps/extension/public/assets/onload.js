const savedThemeType = localStorage.getItem("themeType") || "system";
const resolvedThemeType =
    savedThemeType === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : savedThemeType;
const initialThemeType = window.location.href.includes("settings.html") ? "dark" : resolvedThemeType;
document.documentElement.classList.add(initialThemeType, localStorage.getItem("theme") || "gray");
document.documentElement.style.colorScheme = initialThemeType;
document.documentElement.style.backgroundColor = initialThemeType === "dark" ? "#0d0d0d" : "#fafafa";
