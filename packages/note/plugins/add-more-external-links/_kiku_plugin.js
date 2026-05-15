/**
 * @import { KikuPlugin } from "#/plugins/plugin-types";
 */

/**
 * @type { KikuPlugin }
 */
export const plugin = {
  ExternalLinks: (props) => {
    const h = props.ctx.h;
    const useGeneralContext = props.ctx.useGeneralContext;
    const { $general } = useGeneralContext();

    // Create an arbitrary link
    const NadeshikoLink = h(
      "a",
      {
        href: (() => {
          const url = new URL("https://nadeshiko.co/search/sentence");
          url.searchParams.set("query", props.ctx.ankiFields.Expression);
          return url.toString();
        })(),
        target: "_blank",
      },
      h("img", {
        class: "size-5 object-contain rounded-xs",
        src: "https://nadeshiko.co/favicon.ico",
      }),
    );

    // Create an arbitrary button with a custom on:click handler
    const AnkiDroidBrowseButton = h(
      "button",
      {
        class: "text-sm btn btn-sm",
        "on:click": () => {
          $general.ankiDroidAPI?.ankiSearchCard(
            `("note:Kiku" OR "note:Lapis") AND "Expression:*${props.ctx.ankiFields.Expression}*"`,
          );
        },
      },
      "Browse",
    );

    return [
      // includes the default ExternalLinks
      props.DefaultExternalLinks(),
      NadeshikoLink(),
      AnkiDroidBrowseButton(),
      // you can create as many links as you want
    ];
  },
};
