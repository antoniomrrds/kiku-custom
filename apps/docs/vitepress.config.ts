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
  description: "Modern, fully interactive Anki note type designed for Japanese learners.",
  head: [["link", { rel: "icon", href: "/favicon.ico" }], umamiScript],
  vite: {
    publicDir: "../public",
    plugins: [
      vitePluginCopyKikuAssets(),
      //@ts-expect-error
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
          { text: "Plugin", link: "/plugin" },
          { text: "How Things Work", link: "/how-things-work" },
          { text: "Development", link: "/development" },
        ],
      },
      {
        text: "Recipes",
        items: [
          { text: "Add More External Links", link: "/add-more-external-links" },
          { text: "Display Extra Fields", link: "/display-extra-fields" },
          {
            text: "Unblur Picture Automatically",
            link: "/unblur-picture-automatically",
          },
          { text: "Random Font", link: "/random-font" },
          { text: "Custom Dictionary Style", link: "/custom-dictionary-style" },
          { text: "Custom Theme", link: "/custom-theme" },
          {
            text: "Custom Pitch Accent Color",
            link: "/custom-pitch-accent-color",
          },
        ],
      },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/youyoumu/kiku" }],
  },
});
