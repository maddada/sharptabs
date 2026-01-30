import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import { configDefaults } from "vitest/config";
import fs from "fs";

const ReactCompilerConfig = {
    target: "18",
};

// Plugin to replace __vitePreload with a no-op in service worker
const serviceWorkerPreloadFix = () => ({
    name: "service-worker-preload-fix",
    generateBundle(options: any, bundle: any) {
        // Find and fix the service worker bundle
        const serviceWorkerChunk = bundle["assets/service_worker.js"];
        if (serviceWorkerChunk && serviceWorkerChunk.type === "chunk") {
            // Replace __vitePreload wrapper with direct await (multiline regex)
            // Pattern 1: await __vitePreload(async () => {...}, ...)
            serviceWorkerChunk.code = serviceWorkerChunk.code.replace(
                /await __vitePreload\(async \(\) => \{([\s\S]*?)\}, [^)]+\)/g,
                "await (async () => {$1})()"
            );
            // Pattern 2: __vitePreload(async () => {...}, ...).then(...)
            serviceWorkerChunk.code = serviceWorkerChunk.code.replace(
                /__vitePreload\(async \(\) => \{([\s\S]*?)\}, [^)]+\)/g,
                "(async () => {$1})()"
            );
            // Remove __vitePreload import
            serviceWorkerChunk.code = serviceWorkerChunk.code.replace(/, _ as __vitePreload/g, "");
            // Remove __vite__mapDeps function if it exists
            serviceWorkerChunk.code = serviceWorkerChunk.code.replace(/const __vite__mapDeps[\s\S]*?return deps\.map[\s\S]*?\}\);/, "");
        }
    },
});

// Plugin to process manifest.template.json and generate manifest.json with env values
const processManifestTemplate = (env: Record<string, string>) => ({
    name: "process-manifest-template",
    buildStart() {
        const templatePath = path.resolve(__dirname, "public/manifest.template.json");
        const outputPath = path.resolve(__dirname, "public/manifest.json");

        if (fs.existsSync(templatePath)) {
            let content = fs.readFileSync(templatePath, "utf-8");

            // Replace placeholders with environment variables
            const extensionKey = env.VITE_EXTENSION_KEY || "__EXTENSION_KEY__";
            const oauthClientId = env.VITE_OAUTH_CLIENT_ID || "__OAUTH_CLIENT_ID__";

            content = content.replace(/__EXTENSION_KEY__/g, extensionKey);
            content = content.replace(/__OAUTH_CLIENT_ID__/g, oauthClientId);

            fs.writeFileSync(outputPath, content);
        }
    },
});

// Plugin to copy HTML files and lib folder to dist root
const copyHtmlFiles = () => ({
    name: "copy-html-files",
    writeBundle() {
        const htmlFiles = ["popup.html", "sb.html", "settings.html"]; //"newtab.html",
        const srcDir = path.resolve(__dirname, "src");
        const publicDir = path.resolve(__dirname, "public");
        const distDir = path.resolve(__dirname, "dist");

        // Copy HTML files
        htmlFiles.forEach((file) => {
            const srcPath = path.join(srcDir, file);
            const distPath = path.join(distDir, file);
            if (fs.existsSync(srcPath)) {
                fs.copyFileSync(srcPath, distPath);
            }
        });

        // Copy lib folder
        const libSrcDir = path.join(publicDir, "lib");
        const libDistDir = path.join(distDir, "lib");
        if (fs.existsSync(libSrcDir)) {
            if (!fs.existsSync(libDistDir)) {
                fs.mkdirSync(libDistDir, { recursive: true });
            }
            const libFiles = fs.readdirSync(libSrcDir);
            libFiles.forEach((file) => {
                const srcPath = path.join(libSrcDir, file);
                const destPath = path.join(libDistDir, file);
                fs.copyFileSync(srcPath, destPath);
            });
        }
    },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // Load env files to make them available in the config
    const env = loadEnv(mode, process.cwd(), "");

    return {
    plugins: [
        react({
            babel: {
                plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
            },
        }),
        processManifestTemplate(env),
        serviceWorkerPreloadFix(),
        copyHtmlFiles(),
    ].filter(Boolean),
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    define: {
        // Define environment variables
        "process.env.NODE_ENV": JSON.stringify(mode),
        // Enable React DevTools to parse hook names
        __REACT_DEVTOOLS_PARSE_HOOK_NAMES__: mode === "development" ? "true" : "false",
    },
    build: {
        minify: mode === "production",
        sourcemap: mode !== "production",
        watch: mode === "development" ? {} : null,
        modulePreload: {
            polyfill: false, // Disable preload polyfill to avoid window/document usage in service worker
        },
        rollupOptions: {
            input: {
                popup: path.resolve(__dirname, "src/pages/PopupPage.tsx"),
                sb: path.resolve(__dirname, "src/pages/SidebarPage.tsx"),
                // newtab: path.resolve(__dirname, "src/pages/NewtabPage.tsx"),
                settings: path.resolve(__dirname, "src/pages/SettingsPage.tsx"),
                service_worker: path.resolve(__dirname, "src/service_worker.ts"),
                content_script: path.resolve(__dirname, "src/content_script.ts"),
                extension_content_script: path.resolve(__dirname, "src/extension_content_script.ts"),
            },
            output: {
                entryFileNames: (chunkInfo) => {
                    // Output HTML files to root of dist
                    if (chunkInfo.facadeModuleId && chunkInfo.facadeModuleId.endsWith(".html")) {
                        return "[name].html";
                    }
                    // All JS files go to assets folder
                    return "assets/[name].js";
                },
                chunkFileNames: "assets/[name].js",
                assetFileNames: "assets/[name].[ext]",
                // Separate workspace code into its own chunk for service worker
                manualChunks(id) {
                    // Keep workspace matcher utilities in a separate chunk to avoid UI code pollution
                    if (id.includes("/workspaces/workspaceMatcher")) {
                        return "workspaceMatcher";
                    }
                },
            },
        },
    },
    optimizeDeps: {
        esbuildOptions: {
            sourcemap: mode !== "production",
            sourcesContent: mode !== "production",
            keepNames: mode !== "production",
            minify: mode === "production",
        },
    },
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./src/test/setup.ts"],
        exclude: [...configDefaults.exclude, "e2e/*", ".ignore/**", "**/.ignore/**"],
        css: true,
    },
}});
