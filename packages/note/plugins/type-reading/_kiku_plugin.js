/**
 * @import { KikuPlugin } from "#/plugins/plugin-types";
 */

/**
 * @param {Record<string, string | number | boolean | null | undefined>} obj
 * @returns {string}
 */
function objToStyle(obj) {
  let s = "";
  for (const key in obj) {
    const v = obj[key];
    if (v == null || v === false) continue;
    s += `${key}: ${v}; `;
  }
  return s.trim();
}

/** @type { KikuPlugin } */
export const plugin = {
  Sentence: (props) => {
    const {
      html,
      Switch,
      Match,
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
      const [$value, $setValue] = createSignal("");
      const [$hasLoaded, $setHasLoaded] = createSignal(false);
      const [$inputRef, $setInputRef] = createSignal();

      onMount(() => {
        const saved = sessionStorage.getItem(`type-reading-${cardId}`);
        if (saved) $setValue(saved);
        $inputRef()?.focus();
        $setHasLoaded(true);
      });

      createEffect(() => {
        if (!$hasLoaded()) return;
        const v = $value();
        if (v) {
          sessionStorage.setItem(`type-reading-${cardId}`, v);
        } else {
          sessionStorage.removeItem(`type-reading-${cardId}`);
        }
      });

      const $valueTrim = createMemo(() => $value().trim());
      const $isCorrect = createMemo(() => $valueTrim() === expected);
      const $showResult = createMemo(() => $card.side === "back" && !!$value().trim());

      const baseBox = {
        "text-align": "center",
        "font-weight": 500,
        padding: "0.25rem 0.75rem",
        "border-radius": "var(--radius-field)",
      };
      const $answerStyle = createMemo(() => {
        if (!$showResult()) return "display: none";
        return objToStyle({
          ...baseBox,
          "background-color": $isCorrect() ? "var(--color-success)" : "var(--color-error)",
          color: $isCorrect() ? "var(--color-success-content)" : "var(--color-error-content)",
        });
      });
      const $expectedStyle = createMemo(() => {
        if (!$showResult() || $isCorrect()) return objToStyle({ display: "none" });
        return objToStyle({
          ...baseBox,
          "background-color": "var(--color-success)",
          color: "var(--color-success-content)",
        });
      });
      const $inputStyle = createMemo(() => {
        return $card.side === "front" ? "" : objToStyle({ display: "none" });
      });
      const $containerStyle = createMemo(() => {
        return objToStyle({
          display: $showResult() ? "flex" : "none",
          "flex-direction": "row",
          gap: "0.5rem",
        });
      });

      /** @param {Event} e */
      function handleInput(e) {
        $setValue(/** @type {HTMLInputElement} */ (e.currentTarget).value);
      }

      /** @param {KeyboardEvent} e */
      function handleKeyDown(e) {
        e.stopPropagation();
        if (e.key === "Enter" && typeof pycmd !== "undefined") {
          pycmd("ans");
        }
      }

      return html`<${Switch}>
        <${Match} when=${$isInitialAnkiFields}>
          ${props.DefaultSentence()}
          <div class="mt-2 flex flex-col items-center">
            <input
              type="text"
              class="input"
              placeholder="Type the reading..."
              value=${$value}
              on:input=${handleInput}
              on:keydown=${handleKeyDown}
              ref=${$setInputRef}
              style=${$inputStyle}
            />
            <div style=${$containerStyle}>
              <div style=${$answerStyle}>${$valueTrim}</div>
              <div style=${$expectedStyle}>${expected}</div>
            </div>
          </div>
        <//>
        <${Match} when=${true}> ${props.DefaultSentence()} <//>
      <//>`;
    }

    return TypeReadingUI();
  },
};
