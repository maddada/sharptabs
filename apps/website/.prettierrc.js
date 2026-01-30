/** @type {import("prettier").Config} */
// Commenting to start cloudflare build
export default {
    printWidth: 130,
    tabWidth: 4,
    useTabs: false,
    semi: true,
    singleQuote: false,
    trailingComma: "es5",
    bracketSpacing: true,
    arrowParens: "always",
    endOfLine: "auto",
    jsxSingleQuote: false,
    bracketSameLine: false,
    plugins: ["prettier-plugin-astro"],
    overrides: [
        {
            files: "*.astro",
            options: {
                parser: "astro",
            },
        },
    ],
};
