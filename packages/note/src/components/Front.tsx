import { createMemo, createSignal, lazy, Match, onMount, Show, Switch } from "solid-js";
import { isServer } from "solid-js/web";
import { useCardContext } from "#/src/contexts/CardContext";
import type { DatasetProp } from "#/src/lib/config";
import { useLoadPlugin } from "#/src/hooks/plugin";
import { FieldGroupPaginationSection } from "./FieldGroupPaginationSection";
import { PictureSection } from "./PictureSection";
import { useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useConfigContext } from "#/src/contexts/ConfigContext";
import { useGeneralContext } from "#/src/contexts/GeneralContext";
import { ExpressionSection } from "./ExpressionSection";

// oxfmt-ignore
const Lazy = {
  AudioButtons: lazy(async () => ({ default: (await import("#/src/lazy")).AudioButtons })),
  AudioElements: lazy(async () => ({ default: (await import("#/src/lazy")).AudioElements })),
  HeaderMain: lazy(async () => ({ default: (await import("#/src/lazy")).HeaderMain })),
  FieldGroupPagination: lazy(async () => ({ default: (await import("#/src/lazy")).FieldGroupPagination, })),
  UseAnkiDroid: lazy(async () => ({ default: (await import("#/src/lazy")).UseAnkiDroid })),
  Sentence: lazy(async () => ({ default: (await import("#/src/lazy")).Sentence })),
  RelatedExpression: lazy(async () => ({ default: (await import("#/src/lazy")).RelatedExpression, })),
  Expression: lazy(async () => ({ default: (await import("#/src/lazy")).Expression })),
  Settings: lazy(async () => ({ default: (await import("#/src/lazy")).Settings })),
};

export function Front() {
  const { $card, $setCard, $isInitialSide } = useCardContext();
  const { $ankiFields, $isInitialAnkiFields } = useAnkiFieldContext();
  const [$clicked, $setClicked] = createSignal(false);
  const [$hideExpression, $setHideExpression] = createSignal(false);
  const { $config } = useConfigContext();
  const { logger } = useGeneralContext();
  const loadPlugin = useLoadPlugin();
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
      logger.info("[Front] ready, expression:", $ankiFields.Expression);
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
      <Switch>
        <Match when={$card.page === "settings" && $card.ready}>
          <Lazy.Settings />
        </Match>
        <Match when={$card.page === "main"}>
          {$card.ready && <Lazy.HeaderMain />}
          <div class="flex flex-col">
            <div class="flex justify-between gap-2 items-start mb-0.5 sm:mb-2">
              <div
                class="text-xl sm:text-2xl min-h-lh hover:h-auto overflow-hidden transition-[height] [interpolate-size:allow-keywords] w-full"
                classList={{
                  "h-lh": $isInitialAnkiFields(),
                  "h-auto": !$isInitialAnkiFields(),
                }}
              >
                {$card.ready && <Lazy.RelatedExpression />}
              </div>
            </div>
            <div
              class="flex rounded-lg gap-2 sm:gap-4 flex-col sm:flex-row tappable relative z-10"
              on:click={() => {
                if (!$isInitialSide()) return;
                $setClicked((prev) => !prev);
                $setHideExpression(false);
              }}
              on:touchend={(e) => e.stopPropagation()}
            >
              <div class="flex-1 bg-base-200 p-4 rounded-lg flex flex-col items-center justify-center min-h-38 sm:min-h-56">
                <ExpressionSection hideExpression={$hideExpression()} />
                <Show when={!$isInitialSide()}>
                  <div class="hidden sm:block sm:h-8 sm:mt-2">
                    {$card.ready && (
                      <div class="animate-fade-in-sm flex gap-2">
                        <Lazy.AudioButtons position={1} />
                      </div>
                    )}
                  </div>
                </Show>
              </div>
              <PictureSection />
            </div>
            {$card.ready && !$hidden() && <FieldGroupPaginationSection />}
          </div>
          <div
            class="flex flex-col gap-4 items-center text-center justify-center"
            classList={{
              "transition-opacity duration-[1000ms] opacity-0":
                $hideExpression() && $isInitialSide(),
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
              class={`gap-2 items-center justify-center text-center border-t-1 hint text-base-content-calm hint-field border-base-content-soft p-2`}
              {...$hintFieldDataset()}
            >
              <div innerHTML={isServer ? undefined : $ankiFields.Hint}>
                {isServer ? "{{Hint}}" : undefined}
              </div>
            </div>
          )}
          {$card.ready && (
            <Show when={!$isInitialSide()}>
              <Lazy.AudioButtons position={2} />
            </Show>
          )}
        </Match>
      </Switch>
      {$card.ready && <Lazy.AudioElements />}
    </>
  );
}
