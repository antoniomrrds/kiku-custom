/**
 * @import { KikuPlugin } from "#/plugins/plugin-types";
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
