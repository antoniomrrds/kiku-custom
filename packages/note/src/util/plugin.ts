import type { KikuPlugin } from "#/plugins/plugin-types";
import { constants } from "./general";

export async function getPlugin(assetsPath: string) {
  try {
    const plugin = (
      await import(
        /* @vite-ignore */
        `${assetsPath}/${constants.assets["_kiku_plugin.js"]}`
      )
    ).plugin as KikuPlugin;
    return plugin;
  } catch {}
}
