// https://astro.build/config
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    tailwind({
      // Disable automatic CSS injection - we'll handle it manually
      applyBaseStyles: false,
      nesting: true,
      config: {
        content: [
          "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
          "!./src/pages/restore.astro",
        ],
      },
    }),
  ],
});
