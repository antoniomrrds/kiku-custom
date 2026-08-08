import { inBrowser, type Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import KikuEmbed from "#/src/components/KikuEmbed.tsx";
import "#/src/styles/global.css";
import { VPButton } from "vitepress/theme";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("VPButton", VPButton);
    app.component("KikuEmbed", KikuEmbed);
    if (inBrowser) {
      import("#/src/lib/KikuHostDocs").catch((e) => {
        console.error("Failed to load KikuHostDocs:", e);
      });
    }
  },
} satisfies Theme;
