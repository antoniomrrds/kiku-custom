/**
 * @import { KikuPlugin } from "#/plugins/plugin-types";
 */

/**
 * @type { KikuPlugin }
 */
export const plugin = {
  ExternalLinks: (props) => {
    const h = props.ctx.h;
    const createSignal = props.ctx.createSignal;
    const [$pressed, $setPressed] = createSignal(false);
    const { $general } = props.ctx.useGeneralContext();
    const { $card, $setCard } = props.ctx.useCardContext();
    const cardId = props.ctx.$ankiFields.CardID;
    const { $config: config } = props.ctx.useConfigContext();

    function ToggleNsfwButton() {
      return h(
        "button",
        {
          disabled: $pressed(),
          class: `text-sm btn btn-xs ${$card.isNsfw ? "btn-error" : ""}`,
          "on:click": async () => {
            const address = config.ankiConnectAddress;

            const invoke = async (action = "", params = {}) => {
              const res = await fetch(address, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, version: 6, params }),
              });
              return (await res.json()).result;
            };

            try {
              const noteIds = await invoke("findNotes", {
                query: `cid:${cardId}`,
              });
              const noteId = noteIds?.[0];
              if (!noteId) return;

              const noteInfos = await invoke("notesInfo", { notes: [noteId] });
              const tags = noteInfos?.[0]?.tags || [];
              const isNsfw = tags.some((/**@type {string}*/ t) => t.toLowerCase() === "nsfw");

              if (isNsfw) {
                await invoke("removeTags", { notes: [noteId], tags: "NSFW" });
                $setCard("isNsfw", false);
                $general.toast.success("NSFW has been removed!");
              } else {
                await invoke("addTags", { notes: [noteId], tags: "NSFW" });
                $setCard("isNsfw", true);
                $general.toast.success("NSFW has been added!");
              }
              $setPressed(true);
            } catch (e) {
              console.error("Failed to toggle NSFW:", e);
              $general.toast.error("Failed to toggle NSFW");
            }
          },
        },
        "NSFW",
      );
    }

    /** @type{any} */
    const component = [props.DefaultExternalLinks, ToggleNsfwButton];
    return component;
  },
};
