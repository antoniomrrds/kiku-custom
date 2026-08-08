import vueJsx from "@vitejs/plugin-vue-jsx";
import { defineConfig, type HeadConfig } from "vitepress";
import { vitePluginCopyKikuAssets } from "./tools/vite-plugin-copy-kiku-assets";
import { vitePluginServeKikuAssets } from "./tools/vite-plugin-serve-kiku-assets";

const umamiScript: HeadConfig = [
  "script",
  {
    defer: "true",
    src: process.env.VITE_UMAMI_URL ?? "",
    "data-website-id": process.env.VITE_UMAMI_WEBSITE_ID ?? "",
  },
];

// TODO: PURE annotation to avoid Rollup warning https://github.com/vueuse/vueuse/pull/5388

export default defineConfig({
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag === "kiku-host-docs",
      },
    },
  },
  srcDir: "mds",
  title: "Kiku",
  description: "Feature-rich, fully interactive Anki note type designed for Japanese learners.",
  head: [["link", { rel: "icon", href: "/favicon.ico" }], umamiScript],
  vite: {
    publicDir: "../public",
    plugins: [
      //@ts-expect-error rolldown/rollup type mismatch
      vueJsx(),
      vitePluginCopyKikuAssets(),
      //@ts-expect-error rolldown/rollup type mismatch
      vitePluginServeKikuAssets(),
    ],
  },
  themeConfig: {
    lastUpdated: {},
    nav: [{ text: "Home", link: "/" }],
    sidebar: [
      {
        text: "Getting Started",
        items: [
          { text: "Installation", link: "/installation" },
          { text: "Updating Kiku", link: "/updating" },
          { text: "Switching From Lapis", link: "/migration" },
        ],
      },
      {
        text: "Learn More",
        items: [
          { text: "Features", link: "/features" },
          { text: "Field Grouping", link: "/field-grouping" },
          { text: "Related Expression", link: "/related-expression" },
          { text: "Plugin", link: "/plugin" },
          { text: "How Things Work", link: "/how-things-work" },
          { text: "Development", link: "/development" },
        ],
      },
      {
        text: "Recipes",
        items: [
          { text: "Add More External Links", link: "/add-more-external-links" },
          { text: "Confetti", link: "/confetti" },
          { text: "Custom Dictionary Style", link: "/custom-dictionary-style" },
          { text: "Custom Kanji Info Extra", link: "/custom-kanji-info-extra" },
          { text: "Custom Pitch Accent Color", link: "/custom-pitch-accent-color" },
          { text: "Custom Theme", link: "/custom-theme" },
          { text: "Display Extra Fields", link: "/display-extra-fields" },
          { text: "Japanese Prefectures", link: "/japanese-prefectures" },
          { text: "Random Font", link: "/random-font" },
          { text: "Unblur Picture Automatically", link: "/unblur-picture-automatically" },
        ],
      },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/youyoumu/kiku" }],
  },
});
