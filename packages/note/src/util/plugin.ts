import type { KikuPlugin } from "#/plugins/plugin-types";
import { constants } from "./general";

export async function getPlugin() {
  try {
    const plugin = (
      await import(
        /* @vite-ignore */
        `${KIKU_STATE.assetsPath}/${constants.assets["_kiku_plugin.js"]}`
      )
    ).plugin as KikuPlugin;
    return plugin;
  } catch (e) {
    KIKU_STATE.logger.warn(
      "Failed to load plugin:",
      e instanceof Error ? e.message : e,
    );
  }
}
