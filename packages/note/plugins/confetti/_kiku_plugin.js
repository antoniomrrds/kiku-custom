/**
 * @import { KikuPlugin } from "#/plugins/plugin-types";
 */

/** @type { KikuPlugin } */
export const plugin = {
  onPluginLoad: () => {
    import("./_kiku-plugin-confetti.js").then((mod) => mod.setupConfetti()).catch(() => {});
  },
};
