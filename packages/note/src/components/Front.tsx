import { createEffect, createMemo, createSignal, lazy, Match, onMount, Switch } from "solid-js";
import { isServer } from "solid-js/web";
import { useCardContext } from "#/src/contexts/CardContext";
import type { DatasetProp } from "#/src/lib/config";
import { useLoadPlugin } from "#/src/hooks/plugin";
import { useKanji } from "#/src/hooks/kanji";
import { FieldGroupPaginationSection } from "./FieldGroupPaginationSection";
import { PictureSection } from "./PictureSection";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useConfigContext } from "#/src/contexts/ConfigContext";
import { usePitch } from "#/src/hooks/pitch";

// oxfmt-ignore
const Lazy = {
  AudioButtons: lazy(async () => ({ default: (await import("#/src/lazy")).AudioButtons })),
  HeaderMain: lazy(async () => ({ default: (await import("#/src/lazy")).HeaderMain })),
  FieldGroupPagination: lazy(async () => ({ default: (await import("#/src/lazy")).FieldGroupPagination, })),
  UseAnkiDroid: lazy(async () => ({ default: (await import("#/src/lazy")).UseAnkiDroid })),
  Sentence: lazy(async () => ({ default: (await import("#/src/lazy")).Sentence })),
  RelatedExpression: lazy(async () => ({ default: (await import("#/src/lazy")).RelatedExpression, })),
  Expression: lazy(async () => ({ default: (await import("#/src/lazy")).Expression })),
};

export function Front() {
  const { $card, $setCard, $isInitialSide } = useCardContext();
  const { $ankiFields } = useAnkiFieldContext<"front">();
  const [$clicked, $setClicked] = createSignal(false);
  const [$hideExpression, $setHideExpression] = createSignal(false);
  const { $config } = useConfigContext();
  const loadPlugin = useLoadPlugin();
  useKanji();
  const $hidden = createMemo(() => {
    if (isServer) return true;
    if (!$isInitialSide()) return false;
    if (
      $ankiFields.IsSentenceCard ||
      $ankiFields.IsWordAndSentenceCard ||
      $ankiFields.IsAudioCard
    ) {
      return false;
    }
    if ($ankiFields.IsClickCard && $clicked()) {
      return false;
    }
    return true;
  });

  onMount(() => {
    setTimeout(() => {
      $setCard("ready", true);
      loadPlugin();
    }, 0);

    if ($config.modHidden) {
      setTimeout(() => {
        $setHideExpression(true);
      }, $config.modHiddenDuration);
    }
  });

  const $hintFieldDataset = createMemo<DatasetProp>(() => ({
    "data-has-hint": isServer ? "{{#Hint}}true{{/Hint}}" : $ankiFields.Hint ? "true" : "",
  }));

  return (
    <>
      {$card.ready && !$card.nested && <Lazy.UseAnkiDroid />}
      {$card.ready && <Lazy.HeaderMain />}
      <div class="flex flex-col gap-2">
        <div class="flex justify-between gap-2 min-h-lh text-xl sm:text-2xl">
          <Lazy.RelatedExpression />
        </div>
        <div class="flex flex-col gap-4 relative z-10">
          <div
            class="flex rounded-lg gap-4 flex-col sm:flex-row tappable"
            on:click={() => {
              if (!$isInitialSide()) return;
              $setClicked((prev) => !prev);
              $setHideExpression(false);
            }}
            on:touchend={(e) => e.stopPropagation()}
          >
            <div class="flex-1 bg-base-200 p-4 rounded-lg flex flex-col items-center justify-center min-h-40 sm:min-h-56">
              <ExpressionSection hideExpression={$hideExpression()} />
              <div class="hidden sm:block sm:h-8 sm:mt-2">
                {$card.ready && (
                  <div class="animate-fade-in-sm flex gap-2">
                    <Lazy.AudioButtons position={1} />
                  </div>
                )}
              </div>
            </div>
            <PictureSection />
          </div>
        </div>
        {$card.ready && !$hidden() && <FieldGroupPaginationSection />}
      </div>
      <div
        class="flex flex-col gap-4 items-center text-center justify-center"
        classList={{
          "transition-opacity duration-[1000ms] opacity-0": $hideExpression() && !$isInitialSide(),
        }}
      >
        {$card.ready && !$hidden() && <Lazy.Sentence />}
      </div>
      {$card.ready && $ankiFields.IsAudioCard && $isInitialSide() && (
        <div class="flex gap-2 justify-center animate-fade-in-sm">
          <Lazy.AudioButtons position={1} />
        </div>
      )}
      {$isInitialSide() && (
        <div
          class={`flex gap-2 items-center justify-center text-center border-t-1 hint text-base-content-calm hint-field border-base-content-soft p-2`}
          {...$hintFieldDataset()}
        >
          <div innerHTML={isServer ? undefined : $ankiFields.Hint}>
            {isServer ? "{{Hint}}" : undefined}
          </div>
        </div>
      )}
      {$card.ready && <Lazy.AudioButtons position={2} />}
    </>
  );
}

function ExpressionSection(props: { hideExpression: boolean }) {
  const { $card, $isInitialSide } = useCardContext();
  const { $ankiFields } = useAnkiFieldContext();
  const { $pitchType } = usePitch();
  const $hideExpression = createMemo(() => props.hideExpression);

  const $expressionInnerHtml = createMemo(() => {
    if (isServer) return undefined;
    if (!$ankiFields.IsSentenceCard || !$ankiFields.IsAudioCard) {
      return $ankiFields.Expression;
    }
    return "?";
  });

  const $pitchFieldDataset = createMemo<DatasetProp>(() => {
    if (!$isInitialSide()) return {};
    return {
      "data-pitch-type": isServer ? "{{PitchCategories}}" : $card.ready ? ($pitchType() ?? "") : "",
    };
  });

  return (
    <Switch>
      <Match when={$isInitialSide()}>
        <div
          class="expression font-secondary text-center vertical-rl transition-colors"
          classList={{
            "border-b-2 border-dotted border-base-content-soft":
              !!$ankiFields.IsClickCard && !$isInitialSide(),
            "transition-opacity duration-[1000ms] opacity-0":
              $hideExpression() && !$isInitialSide(),
          }}
          innerHTML={$expressionInnerHtml()}
        >
          {isServer
            ? `{{#IsSentenceCard}} <span>?</span> {{/IsSentenceCard}} {{#IsAudioCard}} <span>?</span> {{/IsAudioCard}} {{^IsSentenceCard}} {{^IsAudioCard}} {{Expression}} {{/IsAudioCard}} {{/IsSentenceCard}}`
            : undefined}
        </div>
      </Match>
      <Match when={!$isInitialSide()}>
        <div
          class="expression font-secondary text-center vertical-rl transition-colors"
          style={{
            color: "var(--pitch-color)",
          }}
          {...$pitchFieldDataset()}
        >
          {$card.ready && <Lazy.Expression />}
        </div>
      </Match>
    </Switch>
  );
}
