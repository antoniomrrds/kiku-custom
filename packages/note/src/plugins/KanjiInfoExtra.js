/**
 * @import { KikuPlugin } from "#/plugins/pluginTypes";
 */

//TODO: docs
//
/**
 * @type { KikuPlugin }
 */
export const plugin = {
  KanjiInfoExtra: (props) => {
    return [props.DefaultKanjiInfoExtra()];
  },
};
