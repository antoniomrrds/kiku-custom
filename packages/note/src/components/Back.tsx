import {
  createMemo,
  createSignal,
  lazy,
  Match,
  onMount,
  Show,
  Suspense,
  Switch,
} from "solid-js";
import { isServer } from "solid-js/web";
import {
  CardStoreContextProvider,
  useCardContext,
} from "#/components/shared/CardContext";
import type { DatasetProp } from "#/util/config";
import { isNsfw } from "#/util/general";
import {
  useKanji,
  useLoadPlugin,
  useNavigationTransition,
  usePitch,
} from "#/util/hooks";
import { FieldGroupPaginationSection } from "./FieldGroupPaginationSection";
import { PictureSection } from "./PictureSection";
import {
  AnkiFieldContextProvider,
  useAnkiFieldContext,
} from "./shared/AnkiFieldsContext";
import { useCacheContext } from "./shared/CacheContext";
import { CtxContextProvider } from "./shared/CtxContext";
import { FieldGroupContextProvider } from "./shared/FieldGroupContext";

// biome-ignore format: this looks nicer
const Lazy = {
  Settings: lazy(async () => ({ default: (await import("./_kiku_lazy")).Settings, })),
  HeaderMain: lazy(async () => ({ default: (await import("./_kiku_lazy")).HeaderMain, })),
  BackFooter: lazy(async () => ({ default: (await import("./_kiku_lazy")).BackFooter, })),
  AudioButtons: lazy(async () => ({ default: (await import("./_kiku_lazy")).AudioButtons, })),
  PictureModal: lazy(async () => ({ default: (await import("./_kiku_lazy")).PictureModal, })),
  BackBody: lazy(async () => ({ default: (await import("./_kiku_lazy")).BackBody, })),
  Pitches: lazy(async () => ({ default: (await import("./_kiku_lazy")).Pitches, })),
  KanjiPage: lazy(async () => ({ default: (await import("./_kiku_lazy")).KanjiPage, })),
  UseAnkiDroid: lazy(async () => ({ default: (await import("./_kiku_lazy")).UseAnkiDroid, })),
  Expression: lazy(async () => ({ default: (await import("./_kiku_lazy")).Expression, })),
  AnkiMobileDebug: lazy(async () => ({ default: (await import("./_kiku_lazy")).AnkiMobileDebug, })),
  RelatedExpression: lazy(async () => ({ default: (await import("./_kiku_lazy")).RelatedExpression, })),
  Frequency: lazy(async () => ({ default: (await import("./_kiku_lazy")).Frequency, })),
};

export function Back(props: { onExitNested?: () => void }) {
  const { navigateBack } = useNavigationTransition();
  const { $card, $setCard } = useCardContext();
  const { $ankiFields } = useAnkiFieldContext<"back">();
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

  const pitchFieldDataset: () => DatasetProp = () => ({
    "data-has-pitch": isServer
      ? "{{#PitchPosition}}true{{/PitchPosition}}"
      : $ankiFields.PitchPosition
        ? "true"
        : "",
  });

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
              side="back"
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
            <div class="flex justify-between gap-2 min-h-lh text-2xl">
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
                  <div
                    class={`mt-6 flex gap-4 pitch pitch-field`}
                    {...pitchFieldDataset()}
                  >
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
                $setCard("pictureModal", picture);
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
      {$card.ready && (
        <Lazy.PictureModal
          img={$card.pictureModal}
          on:click={() => $setCard("pictureModal", undefined)}
        />
      )}
    </>
  );
}

function ExpressionSection() {
  const { $card } = useCardContext();
  const { $ankiFields } = useAnkiFieldContext<"back">();
  const [$dataPitchType, $setDataPitchType] = createSignal({
    "data-pitch-type": "{{PitchCategories}}",
  });

  const $expressionInnerHtml = createMemo(() => {
    return isServer
      ? undefined
      : $ankiFields.ExpressionFurigana
        ? $ankiFields["furigana:ExpressionFurigana"]
        : $ankiFields.Expression;
  });

  onMount(() => {
    $setDataPitchType({
      "data-pitch-type": $card.pitch.type ?? "",
    });
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
          {...$dataPitchType()}
        >
          {isServer
            ? "{{#ExpressionFurigana}}{{furigana:ExpressionFurigana}}{{/ExpressionFurigana}}{{^ExpressionFurigana}}{{Expression}}{{/ExpressionFurigana}}"
            : undefined}
        </div>
      </Show>
      <div
        class="expression font-secondary text-center vertical-rl transition-colors"
        {...$dataPitchType()}
        style={{
          color: "var(--pitch-color)",
          display: $card.expressionReady || $card.nested ? "block" : "none",
        }}
      >
        {$card.ready && <Lazy.Expression />}
      </div>
    </>
  );
}
