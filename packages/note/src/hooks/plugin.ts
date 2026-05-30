import { getOwner, runWithOwner } from "solid-js";
import { useCtxContext } from "#/contexts/CtxContext";
import { useGeneralContext } from "#/contexts/GeneralContext";
import { constants } from "#/lib/contants";
import type { KikuPlugin } from "#/plugins/plugin-types";

export function useLoadPlugin() {
  const { $general, $setGeneral } = useGeneralContext();
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
    } catch {}
  }

  function loadPlugin() {
    getPlugin($general.assetsPath).then((plugin) => {
      try {
        runWithOwner(owner, () => {
          plugin?.onPluginLoad?.({ ctx });
        });
      } catch {}
      $setGeneral("plugin", plugin);
    });
  }

  return loadPlugin;
}
