/** @type {import('tailwindcss').Config} */
import animate from "tailwindcss-animate";
import colors from "tailwindcss/colors";

export default {
    darkMode: ["class"],
    content: ["./src/**/*.{ts,tsx}"],
    // safelist: [
    // {
    // pattern:
    //     /(bg|border)-(zinc|orange|cyan|purple|pink|green|yellow|red|blue)-(400|500|600|700)\/(0|10|20|30|40|50|60|70|80|90|100)/,
    // variants: ["hover", "dark", "hover\:dark", "from", "to", "hover\:to", "hover\:from"],
    // },
    // ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
        },
        screens: {
            xs: "224px",
            sm: "360px",
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                chart: {
                    1: "hsl(var(--chart-1))",
                    2: "hsl(var(--chart-2))",
                    3: "hsl(var(--chart-3))",
                    4: "hsl(var(--chart-4))",
                    5: "hsl(var(--chart-5))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            animation: {
                // Custom
                // outline for recently dragged item
                "outline-pulse": "outline-color-change 1s ease-in-out infinite",

                // Wave animation
                wave: "wave 1.5s ease-in-out infinite",

                // Unused animations
                "fade-in": "fade-in 0.3s",
                "zoom-in": "zoom-in 0.8s",
                "zoom-out": "zoom-out 0.5s",
                "gentle-settle": "gentle-settle 0.7s",

                // Animations after drag end
                "gentle-settle-zoom-out": "gentle-settle-zoom-out 0.5s",

                // Shadcn
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
            keyframes: {
                // Custom
                // gentle settle zoom out
                "gentle-settle-zoom-out": {
                    "0%": {
                        transform: "translateY(-5px) scale(1.15)",
                        opacity: 0,
                    },
                    "15%": {
                        transform: "translateY(-5px) scale(1.15)",
                        opacity: 0,
                    },
                    "100%": {
                        transform: "translateY(0px) scale(1)",
                        opacity: 1,
                    },
                },
                // Wave animation
                wave: {
                    "0%": { transform: "rotate(-20deg) scaleY(1.2) scaleX(-1)" },
                    "50%": { transform: "rotate(-50deg) scaleY(1.2) scaleX(-1)" },
                    "100%": { transform: "rotate(-20deg) scaleY(1.2) scaleX(-1)" },
                },
                // outline for recently dragged item
                "outline-color-change": {
                    "0%, 100%": { outlineColor: colors.blue[500] }, // Start and end with blue
                    "50%": { outlineColor: colors.red[500] }, // Go to red in the middle
                },
                // fade in
                "fade-in": {
                    "0%": { opacity: 0 },
                    "100%": { opacity: 1 },
                },
                // gentle settle
                "gentle-settle": {
                    "0%": {
                        transform: "translateY(0)",
                    },
                    "60%": {
                        transform: "translateY(3px)",
                    },
                    "100%": {
                        transform: "translateY(0)",
                    },
                },
                // zoom in
                "zoom-in": {
                    "0%": { transform: "scale(0.8)" },
                    "100%": { transform: "scale(1)" },
                },
                "zoom-out": {
                    "0%": { transform: "scale(1.1)" },
                    "100%": { transform: "scale(1)" },
                },
                // Shadcn
                "accordion-down": {
                    from: {
                        height: 0,
                    },
                    to: {
                        height: "var(--radix-accordion-content-height)",
                    },
                },
                "accordion-up": {
                    from: {
                        height: "var(--radix-accordion-content-height)",
                    },
                    to: {
                        height: 0,
                    },
                },
                "accordion-down": {
                    from: {
                        height: "0",
                    },
                    to: {
                        height: "var(--radix-accordion-content-height)",
                    },
                },
                "accordion-up": {
                    from: {
                        height: "var(--radix-accordion-content-height)",
                    },
                    to: {
                        height: "0",
                    },
                },
            },
        },
    },
    plugins: [animate],
};
