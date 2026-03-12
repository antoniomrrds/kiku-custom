import { readFile, writeFile } from "node:fs/promises";
import { paths } from "../tools/paths.ts";
import { getVersion, log } from "../tools/util.js";
import { generateSsrTemplate } from "./generate-ssr-template.js";

class Script {
  PATHS = {
    FRONT_SRC: paths["@/src/templates/front.html"],
    BACK_SRC: paths["@/src/templates/back.html"],
    STYLE_SRC: paths["@/src/templates/style.css"],

    FRONT_DEST: paths["@/dist/_kiku_front.html"],
    BACK_DEST: paths["@/dist/_kiku_back.html"],
    STYLE_DEST: paths["@/dist/_kiku_style.css"],

    CSS_SRC: paths["@/dist/_kiku.css"],
    CSS_DEST: paths["@/dist/_kiku.css"],

    PLUGIN_SRC: paths["@/src/templates/_kiku_plugin.js"],
    PLUGIN_DEST: paths["@/dist/_kiku_plugin.js"],

    CSS_PLUGIN_SRC: paths["@/src/templates/_kiku_plugin.css"],
    CSS_PLUGIN_DEST: paths["@/dist/_kiku_plugin.css"],
  };

  async loadSources() {
    const [front, back, style, css, plugin, cssPlugin] = await Promise.all([
      readFile(this.PATHS.FRONT_SRC, "utf8"),
      readFile(this.PATHS.BACK_SRC, "utf8"),
      readFile(this.PATHS.STYLE_SRC, "utf8"),
      readFile(this.PATHS.CSS_SRC, "utf8"),
      readFile(this.PATHS.PLUGIN_SRC, "utf8"),
      readFile(this.PATHS.CSS_PLUGIN_SRC, "utf8"),
    ]);
    return { front, back, style, css, plugin, cssPlugin };
  }

  async buildTemplates(src: {
    front: string;
    back: string;
    style: string;
    css: string;
    plugin: string;
    cssPlugin: string;
  }) {
    const version = `v${await getVersion()}`;
    const { frontSsrTemplate, backSsrTemplate, hydrationScript } =
      generateSsrTemplate();

    log.yellow("Front SSR Template:");
    log.gray(frontSsrTemplate);
    log.yellow("Back SSR Template:");
    log.gray(backSsrTemplate);
    log.yellow("Hydration Script:");
    log.gray(hydrationScript);

    const front = src.front
      .replace("__VERSION__", version)
      .replace("<!-- SSR_TEMPLATE -->", frontSsrTemplate)
      .replace("<!-- HYDRATION_SCRIPT -->", hydrationScript);
    const back = src.back
      .replace("__VERSION__", version)
      .replace("<!-- SSR_TEMPLATE -->", backSsrTemplate)
      .replace("<!-- HYDRATION_SCRIPT -->", hydrationScript);
    const style = src.style.replace("__VERSION__", version);
    const css = src.css;
    const plugin = src.plugin;
    const cssPlugin = src.cssPlugin;

    return { front, back, style, css, plugin, cssPlugin };
  }

  async writeOutputs(templates: {
    front: string;
    back: string;
    style: string;
    css: string;
    plugin: string;
    cssPlugin: string;
  }) {
    await Promise.all([
      writeFile(this.PATHS.FRONT_DEST, templates.front),
      writeFile(this.PATHS.BACK_DEST, templates.back),
      writeFile(this.PATHS.STYLE_DEST, templates.style),
      writeFile(this.PATHS.CSS_DEST, templates.css),
      writeFile(this.PATHS.PLUGIN_DEST, templates.plugin),
      writeFile(this.PATHS.CSS_PLUGIN_DEST, templates.cssPlugin),
    ]);
  }

  async run() {
    const sources = await this.loadSources();
    const templates = await this.buildTemplates(sources);
    await this.writeOutputs(templates);
  }
}

const script = new Script();
script
  .run()
  .then(() => {
    console.log("✅ Generated template");
  })
  .catch((err) => {
    console.error("❌ Failed to generate template:", err);
    process.exit(1);
  });
