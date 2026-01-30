/** @type {import('tailwindcss').Config} */
export default {
    content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "#6ab9ea",
                    light: "#2389bd",
                    dark: "#175577",
                },
                secondary: {
                    DEFAULT: "#f4a261",
                    light: "#f9c29d",
                    dark: "#e76f51",
                },
                neutral: {
                    DEFAULT: "#1f2937", // dark gray
                    light: "#374151", // lighter gray for dark theme
                    dark: "#111827", // darker gray
                },
                gray: {
                    50: "#374151",
                    100: "#4b5563",
                    200: "#6b7280",
                    300: "#9ca3af",
                    400: "#d1d5db",
                    500: "#e5e7eb",
                    600: "#f3f4f6",
                    700: "#f9fafb",
                    800: "#1f2937",
                    900: "#111827",
                },
            },
            animation: {
                "fade-in": "fadeIn 0.5s ease-in-out",
                "slide-up": "slideUp 0.5s ease-out",
                "slide-right": "slideRight 0.5s ease-out",
                "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { transform: "translateY(20px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                slideRight: {
                    "0%": { transform: "translateX(-20px)", opacity: "0" },
                    "100%": { transform: "translateX(0)", opacity: "1" },
                },
            },
        },
    },
    plugins: [],
};
