import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import KikuEmbed from "#/src/components/KikuEmbed.vue";
import "#/src/styles/global.css";
import { VPButton } from "vitepress/theme";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("VPButton", VPButton);
    app.component("KikuEmbed", KikuEmbed);
  },
} satisfies Theme;
