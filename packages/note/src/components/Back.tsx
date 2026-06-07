import { createMemo, lazy, Match, onMount, Show, Suspense, Switch } from "solid-js";
import { isServer } from "solid-js/web";
import { CardStoreContextProvider, useCardContext } from "#/src/contexts/CardContext";
import type { DatasetProp } from "#/src/lib/config";
import { isNsfw } from "#/src/lib/util";
import { useKanji } from "#/src/hooks/kanji";
import { useLoadPlugin } from "#/src/hooks/plugin";
import { useNavigationTransition, usePictureModalTransition } from "#/src/hooks/transition";
import { FieldGroupPaginationSection } from "./FieldGroupPaginationSection";
import { PictureSection } from "./PictureSection";
import { AnkiFieldContextProvider, useAnkiFieldContext } from "#/src/contexts/AnkiFieldsContext";
import { useCacheContext } from "#/src/contexts/CacheContext";
import { CtxContextProvider } from "#/src/contexts/CtxContext";
import { FieldGroupContextProvider } from "#/src/contexts/FieldGroupContext";
import { usePitch } from "#/src/hooks/pitch";

// oxfmt-ignore
const Lazy = {
  Settings: lazy(async () => ({ default: (await import("#/src/lazy")).Settings })),
  HeaderMain: lazy(async () => ({ default: (await import("#/src/lazy")).HeaderMain })),
  BackFooter: lazy(async () => ({ default: (await import("#/src/lazy")).BackFooter })),
  AudioButtons: lazy(async () => ({ default: (await import("#/src/lazy")).AudioButtons })),
  AudioElements: lazy(async () => ({ default: (await import("#/src/lazy")).AudioElements })),
  PictureModal: lazy(async () => ({ default: (await import("#/src/lazy")).PictureModal })),
  BackBody: lazy(async () => ({ default: (await import("#/src/lazy")).BackBody })),
  Pitches: lazy(async () => ({ default: (await import("#/src/lazy")).Pitches })),
  KanjiPage: lazy(async () => ({ default: (await import("#/src/lazy")).KanjiPage })),
  UseAnkiDroid: lazy(async () => ({ default: (await import("#/src/lazy")).UseAnkiDroid })),
  Expression: lazy(async () => ({ default: (await import("#/src/lazy")).Expression })),
  AnkiMobileDebug: lazy(async () => ({ default: (await import("#/src/lazy")).AnkiMobileDebug })),
  RelatedExpression: lazy(async () => ({ default: (await import("#/src/lazy")).RelatedExpression, })),
  Frequency: lazy(async () => ({ default: (await import("#/src/lazy")).Frequency })),
};

export function Back(props: { onExitNested?: () => void }) {
  const { navigateBack } = useNavigationTransition();
  const { $card, $setCard } = useCardContext();
  const { $ankiFields } = useAnkiFieldContext<"back">();
  const { $setPictureModal } = usePictureModalTransition();
  const cacheStore = useCacheContext();
  const loadPlugin = useLoadPlugin();
  useKanji();
  usePitch();

  onMount(() => {
    setTimeout(() => {
      $setCard("ready", true);
      cacheStore.relax = true;
      loadPlugin();
    }, 0);
  });

  const $pitchFieldDataset = createMemo<DatasetProp>(() => ({
    "data-has-pitch": isServer
      ? "{{#PitchPosition}}true{{/PitchPosition}}"
      : $ankiFields.PitchPosition
        ? "true"
        : "",
  }));

  return (
    <>
      {$card.ready && !$card.nested && <Lazy.UseAnkiDroid />}
      <Switch>
        <Match when={$card.page === "settings" && $card.ready}>
          <Lazy.Settings />
        </Match>
        <Match when={$card.page === "kanji" && $card.ready}>
          <Lazy.KanjiPage />
        </Match>
        <Match when={$card.page === "nested" && $card.ready}>
          <AnkiFieldContextProvider
            initialAnkiFields={$card.nestedAnkiFields}
            noteId={$card.nestedNoteId}
          >
            <CardStoreContextProvider
              nested
              initialSide="back"
              isMergePreview={$card.nestedIsMergePreview}
              initialNsfw={isNsfw($card.nestedAnkiFields.Tags)}
            >
              <FieldGroupContextProvider>
                <CtxContextProvider>
                  <Back onExitNested={navigateBack} />
                </CtxContextProvider>
              </FieldGroupContextProvider>
            </CardStoreContextProvider>
          </AnkiFieldContextProvider>
        </Match>
        <Match when={$card.page === "main"}>
          {$card.ready && <Lazy.HeaderMain onExitNested={props.onExitNested} />}
          <div class="flex flex-col gap-2">
            <div class="flex justify-between gap-2 min-h-lh text-xl sm:text-2xl">
              <Lazy.RelatedExpression />
              <Lazy.Frequency />
            </div>
            <div class="flex flex-col gap-4 relative z-10">
              <div
                class="flex rounded-lg gap-4 flex-col sm:flex-row"
                classList={{ "animate-fade-in": !!cacheStore.relax }}
              >
                <div class="flex-1 bg-base-200 p-4 rounded-lg flex flex-col items-center justify-center min-h-40 sm:min-h-56">
                  <ExpressionSection />
                  <div class={`mt-6 flex gap-4 pitch pitch-field`} {...$pitchFieldDataset()}>
                    {$ankiFields.PitchPosition && $card.ready ? (
                      <Suspense fallback={<span>&nbsp;</span>}>
                        <Lazy.Pitches />
                      </Suspense>
                    ) : isServer ? (
                      "{{#PitchPosition}}<span>&nbsp;</span>{{/PitchPosition}}"
                    ) : (
                      $ankiFields.PitchPosition && <span>&nbsp;</span>
                    )}
                  </div>
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
            {$card.ready && <FieldGroupPaginationSection />}
          </div>
          {$card.ready && (
            <Lazy.BackBody
              onDefinitionPictureClick={(picture) => {
                $setPictureModal(picture);
              }}
            />
          )}
          {$card.ready && (
            <>
              <Lazy.BackFooter />
              <Lazy.AudioButtons position={2} />
            </>
          )}
        </Match>
      </Switch>
      {$card.ready && <Lazy.PictureModal />}
      {$card.ready && <Lazy.AudioElements />}
    </>
  );
}

function ExpressionSection() {
  const { $card } = useCardContext();
  const { $ankiFields, $isRootAnkiFields } = useAnkiFieldContext<"back">();
  const { $pitchType } = usePitch();

  const $expressionInnerHtml = createMemo(() => {
    if (isServer) return undefined;
    if ($isRootAnkiFields() && $ankiFields.ExpressionFurigana) {
      return $ankiFields["furigana:ExpressionFurigana"];
    }
    return $ankiFields.Expression;
  });

  const $pitchFieldDataset = createMemo<DatasetProp>(() => {
    return {
      "data-pitch-type": isServer ? "{{PitchCategories}}" : $card.ready ? ($pitchType() ?? "") : "",
    };
  });

  return (
    <>
      <Show when={!$card.nested}>
        <div
          class="expression font-secondary text-center vertical-rl transition-colors"
          style={{
            color: "var(--pitch-color)",
            display: $card.expressionReady ? "none" : "block",
          }}
          innerHTML={$expressionInnerHtml()}
          {...$pitchFieldDataset()}
        >
          {isServer
            ? "{{#ExpressionFurigana}}{{furigana:ExpressionFurigana}}{{/ExpressionFurigana}}{{^ExpressionFurigana}}{{Expression}}{{/ExpressionFurigana}}"
            : undefined}
        </div>
      </Show>
      <div
        class="expression font-secondary text-center vertical-rl transition-colors"
        style={{
          color: "var(--pitch-color)",
          display: $card.expressionReady || $card.nested ? "block" : "none",
        }}
        {...$pitchFieldDataset()}
      >
        {$card.ready && <Lazy.Expression />}
      </div>
    </>
  );
}
