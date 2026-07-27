/**
 * @import { KikuPlugin } from "#/plugins/plugin-types";
 */

/**
 * @type { KikuPlugin }
 */
export const plugin = {
  Sentence: (props) => {
    const {
      html,
      createSignal,
      createEffect,
      createMemo,
      onMount,
      useAnkiFieldContext,
      useCardContext,
    } = props.ctx;
    const { initialAnkiFields, $isInitialAnkiFields } = useAnkiFieldContext();
    const { $card } = useCardContext();

    const cardId = initialAnkiFields.CardID;
    const expected = initialAnkiFields.ExpressionReading?.trim() ?? "";

    function TypeReadingUI() {
      const [value, setValue] = createSignal("");
      const [hasLoaded, setHasLoaded] = createSignal(false);

      onMount(() => {
        const saved = sessionStorage.getItem(`type-reading-${cardId}`);
        if (saved) setValue(saved);
        setHasLoaded(true);
      });

      createEffect(() => {
        if (!hasLoaded()) return;
        const v = value();
        if (v) {
          sessionStorage.setItem(`type-reading-${cardId}`, v);
        } else {
          sessionStorage.removeItem(`type-reading-${cardId}`);
        }
      });

      const isCorrect = createMemo(() => value().trim() === expected);
      const resultStyle = createMemo(() => {
        if ($card.side !== "back" || !value().trim()) return "display: none";
        const bg = isCorrect() ? "var(--color-success)" : "var(--color-error)";
        const fg = isCorrect() ? "var(--color-success-content)" : "var(--color-error-content)";
        return `text-align: center; font-weight: 500; padding: 0.25rem 0.75rem; border-radius: var(--radius-field); background-color: ${bg}; color: ${fg};`;
      });

      if (!$isInitialAnkiFields()) return props.DefaultSentence();

      /** @param {Event} e */
      function handleInput(e) {
        setValue(/** @type {HTMLInputElement} */ (e.currentTarget).value);
      }

      return [
        props.DefaultSentence(),
        html`<div class="mt-2 flex flex-col items-center">
          <input
            type="text"
            class="input"
            placeholder="Type the reading..."
            value=${value()}
            onInput=${handleInput}
            style=${() => ($card.side === "front" ? "" : "display: none")}
          />
          <div style=${resultStyle}>
            ${() => value().trim()}${() =>
              !isCorrect() ? html`<span> → ${expected}</span>` : null}
          </div>
        </div>`,
      ];
    }

    return TypeReadingUI();
  },
};
