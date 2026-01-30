import reactRefresh from "eslint-plugin-react-refresh";
import reactHooks from "eslint-plugin-react-hooks";
import reactYouMightNotNeedAnEffect from "eslint-plugin-react-you-might-not-need-an-effect";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
    {
        ignores: ["dist", "website", ".eslintrc.json"],
    },
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: "module",
            parser: tsparser,
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                // Browser globals
                window: "readonly",
                document: "readonly",
                console: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                fetch: "readonly",
                Promise: "readonly",
                chrome: "readonly",
            },
        },
        plugins: {
            "react-refresh": reactRefresh,
            "react-hooks": reactHooks,
            "react-you-might-not-need-an-effect": reactYouMightNotNeedAnEffect,
            "@typescript-eslint": tseslint,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            "react-you-might-not-need-an-effect/no-empty-effect": "warn",
            "react-you-might-not-need-an-effect/no-adjust-state-on-prop-change": "off", // Disabled due to plugin bug
            "react-you-might-not-need-an-effect/no-reset-all-state-on-prop-change": "off", // Disabled due to plugin bug
            "react-you-might-not-need-an-effect/no-event-handler": "warn",
            "react-you-might-not-need-an-effect/no-pass-live-state-to-parent": "off", // Disabled due to plugin bug
            "react-you-might-not-need-an-effect/no-pass-data-to-parent": "off", // Disabled due to plugin bug
            "react-you-might-not-need-an-effect/no-manage-parent": "off", // Disabled due to plugin bug
            "react-you-might-not-need-an-effect/no-initialize-state": "warn",
            "react-you-might-not-need-an-effect/no-chain-state-updates": "off", // Disabled due to plugin bug
            "react-you-might-not-need-an-effect/no-derived-state": "warn",
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",
            // React Compiler 1.0 rules (now integrated into eslint-plugin-react-hooks)
            "react-hooks/set-state-in-render": "error",
            "react-hooks/set-state-in-effect": "error",
            "react-hooks/refs": "error",
            "react-refresh/only-export-components": ["off", { allowConstantExport: true }],
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "no-console": "off",
            "prefer-const": "warn",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-non-null-assertion": "warn",
            "@typescript-eslint/no-empty-interface": "warn",
            "no-duplicate-imports": "error",
            eqeqeq: ["error", "always", { null: "ignore" }],
            "no-var": "error",
            "@typescript-eslint/ban-ts-comment": "off",
            "no-param-reassign": "error",
        },
    },
];
