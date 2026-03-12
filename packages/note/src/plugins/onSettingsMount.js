/**
 * @import { KikuPlugin } from "#/plugins/plugin-types";
 */

/**
 * @type { KikuPlugin }
 */
export const plugin = {
  onSettingsMount: () => {
    sessionStorage.setItem("settings-mounted", "true");
  },
};
