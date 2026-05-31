import { createMemo, createSignal, lazy, onMount } from "solid-js";
import { isServer } from "solid-js/web";
import { useCardContext } from "#/src/contexts/CardContext";
import type { DatasetProp } from "#/src/lib/config";
import { useLoadPlugin } from "#/src/hooks/plugin";
import { FieldGroupPaginationSection } from "./FieldGroupPaginationSection";
import { PictureSection } from "./PictureSection";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useConfigContext } from "#/src/contexts/ConfigContext";

// oxfmt-ignore
const Lazy = {
  AudioButtons: lazy(async () => ({ default: (await import("#/src/lazy")).AudioButtons })),
  HeaderMain: lazy(async () => ({ default: (await import("#/src/lazy")).HeaderMain })),
  FieldGroupPagination: lazy(async () => ({ default: (await import("#/src/lazy")).FieldGroupPagination, })),
  UseAnkiDroid: lazy(async () => ({ default: (await import("#/src/lazy")).UseAnkiDroid })),
  Sentence: lazy(async () => ({ default: (await import("#/src/lazy")).Sentence })),
};

export function Front() {
  const { $card, $setCard } = useCardContext();
  const { $ankiFields } = useAnkiFieldContext<"front">();
  const [$clicked, $setClicked] = createSignal(false);
  const [$hideExpression, $setHideExpression] = createSignal(false);
  const { $config } = useConfigContext();
  const loadPlugin = useLoadPlugin();
  const $hidden = createMemo(() => {
    if (isServer) return true;
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
        <div class="flex gap-2 flex-wrap min-h-lh text-2xl"></div>
        <div class="flex flex-col gap-4">
          <div
            class="flex rounded-lg gap-4 flex-col sm:flex-row tappable"
            on:click={() => {
              $setClicked((prev) => !prev);
              $setHideExpression(false);
            }}
            on:touchend={(e) => e.stopPropagation()}
          >
            <div class="flex-1 bg-base-200 p-4 rounded-lg flex flex-col items-center justify-center min-h-40 sm:min-h-56">
              <div
                class="expression font-secondary text-center vertical-rl"
                classList={{
                  "border-b-2 border-dotted border-base-content-soft": !!$ankiFields.IsClickCard,
                  "transition-opacity duration-[1000ms] opacity-0": $hideExpression(),
                }}
                innerHTML={
                  isServer
                    ? undefined
                    : !$ankiFields.IsSentenceCard && !$ankiFields.IsAudioCard
                      ? $ankiFields.Expression
                      : "?"
                }
              >
                {isServer
                  ? `{{#IsSentenceCard}} <span>?</span> {{/IsSentenceCard}} {{#IsAudioCard}} <span>?</span> {{/IsAudioCard}} {{^IsSentenceCard}} {{^IsAudioCard}} {{Expression}} {{/IsAudioCard}} {{/IsSentenceCard}}`
                  : undefined}
              </div>
            </div>

            <PictureSection />
          </div>
          {$card.ready && !$hidden() && <FieldGroupPaginationSection />}
        </div>
      </div>
      <div
        class="flex flex-col gap-4 items-center text-center justify-center"
        classList={{
          "transition-opacity duration-[1000ms] opacity-0": $hideExpression(),
        }}
      >
        {$card.ready && !$hidden() && <Lazy.Sentence />}
      </div>
      {$card.ready && $ankiFields.IsAudioCard && (
        <div class="flex gap-2 justify-center animate-fade-in-sm">
          <Lazy.AudioButtons position={1} />
        </div>
      )}
      <div
        class={`flex gap-2 items-center justify-center text-center border-t-1 hint text-base-content-calm hint-field border-base-content-soft p-2`}
        {...$hintFieldDataset()}
      >
        <div innerHTML={isServer ? undefined : $ankiFields.Hint}>
          {isServer ? "{{Hint}}" : undefined}
        </div>
      </div>
    </>
  );
}
