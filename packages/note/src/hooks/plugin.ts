import { getOwner, runWithOwner } from "solid-js";
import { useCtxContext } from "#/src/contexts/CtxContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { constants } from "#/src/lib/contants";
import type { KikuPlugin } from "#/plugins/plugin-types";

export function useLoadPlugin() {
  const { $general, $setGeneral, assetsPath, logger } = useGeneralContext();
  const ctx = useCtxContext();
  const owner = getOwner();

  async function getPlugin(assetsPath: string) {
    try {
      const plugin = (
        await import(
          /* @vite-ignore */
          `${assetsPath}/${constants.assets["_kiku_plugin.js"]}`
        )
      ).plugin as KikuPlugin;
      return plugin;
    } catch (e) {
      logger.warn("[plugin] failed to import plugin:", e);
    }
  }

  function loadPlugin() {
    getPlugin(assetsPath).then((plugin) => {
      try {
        runWithOwner(owner, () => {
          plugin?.onPluginLoad?.({ ctx });
        });
      } catch (e) {
        logger.warn("[plugin] onPluginLoad failed:", e);
      }
      $setGeneral("plugin", plugin);
    });
  }

  return loadPlugin;
}
