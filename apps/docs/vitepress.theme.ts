import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
//TODO: fix import error
//@ts-expect-error
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
