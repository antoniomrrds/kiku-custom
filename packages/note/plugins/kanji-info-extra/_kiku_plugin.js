/**
 * @import { KikuPlugin } from "#/plugins/plugin-types";
 */

/**
 * @type { KikuPlugin }
 */
export const plugin = {
  KanjiInfoExtra: (props) => {
    const { onMount } = props.ctx;
    const { checkboxRef, sections } = props;
    const { VisuallySimilar, ComposedOf, UsedIn, Meanings, Related } = sections;

    onMount(() => {
      // You can expand the sections by default by doing the following
      if (checkboxRef.composedOf) {
        checkboxRef.composedOf.checked = true;
        checkboxRef.composedOf.dispatchEvent(new Event("change"));
      }
      if (checkboxRef.meanings) {
        checkboxRef.meanings.checked = true;
        checkboxRef.meanings.dispatchEvent(new Event("change"));
      }
    });

    return [
      // You can customize the order here
      VisuallySimilar(),
      ComposedOf(),
      UsedIn(),
      Meanings(),
      Related(),
    ];
  },
};
