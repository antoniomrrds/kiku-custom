/**
 * @import { KikuPlugin } from "#/plugins/plugin-types";
 */

/**
 * @type { KikuPlugin }
 */
export const plugin = {
  Sentence: (props) => {
    const html = props.ctx.html;
    const createMemo = props.ctx.createMemo;

    function ExtraInfo() {
      const extraInfo = createMemo(() => {
        if ("ExtraInfo" in props.ctx.$ankiFields) {
          return props.ctx.$ankiFields?.ExtraInfo;
        }
        /**
         * @type {HTMLTemplateElement}
         */
        return document.getElementById("ExtraInfo")?.innerHTML;
      });

      if (!extraInfo()) return null;
      return html`<div class="text-lg text-base-content-calm">${() => extraInfo()}</div>`;
    }

    return [props.DefaultSentence(), ExtraInfo()];
  },
};
