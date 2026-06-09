/**
 * @import { KikuPlugin } from "#/plugins/plugin-types";
 */

/**
 * @type { KikuPlugin }
 */
export const plugin = {
  onPluginLoad: ({ ctx }) => {
    const { $general } = ctx.useGeneralContext();
    const root = $general.root;
    const fontsPool = [
      "'Hiragino Mincho ProN'",
      "'Noto Serif CJK JP'",
      "'Noto Serif JP'",
      "'Yu Mincho'",
      "'HanaMinA', 'HanaMinB', serif",
    ];

    const randomFont = fontsPool[Math.floor(Math.random() * fontsPool.length)];

    const { $initialSide } = ctx.useCardContext();
    let font = sessionStorage.getItem("random-font") ?? randomFont;
    if ($initialSide() === "front") {
      font = randomFont;
      sessionStorage.setItem("random-font", font);
    }

    if (root) root.style.setProperty("--font-secondary", font);

    // wait until the font is loaded
    document.fonts.onloadingdone = () => {
      if (root) root.dataset.hideSecondary = "false";
    };
    // safe guard when fonts.onloadingdone event fails
    const delay = 100; // ms
    setTimeout(() => {
      if (root) root.dataset.hideSecondary = "false";
    }, delay);
  },
};
