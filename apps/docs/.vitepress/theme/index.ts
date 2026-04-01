import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import "./custom.css";
import KikuEmbed from "./components/KikuEmbed.vue";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("KikuEmbed", KikuEmbed);
  },
} satisfies Theme;
