import { cp } from "node:fs/promises";
import { join } from "node:path";
import type { PluginOption } from "vite";

const dirname = import.meta.dirname;
export function vitePluginCopyKikuAssets() {
  const plugin = {
    name: "vite-plugin-copy-kiku-assets",
    async writeBundle() {
      const assets = [
        {
          src: join(dirname, "../../../packages/note/dist/_kiku.css"),
          file: "_kiku.css",
        },
        {
          src: join(dirname, "../../../packages/note/.db/_kiku_db_main.tar"),
          file: "_kiku_db_main.tar",
        },
        {
          src: join(dirname, "../../../packages/note/.db/_kiku_db_main_manifest.json"),
          file: "_kiku_db_main_manifest.json",
        },
        {
          src: join(dirname, "../../../packages/note/template/_kiku_plugin.js"),
          file: "_kiku_plugin.js",
        },
      ];
      for (const asset of assets) {
        const src = asset.src;
        const dest = join(dirname, "../.vitepress/dist", asset.file);
        await cp(src, dest, { force: true });
        console.log("\x1b[33m%s\x1b[0m", `✔ Copied ${asset.file}`);
      }
    },
  } satisfies PluginOption;
  return plugin;
}
