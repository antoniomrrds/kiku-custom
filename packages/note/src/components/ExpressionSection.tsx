import { createMemo, Switch, Match, Suspense, lazy } from "solid-js";
import { isServer } from "solid-js/web";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useCardContext } from "#/src/contexts/CardContext";
import { usePitch } from "#/src/hooks/pitch";
import type { DatasetProp } from "#/src/lib/config";

// oxfmt-ignore
const Lazy = {
  Expression: lazy(async () => ({ default: (await import("#/src/lazy")).Expression })),
};

export function ExpressionSection(props: { hideExpression?: boolean }) {
  const { $card, $initialSide, $isInitialSide, nested } = useCardContext();
  const { $ankiFields, $isRootAnkiFields } = useAnkiFieldContext();
  const { $pitchType } = usePitch();
  const $hideExpression = createMemo(() => props.hideExpression);

  const $expressionInnerHtml = createMemo(() => {
    if (isServer) return undefined;
    if ($isRootAnkiFields() && $ankiFields.ExpressionFurigana && $initialSide() === "back") {
      return $ankiFields["furigana:ExpressionFurigana"];
    }
    if ($initialSide() === "front" && ($ankiFields.IsSentenceCard || $ankiFields.IsAudioCard)) {
      return "?";
    }
    return $ankiFields.Expression;
  });

  const $pitchFieldDataset = createMemo<DatasetProp>(() => {
    if ($initialSide() === "front") return {};

    function getPitchType() {
      if (isServer) return "{{PitchCategories}}";
      if ($card.ready) return $pitchType() ?? "";
      return "";
    }

    return {
      "data-pitch-type": getPitchType(),
    };
  });

  return (
    <div
      class="expression font-secondary text-center vertical-rl transition-colors"
      classList={{
        "border-b-2 border-dotted border-base-content-soft":
          $initialSide() === "front" && !!$ankiFields.IsClickCard && $isInitialSide(),
        "transition-opacity duration-1000 opacity-0":
          $initialSide() === "front" && $hideExpression() && $isInitialSide(),
        "hide-rt": $initialSide() === "front" && $isInitialSide(),
      }}
      style={{
        color: "var(--pitch-color)",
      }}
      {...$pitchFieldDataset()}
    >
      <Switch>
        <Match when={isServer}>
          <div
            class="contents"
            innerHTML={
              $initialSide() === "front"
                ? `{{#IsSentenceCard}} <span class="horizontal-tb">?</span> {{/IsSentenceCard}} {{#IsAudioCard}} <span class="horizontal-tb">?</span> {{/IsAudioCard}} {{^IsSentenceCard}} {{^IsAudioCard}} {{Expression}} {{/IsAudioCard}} {{/IsSentenceCard}}`
                : "{{#ExpressionFurigana}}{{furigana:ExpressionFurigana}}{{/ExpressionFurigana}}{{^ExpressionFurigana}}{{Expression}}{{/ExpressionFurigana}}"
            }
          ></div>
        </Match>
        <Match when={!$card.ready}>
          <div
            class="contents"
            classList={{ invisible: nested }}
            innerHTML={$expressionInnerHtml()}
          ></div>
        </Match>
        <Match
          when={
            $card.ready &&
            $initialSide() === "front" &&
            $isInitialSide() &&
            ($ankiFields.IsSentenceCard || $ankiFields.IsAudioCard)
          }
        >
          <span class="horizontal-tb">?</span>
        </Match>
        <Match when={$card.ready}>
          <Suspense fallback={<div class="contents" innerHTML={$expressionInnerHtml()}></div>}>
            <Lazy.Expression />
          </Suspense>
        </Match>
      </Switch>
    </div>
  );
}
